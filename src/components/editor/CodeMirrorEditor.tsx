import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { SceneItem, LoreEntry, ThemeMode } from '../../types/project';
import { LoreTagPopup } from './LoreTagPopup';
import { 
  EditorRuler, 
  RulerSettings, 
  loadRulerSettings, 
  saveRulerSettings 
} from './EditorRuler';
import { 
  Bold, 
  Italic, 
  Camera, 
  Columns2, 
  Eye, 
  X,
  FileText,
  BookOpen,
  Ruler
} from 'lucide-react';

interface CodeMirrorEditorProps {
  scene: SceneItem;
  theme: ThemeMode;
  loreList: LoreEntry[];
  referenceScene?: SceneItem | null;
  isSplitView: boolean;
  onToggleSplit: () => void;
  onEnterFocusMode: () => void;
  onOpenReadingMode?: () => void;
  onTakeSnapshot: () => void;
  onChangeContent: (content: string) => void;
  onSelectLoreFromPopup?: (lore: LoreEntry) => void;
}

export const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  scene,
  theme,
  loreList,
  referenceScene,
  isSplitView,
  onToggleSplit,
  onEnterFocusMode,
  onOpenReadingMode,
  onTakeSnapshot,
  onChangeContent,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  // Tag popup state
  const [popupState, setPopupState] = useState<{
    show: boolean;
    query: string;
    position: { top: number; left: number };
    posFrom: number;
  }>({
    show: false,
    query: '',
    position: { top: 0, left: 0 },
    posFrom: 0,
  });

  // MS Word-style Indent Ruler state
  const [rulerSettings, setRulerSettings] = useState<RulerSettings>(() => loadRulerSettings());
  const [draggingGuideX, setDraggingGuideX] = useState<number | null>(null);

  const handleRulerChange = (newSettings: RulerSettings) => {
    setRulerSettings(newSettings);
    saveRulerSettings(newSettings);
    if (editorViewRef.current) {
      editorViewRef.current.requestMeasure();
    }
  };

  const handleToggleRuler = () => {
    const updated = { ...rulerSettings, showRuler: !rulerSettings.showRuler };
    setRulerSettings(updated);
    saveRulerSettings(updated);
  };

  // Build CodeMirror Theme extension based on theme mode
  const getThemeExtension = (currentTheme: ThemeMode) => {
    const isDark = currentTheme === 'night' || currentTheme === 'oled';
    const isSepia = currentTheme === 'sepia';
    const textColor = isDark ? '#e6e5e0' : isSepia ? '#382c1e' : '#1f1e1d';

    return EditorView.theme({
      '&': {
        height: '100%',
        fontSize: 'var(--editor-font-size, 17px)',
        fontFamily: "var(--font-serif), Georgia, Cambria, serif",
        color: textColor,
        backgroundColor: 'transparent',
        opacity: '1',
      },
      '.cm-content': {
        padding: '32px 0 120px 0',
        lineHeight: 'var(--editor-line-height, 1.85)',
        caretColor: 'var(--accent-primary, #2d5a4c)',
        maxWidth: 'var(--editor-max-width, 720px)',
        margin: '0 auto',
        color: textColor,
        opacity: '1',
        textAlign: 'var(--editor-text-align, left)',
      },
      '.cm-line': {
        paddingTop: '0',
        paddingBottom: '0',
        paddingLeft: 'var(--paragraph-left-indent, 0px)',
        paddingRight: 'var(--paragraph-right-indent, 0px)',
        textIndent: 'var(--paragraph-first-line-indent, 0px)',
        marginBottom: 'var(--paragraph-spacing, 0px)',
        textAlign: 'var(--editor-text-align, left)',
        color: 'inherit',
        opacity: '1',
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: isDark ? '#2f433c !important' : '#cce5db !important',
      },
      '.cm-cursor': {
        borderLeftColor: isDark ? '#6fd1ad' : '#2d5a4c',
        borderLeftWidth: '2px',
      },
    }, { dark: isDark });
  };

  // Initialize CodeMirror Editor
  useEffect(() => {
    if (!editorContainerRef.current) return;

    if (editorViewRef.current) {
      editorViewRef.current.destroy();
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newText = update.state.doc.toString();
        onChangeContent(newText);

        // Check for '@' mention trigger
        const selection = update.state.selection.main;
        const line = update.state.doc.lineAt(selection.head);
        const textBeforeCursor = line.text.slice(0, selection.head - line.from);
        const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\s-]*)$/);

        if (atMatch && editorViewRef.current) {
          const coords = editorViewRef.current.coordsAtPos(selection.head);
          if (coords) {
            setPopupState({
              show: true,
              query: atMatch[1],
              position: { top: coords.bottom + 8, left: Math.max(16, coords.left - 20) },
              posFrom: selection.head - atMatch[0].length,
            });
          }
        } else {
          setPopupState((prev) => (prev.show ? { ...prev, show: false } : prev));
        }
      }
    });

    const startState = EditorState.create({
      doc: scene.content,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        cmPlaceholder('Type here to draft your scene... (type @ for lore links)'),
        getThemeExtension(theme),
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, [scene.id, theme]); // re-init when switching scene or theme

  // Synchronize document if scene.content changes externally (e.g. restoring a snapshot)
  useEffect(() => {
    if (!editorViewRef.current) return;
    const currentDoc = editorViewRef.current.state.doc.toString();
    if (scene.content !== currentDoc) {
      editorViewRef.current.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: scene.content },
      });
    }
  }, [scene.content]);

  // Handle lore tag selection from popup
  const handleSelectLore = (entry: LoreEntry) => {
    if (!editorViewRef.current) return;
    const view = editorViewRef.current;
    const currentPos = view.state.selection.main.head;
    
    // Replace the '@query' with '@EntityName '
    const tagText = `@${entry.name} `;
    view.dispatch({
      changes: {
        from: popupState.posFrom,
        to: currentPos,
        insert: tagText,
      },
      selection: { anchor: popupState.posFrom + tagText.length },
    });
    setPopupState((prev) => ({ ...prev, show: false }));
    view.focus();
  };

  const applyFormat = (prefix: string, suffix: string) => {
    if (!editorViewRef.current) return;
    const view = editorViewRef.current;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    view.dispatch({
      changes: { from, to, insert: `${prefix}${selected}${suffix}` },
      selection: { anchor: from + prefix.length + selected.length },
    });
    view.focus();
  };

  return (
    <div 
      className="editor-canvas-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-editor)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Editor Toolbar */}
      <div style={{
        height: '40px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: 'var(--bg-app)',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        {/* Left: Text Formatting Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => applyFormat('**', '**')}
            title="Bold (Ctrl+B)"
            style={{
              padding: '5px 8px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Bold size={14} />
          </button>

          <button
            onClick={() => applyFormat('*', '*')}
            title="Italic (Ctrl+I)"
            style={{
              padding: '5px 8px',
              borderRadius: '4px',
              fontSize: '13px',
              fontStyle: 'italic',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Italic size={14} />
          </button>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

          <button
            onClick={onTakeSnapshot}
            title="Take Scene Snapshot (Ctrl+Shift+S)"
            style={{
              padding: '5px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Camera size={13} />
            <span>Snapshot</span>
          </button>
        </div>

        {/* Right: View Modes (Split, Focus, Read) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenReadingMode && (
            <button
              onClick={onOpenReadingMode}
              title="Enter Book Reading Mode (Ctrl+Shift+R)"
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <BookOpen size={14} />
              <span>Read</span>
            </button>
          )}

          <button
            onClick={handleToggleRuler}
            title={rulerSettings.showRuler ? "Hide MS Word-style Indent Ruler" : "Show MS Word-style Indent Ruler"}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              color: rulerSettings.showRuler ? 'var(--accent-primary)' : 'var(--text-secondary)',
              backgroundColor: rulerSettings.showRuler ? 'var(--accent-pill)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Ruler size={14} />
            <span>Ruler</span>
          </button>

          <button
            onClick={onToggleSplit}
            title="Toggle Split View (Side-by-side)"
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              color: isSplitView ? 'var(--accent-primary)' : 'var(--text-secondary)',
              backgroundColor: isSplitView ? 'var(--accent-pill)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Columns2 size={14} />
            <span>{isSplitView ? 'Close split' : 'Split'}</span>
          </button>

          <button
            onClick={onEnterFocusMode}
            title="Distraction-Free Focus Mode"
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Eye size={14} />
            <span>Focus</span>
          </button>
        </div>
      </div>

      {/* Editor Main Content Area (Single pane or Split view) */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Active Drafting Pane (Left) */}
        <div 
          className="editor-drafting-pane"
          style={{
            flex: 1,
            height: '100%',
            overflowY: 'auto',
            padding: '24px 32px 64px 32px',
            borderRight: isSplitView ? '1px solid var(--border-subtle)' : 'none',
            position: 'relative',
            backgroundColor: 'transparent',
            '--paragraph-first-line-indent': `${rulerSettings.firstLineIndent}px`,
            '--paragraph-left-indent': `${rulerSettings.leftIndent}px`,
            '--paragraph-right-indent': `${rulerSettings.rightIndent}px`,
            '--paragraph-spacing': `${rulerSettings.paragraphSpacing}px`,
            '--editor-text-align': rulerSettings.textAlign,
          } as React.CSSProperties}
        >
          <div style={{ 
            maxWidth: 'var(--editor-max-width, 720px)', 
            margin: '0 auto',
            opacity: 1,
            position: 'relative',
          }}>
            {/* Interactive MS Word-Style Ruler */}
            {rulerSettings.showRuler && (
              <EditorRuler
                settings={rulerSettings}
                onChange={handleRulerChange}
                onDraggingGuideChange={setDraggingGuideX}
              />
            )}

            {/* Dotted Vertical Guide Line (drops through entire prose canvas during marker drag) */}
            {draggingGuideX !== null && (
              <div
                style={{
                  position: 'absolute',
                  top: '80px',
                  bottom: '-32px',
                  left: `${draggingGuideX}px`,
                  width: '1px',
                  borderLeft: '1px dashed var(--accent-primary)',
                  pointerEvents: 'none',
                  zIndex: 40,
                  opacity: 0.85,
                }}
              />
            )}

            {/* Header / Scene Metadata Banner */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
              }}>
                <h1 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '28px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}>
                  {scene.title}
                </h1>
                {isSplitView && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--accent-pill)',
                    color: 'var(--accent-pill-text)',
                  }}>
                    Writing
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>Chapter 1</span>
                <span>•</span>
                <span>POV {scene.pov}</span>
                {scene.storyTime && (
                  <>
                    <span>•</span>
                    <span>{scene.storyTime}</span>
                  </>
                )}
              </div>
            </div>

            {/* CodeMirror Surface */}
            <div ref={editorContainerRef} style={{ width: '100%' }} />
          </div>
        </div>

        {/* Pinned Reference Pane (Right) in Split View */}
        {isSplitView && referenceScene && (
          <div 
            className="editor-reference-pane"
            style={{
              flex: 1,
              height: '100%',
              overflowY: 'auto',
              padding: '24px 32px 64px 32px',
              backgroundColor: 'var(--bg-sidebar)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <div style={{ maxWidth: 'var(--editor-max-width, 720px)', margin: '0 auto', opacity: 1 }}>
              {/* Reference Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h2 style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '24px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      opacity: 1,
                    }}>
                      {referenceScene.title}
                    </h2>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-active)',
                      color: 'var(--text-secondary)',
                      opacity: 1,
                    }}>
                      Reference, read only
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', opacity: 1 }}>
                    POV {referenceScene.pov} • {referenceScene.wordCount.toLocaleString()} words
                  </div>
                </div>

                <button
                  onClick={onToggleSplit}
                  title="Close reference pane"
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Read-only prose content */}
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '17px',
                lineHeight: '1.85',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                opacity: 1,
              }}>
                {referenceScene.content || 'No text written yet.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lore tag autocomplete popup */}
      {popupState.show && (
        <LoreTagPopup
          query={popupState.query}
          loreList={loreList}
          position={popupState.position}
          onSelect={handleSelectLore}
          onClose={() => setPopupState((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
};
