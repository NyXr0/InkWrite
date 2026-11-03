import React, { useRef, useState, useEffect } from 'react';
import { 
  AppearanceSettings, 
  BACKGROUND_PRESETS, 
  PROSE_FONTS, 
  ACCENT_PALETTES,
  defaultAppearanceSettings,
  BaseTheme,
  CustomFont
} from '../../types/appearance';
import { CustomFontStorage } from '../../core/customFontStorage';
import { 
  X, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Sliders, 
  RotateCcw, 
  Upload, 
  Check,
  Sun,
  Moon,
  Coffee,
  Sparkles,
  Trash2,
  Plus,
  AlertCircle,
  FileUp,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppearanceSettings;
  onChange: (updated: AppearanceSettings) => void;
  onOpenTutorial?: () => void;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChange,
  onOpenTutorial,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [isInstallingFont, setIsInstallingFont] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      CustomFontStorage.loadAllFonts().then(setCustomFonts);
      setFontError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFontError(null);
    setIsInstallingFont(true);

    try {
      const installed = await CustomFontStorage.installFont(file);
      setCustomFonts((prev) => [...prev.filter((f) => f.id !== installed.id), installed]);
      // Automatically activate newly installed font as active prose font
      onChange({
        ...settings,
        proseFont: installed.name,
      });
    } catch (err: any) {
      console.error('Failed to install font:', err);
      setFontError(err.message || 'Failed to install font file.');
    } finally {
      setIsInstallingFont(false);
      if (fontFileInputRef.current) fontFileInputRef.current.value = '';
    }
  };

  const handleDeleteCustomFont = async (font: CustomFont, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Uninstall custom font "${font.name}" from InxWrite?`);
    if (confirmed) {
      await CustomFontStorage.deleteFont(font.id);
      setCustomFonts((prev) => prev.filter((f) => f.id !== font.id));
      if (settings.proseFont === font.name) {
        onChange({ ...settings, proseFont: 'Lora' });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            ...settings,
            bgImage: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm('Reset all appearance settings (background, fonts, colors) to defaults?');
    if (confirmed) {
      onChange(defaultAppearanceSettings);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '740px',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-app)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Palette size={20} color="var(--accent-primary)" />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Customize Appearance & Environment
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Personalize background wallpapers, typography, geometry, and color themes.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleReset}
              title="Reset to default settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-active)',
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>

            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}>
          {/* Section 1: Base Color Theme */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Base Color Theme
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { id: 'paper', name: 'Paper (Light)', icon: <Sun size={15} />, bg: '#faf9f5', fg: '#1f1e1d' },
                { id: 'sepia', name: 'Sepia (Parchment)', icon: <Coffee size={15} />, bg: '#f2ebd9', fg: '#382c1e' },
                { id: 'night', name: 'Night (Dark)', icon: <Moon size={15} />, bg: '#18191d', fg: '#e6e5e0' },
                { id: 'oled', name: 'OLED (Pure Black)', icon: <Moon size={15} />, bg: '#000000', fg: '#ffffff' },
              ].map((t) => {
                const isSelected = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onChange({ ...settings, theme: t.id as BaseTheme })}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: t.bg,
                      color: t.fg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {t.icon}
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{t.name}</span>
                    </div>
                    {isSelected && <Check size={14} color="var(--accent-primary)" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom Background Wallpaper / Image */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={15} color="var(--accent-primary)" />
                <span>Custom Background Image & Texture</span>
              </label>

              {settings.bgImage && (
                <button
                  onClick={() => onChange({ ...settings, bgImage: null })}
                  style={{ fontSize: '11px', color: '#dc2626', textDecoration: 'underline' }}
                >
                  Remove background image
                </button>
              )}
            </div>

            {/* Presets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
              {/* Plain / None option */}
              <div
                onClick={() => onChange({ ...settings, bgImage: null })}
                style={{
                  height: '74px',
                  borderRadius: '6px',
                  border: !settings.bgImage ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                <span>None (Solid)</span>
              </div>

              {/* Wallpaper Presets */}
              {BACKGROUND_PRESETS.map((preset) => {
                const isSelected = settings.bgImage === preset.url;
                return (
                  <div
                    key={preset.id}
                    onClick={() => onChange({ ...settings, bgImage: preset.url })}
                    style={{
                      height: '74px',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      backgroundImage: `url(${preset.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    }} />
                    <span style={{
                      position: 'relative',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#ffffff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    }}>
                      {preset.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Upload or Custom Image URL */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-active)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Upload size={13} />
                <span>Upload image from computer...</span>
              </button>

              <input
                type="text"
                placeholder="Or paste an image URL..."
                value={settings.bgImage?.startsWith('data:') ? 'Custom Uploaded Image' : (settings.bgImage || '')}
                onChange={(e) => onChange({ ...settings, bgImage: e.target.value.trim() || null })}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Background Image Adjustments (Opacity & Blur) */}
            {settings.bgImage && (
              <div style={{
                padding: '14px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Wallpaper Opacity</span>
                    <span style={{ fontWeight: 600 }}>{Math.round(settings.bgImageOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="1.0"
                    step="0.01"
                    value={settings.bgImageOpacity}
                    onChange={(e) => onChange({ ...settings, bgImageOpacity: parseFloat(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Blur Focus Filter</span>
                    <span style={{ fontWeight: 600 }}>{settings.bgImageBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="16"
                    step="1"
                    value={settings.bgImageBlur}
                    onChange={(e) => onChange({ ...settings, bgImageBlur: parseInt(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Background Fit</span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{settings.bgImageFit}</span>
                  </div>
                  <select
                    value={settings.bgImageFit}
                    onChange={(e) => onChange({ ...settings, bgImageFit: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    <option value="cover">Cover / Fill Screen</option>
                    <option value="repeat">Tiled Pattern</option>
                    <option value="contain">Centered Contain</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Prose Editor Typography */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  Prose Drafting Font
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Choose a classic typeface or install any font file (.ttf, .otf, .woff, .woff2) from your computer.
                </span>
              </div>

              {/* Install local font button */}
              <div>
                <button
                  type="button"
                  onClick={() => fontFileInputRef.current?.click()}
                  disabled={isInstallingFont}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: 'var(--accent-pill)',
                    color: 'var(--accent-pill-text)',
                    cursor: isInstallingFont ? 'not-allowed' : 'pointer',
                    border: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-pill)')}
                >
                  <FileUp size={14} />
                  <span>{isInstallingFont ? 'Installing font...' : 'Install Local Font...'}</span>
                </button>
                <input
                  ref={fontFileInputRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                  style={{ display: 'none' }}
                  onChange={handleFontUpload}
                />
              </div>
            </div>

            {/* Error banner */}
            {fontError && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}>
                <AlertCircle size={14} />
                <span>{fontError}</span>
              </div>
            )}

            {/* Installed Local Fonts (if any) */}
            {customFonts.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--accent-primary)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <CheckCircle2 size={13} />
                  <span>Installed Local Fonts ({customFonts.length})</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {customFonts.map((f) => {
                    const isSelected = settings.proseFont === f.name;
                    return (
                      <div
                        key={f.id}
                        onClick={() => onChange({ ...settings, proseFont: f.name })}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-app)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '68px',
                          boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px' }}>
                          <div style={{ 
                            fontSize: '15px', 
                            fontWeight: 600, 
                            fontFamily: `'${f.name}', serif`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {f.name}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomFont(f, e)}
                            title="Uninstall font from InxWrite"
                            style={{
                              padding: '3px',
                              color: 'var(--text-muted)',
                              borderRadius: '4px',
                              lineHeight: 1,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            color: 'var(--accent-pill-text)',
                            backgroundColor: 'var(--accent-pill)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}>
                            {f.format}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {Math.round(f.fileSize / 1024)} KB
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Curated Classic Typefaces */}
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
              marginBottom: '8px',
            }}>
              Curated Classic Typefaces
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              {PROSE_FONTS.map((f) => {
                const isSelected = settings.proseFont === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChange({ ...settings, proseFont: f.id })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontFamily: f.family,
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                      {f.name.split(' (')[0]}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                      {f.name.includes('(') ? `(${f.name.split('(')[1]}` : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Typography Preview Card */}
            <div style={{
              padding: '14px 18px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  Live Typography Preview • {settings.proseFont} ({settings.fontSize}px)
                </span>
              </div>
              <p style={{
                fontFamily: settings.proseFont.includes(' ') && !settings.proseFont.startsWith("'")
                  ? `'${settings.proseFont}', serif`
                  : settings.proseFont,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}>
                “The road goes ever on and on, down from the door where it began. Now far ahead the road has gone, and I must follow, if I can, pursuing it with eager feet...”
              </p>
            </div>

            {/* Custom OS font input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Or use installed OS font name:</span>
              <input
                type="text"
                placeholder="e.g. Bookerly, Palatino, Courier Prime, Garamond..."
                value={settings.proseFont}
                onChange={(e) => onChange({ ...settings, proseFont: e.target.value })}
                style={{
                  flex: 1,
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>
          </div>

          {/* Section 4: Editor Sliders (Font size, Line height, Column width) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Editor Geometry & Reading Comfort
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Font Size</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="26"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => onChange({ ...settings, fontSize: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Line Spacing</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{settings.lineHeight}</span>
                </div>
                <input
                  type="range"
                  min="1.4"
                  max="2.4"
                  step="0.05"
                  value={settings.lineHeight}
                  onChange={(e) => onChange({ ...settings, lineHeight: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Prose Column Width</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{settings.editorMaxWidth}px</span>
                </div>
                <input
                  type="range"
                  min="560"
                  max="960"
                  step="20"
                  value={settings.editorMaxWidth}
                  onChange={(e) => onChange({ ...settings, editorMaxWidth: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Brand Accent Color */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Studio Accent Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {ACCENT_PALETTES.map((color) => {
                const isSelected = settings.accentColor.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    onClick={() => onChange({ ...settings, accentColor: color.hex })}
                    title={color.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: color.hex,
                      border: isSelected ? '3px solid #ffffff' : '2px solid transparent',
                      boxShadow: isSelected ? '0 0 0 2px var(--accent-primary)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && <Check size={14} color="#ffffff" />}
                  </button>
                );
              })}

              {/* Custom Color Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => onChange({ ...settings, accentColor: e.target.value })}
                  style={{
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Custom</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {onOpenTutorial ? (
            <button
              onClick={() => {
                onClose();
                onOpenTutorial();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-active)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              }}
            >
              <GraduationCap size={15} color="var(--accent-primary)" />
              <span>Revisit InxWrite Tutorial</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            style={{
              padding: '7px 20px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
