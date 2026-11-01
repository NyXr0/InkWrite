import React, { useState } from 'react';
import { TimelineEvent } from '../../types/project';
import { Calendar, Plus, Clock, AlertCircle, User, ArrowRight } from 'lucide-react';

interface TimelineViewProps {
  events: TimelineEvent[];
  onSelectScene: (sceneId: string) => void;
  onAddEvent: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  onSelectScene,
  onAddEvent,
}) => {
  const [selectedLane, setSelectedLane] = useState<string>('all');

  const lanes = Array.from(new Set(events.map((e) => e.lane)));

  const filteredEvents = events.filter((e) => {
    if (selectedLane !== 'all' && e.lane !== selectedLane) return false;
    return true;
  });

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
            Track chronological narrative order and continuity across plotlines.
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
                }}
              >
                {lane}
              </button>
            ))}
          </div>

          <button
            onClick={onAddEvent}
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
                        }}
                      >
                        <span>Open scene</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
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

                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                    marginBottom: '12px',
                  }}>
                    {evt.summary}
                  </p>

                  {/* Character chips */}
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
      </div>
    </div>
  );
};
