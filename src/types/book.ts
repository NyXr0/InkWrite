export type BookFormat = 'epub' | 'pdf' | 'txt' | 'md';

export interface EpubChapter {
  id: string;
  title: string;
  href: string;
  contentHtml: string;
  wordCount?: number;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  fileName: string;
  fileSize: number; // bytes
  dateAdded: string; // ISO string
  lastRead: string;  // ISO string
  coverImage?: string; // base64 or blob URL
  description?: string;
  
  // Progress & Navigation
  progressPercent: number; // 0 to 100
  currentChapterIndex: number;
  totalChapters: number;
  currentScrollTop?: number;

  // Stored Content
  epubChapters?: EpubChapter[];
  pdfBlob?: Blob;
  pdfDataUrl?: string;
  rawText?: string;
}

export interface BookMetadataInput {
  title?: string;
  author?: string;
  format: BookFormat;
  fileName: string;
  fileSize: number;
}
