import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  AlignLeft, 
  AlignJustify, 
  RotateCcw, 
  SlidersHorizontal,
  ChevronDown,
  X
} from 'lucide-react';

export interface RulerSettings {
  firstLineIndent: number;   // pixels relative to leftIndent (can be positive or negative)
  leftIndent: number;        // pixels from left edge (>= 0)
  rightIndent: number;       // pixels from right edge (>= 0)
  unit: 'in' | 'cm';         // measurement unit
  paragraphSpacing: number;  // pixels margin-bottom between paragraphs
  textAlign: 'left' | 'justify';
  showRuler: boolean;
}

export const DEFAULT_RULER_SETTINGS: RulerSettings = {
  firstLineIndent: 0,
  leftIndent: 0,
  rightIndent: 0,
  unit: 'in',
  paragraphSpacing: 0,
  textAlign: 'left',
  showRuler: true,
};

const RULER_STORAGE_KEY = 'inkwell_ruler_settings';

export function loadRulerSettings(): RulerSettings {
  try {
    const raw = localStorage.getItem(RULER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_RULER_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load ruler settings', err);
  }
  return { ...DEFAULT_RULER_SETTINGS };
}

export function saveRulerSettings(settings: RulerSettings) {
  try {
    localStorage.setItem(RULER_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save ruler settings', err);
  }
}

interface EditorRulerProps {
  settings: RulerSettings;
  onChange: (newSettings: RulerSettings) => void;
  onDraggingGuideChange?: (guideX: number | null) => void;
}

type DraggingTarget = 'firstLine' | 'hanging' | 'leftBox' | 'right' | null;

export const EditorRuler: React.FC<EditorRulerProps> = ({
  settings,
  onChange,
  onDraggingGuideChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [columnWidth, setColumnWidth] = useState<number>(720);
  const [dragging, setDragging] = useState<DraggingTarget>(null);
  const [dragTooltip, setDragTooltip] = useState<{ text: string; x: number } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Measure actual rendered width of the manuscript column
  useEffect(() => {
    if (!trackRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setColumnWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(trackRef.current);
    setColumnWidth(trackRef.current.clientWidth || 720);
    return () => observer.disconnect();
  }, []);

  const pxPerUnit = settings.unit === 'in' ? 96 : 37.79527559; // 96px per in, 37.8px per cm

  // Format pixels into current unit string
  const formatUnitValue = useCallback((px: number): string => {
    const val = px / pxPerUnit;
    return `${val.toFixed(2)} ${settings.unit}`;
  }, [pxPerUnit, settings.unit]);

  // Marker absolute positions in pixels
  const leftMarkerX = Math.max(0, Math.min(settings.leftIndent, columnWidth - 40));
  const firstLineMarkerX = Math.max(0, Math.min(settings.leftIndent + settings.firstLineIndent, columnWidth - 20));
  const rightMarkerX = Math.max(20, Math.min(columnWidth - settings.rightIndent, columnWidth));

  // Mouse drag handler
  const handleMouseDown = (e: React.MouseEvent, target: DraggingTarget) => {
    e.preventDefault();
    e.stopPropagation();
    if (!trackRef.current) return;

    setDragging(target);

    const startX = e.clientX;
    const trackRect = trackRef.current.getBoundingClientRect();
    const initialLeft = settings.leftIndent;
    const initialFirstLine = settings.firstLineIndent;
    const initialRight = settings.rightIndent;
    const initialAbsoluteFirstLine = initialLeft + initialFirstLine;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const currentMouseX = moveEvent.clientX;
      const relX = currentMouseX - trackRect.left;
      const clampedRelX = Math.max(0, Math.min(relX, columnWidth));

      // Snap to nearest 1/16" (6px) or 1mm (3.78px) unless Alt key held
      const snapThreshold = moveEvent.altKey ? 1 : (settings.unit === 'in' ? 6 : 3.78);
      const snappedRelX = Math.round(clampedRelX / snapThreshold) * snapThreshold;

      let nextSettings = { ...settings };
      let guideX: number | null = null;
      let tooltipText = '';

      if (target === 'firstLine') {
        // Drag top marker: alters first-line indent relative to leftIndent
        const maxFirstLineX = columnWidth - settings.rightIndent - 20;
        const boundedX = Math.max(0, Math.min(snappedRelX, maxFirstLineX));
        const newFirstLineIndent = Math.round(boundedX - initialLeft);
        nextSettings.firstLineIndent = newFirstLineIndent;
        guideX = boundedX;
        tooltipText = `First-Line: ${formatUnitValue(newFirstLineIndent)}`;
      } else if (target === 'hanging') {
        // Drag middle marker: alters leftIndent while keeping firstLineMarkerX constant
        const maxLeftX = columnWidth - settings.rightIndent - 20;
        const boundedLeft = Math.max(0, Math.min(snappedRelX, maxLeftX));
        const newFirstLineIndent = Math.round(initialAbsoluteFirstLine - boundedLeft);
        nextSettings.leftIndent = Math.round(boundedLeft);
        nextSettings.firstLineIndent = newFirstLineIndent;
        guideX = boundedLeft;
        tooltipText = `Hanging Indent: ${formatUnitValue(boundedLeft)}`;
      } else if (target === 'leftBox') {
        // Drag bottom box: alters leftIndent and moves both in tandem
        const maxLeftX = columnWidth - settings.rightIndent - 20;
        const delta = snappedRelX - (trackRect.left + initialLeft - trackRect.left);
        const boundedLeft = Math.max(0, Math.min(initialLeft + (snappedRelX - (startX - trackRect.left)), maxLeftX));
        nextSettings.leftIndent = Math.max(0, Math.round(boundedLeft));
        guideX = nextSettings.leftIndent;
        tooltipText = `Left Margin: ${formatUnitValue(nextSettings.leftIndent)}`;
      } else if (target === 'right') {
        // Drag right marker: alters rightIndent from right boundary
        const rightFromEdge = columnWidth - snappedRelX;
        const minRightX = Math.max(nextSettings.leftIndent, nextSettings.leftIndent + nextSettings.firstLineIndent) + 20;
        const boundedRight = Math.max(0, Math.min(rightFromEdge, columnWidth - minRightX));
        nextSettings.rightIndent = Math.round(boundedRight);
        guideX = columnWidth - nextSettings.rightIndent;
        tooltipText = `Right Margin: ${formatUnitValue(nextSettings.rightIndent)}`;
      }

      setDragTooltip({ text: tooltipText, x: guideX ?? clampedRelX });
      onDraggingGuideChange?.(guideX);
      onChange(nextSettings);
    };

    const onMouseUp = () => {
      setDragging(null);
      setDragTooltip(null);
      onDraggingGuideChange?.(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Quick preset actions
  const applyPreset = (preset: 'novel' | 'block' | 'hanging' | 'quote') => {
    let updated: Partial<RulerSettings> = {};
    if (preset === 'novel') {
      // Classic novel book standard: 0.5 in (~48px) first-line indent, flush left & right, 0 gap
      updated = {
        firstLineIndent: 48,
        leftIndent: 0,
        rightIndent: 0,
        paragraphSpacing: 0,
      };
    } else if (preset === 'block') {
      // Modern block style: 0 indent, 12px gap between paragraphs
      updated = {
        firstLineIndent: 0,
        leftIndent: 0,
        rightIndent: 0,
        paragraphSpacing: 12,
      };
    } else if (preset === 'hanging') {
      // Hanging indent: 0 first line, 0.5 in left margin for subsequent lines
      updated = {
        firstLineIndent: -48,
        leftIndent: 48,
        rightIndent: 0,
        paragraphSpacing: 4,
      };
    } else if (preset === 'quote') {
      // Blockquote / Excerpt: 0.5 in left, 0.5 in right, 0 first line
      updated = {
        firstLineIndent: 0,
        leftIndent: 48,
        rightIndent: 48,
        paragraphSpacing: 8,
      };
    }
    onChange({ ...settings, ...updated });
  };

  // Generate SVG tick marks along the ruler width
  const renderTicks = () => {
    const ticks: React.ReactNode[] = [];
    const totalUnits = Math.ceil(columnWidth / pxPerUnit);

    if (settings.unit === 'in') {
      for (let i = 0; i <= totalUnits; i++) {
        const baseX = i * 96;
        if (baseX > columnWidth) break;

        // Major inch mark
        ticks.push(
          <line
            key={`major-${i}`}
            x1={baseX}
            y1={14}
            x2={baseX}
            y2={25}
            stroke="var(--text-muted)"
            strokeWidth="1.2"
          />
        );

        // Inch number label (1, 2, 3...)
        if (i > 0 && baseX < columnWidth - 10) {
          ticks.push(
            <text
              key={`num-${i}`}
              x={baseX}
              y={11}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fontWeight="600"
              fill="var(--text-secondary)"
              style={{ userSelect: 'none' }}
            >
              {i}
            </text>
          );
        }

        // 1/8", 1/4", 1/2", 3/4" sub-ticks
        for (let sub = 1; sub < 8; sub++) {
          const subX = baseX + (sub * 96) / 8;
          if (subX >= columnWidth) break;
          const isHalf = sub === 4;
          const isQuarter = sub === 2 || sub === 6;
          const tickHeight = isHalf ? 7 : isQuarter ? 5 : 3;

          ticks.push(
            <line
              key={`sub-${i}-${sub}`}
              x1={subX}
              y1={25 - tickHeight}
              x2={subX}
              y2={25}
              stroke="var(--text-faint)"
              strokeWidth="0.8"
            />
          );
        }
      }
    } else {
      // Centimeters
      for (let c = 0; c <= totalUnits; c++) {
        const baseX = c * 37.795;
        if (baseX > columnWidth) break;

        // Major cm mark
        ticks.push(
          <line
            key={`cm-${c}`}
            x1={baseX}
            y1={14}
            x2={baseX}
            y2={25}
            stroke="var(--text-muted)"
            strokeWidth="1.2"
          />
        );

        if (c > 0 && baseX < columnWidth - 8) {
          ticks.push(
            <text
              key={`cm-num-${c}`}
              x={baseX}
              y={11}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fontWeight="600"
              fill="var(--text-secondary)"
              style={{ userSelect: 'none' }}
            >
              {c}
            </text>
          );
        }

        // Millimeter marks
        for (let m = 1; m < 10; m++) {
          const subX = baseX + m * 3.7795;
          if (subX >= columnWidth) break;
          const isHalfCm = m === 5;
          const tickHeight = isHalfCm ? 6 : 3;

          ticks.push(
            <line
              key={`mm-${c}-${m}`}
              x1={subX}
              y1={25 - tickHeight}
              x2={subX}
              y2={25}
              stroke="var(--text-faint)"
              strokeWidth="0.8"
            />
          );
        }
      }
    }

    return ticks;
  };

  return (
    <div 
      ref={containerRef}
      className="editor-ms-word-ruler"
      style={{
        width: '100%',
        maxWidth: 'var(--editor-max-width, 720px)',
        margin: '0 auto 16px auto',
        userSelect: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 25,
        backgroundColor: 'var(--bg-editor)',
        backdropFilter: 'blur(12px)',
        borderRadius: '8px',
        padding: '6px 8px 8px 8px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Secondary Quick Action Bar (Presets, Alignment, Spacing, Unit) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '6px',
        paddingBottom: '4px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '11px',
      }}>
        {/* Left: Quick Paragraph Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: '2px' }}>
            Indent:
          </span>
          <button
            onClick={() => applyPreset('novel')}
            title="Book/Novel Standard: 0.5-inch first-line indent, flush text"
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: settings.firstLineIndent === 48 && settings.leftIndent === 0 ? 'var(--accent-pill)' : 'transparent',
              color: settings.firstLineIndent === 48 && settings.leftIndent === 0 ? 'var(--accent-pill-text)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: settings.firstLineIndent === 48 && settings.leftIndent === 0 ? 'var(--accent-primary)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            📖 Novel (0.5")
          </button>

          <button
            onClick={() => applyPreset('block')}
            title="Block Style: 0-indent with paragraph gap (web & essay standard)"
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: settings.firstLineIndent === 0 && settings.leftIndent === 0 && settings.paragraphSpacing > 0 ? 'var(--accent-pill)' : 'transparent',
              color: settings.firstLineIndent === 0 && settings.leftIndent === 0 && settings.paragraphSpacing > 0 ? 'var(--accent-pill-text)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: settings.firstLineIndent === 0 && settings.leftIndent === 0 && settings.paragraphSpacing > 0 ? 'var(--accent-primary)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            📄 Block
          </button>

          <button
            onClick={() => applyPreset('hanging')}
            title="Hanging Indent: First line flush, subsequent lines indented (citations & dialogue)"
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: settings.firstLineIndent < 0 && settings.leftIndent > 0 ? 'var(--accent-pill)' : 'transparent',
              color: settings.firstLineIndent < 0 && settings.leftIndent > 0 ? 'var(--accent-pill-text)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: settings.firstLineIndent < 0 && settings.leftIndent > 0 ? 'var(--accent-primary)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            📑 Hanging
          </button>

          <button
            onClick={() => applyPreset('quote')}
            title="Blockquote: Indented margins on both sides"
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: settings.leftIndent > 0 && settings.rightIndent > 0 ? 'var(--accent-pill)' : 'transparent',
              color: settings.leftIndent > 0 && settings.rightIndent > 0 ? 'var(--accent-pill-text)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: settings.leftIndent > 0 && settings.rightIndent > 0 ? 'var(--accent-primary)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            💬 Quote
          </button>
        </div>

        {/* Right: Alignment, Spacing, Units & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Alignment */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => onChange({ ...settings, textAlign: 'left' })}
              title="Align Left"
              style={{
                padding: '3px 6px',
                backgroundColor: settings.textAlign === 'left' ? 'var(--accent-pill)' : 'transparent',
                color: settings.textAlign === 'left' ? 'var(--accent-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <AlignLeft size={13} />
            </button>
            <button
              onClick={() => onChange({ ...settings, textAlign: 'justify' })}
              title="Justify Text (Book Print Preview)"
              style={{
                padding: '3px 6px',
                backgroundColor: settings.textAlign === 'justify' ? 'var(--accent-pill)' : 'transparent',
                color: settings.textAlign === 'justify' ? 'var(--accent-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <AlignJustify size={13} />
            </button>
          </div>

          {/* Paragraph Spacing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Gap:</span>
            <select
              value={settings.paragraphSpacing}
              onChange={(e) => onChange({ ...settings, paragraphSpacing: parseInt(e.target.value) })}
              style={{
                fontSize: '11px',
                padding: '2px 4px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title="Space between paragraphs"
            >
              <option value="0">0px (Novel)</option>
              <option value="8">8px (Compact)</option>
              <option value="14">14px (Relaxed)</option>
              <option value="20">20px (Spacious)</option>
            </select>
          </div>

          {/* Unit Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => onChange({ ...settings, unit: 'in' })}
              title="Inches (1 in = 96px)"
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: settings.unit === 'in' ? 'var(--accent-pill)' : 'transparent',
                color: settings.unit === 'in' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              in
            </button>
            <button
              onClick={() => onChange({ ...settings, unit: 'cm' })}
              title="Centimeters (1 cm = ~38px)"
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: settings.unit === 'cm' ? 'var(--accent-pill)' : 'transparent',
                color: settings.unit === 'cm' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              cm
            </button>
          </div>

          {/* Advanced details toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Exact Numeric Indents"
            style={{
              padding: '3px',
              borderRadius: '4px',
              color: showAdvanced ? 'var(--accent-primary)' : 'var(--text-muted)',
              backgroundColor: showAdvanced ? 'var(--accent-pill)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <SlidersHorizontal size={12} />
          </button>

          {/* Reset */}
          <button
            onClick={() => onChange({ ...DEFAULT_RULER_SETTINGS, unit: settings.unit })}
            title="Reset indents to zero"
            style={{
              padding: '3px',
              borderRadius: '4px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Advanced Numeric Inputs Drawer (collapsible) */}
      {showAdvanced && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 8px',
          marginBottom: '6px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          fontSize: '11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>First-Line:</span>
            <input
              type="number"
              step={settings.unit === 'in' ? 0.1 : 0.25}
              value={parseFloat((settings.firstLineIndent / pxPerUnit).toFixed(2))}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onChange({ ...settings, firstLineIndent: Math.round(val * pxPerUnit) });
              }}
              style={{
                width: '54px',
                padding: '2px 4px',
                fontSize: '11px',
                borderRadius: '3px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            />
            <span style={{ color: 'var(--text-faint)' }}>{settings.unit}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Left:</span>
            <input
              type="number"
              step={settings.unit === 'in' ? 0.1 : 0.25}
              min={0}
              value={parseFloat((settings.leftIndent / pxPerUnit).toFixed(2))}
              onChange={(e) => {
                const val = Math.max(0, parseFloat(e.target.value) || 0);
                onChange({ ...settings, leftIndent: Math.round(val * pxPerUnit) });
              }}
              style={{
                width: '54px',
                padding: '2px 4px',
                fontSize: '11px',
                borderRadius: '3px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            />
            <span style={{ color: 'var(--text-faint)' }}>{settings.unit}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Right:</span>
            <input
              type="number"
              step={settings.unit === 'in' ? 0.1 : 0.25}
              min={0}
              value={parseFloat((settings.rightIndent / pxPerUnit).toFixed(2))}
              onChange={(e) => {
                const val = Math.max(0, parseFloat(e.target.value) || 0);
                onChange({ ...settings, rightIndent: Math.round(val * pxPerUnit) });
              }}
              style={{
                width: '54px',
                padding: '2px 4px',
                fontSize: '11px',
                borderRadius: '3px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            />
            <span style={{ color: 'var(--text-faint)' }}>{settings.unit}</span>
          </div>

          <button
            onClick={() => setShowAdvanced(false)}
            style={{ marginLeft: 'auto', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Live Value Tooltip when dragging */}
      {dragTooltip && (
        <div style={{
          position: 'absolute',
          top: '-26px',
          left: `${Math.max(10, Math.min(dragTooltip.x, columnWidth - 80))}px`,
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--text-primary)',
          color: 'var(--bg-app)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: 'var(--shadow-md)',
          zIndex: 40,
        }}>
          {dragTooltip.text}
        </div>
      )}

      {/* The Physical MS Word-Style Ruler Track */}
      <div 
        ref={trackRef}
        style={{
          position: 'relative',
          height: '26px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '4px',
          border: '1px solid var(--border-strong)',
          overflow: 'visible',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {/* Active writing body zone highlight (between left indent and right indent) */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${leftMarkerX}px`,
          width: `${Math.max(0, rightMarkerX - leftMarkerX)}px`,
          backgroundColor: 'var(--bg-editor)',
          opacity: 0.4,
          pointerEvents: 'none',
        }} />

        {/* Shaded left margin region */}
        {leftMarkerX > 0 && (
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${leftMarkerX}px`,
            backgroundColor: 'var(--bg-active)',
            opacity: 0.35,
            pointerEvents: 'none',
          }} />
        )}

        {/* Shaded right margin region */}
        {settings.rightIndent > 0 && (
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: `${settings.rightIndent}px`,
            backgroundColor: 'var(--bg-active)',
            opacity: 0.35,
            pointerEvents: 'none',
          }} />
        )}

        {/* SVG Tick Marks and Unit Numbers */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {renderTicks()}
        </svg>

        {/* ======================================================== */}
        {/* MARKER 1: First-Line Indent (Top Downward Triangle '▼')  */}
        {/* ======================================================== */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'firstLine')}
          title={`First-Line Indent: ${formatUnitValue(settings.firstLineIndent)} (Drag to indent first line of paragraphs)`}
          style={{
            position: 'absolute',
            top: '-1px',
            left: `${firstLineMarkerX}px`,
            transform: 'translateX(-50%)',
            width: '12px',
            height: '11px',
            cursor: 'ew-resize',
            zIndex: dragging === 'firstLine' ? 35 : 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: dragging ? 'none' : 'transform 0.05s ease',
          }}
        >
          <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
            {/* Downward pointing triangle */}
            <polygon
              points="1,1 11,1 6,10"
              fill={dragging === 'firstLine' ? 'var(--accent-primary-hover)' : 'var(--accent-primary)'}
              stroke="var(--border-strong)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* ======================================================== */}
        {/* MARKER 2: Hanging Indent (Middle Upward Triangle '▲')    */}
        {/* ======================================================== */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'hanging')}
          title={`Hanging Indent: ${formatUnitValue(settings.leftIndent)} (Drag to indent subsequent lines)`}
          style={{
            position: 'absolute',
            bottom: '5px',
            left: `${leftMarkerX}px`,
            transform: 'translateX(-50%)',
            width: '12px',
            height: '9px',
            cursor: 'ew-resize',
            zIndex: dragging === 'hanging' ? 35 : 29,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            {/* Upward pointing triangle */}
            <polygon
              points="6,1 11,8 1,8"
              fill={dragging === 'hanging' ? 'var(--accent-primary-hover)' : 'var(--accent-primary)'}
              stroke="var(--border-strong)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* ======================================================== */}
        {/* MARKER 3: Left Indent Box (Bottom Rectangle '▬')         */}
        {/* ======================================================== */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'leftBox')}
          title={`Left Indent: ${formatUnitValue(settings.leftIndent)} (Drag to move both first-line and hanging indent together)`}
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: `${leftMarkerX}px`,
            transform: 'translateX(-50%)',
            width: '12px',
            height: '6px',
            cursor: 'ew-resize',
            zIndex: dragging === 'leftBox' ? 35 : 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '5px',
              backgroundColor: dragging === 'leftBox' ? 'var(--accent-primary-hover)' : 'var(--accent-primary)',
              border: '1px solid var(--border-strong)',
              borderRadius: '1px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
          />
        </div>

        {/* ======================================================== */}
        {/* MARKER 4: Right Indent (Right Upward Triangle '▲')       */}
        {/* ======================================================== */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'right')}
          title={`Right Indent: ${formatUnitValue(settings.rightIndent)} (Drag to adjust right margin)`}
          style={{
            position: 'absolute',
            bottom: '0px',
            left: `${rightMarkerX}px`,
            transform: 'translateX(-50%)',
            width: '12px',
            height: '11px',
            cursor: 'ew-resize',
            zIndex: dragging === 'right' ? 35 : 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
            {/* Upward pointing triangle */}
            <polygon
              points="6,1 11,10 1,10"
              fill={dragging === 'right' ? 'var(--accent-primary-hover)' : 'var(--accent-primary)'}
              stroke="var(--border-strong)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
