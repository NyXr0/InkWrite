import { ProjectData, SceneItem, FolderItem, Snapshot, ReviewComment } from '../types/project';
import { initialProjectData } from './sampleData';

const STORAGE_KEY = 'inkwell_active_project_data';

export class ProjectStorage {
  static loadProject(): ProjectData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load project from local storage, falling back to default sample.', e);
    }
    return initialProjectData;
  }

  static saveProject(data: ProjectData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save project to local storage', e);
    }
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
