import React, { useState } from 'react';
import { LoreEntry, LoreCategory } from '../../types/project';
import { 
  User, 
  MapPin, 
  Shield, 
  Sparkles, 
  Plus, 
  Search, 
  Trash2 
} from 'lucide-react';

interface CodexViewProps {
  loreList: LoreEntry[];
  initialSelectedId?: string;
  onUpdateLore: (updated: LoreEntry) => void;
  onAddLore: (category: LoreCategory) => void;
  onDeleteLore: (loreId: string) => void;
  onOpenScene: (sceneId: string) => void;
}

export const CodexView: React.FC<CodexViewProps> = ({
  loreList,
  initialSelectedId,
  onUpdateLore,
  onAddLore,
  onDeleteLore,
  onOpenScene,
}) => {
  const [selectedId, setSelectedId] = useState<string>(initialSelectedId || loreList[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeEntry = loreList.find((item) => item.id === selectedId) || loreList[0];

  const filteredLore = loreList.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getCategoryIcon = (cat: LoreCategory) => {
    switch (cat) {
      case 'character':
        return <User size={14} color="var(--accent-primary)" />;
      case 'location':
        return <MapPin size={14} color="var(--accent-secondary)" />;
      case 'faction':
        return <Shield size={14} color="#9333ea" />;
      case 'lore':
      case 'item':
      default:
        return <Sparkles size={14} color="#eab308" />;
    }
  };

  const handleDeleteEntry = (e: React.MouseEvent, lore: LoreEntry) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete codex entry "${lore.name}"?`);
    if (confirmed) {
      onDeleteLore(lore.id);
      if (activeEntry && activeEntry.id === lore.id) {
        const remaining = loreList.filter((l) => l.id !== lore.id);
        if (remaining.length > 0) {
          setSelectedId(remaining[0].id);
        }
      }
    }
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: 'var(--bg-app)',
      display: 'flex',
      overflow: 'hidden',
    }}>
      {/* Left List Pane */}
      <aside style={{
        width: '320px',
        height: '100%',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Search & Filter Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Codex & Story Bible
            </h2>
            <button
              onClick={() => onAddLore('character')}
              title="Add character or lore"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              <Plus size={12} />
              <span>New</span>
            </button>
          </div>

          {/* Search box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            marginBottom: '10px',
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search codex..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                width: '100%',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
            {['all', 'character', 'location', 'lore'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  textTransform: 'capitalize',
                  backgroundColor: selectedCategory === cat ? 'var(--bg-active)' : 'transparent',
                  color: selectedCategory === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: selectedCategory === cat ? 600 : 400,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lore Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredLore.map((item) => {
            const isSelected = item.id === selectedId;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  marginBottom: '2px',
                }}
                onMouseEnter={(e) => {
                  const del = e.currentTarget.querySelector('.lore-trash-btn') as HTMLElement;
                  if (del) del.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const del = e.currentTarget.querySelector('.lore-trash-btn') as HTMLElement;
                  if (del) del.style.opacity = '0';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '5px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getCategoryIcon(item.category)}
                  </div>

                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 500,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.role || item.category}
                    </div>
                  </div>
                </div>

                <button
                  className="lore-trash-btn"
                  onClick={(e) => handleDeleteEntry(e, item)}
                  title="Delete entry"
                  style={{
                    padding: '4px',
                    borderRadius: '4px',
                    color: '#dc2626',
                    opacity: 0,
                    transition: 'opacity 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Detail Pane */}
      <main style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        padding: '32px 48px',
        backgroundColor: 'var(--bg-app)',
      }}>
        {activeEntry ? (
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Header / Profile card */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h1 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '28px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {activeEntry.name}
                  </h1>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--accent-pill)',
                    color: 'var(--accent-pill-text)',
                  }}>
                    {activeEntry.category}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {activeEntry.role && <strong style={{ color: 'var(--text-primary)' }}>{activeEntry.role} • </strong>}
                  <span>Wiki link: </span>
                  <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                    [[{activeEntry.slug}|{activeEntry.name}]]
                  </code>
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteEntry(e, activeEntry)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Trash2 size={13} />
                <span>Delete Entry</span>
              </button>
            </div>

            {/* Summary field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}>
                Short Summary
              </label>
              <textarea
                value={activeEntry.summary}
                onChange={(e) => onUpdateLore({ ...activeEntry, summary: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  padding: '10px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Profile Content / Backstory */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}>
                Dossier & Lore Notes
              </label>
              <textarea
                value={activeEntry.content}
                onChange={(e) => onUpdateLore({ ...activeEntry, content: e.target.value })}
                rows={12}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '16px',
                  lineHeight: '1.7',
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Relationships */}
            {activeEntry.relationships && activeEntry.relationships.length > 0 && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                }}>
                  Key Relationships
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeEntry.relationships.map((rel, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{rel.to}</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-active)',
                        color: 'var(--text-secondary)',
                      }}>
                        {rel.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Select an entry to view details.
          </div>
        )}
      </main>
    </div>
  );
};
