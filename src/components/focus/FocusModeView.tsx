import React, { useState, useEffect, useRef } from 'react';
import { SceneItem } from '../../types/project';
import { Minimize2 } from 'lucide-react';

interface FocusModeViewProps {
  scene: SceneItem;
  todayWords: number;
  dailyGoal: number;
  onExit: () => void;
  onChangeContent: (content: string) => void;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({
  scene,
  todayWords,
  dailyGoal,
  onExit,
  onChangeContent,
}) => {
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(2); // default paragraph
  const [focusUnit, setFocusUnit] = useState<'paragraph' | 'sentence'>('paragraph');
  const containerRef = useRef<HTMLDivElement>(null);

  // Split scene into paragraphs
  const paragraphs = scene.content.split('\n\n');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  const handleParagraphChange = (index: number, newText: string) => {
    const updated = [...paragraphs];
    updated[index] = newText;
    onChangeContent(updated.join('\n\n'));
  };

  return (
    <div
      data-theme="sepia"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '60px 24px 32px 24px',
        overflow: 'hidden',
        userSelect: 'text',
      }}
    >
      {/* Top right escape button */}
      <button
        onClick={onExit}
        title="Exit focus mode (Esc)"
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          padding: '8px',
          borderRadius: '6px',
          color: 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        <Minimize2 size={18} />
      </button>

      {/* Centered Prose Column */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: '720px',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '24px',
          padding: '40px 0',
        }}
      >
        {paragraphs.map((para, idx) => {
          const isActive = idx === activeParagraphIndex;

          return (
            <div
              key={idx}
              onClick={() => setActiveParagraphIndex(idx)}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '20px',
                lineHeight: '1.9',
                opacity: isActive ? 1 : 0.22,
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                cursor: 'text',
                position: 'relative',
              }}
            >
              <textarea
                value={para}
                onFocus={() => setActiveParagraphIndex(idx)}
                onChange={(e) => handleParagraphChange(idx, e.target.value)}
                rows={Math.max(2, Math.ceil(para.length / 60))}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  color: 'inherit',
                  padding: 0,
                  margin: 0,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Floating HUD Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        backgroundColor: 'rgba(56, 44, 30, 0.08)',
        backdropFilter: 'blur(8px)',
        padding: '8px 20px',
        borderRadius: '24px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        userSelect: 'none',
      }}>
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>{todayWords.toLocaleString()}</strong> of {dailyGoal.toLocaleString()} words today
        </span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span
          onClick={() => setFocusUnit(focusUnit === 'paragraph' ? 'sentence' : 'paragraph')}
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          title="Click to toggle sentence / paragraph focus"
        >
          Focus on current {focusUnit}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <kbd style={{
          backgroundColor: 'rgba(56, 44, 30, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
        }}>
          Esc to leave
        </kbd>
      </div>
    </div>
  );
};
