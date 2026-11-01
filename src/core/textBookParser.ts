import { EpubChapter } from '../types/book';

export interface ParsedTextBook {
  title: string;
  author: string;
  chapters: EpubChapter[];
}

export function parseTextBook(rawContent: string, fileName: string): ParsedTextBook {
  const cleanFileName = fileName.replace(/\.(txt|md)$/i, '');
  let title = cleanFileName;
  let author = 'Unknown Author';

  // Check if first few lines contain Title / Author metadata (e.g. "Title: ...\nAuthor: ...")
  const lines = rawContent.split('\n');
  let contentStartIndex = 0;

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    const titleMatch = line.match(/^Title:\s*(.+)$/i);
    const authorMatch = line.match(/^Author:\s*(.+)$/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      contentStartIndex = Math.max(contentStartIndex, i + 1);
    }
    if (authorMatch) {
      author = authorMatch[1].trim();
      contentStartIndex = Math.max(contentStartIndex, i + 1);
    }
  }

  const bodyText = lines.slice(contentStartIndex).join('\n').trim();

  // Try to split into chapters by common heading patterns
  // Pattern matches:
  // - Markdown headings: # Chapter ..., ## Chapter ...
  // - "Chapter 1", "Chapter One", "CHAPTER I"
  // - "Part 1", "Book 1", "Act I"
  const chapterRegex = /(?:\n\s*(?:#{1,3}\s+|(?=[A-Z0-9]))(?:Chapter|Part|Book|Act|Section)\s+[A-Za-z0-9IVXLCDMivxlcdm]+(?:[:\.\-\s]+[^\n]*)?)/g;

  const matches: { title: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = chapterRegex.exec(bodyText)) !== null) {
    const matchTitle = match[0].trim().replace(/^#{1,3}\s*/, '');
    matches.push({
      title: matchTitle,
      index: match.index,
    });
  }

  const chapters: EpubChapter[] = [];

  if (matches.length > 1) {
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const nextIndex = i < matches.length - 1 ? matches[i + 1].index : bodyText.length;
      const chapterText = bodyText.slice(current.index, nextIndex).trim();

      // Convert paragraphs to HTML
      const paragraphs = chapterText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const html = paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('\n');
      const words = chapterText.split(/\s+/).filter(Boolean).length;

      chapters.push({
        id: `txt-ch-${i}`,
        title: current.title,
        href: `chapter-${i}.html`,
        contentHtml: html,
        wordCount: words,
      });
    }
  } else {
    // Single continuous chapter or split by 3000-word chunks if huge
    const words = bodyText.split(/\s+/).filter(Boolean).length;
    const paragraphs = bodyText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const html = paragraphs.map(p => `<p>${escapeHtml(p.trim())}</p>`).join('\n');

    chapters.push({
      id: 'txt-ch-0',
      title: title,
      href: 'chapter-0.html',
      contentHtml: html,
      wordCount: words,
    });
  }

  return {
    title,
    author,
    chapters,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
