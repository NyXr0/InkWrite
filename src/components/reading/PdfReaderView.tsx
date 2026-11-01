import React, { useState } from 'react';
import { LibraryBook } from '../../types/book';
import { 
  ArrowLeft, 
  BookOpen, 
  Maximize2, 
  Minimize2, 
  Download, 
  Clock, 
  FileText,
  Library as LibraryIcon
} from 'lucide-react';

interface PdfReaderViewProps {
  book: LibraryBook;
  onBackToLibrary: () => void;
  onExitReading: () => void;
}

export const PdfReaderView: React.FC<PdfReaderViewProps> = ({
  book,
  onBackToLibrary,
  onExitReading,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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
      }}
    >
      {/* Top Header Bar */}
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
        {/* Left: Back to Library & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onExitReading}
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
            onClick={onBackToLibrary}
            title="Open Book Library / Bookshelf"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            <LibraryIcon size={15} />
            <span>Library</span>
          </button>
        </div>

        {/* Center: Book Metadata */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600,
          maxWidth: '500px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#ef444422',
            color: '#ef4444',
            border: '1px solid #ef444444',
          }}>
            PDF
          </span>
          <span style={{ fontFamily: 'var(--font-serif)' }}>{book.title}</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
            ({formatFileSize(book.fileSize)})
          </span>
        </div>

        {/* Right: Fullscreen & Download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {book.pdfDataUrl && (
            <a
              href={book.pdfDataUrl}
              download={book.fileName || `${book.title}.pdf`}
              title="Download local copy of PDF"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Download size={15} />
              <span>Export</span>
            </a>
          )}

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

      {/* PDF Content Area */}
      <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
        {book.pdfDataUrl ? (
          <iframe
            src={book.pdfDataUrl}
            title={book.title}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#525659',
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '12px',
            color: 'var(--text-muted)',
          }}>
            <FileText size={48} />
            <p>PDF data is unavailable or could not be loaded.</p>
            <button
              onClick={onBackToLibrary}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
