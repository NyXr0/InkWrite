import React, { useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';
import { LoreImage } from '../../types/project';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: { url: string; caption?: string; id?: string }[];
  initialIndex?: number;
  entityName?: string;
  onSetAsPrimary?: (url: string) => void;
  onDeleteImage?: (id: string) => void;
  currentPrimaryUrl?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  entityName,
  onSetAsPrimary,
  onDeleteImage,
  currentPrimaryUrl,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
    }
  }, [isOpen, initialIndex, images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    },
    [isOpen, onClose, handleNext, handlePrev]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || images.length === 0) return null;

  const currentItem = images[currentIndex] || images[0];
  const isPrimary = currentPrimaryUrl && currentItem && currentPrimaryUrl === currentItem.url;

  const handleDownload = () => {
    if (!currentItem?.url) return;
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = `${entityName || 'codex-image'}-${currentIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 20000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {/* Top Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {entityName && (
            <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em' }}>
              {entityName}
            </span>
          )}
          {images.length > 1 && (
            <span style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#e5e7eb',
            }}>
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Set as Primary button */}
          {onSetAsPrimary && !isPrimary && currentItem && (
            <button
              onClick={() => onSetAsPrimary(currentItem.url)}
              title="Set as main portrait / entity banner"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Star size={14} color="#f59e0b" />
              <span>Set as Main Portrait</span>
            </button>
          )}

          {isPrimary && (
            <span style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              fontWeight: 600,
            }}>
              ★ Main Portrait
            </span>
          )}

          {/* Download button */}
          <button
            onClick={handleDownload}
            title="Download full resolution image"
            style={{
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={16} />
          </button>

          {/* Delete button (if gallery image with ID) */}
          {onDeleteImage && currentItem.id && (
            <button
              onClick={() => {
                if (window.confirm('Delete this image from the gallery?')) {
                  onDeleteImage(currentItem.id!);
                  if (images.length <= 1) {
                    onClose();
                  } else {
                    handleNext();
                  }
                }
              }}
              title="Delete this image"
              style={{
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            title="Close Lightbox (Esc)"
            style={{
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '8px',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={currentItem.url}
          alt={currentItem.caption || entityName || 'Codex visual'}
          style={{
            maxWidth: '100%',
            maxHeight: '75vh',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />

        {/* Caption */}
        {currentItem.caption && (
          <div style={{
            marginTop: '12px',
            fontSize: '14px',
            color: '#e5e7eb',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '6px 16px',
            borderRadius: '20px',
            backdropFilter: 'blur(4px)',
            maxWidth: '600px',
            textAlign: 'center',
          }}>
            {currentItem.caption}
          </div>
        )}
      </div>

      {/* Left Navigation Arrow */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          title="Previous image (Left Arrow)"
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '12px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          title="Next image (Right Arrow)"
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '12px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
};
