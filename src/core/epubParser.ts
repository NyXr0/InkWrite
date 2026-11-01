import JSZip from 'jszip';
import { EpubChapter } from '../types/book';

function resolvePath(baseDir: string, relativePath: string): string {
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('data:')) {
    return relativePath;
  }
  const cleanRelative = relativePath.split('#')[0].split('?')[0];
  const full = (baseDir ? baseDir + '/' : '') + cleanRelative;
  const parts = full.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

function getImageMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop() || '';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'svg') return 'image/svg+xml';
  return 'image/jpeg';
}

export interface ParsedEpub {
  title: string;
  author: string;
  description: string;
  coverImage?: string;
  chapters: EpubChapter[];
}

export async function parseEpubFile(fileData: ArrayBuffer | Blob, fileName: string): Promise<ParsedEpub> {
  const zip = await JSZip.loadAsync(fileData);

  // 1. Locate rootfile from META-INF/container.xml
  const containerEntry = zip.file('META-INF/container.xml');
  if (!containerEntry) {
    throw new Error('Invalid EPUB file: META-INF/container.xml missing');
  }

  const containerXml = await containerEntry.async('text');
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, 'application/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  const rootfilePath = rootfileEl?.getAttribute('full-path') || 'OEBPS/content.opf';

  // 2. Read content.opf
  const opfEntry = zip.file(rootfilePath);
  if (!opfEntry) {
    throw new Error(`Invalid EPUB file: could not find ${rootfilePath}`);
  }

  const opfXml = await opfEntry.async('text');
  const opfDoc = parser.parseFromString(opfXml, 'application/xml');
  const opfDir = rootfilePath.includes('/') ? rootfilePath.slice(0, rootfilePath.lastIndexOf('/')) : '';

  // 3. Extract Metadata
  const title = (
    opfDoc.querySelector('metadata > dc\\:title')?.textContent ||
    opfDoc.querySelector('metadata > title')?.textContent ||
    fileName.replace(/\.epub$/i, '')
  ).trim();

  const author = (
    opfDoc.querySelector('metadata > dc\\:creator')?.textContent ||
    opfDoc.querySelector('metadata > creator')?.textContent ||
    'Unknown Author'
  ).trim();

  const description = (
    opfDoc.querySelector('metadata > dc\\:description')?.textContent ||
    opfDoc.querySelector('metadata > description')?.textContent ||
    ''
  ).trim();

  // 4. Build Manifest Map (id -> { href, mediaType, properties })
  const manifest = new Map<string, { href: string; mediaType: string; properties: string }>();
  const manifestItems = opfDoc.querySelectorAll('manifest > item');
  manifestItems.forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type') || '';
    const properties = item.getAttribute('properties') || '';
    if (id && href) {
      manifest.set(id, {
        href: resolvePath(opfDir, href),
        mediaType,
        properties,
      });
    }
  });

  // 5. Look for Cover Image
  let coverImage: string | undefined;
  // Try manifest properties="cover-image"
  for (const [, item] of manifest) {
    if (item.properties.includes('cover-image') || item.mediaType.startsWith('image/')) {
      if (item.properties.includes('cover-image') || item.href.toLowerCase().includes('cover')) {
        const coverEntry = zip.file(item.href);
        if (coverEntry) {
          const b64 = await coverEntry.async('base64');
          coverImage = `data:${getImageMimeType(item.href)};base64,${b64}`;
          break;
        }
      }
    }
  }

  // 6. Extract Table of Contents (from NCX or EPUB 3 Navigation Document)
  const tocTitlesByHref = new Map<string, string>();

  // Check EPUB 3 Navigation
  let navItem: { href: string; mediaType: string } | undefined;
  for (const [, item] of manifest) {
    if (item.properties.includes('nav')) {
      navItem = item;
      break;
    }
  }

  if (navItem) {
    const navEntry = zip.file(navItem.href);
    if (navEntry) {
      const navHtml = await navEntry.async('text');
      const navDoc = parser.parseFromString(navHtml, 'text/html');
      const navLinks = navDoc.querySelectorAll('nav[epub\\:type="toc"] a, nav a');
      const navDir = navItem.href.includes('/') ? navItem.href.slice(0, navItem.href.lastIndexOf('/')) : '';
      navLinks.forEach((a) => {
        const text = a.textContent?.trim();
        const href = a.getAttribute('href');
        if (text && href) {
          const resolvedHref = resolvePath(navDir, href.split('#')[0]);
          if (!tocTitlesByHref.has(resolvedHref)) {
            tocTitlesByHref.set(resolvedHref, text);
          }
        }
      });
    }
  }

  // Check EPUB 2 NCX
  const ncxItem = manifest.get('ncx') || Array.from(manifest.values()).find(m => m.mediaType.includes('ncx') || m.href.endsWith('.ncx'));
  if (ncxItem && tocTitlesByHref.size === 0) {
    const ncxEntry = zip.file(ncxItem.href);
    if (ncxEntry) {
      const ncxXml = await ncxEntry.async('text');
      const ncxDoc = parser.parseFromString(ncxXml, 'application/xml');
      const ncxDir = ncxItem.href.includes('/') ? ncxItem.href.slice(0, ncxItem.href.lastIndexOf('/')) : '';
      const navPoints = ncxDoc.querySelectorAll('navPoint');
      navPoints.forEach((np) => {
        const label = np.querySelector('navLabel > text')?.textContent?.trim();
        const contentSrc = np.querySelector('content')?.getAttribute('src');
        if (label && contentSrc) {
          const resolved = resolvePath(ncxDir, contentSrc.split('#')[0]);
          if (!tocTitlesByHref.has(resolved)) {
            tocTitlesByHref.set(resolved, label);
          }
        }
      });
    }
  }

  // 7. Parse Chapters in Spine order
  const spineElements = opfDoc.querySelectorAll('spine > itemref');
  const chapters: EpubChapter[] = [];

  for (let i = 0; i < spineElements.length; i++) {
    const idref = spineElements[i].getAttribute('idref');
    if (!idref) continue;

    const manifestItem = manifest.get(idref);
    if (!manifestItem) continue;

    const chapterEntry = zip.file(manifestItem.href);
    if (!chapterEntry) continue;

    const rawChapterHtml = await chapterEntry.async('text');
    const chapterDoc = parser.parseFromString(rawChapterHtml, 'text/html');
    const chapterDir = manifestItem.href.includes('/') ? manifestItem.href.slice(0, manifestItem.href.lastIndexOf('/')) : '';

    // Embed internal images as inline data URLs
    const imgElements = chapterDoc.querySelectorAll('img, image');
    for (const img of Array.from(imgElements)) {
      const srcAttr = img.getAttribute('src') || img.getAttribute('xlink:href');
      if (srcAttr && !srcAttr.startsWith('http') && !srcAttr.startsWith('data:')) {
        const imagePath = resolvePath(chapterDir, srcAttr);
        const imageEntry = zip.file(imagePath);
        if (imageEntry) {
          try {
            const b64 = await imageEntry.async('base64');
            const dataUrl = `data:${getImageMimeType(imagePath)};base64,${b64}`;
            if (img.hasAttribute('src')) {
              img.setAttribute('src', dataUrl);
            }
            if (img.hasAttribute('xlink:href')) {
              img.setAttribute('xlink:href', dataUrl);
            }
          } catch (e) {
            console.warn(`Could not load image ${imagePath} from epub:`, e);
          }
        }
      }
    }

    // Determine Chapter Title
    let chapterTitle = tocTitlesByHref.get(manifestItem.href);
    if (!chapterTitle) {
      // Look for first heading or title
      const heading = chapterDoc.querySelector('h1, h2, h3, title')?.textContent?.trim();
      if (heading && heading.length < 80) {
        chapterTitle = heading;
      } else {
        chapterTitle = `Chapter ${chapters.length + 1}`;
      }
    }

    // Clean body HTML: remove scripts, external link styles
    chapterDoc.querySelectorAll('script, link[rel="stylesheet"]').forEach(el => el.remove());
    const bodyContent = chapterDoc.body?.innerHTML || rawChapterHtml;

    // Approximate word count
    const textOnly = chapterDoc.body?.textContent || '';
    const words = textOnly.trim().split(/\s+/).filter(Boolean).length;

    chapters.push({
      id: `epub-ch-${i}-${idref}`,
      title: chapterTitle,
      href: manifestItem.href,
      contentHtml: bodyContent,
      wordCount: words,
    });
  }

  return {
    title,
    author,
    description,
    coverImage,
    chapters,
  };
}
