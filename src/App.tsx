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
import './styles/theme.css';

export const App: React.FC = () => {
  // Load Project
  const [project, setProject] = useState<ProjectData>(() => ProjectStorage.loadProject());
  const [theme, setTheme] = useState<ThemeMode>('paper');
  const [currentView, setCurrentView] = useState<MainView>('write');

  // Scene state
  const [activeSceneId, setActiveSceneId] = useState<string>('scene-1-2'); // "The letter arrives"
  const [referenceSceneId, setReferenceSceneId] = useState<string>('scene-1-1'); // "Dawn at the harbour"
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [selectedCodexId, setSelectedCodexId] = useState<string | undefined>(undefined);

  // Sync theme with body data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist project on changes
  useEffect(() => {
    ProjectStorage.saveProject(project);
  }, [project]);

  // Get active scene
  const activeScene = useMemo(() => {
    return ProjectStorage.findScene(project.manuscript, activeSceneId) || 
      ProjectStorage.getAllScenes(project.manuscript)[0];
  }, [project.manuscript, activeSceneId]);

  // Get reference scene for split view
  const referenceScene = useMemo(() => {
    return ProjectStorage.findScene(project.manuscript, referenceSceneId) || null;
  }, [project.manuscript, referenceSceneId]);

  // All scenes list for quick search / stats
  const allScenes = useMemo(() => {
    return ProjectStorage.getAllScenes(project.manuscript);
  }, [project.manuscript]);

  const totalWords = useMemo(() => {
    return ProjectStorage.countTotalWords(project.manuscript);
  }, [project.manuscript]);

  // Current folder for corkboard
  const activeFolder = useMemo(() => {
    // Find folder containing active scene
    for (const folder of project.manuscript) {
      for (const item of folder.children) {
        if (item.type === 'folder') {
          for (const scene of item.children) {
            if (scene.id === activeSceneId) return item;
          }
        }
      }
    }
    // Default to Chapter 1
    const p1 = project.manuscript[0];
    if (p1 && p1.children[0] && p1.children[0].type === 'folder') {
      return p1.children[0] as FolderItem;
    }
    return project.manuscript[0];
  }, [project.manuscript, activeSceneId]);

  // Handle scene content updates
  const handleUpdateSceneContent = (newContent: string) => {
    // Recount words
    const words = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
    const delta = words - (activeScene.wordCount || 0);

    setProject((prev) => {
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

  // Handle scene status updates
  const handleUpdateSceneStatus = (status: SceneStatus) => {
    setProject((prev) => {
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

  // Handle scene summary updates
  const handleUpdateSceneSummary = (sceneId: string, summary: string) => {
    setProject((prev) => {
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

  // Handle adding comments
  const handleAddComment = (commentText: string) => {
    setProject((prev) => {
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

  // Handle resolving comments
  const handleResolveComment = (commentId: string) => {
    setProject((prev) => {
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

  // Handle taking snapshots
  const handleTakeSnapshot = () => {
    setProject((prev) => {
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

  // Handle adding new scene
  const handleAddScene = (folderId: string) => {
    const newId = `scene-${Date.now()}`;
    const newScene: SceneItem = {
      id: newId,
      type: 'scene',
      title: 'Untitled Scene',
      summary: '',
      status: 'idea',
      pov: activeScene.pov || 'Mara',
      wordCount: 0,
      wordTarget: 2000,
      comments: [],
      snapshots: [],
      content: '',
    };

    setProject((prev) => {
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

  // Reorder scenes in folder from corkboard drag and drop
  const handleReorderScenes = (reordered: SceneItem[]) => {
    setProject((prev) => {
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

  // Add lore entry
  const handleAddLore = (category: LoreCategory) => {
    const newLore: LoreEntry = {
      id: `lore-${Date.now()}`,
      slug: `new-${category}-${Date.now().toString().slice(-4)}`,
      name: `New ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      category,
      summary: '',
      content: `### New ${category}\n\nAdd details and notes here.`,
    };

    setProject((prev) => ({
      ...prev,
      lore: [newLore, ...prev.lore],
    }));
    setSelectedCodexId(newLore.id);
  };

  // Update lore entry
  const handleUpdateLore = (updated: LoreEntry) => {
    setProject((prev) => ({
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
        projectTitle={project.settings.title}
        theme={theme}
        onSelectTheme={setTheme}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onEnterFocusMode={() => setIsFocusMode(true)}
      />

      {/* Main Workspace Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Binder / Manuscript Tree (visible in Write, Corkboard) */}
        {currentView === 'write' && (
          <ManuscriptTree
            manuscript={project.manuscript}
            activeSceneId={activeSceneId}
            onSelectScene={setActiveSceneId}
            onAddScene={handleAddScene}
            onOpenCodex={() => setCurrentView('codex')}
            totalWords={totalWords}
            targetWords={project.settings.targetWords}
          />
        )}

        {/* Center Canvas according to currentView */}
        {currentView === 'write' && (
          <>
            <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              <CodeMirrorEditor
                scene={activeScene}
                theme={theme}
                loreList={project.lore}
                referenceScene={referenceScene}
                isSplitView={isSplitView}
                onToggleSplit={() => setIsSplitView(!isSplitView)}
                onEnterFocusMode={() => setIsFocusMode(true)}
                onTakeSnapshot={handleTakeSnapshot}
                onChangeContent={handleUpdateSceneContent}
              />
            </div>

            {/* Right Inspector Panel */}
            <InspectorPanel
              scene={activeScene}
              loreList={project.lore}
              onUpdateStatus={handleUpdateSceneStatus}
              onUpdateSummary={(sum) => handleUpdateSceneSummary(activeScene.id, sum)}
              onAddComment={handleAddComment}
              onResolveComment={handleResolveComment}
              onOpenCodexEntry={(entry) => {
                setSelectedCodexId(entry.id);
                setCurrentView('codex');
              }}
            />
          </>
        )}

        {currentView === 'corkboard' && (
          <CorkboardView
            currentFolder={activeFolder}
            onSelectScene={(id) => {
              setActiveSceneId(id);
              setCurrentView('write');
            }}
            onUpdateSceneSummary={handleUpdateSceneSummary}
            onAddScene={handleAddScene}
            onReorderScenes={handleReorderScenes}
          />
        )}

        {currentView === 'timeline' && (
          <TimelineView
            events={project.timeline}
            onSelectScene={(id) => {
              setActiveSceneId(id);
              setCurrentView('write');
            }}
            onAddEvent={() => {}}
          />
        )}

        {currentView === 'codex' && (
          <CodexView
            loreList={project.lore}
            initialSelectedId={selectedCodexId}
            onUpdateLore={handleUpdateLore}
            onAddLore={handleAddLore}
            onOpenScene={(id) => {
              setActiveSceneId(id);
              setCurrentView('write');
            }}
          />
        )}

        {currentView === 'insights' && (
          <InsightsView project={project} />
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        sceneWordCount={activeScene ? activeScene.wordCount : 0}
        sessionWordDelta={project.settings.todayWords}
        streakDays={project.settings.currentStreakDays}
        lastSnapshotText="last snapshot 14 min ago"
      />

      {/* Distraction-Free Focus Mode Modal */}
      {isFocusMode && activeScene && (
        <FocusModeView
          scene={activeScene}
          todayWords={project.settings.todayWords}
          dailyGoal={project.settings.dailyGoalWords}
          onExit={() => setIsFocusMode(false)}
          onChangeContent={handleUpdateSceneContent}
        />
      )}

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        scenes={allScenes}
        loreList={project.lore}
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
      />
    </div>
  );
};
