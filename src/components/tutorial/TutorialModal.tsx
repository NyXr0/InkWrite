import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  PenTool, 
  Layers, 
  Compass, 
  LayoutGrid, 
  Calendar, 
  Sliders, 
  Volume2, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Eye, 
  GraduationCap, 
  Search, 
  Maximize2,
  FileText,
  Share2,
  HelpCircle,
  FolderTree,
  Type,
  Bookmark
} from 'lucide-react';
import { MainView } from '../../types/project';

export interface TutorialModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain?: boolean) => void;
  onNavigateToView?: (view: MainView) => void;
  onOpenReadingLibrary?: () => void;
  onEnterFocusMode?: () => void;
  onOpenAppearance?: () => void;
  isProjectOpen?: boolean;
}

interface TutorialStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  points: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
  shortcutOrTip?: {
    label: string;
    text: string;
    shortcut?: string;
  };
  action?: {
    label: string;
    handler: () => void;
  };
  renderPreview: () => React.ReactNode;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onNavigateToView,
  onOpenReadingLibrary,
  onEnterFocusMode,
  onOpenAppearance,
  isProjectOpen = false,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Define steps
  const steps: TutorialStep[] = [
    // Step 1: Welcome & The Twin Pillars
    {
      id: 'welcome',
      badge: 'Architecture & Overview',
      title: 'Welcome to InxWrite',
      subtitle: 'The Novelist’s Studio & Personal eBook Reading Sanctuary',
      icon: <Sparkles size={20} />,
      accentColor: '#eb5e28',
      points: [
        {
          title: '1st Pillar — Novelist Studio (Writer Mode)',
          description: 'A focused environment with manuscript tree outliner, distraction-free markdown prose editor, interactive margin ruler, and interconnected story codex.',
          icon: <PenTool size={16} color="#eb5e28" />,
        },
        {
          title: '2nd Pillar — Reading Library (Reader Mode)',
          description: 'A dedicated reading sanctuary supporting EPUB, PDF, TXT, and Markdown eBooks with dual-page spreads, arrow-key navigation, and TTS audio.',
          icon: <BookOpen size={16} color="#06b6d4" />,
        },
        {
          title: '100% Client-Side & Local First',
          description: 'All manuscripts, lore entries, and imported books are stored directly in your browser’s IndexedDB. Zero cloud telemetry, zero tracking, and fully offline.',
          icon: <CheckCircle2 size={16} color="#10b981" />,
        },
      ],
      shortcutOrTip: {
        label: 'Quick Switcher',
        text: 'You can switch between Writer Mode and Reading Library anytime from the primary start window or top ribbon.',
        shortcut: 'Ctrl + Shift + L',
      },
      renderPreview: () => (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          height: '100%',
          justifyContent: 'center',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid rgba(235, 94, 40, 0.3)',
              textAlign: 'center',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(235, 94, 40, 0.15)',
                color: '#eb5e28',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
              }}>
                <PenTool size={18} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Writer Studio
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Binder, Editor, Ruler, Codex, Timeline & Insights
              </div>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              textAlign: 'center',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
              }}>
                <BookOpen size={18} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Reading Library
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                EPUB, PDF, TXT, Dual-Page Spread & TTS Audio
              </div>
            </div>
          </div>

          <div style={{
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Sparkles size={14} color="#eb5e28" style={{ flexShrink: 0 }} />
            <span>Select any step above or use arrow keys to tour every capability.</span>
          </div>
        </div>
      ),
    },

    // Step 2: Manuscript Binder & Scene Outliner
    {
      id: 'binder',
      badge: 'Manuscript Structure',
      title: 'Manuscript Binder & Scene Tree',
      subtitle: 'Unlimited hierarchical nesting with progress pins and word targets',
      icon: <Layers size={20} />,
      accentColor: '#3b82f6',
      points: [
        {
          title: 'Hierarchical Structure',
          description: 'Organize your entire novel into Volumes, Acts, Chapters, and Scenes with unlimited nesting depth.',
          icon: <FolderTree size={16} color="#3b82f6" />,
        },
        {
          title: 'Scene Status Lifecycle Pins',
          description: 'Color-code scene readiness: Idea (gray), First Draft (amber), Second Draft (cyan), Revised (blue), and Final (emerald).',
          icon: <CheckCircle2 size={16} color="#10b981" />,
        },
        {
          title: 'Drag & Drop Reordering',
          description: 'Effortlessly reorder scenes, shift chapters between volumes, and reshape narrative pacing in real time.',
          icon: <Layers size={16} color="#8b5cf6" />,
        },
      ],
      shortcutOrTip: {
        label: 'Pro Tip',
        text: 'Press Ctrl+Enter anytime in the editor to immediately create a new scene under the current chapter.',
        shortcut: 'Ctrl + Enter',
      },
      action: isProjectOpen && onNavigateToView ? {
        label: 'View Binder in Studio',
        handler: () => {
          onNavigateToView('write');
          onClose(dontShowAgain);
        },
      } : undefined,
      renderPreview: () => (
        <div style={{
          backgroundColor: 'var(--bg-app)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          padding: '12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '12px',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Manuscript Outline Sample
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
              <span>📁 Volume I: The Awakening</span>
            </div>
            <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <span>📁 Chapter 1: The Whispering Sea</span>
              </div>
              <div style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px', backgroundColor: 'var(--bg-active)', borderRadius: '4px' }}>
                  <span>📄 Scene 1.1: Harbor at Dusk</span>
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Final</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px', borderRadius: '4px' }}>
                  <span>📄 Scene 1.2: The Sunken Vault</span>
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(235, 94, 40, 0.2)', color: '#eb5e28' }}>Draft</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Step 3: Pro Prose Editor & Margin Ruler
    {
      id: 'editor',
      badge: 'Writing Canvas',
      title: 'Prose Editor & Margin Ruler',
      subtitle: 'CodeMirror 6 engine with MS Word-style visual ruler & live lore tags',
      icon: <Sliders size={20} />,
      accentColor: '#10b981',
      points: [
        {
          title: 'Interactive Margin Ruler',
          description: 'Drag left, right, and first-line indentation triangles directly along the visual ruler for authentic book typesetting.',
          icon: <Sliders size={16} color="#10b981" />,
        },
        {
          title: 'Live @ Lore Autocomplete',
          description: 'Type @ anywhere in your prose to pop up instant mentions for characters, locations, factions, and artifacts.',
          icon: <Sparkles size={16} color="#eb5e28" />,
        },
        {
          title: 'Split View & Revision Snapshots',
          description: 'Compare two scenes side-by-side. Take timestamped snapshots before major edits and restore any version with one click.',
          icon: <Eye size={16} color="#06b6d4" />,
        },
      ],
      shortcutOrTip: {
        label: 'Mention Lore',
        text: 'Type "@" in the editor to reference any story bible entity without breaking your typing momentum.',
        shortcut: '@',
      },
      action: isProjectOpen && onNavigateToView ? {
        label: 'Open Prose Editor',
        handler: () => {
          onNavigateToView('write');
          onClose(dontShowAgain);
        },
      } : undefined,
      renderPreview: () => (
        <div style={{
          backgroundColor: 'var(--bg-app)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          padding: '12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {/* Mock Ruler */}
          <div style={{
            height: '24px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            <span style={{ color: '#eb5e28', fontWeight: 700 }}>▼ 0.5"</span>
            <span>· · · 1 · · · 2 · · · 3 · · · 4 · · · 5 · · · 6 · · ·</span>
            <span style={{ color: '#eb5e28', fontWeight: 700 }}>▲ 6.5"</span>
          </div>

          {/* Mock Prose */}
          <div style={{
            padding: '8px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '4px',
            fontFamily: 'var(--font-serif)',
            fontSize: '12px',
            color: 'var(--text-primary)',
            lineHeight: '1.6',
          }}>
            <p style={{ margin: 0, textIndent: '1.5em' }}>
              The lantern light flickered as <span style={{ color: '#eb5e28', fontWeight: 600, borderBottom: '1px dashed #eb5e28' }}>@Mara</span> opened the heavy oak grimoire...
            </p>
          </div>
        </div>
      ),
    },

    // Step 4: Codex & Obsidian-Style Canon Web
    {
      id: 'codex',
      badge: 'Story Bible',
      title: 'Codex & Obsidian-Style Node Graph',
      subtitle: 'Anti-hallucination knowledge graph with 5 differentiated categories',
      icon: <Compass size={20} />,
      accentColor: '#8b5cf6',
      points: [
        {
          title: '5 Distinct Story Categories',
          description: 'Character (Terracotta), Location (Emerald), Lore & Worldbuilding (Gold), Item & Artifact (Cyan), and Faction & Order (Violet).',
          icon: <Compass size={16} color="#8b5cf6" />,
        },
        {
          title: 'Obsidian-Style 2D Physics Graph',
          description: 'Force-directed simulation with dynamic node radiuses based on connectivity, pan, zoom, and glowing cluster halos.',
          icon: <Share2 size={16} color="#06b6d4" />,
        },
        {
          title: 'Manuscript Reality Scanner',
          description: 'Scans all novel scenes in real time for element mentions, showing match snippets and 1-click jumps directly to the text.',
          icon: <Search size={16} color="#10b981" />,
        },
      ],
      shortcutOrTip: {
        label: 'Navigation Ribbon',
        text: 'Use the bottom ribbon inside Codex to toggle between Dossiers, Obsidian Node Graph, and Subgraphs.',
      },
      action: isProjectOpen && onNavigateToView ? {
        label: 'Explore Story Codex',
        handler: () => {
          onNavigateToView('codex');
          onClose(dontShowAgain);
        },
      } : undefined,
      renderPreview: () => (
        <div style={{
          backgroundColor: 'var(--bg-app)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          padding: '12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Simulated node graph connections */}
          <svg style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, opacity: 0.4 }}>
            <line x1="30%" y1="40%" x2="70%" y2="35%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="30%" y1="40%" x2="50%" y2="75%" stroke="#eb5e28" strokeWidth="2" />
            <line x1="70%" y1="35%" x2="50%" y2="75%" stroke="#06b6d4" strokeWidth="2" />
          </svg>

          {/* Simulated Nodes */}
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '20%',
            padding: '4px 10px',
            borderRadius: '16px',
            backgroundColor: '#eb5e28',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
            boxShadow: '0 0 12px rgba(235, 94, 40, 0.4)',
          }}>
            Mara (Character)
          </div>

          <div style={{
            position: 'absolute',
            top: '25%',
            right: '18%',
            padding: '4px 10px',
            borderRadius: '16px',
            backgroundColor: '#8b5cf6',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.4)',
          }}>
            Iron Synod (Faction)
          </div>

          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '38%',
            padding: '4px 10px',
            borderRadius: '16px',
            backgroundColor: '#06b6d4',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
          }}>
            Silver Key (Artifact)
          </div>
        </div>
      ),
    },

    // Step 5: Visual Corkboard & Story Timeline
    {
      id: 'corkboard',
      badge: 'Visual Pacing',
      title: 'Visual Corkboard & Timeline',
      subtitle: 'Bird’s-eye card overview and chronological narrative flow',
      icon: <LayoutGrid size={20} />,
      accentColor: '#f59e0b',
      points: [
        {
          title: 'Corkboard Scene Cards',
          description: 'Visualize scenes as index cards grouped by chapter. Edit synopsis notes and adjust story pacing intuitively.',
          icon: <LayoutGrid size={16} color="#f59e0b" />,
        },
        {
          title: 'Multi-Lane Narrative Timeline',
          description: 'Track parallel storylines, character arcs, and world milestones across chronological story eras.',
          icon: <Calendar size={16} color="#3b82f6" />,
        },
        {
          title: 'Conflict & Pacing Warnings',
          description: 'Automatic warnings for overlapping events, character contradictions, and narrative pacing gaps.',
          icon: <Zap size={16} color="#ef4444" />,
        },
      ],
      shortcutOrTip: {
        label: 'Pacing Check',
        text: 'Switch to Corkboard or Timeline from the top navigation bar to review story flow without getting bogged down in prose.',
      },
      action: isProjectOpen && onNavigateToView ? {
        label: 'Open Corkboard',
        handler: () => {
          onNavigateToView('corkboard');
          onClose(dontShowAgain);
        },
      } : undefined,
      renderPreview: () => (
        <div style={{
          backgroundColor: 'var(--bg-app)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          padding: '12px',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Scene 1: The Port
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Mara secures passage aboard the Night Heron.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 600 }}>1,840 words</span>
              <span style={{ fontSize: '9px', backgroundColor: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>POV: Mara</span>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Scene 2: Ambush
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Shadow cultists attack before dawn.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '9px', color: '#eb5e28', fontWeight: 600 }}>2,210 words</span>
              <span style={{ fontSize: '9px', backgroundColor: 'var(--bg-active)', padding: '2px 4px', borderRadius: '3px' }}>POV: Roland</span>
            </div>
          </div>
        </div>
      ),
    },

    // Step 6: Personal Reading Library & eBook Reader
    {
      id: 'library',
      badge: 'eBook Reader',
      title: 'Reading Library & Spread Reader',
      subtitle: 'Import EPUB, PDF, and TXT with dual-page book spread & voice TTS',
      icon: <BookOpen size={20} />,
      accentColor: '#06b6d4',
      points: [
        {
          title: 'Separate Format Import Buttons',
          description: 'Import pre-existing books with separate buttons for EPUB, PDF, TXT, and Markdown files.',
          icon: <FileText size={16} color="#06b6d4" />,
        },
        {
          title: 'Dual-Page Book Spread Mode',
          description: 'Read in authentic 2-page open book spread mode, single-page, or continuous scrolling with arrow-key navigation.',
          icon: <BookOpen size={16} color="#3b82f6" />,
        },
        {
          title: 'Built-in Text-to-Speech (TTS) & Custom Fonts',
          description: 'Listen to any book or chapter with speech synthesis, and install custom TTF/OTF fonts to personalize typography.',
          icon: <Volume2 size={16} color="#10b981" />,
        },
      ],
      shortcutOrTip: {
        label: 'Arrow Page Flipping',
        text: 'In Reading Mode, press Right Arrow to advance pages and Left Arrow to turn backward.',
        shortcut: '← / →',
      },
      action: onOpenReadingLibrary ? {
        label: 'Open Reading Library',
        handler: () => {
          onOpenReadingLibrary();
          onClose(dontShowAgain);
        },
      } : undefined,
      renderPreview: () => (
        <div style={{
          backgroundColor: 'var(--bg-app)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          padding: '12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '8px',
        }}>
          {/* Dual page preview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            backgroundColor: 'var(--bg-surface)',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-strong)',
          }}>
            <div style={{ borderRight: '1px dashed var(--border-subtle)', paddingRight: '8px', fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Page 12</div>
              The salt air carried rumors of war across the southern archipelago...
            </div>
            <div style={{ paddingLeft: '8px', fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Page 13</div>
              ...yet no messenger dared confirm what had transpired at the gate.
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
            Dual-Page Spread • Arrow keys to turn pages • TTS audio ready
          </div>
        </div>
      ),
    },

    // Step 7: Focus Mode, Insights & Reopening Tutorial
    {
      id: 'focus-insights',
      badge: 'Productivity & Mastery',
      title: 'Focus Mode, Sprints & Help',
      subtitle: 'Typewriter mode, sprint tracking, and revisiting this guide anytime',
      icon: <Zap size={20} />,
      accentColor: '#ec4899',
      points: [
        {
          title: 'Distraction-Free Focus Mode',
          description: 'Press F11 or Ctrl+Shift+F to strip away all menus for pure, typewriter-style prose composition.',
          icon: <Maximize2 size={16} color="#ec4899" />,
        },
        {
          title: 'Live Sprint Engine & Writing Insights',
          description: 'Timed word sprint challenges, words-per-minute meter, daily goals, and streak tracking.',
          icon: <Zap size={16} color="#f59e0b" />,
        },
        {
          title: 'Revisit Tutorial Anytime',
          description: 'Click the 🎓 Tutorial button in the top navigation bar or start screen, or search for "Tutorial" in Command Palette (Ctrl+K).',
          icon: <GraduationCap size={16} color="#8b5cf6" />,
        },
      ],
      shortcutOrTip: {
        label: 'Command Palette',
        text: 'Press Ctrl+K anytime anywhere to open the command palette for instant navigation and actions.',
        shortcut: 'Ctrl + K',
      },
      action: {
        label: 'Get Started with InxWrite',
        handler: () => {
          onClose(dontShowAgain);
        },
      },
      renderPreview: () => (
        <div style={{
          backgroundColor: 'var(--bg-app)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          padding: '16px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(235, 94, 40, 0.15)',
            color: '#eb5e28',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <GraduationCap size={26} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              You are ready to craft your story!
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto', lineHeight: '1.5' }}>
              Need a reminder? Look for the <strong>Tutorial</strong> button in the top navigation bar anytime.
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[activeStepIndex];

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose(dontShowAgain);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (activeStepIndex < steps.length - 1) {
        setActiveStepIndex((prev) => prev + 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (activeStepIndex > 0) {
        setActiveStepIndex((prev) => prev - 1);
      }
    }
  }, [isOpen, activeStepIndex, steps.length, onClose, dontShowAgain]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '14px',
        border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-app)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(235, 94, 40, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GraduationCap size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  InxWrite Tour & Guide
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-pill)',
                  color: 'var(--accent-primary)',
                }}>
                  Step {activeStepIndex + 1} of {steps.length}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Master all writing, worldbuilding, and reading tools
              </div>
            </div>
          </div>

          <button
            onClick={() => onClose(dontShowAgain)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close Tutorial (Esc)"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Navigation Pills */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '10px 20px',
          backgroundColor: 'var(--bg-active)',
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto',
        }}>
          {steps.map((s, idx) => {
            const isActive = idx === activeStepIndex;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStepIndex(idx)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{idx + 1}.</span>
                <span>{s.title.split('&')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Body / Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '24px',
        }}>
          {/* Left Column: Details & Key Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-active)',
                color: currentStep.accentColor,
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}>
                {currentStep.icon}
                <span>{currentStep.badge}</span>
              </div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                marginBottom: '4px',
              }}>
                {currentStep.title}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {currentStep.subtitle}
              </p>
            </div>

            {/* Bullet Points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentStep.points.map((pt, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    {pt.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {pt.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      {pt.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip or Shortcut callout */}
            {currentStep.shortcutOrTip && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{currentStep.shortcutOrTip.label}:</strong> {currentStep.shortcutOrTip.text}
                </div>
                {currentStep.shortcutOrTip.shortcut && (
                  <kbd style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                  }}>
                    {currentStep.shortcutOrTip.shortcut}
                  </kbd>
                )}
              </div>
            )}

            {/* Step Action (e.g. Try Feature Live) */}
            {currentStep.action && (
              <div>
                <button
                  onClick={currentStep.action.handler}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 2px 6px rgba(235, 94, 40, 0.25)',
                  }}
                >
                  <span>{currentStep.action.label}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Visual Feature Showcase */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            minHeight: '260px',
          }}>
            {currentStep.renderPreview()}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left: Don't show again checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Don't show automatically on startup (revisit anytime via "Tutorial" button)</span>
          </label>

          {/* Right: Step navigation controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeStepIndex === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: 'var(--bg-surface)',
                color: activeStepIndex === 0 ? 'var(--text-faint)' : 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: activeStepIndex === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>

            {/* Step Dots */}
            <div style={{ display: 'flex', gap: '4px', margin: '0 4px' }}>
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStepIndex(idx)}
                  style={{
                    width: idx === activeStepIndex ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: idx === activeStepIndex ? 'var(--accent-primary)' : 'var(--border-strong)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {activeStepIndex < steps.length - 1 ? (
              <button
                onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(235, 94, 40, 0.25)',
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => onClose(dontShowAgain)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={14} />
                <span>Finish & Start Writing</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
