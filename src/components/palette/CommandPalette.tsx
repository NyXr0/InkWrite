import React, { useState, useEffect, useRef } from 'react';
import { SceneItem, LoreEntry, ThemeMode } from '../../types/project';
import { 
  Camera, 
  Columns2, 
  Eye, 
  Sun, 
  Moon, 
  Coffee,
  Plus,
  FolderOpen,
  FileText,
  User,
  Search,
  Palette,
  BookOpen,
  Download
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: SceneItem[];
  loreList: LoreEntry[];
  onSelectScene: (sceneId: string) => void;
  onSelectLore: (lore: LoreEntry) => void;
  onTakeSnapshot: () => void;
  onToggleSplit: () => void;
  onEnterFocusMode: () => void;
  onOpenReadingMode?: () => void;
  onSelectTheme: (theme: ThemeMode) => void;
  onOpenAppearance: () => void;
  onOpenCompile?: () => void;
  onOpenNewProject: () => void;
  onOpenProjectHub: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  scenes,
  loreList,
  onSelectScene,
  onSelectLore,
  onTakeSnapshot,
  onToggleSplit,
  onEnterFocusMode,
  onOpenReadingMode,
  onSelectTheme,
  onOpenAppearance,
  onOpenCompile,
  onOpenNewProject,
  onOpenProjectHub,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Build command items
  const commands = [
    {
      id: 'cmd-new-proj',
      title: 'Create new novel project...',
      shortcut: 'Ctrl Shift N',
      icon: <Plus size={14} />,
      action: () => { onClose(); onOpenNewProject(); },
    },
    {
      id: 'cmd-hub-proj',
      title: 'Manage all projects (Project Hub)...',
      shortcut: 'Ctrl Shift O',
      icon: <FolderOpen size={14} />,
      action: () => { onClose(); onOpenProjectHub(); },
    },
    {
      id: 'cmd-snap',
      title: 'Take snapshot of this scene',
      shortcut: 'Ctrl Shift S',
      icon: <Camera size={14} />,
      action: () => { onTakeSnapshot(); onClose(); },
    },
    {
      id: 'cmd-split',
      title: 'Toggle split view',
      shortcut: 'Ctrl Shift \\',
      icon: <Columns2 size={14} />,
      action: () => { onToggleSplit(); onClose(); },
    },
    {
      id: 'cmd-focus',
      title: 'Enter distraction-free focus mode',
      shortcut: 'F11',
      icon: <Eye size={14} />,
      action: () => { onEnterFocusMode(); onClose(); },
    },
    {
      id: 'cmd-read',
      title: 'Enter book reading mode',
      shortcut: 'Ctrl Shift R',
      icon: <BookOpen size={14} />,
      action: () => { if (onOpenReadingMode) onOpenReadingMode(); onClose(); },
    },
    ...(onOpenCompile ? [{
      id: 'cmd-compile',
      title: 'Compile & Export Manuscript (.md, .txt, .html, .json)...',
      shortcut: 'Ctrl Shift E',
      icon: <Download size={14} />,
      action: () => { onClose(); onOpenCompile(); },
    }] : []),
    {
      id: 'cmd-appearance',
      title: 'Customize appearance (Background wallpaper, fonts, themes)...',
      shortcut: 'Ctrl Shift A',
      icon: <Palette size={14} />,
      action: () => { onClose(); onOpenAppearance(); },
    },
    {
      id: 'cmd-theme-paper',
      title: 'Switch to Paper theme',
      icon: <Sun size={14} />,
      action: () => { onSelectTheme('paper'); onClose(); },
    },
    {
      id: 'cmd-theme-sepia',
      title: 'Switch to Sepia theme',
      icon: <Coffee size={14} />,
      action: () => { onSelectTheme('sepia'); onClose(); },
    },
    {
      id: 'cmd-theme-night',
      title: 'Switch to Night theme',
      icon: <Moon size={14} />,
      action: () => { onSelectTheme('night'); onClose(); },
    },
  ];

  const filteredCommands = commands.filter((c) => c.title.toLowerCase().includes(q));
  const filteredScenes = scenes.filter((s) => s.title.toLowerCase().includes(q));
  const filteredLore = loreList.filter((l) => 
    l.name.toLowerCase().includes(q) || (l.role && l.role.toLowerCase().includes(q))
  );

  const allItems: { type: 'cmd' | 'scene' | 'lore'; item: any }[] = [
    ...filteredCommands.map((c) => ({ type: 'cmd' as const, item: c })),
    ...filteredScenes.map((s) => ({ type: 'scene' as const, item: s })),
    ...filteredLore.map((l) => ({ type: 'lore' as const, item: l })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev + 1) % allItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        executeItem(allItems[selectedIndex]);
      }
    }
  };

  const executeItem = (entry: { type: 'cmd' | 'scene' | 'lore'; item: any }) => {
    if (entry.type === 'cmd') {
      entry.item.action();
    } else if (entry.type === 'scene') {
      onSelectScene(entry.item.id);
      onClose();
    } else if (entry.type === 'lore') {
      onSelectLore(entry.item);
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '760px',
          maxHeight: '520px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search input header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search scenes and lore..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
            }}
          />
          <kbd style={{
            fontSize: '11px',
            backgroundColor: 'var(--bg-active)',
            color: 'var(--text-secondary)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
          }}>
            Esc
          </kbd>
        </div>

        {/* Results Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 0',
        }}>
          {/* Commands Group */}
          {filteredCommands.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '4px 20px',
                letterSpacing: '0.04em',
              }}>
                Commands
              </div>
              {filteredCommands.map((cmd) => {
                const idx = allItems.findIndex((it) => it.type === 'cmd' && it.item.id === cmd.id);
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={cmd.id}
                    onClick={() => executeItem({ type: 'cmd', item: cmd })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 20px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                        {cmd.icon}
                      </span>
                      <span>{cmd.title}</span>
                    </div>

                    {cmd.shortcut && (
                      <kbd style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                      }}>
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Go to Scenes Group */}
          {filteredScenes.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '4px 20px',
                letterSpacing: '0.04em',
              }}>
                Scenes
              </div>
              {filteredScenes.map((scene) => {
                const idx = allItems.findIndex((it) => it.type === 'scene' && it.item.id === scene.id);
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={scene.id}
                    onClick={() => executeItem({ type: 'scene', item: scene })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 20px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={14} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                      <span>Scene: {scene.title}</span>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      POV {scene.pov} • {scene.wordCount.toLocaleString()} words
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Go to Lore Group */}
          {filteredLore.length > 0 && (
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '4px 20px',
                letterSpacing: '0.04em',
              }}>
                Story Bible & Lore
              </div>
              {filteredLore.map((lore) => {
                const idx = allItems.findIndex((it) => it.type === 'lore' && it.item.id === lore.id);
                const isSelected = idx === selectedIndex;

                return (
                  <div
                    key={lore.id}
                    onClick={() => executeItem({ type: 'lore', item: lore })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 20px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <User size={14} color={isSelected ? 'var(--accent-secondary)' : 'var(--text-muted)'} />
                      <span>{lore.category.toUpperCase()}: {lore.name}</span>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {lore.role || lore.category}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {allItems.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No commands, scenes, or lore matching "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
