import { CustomFont } from '../types/appearance';

const DB_NAME = 'inkwell_custom_fonts_db';
const DB_VERSION = 1;
const STORE_NAME = 'fonts';

export class CustomFontStorage {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Determine CSS @font-face format based on file extension
   */
  private static getFontFormat(fileName: string): 'truetype' | 'opentype' | 'woff' | 'woff2' {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    if (ext === 'otf') return 'opentype';
    if (ext === 'woff') return 'woff';
    if (ext === 'woff2') return 'woff2';
    return 'truetype';
  }

  /**
   * Inject or update dynamic @font-face style tag and FontFace API entry in document
   */
  private static registerFontInDOM(font: CustomFont): Promise<void> {
    return new Promise((resolve) => {
      // 1. Inject @font-face stylesheet
      const styleId = `inkwell-font-${font.id}`;
      let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = `
        @font-face {
          font-family: '${font.name}';
          src: url('${font.dataUrl}') format('${font.format}');
          font-display: swap;
        }
      `;

      // 2. Also register via document.fonts API if available
      if (typeof document !== 'undefined' && 'fonts' in document && typeof FontFace !== 'undefined') {
        try {
          const fontFace = new FontFace(font.name, `url(${font.dataUrl})`);
          fontFace.load().then((loaded) => {
            document.fonts.add(loaded);
            resolve();
          }).catch((err) => {
            console.warn(`FontFace API load note for ${font.name}:`, err);
            resolve(); // fallback styleTag is already active
          });
          return;
        } catch (e) {
          console.warn('FontFace creation note:', e);
        }
      }

      resolve();
    });
  }

  /**
   * Install a new font from a local file (.ttf, .otf, .woff, .woff2)
   */
  static async installFont(file: File, userDefinedName?: string): Promise<CustomFont> {
    const format = this.getFontFormat(file.name);
    
    // Derive a clean, readable default font family name from filename
    let cleanName = userDefinedName?.trim();
    if (!cleanName) {
      cleanName = file.name
        .replace(/\.[^/.]+$/, '') // remove extension
        .replace(/[-_]+/g, ' ')   // replace dashes/underscores with spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()) // capitalize words
        .trim();
    }

    // Convert file to Data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const fontItem: CustomFont = {
      id: `font-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      fileName: file.name,
      format,
      dataUrl,
      fileSize: file.size,
      createdAt: Date.now(),
    };

    // Save to IndexedDB
    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fontItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Register immediately in DOM
    await this.registerFontInDOM(fontItem);

    return fontItem;
  }

  /**
   * Retrieve all installed custom fonts from IndexedDB
   */
  static async loadAllFonts(): Promise<CustomFont[]> {
    try {
      const db = await this.getDB();
      return await new Promise<CustomFont[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not load custom fonts from IndexedDB:', e);
      return [];
    }
  }

  /**
   * Delete an installed custom font by ID
   */
  static async deleteFont(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Remove style tag if present
      const styleTag = document.getElementById(`inkwell-font-${id}`);
      if (styleTag && styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    } catch (e) {
      console.error('Failed to delete custom font:', e);
    }
  }

  /**
   * Apply all installed fonts to the DOM upon app startup
   */
  static async applyAllFontsToDOM(): Promise<CustomFont[]> {
    const fonts = await this.loadAllFonts();
    for (const font of fonts) {
      await this.registerFontInDOM(font);
    }
    return fonts;
  }
}
