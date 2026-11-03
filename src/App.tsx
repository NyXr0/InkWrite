import React, { useState, useEffect, useMemo } from 'react';
import { 
  ProjectData, 
  MainView, 
  ThemeMode, 
  SceneItem, 
  FolderItem, 
  LoreEntry, 
  SceneStatus,
  LoreCategory,
  TimelineEvent 
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
import { ReadingModeView } from './components/reading/ReadingModeView';
import { BookLibraryView } from './components/library/BookLibraryView';
import { CommandPalette } from './components/palette/CommandPalette';
import { ProjectHubModal } from './components/project/ProjectHubModal';
import { NewProjectModal } from './components/project/NewProjectModal';
import { ProjectStartWindow } from './components/project/ProjectStartWindow';
import { AppearanceStorage } from './core/appearanceStorage';
import { CustomFontStorage } from './core/customFontStorage';
import { AppearanceSettings } from './types/appearance';
import { AppearanceModal } from './components/settings/AppearanceModal';
import { CompileModal } from './components/export/CompileModal';
import { TutorialModal } from './components/tutorial/TutorialModal';
import { CustomBackdrop } from './components/layout/CustomBackdrop';
import './styles/theme.css';

export const App: React.FC = () => {
  // Multi-project collection
  const [projects, setProjects] = useState<ProjectData[]>(() => ProjectStorage.loadAllProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => ProjectStorage.loadActiveProjectId());

  // Appearance & Wallpaper settings (persisted across projects)
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => AppearanceStorage.load());
  const [isAppearanceOpen, setIsAppearanceOpen] = useState<boolean>(false);

  // Interactive Onboarding & Tutorial state
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('inxwrite_tutorial_seen_v1');
    }
    return false;
  });

  const handleCloseTutorial = (dontShowAgain?: boolean) => {
    setIsTutorialOpen(false);
    if (dontShowAgain && typeof window !== 'undefined') {
      localStorage.setItem('inxwrite_tutorial_seen_v1', 'true');
    }
  };

  // Project session state: only starts when user explicitly starts or opens a project
  const [isProjectOpen, setIsProjectOpen] = useState<boolean>(false);

  const theme: ThemeMode = appearance.theme;
  const handleSelectTheme = (newTheme: ThemeMode) => {
    setAppearance((prev) => ({ ...prev, theme: newTheme }));
  };

  const [currentView, setCurrentView] = useState<MainView>('write');

  // Active scene state
  const [activeSceneId, setActiveSceneId] = useState<string>('scene-1-2');
  const [referenceSceneId, setReferenceSceneId] = useState<string>('scene-1-1');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [isCompileOpen, setIsCompileOpen] = useState<boolean>(false);
  const [isReadingLibraryActive, setIsReadingLibraryActive] = useState<boolean>(false);
  const [selectedCorkboardFolderId, setSelectedCorkboardFolderId] = useState<string | null>(null);
  const [isProjectHubOpen, setIsProjectHubOpen] = useState<boolean>(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState<boolean>(false);
  const [selectedCodexId, setSelectedCodexId] = useState<string | undefined>(undefined);

  // Sync active project
  const activeProject = useMemo(() => {
    return projects.find((p) => p.settings.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  // Load and register any installed custom fonts on startup
  useEffect(() => {
    CustomFontStorage.applyAllFontsToDOM().catch((err) => {
      console.warn('Custom font load notice on startup:', err);
    });
  }, []);

  // Sync appearance and theme attributes with DOM and storage
  useEffect(() => {
    AppearanceStorage.save(appearance);
    AppearanceStorage.applyToDOM(appearance);
  }, [appearance]);

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

  // Launch project from Start Window or Project Hub
  const handleOpenProject = (projectId: string) => {
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
    setIsProjectOpen(true);
  };

  // Create new project and start it
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
    setIsProjectOpen(true);
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

  // Close project and return to start window
  const handleCloseProject = () => {
    setIsProjectOpen(false);
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
    if (selectedCorkboardFolderId) {
      const found = ProjectStorage.findFolder(activeProject.manuscript, selectedCorkboardFolderId);
      if (found) return found;
    }
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
  }, [activeProject.manuscript, activeSceneId, selectedCorkboardFolderId]);

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
  const handleAddLore = (
    category: LoreCategory, 
    name?: string, 
    content?: string,
    attributes?: Record<string, string>,
    role?: string
  ): string => {
    const defaultName = name?.trim() || `New ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    const newId = `lore-${Date.now()}`;
    const newLore: LoreEntry = {
      id: newId,
      slug: defaultName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `new-${category}`,
      name: defaultName,
      category,
      role: role || '',
      summary: '',
      content: content || `### ${defaultName}\n\nAdd details and notes here.`,
      attributes: attributes || {},
      relationships: [],
      aliases: [],
    };

    updateActiveProject((prev) => ({
      ...prev,
      lore: [newLore, ...prev.lore],
    }));
    setSelectedCodexId(newId);
    return newId;
  };

  // Rename scene
  const handleRenameScene = (sceneId: string, newTitle: string) => {
    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'scene' && it.id === sceneId) {
            return { ...it, title: newTitle };
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

  // Rename folder
  const handleRenameFolder = (folderId: string, newTitle: string) => {
    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'folder') {
            if (it.id === folderId) {
              return { ...it, title: newTitle, children: updateChildren(it.children) };
            }
            return { ...it, children: updateChildren(it.children) };
          }
          return it;
        });
      };
      return {
        ...prev,
        manuscript: prev.manuscript.map((f) => {
          if (f.id === folderId) {
            return { ...f, title: newTitle, children: updateChildren(f.children) };
          }
          return { ...f, children: updateChildren(f.children) };
        }),
      };
    });
  };

  // Add folder / chapter
  const handleAddFolder = (parentFolderId?: string, title?: string) => {
    const newFolderId = `folder-${Date.now()}`;
    const newFolder: FolderItem = {
      id: newFolderId,
      title: title || 'New Chapter',
      type: 'folder',
      children: [],
      order: [],
    };

    updateActiveProject((prev) => {
      if (!parentFolderId) {
        return {
          ...prev,
          manuscript: [...prev.manuscript, newFolder],
        };
      }

      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'folder') {
            if (it.id === parentFolderId) {
              return {
                ...it,
                order: [...it.order, newFolderId],
                children: [...it.children, newFolder],
              };
            }
            return { ...it, children: updateChildren(it.children) };
          }
          return it;
        });
      };

      return {
        ...prev,
        manuscript: prev.manuscript.map((f) => {
          if (f.id === parentFolderId) {
            return {
              ...f,
              order: [...f.order, newFolderId],
              children: [...f.children, newFolder],
            };
          }
          return { ...f, children: updateChildren(f.children) };
        }),
      };
    });
  };

  // Restore snapshot
  const handleRestoreSnapshot = (sceneId: string, snapshotId: string) => {
    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'scene' && it.id === sceneId) {
            const snap = it.snapshots.find((s) => s.id === snapshotId);
            if (!snap) return it;
            return {
              ...it,
              content: snap.content,
              wordCount: snap.wordCount,
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

  // Delete snapshot
  const handleDeleteSnapshot = (sceneId: string, snapshotId: string) => {
    updateActiveProject((prev) => {
      const updateChildren = (items: (FolderItem | SceneItem)[]): (FolderItem | SceneItem)[] => {
        return items.map((it) => {
          if (it.type === 'scene' && it.id === sceneId) {
            return {
              ...it,
              snapshots: it.snapshots.filter((s) => s.id !== snapshotId),
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

  // Add timeline event
  const handleAddTimelineEvent = (event: TimelineEvent) => {
    updateActiveProject((prev) => ({
      ...prev,
      timeline: [...prev.timeline, event],
    }));
  };

  // Update timeline event
  const handleUpdateTimelineEvent = (event: TimelineEvent) => {
    updateActiveProject((prev) => ({
      ...prev,
      timeline: prev.timeline.map((e) => (e.id === event.id ? event : e)),
    }));
  };

  // Import / restore project from backup
  const handleImportProject = (imported: ProjectData) => {
    setProjects((prev) => {
      const existingIndex = prev.findIndex((p) => p.settings.id === imported.settings.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = imported;
        return updated;
      }
      return [imported, ...prev];
    });
    setActiveProjectId(imported.settings.id);
    const scenes = ProjectStorage.getAllScenes(imported.manuscript);
    if (scenes.length > 0) {
      setActiveSceneId(scenes[0].id);
    }
  };

  // Update lore
  const handleUpdateLore = (updated: LoreEntry) => {
    updateActiveProject((prev) => ({
      ...prev,
      lore: prev.lore.map((l) => (l.id === updated.id ? updated : l)),
    }));
  };

  // If no project has been started by the user yet, or if Reading Library is active from the primary switcher
  if (!isProjectOpen || isReadingLibraryActive) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <CustomBackdrop settings={appearance} />
        <ProjectStartWindow
          projects={projects}
          onOpenProject={(projId) => {
            setIsReadingLibraryActive(false);
            handleOpenProject(projId);
          }}
          onCreateProject={(params) => {
            setIsReadingLibraryActive(false);
            handleCreateProject(params);
          }}
          onImportProject={handleImportProject}
          onDeleteProject={handleDeleteProject}
          theme={theme}
          onSelectTheme={handleSelectTheme}
          onOpenAppearance={() => setIsAppearanceOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          appearance={appearance}
          onUpdateAppearance={setAppearance}
          initialMode={isReadingLibraryActive ? 'library' : 'writer'}
          activeProject={isProjectOpen ? activeProject : undefined}
          onReturnToProject={isProjectOpen ? () => setIsReadingLibraryActive(false) : undefined}
        />
        <AppearanceModal
          isOpen={isAppearanceOpen}
          onClose={() => setIsAppearanceOpen(false)}
          settings={appearance}
          onChange={setAppearance}
          onOpenTutorial={() => setIsTutorialOpen(true)}
        />
        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={handleCloseTutorial}
          onNavigateToView={(view) => {
            setIsReadingLibraryActive(false);
            if (projects.length > 0) {
              handleOpenProject(activeProjectId || projects[0].settings.id);
            }
            setCurrentView(view);
          }}
          onOpenReadingLibrary={() => {
            setIsReadingLibraryActive(true);
          }}
          onEnterFocusMode={() => {
            if (projects.length > 0) {
              handleOpenProject(activeProjectId || projects[0].settings.id);
            }
            setIsFocusMode(true);
          }}
          onOpenAppearance={() => setIsAppearanceOpen(true)}
          isProjectOpen={isProjectOpen}
        />
      </div>
    );
  }

  // Active Project Workspace
  return (
    <div 
      className={appearance.bgImage ? 'has-custom-wallpaper' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: appearance.bgImage ? 'transparent' : 'var(--bg-app)',
        position: 'relative',
      }}
    >
      {/* Background Wallpaper Layer */}
      <CustomBackdrop settings={appearance} />

      {/* Top Navigation */}
      <TopNavBar
        currentView={currentView}
        onSelectView={setCurrentView}
        projectTitle={activeProject.settings.title}
        theme={theme}
        onSelectTheme={handleSelectTheme}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onOpenAppearance={() => setIsAppearanceOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenCompile={() => setIsCompileOpen(true)}
        onOpenReadingLibrary={() => setIsReadingLibraryActive(true)}
        onEnterFocusMode={() => setIsFocusMode(true)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleOpenProject}
        onOpenProjectHub={() => setIsProjectHubOpen(true)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onDeleteProject={handleDeleteProject}
        onCloseProject={handleCloseProject}
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
            onAddFolder={handleAddFolder}
            onRenameScene={handleRenameScene}
            onRenameFolder={handleRenameFolder}
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
                  onOpenReadingMode={() => setCurrentView('read')}
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
                onUpdateTitle={(title) => handleRenameScene(activeScene.id, title)}
                onUpdateStatus={handleUpdateSceneStatus}
                onUpdateSummary={(sum) => handleUpdateSceneSummary(activeScene.id, sum)}
                onAddComment={handleAddComment}
                onResolveComment={handleResolveComment}
                onRestoreSnapshot={(snapId) => handleRestoreSnapshot(activeScene.id, snapId)}
                onDeleteSnapshot={(snapId) => handleDeleteSnapshot(activeScene.id, snapId)}
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
            allFolders={ProjectStorage.getAllFolders(activeProject.manuscript)}
            onSelectFolder={setSelectedCorkboardFolderId}
            onSelectScene={(id) => {
              setActiveSceneId(id);
              setCurrentView('write');
            }}
            onUpdateSceneTitle={handleRenameScene}
            onUpdateSceneSummary={handleUpdateSceneSummary}
            onAddScene={handleAddScene}
            onDeleteScene={handleDeleteScene}
            onReorderScenes={handleReorderScenes}
          />
        )}

        {currentView === 'timeline' && (
          <TimelineView
            events={activeProject.timeline}
            scenes={allScenes}
            onSelectScene={(id) => {
              setActiveSceneId(id);
              setCurrentView('write');
            }}
            onAddEvent={handleAddTimelineEvent}
            onUpdateEvent={handleUpdateTimelineEvent}
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
            scenes={allScenes}
            timelineEvents={activeProject.timeline}
          />
        )}

        {currentView === 'library' && (
          <BookLibraryView
            project={activeProject}
            appearance={appearance}
            onUpdateAppearance={setAppearance}
            onBackToWriter={() => setCurrentView('write')}
            writerProjectTitle={activeProject.settings.title}
            onOpenTutorial={() => setIsTutorialOpen(true)}
          />
        )}

        {currentView === 'insights' && (
          <InsightsView project={activeProject} />
        )}

        {currentView === 'read' && (
          <ReadingModeView
            project={activeProject}
            initialSceneId={activeSceneId}
            onSelectScene={(id) => setActiveSceneId(id)}
            onEditScene={(id) => {
              setActiveSceneId(id);
              setCurrentView('write');
            }}
            onExit={() => setCurrentView('write')}
            appearance={appearance}
            onUpdateAppearance={setAppearance}
            onAddComment={handleAddComment}
          />
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        sceneWordCount={activeScene ? activeScene.wordCount : 0}
        sessionWordDelta={activeProject.settings.todayWords}
        streakDays={activeProject.settings.currentStreakDays}
        lastSnapshotText={activeScene && activeScene.snapshots.length > 0 ? `last snapshot: ${activeScene.snapshots[0].timestamp}` : 'no snapshots yet'}
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
        onOpenReadingMode={() => setCurrentView('read')}
        onSelectTheme={handleSelectTheme}
        onOpenAppearance={() => setIsAppearanceOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenCompile={() => setIsCompileOpen(true)}
        onOpenReadingLibrary={() => setIsReadingLibraryActive(true)}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenProjectHub={() => setIsProjectHubOpen(true)}
      />

      {/* Project Hub Modal (Manage / Switch / Delete Projects) */}
      <ProjectHubModal
        isOpen={isProjectHubOpen}
        onClose={() => setIsProjectHubOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleOpenProject}
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

      {/* Compile & Export Manuscript Modal */}
      <CompileModal
        isOpen={isCompileOpen}
        onClose={() => setIsCompileOpen(false)}
        project={activeProject}
        onImportProject={handleImportProject}
      />

      {/* Appearance & Wallpaper Customization Modal */}
      <AppearanceModal
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
        settings={appearance}
        onChange={setAppearance}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Interactive Tour & Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
        onNavigateToView={(view) => setCurrentView(view)}
        onOpenReadingLibrary={() => setIsReadingLibraryActive(true)}
        onEnterFocusMode={() => setIsFocusMode(true)}
        onOpenAppearance={() => setIsAppearanceOpen(true)}
        isProjectOpen={true}
      />
    </div>
  );
};
