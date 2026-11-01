import { AppearanceSettings, defaultAppearanceSettings } from '../types/appearance';

const APPEARANCE_KEY = 'inkwell_appearance_settings_v1';

export class AppearanceStorage {
  static load(): AppearanceSettings {
    try {
      const saved = localStorage.getItem(APPEARANCE_KEY);
      if (saved) {
        return {
          ...defaultAppearanceSettings,
          ...JSON.parse(saved),
        };
      }
    } catch (e) {
      console.warn('Failed to load appearance settings from localStorage', e);
    }
    return defaultAppearanceSettings;
  }

  static save(settings: AppearanceSettings): void {
    try {
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save appearance settings to localStorage', e);
    }
  }

  static applyToDOM(settings: AppearanceSettings): void {
    const root = document.documentElement;

    // Apply base theme data attribute
    root.setAttribute('data-theme', settings.theme);

    // Apply prose font
    const proseFamily = settings.proseFont.includes(' ') && !settings.proseFont.startsWith("'") && !settings.proseFont.startsWith('"')
      ? `'${settings.proseFont}', serif`
      : settings.proseFont;
    root.style.setProperty('--font-serif', proseFamily);

    // Apply UI font
    root.style.setProperty('--font-sans', settings.uiFont);

    // Apply custom accent color
    if (settings.accentColor) {
      root.style.setProperty('--accent-primary', settings.accentColor);
    }

    // Apply editor sizing
    root.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--editor-line-height', `${settings.lineHeight}`);
    root.style.setProperty('--editor-max-width', `${settings.editorMaxWidth}px`);

    // Toggle custom wallpaper body transparency
    if (settings.bgImage && settings.bgImage.trim().length > 0) {
      root.classList.add('has-custom-wallpaper');
    } else {
      root.classList.remove('has-custom-wallpaper');
    }
  }
}
