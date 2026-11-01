import React, { useState, useRef, useEffect } from 'react';
import { MainView, ThemeMode, ProjectData } from '../../types/project';
import { ProjectStorage } from '../../core/storage';
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
  Maximize2,
  ChevronDown,
  Plus,
  FolderOpen,
  Check,
  Trash2,
  LogOut
} from 'lucide-react';

interface TopNavBarProps {
  currentView: MainView;
  onSelectView: (view: MainView) => void;
  projectTitle: string;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onOpenPalette: () => void;
  onEnterFocusMode: () => void;
  projects: ProjectData[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenProjectHub: () => void;
  onOpenNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onCloseProject: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onSelectView,
  projectTitle,
  theme,
  onSelectTheme,
  onOpenPalette,
  onEnterFocusMode,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenProjectHub,
  onOpenNewProject,
  onDeleteProject,
  onCloseProject,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, proj: ProjectData) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete novel project "${proj.settings.title}"? This cannot be undone.`);
    if (confirmed) {
      onDeleteProject(proj.settings.id);
    }
  };

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
      {/* Left: Branding & Interactive Project Switcher */}
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

          {/* Project Switcher Dropdown Anchor */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: isDropdownOpen ? 'var(--bg-active)' : 'transparent',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isDropdownOpen) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isDropdownOpen) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{projectTitle}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                width: '280px',
                backgroundColor: 'var(--bg-popover)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                zIndex: 100,
                padding: '4px 0',
              }}>
                <div style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>Your Projects ({projects.length})</span>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {projects.map((proj) => {
                    const isSelected = proj.settings.id === activeProjectId;
                    const words = ProjectStorage.countTotalWords(proj.manuscript);

                    return (
                      <div
                        key={proj.settings.id}
                        onClick={() => {
                          onSelectProject(proj.settings.id);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isSelected ? 'var(--bg-active)' : 'transparent';
                        }}
                      >
                        <div style={{ overflow: 'hidden', flex: 1, marginRight: '8px' }}>
                          <div style={{ fontWeight: isSelected ? 600 : 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {proj.settings.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {words.toLocaleString()} words
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isSelected && <Check size={14} color="var(--accent-primary)" />}

                          {/* Delete Project Action */}
                          <button
                            onClick={(e) => handleDeleteClick(e, proj)}
                            title="Delete project"
                            style={{
                              padding: '4px',
                              borderRadius: '4px',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              e.currentTarget.style.color = '#dc2626';
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenNewProject();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: 'var(--accent-primary)',
                      fontWeight: 500,
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Plus size={14} />
                    <span>New Project...</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenProjectHub();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <FolderOpen size={14} />
                    <span>Manage All Projects...</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onCloseProject();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      textAlign: 'left',
                      borderTop: '1px dashed var(--border-subtle)',
                      marginTop: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <LogOut size={14} />
                    <span>Close Project (Start Window)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
