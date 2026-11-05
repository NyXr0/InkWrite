export type ThemeMode = 'paper' | 'night' | 'sepia' | 'oled';

export type MainView = 'write' | 'corkboard' | 'timeline' | 'codex' | 'insights' | 'read' | 'library';

export type SceneStatus = 'idea' | 'first-draft' | 'second-draft' | 'revised' | 'final';

export interface SceneFrontMatter {
  id: string;
  title: string;
  summary: string;
  status: SceneStatus;
  label?: string;
  pov: string;
  locations?: string[];
  story_time?: string;
  word_target?: number;
}

export interface ReviewComment {
  id: string;
  sceneId: string;
  anchorText: string;
  comment: string;
  author: string;
  resolved: boolean;
  createdAt: string;
}

export interface Snapshot {
  id: string;
  sceneId: string;
  timestamp: string;
  note: string;
  content: string;
  wordCount: number;
}

export interface SceneItem {
  id: string;
  type: 'scene';
  title: string;
  content: string;
  summary: string;
  status: SceneStatus;
  pov: string;
  wordCount: number;
  wordTarget: number;
  label?: string;
  storyTime?: string;
  locations?: string[];
  comments: ReviewComment[];
  snapshots: Snapshot[];
}

export interface FolderItem {
  id: string;
  type: 'folder';
  title: string;
  summary?: string;
  order: string[]; // list of child ids
  children: (FolderItem | SceneItem)[];
}

export type BinderNode = FolderItem | SceneItem;

export type LoreCategory = 'character' | 'location' | 'faction' | 'item' | 'lore';

export interface LoreImage {
  id: string;
  url: string; // Base64 data URL or external image URL
  caption?: string;
  dateAdded?: string;
}

export interface LoreEntry {
  id: string;
  slug: string;
  name: string;
  category: LoreCategory;
  role?: string; // e.g. "Protagonist", "Antagonist", "Festival"
  summary: string;
  content: string;
  relationships?: { to: string; type: string }[];
  aliases?: string[];
  attributes?: Record<string, string>;
  imageUrl?: string;
  gallery?: LoreImage[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  sceneId?: string;
  lane: string; // e.g. "Mara's Journey", "City Politics"
  characters: string[];
  summary: string;
  flagConflict?: string;
}

export interface WritingSprintLog {
  id: string;
  date: string;
  durationMinutes: number;
  wordsWritten: number;
  label: string;
}

export interface ProjectSettings {
  id: string;
  title: string;
  targetWords: number;
  dailyGoalWords: number;
  deadlineDate: string;
  currentStreakDays: number;
  bestStreakDays: number;
  todayWords: number;
}

export interface ProjectData {
  settings: ProjectSettings;
  manuscript: FolderItem[];
  lore: LoreEntry[];
  timeline: TimelineEvent[];
  sprints: WritingSprintLog[];
  dailyHistory: { date: string; words: number }[];
}
