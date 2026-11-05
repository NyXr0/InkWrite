import { LoreImage } from '../types/project';

/**
 * Utility functions for handling images in Codex & Lore:
 * - Compressing and converting uploaded user files to compact base64 data URLs
 * - Validating image URLs
 * - Creating unique gallery entries
 */

/**
 * Safely loads and compresses an image file to keep IndexedDB and storage ultra-fast and lightweight.
 * Resizes large photos (e.g. 4000px down to max 1200px) and converts to optimized WebP/JPEG format.
 */
export async function compressAndReadImageFile(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.85
): Promise<string> {
  // If SVG or small icon, preserve as raw data URL without rasterizing
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Load into HTMLImageElement
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate constrained dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Draw onto off-screen canvas
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback to original dataUrl if canvas context is unavailable
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as WebP if supported, otherwise JPEG
      try {
        const compressed = canvas.toDataURL('image/webp', quality);
        if (compressed.startsWith('data:image/webp')) {
          resolve(compressed);
          return;
        }
      } catch (e) {
        // fallback
      }

      const compressedJpeg = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedJpeg);
    };

    img.onerror = () => {
      // If error occurs during decoding, fallback to raw dataUrl
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Validates whether a string is a plausible image link or data URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('blob:')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generates a unique LoreImage item for the gallery
 */
export function createLoreImageItem(url: string, caption?: string): LoreImage {
  return {
    id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    url: url.trim(),
    caption: caption?.trim() || '',
    dateAdded: new Date().toISOString(),
  };
}
