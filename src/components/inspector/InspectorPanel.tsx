import React, { useState } from 'react';
import { SceneItem, LoreEntry, SceneStatus, Snapshot, LoreCategory } from '../../types/project';
import { CODEX_CATEGORIES } from '../../core/codexSchema';
import { 
  CheckCircle, 
  Target, 
  MessageSquare, 
  User, 
  MapPin, 
  Sparkles, 
  Package,
  Shield,
  Plus,
  Trash2,
  Check,
  History,
  RotateCcw,
  Eye,
  X
} from 'lucide-react';

interface InspectorPanelProps {
  scene: SceneItem;
  loreList: LoreEntry[];
  onUpdateTitle: (newTitle: string) => void;
  onUpdateStatus: (status: SceneStatus) => void;
  onUpdateSummary: (summary: string) => void;
  onAddComment: (commentText: string) => void;
  onResolveComment: (commentId: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onOpenCodexEntry: (lore: LoreEntry) => void;
  onDeleteScene: (sceneId: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  scene,
  loreList,
  onUpdateTitle,
  onUpdateStatus,
  onUpdateSummary,
  onAddComment,
  onResolveComment,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onOpenCodexEntry,
  onDeleteScene,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<Snapshot | null>(null);

  const percentTarget = scene.wordTarget > 0 
    ? Math.min(100, Math.round((scene.wordCount / scene.wordTarget) * 100))
    : 0;

  // Find mentioned lore from scene content (either @Name or [[slug]])
  const mentionedLore = loreList.filter((item) => {
    const text = scene.content.toLowerCase();
    const isPov = scene.pov && scene.pov.toLowerCase() === item.name.toLowerCase();
    const isLocation = scene.locations && scene.locations.some((l) => l.toLowerCase() === item.name.toLowerCase());
    if (isPov || isLocation) return true;

    return (
      text.includes(`@${item.name.toLowerCase()}`) ||
      text.includes(`[[${item.slug.toLowerCase()}]]`) ||
      text.includes(item.name.toLowerCase()) ||
      (item.aliases && item.aliases.some((a) => text.includes(a.toLowerCase())))
    );
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

  const statusStyle = getStatusBadgeStyle(scene.status);

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
    setIsAddingComment(false);
  };

  const handleDeleteCurrentScene = () => {
    const confirmed = window.confirm(`Delete scene "${scene.title}"? This cannot be undone.`);
    if (confirmed) {
      onDeleteScene(scene.id);
    }
  };

  return (
    <aside style={{
      width: '310px',
      height: '100%',
      backgroundColor: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      flexShrink: 0,
      userSelect: 'none',
      position: 'relative',
    }}>
      <div style={{ padding: '16px' }}>
        {/* Header & Status Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            Scene Inspector
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Status Dropdown */}
            <select
              value={scene.status}
              onChange={(e) => onUpdateStatus(e.target.value as SceneStatus)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
                border: `1px solid ${statusStyle.border}`,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="idea">Idea</option>
              <option value="first-draft">First draft</option>
              <option value="second-draft">Second draft</option>
              <option value="revised">Revised</option>
              <option value="final">Final</option>
            </select>
          </div>
        </div>

        {/* Editable Scene Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}>
            Scene Title
          </label>
          <input
            type="text"
            value={scene.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="Scene title..."
            style={{
              width: '100%',
              fontSize: '13px',
              fontWeight: 600,
              padding: '6px 8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-serif)',
            }}
          />
        </div>

        {/* Synopsis / Summary */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}>
            Synopsis
          </label>
          <textarea
            value={scene.summary}
            onChange={(e) => onUpdateSummary(e.target.value)}
            placeholder="Add a brief scene synopsis..."
            rows={3}
            style={{
              width: '100%',
              fontSize: '12px',
              lineHeight: '1.4',
              padding: '8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        {/* Word Target Progress */}
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            marginBottom: '6px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <Target size={14} color="var(--accent-primary)" />
              <span style={{ fontWeight: 500 }}>Word target</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {scene.wordCount.toLocaleString()} / {scene.wordTarget.toLocaleString()}
            </span>
          </div>

          <div style={{
            height: '6px',
            backgroundColor: 'var(--bg-active)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '4px',
          }}>
            <div style={{
              height: '100%',
              width: `${percentTarget}%`,
              backgroundColor: 'var(--accent-primary)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
            {percentTarget}% complete
          </div>
        </div>

        {/* Snapshots / Version History Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <History size={13} color="var(--accent-primary)" />
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                Snapshots ({scene.snapshots?.length || 0})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(!scene.snapshots || scene.snapshots.length === 0) ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2px 0' }}>
                No snapshots saved yet. Click the camera icon in the editor toolbar to create one.
              </div>
            ) : (
              scene.snapshots.map((snap) => (
                <div
                  key={snap.id}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {snap.note || 'Snapshot'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {snap.wordCount?.toLocaleString() || 0}w
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {snap.timestamp}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      onClick={() => setPreviewSnapshot(snap)}
                      title="Preview snapshot text"
                      style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Eye size={10} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(`Restore this snapshot from ${snap.timestamp}? Current scene text will be replaced.`);
                        if (confirmed) onRestoreSnapshot(snap.id);
                      }}
                      title="Restore this version into the editor"
                      style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: 'var(--accent-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <RotateCcw size={10} />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => onDeleteSnapshot(snap.id)}
                      title="Delete snapshot"
                      style={{
                        padding: '2px 4px',
                        borderRadius: '3px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mentioned Lore / Story Bible */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              Mentioned in Scene ({mentionedLore.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {mentionedLore.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2px 0' }}>
                Type @ in the editor to link characters or lore.
              </div>
            ) : (
              mentionedLore.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onOpenCodexEntry(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.imageUrl ? (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: `1.5px solid ${(CODEX_CATEGORIES[item.category] || CODEX_CATEGORIES.character).color}`,
                        backgroundColor: 'var(--bg-app)',
                        flexShrink: 0,
                      }}>
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '4px',
                        backgroundColor: (CODEX_CATEGORIES[item.category] || CODEX_CATEGORIES.character).bgLight,
                        border: `1px solid ${(CODEX_CATEGORIES[item.category] || CODEX_CATEGORIES.character).borderLight}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {item.category === 'character' && <User size={11} color={CODEX_CATEGORIES.character.color} />}
                        {item.category === 'location' && <MapPin size={11} color={CODEX_CATEGORIES.location.color} />}
                        {item.category === 'lore' && <Sparkles size={11} color={CODEX_CATEGORIES.lore.color} />}
                        {item.category === 'item' && <Package size={11} color={CODEX_CATEGORIES.item.color} />}
                        {item.category === 'faction' && <Shield size={11} color={CODEX_CATEGORIES.faction.color} />}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {item.role || (CODEX_CATEGORIES[item.category] || CODEX_CATEGORIES.character).name}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              Comments ({scene.comments?.length || 0})
            </span>
            <button
              onClick={() => setIsAddingComment(!isAddingComment)}
              title="Add Review Comment"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: 'var(--accent-primary)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Plus size={12} />
              <span>Add</span>
            </button>
          </div>

          {/* Add comment form */}
          {isAddingComment && (
            <form onSubmit={handleAddCommentSubmit} style={{ marginBottom: '10px' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write feedback..."
                rows={2}
                autoFocus
                style={{
                  width: '100%',
                  fontSize: '12px',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '4px',
                  outline: 'none',
                  marginBottom: '4px',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingComment(false)}
                  style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Post
                </button>
              </div>
            </form>
          )}

          {/* List of review comments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(!scene.comments || scene.comments.length === 0) ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '2px 0' }}>
                No active review comments.
              </div>
            ) : (
              scene.comments.map((comm) => (
                <div
                  key={comm.id}
                  style={{
                    padding: '10px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '3px solid var(--accent-secondary)',
                  }}
                >
                  {comm.anchorText && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      marginBottom: '4px',
                      borderBottom: '1px dashed var(--border-subtle)',
                      paddingBottom: '4px',
                    }}>
                      "{comm.anchorText}"
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4', marginBottom: '6px' }}>
                    {comm.comment}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                  }}>
                    <span>{comm.author} • {comm.createdAt}</span>
                    <button
                      onClick={() => onResolveComment(comm.id)}
                      title="Resolve comment"
                      style={{
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      <Check size={11} />
                      <span>Resolve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Scene Action */}
        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={handleDeleteCurrentScene}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={13} />
            <span>Delete Scene</span>
          </button>
        </div>
      </div>

      {/* Snapshot Preview Modal Dialog */}
      {previewSnapshot && (
        <div
          onClick={() => setPreviewSnapshot(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '600px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Snapshot: {previewSnapshot.note || 'Version Preview'}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Captured {previewSnapshot.timestamp} • {previewSnapshot.wordCount?.toLocaleString() || 0} words
                </div>
              </div>
              <button onClick={() => setPreviewSnapshot(null)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              {previewSnapshot.content || '(Snapshot content is empty)'}
            </div>

            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              backgroundColor: 'var(--bg-app)',
            }}>
              <button
                onClick={() => setPreviewSnapshot(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const confirmed = window.confirm(`Restore this snapshot from ${previewSnapshot.timestamp}? Current scene text will be replaced.`);
                  if (confirmed) {
                    onRestoreSnapshot(previewSnapshot.id);
                    setPreviewSnapshot(null);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Restore This Version</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
