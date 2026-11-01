import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LibraryBook, EpubChapter, BookFormat } from '../../types/book';
import { BookLibraryStorage } from '../../core/bookLibraryStorage';
import { ProjectData, ThemeMode } from '../../types/project';
import { AppearanceSettings, CustomFont, PROSE_FONTS } from '../../types/appearance';
import { CustomFontStorage } from '../../core/customFontStorage';
import { PdfReaderView } from '../reading/PdfReaderView';
import { 
  Library as LibraryIcon,
  BookOpen, 
  Plus, 
  Trash2, 
  FileText, 
  Upload, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  List, 
  Sliders, 
  X, 
  Maximize2, 
  Minimize2, 
  Sun, 
  Moon, 
  Coffee, 
  AlignLeft, 
  AlignJustify, 
  Clock, 
  Check, 
  AlertCircle,
  FileCode,
  BookMarked,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface BookLibraryViewProps {
  project?: ProjectData;
  appearance: AppearanceSettings;
  onUpdateAppearance: (settings: AppearanceSettings) => void;
  onBackToWriter?: () => void;
  writerProjectTitle?: string;
}

export const BookLibraryView: React.FC<BookLibraryViewProps> = ({
  project,
  appearance,
  onUpdateAppearance,
  onBackToWriter,
  writerProjectTitle,
}) => {
  // Bookshelf state
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'epub' | 'pdf' | 'txt'>('all');
  
  // Import states
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Hidden file inputs for separate formats
  const epubInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const anyInputRef = useRef<HTMLInputElement>(null);

  // Reader state (when reading an EPUB / TXT book)
  const [epubChapterIndex, setEpubChapterIndex] = useState<number>(0);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  // Reader typography preferences
  const [fontSize, setFontSize] = useState<number>(appearance.fontSize || 19);
  const [lineHeight, setLineHeight] = useState<number>(appearance.lineHeight || 1.95);
  const [maxWidth, setMaxWidth] = useState<number>(Math.max(680, appearance.editorMaxWidth || 760));
  const [textAlign, setTextAlign] = useState<'left' | 'justify'>('left');
  const [dropCaps, setDropCaps] = useState<boolean>(true);

  const readerContainerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [pageLayoutMode, setPageLayoutMode] = useState<'single' | 'dual' | 'scroll'>('dual');
  const [currentSpread, setCurrentSpread] = useState<number>(1);
  const [totalSpreads, setTotalSpreads] = useState<number>(1);

  // Load books from IndexedDB
  const loadBooks = async () => {
    try {
      setLoading(true);
      const list = await BookLibraryStorage.getAllBooks();
      setBooks(list);
    } catch (err: any) {
      console.error('Failed to load books from library', err);
      setError('Could not load library from storage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
    CustomFontStorage.loadAllFonts().then(setCustomFonts).catch(() => {});
  }, []);

  // Handle single file upload
  const handleFileUpload = async (files: FileList | null, expectedFormat?: BookFormat) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.toLowerCase().split('.').pop() || '';

    if (!['epub', 'pdf', 'txt', 'md'].includes(ext)) {
      setError(`Unsupported format ".${ext}". Please upload an EPUB, PDF, TXT, or Markdown book.`);
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      setImportStatus(
        ext === 'epub' 
          ? 'Unpacking EPUB chapters, stylesheet & illustrations...' 
          : ext === 'pdf' 
          ? 'Preparing PDF document...' 
          : 'Processing text book...'
      );

      const newBook = await BookLibraryStorage.importFile(file);
      await loadBooks();
      setImportStatus('Book successfully added to library!');
      setTimeout(() => {
        setIsImporting(false);
        setImportStatus('');
        // Automatically open the newly imported book
        openBook(newBook);
      }, 400);
    } catch (err: any) {
      console.error('Error importing book:', err);
      setError(err?.message || 'Failed to import book. Please check the file.');
      setIsImporting(false);
      setImportStatus('');
    }
  };

  const handleDeleteBook = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this book from your library?')) return;

    try {
      await BookLibraryStorage.deleteBook(bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      if (selectedBook?.id === bookId) {
        setSelectedBook(null);
      }
    } catch (err: any) {
      console.error('Failed to delete book', err);
      setError('Failed to delete book');
    }
  };

  const openBook = (book: LibraryBook) => {
    setSelectedBook(book);
    setEpubChapterIndex(book.currentChapterIndex || 0);
    setScrollProgress(book.progressPercent || 0);
    readerContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };

  const closeBook = () => {
    setSelectedBook(null);
    setIsTocOpen(false);
    setIsSettingsOpen(false);
    loadBooks(); // refresh progress
  };

  // Active EPUB chapter
  const activeEpubChapter = useMemo<EpubChapter | null>(() => {
    if (!selectedBook || !selectedBook.epubChapters || selectedBook.epubChapters.length === 0) return null;
    return selectedBook.epubChapters[epubChapterIndex] || selectedBook.epubChapters[0];
  }, [selectedBook, epubChapterIndex]);

  const goToEpubChapter = (index: number) => {
    if (!selectedBook || !selectedBook.epubChapters) return;
    const clamped = Math.max(0, Math.min(index, selectedBook.epubChapters.length - 1));
    setEpubChapterIndex(clamped);
    readerContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    const percent = Math.round(((clamped + 1) / selectedBook.epubChapters.length) * 100);
    BookLibraryStorage.updateProgress(selectedBook.id, clamped, percent).catch(() => {});
  };

  // Track scroll position in reader
  useEffect(() => {
    const el = readerContainerRef.current;
    if (!el || !selectedBook) return;

    const handleScroll = () => {
      const totalScroll = el.scrollHeight - el.clientHeight;
      if (totalScroll > 0) {
        const current = (el.scrollTop / totalScroll) * 100;
        setScrollProgress(Math.min(100, Math.max(0, current)));
        if (selectedBook.epubChapters && selectedBook.epubChapters.length > 0) {
          const basePct = (epubChapterIndex / selectedBook.epubChapters.length) * 100;
          const insidePct = current / selectedBook.epubChapters.length;
          const totalPct = Math.min(100, Math.round(basePct + insidePct));
          BookLibraryStorage.updateProgress(selectedBook.id, epubChapterIndex, totalPct, el.scrollTop).catch(() => {});
        }
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [selectedBook, epubChapterIndex]);

  // Fullscreen helper
  const scrollToSpread = (spreadNum: number, smooth = true) => {
    const el = pageContainerRef.current;
    if (!el) return;
    const gap = pageLayoutMode === 'dual' ? 56 : 0;
    const clamped = Math.min(totalSpreads, Math.max(1, spreadNum));
    setCurrentSpread(clamped);
    const targetX = (clamped - 1) * (el.clientWidth + gap);
    el.scrollTo({ left: targetX, behavior: smooth ? 'smooth' : 'auto' });
  };

  const goToNextPage = () => {
    if (pageLayoutMode === 'scroll') {
      readerContainerRef.current?.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
      return;
    }

    if (currentSpread < totalSpreads) {
      scrollToSpread(currentSpread + 1);
    } else {
      if (selectedBook && selectedBook.epubChapters && epubChapterIndex < selectedBook.epubChapters.length - 1) {
        goToEpubChapter(epubChapterIndex + 1);
        setCurrentSpread(1);
      }
    }
  };

  const goToPrevPage = () => {
    if (pageLayoutMode === 'scroll') {
      readerContainerRef.current?.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
      return;
    }

    if (currentSpread > 1) {
      scrollToSpread(currentSpread - 1);
    } else {
      if (selectedBook && selectedBook.epubChapters && epubChapterIndex > 0) {
        goToEpubChapter(epubChapterIndex - 1);
        setCurrentSpread(1);
      }
    }
  };

  // Recalculate spreads on resize, layout switch, font changes
  useEffect(() => {
    const el = pageContainerRef.current;
    if (!el || pageLayoutMode === 'scroll') return;

    const gap = pageLayoutMode === 'dual' ? 56 : 0;
    const recalculate = () => {
      if (!el || el.clientWidth <= 0) return;
      const spreads = Math.max(1, Math.round((el.scrollWidth + gap) / (el.clientWidth + gap)));
      setTotalSpreads(spreads);
      setCurrentSpread((prev) => Math.min(spreads, Math.max(1, prev)));
    };

    recalculate();
    const timer = setTimeout(recalculate, 80);

    const observer = new ResizeObserver(() => {
      recalculate();
    });
    observer.observe(el);

    window.addEventListener('resize', recalculate);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', recalculate);
    };
  }, [pageLayoutMode, fontSize, lineHeight, maxWidth, epubChapterIndex, selectedBook, isContinuousMode]);

  // Reset spread position on chapter change
  useEffect(() => {
    if (pageLayoutMode !== 'scroll') {
      setCurrentSpread(1);
      if (pageContainerRef.current) {
        pageContainerRef.current.scrollLeft = 0;
      }
    }
  }, [epubChapterIndex, selectedBook, pageLayoutMode]);

  // Keyboard navigation for reader (Arrow keys, Esc, Space, PageUp/Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedBook) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeBook();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        goToPrevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    pageLayoutMode,
    currentSpread,
    totalSpreads,
    selectedBook,
    epubChapterIndex,
  ]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatBadge = (format: BookFormat) => {
    switch (format) {
      case 'epub':
        return { label: 'EPUB', bg: '#3b82f620', color: '#3b82f6', border: '#3b82f640' };
      case 'pdf':
        return { label: 'PDF', bg: '#ef444420', color: '#ef4444', border: '#ef444440' };
      case 'md':
        return { label: 'MD', bg: '#f59e0b20', color: '#f59e0b', border: '#f59e0b40' };
      default:
        return { label: 'TXT', bg: '#10b98120', color: '#10b981', border: '#10b98140' };
    }
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch = 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFormat = 
        formatFilter === 'all' ? true :
        formatFilter === 'epub' ? b.format === 'epub' :
        formatFilter === 'pdf' ? b.format === 'pdf' :
        (b.format === 'txt' || b.format === 'md');

      return matchesSearch && matchesFormat;
    });
  }, [books, searchQuery, formatFilter]);

  // =========================================================================
  // SUB-VIEW 1: ACTIVE PDF READER VIEW
  // =========================================================================
  if (selectedBook && selectedBook.format === 'pdf') {
    return (
      <PdfReaderView
        book={selectedBook}
        onBackToLibrary={closeBook}
        onExitReading={closeBook}
      />
    );
  }

  // =========================================================================
  // SUB-VIEW 2: ACTIVE EPUB / TEXT READER VIEW
  // =========================================================================
  if (selectedBook && selectedBook.epubChapters) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--bg-editor)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          userSelect: 'text',
        }}
      >
        {/* Top Reading Progress Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: 'var(--border-subtle)',
          zIndex: 100,
        }}>
          <div style={{
            height: '100%',
            width: `${scrollProgress}%`,
            backgroundColor: 'var(--accent-primary)',
            transition: 'width 0.1s ease',
          }} />
        </div>

        {/* Reader Top Navigation Bar */}
        <header
          style={{
            height: '48px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            backgroundColor: 'var(--bg-app)',
            flexShrink: 0,
            userSelect: 'none',
            zIndex: 20,
          }}
        >
          {/* Left: Back to Bookshelf & Contents */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={closeBook}
              title="Return to Bookshelf Gallery"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Library</span>
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              title="Table of Contents (Chapters)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: isTocOpen ? 'var(--bg-active)' : 'transparent',
                color: isTocOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <List size={16} />
              <span>Chapters ({selectedBook.epubChapters.length})</span>
            </button>
          </div>

          {/* Center: Book & Chapter Metadata */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
            maxWidth: '460px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '2px 5px',
              borderRadius: '3px',
              backgroundColor: selectedBook.format === 'epub' ? '#3b82f620' : '#10b98120',
              color: selectedBook.format === 'epub' ? '#3b82f6' : '#10b981',
              border: `1px solid ${selectedBook.format === 'epub' ? '#3b82f640' : '#10b98140'}`,
              flexShrink: 0,
            }}>
              {selectedBook.format.toUpperCase()}
            </span>
            <span style={{ fontFamily: 'var(--font-serif)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedBook.title}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isContinuousMode ? 'Whole Book' : (activeEpubChapter?.title || `Chapter ${epubChapterIndex + 1}`)}
            </span>
          </div>

          {/* Right: Mode Toggle, Settings, Fullscreen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Mode Selector: 1-Page | 2-Page | Scroll */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '7px',
              padding: '2px',
              gap: '2px',
            }}>
              <button
                onClick={() => setPageLayoutMode('single')}
                title="Single Page Mode (flip pages with Left/Right Arrow keys)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: pageLayoutMode === 'single' ? 600 : 400,
                  backgroundColor: pageLayoutMode === 'single' ? 'var(--accent-pill)' : 'transparent',
                  color: pageLayoutMode === 'single' ? 'var(--accent-pill-text)' : 'var(--text-secondary)',
                  border: pageLayoutMode === 'single' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <FileText size={12} />
                <span>1-Page</span>
              </button>

              <button
                onClick={() => setPageLayoutMode('dual')}
                title="Dual Page Spread Mode (Book 2 Pages side-by-side, flip with Arrow keys)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: pageLayoutMode === 'dual' ? 600 : 400,
                  backgroundColor: pageLayoutMode === 'dual' ? 'var(--accent-pill)' : 'transparent',
                  color: pageLayoutMode === 'dual' ? 'var(--accent-pill-text)' : 'var(--text-secondary)',
                  border: pageLayoutMode === 'dual' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <BookOpen size={12} />
                <span>2-Page</span>
              </button>

              <button
                onClick={() => setPageLayoutMode('scroll')}
                title="Continuous Scroll Mode (vertical scrolling)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: pageLayoutMode === 'scroll' ? 600 : 400,
                  backgroundColor: pageLayoutMode === 'scroll' ? 'var(--accent-pill)' : 'transparent',
                  color: pageLayoutMode === 'scroll' ? 'var(--accent-pill-text)' : 'var(--text-secondary)',
                  border: pageLayoutMode === 'scroll' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <List size={12} />
                <span>Scroll</span>
              </button>
            </div>

            <button
              onClick={() => setIsContinuousMode(!isContinuousMode)}
              title={isContinuousMode ? 'Switch to single-chapter reading' : 'Read entire book continuously'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: isContinuousMode ? 'var(--accent-pill)' : 'transparent',
                color: isContinuousMode ? 'var(--accent-pill-text)' : 'var(--text-secondary)',
                border: isContinuousMode ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <BookOpen size={14} />
              <span>{isContinuousMode ? 'Whole Book' : 'Single Chapter'}</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Reading Preferences (Fonts, Size, Themes, Margins)"
              style={{
                padding: '6px',
                borderRadius: '6px',
                backgroundColor: isSettingsOpen ? 'var(--bg-active)' : 'transparent',
                color: isSettingsOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Sliders size={16} />
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              style={{
                padding: '6px',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </header>

        {/* Reader Body Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Chapter Table of Contents Drawer */}
          {isTocOpen && (
            <aside style={{
              width: '290px',
              height: '100%',
              backgroundColor: 'var(--bg-sidebar)',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              zIndex: 30,
              userSelect: 'none',
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Table of Contents
                </span>
                <button onClick={() => setIsTocOpen(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ padding: '8px' }}>
                {selectedBook.epubChapters.map((ch, idx) => {
                  const isSelected = idx === epubChapterIndex;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        goToEpubChapter(idx);
                        if (isContinuousMode) {
                          const el = document.getElementById(`library-chapter-${ch.id}`);
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        textAlign: 'left',
                        marginBottom: '2px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {idx + 1}.
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ch.title}
                        </span>
                      </div>
                      {ch.wordCount ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {ch.wordCount}w
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          {/* Reading Preferences Drawer / Popover */}
          {isSettingsOpen && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '24px',
              width: '320px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px',
              zIndex: 40,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              userSelect: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Reading Preferences</span>
                <button onClick={() => setIsSettingsOpen(false)} style={{ color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Page Layout Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Page Layout Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'single', name: '1-Page', icon: <FileText size={12} /> },
                    { id: 'dual', name: '2-Page Book', icon: <BookOpen size={12} /> },
                    { id: 'scroll', name: 'Scroll', icon: <List size={12} /> },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPageLayoutMode(m.id as any)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: pageLayoutMode === m.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: pageLayoutMode === m.id ? 'var(--accent-pill)' : 'transparent',
                        color: pageLayoutMode === m.id ? 'var(--accent-pill-text)' : 'inherit',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {m.icon}
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Reader Background
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'paper', name: 'Paper', icon: <Sun size={12} />, bg: '#faf9f5', fg: '#1f1e1d' },
                    { id: 'sepia', name: 'Sepia', icon: <Coffee size={12} />, bg: '#f2ebd9', fg: '#382c1e' },
                    { id: 'night', name: 'Night', icon: <Moon size={12} />, bg: '#18191d', fg: '#e6e5e0' },
                    { id: 'oled', name: 'OLED', icon: <Moon size={12} />, bg: '#000000', fg: '#ffffff' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateAppearance({ ...appearance, theme: t.id as ThemeMode })}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: appearance.theme === t.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: t.bg,
                        color: t.fg,
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      {t.icon}
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Book Typeface
                </label>
                <select
                  value={appearance.proseFont}
                  onChange={(e) => onUpdateAppearance({ ...appearance, proseFont: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                >
                  <optgroup label="Classic Typefaces">
                    {PROSE_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </optgroup>
                  {customFonts.length > 0 && (
                    <optgroup label="Installed Local Fonts">
                      {customFonts.map((f) => (
                        <option key={f.id} value={f.name}>{f.name} ({f.format.toUpperCase()})</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Font Size & Line Spacing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Font Size ({fontSize}px)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => setFontSize(Math.max(14, fontSize - 1))}
                      style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontSize(Math.min(32, fontSize + 1))}
                      style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '14px', fontWeight: 600 }}
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Line Height ({lineHeight})
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[1.6, 1.9, 2.2].map((lh) => (
                      <button
                        key={lh}
                        onClick={() => setLineHeight(lh)}
                        style={{
                          flex: 1,
                          padding: '4px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          border: lineHeight === lh ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          backgroundColor: lineHeight === lh ? 'var(--accent-pill)' : 'transparent',
                          color: lineHeight === lh ? 'var(--accent-pill-text)' : 'inherit',
                        }}
                      >
                        {lh}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Width & Alignment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Column Width
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[640, 760, 920].map((w, idx) => (
                      <button
                        key={w}
                        onClick={() => setMaxWidth(w)}
                        style={{
                          flex: 1,
                          padding: '4px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          border: maxWidth === w ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          backgroundColor: maxWidth === w ? 'var(--accent-pill)' : 'transparent',
                          color: maxWidth === w ? 'var(--accent-pill-text)' : 'inherit',
                        }}
                      >
                        {idx === 0 ? 'Page' : idx === 1 ? 'Norm' : 'Wide'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Alignment
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => setTextAlign('left')}
                      style={{
                        flex: 1,
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'center',
                        border: textAlign === 'left' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: textAlign === 'left' ? 'var(--accent-pill)' : 'transparent',
                      }}
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button
                      onClick={() => setTextAlign('justify')}
                      style={{
                        flex: 1,
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'center',
                        border: textAlign === 'justify' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: textAlign === 'justify' ? 'var(--accent-pill)' : 'transparent',
                      }}
                    >
                      <AlignJustify size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reading Surface: Paginated Spread or Continuous Scroll */}
          {pageLayoutMode === 'scroll' ? (
            <main
              ref={readerContainerRef}
              style={{
                flex: 1,
                height: '100%',
                overflowY: 'auto',
                padding: '48px 32px 140px 32px',
                position: 'relative',
              }}
            >
              <div style={{
                maxWidth: `${maxWidth}px`,
                margin: '0 auto',
                fontFamily: appearance.proseFont.includes(' ') && !appearance.proseFont.startsWith("'")
                  ? `'${appearance.proseFont}', serif`
                  : appearance.proseFont,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                color: 'var(--text-primary)',
                textAlign,
              }}>
                {/* Single Chapter Mode */}
              {!isContinuousMode && activeEpubChapter && (
                <article key={activeEpubChapter.id} style={{ position: 'relative' }}>
                  <header style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--accent-primary)',
                      marginBottom: '8px',
                    }}>
                      {selectedBook.title} • {selectedBook.author}
                    </div>

                    <h1 style={{
                      fontSize: '34px',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      lineHeight: '1.25',
                      marginBottom: '12px',
                    }}>
                      {activeEpubChapter.title}
                    </h1>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-sans)',
                    }}>
                      <span>Chapter {epubChapterIndex + 1} of {selectedBook.epubChapters.length}</span>
                      {activeEpubChapter.wordCount ? (
                        <>
                          <span>•</span>
                          <span>{activeEpubChapter.wordCount.toLocaleString()} words</span>
                        </>
                      ) : null}
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        ~{Math.max(1, Math.ceil((activeEpubChapter.wordCount || 500) / 220))} min read
                      </span>
                    </div>

                    <div style={{
                      fontSize: '18px',
                      color: 'var(--accent-primary)',
                      margin: '24px 0',
                      letterSpacing: '0.3em',
                      opacity: 0.8,
                    }}>
                      ❧ ❧ ❧
                    </div>
                  </header>

                  {/* Chapter Content HTML */}
                  <div
                    className="reading-chapter-html"
                    dangerouslySetInnerHTML={{ __html: activeEpubChapter.contentHtml }}
                    style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                  />

                  {/* Chapter Bottom Navigation */}
                  <footer style={{
                    marginTop: '64px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                  }}>
                    {epubChapterIndex > 0 ? (
                      <button
                        onClick={() => goToEpubChapter(epubChapterIndex - 1)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <ArrowLeft size={14} />
                        <span>{selectedBook.epubChapters[epubChapterIndex - 1].title}</span>
                      </button>
                    ) : <div />}

                    <button
                      onClick={closeBook}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <LibraryIcon size={14} />
                      <span>Back to Library</span>
                    </button>

                    {epubChapterIndex < selectedBook.epubChapters.length - 1 ? (
                      <button
                        onClick={() => goToEpubChapter(epubChapterIndex + 1)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{selectedBook.epubChapters[epubChapterIndex + 1].title}</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : <div />}
                  </footer>
                </article>
              )}

              {/* Continuous Whole Book Mode */}
              {isContinuousMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
                  <div style={{ textAlign: 'center', paddingBottom: '32px', borderBottom: '2px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                      {selectedBook.format.toUpperCase()} E-Reader
                    </div>
                    <h1 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                      {selectedBook.title}
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                      By {selectedBook.author} • {selectedBook.epubChapters.length} chapters
                    </p>
                  </div>

                  {selectedBook.epubChapters.map((ch, idx) => (
                    <article key={ch.id} id={`library-chapter-${ch.id}`} style={{ position: 'relative' }}>
                      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                          Chapter {idx + 1}
                        </span>
                        <h2 style={{ fontSize: '28px', fontWeight: 600, margin: '6px 0 12px 0' }}>
                          {ch.title}
                        </h2>
                        <div style={{
                          fontSize: '15px',
                          color: 'var(--accent-primary)',
                          letterSpacing: '0.25em',
                          opacity: 0.8,
                        }}>
                          ✦ ✦ ✦
                        </div>
                      </div>

                      <div
                        className="reading-chapter-html"
                        dangerouslySetInnerHTML={{ __html: ch.contentHtml }}
                        style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                      />
                    </article>
                  ))}
                </div>
              )}
              </div>
            </main>
          ) : (
            <div style={{
              flex: 1,
              height: '100%',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 28px',
              overflow: 'hidden',
              userSelect: 'text',
            }}>
              {/* Floating Prev Page Button */}
              <button
                onClick={goToPrevPage}
                disabled={currentSpread <= 1 && epubChapterIndex <= 0}
                title="Previous Page (Left Arrow ← or PageUp)"
                style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: (currentSpread <= 1 && epubChapterIndex <= 0) ? 'not-allowed' : 'pointer',
                  opacity: (currentSpread <= 1 && epubChapterIndex <= 0) ? 0.35 : 0.85,
                  zIndex: 25,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentSpread > 1 || epubChapterIndex > 0) {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = (currentSpread <= 1 && epubChapterIndex <= 0) ? '0.35' : '0.85';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <ChevronLeft size={24} />
              </button>

              {/* Floating Next Page Button */}
              <button
                onClick={goToNextPage}
                disabled={currentSpread >= totalSpreads && epubChapterIndex >= (selectedBook.epubChapters?.length || 1) - 1}
                title="Next Page (Right Arrow → or PageDown, Space)"
                style={{
                  position: 'absolute',
                  right: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: (currentSpread >= totalSpreads && epubChapterIndex >= (selectedBook.epubChapters?.length || 1) - 1) ? 'not-allowed' : 'pointer',
                  opacity: (currentSpread >= totalSpreads && epubChapterIndex >= (selectedBook.epubChapters?.length || 1) - 1) ? 0.35 : 0.85,
                  zIndex: 25,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentSpread < totalSpreads || epubChapterIndex < (selectedBook.epubChapters?.length || 1) - 1) {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = (currentSpread >= totalSpreads && epubChapterIndex >= (selectedBook.epubChapters?.length || 1) - 1) ? '0.35' : '0.85';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <ChevronRight size={24} />
              </button>

              {/* Book Spread Card */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: pageLayoutMode === 'dual' ? '1240px' : '760px',
                height: 'calc(100vh - 110px)',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg), 0 0 0 1px var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                {/* Center Spine Divider in Dual Page Mode */}
                {pageLayoutMode === 'dual' && (
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: '38px',
                    width: '1px',
                    background: 'linear-gradient(to bottom, transparent, var(--border-strong) 4%, var(--border-strong) 96%, transparent)',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.06)',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }} />
                )}

                {/* Multi-Column Paginated Content Container */}
                <div
                  ref={pageContainerRef}
                  className="paginated-reader-column"
                  onScroll={() => {
                    const el = pageContainerRef.current;
                    if (!el) return;
                    const gap = pageLayoutMode === 'dual' ? 56 : 0;
                    const idx = Math.round(el.scrollLeft / (el.clientWidth + gap));
                    const cur = Math.min(totalSpreads, Math.max(1, idx + 1));
                    if (cur !== currentSpread) setCurrentSpread(cur);
                  }}
                  style={{
                    flex: 1,
                    width: '100%',
                    height: 'calc(100% - 38px)',
                    columnCount: pageLayoutMode === 'dual' ? 2 : 1,
                    columnGap: pageLayoutMode === 'dual' ? '56px' : '0px',
                    columnFill: 'auto',
                    padding: pageLayoutMode === 'dual' ? '32px 48px 18px 48px' : '36px 52px 18px 52px',
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    scrollBehavior: 'smooth',
                    fontFamily: appearance.proseFont.includes(' ') && !appearance.proseFont.startsWith("'")
                      ? `'${appearance.proseFont}', serif`
                      : appearance.proseFont,
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    color: 'var(--text-primary)',
                    textAlign,
                  }}
                >
                  {/* Single Chapter Mode */}
              {!isContinuousMode && activeEpubChapter && (
                <article key={activeEpubChapter.id} style={{ position: 'relative' }}>
                  <header style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--accent-primary)',
                      marginBottom: '8px',
                    }}>
                      {selectedBook.title} • {selectedBook.author}
                    </div>

                    <h1 style={{
                      fontSize: '34px',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      lineHeight: '1.25',
                      marginBottom: '12px',
                    }}>
                      {activeEpubChapter.title}
                    </h1>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-sans)',
                    }}>
                      <span>Chapter {epubChapterIndex + 1} of {selectedBook.epubChapters.length}</span>
                      {activeEpubChapter.wordCount ? (
                        <>
                          <span>•</span>
                          <span>{activeEpubChapter.wordCount.toLocaleString()} words</span>
                        </>
                      ) : null}
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        ~{Math.max(1, Math.ceil((activeEpubChapter.wordCount || 500) / 220))} min read
                      </span>
                    </div>

                    <div style={{
                      fontSize: '18px',
                      color: 'var(--accent-primary)',
                      margin: '24px 0',
                      letterSpacing: '0.3em',
                      opacity: 0.8,
                    }}>
                      ❧ ❧ ❧
                    </div>
                  </header>

                  {/* Chapter Content HTML */}
                  <div
                    className="reading-chapter-html"
                    dangerouslySetInnerHTML={{ __html: activeEpubChapter.contentHtml }}
                    style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                  />

                  {/* Chapter Bottom Navigation */}
                  <footer style={{
                    marginTop: '64px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                  }}>
                    {epubChapterIndex > 0 ? (
                      <button
                        onClick={() => goToEpubChapter(epubChapterIndex - 1)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <ArrowLeft size={14} />
                        <span>{selectedBook.epubChapters[epubChapterIndex - 1].title}</span>
                      </button>
                    ) : <div />}

                    <button
                      onClick={closeBook}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <LibraryIcon size={14} />
                      <span>Back to Library</span>
                    </button>

                    {epubChapterIndex < selectedBook.epubChapters.length - 1 ? (
                      <button
                        onClick={() => goToEpubChapter(epubChapterIndex + 1)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{selectedBook.epubChapters[epubChapterIndex + 1].title}</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : <div />}
                  </footer>
                </article>
              )}

              {/* Continuous Whole Book Mode */}
              {isContinuousMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
                  <div style={{ textAlign: 'center', paddingBottom: '32px', borderBottom: '2px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                      {selectedBook.format.toUpperCase()} E-Reader
                    </div>
                    <h1 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                      {selectedBook.title}
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                      By {selectedBook.author} • {selectedBook.epubChapters.length} chapters
                    </p>
                  </div>

                  {selectedBook.epubChapters.map((ch, idx) => (
                    <article key={ch.id} id={`library-chapter-${ch.id}`} style={{ position: 'relative' }}>
                      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                          Chapter {idx + 1}
                        </span>
                        <h2 style={{ fontSize: '28px', fontWeight: 600, margin: '6px 0 12px 0' }}>
                          {ch.title}
                        </h2>
                        <div style={{
                          fontSize: '15px',
                          color: 'var(--accent-primary)',
                          letterSpacing: '0.25em',
                          opacity: 0.8,
                        }}>
                          ✦ ✦ ✦
                        </div>
                      </div>

                      <div
                        className="reading-chapter-html"
                        dangerouslySetInnerHTML={{ __html: ch.contentHtml }}
                        style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
                      />
                    </article>
                  ))}
                </div>
              )}
                </div>

                {/* Book Spread Footer */}
                <footer style={{
                  height: '38px',
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  padding: '0 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  userSelect: 'none',
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {pageLayoutMode === 'dual' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Page {(currentSpread - 1) * 2 + 1}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {activeEpubChapter?.title || selectedBook.title}
                        </span>
                        <span>•</span>
                        <span>Spread {currentSpread} of {totalSpreads}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Page {Math.min((currentSpread - 1) * 2 + 2, totalSpreads * 2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {activeEpubChapter?.title || selectedBook.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>Page {currentSpread} of {totalSpreads}</span>
                        <span>•</span>
                        <span>{Math.round((currentSpread / totalSpreads) * 100)}%</span>
                      </div>
                    </>
                  )}
                </footer>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN VIEW: THE DEDICATED BOOKSHELF & E-LIBRARY TAB
  // =========================================================================
  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Hidden File Inputs for Separate Format Buttons */}
      <input
        ref={epubInputRef}
        type="file"
        accept=".epub"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e.target.files, 'epub')}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e.target.files, 'pdf')}
      />
      <input
        ref={textInputRef}
        type="file"
        accept=".txt,.md"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e.target.files, 'txt')}
      />
      <input
        ref={anyInputRef}
        type="file"
        accept=".epub,.pdf,.txt,.md"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Top Header of the Library Tab */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          padding: '16px 28px',
          backgroundColor: 'var(--bg-editor)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBackToWriter && (
            <button
              onClick={onBackToWriter}
              title="Return to Writer Mode"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-active)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-active)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              <ArrowLeft size={14} />
              <span>{writerProjectTitle ? `Back to "${writerProjectTitle}"` : 'Writer Mode'}</span>
            </button>
          )}

          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-pill)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LibraryIcon size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              eBook Library & Reader
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Import pre-existing books to read directly in InxWrite: EPUB, PDF, and Plain Text
            </p>
          </div>
        </div>

        {/* Separate Format Import Buttons (Requested Feature) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* 1. EPUB Separate Button */}
          <button
            onClick={() => epubInputRef.current?.click()}
            disabled={isImporting}
            title="Import an EPUB eBook"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#3b82f618',
              color: '#2563eb',
              border: '1px solid #3b82f640',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3b82f628')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f618')}
          >
            <BookOpen size={14} />
            <span>+ Import EPUB</span>
          </button>

          {/* 2. PDF Separate Button */}
          <button
            onClick={() => pdfInputRef.current?.click()}
            disabled={isImporting}
            title="Import a PDF Document / Book"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#ef444418',
              color: '#dc2626',
              border: '1px solid #ef444440',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ef444428')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef444418')}
          >
            <FileText size={14} />
            <span>+ Import PDF</span>
          </button>

          {/* 3. Text / MD Separate Button */}
          <button
            onClick={() => textInputRef.current?.click()}
            disabled={isImporting}
            title="Import a TXT or Markdown Book"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#10b98118',
              color: '#059669',
              border: '1px solid #10b98140',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#10b98128')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10b98118')}
          >
            <FileCode size={14} />
            <span>+ Import TXT / MD</span>
          </button>

          {/* 4. All-formats general button */}
          <button
            onClick={() => anyInputRef.current?.click()}
            disabled={isImporting}
            title="Import any book file (.epub, .pdf, .txt, .md)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Plus size={14} />
            <span>Add Book</span>
          </button>
        </div>
      </header>

      {/* Main Bookshelf Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
        }}
      >
        {/* Error Notification */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '8px',
              backgroundColor: '#ef444415',
              color: '#ef4444',
              fontSize: '13px',
              border: '1px solid #ef444430',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} style={{ color: 'inherit', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Importing Status Banner */}
        {isImporting && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px',
              marginBottom: '20px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-pill)',
              color: 'var(--accent-pill-text)',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid var(--accent-primary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                border: '2px solid var(--accent-primary)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {/* Format Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[
              { id: 'all', label: `All Books (${books.length})` },
              { id: 'epub', label: `EPUBs (${books.filter(b => b.format === 'epub').length})` },
              { id: 'pdf', label: `PDFs (${books.filter(b => b.format === 'pdf').length})` },
              { id: 'txt', label: `Text / MD (${books.filter(b => b.format === 'txt' || b.format === 'md').length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormatFilter(f.id as any)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: formatFilter === f.id ? 'var(--accent-pill)' : 'var(--bg-surface)',
                  color: formatFilter === f.id ? 'var(--accent-pill-text)' : 'var(--text-secondary)',
                  border: formatFilter === f.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Drag & Drop Visual Indicator overlay when hovering */}
        {dragOver && (
          <div
            style={{
              padding: '32px',
              borderRadius: '12px',
              border: '2px dashed var(--accent-primary)',
              backgroundColor: 'var(--accent-pill)',
              textAlign: 'center',
              marginBottom: '24px',
              color: 'var(--accent-pill-text)',
            }}
          >
            <Upload size={32} style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>Drop your book file to import into library</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Accepts .epub, .pdf, .txt, .md</div>
          </div>
        )}

        {/* Bookshelf Content */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading your eBook library...
          </div>
        ) : books.length === 0 ? (
          /* Empty State: Welcome Hero with Format Explanations & Quick Buttons */
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '48px 32px',
              textAlign: 'center',
              maxWidth: '820px',
              margin: '20px auto',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'var(--accent-pill)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <LibraryIcon size={28} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Your Personal eBook Library
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 28px auto', lineHeight: '1.6' }}>
              Import already written and published books to read, study, or use as reference alongside your manuscript. Everything is saved locally in your browser.
            </p>

            {/* Supported Format Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px', textAlign: 'left' }}>
              {/* EPUB Card */}
              <div style={{
                padding: '18px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: '#3b82f620', color: '#2563eb', fontWeight: 700, fontSize: '10px' }}>
                      EPUB
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Standard eBooks</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Full e-reader experience with chapters, custom typography, dark mode, and illustrations.
                  </p>
                </div>
                <button
                  onClick={() => epubInputRef.current?.click()}
                  style={{
                    marginTop: '14px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#3b82f615',
                    color: '#2563eb',
                    border: '1px solid #3b82f630',
                    cursor: 'pointer',
                  }}
                >
                  + Import EPUB
                </button>
              </div>

              {/* PDF Card */}
              <div style={{
                padding: '18px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: '#ef444420', color: '#dc2626', fontWeight: 700, fontSize: '10px' }}>
                      PDF
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Documents & Papers</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Crisp PDF viewer with zoom, page navigation, search, and presentation layout.
                  </p>
                </div>
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  style={{
                    marginTop: '14px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#ef444415',
                    color: '#dc2626',
                    border: '1px solid #ef444430',
                    cursor: 'pointer',
                  }}
                >
                  + Import PDF
                </button>
              </div>

              {/* TXT / MD Card */}
              <div style={{
                padding: '18px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: '#10b98120', color: '#059669', fontWeight: 700, fontSize: '10px' }}>
                      TXT / MD
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Plain Text Stories</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Auto-detects chapters, customizable book fonts, line heights, and margins.
                  </p>
                </div>
                <button
                  onClick={() => textInputRef.current?.click()}
                  style={{
                    marginTop: '14px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#10b98115',
                    color: '#059669',
                    border: '1px solid #10b98130',
                    cursor: 'pointer',
                  }}
                >
                  + Import Text / MD
                </button>
              </div>
            </div>

            {/* Quick Drag & Drop Box */}
            <div
              onClick={() => anyInputRef.current?.click()}
              style={{
                border: '1px dashed var(--border-strong)',
                borderRadius: '8px',
                padding: '18px',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-hover)',
              }}
            >
              <Upload size={20} style={{ margin: '0 auto 6px auto', color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Drag and drop any book file here, or click to browse
              </span>
            </div>
          </div>
        ) : (
          /* Populated Bookshelf Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredBooks.map((book) => {
              const badge = getFormatBadge(book.format);

              return (
                <div
                  key={book.id}
                  onClick={() => openBook(book)}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  {/* Book Cover or Styled Format Jacket */}
                  <div
                    style={{
                      width: '64px',
                      height: '92px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-active)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                      flexShrink: 0,
                      border: '1px solid var(--border-subtle)',
                      position: 'relative',
                    }}
                  >
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '6px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: badge.color,
                            textTransform: 'uppercase',
                          }}
                        >
                          {badge.label}
                        </span>
                        <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>
                          <BookOpen size={20} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Book Metadata & Actions */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                        <h3
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-serif)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={book.title}
                        >
                          {book.title}
                        </h3>

                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            flexShrink: 0,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {book.author}
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                        {book.totalChapters > 1 ? `${book.totalChapters} chapters • ` : ''}
                        {formatFileSize(book.fileSize)}
                      </div>
                    </div>

                    {/* Progress Bar & Read Action */}
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>
                          {book.format === 'pdf' 
                            ? 'PDF Document' 
                            : `Chapter ${(book.currentChapterIndex || 0) + 1} of ${book.totalChapters || 1}`}
                        </span>
                        <span style={{ fontWeight: 600 }}>{book.progressPercent || 0}%</span>
                      </div>

                      <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${book.progressPercent || 0}%`,
                            backgroundColor: badge.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delete Book Button */}
                  <button
                    onClick={(e) => handleDeleteBook(e, book.id)}
                    title="Remove book from library"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '4px',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                      opacity: 0.5,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.color = '#ef4444';
                      e.currentTarget.style.backgroundColor = '#ef444415';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.5';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
