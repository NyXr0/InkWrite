export type BaseTheme = 'paper' | 'night' | 'sepia' | 'oled';

export interface CustomFont {
  id: string;
  name: string;
  fileName: string;
  format: 'truetype' | 'opentype' | 'woff' | 'woff2';
  dataUrl: string;
  fileSize: number;
  createdAt: number;
}

export interface AppearanceSettings {
  theme: BaseTheme;
  proseFont: string;
  uiFont: string;
  fontSize: number;
  lineHeight: number;
  editorMaxWidth: number;
  accentColor: string;
  bgImage: string | null;
  bgImageOpacity: number;
  bgImageBlur: number;
  bgImageFit: 'cover' | 'repeat' | 'contain';
  surfaceTransparency: number; // 0 to 40% transparency for panels
}

export const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'paper',
  proseFont: 'Lora',
  uiFont: 'Inter',
  fontSize: 17,
  lineHeight: 1.85,
  editorMaxWidth: 720,
  accentColor: '#2d5a4c',
  bgImage: null,
  bgImageOpacity: 0.85,
  bgImageBlur: 0,
  bgImageFit: 'cover',
  surfaceTransparency: 15,
};

export interface BackgroundPreset {
  id: string;
  name: string;
  category: 'texture' | 'nature' | 'mood';
  url: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'parchment',
    name: 'Antique Parchment',
    category: 'texture',
    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'linen',
    name: 'Japanese Linen',
    category: 'texture',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'forest',
    name: 'Mist & Pine Forest',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'night-sky',
    name: 'Starry Sky',
    category: 'mood',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'rain-window',
    name: 'Rain on Glass',
    category: 'mood',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'old-library',
    name: 'Quiet Library',
    category: 'mood',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80',
  },
];

export const PROSE_FONTS = [
  { id: 'Lora', name: 'Lora (Editorial Serif)', family: "'Lora', Georgia, serif" },
  { id: 'Merriweather', name: 'Merriweather (Sturdy Serif)', family: "'Merriweather', Georgia, serif" },
  { id: 'Georgia', name: 'Georgia (Classic Book)', family: "Georgia, 'Times New Roman', serif" },
  { id: 'Cinzel', name: 'Cinzel (Classical Literary)', family: "'Cinzel', 'Times New Roman', serif" },
  { id: 'Inter', name: 'Inter (Modern Sans)', family: "'Inter', -apple-system, sans-serif" },
  { id: 'JetBrains Mono', name: 'JetBrains Mono (Typewriter)', family: "'JetBrains Mono', monospace" },
];

export const ACCENT_PALETTES = [
  { name: 'Forest Emerald', hex: '#2d5a4c' },
  { name: 'Terracotta', hex: '#c06c38' },
  { name: 'Imperial Wine', hex: '#881337' },
  { name: 'Deep Indigo', hex: '#3730a3' },
  { name: 'Amethyst', hex: '#7c3aed' },
  { name: 'Ocean Teal', hex: '#0f766e' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Charcoal Slate', hex: '#475569' },
];
