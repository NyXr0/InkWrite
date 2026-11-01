import React, { useState } from 'react';
import { SceneItem, LoreEntry, SceneStatus } from '../../types/project';
import { 
  CheckCircle, 
  Target, 
  MessageSquare, 
  User, 
  MapPin, 
  Sparkles, 
  Plus,
  Trash2,
  Check
} from 'lucide-react';

interface InspectorPanelProps {
  scene: SceneItem;
  loreList: LoreEntry[];
  onUpdateStatus: (status: SceneStatus) => void;
  onUpdateSummary: (summary: string) => void;
  onAddComment: (commentText: string) => void;
  onResolveComment: (commentId: string) => void;
  onOpenCodexEntry: (lore: LoreEntry) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  scene,
  loreList,
  onUpdateStatus,
  onUpdateSummary,
  onAddComment,
  onResolveComment,
  onOpenCodexEntry,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const percentTarget = scene.wordTarget > 0 
    ? Math.min(100, Math.round((scene.wordCount / scene.wordTarget) * 100))
    : 0;

  // Find mentioned lore from scene content (either @Name or [[slug]])
  const mentionedLore = loreList.filter((item) => {
    return (
      scene.content.toLowerCase().includes(`@${item.name.toLowerCase()}`) ||
      scene.content.toLowerCase().includes(item.name.toLowerCase()) ||
      scene.content.toLowerCase().includes(item.slug.toLowerCase())
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

  return (
    <aside style={{
      width: '300px',
      height: '100%',
      backgroundColor: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      <div style={{ padding: '16px' }}>
        {/* Header & Status Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            Scene
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

            {scene.label && (
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-active)',
                color: 'var(--text-secondary)',
              }}>
                {scene.label}
              </span>
            )}
          </div>
        </div>

        {/* Synopsis / Summary */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '6px',
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
              fontSize: '13px',
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
          marginBottom: '20px',
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
              {scene.wordCount.toLocaleString()} of {scene.wordTarget.toLocaleString()}
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

        {/* Mentioned Here (Story Bible) */}
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
              Mentioned here
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {mentionedLore.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {mentionedLore.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
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
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--accent-pill)',
                      color: 'var(--accent-pill-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}>
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {item.role || item.category}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div>
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
              Comments ({scene.comments.length})
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
                  style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--text-muted)' }}
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
                  }}
                >
                  Post
                </button>
              </div>
            </form>
          )}

          {/* List of review comments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {scene.comments.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
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
      </div>
    </aside>
  );
};
