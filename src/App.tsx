import React, { useState, useEffect, useMemo } from 'react';
import { 
  ProjectData, 
  MainView, 
  ThemeMode, 
  SceneItem, 
  FolderItem, 
  LoreEntry, 
  SceneStatus,
  LoreCategory 
} from './types/project';
import { ProjectStorage } from './core/storage';
import { TopNavBar } from './components/layout/TopNavBar';
import { StatusBar } from './components/layout/StatusBar';
import { ManuscriptTree } from './components/binder/ManuscriptTree';
import { CodeMirrorEditor } from './components/editor/CodeMirrorEditor';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { CorkboardView } from './components/corkboard/CorkboardView';
import { FocusModeView } from './components/focus/FocusModeView';
import { InsightsView } from './components/insights/InsightsView';
import { TimelineView } from './components/timeline/TimelineView';
import { CodexView } from './components/codex/CodexView';
import { CommandPalette } from './components/palette/CommandPalette';
import { ProjectHubModal } from './components/project/ProjectHubModal';
import { NewProjectModal } from './components/project/NewProjectModal';
import './styles/theme.css';

export const App: React.FC = () => {
  // Multi-project collection
  const [projects, setProjects] = useState<ProjectData[]>(() => ProjectStorage.loadAllProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => ProjectStorage.loadActiveProjectId());

  const [theme, setTheme] = useState<ThemeMode>('paper');
  const [currentView, setCurrentView] = useState<MainView>('write');

  // Active scene state
  const [activeSceneId, setActiveSceneId] = useState<string>('scene-1-2');
  const [referenceSceneId, setReferenceSceneId] = useState<string>('scene-1-1');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [isProjectHubOpen, setIsProjectHubOpen] = useState<boolean>(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState<boolean>(false);
  const [selectedCodexId, setSelectedCodexId] = useState<string | undefined>(undefined);

  // Sync active project
  const activeProject = useMemo(() => {
    return projects.find((p) => p.settings.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  // Sync theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist collection and active project ID
  useEffect(() => {
    ProjectStorage.saveAllProjects(projects);
  }, [projects]);

  useEffect(() => {
    if (activeProject) {
      ProjectStorage.saveActiveProjectId(activeProject.settings.id);
    }
  }, [activeProject]);

  // Auto-select first scene when project changes
  useEffect(() => {
    if (activeProject) {
      const scenes = ProjectStorage.getAllScenes(activeProject.manuscript);
      if (scenes.length > 0) {
        const found = ProjectStorage.findScene(activeProject.manuscript, activeSceneId);
        if (!found) {
          setActiveSceneId(scenes[0].id);
          if (scenes.length > 1) {
            setReferenceSceneId(scenes[1].id);
          }
        }
      }
    }
  }, [activeProjectId, activeProject]);

  // Helper to update active project in collection
  const updateActiveProject = (updater: (prevProj: ProjectData) => ProjectData) => {
    setProjects((prevList) => {
      return prevList.map((p) => {
        if (p.settings.id === activeProject.settings.id) {
          return updater(p);
        }
        return p;
      });
    });
  };

  // Switch to another project
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const targetProj = projects.find((p) => p.settings.id === projectId);
    if (targetProj) {
      const scenes = ProjectStorage.getAllScenes(targetProj.manuscript);
      if (scenes.length > 0) {
        setActiveSceneId(scenes[0].id);
        setReferenceSceneId(scenes[1]?.id || scenes[0].id);
      }
    }
    setIsSplitView(false);
  };

  // Create new project
  const handleCreateProject = (params: {
    title: string;
    targetWords: number;
    dailyGoalWords: number;
    deadlineDate: string;
    pov: string;
  }) => {
    const newProj = ProjectStorage.createProject(params);
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.settings.id);
    const firstScene = ProjectStorage.getAllScenes(newProj.manuscript)[0];
    if (firstScene) {
      setActiveSceneId(firstScene.id);
    }
    setCurrentView('write');
  };

  // Delete project
  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      const replacement = ProjectStorage.createProject({ title: 'New Novel' });
      setProjects([replacement]);
      setActiveProjectId(replacement.settings.id);
      return;
    }

    const remaining = projects.filter((p) => p.settings.id !== projectId);
    setProjects(remaining);

    if (activeProjectId === projectId) {
      setActiveProjectId(remaining[0].settings.id);
    }
  };

  // Delete scene
  const handleDeleteScene = (sceneId: string) => {
    updateActiveProject((prev) => {
      const filterChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items
          .filter((it) => it.id !== sceneId)
          .map((it) => {
            if (it.type === 'folder') {
              return {
                ...it,
                order: it.order.filter((id) => id !== sceneId),
                children: filterChildren(it.children),
              };
            }
            return it;
          });
      };

      const updatedManuscript = prev.manuscript.map((f) => ({
        ...f,
        children: filterChildren(f.children),
      }));

      // Pick next scene if current was deleted
      const remainingScenes = ProjectStorage.getAllScenes(updatedManuscript);
      if (activeSceneId === sceneId && remainingScenes.length > 0) {
        setActiveSceneId(remainingScenes[0].id);
      }

      return {
        ...prev,
        manuscript: updatedManuscript,
      };
    });
  };

  // Delete folder
  const handleDeleteFolder = (folderId: string) => {
    updateActiveProject((prev) => {
      const filterChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items
          .filter((it) => it.id !== folderId)
          .map((it) => {
            if (it.type === 'folder') {
              return {
                ...it,
                order: it.order.filter((id) => id !== folderId),
                children: filterChildren(it.children),
              };
            }
            return it;
          });
      };

      const updatedManuscript = prev.manuscript
        .filter((f) => f.id !== folderId)
        .map((f) => ({
          ...f,
          children: filterChildren(f.children),
        }));

      const remainingScenes = ProjectStorage.getAllScenes(updatedManuscript);
      if (remainingScenes.length > 0) {
        const stillExists = remainingScenes.some((s) => s.id === activeSceneId);
        if (!stillExists) {
          setActiveSceneId(remainingScenes[0].id);
        }
      }

      return {
        ...prev,
        manuscript: updatedManuscript,
      };
    });
  };

  // Delete lore entry
  const handleDeleteLore = (loreId: string) => {
    updateActiveProject((prev) => ({
      ...prev,
      lore: prev.lore.filter((l) => l.id !== loreId),
    }));
  };

  // Delete timeline event
  const handleDeleteEvent = (eventId: string) => {
    updateActiveProject((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((e) => e.id !== eventId),
    }));
  };

  // Active scene
  const activeScene = useMemo(() => {
    return ProjectStorage.findScene(activeProject.manuscript, activeSceneId) || 
      ProjectStorage.getAllScenes(activeProject.manuscript)[0];
  }, [activeProject.manuscript, activeSceneId]);

  // Reference scene for split view
  const referenceScene = useMemo(() => {
    return ProjectStorage.findScene(activeProject.manuscript, referenceSceneId) || null;
  }, [activeProject.manuscript, referenceSceneId]);

  // Total words
  const totalWords = useMemo(() => {
    return ProjectStorage.countTotalWords(activeProject.manuscript);
  }, [activeProject.manuscript]);

  const allScenes = useMemo(() => {
    return ProjectStorage.getAllScenes(activeProject.manuscript);
  }, [activeProject.manuscript]);

  // Active folder for corkboard
  const activeFolder = useMemo(() => {
    for (const folder of activeProject.manuscript) {
      for (const item of folder.children) {
        if (item.type === 'folder') {
          for (const scene of item.children) {
            if (scene.id === activeSceneId) return item;
          }
        }
      }
    }
    const p1 = activeProject.manuscript[0];
    if (p1 && p1.children[0] && p1.children[0].type === 'folder') {
      return p1.children[0] as FolderItem;
    }
    return activeProject.manuscript[0];
  }, [activeProject.manuscript, activeSceneId]);

  // Update scene text content
  const handleUpdateSceneContent = (newContent: string) => {
    const words = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
    const delta = words - (activeScene?.wordCount || 0);

    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'scene' && it.id === activeSceneId) {
            return {
              ...it,
              content: newContent,
              wordCount: words,
            };
          } else if (it.type === 'folder') {
            return {
              ...it,
              children: updateChildren(it.children),
            };
          }
          return it;
        });
      };

      return {
        ...prev,
        manuscript: prev.manuscript.map((f) => ({
          ...f,
          children: updateChildren(f.children),
        })),
        settings: {
          ...prev.settings,
          todayWords: Math.max(0, prev.settings.todayWords + Math.max(0, delta)),
        },
      };
    });
  };

  // Update scene status
  const handleUpdateSceneStatus = (status: SceneStatus) => {
    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'scene' && it.id === activeSceneId) {
            return { ...it, status };
          } else if (it.type === 'folder') {
            return { ...it, children: updateChildren(it.children) };
          }
          return it;
        });
      };

      return {
        ...prev,
        manuscript: prev.manuscript.map((f) => ({
          ...f,
          children: updateChildren(f.children),
        })),
      };
    });
  };

  // Update scene summary
  const handleUpdateSceneSummary = (sceneId: string, summary: string) => {
    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'scene' && it.id === sceneId) {
            return { ...it, summary };
          } else if (it.type === 'folder') {
            return { ...it, children: updateChildren(it.children) };
          }
          return it;
        });
      };

      return {
        ...prev,
        manuscript: prev.manuscript.map((f) => ({
          ...f,
          children: updateChildren(f.children),
        })),
      };
    });
  };

  // Add review comment
  const handleAddComment = (commentText: string) => {
    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'scene' && it.id === activeSceneId) {
            return {
              ...it,
              comments: [
                ...it.comments,
                {
                  id: `comm-${Date.now()}`,
                  sceneId: activeSceneId,
                  anchorText: '',
                  comment: commentText,
                  author: 'Author',
                  resolved: false,
                  createdAt: 'Just now',
                },
              ],
            };
          } else if (it.type === 'folder') {
            return { ...it, children: updateChildren(it.children) };
          }
          return it;
        });
      };

      return {
        ...prev,
        manuscript: prev.manuscript.map((f) => ({
          ...f,
          children: updateChildren(f.children),
        })),
      };
    });
  };

  // Resolve comment
  const handleResolveComment = (commentId: string) => {
    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'scene' && it.id === activeSceneId) {
            return {
              ...it,
              comments: it.comments.filter((c) => c.id !== commentId),
            };
          } else if (it.type === 'folder') {
            return { ...it, children: updateChildren(it.children) };
          }
          return it;
        });
      };

      return {
        ...prev,
        manuscript: prev.manuscript.map((f) => ({
          ...f,
          children: updateChildren(f.children),
        })),
      };
    });
  };

  // Take snapshot
  const handleTakeSnapshot = () => {
    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'scene' && it.id === activeSceneId) {
            return {
              ...it,
              snapshots: [
                {
                  id: `snap-${Date.now()}`,
                  sceneId: activeSceneId,
                  timestamp: 'Just now',
                  note: 'Manual snapshot',
                  content: it.content,
                  wordCount: it.wordCount,
                },
                ...it.snapshots,
              ],
            };
          } else if (it.type === 'folder') {
            return { ...it, children: updateChildren(it.children) };
          }
          return it;
        });
      };

      return {
        ...prev,
        manuscript: prev.manuscript.map((f) => ({
          ...f,
          children: updateChildren(f.children),
        })),
      };
    });
  };

  // Add scene
  const handleAddScene = (folderId: string) => {
    const newId = `scene-${Date.now()}`;
    const newScene: SceneItem = {
      id: newId,
      type: 'scene',
      title: 'Untitled Scene',
      summary: '',
      status: 'idea',
      pov: activeScene?.pov || 'Protagonist',
      wordCount: 0,
      wordTarget: 2000,
      comments: [],
      snapshots: [],
      content: '',
    };

    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'folder' && it.id === folderId) {
            return {
              ...it,
              order: [...it.order, newId],
              children: [...it.children, newScene],
            };
          } else if (it.type === 'folder') {
            return { ...it, children: updateChildren(it.children) };
          }
          return it;
        });
      };

      return {
        ...prev,
        manuscript: prev.manuscript.map((f) => {
          if (f.id === folderId) {
            return { ...f, order: [...f.order, newId], children: [...f.children, newScene] };
          }
          return { ...f, children: updateChildren(f.children) };
        }),
      };
    });

    setActiveSceneId(newId);
    if (currentView !== 'write') setCurrentView('write');
  };

  // Reorder scenes from corkboard
  const handleReorderScenes = (reordered: SceneItem[]) => {
    updateActiveProject((prev) => {
      const updateFolderChildren = (folder: FolderItem): FolderItem => {
        if (folder.id === activeFolder.id) {
          const nonScenes = folder.children.filter((c) => c.type !== 'scene');
          return {
            ...folder,
            order: reordered.map((s) => s.id),
            children: [...reordered, ...nonScenes],
          };
        }
        return {
          ...folder,
          children: folder.children.map((c) => (c.type === 'folder' ? updateFolderChildren(c) : c)),
        };
      };

      return {
        ...prev,
        manuscript: prev.manuscript.map(updateFolderChildren),
      };
    });
  };

  // Add lore
  const handleAddLore = (category: LoreCategory) => {
    const newLore: LoreEntry = {
      id: `lore-${Date.now()}`,
      slug: `new-${category}-${Date.now().toString().slice(-4)}`,
      name: `New ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      category,
      summary: '',
      content: `### New ${category}\n\nAdd details and notes here.`,
    };

    updateActiveProject((prev) => ({
      ...prev,
      lore: [newLore, ...prev.lore],
    }));
    setSelectedCodexId(newLore.id);
  };

  // Update lore
  const handleUpdateLore = (updated: LoreEntry) => {
    updateActiveProject((prev) => ({
      ...prev,
      lore: prev.lore.map((l) => (l.id === updated.id ? updated : l)),
    }));
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-app)',
    }}>
      {/* Top Navigation */}
      <TopNavBar
        currentView={currentView}
        onSelectView={setCurrentView}
        projectTitle={activeProject.settings.title}
        theme={theme}
        onSelectTheme={setTheme}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onEnterFocusMode={() => setIsFocusMode(true)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onOpenProjectHub={() => setIsProjectHubOpen(true)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onDeleteProject={handleDeleteProject}
      />

      {/* Main Workspace Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Binder / Manuscript Tree (visible in Write, Corkboard) */}
        {currentView === 'write' && (
          <ManuscriptTree
            manuscript={activeProject.manuscript}
            activeSceneId={activeSceneId}
            onSelectScene={setActiveSceneId}
            onAddScene={handleAddScene}
            onDeleteScene={handleDeleteScene}
            onDeleteFolder={handleDeleteFolder}
            onOpenCodex={() => setCurrentView('codex')}
            totalWords={totalWords}
            targetWords={activeProject.settings.targetWords}
          />
        )}

        {/* Center Canvas according to currentView */}
        {currentView === 'write' && (
          <>
            <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              {activeScene ? (
                <CodeMirrorEditor
                  scene={activeScene}
                  theme={theme}
                  loreList={activeProject.lore}
                  referenceScene={referenceScene}
                  isSplitView={isSplitView}
                  onToggleSplit={() => setIsSplitView(!isSplitView)}
                  onEnterFocusMode={() => setIsFocusMode(true)}
                  onTakeSnapshot={handleTakeSnapshot}
                  onChangeContent={handleUpdateSceneContent}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  No scenes yet. Create a scene from the binder on the left.
                </div>
              )}
            </div>

            {/* Right Inspector Panel */}
            {activeScene && (
              <InspectorPanel
                scene={activeScene}
                loreList={activeProject.lore}
                onUpdateStatus={handleUpdateSceneStatus}
                onUpdateSummary={(sum) => handleUpdateSceneSummary(activeScene.id, sum)}
                onAddComment={handleAddComment}
                onResolveComment={handleResolveComment}
                onOpenCodexEntry={(entry) => {
                  setSelectedCodexId(entry.id);
                  setCurrentView('codex');
                }}
                onDeleteScene={handleDeleteScene}
              />
            )}
          </>
        )}

        {currentView === 'corkboard' && activeFolder && (
          <CorkboardView
            currentFolder={activeFolder}
            onSelectScene={(id) => {
              setActiveSceneId(id);
              setCurrentView('write');
            }}
            onUpdateSceneSummary={handleUpdateSceneSummary}
            onAddScene={handleAddScene}
            onDeleteScene={handleDeleteScene}
            onReorderScenes={handleReorderScenes}
          />
        )}

        {currentView === 'timeline' && (
          <TimelineView
            events={activeProject.timeline}
            onSelectScene={(id) => {
              setActiveSceneId(id);
              setCurrentView('write');
            }}
            onAddEvent={() => {}}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {currentView === 'codex' && (
          <CodexView
            loreList={activeProject.lore}
            initialSelectedId={selectedCodexId}
            onUpdateLore={handleUpdateLore}
            onAddLore={handleAddLore}
            onDeleteLore={handleDeleteLore}
            onOpenScene={(id) => {
              setActiveSceneId(id);
              setCurrentView('write');
            }}
          />
        )}

        {currentView === 'insights' && (
          <InsightsView project={activeProject} />
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        sceneWordCount={activeScene ? activeScene.wordCount : 0}
        sessionWordDelta={activeProject.settings.todayWords}
        streakDays={activeProject.settings.currentStreakDays}
        lastSnapshotText="last snapshot 14 min ago"
      />

      {/* Distraction-Free Focus Mode Modal */}
      {isFocusMode && activeScene && (
        <FocusModeView
          scene={activeScene}
          todayWords={activeProject.settings.todayWords}
          dailyGoal={activeProject.settings.dailyGoalWords}
          onExit={() => setIsFocusMode(false)}
          onChangeContent={handleUpdateSceneContent}
        />
      )}

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        scenes={allScenes}
        loreList={activeProject.lore}
        onSelectScene={(id) => {
          setActiveSceneId(id);
          setCurrentView('write');
        }}
        onSelectLore={(lore) => {
          setSelectedCodexId(lore.id);
          setCurrentView('codex');
        }}
        onTakeSnapshot={handleTakeSnapshot}
        onToggleSplit={() => setIsSplitView(!isSplitView)}
        onEnterFocusMode={() => setIsFocusMode(true)}
        onSelectTheme={setTheme}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenProjectHub={() => setIsProjectHubOpen(true)}
      />

      {/* Project Hub Modal (Manage / Switch / Delete Projects) */}
      <ProjectHubModal
        isOpen={isProjectHubOpen}
        onClose={() => setIsProjectHubOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onOpenNewProject={() => {
          setIsProjectHubOpen(false);
          setIsNewProjectOpen(true);
        }}
        onDeleteProject={handleDeleteProject}
      />

      {/* New Project Modal (Create Form) */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
};
