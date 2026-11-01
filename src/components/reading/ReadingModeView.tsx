import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProjectData, SceneItem, FolderItem, ThemeMode, ReviewComment } from '../../types/project';
import { AppearanceSettings, CustomFont, PROSE_FONTS } from '../../types/appearance';
import { CustomFontStorage } from '../../core/customFontStorage';
import { ProjectStorage } from '../../core/storage';
import { LibraryBook, EpubChapter } from '../../types/book';
import { BookLibraryStorage } from '../../core/bookLibraryStorage';
import { BookLibraryModal } from './BookLibraryModal';
import { PdfReaderView } from './PdfReaderView';
import { 
  ArrowLeft, 
  ArrowRight, 
  Edit3, 
  BookOpen, 
  List, 
  Sliders, 
  X, 
  Check, 
  Maximize2, 
  Minimize2, 
  Sun, 
  Moon, 
  Coffee, 
  AlignLeft, 
  AlignJustify, 
  Bookmark, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Library as LibraryIcon
} from 'lucide-react';

interface ReadingModeViewProps {
  project: ProjectData;
  initialSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onEditScene: (sceneId: string) => void;
  onExit: () => void;
  appearance: AppearanceSettings;
  onUpdateAppearance: (settings: AppearanceSettings) => void;
  onAddComment?: (sceneId: string, comment: string) => void;
}

export const ReadingModeView: React.FC<ReadingModeViewProps> = ({
  project,
  initialSceneId,
  onSelectScene,
  onEditScene,
  onExit,
  appearance,
  onUpdateAppearance,
  onAddComment,
}) => {
  // Navigation & mode
  const [activeSceneId, setActiveSceneId] = useState<string>(initialSceneId);
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(false);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageLayoutMode, setPageLayoutMode] = useState<'single' | 'dual' | 'scroll'>('dual');
  const [currentSpread, setCurrentSpread] = useState<number>(1);
  const [totalSpreads, setTotalSpreads] = useState<number>(1);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Reading preferences (customizable per session, defaults to appearance)
  const [fontSize, setFontSize] = useState<number>(appearance.fontSize || 19);
  const [lineHeight, setLineHeight] = useState<number>(appearance.lineHeight || 1.95);
  const [maxWidth, setMaxWidth] = useState<number>(Math.max(680, appearance.editorMaxWidth || 740));
  const [textAlign, setTextAlign] = useState<'left' | 'justify'>('left');
  const [dropCaps, setDropCaps] = useState<boolean>(true);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  // Note dialog
  const [noteDialogOpen, setNoteDialogOpen] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Flattened scene list in reading order
  const allScenes = useMemo(() => {
    return ProjectStorage.getAllScenes(project.manuscript);
  }, [project.manuscript]);

  // Pre-existing book library state (null = reading active project manuscript)
  const [activeBook, setActiveBook] = useState<LibraryBook | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [epubChapterIndex, setEpubChapterIndex] = useState<number>(0);

  const activeEpubChapter = useMemo<EpubChapter | null>(() => {
    if (!activeBook || !activeBook.epubChapters || activeBook.epubChapters.length === 0) return null;
    return activeBook.epubChapters[epubChapterIndex] || activeBook.epubChapters[0];
  }, [activeBook, epubChapterIndex]);

  const handleSelectBook = (book: LibraryBook) => {
    setActiveBook(book);
    setEpubChapterIndex(book.currentChapterIndex || 0);
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleSelectProjectManuscript = () => {
    setActiveBook(null);
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };

  const goToEpubChapter = (index: number) => {
    if (!activeBook || !activeBook.epubChapters) return;
    const clamped = Math.max(0, Math.min(index, activeBook.epubChapters.length - 1));
    setEpubChapterIndex(clamped);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    const percent = Math.round(((clamped + 1) / activeBook.epubChapters.length) * 100);
    BookLibraryStorage.updateProgress(activeBook.id, clamped, percent).catch(() => {});
  };

  const activeScene = useMemo(() => {
    return allScenes.find((s) => s.id === activeSceneId) || allScenes[0] || null;
  }, [allScenes, activeSceneId]);

  const activeSceneIndex = useMemo(() => {
    return allScenes.findIndex((s) => s.id === activeSceneId);
  }, [allScenes, activeSceneId]);

  // Load installed custom fonts from IndexedDB
  useEffect(() => {
    CustomFontStorage.loadAllFonts().then(setCustomFonts).catch(() => {});
  }, []);

  // Update scroll progress
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const totalScroll = el.scrollHeight - el.clientHeight;
      if (totalScroll > 0) {
        const current = (el.scrollTop / totalScroll) * 100;
        setScrollProgress(Math.min(100, Math.max(0, current)));
        if (activeBook && activeBook.epubChapters && activeBook.epubChapters.length > 0) {
          const basePct = (epubChapterIndex / activeBook.epubChapters.length) * 100;
          const insidePct = current / activeBook.epubChapters.length;
          const totalPct = Math.min(100, Math.round(basePct + insidePct));
          BookLibraryStorage.updateProgress(activeBook.id, epubChapterIndex, totalPct, el.scrollTop).catch(() => {});
        }
      } else {
        setScrollProgress(0);
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [activeSceneId, isContinuousMode, activeBook, epubChapterIndex]);

  // Handle keyboard shortcuts (Arrow keys for page navigation, Esc for exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (noteDialogOpen) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
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
    activeSceneIndex,
    allScenes,
    activeBook,
    epubChapterIndex,
    noteDialogOpen,
    onExit,
  ]);

  // Fullscreen toggle helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Submit reader note/bookmark
  const handleSaveNote = () => {
    if (!noteText.trim() || !activeScene) return;
    if (onAddComment) {
      onAddComment(activeScene.id, noteText.trim());
    } else {
      activeScene.comments.push({
        id: `comment-${Date.now()}`,
        sceneId: activeScene.id,
        anchorText: 'Reader Note',
        comment: noteText.trim(),
        author: 'Reader',
        resolved: false,
        createdAt: new Date().toISOString(),
      });
    }
    setNoteText('');
    setNoteDialogOpen(false);
  };

  // Clean raw scene text into paragraphs
  const renderParagraphs = (content: string, isFirstSceneOfChapter = true) => {
    if (!content.trim()) {
      return <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>This scene has no content drafted yet.</p>;
    }

    // Filter markdown title hashes if present at start
    const cleanContent = content.replace(/^#+\s+.*$/m, '').trim();
    const paras = cleanContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    return paras.map((p, idx) => {
      const isFirstPara = idx === 0 && isFirstSceneOfChapter && dropCaps && p.length > 20;

      if (isFirstPara) {
        const firstLetter = p.charAt(0);
        const rest = p.slice(1);

        return (
          <p
            key={idx}
            style={{
              marginBottom: '1.4em',
              textAlign,
              textIndent: textAlign === 'justify' ? '0' : '0',
            }}
          >
            <span
              style={{
                float: 'left',
                fontSize: '3.6em',
                lineHeight: '0.78',
                paddingTop: '4px',
                paddingRight: '8px',
                paddingBottom: '2px',
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                color: 'var(--accent-primary)',
              }}
            >
              {firstLetter}
            </span>
            {rest}
          </p>
        );
      }

      return (
        <p
          key={idx}
          style={{
            marginBottom: '1.4em',
            textAlign,
            textIndent: textAlign === 'justify' ? '1.5em' : '0',
          }}
        >
          {p}
        </p>
      );
    });
  };

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
      containerRef.current?.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
      return;
    }

    if (currentSpread < totalSpreads) {
      scrollToSpread(currentSpread + 1);
    } else {
      // Advance to next chapter / scene
      if (activeBook && activeBook.epubChapters) {
        if (epubChapterIndex < activeBook.epubChapters.length - 1) {
          goToEpubChapter(epubChapterIndex + 1);
          setCurrentSpread(1);
        }
      } else if (activeSceneIndex < allScenes.length - 1) {
        const next = allScenes[activeSceneIndex + 1];
        setActiveSceneId(next.id);
        onSelectScene(next.id);
        setCurrentSpread(1);
      }
    }
  };

  const goToPrevPage = () => {
    if (pageLayoutMode === 'scroll') {
      containerRef.current?.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
      return;
    }

    if (currentSpread > 1) {
      scrollToSpread(currentSpread - 1);
    } else {
      // Retreat to previous chapter / scene
      if (activeBook && activeBook.epubChapters) {
        if (epubChapterIndex > 0) {
          goToEpubChapter(epubChapterIndex - 1);
          setCurrentSpread(1);
        }
      } else if (activeSceneIndex > 0) {
        const prev = allScenes[activeSceneIndex - 1];
        setActiveSceneId(prev.id);
        onSelectScene(prev.id);
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
  }, [pageLayoutMode, fontSize, lineHeight, maxWidth, activeSceneId, epubChapterIndex, activeBook, isContinuousMode]);

  // Reset spread position on chapter/scene change
  useEffect(() => {
    if (pageLayoutMode !== 'scroll') {
      setCurrentSpread(1);
      if (pageContainerRef.current) {
        pageContainerRef.current.scrollLeft = 0;
      }
    }
  }, [activeSceneId, epubChapterIndex, pageLayoutMode]);

  const readingTimeMinutes = Math.max(1, Math.ceil((activeScene?.wordCount || 0) / 220));

  // If reading a PDF book, render dedicated PDF Reader
  if (activeBook && activeBook.format === 'pdf') {
    return (
      <>
        <PdfReaderView
          book={activeBook}
          onBackToLibrary={() => setIsLibraryOpen(true)}
          onExitReading={onExit}
        />
        <BookLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          project={project}
          activeBookId={activeBook?.id || null}
          onSelectProjectManuscript={handleSelectProjectManuscript}
          onSelectBook={handleSelectBook}
        />
      </>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-editor)',
        color: 'var(--text-primary)',
        zIndex: 9990,
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

      {/* Reader Navigation Header */}
      <header style={{
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
      }}>
        {/* Left: Back, Table of Contents & Bookshelf */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onExit}
            title="Exit Reading Mode (Esc)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            title="Table of Contents (Chapters & Scenes)"
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
            <span>Contents</span>
          </button>

          <button
            onClick={() => setIsLibraryOpen(true)}
            title="Open Bookshelf & Library (Switch to another book or import EPUB/PDF/TXT)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 11px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: activeBook ? 'var(--accent-pill)' : 'var(--bg-surface)',
              color: activeBook ? 'var(--accent-primary)' : 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            <LibraryIcon size={15} />
            <span>Bookshelf</span>
          </button>
        </div>

        {/* Center: Novel Title & Current Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          maxWidth: '460px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {activeBook ? (
            <>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 5px',
                borderRadius: '3px',
                backgroundColor: activeBook.format === 'epub' ? '#3b82f620' : '#10b98120',
                color: activeBook.format === 'epub' ? '#3b82f6' : '#10b981',
                border: `1px solid ${activeBook.format === 'epub' ? '#3b82f640' : '#10b98140'}`,
                flexShrink: 0,
              }}>
                {activeBook.format.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'var(--font-serif)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeBook.title}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isContinuousMode ? 'Whole Book' : (activeEpubChapter?.title || 'Chapter 1')}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontFamily: 'var(--font-serif)' }}>{project.settings.title}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                {isContinuousMode ? 'Continuous Reading' : activeScene?.title}
              </span>
            </>
          )}
        </div>

        {/* Right: Controls, Reading Settings, Mode Toggle, Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Page Layout Mode Selector: 1-Page | 2-Page | Scroll */}
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
              title="Single Page Mode (flip with Left/Right Arrow keys)"
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

          {/* Continuous Novel Mode Toggle */}
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
            <span>{isContinuousMode ? (activeBook ? 'Whole Book' : 'Whole Novel') : (activeBook ? 'Single Chapter' : 'Single Scene')}</span>
          </button>

          {/* Quick Reader Note */}
          <button
            onClick={() => setNoteDialogOpen(true)}
            title="Leave a reader note or bookmark"
            style={{
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Bookmark size={16} />
          </button>

          {/* Reading Typography & Settings */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title="Reading Settings (Fonts, Size, Theme, Layout)"
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: isSettingsOpen ? 'var(--bg-active)' : 'transparent',
              color: isSettingsOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isSettingsOpen) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isSettingsOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Sliders size={16} />
          </button>

          {/* Edit in Writer or Switch button */}
          {!activeBook ? (
            <button
              onClick={() => onEditScene(activeSceneId)}
              title="Edit this scene in the writer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          ) : (
            <button
              onClick={() => setIsLibraryOpen(true)}
              title="Open Bookshelf & Library"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <LibraryIcon size={13} />
              <span>Bookshelf</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            style={{
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Body: Drawer + Prose Reading Canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Table of Contents Drawer */}
        {isTocOpen && (
          <aside style={{
            width: '280px',
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
              <button
                onClick={() => setIsTocOpen(false)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '8px' }}>
              {activeBook && activeBook.epubChapters ? (
                activeBook.epubChapters.map((ch, idx) => {
                  const isSelected = idx === epubChapterIndex;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        goToEpubChapter(idx);
                        if (isContinuousMode) {
                          const el = document.getElementById(`reading-epub-chapter-${ch.id}`);
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
                })
              ) : (
                allScenes.map((s, idx) => {
                  const isSelected = s.id === activeSceneId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveSceneId(s.id);
                        onSelectScene(s.id);
                        if (!isContinuousMode) {
                          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          const el = document.getElementById(`reading-scene-${s.id}`);
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
                          {s.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {s.wordCount}w
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Reading Settings Drawer / Popover */}
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

            {/* Reading Theme */}
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

            {/* Font Family Selection (Presets + Installed Local Fonts) */}
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
                    onClick={() => setFontSize(Math.max(15, fontSize - 1))}
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

            {/* Reading Column Width & Text Alignment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Margins / Width
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {[620, 740, 880].map((w, idx) => (
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

            {/* Drop Caps Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '12px' }}>Classic Drop Caps</span>
              <button
                onClick={() => setDropCaps(!dropCaps)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: dropCaps ? 'var(--accent-pill)' : 'var(--bg-active)',
                  color: dropCaps ? 'var(--accent-pill-text)' : 'var(--text-muted)',
                }}
              >
                {dropCaps ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        )}

        {/* Prose Reading Surface */}
        {/* Prose Reading Area: Paginated Spread or Continuous Scroll */}
        {pageLayoutMode === 'scroll' ? (
          <main
            ref={containerRef}
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
              {/* ======================================================== */}
            {/* Case A: Reading an Imported Book (EPUB / TXT / MD)       */}
            {/* ======================================================== */}
            {activeBook && activeBook.epubChapters && (
              <>
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
                        {activeBook.title} • {activeBook.author}
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
                        <span>Chapter {epubChapterIndex + 1} of {activeBook.epubChapters.length}</span>
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

                    {/* Chapter HTML / Content */}
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
                          <span>{activeBook.epubChapters[epubChapterIndex - 1].title}</span>
                        </button>
                      ) : <div />}

                      <button
                        onClick={() => setIsLibraryOpen(true)}
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
                        <span>Bookshelf</span>
                      </button>

                      {epubChapterIndex < activeBook.epubChapters.length - 1 ? (
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
                          <span>{activeBook.epubChapters[epubChapterIndex + 1].title}</span>
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
                        {activeBook.format.toUpperCase()} Reader
                      </div>
                      <h1 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                        {activeBook.title}
                      </h1>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                        By {activeBook.author} • {activeBook.epubChapters.length} chapters
                      </p>
                    </div>

                    {activeBook.epubChapters.map((ch, idx) => (
                      <article key={ch.id} id={`reading-epub-chapter-${ch.id}`} style={{ position: 'relative' }}>
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
              </>
            )}

            {/* ======================================================== */}
            {/* Case B: Reading Project Manuscript                      */}
            {/* ======================================================== */}
            {!activeBook && allScenes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '480px', margin: '0 auto' }}>
                <BookOpen size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto' }} />
                <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Your Manuscript is Empty
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  You haven't written any scenes in this project yet. You can start drafting in the Write tab, or open your Bookshelf to import and read an existing EPUB, PDF, or TXT book!
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setIsLibraryOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <LibraryIcon size={16} />
                    <span>Open Bookshelf & Library</span>
                  </button>
                  <button
                    onClick={onExit}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Go to Writer
                  </button>
                </div>
              </div>
            )}

            {/* Single Scene Mode */}
            {!activeBook && !isContinuousMode && activeScene && (
              <article key={activeScene.id} style={{ position: 'relative' }}>
                {/* Book Header */}
                <header style={{ textAlign: 'center', marginBottom: '48px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--accent-primary)',
                    marginBottom: '8px',
                  }}>
                    {project.settings.title}
                  </div>

                  <h1 style={{
                    fontSize: '34px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.25',
                    marginBottom: '12px',
                  }}>
                    {activeScene.title}
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
                    <span>POV {activeScene.pov}</span>
                    <span>•</span>
                    <span>{activeScene.wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      ~{readingTimeMinutes} min read
                    </span>
                  </div>

                  {/* Classic ornamental divider */}
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

                {/* Prose Text Content */}
                <div style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
                  {renderParagraphs(activeScene.content, true)}
                </div>

                {/* Scene Bottom Navigation Bar */}
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
                  {activeSceneIndex > 0 ? (
                    <button
                      onClick={() => {
                        const prev = allScenes[activeSceneIndex - 1];
                        setActiveSceneId(prev.id);
                        onSelectScene(prev.id);
                        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      <ArrowLeft size={14} />
                      <span>{allScenes[activeSceneIndex - 1].title}</span>
                    </button>
                  ) : <div />}

                  <button
                    onClick={() => onEditScene(activeScene.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Scene in Writer</span>
                  </button>

                  {activeSceneIndex < allScenes.length - 1 ? (
                    <button
                      onClick={() => {
                        const next = allScenes[activeSceneIndex + 1];
                        setActiveSceneId(next.id);
                        onSelectScene(next.id);
                        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      <span>{allScenes[activeSceneIndex + 1].title}</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : <div />}
                </footer>
              </article>
            )}

            {/* Continuous Novel Reading Mode (All scenes assembled sequentially) */}
            {!activeBook && isContinuousMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
                <div style={{ textAlign: 'center', paddingBottom: '32px', borderBottom: '2px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                    Manuscript Reader
                  </div>
                  <h1 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    {project.settings.title}
                  </h1>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                    Complete novel draft • {allScenes.length} scenes • {ProjectStorage.countTotalWords(project.manuscript).toLocaleString()} words
                  </p>
                </div>

                {allScenes.map((s, idx) => (
                  <article key={s.id} id={`reading-scene-${s.id}`} style={{ position: 'relative' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                        Scene {idx + 1}
                      </span>
                      <h2 style={{ fontSize: '28px', fontWeight: 600, margin: '6px 0 12px 0' }}>
                        {s.title}
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

                    <div style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
                      {renderParagraphs(s.content, idx === 0)}
                    </div>
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
              disabled={currentSpread <= 1 && (activeBook ? epubChapterIndex <= 0 : activeSceneIndex <= 0)}
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
                cursor: (currentSpread <= 1 && (activeBook ? epubChapterIndex <= 0 : activeSceneIndex <= 0)) ? 'not-allowed' : 'pointer',
                opacity: (currentSpread <= 1 && (activeBook ? epubChapterIndex <= 0 : activeSceneIndex <= 0)) ? 0.35 : 0.85,
                zIndex: 25,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (currentSpread > 1 || (activeBook ? epubChapterIndex > 0 : activeSceneIndex > 0)) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = (currentSpread <= 1 && (activeBook ? epubChapterIndex <= 0 : activeSceneIndex <= 0)) ? '0.35' : '0.85';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <ChevronLeft size={24} />
            </button>

            {/* Floating Next Page Button */}
            <button
              onClick={goToNextPage}
              disabled={currentSpread >= totalSpreads && (activeBook ? epubChapterIndex >= (activeBook.epubChapters?.length || 1) - 1 : activeSceneIndex >= allScenes.length - 1)}
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
                cursor: (currentSpread >= totalSpreads && (activeBook ? epubChapterIndex >= (activeBook.epubChapters?.length || 1) - 1 : activeSceneIndex >= allScenes.length - 1)) ? 'not-allowed' : 'pointer',
                opacity: (currentSpread >= totalSpreads && (activeBook ? epubChapterIndex >= (activeBook.epubChapters?.length || 1) - 1 : activeSceneIndex >= allScenes.length - 1)) ? 0.35 : 0.85,
                zIndex: 25,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (currentSpread < totalSpreads || (activeBook ? epubChapterIndex < (activeBook.epubChapters?.length || 1) - 1 : activeSceneIndex < allScenes.length - 1)) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = (currentSpread >= totalSpreads && (activeBook ? epubChapterIndex >= (activeBook.epubChapters?.length || 1) - 1 : activeSceneIndex >= allScenes.length - 1)) ? '0.35' : '0.85';
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
                {/* ======================================================== */}
            {/* Case A: Reading an Imported Book (EPUB / TXT / MD)       */}
            {/* ======================================================== */}
            {activeBook && activeBook.epubChapters && (
              <>
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
                        {activeBook.title} • {activeBook.author}
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
                        <span>Chapter {epubChapterIndex + 1} of {activeBook.epubChapters.length}</span>
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

                    {/* Chapter HTML / Content */}
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
                          <span>{activeBook.epubChapters[epubChapterIndex - 1].title}</span>
                        </button>
                      ) : <div />}

                      <button
                        onClick={() => setIsLibraryOpen(true)}
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
                        <span>Bookshelf</span>
                      </button>

                      {epubChapterIndex < activeBook.epubChapters.length - 1 ? (
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
                          <span>{activeBook.epubChapters[epubChapterIndex + 1].title}</span>
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
                        {activeBook.format.toUpperCase()} Reader
                      </div>
                      <h1 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                        {activeBook.title}
                      </h1>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                        By {activeBook.author} • {activeBook.epubChapters.length} chapters
                      </p>
                    </div>

                    {activeBook.epubChapters.map((ch, idx) => (
                      <article key={ch.id} id={`reading-epub-chapter-${ch.id}`} style={{ position: 'relative' }}>
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
              </>
            )}

            {/* ======================================================== */}
            {/* Case B: Reading Project Manuscript                      */}
            {/* ======================================================== */}
            {!activeBook && allScenes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '480px', margin: '0 auto' }}>
                <BookOpen size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto' }} />
                <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Your Manuscript is Empty
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  You haven't written any scenes in this project yet. You can start drafting in the Write tab, or open your Bookshelf to import and read an existing EPUB, PDF, or TXT book!
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setIsLibraryOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <LibraryIcon size={16} />
                    <span>Open Bookshelf & Library</span>
                  </button>
                  <button
                    onClick={onExit}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Go to Writer
                  </button>
                </div>
              </div>
            )}

            {/* Single Scene Mode */}
            {!activeBook && !isContinuousMode && activeScene && (
              <article key={activeScene.id} style={{ position: 'relative' }}>
                {/* Book Header */}
                <header style={{ textAlign: 'center', marginBottom: '48px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--accent-primary)',
                    marginBottom: '8px',
                  }}>
                    {project.settings.title}
                  </div>

                  <h1 style={{
                    fontSize: '34px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.25',
                    marginBottom: '12px',
                  }}>
                    {activeScene.title}
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
                    <span>POV {activeScene.pov}</span>
                    <span>•</span>
                    <span>{activeScene.wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      ~{readingTimeMinutes} min read
                    </span>
                  </div>

                  {/* Classic ornamental divider */}
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

                {/* Prose Text Content */}
                <div style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
                  {renderParagraphs(activeScene.content, true)}
                </div>

                {/* Scene Bottom Navigation Bar */}
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
                  {activeSceneIndex > 0 ? (
                    <button
                      onClick={() => {
                        const prev = allScenes[activeSceneIndex - 1];
                        setActiveSceneId(prev.id);
                        onSelectScene(prev.id);
                        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      <ArrowLeft size={14} />
                      <span>{allScenes[activeSceneIndex - 1].title}</span>
                    </button>
                  ) : <div />}

                  <button
                    onClick={() => onEditScene(activeScene.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Scene in Writer</span>
                  </button>

                  {activeSceneIndex < allScenes.length - 1 ? (
                    <button
                      onClick={() => {
                        const next = allScenes[activeSceneIndex + 1];
                        setActiveSceneId(next.id);
                        onSelectScene(next.id);
                        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                      <span>{allScenes[activeSceneIndex + 1].title}</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : <div />}
                </footer>
              </article>
            )}

            {/* Continuous Novel Reading Mode (All scenes assembled sequentially) */}
            {!activeBook && isContinuousMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
                <div style={{ textAlign: 'center', paddingBottom: '32px', borderBottom: '2px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                    Manuscript Reader
                  </div>
                  <h1 style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    {project.settings.title}
                  </h1>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                    Complete novel draft • {allScenes.length} scenes • {ProjectStorage.countTotalWords(project.manuscript).toLocaleString()} words
                  </p>
                </div>

                {allScenes.map((s, idx) => (
                  <article key={s.id} id={`reading-scene-${s.id}`} style={{ position: 'relative' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                        Scene {idx + 1}
                      </span>
                      <h2 style={{ fontSize: '28px', fontWeight: 600, margin: '6px 0 12px 0' }}>
                        {s.title}
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

                    <div style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
                      {renderParagraphs(s.content, idx === 0)}
                    </div>
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
                        {activeBook ? (activeEpubChapter?.title || activeBook.title) : (activeScene?.title || project.settings.title)}
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
                      {activeBook ? (activeEpubChapter?.title || activeBook.title) : (activeScene?.title || project.settings.title)}
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

      {/* Reader Quick Note Dialog */}
      {noteDialogOpen && (
        <div
          onClick={() => setNoteDialogOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '440px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Leave Reader Note</span>
              <button onClick={() => setNoteDialogOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <textarea
              autoFocus
              placeholder="Record a thought, typo flag, or reaction while reading..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                resize: 'none',
                outline: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setNoteDialogOpen(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Library & Bookshelf Modal */}
      <BookLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        project={project}
        activeBookId={activeBook?.id || null}
        onSelectProjectManuscript={handleSelectProjectManuscript}
        onSelectBook={handleSelectBook}
      />
    </div>
  );
};
