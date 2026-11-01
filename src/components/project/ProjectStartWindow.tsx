import React, { useState, useRef } from 'react';
import { ProjectData, ThemeMode } from '../../types/project';
import { ProjectStorage } from '../../core/storage';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Flame, 
  Calendar, 
  Sun, 
  Moon, 
  Coffee,
  Sparkles,
  AlertTriangle,
  Palette,
  Upload
} from 'lucide-react';

interface ProjectStartWindowProps {
  projects: ProjectData[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: (params: {
    title: string;
    targetWords: number;
    dailyGoalWords: number;
    deadlineDate: string;
    pov: string;
  }) => void;
  onDeleteProject: (projectId: string) => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onOpenAppearance?: () => void;
  onImportProject?: (project: ProjectData) => void;
}

export const ProjectStartWindow: React.FC<ProjectStartWindowProps> = ({
  projects,
  onOpenProject,
  onCreateProject,
  onDeleteProject,
  theme,
  onSelectTheme,
  onOpenAppearance,
  onImportProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [targetWords, setTargetWords] = useState(80000);
  const [dailyGoalWords, setDailyGoalWords] = useState(1000);
  const [pov, setPov] = useState('Protagonist');
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });
  const [projectToDelete, setProjectToDelete] = useState<ProjectData | null>(null);


  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = event.target?.result as string;
        const parsed = JSON.parse(rawJson);

        if (!parsed || !parsed.settings || !parsed.manuscript || !Array.isArray(parsed.manuscript)) {
          alert('Invalid Inkwell project schema. Missing settings or manuscript arrays.');
          return;
        }

        if (!parsed.settings.id) {
          parsed.settings.id = 'proj-' + Date.now();
        }

        if (onImportProject) {
          onImportProject(parsed as ProjectData);
          onOpenProject(parsed.settings.id);
        }
      } catch (err: any) {
        alert(err.message || 'Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateProject({
      title: title.trim(),
      targetWords: Number(targetWords) || 80000,
      dailyGoalWords: Number(dailyGoalWords) || 1000,
      deadlineDate,
      pov: pov.trim() || 'Protagonist',
    });

    setTitle('');
    setIsCreating(false);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.settings.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      overflowY: 'auto',
      userSelect: 'none',
      position: 'relative',
    }}>
      {/* Top Right Controls: Appearance & Themes */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {onImportProject && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json,application/json"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Restore / Import project from JSON backup file"
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-active)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-active)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Upload size={14} />
              <span>Import Backup</span>
            </button>
          </>
        )}

        {onOpenAppearance && (
          <button
            onClick={onOpenAppearance}
            title="Customize Appearance & Background (Wallpaper, Fonts, Colors)..."
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-active)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-active)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Palette size={14} />
            <span>Appearance</span>
          </button>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-active)',
          borderRadius: '6px',
          padding: '2px',
        }}>
        <button
          onClick={() => onSelectTheme('paper')}
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
      </div>

      {/* Main Start Window Container */}
      <div style={{
        width: '100%',
        maxWidth: '820px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}>
        {/* Hero Branding Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'var(--accent-pill)',
            color: 'var(--accent-primary)',
            marginBottom: '14px',
          }}>
            <BookOpen size={28} />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '36px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}>
            Inkwell
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: '1.5',
          }}>
            A local-first, plain-text novel-writing studio. Choose an existing project to continue writing, or start a new novel.
          </p>
        </div>

        {/* Action Panel / Create Form or Action Cards */}
        {isCreating ? (
          /* Create Project Form */
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            padding: '28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Start New Novel Project
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                style={{ fontSize: '13px', color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Silver Key, Chronicles of Aethelgard..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Protagonist / Main POV Name
                </label>
                <input
                  type="text"
                  value={pov}
                  onChange={(e) => setPov(e.target.value)}
                  placeholder="e.g. Mara, Roland..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Target Words ({targetWords.toLocaleString()})
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={targetWords}
                    onChange={(e) => setTargetWords(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {[50000, 80000, 120000].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setTargetWords(num)}
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-active)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {num / 1000}k
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Daily Goal ({dailyGoalWords.toLocaleString()} w/day)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={dailyGoalWords}
                    onChange={(e) => setDailyGoalWords(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {[500, 1000, 1500].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setDailyGoalWords(num)}
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-active)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Target Deadline Date
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: title.trim() ? 'var(--accent-primary)' : 'var(--border-strong)',
                    color: '#fff',
                    cursor: title.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={14} />
                  <span>Start Project</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Default Start View: Big Create Card + Existing Projects */
          <>
            {/* Create Project Trigger Banner */}
            <div
              onClick={() => setIsCreating(true)}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '10px',
                border: '2px dashed var(--accent-primary)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-pill)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Plus size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Start a New Novel Project
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Initialize a fresh Markdown manuscript, story bible, and timeline.
                  </p>
                </div>
              </div>

              <div style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>Create Novel</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Existing Projects List */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}>
                <h2 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                }}>
                  Existing Novels ({projects.length})
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {projects.map((proj) => {
                  const words = ProjectStorage.countTotalWords(proj.manuscript);
                  const scenes = ProjectStorage.getAllScenes(proj.manuscript);
                  const target = proj.settings.targetWords || 80000;
                  const percent = Math.min(100, Math.round((words / target) * 100));

                  return (
                    <div
                      key={proj.settings.id}
                      onClick={() => onOpenProject(proj.settings.id)}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <BookOpen size={18} color="var(--accent-primary)" />
                          <h3 style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '17px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}>
                            {proj.settings.title}
                          </h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(proj);
                            }}
                            title="Delete project"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              color: '#dc2626',
                              backgroundColor: 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenProject(proj.settings.id);
                            }}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--accent-primary)',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Open Project</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          marginBottom: '4px',
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {words.toLocaleString()} / {target.toLocaleString()} words ({percent}%)
                          </span>
                        </div>
                        <div style={{
                          height: '5px',
                          backgroundColor: 'var(--bg-active)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${percent}%`,
                            backgroundColor: 'var(--accent-primary)',
                            borderRadius: '3px',
                          }} />
                        </div>
                      </div>

                      {/* Footer Details */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                      }}>
                        <span>{scenes.length} scenes</span>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Flame size={12} color="var(--accent-secondary)" />
                          <span>Streak {proj.settings.currentStreakDays} days</span>
                        </div>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={12} color="var(--text-muted)" />
                          <span>Deadline: {proj.settings.deadlineDate || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div
          onClick={() => setProjectToDelete(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '420px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Delete Project?
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              Are you sure you want to delete <strong>"{projectToDelete.settings.title}"</strong>? All scenes, story bible entries, and snapshots will be permanently removed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setProjectToDelete(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#dc2626',
                  color: '#fff',
                }}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
