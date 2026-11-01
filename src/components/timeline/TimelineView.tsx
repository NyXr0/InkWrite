import React, { useState } from 'react';
import { TimelineEvent, SceneItem } from '../../types/project';
import { 
  Calendar, 
  Plus, 
  Clock, 
  AlertCircle, 
  User, 
  ArrowRight, 
  Trash2,
  Edit2,
  X,
  FileText
} from 'lucide-react';

interface TimelineViewProps {
  events: TimelineEvent[];
  scenes?: SceneItem[];
  onSelectScene: (sceneId: string) => void;
  onAddEvent: (event: TimelineEvent) => void;
  onUpdateEvent: (event: TimelineEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  scenes = [],
  onSelectScene,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const [selectedLane, setSelectedLane] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formLane, setFormLane] = useState('Main Plot');
  const [formSummary, setFormSummary] = useState('');
  const [formCharacters, setFormCharacters] = useState('');
  const [formSceneId, setFormSceneId] = useState<string>('');
  const [formConflict, setFormConflict] = useState('');

  const lanes = Array.from(new Set(events.map((e) => e.lane).filter(Boolean)));

  const filteredEvents = events.filter((e) => {
    if (selectedLane !== 'all' && e.lane !== selectedLane) return false;
    return true;
  });

  const openCreateModal = () => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDate(`Day ${events.length + 1}, 09:00`);
    setFormLane(lanes[0] || 'Main Plot');
    setFormSummary('');
    setFormCharacters('');
    setFormSceneId(scenes[0]?.id || '');
    setFormConflict('');
    setIsModalOpen(true);
  };

  const openEditModal = (evt: TimelineEvent) => {
    setEditingEventId(evt.id);
    setFormTitle(evt.title);
    setFormDate(evt.date);
    setFormLane(evt.lane);
    setFormSummary(evt.summary);
    setFormCharacters(evt.characters.join(', '));
    setFormSceneId(evt.sceneId || '');
    setFormConflict(evt.flagConflict || '');
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const chars = formCharacters
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const eventPayload: TimelineEvent = {
      id: editingEventId || `time-${Date.now()}`,
      title: formTitle.trim(),
      date: formDate.trim() || 'Day 1',
      lane: formLane.trim() || 'Main Plot',
      summary: formSummary.trim(),
      characters: chars,
      sceneId: formSceneId || undefined,
      flagConflict: formConflict.trim() || undefined,
    };

    if (editingEventId) {
      onUpdateEvent(eventPayload);
    } else {
      onAddEvent(eventPayload);
    }

    setIsModalOpen(false);
  };

  const handleDeleteEventClick = (e: React.MouseEvent, evt: TimelineEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete timeline event "${evt.title}"?`);
    if (confirmed) {
      onDeleteEvent(evt.id);
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
      {/* Header Bar */}
      <div style={{
        padding: '16px 32px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <div>
          <h2 style={{
            fontSize: '18px',
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            Story Timeline & Chronology
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {events.length} event{events.length === 1 ? '' : 's'} across {lanes.length} narrative lane{lanes.length === 1 ? '' : 's'}.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Lane filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSelectedLane('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                backgroundColor: selectedLane === 'all' ? 'var(--bg-active)' : 'transparent',
                color: selectedLane === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: selectedLane === 'all' ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              All Lanes
            </button>
            {lanes.map((lane) => (
              <button
                key={lane}
                onClick={() => setSelectedLane(lane)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: selectedLane === lane ? 'var(--bg-active)' : 'transparent',
                  color: selectedLane === lane ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: selectedLane === lane ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {lane}
              </button>
            ))}
          </div>

          <button
            onClick={openCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 48px',
      }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Calendar size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No timeline events yet
            </h3>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>
              Add story events to track chronology, subplots, and continuity.
            </p>
            <button
              onClick={openCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>Create First Event</span>
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: '840px', margin: '0 auto', position: 'relative' }}>
            {/* Central Vertical Timeline Rule */}
            <div style={{
              position: 'absolute',
              left: '20px',
              top: '16px',
              bottom: '16px',
              width: '2px',
              backgroundColor: 'var(--border-strong)',
            }} />

            {/* Event Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    position: 'relative',
                    paddingLeft: '48px',
                  }}
                >
                  {/* Node dot on the vertical line */}
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '16px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface)',
                    border: '3px solid var(--accent-primary)',
                    boxShadow: '0 0 0 3px var(--bg-app)',
                    zIndex: 2,
                  }} />

                  {/* Event Card */}
                  <div style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    padding: '16px 20px',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          backgroundColor: 'var(--accent-pill)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}>
                          {evt.date}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                        }}>
                          Lane: {evt.lane}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {evt.sceneId && (
                          <button
                            onClick={() => onSelectScene(evt.sceneId!)}
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
                            <span>Open scene</span>
                            <ArrowRight size={12} />
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(evt)}
                          title="Edit event"
                          style={{
                            padding: '3px',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={(e) => handleDeleteEventClick(e, evt)}
                          title="Delete event"
                          style={{
                            padding: '3px',
                            borderRadius: '4px',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: '16px',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}>
                      {evt.title}
                    </h3>

                    {evt.summary && (
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        marginBottom: '12px',
                      }}>
                        {evt.summary}
                      </p>
                    )}

                    {/* Character chips */}
                    {evt.characters && evt.characters.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {evt.characters.map((char) => (
                          <span
                            key={char}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: 'var(--bg-active)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <User size={10} />
                            <span>{char}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Continuity Conflict Warning if any */}
                    {evt.flagConflict && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <AlertCircle size={14} />
                        <span>{evt.flagConflict}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '500px',
              maxWidth: '92vw',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {editingEventId ? 'Edit Timeline Event' : 'Add New Timeline Event'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Discovery of the ancient seal"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Story Date / Time
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="e.g. Day 1, 09:00"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Plotline / Lane
                  </label>
                  <input
                    type="text"
                    value={formLane}
                    onChange={(e) => setFormLane(e.target.value)}
                    placeholder="e.g. Main Plot"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Summary / What Happens
                </label>
                <textarea
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Briefly describe what occurs at this chronological point..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Characters (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formCharacters}
                    onChange={(e) => setFormCharacters(e.target.value)}
                    placeholder="e.g. Mara, Iven"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Linked Scene (Optional)
                  </label>
                  <select
                    value={formSceneId}
                    onChange={(e) => setFormSceneId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- None --</option>
                    {scenes.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>
                  Continuity Conflict Flag (Optional)
                </label>
                <input
                  type="text"
                  value={formConflict}
                  onChange={(e) => setFormConflict(e.target.value)}
                  placeholder="e.g. Mara was wounded in scene 2; should not be running here"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #fecaca',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: 'var(--accent-primary)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {editingEventId ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
