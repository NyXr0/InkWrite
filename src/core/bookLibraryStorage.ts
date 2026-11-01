import { LibraryBook, BookFormat } from '../types/book';
import { parseEpubFile } from './epubParser';
import { parseTextBook } from './textBookParser';

const DB_NAME = 'inxwrite_books_library_db';
const LEGACY_DB_NAME = 'inkwell_books_library_db';
const DB_VERSION = 1;
const STORE_NAME = 'books';

export class BookLibraryStorage {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in this browser environment'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('dateAdded', 'dateAdded', { unique: false });
          store.createIndex('lastRead', 'lastRead', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Get all books in user's library
   */
  public static async getAllBooks(): Promise<LibraryBook[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const books = (request.result as LibraryBook[]) || [];
        if (books.length === 0 && typeof indexedDB !== 'undefined') {
          BookLibraryStorage.migrateLegacyBooks(db).then((migrated) => {
            if (migrated && migrated.length > 0) {
              migrated.sort((a, b) => new Date(b.lastRead || b.dateAdded).getTime() - new Date(a.lastRead || a.dateAdded).getTime());
              resolve(migrated);
            } else {
              resolve(books);
            }
          }).catch(() => resolve(books));
          return;
        }
        // Sort most recently read or added first
        books.sort((a, b) => new Date(b.lastRead || b.dateAdded).getTime() - new Date(a.lastRead || a.dateAdded).getTime());
        resolve(books);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a specific book by ID
   */
  public static async getBook(id: string): Promise<LibraryBook | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save or update a book in the library
   */
  public static async saveBook(book: LibraryBook): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(book);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update reading progress for a book
   */
  public static async updateProgress(
    bookId: string,
    chapterIndex: number,
    progressPercent: number,
    scrollTop?: number
  ): Promise<void> {
    const book = await this.getBook(bookId);
    if (!book) return;

    book.currentChapterIndex = chapterIndex;
    book.progressPercent = Math.min(100, Math.max(0, Math.round(progressPercent)));
    if (typeof scrollTop === 'number') {
      book.currentScrollTop = scrollTop;
    }
    book.lastRead = new Date().toISOString();

    await this.saveBook(book);
  }

  /**
   * Delete a book from the library
   */
  public static async deleteBook(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Import a local file (.epub, .pdf, .txt, .md) into the Library
   */
  public static async importFile(file: File): Promise<LibraryBook> {
    const extension = file.name.toLowerCase().split('.').pop() || '';
    let format: BookFormat = 'txt';
    if (extension === 'epub') format = 'epub';
    else if (extension === 'pdf') format = 'pdf';
    else if (extension === 'md') format = 'md';
    else if (extension === 'txt') format = 'txt';
    else {
      throw new Error(`Unsupported format .${extension}. Please select an EPUB, PDF, TXT, or MD file.`);
    }

    const id = `book-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    if (format === 'epub') {
      const arrayBuffer = await file.arrayBuffer();
      const parsed = await parseEpubFile(arrayBuffer, file.name);

      const book: LibraryBook = {
        id,
        title: parsed.title || file.name.replace(/\.epub$/i, ''),
        author: parsed.author || 'Unknown Author',
        description: parsed.description,
        format: 'epub',
        fileName: file.name,
        fileSize: file.size,
        dateAdded: now,
        lastRead: now,
        coverImage: parsed.coverImage,
        progressPercent: 0,
        currentChapterIndex: 0,
        totalChapters: parsed.chapters.length,
        epubChapters: parsed.chapters,
      };

      await this.saveBook(book);
      return book;
    } else if (format === 'pdf') {
      // Store PDF blob and create persistent base64 data URL or blob
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
      // Convert to base64 for persistent IndexedDB storage
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const book: LibraryBook = {
        id,
        title: file.name.replace(/\.pdf$/i, ''),
        author: 'PDF Document',
        format: 'pdf',
        fileName: file.name,
        fileSize: file.size,
        dateAdded: now,
        lastRead: now,
        progressPercent: 0,
        currentChapterIndex: 0,
        totalChapters: 1,
        pdfDataUrl: dataUrl,
      };

      await this.saveBook(book);
      return book;
    } else {
      // TXT or Markdown
      const rawText = await file.text();
      const parsed = parseTextBook(rawText, file.name);

      const book: LibraryBook = {
        id,
        title: parsed.title || file.name,
        author: parsed.author || 'Unknown Author',
        format: format,
        fileName: file.name,
        fileSize: file.size,
        dateAdded: now,
        lastRead: now,
        progressPercent: 0,
        currentChapterIndex: 0,
        totalChapters: parsed.chapters.length,
        epubChapters: parsed.chapters,
        rawText,
      };

      await this.saveBook(book);
      return book;
    }
  }

  private static async migrateLegacyBooks(currentDb: IDBDatabase): Promise<LibraryBook[]> {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(LEGACY_DB_NAME);
        req.onerror = () => resolve([]);
        req.onsuccess = () => {
          const legacyDb = req.result;
          if (!legacyDb.objectStoreNames.contains(STORE_NAME)) {
            legacyDb.close();
            return resolve([]);
          }
          const tx = legacyDb.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const getReq = store.getAll();
          getReq.onerror = () => resolve([]);
          getReq.onsuccess = () => {
            const oldBooks = (getReq.result as LibraryBook[]) || [];
            if (oldBooks.length > 0) {
              try {
                const writeTx = currentDb.transaction(STORE_NAME, 'readwrite');
                const writeStore = writeTx.objectStore(STORE_NAME);
                for (const b of oldBooks) {
                  writeStore.put(b);
                }
              } catch (err) {
                console.warn('Error saving migrated books', err);
              }
            }
            legacyDb.close();
            resolve(oldBooks);
          };
        };
      } catch (e) {
        resolve([]);
      }
    });
  }
}
