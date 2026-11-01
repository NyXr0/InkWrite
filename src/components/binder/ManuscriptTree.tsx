import React, { useState, useRef, useEffect } from 'react';
import { FolderItem, SceneItem } from '../../types/project';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  FolderOpen, 
  Plus, 
  FolderPlus,
  Compass, 
  BookMarked,
  Trash2,
  Edit2,
  Check
} from 'lucide-react';

interface ManuscriptTreeProps {
  manuscript: FolderItem[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onAddScene: (parentFolderId: string) => void;
  onAddFolder: (parentFolderId?: string) => void;
  onRenameScene: (sceneId: string, newTitle: string) => void;
  onRenameFolder: (folderId: string, newTitle: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onOpenCodex: () => void;
  totalWords: number;
  targetWords: number;
}

export const ManuscriptTree: React.FC<ManuscriptTreeProps> = ({
  manuscript,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onAddFolder,
  onRenameScene,
  onRenameFolder,
  onDeleteScene,
  onDeleteFolder,
  onOpenCodex,
  totalWords,
  targetWords,
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({
    'part-2': true,
  });

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingType, setEditingType] = useState<'scene' | 'folder' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startRename = (id: string, currentTitle: string, type: 'scene' | 'folder', e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
    setEditingType(type);
  };

  const commitRename = () => {
    if (!editingId) return;
    const trimmed = editingTitle.trim();
    if (trimmed.length > 0) {
      if (editingType === 'scene') {
        onRenameScene(editingId, trimmed);
      } else if (editingType === 'folder') {
        onRenameFolder(editingId, trimmed);
      }
    }
    setEditingId(null);
    setEditingType(null);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingType(null);
  };

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const percentProgress = targetWords > 0 
    ? Math.min(100, Math.round((totalWords / targetWords) * 100))
    : 0;

  const handleDeleteFolderClick = (e: React.MouseEvent, folder: FolderItem) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete folder "${folder.title}" and all its contents?`);
    if (confirmed) {
      onDeleteFolder(folder.id);
    }
  };

  const handleDeleteSceneClick = (e: React.MouseEvent, scene: SceneItem) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete scene "${scene.title}"?`);
    if (confirmed) {
      onDeleteScene(scene.id);
    }
  };

  const renderItem = (item: FolderItem | SceneItem, depth: number = 0) => {
    if (item.type === 'folder') {
      const isCollapsed = !!collapsedFolders[item.id];
      const getFolderWords = (f: FolderItem): number => {
        let sum = 0;
        for (const child of f.children) {
          if (child.type === 'scene') sum += child.wordCount || 0;
          else sum += getFolderWords(child);
        }
        return sum;
      };
      const fWords = getFolderWords(item);
      const isEditing = editingId === item.id;

      return (
        <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            onClick={(e) => toggleFolder(item.id, e)}
            onDoubleClick={(e) => startRename(item.id, item.title, 'folder', e)}
            className="binder-folder-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              paddingLeft: `${depth * 14 + 8}px`,
              fontSize: '13px',
              fontWeight: depth === 0 ? 600 : 500,
              color: 'var(--text-primary)',
              borderRadius: '4px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </span>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {isCollapsed ? <Folder size={14} /> : <FolderOpen size={14} />}
              </span>

              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') cancelRename();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: '13px',
                    fontWeight: 'inherit',
                    padding: '1px 4px',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    width: '140px',
                    outline: 'none',
                  }}
                />
              ) : (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {fWords > 0 && depth > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '2px' }}>
                  {fWords.toLocaleString()}
                </span>
              )}

              {/* Add Scene inside folder */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddScene(item.id);
                }}
                title="Add Scene into this chapter"
                style={{
                  padding: '2px',
                  borderRadius: '3px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <Plus size={13} />
              </button>

              {/* Rename Folder */}
              <button
                onClick={(e) => startRename(item.id, item.title, 'folder', e)}
                title="Rename Chapter / Folder"
                style={{
                  padding: '2px',
                  borderRadius: '3px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <Edit2 size={11} />
              </button>

              {depth > 0 && (
                <button
                  onClick={(e) => handleDeleteFolderClick(e, item)}
                  title="Delete Folder"
                  style={{
                    padding: '2px',
                    borderRadius: '3px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {!isCollapsed && item.children && item.children.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {item.children.map((child) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // Scene Item
    const isActive = item.id === activeSceneId;
    const isEditing = editingId === item.id;

    return (
      <div
        key={item.id}
        onClick={() => onSelectScene(item.id)}
        onDoubleClick={(e) => startRename(item.id, item.title, 'scene', e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 8px',
          paddingLeft: `${depth * 14 + 18}px`,
          fontSize: '13px',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
          fontWeight: isActive ? 600 : 400,
          borderRadius: '4px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          const actionBtns = e.currentTarget.querySelector('.scene-action-buttons') as HTMLElement;
          if (actionBtns) actionBtns.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
          const actionBtns = e.currentTarget.querySelector('.scene-action-buttons') as HTMLElement;
          if (actionBtns) actionBtns.style.opacity = '0';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
          <FileText size={13} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
          {isEditing ? (
            <input
              ref={inputRef}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') cancelRename();
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '13px',
                padding: '1px 4px',
                border: '1px solid var(--accent-primary)',
                borderRadius: '3px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                width: '130px',
                outline: 'none',
              }}
            />
          ) : (
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
            padding: '1px 5px',
            borderRadius: '4px',
          }}>
            {item.wordCount.toLocaleString()}
          </span>

          <div className="scene-action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '2px', opacity: 0, transition: 'opacity 0.15s ease' }}>
            <button
              onClick={(e) => startRename(item.id, item.title, 'scene', e)}
              title="Rename Scene"
              style={{
                padding: '2px',
                borderRadius: '3px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Edit2 size={11} />
            </button>

            <button
              onClick={(e) => handleDeleteSceneClick(e, item)}
              title="Delete Scene"
              style={{
                padding: '2px',
                borderRadius: '3px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside style={{
      width: '260px',
      height: '100%',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Top Header */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px 8px 8px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          <span>Manuscript Binder</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => onAddFolder()}
              title="Add New Chapter / Section"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 5px',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                fontSize: '10px',
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <FolderPlus size={12} />
              <span>Chapter</span>
            </button>

            <button
              onClick={() => {
                if (manuscript.length > 0) {
                  // Find first folder or use root
                  const firstFolder = manuscript[0].children?.find((c) => c.type === 'folder') || manuscript[0];
                  onAddScene(firstFolder.id);
                }
              }}
              title="Add New Scene"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 5px',
                borderRadius: '4px',
                color: '#fff',
                backgroundColor: 'var(--accent-primary)',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={12} />
              <span>Scene</span>
            </button>
          </div>
        </div>

        {/* Tree Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {manuscript.map((folder) => renderItem(folder, 0))}
        </div>

        {/* Research & Lore Shortcuts */}
        <div style={{
          marginTop: '20px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <button
            onClick={onOpenCodex}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              borderRadius: '4px',
              textAlign: 'left',
              width: '100%',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Compass size={14} color="var(--accent-primary)" />
            <span>Characters & places</span>
          </button>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-sidebar)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          marginBottom: '6px',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Draft total</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {totalWords.toLocaleString()} / {targetWords.toLocaleString()}
          </span>
        </div>
        <div style={{
          height: '6px',
          backgroundColor: 'var(--bg-active)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${percentProgress}%`,
            backgroundColor: 'var(--accent-primary)',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </aside>
  );
};
