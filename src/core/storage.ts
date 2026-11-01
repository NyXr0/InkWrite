import { ProjectData, SceneItem, FolderItem } from '../types/project';
import { initialProjectData } from './sampleData';

const PROJECTS_COLLECTION_KEY = 'inkwell_projects_collection_v1';
const ACTIVE_PROJECT_ID_KEY = 'inkwell_active_project_id_v1';

export class ProjectStorage {
  static loadAllProjects(): ProjectData[] {
    try {
      const saved = localStorage.getItem(PROJECTS_COLLECTION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse projects collection from local storage, using initial project.', e);
    }
    // Initialize collection with sample project
    const defaultList = [initialProjectData];
    this.saveAllProjects(defaultList);
    return defaultList;
  }

  static saveAllProjects(projects: ProjectData[]): void {
    try {
      localStorage.setItem(PROJECTS_COLLECTION_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects collection to local storage', e);
    }
  }

  static loadActiveProjectId(): string {
    try {
      const activeId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
      if (activeId) return activeId;
    } catch (e) {
      // ignore
    }
    return initialProjectData.settings.id;
  }

  static saveActiveProjectId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
    } catch (e) {
      console.error('Failed to save active project id', e);
    }
  }

  static createProject(params: {
    title: string;
    targetWords?: number;
    dailyGoalWords?: number;
    deadlineDate?: string;
    pov?: string;
  }): ProjectData {
    const projId = `project-${Date.now()}`;
    const chapterId = `ch-${Date.now()}`;
    const sceneId = `scene-${Date.now()}`;
    const povName = params.pov?.trim() || 'Protagonist';

    const newProject: ProjectData = {
      settings: {
        id: projId,
        title: params.title.trim() || 'Untitled Novel',
        targetWords: params.targetWords || 80000,
        dailyGoalWords: params.dailyGoalWords || 1000,
        deadlineDate: params.deadlineDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currentStreakDays: 1,
        bestStreakDays: 1,
        todayWords: 0,
      },
      manuscript: [
        {
          id: `part-${Date.now()}`,
          type: 'folder',
          title: 'Part I: Beginning',
          summary: 'The opening section of the novel.',
          order: [chapterId],
          children: [
            {
              id: chapterId,
              type: 'folder',
              title: 'Chapter 1: The Inciting Incident',
              summary: 'Where the journey begins.',
              order: [sceneId],
              children: [
                {
                  id: sceneId,
                  type: 'scene',
                  title: 'Opening Scene',
                  summary: 'Introduce the protagonist and the world.',
                  status: 'first-draft',
                  pov: povName,
                  wordCount: 0,
                  wordTarget: 2000,
                  label: 'setup',
                  storyTime: 'Day 1, morning',
                  locations: ['Home'],
                  comments: [],
                  snapshots: [],
                  content: `# Chapter 1: The Inciting Incident\n\nBegin drafting your first scene here...`,
                },
              ],
            },
          ],
        },
      ],
      lore: [
        {
          id: `lore-${Date.now()}`,
          slug: povName.toLowerCase().replace(/\s+/g, '-'),
          name: povName,
          category: 'character',
          role: 'Protagonist',
          summary: 'The central character of this story.',
          content: `### ${povName}\n\n**Role:** Protagonist\n\nAdd character arc, backstory, and motivations.`,
          relationships: [],
        },
      ],
      timeline: [
        {
          id: `time-${Date.now()}`,
          title: 'Opening event',
          date: 'Day 1, 08:00',
          sceneId: sceneId,
          lane: `${povName}'s Journey`,
          characters: [povName],
          summary: 'The inciting event that kicks off the narrative.',
        },
      ],
      sprints: [],
      dailyHistory: [
        { date: 'Today', words: 0 },
      ],
    };

    return newProject;
  }

  static findScene(manuscript: FolderItem[], sceneId: string): SceneItem | null {
    for (const folder of manuscript) {
      for (const item of folder.children) {
        if (item.type === 'scene' && item.id === sceneId) {
          return item;
        } else if (item.type === 'folder') {
          for (const subItem of item.children) {
            if (subItem.type === 'scene' && subItem.id === sceneId) {
              return subItem;
            }
          }
        }
      }
    }
    return null;
  }

  static getAllScenes(manuscript: FolderItem[]): SceneItem[] {
    const list: SceneItem[] = [];
    const traverse = (items: (FolderItem | SceneItem)[]) => {
      for (const it of items) {
        if (it.type === 'scene') {
          list.push(it);
        } else if (it.type === 'folder' && it.children) {
          traverse(it.children);
        }
      }
    };
    traverse(manuscript);
    return list;
  }

  static countTotalWords(manuscript: FolderItem[]): number {
    const scenes = this.getAllScenes(manuscript);
    return scenes.reduce((acc, s) => acc + (s.wordCount || 0), 0);
  }
}
