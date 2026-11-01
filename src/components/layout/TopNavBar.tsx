import React from 'react';
import { MainView, ThemeMode } from '../../types/project';
import { 
  BookOpen, 
  LayoutGrid, 
  Calendar, 
  Compass, 
  BarChart3, 
  Search, 
  CheckCircle2, 
  Sun, 
  Moon, 
  Coffee,
  Maximize2
} from 'lucide-react';

interface TopNavBarProps {
  currentView: MainView;
  onSelectView: (view: MainView) => void;
  projectTitle: string;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onOpenPalette: () => void;
  onEnterFocusMode: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onSelectView,
  projectTitle,
  theme,
  onSelectTheme,
  onOpenPalette,
  onEnterFocusMode,
}) => {
  return (
    <header style={{
      height: '48px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      backgroundColor: 'var(--bg-app)',
      userSelect: 'none',
      zIndex: 10,
    }}>
      {/* Left: Branding & Project Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <span style={{ 
            fontFamily: 'var(--font-serif)', 
            letterSpacing: '-0.02em', 
            fontWeight: 700, 
            fontSize: '16px',
            color: 'var(--accent-primary)' 
          }}>
            Inkwell
          </span>
          <span style={{ color: 'var(--text-faint)' }}>|</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{projectTitle}</span>
        </div>

        {/* View Switcher Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
          <button
            onClick={() => onSelectView('write')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: currentView === 'write' ? 'var(--bg-active)' : 'transparent',
              color: currentView === 'write' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <BookOpen size={15} />
            <span>Write</span>
          </button>

          <button
            onClick={() => onSelectView('corkboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: currentView === 'corkboard' ? 'var(--bg-active)' : 'transparent',
              color: currentView === 'corkboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <LayoutGrid size={15} />
            <span>Corkboard</span>
          </button>

          <button
            onClick={() => onSelectView('timeline')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: currentView === 'timeline' ? 'var(--bg-active)' : 'transparent',
              color: currentView === 'timeline' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <Calendar size={15} />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => onSelectView('codex')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: currentView === 'codex' ? 'var(--bg-active)' : 'transparent',
              color: currentView === 'codex' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <Compass size={15} />
            <span>Codex & Lore</span>
          </button>

          <button
            onClick={() => onSelectView('insights')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: currentView === 'insights' ? 'var(--bg-active)' : 'transparent',
              color: currentView === 'insights' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <BarChart3 size={15} />
            <span>Insights</span>
          </button>
        </nav>
      </div>

      {/* Center: Command Palette Trigger */}
      <div style={{ flex: '0 1 320px', margin: '0 16px' }}>
        <button
          onClick={onOpenPalette}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            fontSize: '12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} />
            <span>Search or run a command...</span>
          </div>
          <kbd style={{
            background: 'var(--bg-active)',
            padding: '2px 5px',
            borderRadius: '4px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)'
          }}>
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Themes, and Sync Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Fullscreen / Focus Mode */}
        <button
          onClick={onEnterFocusMode}
          title="Distraction-Free Focus Mode (F11)"
          style={{
            padding: '6px',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Maximize2 size={16} />
        </button>

        {/* Theme Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-active)',
          borderRadius: '6px',
          padding: '2px',
        }}>
          <button
            onClick={() => onSelectTheme('paper')}
            title="Paper Theme (Light)"
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: theme === 'paper' ? 'var(--bg-surface)' : 'transparent',
              color: theme === 'paper' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: theme === 'paper' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Sun size={13} />
            <span>Paper</span>
          </button>

          <button
            onClick={() => onSelectTheme('sepia')}
            title="Sepia Theme (Warm)"
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: theme === 'sepia' ? 'var(--bg-surface)' : 'transparent',
              color: theme === 'sepia' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: theme === 'sepia' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Coffee size={13} />
            <span>Sepia</span>
          </button>

          <button
            onClick={() => onSelectTheme('night')}
            title="Night Theme (Dark)"
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: theme === 'night' ? 'var(--bg-surface)' : 'transparent',
              color: theme === 'night' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: theme === 'night' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Moon size={13} />
            <span>Night</span>
          </button>
        </div>

        {/* Git Sync Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--accent-primary)',
          backgroundColor: 'var(--accent-pill)',
          padding: '3px 8px',
          borderRadius: '12px',
        }}>
          <CheckCircle2 size={13} />
          <span>Synced</span>
        </div>
      </div>
    </header>
  );
};
