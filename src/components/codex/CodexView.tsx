import React, { useState } from 'react';
import { LoreEntry, LoreCategory } from '../../types/project';
import { NewCodexModal } from './NewCodexModal';
import { 
  User, 
  MapPin, 
  Shield, 
  Sparkles, 
  Plus, 
  Search, 
  Trash2,
  Tag,
  Link2,
  ExternalLink,
  Edit2
} from 'lucide-react';

interface CodexViewProps {
  loreList: LoreEntry[];
  initialSelectedId?: string;
  onUpdateLore: (updated: LoreEntry) => void;
  onAddLore: (category: LoreCategory, name?: string, content?: string) => string | void;
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
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New relationship form state
  const [newRelTo, setNewRelTo] = useState('');
  const [newRelType, setNewRelType] = useState('');
  const [newAlias, setNewAlias] = useState('');

  const activeEntry = loreList.find((item) => item.id === selectedId) || loreList[0];

  const handleCreateEntry = (category: LoreCategory, entryName: string, starterContent: string) => {
    const newId = onAddLore(category, entryName, starterContent);
    if (typeof newId === 'string') {
      setSelectedId(newId);
    }
    if (selectedCategory !== 'all' && selectedCategory !== category) {
      setSelectedCategory('all');
    }
  };

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

  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntry || !newRelTo.trim() || !newRelType.trim()) return;

    const existingRels = activeEntry.relationships || [];
    const updated = {
      ...activeEntry,
      relationships: [...existingRels, { to: newRelTo.trim(), type: newRelType.trim() }],
    };
    onUpdateLore(updated);
    setNewRelTo('');
    setNewRelType('');
  };

  const handleRemoveRelationship = (index: number) => {
    if (!activeEntry || !activeEntry.relationships) return;
    const updatedRels = activeEntry.relationships.filter((_, idx) => idx !== index);
    onUpdateLore({
      ...activeEntry,
      relationships: updatedRels,
    });
  };

  const handleAddAlias = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newAlias.trim() && activeEntry) {
      e.preventDefault();
      const existing = activeEntry.aliases || [];
      if (!existing.includes(newAlias.trim())) {
        onUpdateLore({
          ...activeEntry,
          aliases: [...existing, newAlias.trim()],
        });
      }
      setNewAlias('');
    }
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    if (!activeEntry || !activeEntry.aliases) return;
    onUpdateLore({
      ...activeEntry,
      aliases: activeEntry.aliases.filter((a) => a !== aliasToRemove),
    });
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
              onClick={() => setIsNewModalOpen(true)}
              title="Add character, location, or lore entry"
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
                cursor: 'pointer',
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
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            {/* Header / Profile card */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ flex: 1, marginRight: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <input
                    value={activeEntry.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      onUpdateLore({
                        ...activeEntry,
                        name: newName,
                        slug: newSlug || activeEntry.slug,
                      });
                    }}
                    placeholder="Entry Name..."
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      border: '1px solid transparent',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      backgroundColor: 'transparent',
                      width: '100%',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  />

                  {/* Category Selector */}
                  <select
                    value={activeEntry.category}
                    onChange={(e) => onUpdateLore({ ...activeEntry, category: e.target.value as LoreCategory })}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--accent-pill)',
                      color: 'var(--accent-pill-text)',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="character">Character</option>
                    <option value="location">Location</option>
                    <option value="faction">Faction</option>
                    <option value="lore">Lore</option>
                    <option value="item">Item</option>
                  </select>
                </div>

                {/* Role / Tagline input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <input
                    value={activeEntry.role || ''}
                    onChange={(e) => onUpdateLore({ ...activeEntry, role: e.target.value })}
                    placeholder="Role (e.g. Protagonist, Kingdom, Artifact)..."
                    style={{
                      fontSize: '13px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      width: '240px',
                    }}
                  />
                  <span>Wiki tag: </span>
                  <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '12px' }}>
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
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Trash2 size={13} />
                <span>Delete Entry</span>
              </button>
            </div>

            {/* Aliases Section */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}>
                Aliases & Alternate Names
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                {(activeEntry.aliases || []).map((alias) => (
                  <span
                    key={alias}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-active)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                    }}
                  >
                    <span>{alias}</span>
                    <button
                      onClick={() => handleRemoveAlias(alias)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  onKeyDown={handleAddAlias}
                  placeholder="+ Add alias (press Enter)..."
                  style={{
                    fontSize: '12px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-subtle)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    width: '160px',
                  }}
                />
              </div>
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
                placeholder="Brief summary or logline for this character or subject..."
                style={{
                  width: '100%',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  padding: '10px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  outline: 'none',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Profile Content / Backstory */}
            <div style={{ marginBottom: '28px' }}>
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
                placeholder="Full background, personality traits, secrets, historical significance..."
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
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Interactive Key Relationships Section */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: 0,
                }}>
                  <Link2 size={14} color="var(--accent-primary)" />
                  Key Relationships
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Connections to characters, factions & places
                </span>
              </div>

              {/* List of existing relationships */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {(!activeEntry.relationships || activeEntry.relationships.length === 0) ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                    No relationships linked yet. Connect this entry to other characters or places below.
                  </div>
                ) : (
                  activeEntry.relationships.map((rel, idx) => {
                    // Check if target entity exists in loreList to allow jump
                    const targetEntity = loreList.find((l) => l.name.toLowerCase() === rel.to.toLowerCase());

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rel.to}</span>
                          {targetEntity && (
                            <button
                              onClick={() => setSelectedId(targetEntity.id)}
                              title={`Jump to ${targetEntity.name} in Codex`}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-primary)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--bg-active)',
                            color: 'var(--text-secondary)',
                          }}>
                            {rel.type}
                          </span>

                          <button
                            onClick={() => handleRemoveRelationship(idx)}
                            title="Remove relationship"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Relationship Form */}
              <form
                onSubmit={handleAddRelationship}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  paddingTop: '10px',
                  borderTop: '1px dashed var(--border-subtle)',
                }}
              >
                {/* Target dropdown or custom input */}
                <input
                  list="lore-targets-datalist"
                  value={newRelTo}
                  onChange={(e) => setNewRelTo(e.target.value)}
                  placeholder="Target (character/place)..."
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <datalist id="lore-targets-datalist">
                  {loreList
                    .filter((l) => l.id !== activeEntry.id)
                    .map((l) => (
                      <option key={l.id} value={l.name} />
                    ))}
                </datalist>

                <input
                  value={newRelType}
                  onChange={(e) => setNewRelType(e.target.value)}
                  placeholder="Relationship (e.g. Sister, Rival, Mentor)..."
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />

                <button
                  type="submit"
                  disabled={!newRelTo.trim() || !newRelType.trim()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: (!newRelTo.trim() || !newRelType.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (!newRelTo.trim() || !newRelType.trim()) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={13} />
                  <span>Add Link</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Select an entry to view details.
          </div>
        )}
      </main>

      {/* New Codex Entry Type Popup Modal */}
      <NewCodexModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateEntry}
      />
    </div>
  );
};
