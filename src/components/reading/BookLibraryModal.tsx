import React, { useState, useEffect, useRef } from 'react';
import { LibraryBook, BookFormat } from '../../types/book';
import { BookLibraryStorage } from '../../core/bookLibraryStorage';
import { ProjectData } from '../../types/project';
import { ProjectStorage } from '../../core/storage';
import { 
  X, 
  Plus, 
  BookOpen, 
  Trash2, 
  FileText, 
  Upload, 
  Clock, 
  Check, 
  AlertCircle,
  FileCode,
  Sparkles,
  Bookmark
} from 'lucide-react';

interface BookLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  activeBookId: string | null; // null if reading project manuscript
  onSelectProjectManuscript: () => void;
  onSelectBook: (book: LibraryBook) => void;
}

export const BookLibraryModal: React.FC<BookLibraryModalProps> = ({
  isOpen,
  onClose,
  project,
  activeBookId,
  onSelectProjectManuscript,
  onSelectBook,
}) => {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (isOpen) {
      loadBooks();
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | null) => {
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
      setImportStatus(ext === 'epub' ? 'Extracting EPUB chapters & illustrations...' : 'Processing document...');

      const newBook = await BookLibraryStorage.importFile(file);
      await loadBooks();
      setImportStatus('Book successfully added to library!');
      setTimeout(() => {
        setIsImporting(false);
        setImportStatus('');
        onSelectBook(newBook);
      }, 500);
    } catch (err: any) {
      console.error('Error importing book:', err);
      setError(err?.message || 'Failed to import book. Please check the file format.');
      setIsImporting(false);
      setImportStatus('');
    }
  };

  const handleDeleteBook = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this book from your library?')) return;

    try {
      await BookLibraryStorage.deleteBook(bookId);
      setBooks(books.filter((b) => b.id !== bookId));
      if (activeBookId === bookId) {
        onSelectProjectManuscript();
      }
    } catch (err: any) {
      console.error('Failed to delete book', err);
      setError('Failed to delete book');
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-pill)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Reading Bookshelf & Library
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Read your own novel or import existing books in EPUB, PDF, and TXT formats
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
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
                opacity: isImporting ? 0.7 : 1,
              }}
            >
              <Plus size={15} />
              <span>Import Book (EPUB / PDF / TXT)</span>
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '6px',
                borderRadius: '6px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub,.pdf,.txt,.md"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Error Banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
                borderRadius: '6px',
                backgroundColor: '#ef444415',
                color: '#ef4444',
                fontSize: '13px',
                border: '1px solid #ef444430',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Importing Indicator */}
          {isImporting && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                marginBottom: '20px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-pill)',
                color: 'var(--accent-pill-text)',
                fontSize: '13px',
                fontWeight: 500,
                border: '1px solid var(--accent-primary)',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--accent-primary)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Drag & Drop Import Dropzone */}
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
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '20px',
              borderRadius: '8px',
              border: dragOver ? '2px dashed var(--accent-primary)' : '1px dashed var(--border-strong)',
              backgroundColor: dragOver ? 'var(--accent-pill)' : 'var(--bg-surface)',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '24px',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={22} style={{ margin: '0 auto 6px auto', color: 'var(--text-muted)' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              Drag & Drop an EPUB, PDF, TXT, or Markdown book here
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Or click to browse from your computer. Supports offline reading and bookmarks.
            </div>
          </div>

          {/* Section 1: Current Project Manuscript */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.04em' }}>
              Active Project Manuscript
            </div>

            <div
              onClick={() => {
                onSelectProjectManuscript();
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '8px',
                backgroundColor: activeBookId === null ? 'var(--accent-pill)' : 'var(--bg-surface)',
                border: activeBookId === null ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (activeBookId !== null) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (activeBookId !== null) e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '52px',
                    borderRadius: '5px',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={20} />
                  <span style={{ fontSize: '9px', fontWeight: 700, marginTop: '2px' }}>INK</span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                      {project.settings.title || 'Untitled Novel'}
                    </h3>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--accent-primary)',
                        color: '#ffffff',
                      }}
                    >
                      Project Novel
                    </span>
                    {activeBookId === null && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Check size={12} /> Currently Reading
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    InkWell Manuscript • {ProjectStorage.countTotalWords(project.manuscript).toLocaleString()} words drafted
                  </div>
                </div>
              </div>

              <button
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: activeBookId === null ? 'var(--accent-primary)' : 'var(--bg-app)',
                  color: activeBookId === null ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {activeBookId === null ? 'Reading' : 'Read Manuscript'}
              </button>
            </div>
          </div>

          {/* Section 2: Imported Library Books */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                Imported Books ({books.length})
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading library...
              </div>
            ) : books.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <FileText size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No pre-existing books added yet
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 14px auto' }}>
                  Import your favorite published novels, reference books, or research papers in EPUB, PDF, or TXT format to read alongside your writing.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Import Your First Book
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
                {books.map((book) => {
                  const badge = getFormatBadge(book.format);
                  const isCurrent = activeBookId === book.id;

                  return (
                    <div
                      key={book.id}
                      onClick={() => {
                        onSelectBook(book);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '14px',
                        borderRadius: '8px',
                        backgroundColor: isCurrent ? 'var(--accent-pill)' : 'var(--bg-surface)',
                        border: isCurrent ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                      }}
                    >
                      {/* Book Cover or Format Icon */}
                      <div
                        style={{
                          width: '54px',
                          height: '76px',
                          borderRadius: '5px',
                          overflow: 'hidden',
                          backgroundColor: 'var(--bg-active)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)',
                          flexShrink: 0,
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: '4px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: badge.color,
                                textTransform: 'uppercase',
                              }}
                            >
                              {badge.label}
                            </span>
                            <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                              <BookOpen size={16} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info & Details */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                            <h4
                              style={{
                                fontSize: '14px',
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
                            </h4>

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
                              marginTop: '2px',
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

                        {/* Progress Bar & Actions */}
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                            <span>
                              {book.format === 'pdf' 
                                ? 'PDF Reader' 
                                : `Chapter ${(book.currentChapterIndex || 0) + 1} of ${book.totalChapters || 1}`}
                            </span>
                            <span>{book.progressPercent || 0}%</span>
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

                      {/* Delete Button */}
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
                          opacity: 0.6,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.backgroundColor = '#ef444415';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.6';
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
      </div>
    </div>
  );
};
