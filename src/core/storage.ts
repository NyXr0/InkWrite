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

  // Recursive search for a scene at arbitrary folder depth
  static findScene(manuscript: (FolderItem | SceneItem)[], sceneId: string): SceneItem | null {
    for (const item of manuscript) {
      if (item.type === 'scene') {
        if (item.id === sceneId) return item;
      } else if (item.type === 'folder' && item.children) {
        const found = this.findScene(item.children, sceneId);
        if (found) return found;
      }
    }
    return null;
  }

  // Recursive search for a folder at arbitrary depth
  static findFolder(manuscript: (FolderItem | SceneItem)[], folderId: string): FolderItem | null {
    for (const item of manuscript) {
      if (item.type === 'folder') {
        if (item.id === folderId) return item;
        if (item.children) {
          const found = this.findFolder(item.children, folderId);
          if (found) return found;
        }
      }
    }
    return null;
  }

  // Recursive collection of all folders/chapters in tree order
  static getAllFolders(manuscript: FolderItem[]): FolderItem[] {
    const list: FolderItem[] = [];
    const traverse = (items: (FolderItem | SceneItem)[]) => {
      for (const it of items) {
        if (it.type === 'folder') {
          list.push(it);
          if (it.children) traverse(it.children);
        }
      }
    };
    traverse(manuscript);
    return list;
  }

  // Recursive collection of all scenes in manuscript reading order
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

  // Export full novel as clean Markdown
  static compileManuscriptToMarkdown(
    project: ProjectData,
    options: {
      includeSceneTitles?: boolean;
      includeSynopsis?: boolean;
    } = {}
  ): string {
    const { includeSceneTitles = true, includeSynopsis = false } = options;
    const lines: string[] = [];

    lines.push(`# ${project.settings.title}`);
    lines.push('');
    lines.push(`*A manuscript created with Inkwell*`);
    lines.push('');
    lines.push('---');
    lines.push('');

    const traverse = (items: (FolderItem | SceneItem)[], depth: number) => {
      for (const it of items) {
        if (it.type === 'folder') {
          const headingPrefix = depth === 0 ? '## ' : depth === 1 ? '### ' : '#### ';
          lines.push(`${headingPrefix}${it.title}`);
          lines.push('');
          if (includeSynopsis && it.summary) {
            lines.push(`> ${it.summary}`);
            lines.push('');
          }
          if (it.children) {
            traverse(it.children, depth + 1);
          }
        } else if (it.type === 'scene') {
          if (includeSceneTitles) {
            lines.push(`##### ${it.title}`);
            lines.push('');
          }
          if (includeSynopsis && it.summary) {
            lines.push(`*Synopsis: ${it.summary}*`);
            lines.push('');
          }
          if (it.content.trim()) {
            lines.push(it.content.trim());
            lines.push('');
          }
          lines.push('* * *');
          lines.push('');
        }
      }
    };

    traverse(project.manuscript, 0);
    return lines.join('\n');
  }

  // Export full novel as Plain Text
  static compileManuscriptToText(
    project: ProjectData,
    options: {
      includeSceneTitles?: boolean;
      sceneSeparator?: string;
    } = {}
  ): string {
    const { includeSceneTitles = true, sceneSeparator = '\n\n* * *\n\n' } = options;
    const scenes = this.getAllScenes(project.manuscript);

    const titleBlock = `${project.settings.title.toUpperCase()}\n${'='.repeat(project.settings.title.length)}\n\n`;

    const body = scenes
      .map((scene) => {
        const title = includeSceneTitles ? `${scene.title}\n${'-'.repeat(scene.title.length)}\n\n` : '';
        return `${title}${scene.content.trim()}`;
      })
      .filter((s) => s.trim().length > 0)
      .join(sceneSeparator);

    return titleBlock + body;
  }

  // Export full novel as Print-Ready HTML Document
  static compileManuscriptToHtml(
    project: ProjectData,
    options: {
      includeSceneTitles?: boolean;
    } = {}
  ): string {
    const { includeSceneTitles = true } = options;
    const allScenes = this.getAllScenes(project.manuscript);
    const totalWords = this.countTotalWords(project.manuscript);

    const chaptersHtml = project.manuscript
      .map((folder) => {
        const renderFolder = (f: FolderItem): string => {
          const childrenHtml = f.children
            .map((child) => {
              if (child.type === 'folder') {
                return renderFolder(child);
              } else {
                const cleanContent = child.content
                  .replace(/^#+\s+.*$/m, '')
                  .trim()
                  .split(/\n\s*\n/)
                  .map((p) => `<p>${p.trim()}</p>`)
                  .join('\n');

                return `
                  <article class="scene-block">
                    ${includeSceneTitles ? `<h3 class="scene-title">${child.title}</h3>` : ''}
                    <div class="scene-content">
                      ${cleanContent || '<p><em>Empty scene.</em></p>'}
                    </div>
                  </article>
                `;
              }
            })
            .join('\n');

          return `
            <section class="chapter-block">
              <h2 class="chapter-title">${f.title}</h2>
              ${f.summary ? `<p class="chapter-summary"><em>${f.summary}</em></p>` : ''}
              ${childrenHtml}
            </section>
          `;
        };

        return renderFolder(folder);
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${project.settings.title}</title>
  <style>
    body {
      font-family: 'Lora', 'Georgia', 'Cambria', serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #1a1a1a;
      background-color: #fff;
      max-width: 740px;
      margin: 48px auto;
      padding: 0 32px;
    }
    .title-page {
      text-align: center;
      padding: 120px 0 160px 0;
      page-break-after: always;
    }
    .title-page h1 {
      font-size: 36pt;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .title-page .meta {
      font-size: 12pt;
      color: #555;
      font-family: sans-serif;
      margin-top: 24px;
    }
    .chapter-block {
      page-break-before: always;
      margin-top: 48px;
    }
    .chapter-title {
      font-size: 22pt;
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ddd;
    }
    .chapter-summary {
      text-align: center;
      color: #666;
      margin-bottom: 32px;
    }
    .scene-block {
      margin-bottom: 36px;
    }
    .scene-title {
      font-size: 14pt;
      color: #444;
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    p {
      text-indent: 1.5em;
      margin: 0;
      margin-bottom: 0.5em;
      text-align: justify;
    }
    p:first-of-type {
      text-indent: 0;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        max-width: 100%;
      }
      .chapter-block {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${project.settings.title}</h1>
    <div class="meta">
      <div>Manuscript Draft</div>
      <div>${allScenes.length} scenes • ${totalWords.toLocaleString()} words</div>
    </div>
  </div>
  ${chaptersHtml}
</body>
</html>`;
  }
}
