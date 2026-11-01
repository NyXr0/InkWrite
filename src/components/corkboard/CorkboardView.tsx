import React, { useState } from 'react';
import { SceneItem, FolderItem, SceneStatus } from '../../types/project';
import { Filter, Plus, GripVertical, CheckCircle2, Trash2, Folder } from 'lucide-react';

interface CorkboardViewProps {
  currentFolder: FolderItem;
  allFolders?: FolderItem[];
  onSelectFolder?: (folderId: string) => void;
  onSelectScene: (sceneId: string) => void;
  onUpdateSceneTitle?: (sceneId: string, newTitle: string) => void;
  onUpdateSceneSummary: (sceneId: string, summary: string) => void;
  onAddScene: (folderId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onReorderScenes: (reorderedScenes: SceneItem[]) => void;
}

export const CorkboardView: React.FC<CorkboardViewProps> = ({
  currentFolder,
  allFolders = [],
  onSelectFolder,
  onSelectScene,
  onUpdateSceneTitle,
  onUpdateSceneSummary,
  onAddScene,
  onDeleteScene,
  onReorderScenes,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [povFilter, setPovFilter] = useState<string>('all');
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);

  // Extract all scenes in this folder
  const scenes = currentFolder.children.filter((c): c is SceneItem => c.type === 'scene');
  const totalWords = scenes.reduce((acc, s) => acc + (s.wordCount || 0), 0);

  // Extract unique POVs
  const povList = Array.from(new Set(scenes.map((s) => s.pov).filter(Boolean)));

  // Filter scenes
  const filteredScenes = scenes.filter((scene) => {
    if (statusFilter !== 'all' && scene.status !== statusFilter) return false;
    if (povFilter !== 'all' && scene.pov !== povFilter) return false;
    return true;
  });

  const getStatusBadgeStyle = (status: SceneStatus) => {
    switch (status) {
      case 'final':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', label: 'Final' };
      case 'second-draft':
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: 'Second draft' };
      case 'revised':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff', label: 'Revised' };
      case 'first-draft':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a', label: 'First draft' };
      case 'idea':
      default:
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: 'Idea' };
    }
  };

  const handleDragStart = (sceneId: string) => {
    setDraggedSceneId(sceneId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetSceneId: string) => {
    if (!draggedSceneId || draggedSceneId === targetSceneId) {
      setDraggedSceneId(null);
      return;
    }

    const fromIdx = scenes.findIndex((s) => s.id === draggedSceneId);
    const toIdx = scenes.findIndex((s) => s.id === targetSceneId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const updated = [...scenes];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      onReorderScenes(updated);
    }

    setDraggedSceneId(null);
  };

  const handleDeleteCardClick = (e: React.MouseEvent, scene: SceneItem) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete scene "${scene.title}"?`);
    if (confirmed) {
      onDeleteScene(scene.id);
    }
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: 'var(--bg-app)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Corkboard Header & Filter Bar */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{
              fontSize: '18px',
              fontFamily: 'var(--font-serif)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              {currentFolder.title}
            </h2>

            {/* Folder / Chapter Switcher */}
            {allFolders.length > 1 && onSelectFolder && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Folder size={14} color="var(--text-muted)" />
                <select
                  value={currentFolder.id}
                  onChange={(e) => onSelectFolder(e.target.value)}
                  style={{
                    fontSize: '12px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {allFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {scenes.length} scenes • {totalWords.toLocaleString()} words
          </div>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Filter size={13} />
            <span>Filter</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="all">All statuses</option>
            <option value="idea">Idea</option>
            <option value="first-draft">First draft</option>
            <option value="second-draft">Second draft</option>
            <option value="revised">Revised</option>
            <option value="final">Final</option>
          </select>

          <select
            value={povFilter}
            onChange={(e) => setPovFilter(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="all">POV: any</option>
            {povList.map((pov) => (
              <option key={pov} value={pov}>POV: {pov}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Canvas */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {filteredScenes.map((scene) => {
            const badge = getStatusBadgeStyle(scene.status);
            const isDragging = draggedSceneId === scene.id;

            return (
              <div
                key={scene.id}
                draggable
                onDragStart={() => handleDragStart(scene.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(scene.id)}
                onClick={() => onSelectScene(scene.id)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'grab',
                  opacity: isDragging ? 0.4 : 1,
                  transition: 'box-shadow var(--transition-fast), border-color var(--transition-fast)',
                  minHeight: '180px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  const trash = e.currentTarget.querySelector('.card-trash-btn') as HTMLElement;
                  if (trash) trash.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  const trash = e.currentTarget.querySelector('.card-trash-btn') as HTMLElement;
                  if (trash) trash.style.opacity = '0';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <input
                      value={scene.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (onUpdateSceneTitle) {
                          onUpdateSceneTitle(scene.id, e.target.value);
                        }
                      }}
                      style={{
                        fontSize: '15px',
                        fontFamily: 'var(--font-serif)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        border: '1px solid transparent',
                        backgroundColor: 'transparent',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        width: 'calc(100% - 40px)',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        className="card-trash-btn"
                        onClick={(e) => handleDeleteCardClick(e, scene)}
                        title="Delete Scene"
                        style={{
                          padding: '3px',
                          borderRadius: '4px',
                          color: '#dc2626',
                          opacity: 0,
                          transition: 'opacity 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Trash2 size={13} />
                      </button>

                      <GripVertical size={14} color="var(--text-muted)" />
                    </div>
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      marginBottom: '16px',
                    }}
                  >
                    <textarea
                      value={scene.summary}
                      onChange={(e) => onUpdateSceneSummary(scene.id, e.target.value)}
                      placeholder="Add summary..."
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        color: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      backgroundColor: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`,
                    }}>
                      {badge.label}
                    </span>

                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-active)',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                    }}>
                      POV {scene.pov}
                    </span>
                  </div>

                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {scene.wordCount.toLocaleString()} words
                  </span>
                </div>
              </div>
            );
          })}

          {/* New Scene Card Button */}
          <div
            onClick={() => onAddScene(currentFolder.id)}
            style={{
              borderRadius: '8px',
              border: '2px dashed var(--border-strong)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              minHeight: '180px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'background var(--transition-fast), border-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Plus size={24} style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>New scene card</span>
          </div>
        </div>
      </div>

      {/* Footer reassurance banner */}
      <div style={{
        padding: '8px 24px',
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        <span>Drag cards to reorder. The binder updates instantly.</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)' }}>
          <CheckCircle2 size={12} />
          <span>Saved</span>
        </div>
      </div>
    </div>
  );
};
