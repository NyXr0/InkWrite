import React, { useState } from 'react';
import { ProjectData } from '../../types/project';
import { ProjectStorage } from '../../core/storage';
import { 
  X, 
  BookOpen, 
  Plus, 
  Trash2, 
  ArrowRight, 
  CheckCircle, 
  Flame, 
  Calendar,
  AlertTriangle 
} from 'lucide-react';

interface ProjectHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectData[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectHubModal: React.FC<ProjectHubModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenNewProject,
  onDeleteProject,
}) => {
  const [projectToDelete, setProjectToDelete] = useState<ProjectData | null>(null);

  if (!isOpen) return null;

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.settings.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '780px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-app)',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '2px',
            }}>
              Your Novel Projects ({projects.length})
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Open an existing manuscript or start a new novel project.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                onClose();
                onOpenNewProject();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <Plus size={15} />
              <span>New Project</span>
            </button>

            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {projects.map((proj) => {
            const isActive = proj.settings.id === activeProjectId;
            const scenes = ProjectStorage.getAllScenes(proj.manuscript);
            const words = ProjectStorage.countTotalWords(proj.manuscript);
            const target = proj.settings.targetWords || 80000;
            const percent = Math.min(100, Math.round((words / target) * 100));

            return (
              <div
                key={proj.settings.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                {/* Top Row: Title & Active Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={18} color="var(--accent-primary)" />
                    <h3 style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}>
                      {proj.settings.title}
                    </h3>
                    {isActive && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: 'var(--accent-pill)',
                        color: 'var(--accent-pill-text)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}>
                        <CheckCircle size={11} />
                        <span>Currently Open</span>
                      </span>
                    )}
                  </div>

                  {/* Actions: Delete & Open */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setProjectToDelete(proj)}
                      title="Delete project"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        color: '#dc2626',
                        backgroundColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                        e.currentTarget.style.borderColor = '#fecaca';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectProject(proj.settings.id);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        backgroundColor: isActive ? 'var(--bg-active)' : 'var(--accent-primary)',
                        color: isActive ? 'var(--text-primary)' : '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <span>{isActive ? 'Continue Writing' : 'Open Project'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Progress Bar & Word count stats */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    marginBottom: '6px',
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {words.toLocaleString()} / {target.toLocaleString()} words ({percent}%)
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
                      width: `${percent}%`,
                      backgroundColor: 'var(--accent-primary)',
                      borderRadius: '3px',
                    }} />
                  </div>
                </div>

                {/* Bottom Row: Metadata Chips */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{scenes.length}</strong> scenes
                  </div>
                  <div>•</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={13} color="var(--accent-secondary)" />
                    <span>Streak {proj.settings.currentStreakDays} days</span>
                  </div>
                  <div>•</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} color="var(--text-muted)" />
                    <span>Deadline: {proj.settings.deadlineDate || 'None'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal for Project Deletion */}
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
              {projects.length === 1 && (
                <span style={{ display: 'block', marginTop: '8px', color: '#b91c1c' }}>
                  Note: This is your only project. Deleting it will create a fresh blank novel project.
                </span>
              )}
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
