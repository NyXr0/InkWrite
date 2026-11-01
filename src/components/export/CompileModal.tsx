import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Code, 
  Globe, 
  Database, 
  Upload, 
  BookOpen,
  Layers,
  Settings2
} from 'lucide-react';
import { ProjectData } from '../../types/project';
import { ProjectStorage } from '../../core/storage';

interface CompileModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onImportProject?: (project: ProjectData) => void;
}

type ExportFormat = 'markdown' | 'text' | 'html' | 'json';

export const CompileModal: React.FC<CompileModalProps> = ({
  isOpen,
  onClose,
  project,
  onImportProject,
}) => {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('markdown');
  const [includeSceneTitles, setIncludeSceneTitles] = useState<boolean>(true);
  const [includeSynopsis, setIncludeSynopsis] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed compiled text based on options
  const compiledContent = useMemo(() => {
    switch (activeFormat) {
      case 'markdown':
        return ProjectStorage.compileManuscriptToMarkdown(project, {
          includeSceneTitles,
          includeSynopsis,
        });
      case 'text':
        return ProjectStorage.compileManuscriptToText(project, {
          includeSceneTitles,
        });
      case 'html':
        return ProjectStorage.compileManuscriptToHtml(project, {
          includeSceneTitles,
        });
      case 'json':
        return JSON.stringify(project, null, 2);
      default:
        return '';
    }
  }, [project, activeFormat, includeSceneTitles, includeSynopsis]);

  const compiledStats = useMemo(() => {
    const text = compiledContent.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const scenes = ProjectStorage.getAllScenes(project.manuscript).length;
    const chapters = project.manuscript.length;
    return { words, chars, scenes, chapters };
  }, [compiledContent, project]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const handleDownload = () => {
    const sanitizedTitle = project.settings.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'manuscript';
    let filename = `${sanitizedTitle}.${activeFormat === 'markdown' ? 'md' : activeFormat === 'text' ? 'txt' : activeFormat === 'html' ? 'html' : 'json'}`;
    let mimeType = 'text/plain';

    if (activeFormat === 'markdown') mimeType = 'text/markdown';
    else if (activeFormat === 'html') mimeType = 'text/html';
    else if (activeFormat === 'json') mimeType = 'application/json';

    const blob = new Blob([compiledContent], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = event.target?.result as string;
        const parsed = JSON.parse(rawJson);

        if (!parsed || !parsed.settings || !parsed.manuscript || !Array.isArray(parsed.manuscript)) {
          throw new Error('Invalid Inkwell project schema. Missing settings or manuscript arrays.');
        }

        // If ID matches, give it a new ID if needed or preserve
        if (!parsed.settings.id) {
          parsed.settings.id = `proj-${Date.now()}`;
        }

        if (onImportProject) {
          onImportProject(parsed as ProjectData);
          setImportNotice({ type: 'success', message: `Successfully restored project "${parsed.settings.title}"!` });
          setTimeout(() => {
            setImportNotice(null);
            onClose();
          }, 1500);
        }
      } catch (err: any) {
        setImportNotice({ type: 'error', message: err.message || 'Failed to parse JSON backup file.' });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '900px',
          maxWidth: '96vw',
          height: '85vh',
          maxHeight: '900px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(235, 94, 40, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Download size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>
                Compile & Export Manuscript
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Export "{project.settings.title}" to standard formats or create a full backup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Format Selector & Options */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--bg-canvas)',
          }}
        >
          {/* Format Tabs */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveFormat('markdown')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeFormat === 'markdown' ? 'var(--accent)' : 'transparent',
                color: activeFormat === 'markdown' ? '#fff' : 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={15} /> Markdown (.md)
            </button>
            <button
              onClick={() => setActiveFormat('text')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeFormat === 'text' ? 'var(--accent)' : 'transparent',
                color: activeFormat === 'text' ? '#fff' : 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <BookOpen size={15} /> Plain Text (.txt)
            </button>
            <button
              onClick={() => setActiveFormat('html')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeFormat === 'html' ? 'var(--accent)' : 'transparent',
                color: activeFormat === 'html' ? '#fff' : 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Globe size={15} /> HTML / Print (.html)
            </button>
            <button
              onClick={() => setActiveFormat('json')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeFormat === 'json' ? 'var(--accent)' : 'transparent',
                color: activeFormat === 'json' ? '#fff' : 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Database size={15} /> Full Project JSON (.json)
            </button>
          </div>

          {/* Compilation Options */}
          {activeFormat !== 'json' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeSceneTitles}
                  onChange={(e) => setIncludeSceneTitles(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Include Scene Titles
              </label>

              {activeFormat === 'markdown' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeSynopsis}
                    onChange={(e) => setIncludeSynopsis(e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  Include Synopsis Notes
                </label>
              )}
            </div>
          )}
        </div>

        {/* Notice Banner */}
        {importNotice && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: importNotice.type === 'success' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: importNotice.type === 'success' ? '#4ade80' : '#ef4444',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{importNotice.message}</span>
            <button
              onClick={() => setImportNotice(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Main Preview Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Preview ({compiledStats.words.toLocaleString()} words · {compiledStats.chars.toLocaleString()} characters · {compiledStats.chapters} chapters · {compiledStats.scenes} scenes)</span>
            {activeFormat === 'json' && onImportProject && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={14} /> Restore / Import Backup JSON
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              flex: 1,
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-canvas)',
              overflow: 'hidden',
              display: 'flex',
              position: 'relative',
            }}
          >
            <textarea
              readOnly
              value={compiledContent}
              style={{
                width: '100%',
                height: '100%',
                padding: '16px',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                resize: 'none',
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card-subtle)',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Ready to distribute, print, publish, or backup your novel.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={16} color="var(--accent)" /> : <Copy size={16} />}
              {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
            </button>

            <button
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(235, 94, 40, 0.3)',
              }}
            >
              <Download size={16} />
              Download {activeFormat.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
