import React, { useEffect, useRef } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  useEffect(() => {
    // Focus textarea on mount
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const sceneWords = scene.content.trim() ? scene.content.trim().split(/\s+/).length : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-editor)',
        color: 'var(--text-primary)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '48px 24px 24px 24px',
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
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <span>Exit Focus</span>
        <Minimize2 size={16} />
      </button>

      {/* Centered Prose Column */}
      <div
        style={{
          width: '100%',
          maxWidth: 'var(--editor-max-width, 760px)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ marginBottom: '16px', opacity: 0.6, fontSize: '14px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          {scene.title}
        </div>

        <textarea
          ref={textareaRef}
          value={scene.content}
          onChange={(e) => onChangeContent(e.target.value)}
          placeholder="Begin drafting without distraction..."
          style={{
            width: '100%',
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'var(--font-serif)',
            fontSize: '19px',
            lineHeight: '1.9',
            color: 'var(--text-primary)',
            padding: 0,
            overflowY: 'auto',
          }}
        />
      </div>

      {/* Floating HUD Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: 'var(--bg-card-subtle, rgba(0, 0, 0, 0.05))',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-subtle)',
        padding: '8px 20px',
        borderRadius: '24px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        userSelect: 'none',
        marginTop: '16px',
      }}>
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>{sceneWords.toLocaleString()}</strong> words in scene
        </span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span>
          <strong style={{ color: 'var(--accent-primary)' }}>{todayWords.toLocaleString()}</strong> of {dailyGoal.toLocaleString()} goal today
        </span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <kbd style={{
          backgroundColor: 'var(--bg-active)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-primary)',
        }}>
          Esc to exit
        </kbd>
      </div>
    </div>
  );
};
