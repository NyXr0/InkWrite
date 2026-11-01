import React, { useState, useMemo } from 'react';
import { LoreEntry, LoreCategory, SceneItem, TimelineEvent } from '../../types/project';
import { CODEX_CATEGORIES, CodexCategoryConfig, CodexFieldDefinition } from '../../core/codexSchema';
import { NewCodexModal } from './NewCodexModal';
import { 
  User, 
  MapPin, 
  Shield, 
  Sparkles, 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Link2, 
  ExternalLink, 
  BookOpen, 
  Calendar, 
  FileText, 
  Layers, 
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CodexViewProps {
  loreList: LoreEntry[];
  initialSelectedId?: string;
  onUpdateLore: (updated: LoreEntry) => void;
  onAddLore: (
    category: LoreCategory, 
    name?: string, 
    content?: string, 
    attributes?: Record<string, string>, 
    role?: string
  ) => string | void;
  onDeleteLore: (loreId: string) => void;
  onOpenScene: (sceneId: string) => void;
  scenes?: SceneItem[];
  timelineEvents?: TimelineEvent[];
}

type CodexTab = 'profile' | 'web' | 'manuscript' | 'timeline' | 'notes';

export const CodexView: React.FC<CodexViewProps> = ({
  loreList,
  initialSelectedId,
  onUpdateLore,
  onAddLore,
  onDeleteLore,
  onOpenScene,
  scenes = [],
  timelineEvents = [],
}) => {
  const [selectedId, setSelectedId] = useState<string>(initialSelectedId || loreList[0]?.id || '');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CodexTab>('profile');

  // Relationship creation state
  const [newRelTarget, setNewRelTarget] = useState('');
  const [newRelType, setNewRelType] = useState('');
  const [newAlias, setNewAlias] = useState('');

  // Active entry resolution
  const activeEntry = loreList.find((item) => item.id === selectedId) || loreList[0];
  const activeConfig: CodexCategoryConfig = activeEntry 
    ? (CODEX_CATEGORIES[activeEntry.category] || CODEX_CATEGORIES.character)
    : CODEX_CATEGORIES.character;

  const handleCreateEntry = (
    category: LoreCategory, 
    entryName: string, 
    starterContent: string, 
    attributes?: Record<string, string>, 
    role?: string
  ) => {
    const newId = onAddLore(category, entryName, starterContent, attributes, role);
    if (typeof newId === 'string') {
      setSelectedId(newId);
    }
    if (selectedCategoryFilter !== 'all' && selectedCategoryFilter !== category) {
      setSelectedCategoryFilter('all');
    }
  };

  // Category Counts for sidebar filters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: loreList.length,
      character: 0,
      location: 0,
      lore: 0,
      item: 0,
      faction: 0,
    };
    for (const item of loreList) {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    }
    return counts;
  }, [loreList]);

  // Filtered sidebar items
  const filteredLore = useMemo(() => {
    return loreList.filter((item) => {
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.role && item.role.toLowerCase().includes(q)) return true;
      if (item.summary && item.summary.toLowerCase().includes(q)) return true;
      if (item.aliases && item.aliases.some((a) => a.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [loreList, selectedCategoryFilter, searchQuery]);

  const getCategoryIcon = (cat: LoreCategory, size: number = 14) => {
    switch (cat) {
      case 'character':
        return <User size={size} color={CODEX_CATEGORIES.character.color} />;
      case 'location':
        return <MapPin size={size} color={CODEX_CATEGORIES.location.color} />;
      case 'lore':
        return <Sparkles size={size} color={CODEX_CATEGORIES.lore.color} />;
      case 'item':
        return <Package size={size} color={CODEX_CATEGORIES.item.color} />;
      case 'faction':
        return <Shield size={size} color={CODEX_CATEGORIES.faction.color} />;
    }
  };

  const handleDeleteEntry = (e: React.MouseEvent, lore: LoreEntry) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Permanently delete "${lore.name}" from your Story Codex?`);
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

  // -------------------------------------------------------------
  // Anti-Hallucination Interconnected Canon Linking Engine
  // -------------------------------------------------------------

  // 1. Direct Outgoing Relationships
  const directRelationships = useMemo(() => {
    if (!activeEntry || !activeEntry.relationships) return [];
    return activeEntry.relationships.map((rel, idx) => {
      const targetEntity = loreList.find(
        (l) => l.name.toLowerCase() === rel.to.toLowerCase() || l.slug.toLowerCase() === rel.to.toLowerCase()
      );
      return {
        ...rel,
        originalIndex: idx,
        isOutgoing: true,
        targetEntity,
      };
    });
  }, [activeEntry, loreList]);

  // 2. Computed Backlinks (Inverted Index: Other entities that link to this one)
  const backlinks = useMemo(() => {
    if (!activeEntry) return [];
    const targetNames = [
      activeEntry.name.toLowerCase(),
      activeEntry.slug.toLowerCase(),
      ...(activeEntry.aliases || []).map((a) => a.toLowerCase()),
    ];

    const results: {
      sourceEntity: LoreEntry;
      type: string;
    }[] = [];

    for (const other of loreList) {
      if (other.id === activeEntry.id) continue;
      if (!other.relationships) continue;

      for (const rel of other.relationships) {
        if (targetNames.includes(rel.to.toLowerCase())) {
          results.push({
            sourceEntity: other,
            type: rel.type,
          });
        }
      }
    }
    return results;
  }, [activeEntry, loreList]);

  // 3. Manuscript Scene Mentions (Zero Hallucination - Grounded in Real Text)
  const manuscriptAppearances = useMemo(() => {
    if (!activeEntry || scenes.length === 0) return [];
    const searchTerms = [
      activeEntry.name.toLowerCase(),
      `@${activeEntry.name.toLowerCase()}`,
      `[[${activeEntry.slug.toLowerCase()}]]`,
      ...(activeEntry.aliases || []).map((a) => a.toLowerCase()),
    ];

    return scenes
      .map((scene) => {
        const text = scene.content.toLowerCase();
        const isPov = scene.pov && scene.pov.toLowerCase() === activeEntry.name.toLowerCase();
        const isSetting = scene.locations && scene.locations.some((loc) => loc.toLowerCase() === activeEntry.name.toLowerCase());
        
        let matchIndex = -1;
        let matchedTerm = '';
        for (const term of searchTerms) {
          const idx = text.indexOf(term);
          if (idx !== -1) {
            matchIndex = idx;
            matchedTerm = term;
            break;
          }
        }

        const isMentioned = isPov || isSetting || matchIndex !== -1;
        if (!isMentioned) return null;

        // Extract context snippet around the match
        let snippet = '';
        if (matchIndex !== -1) {
          const start = Math.max(0, matchIndex - 60);
          const end = Math.min(scene.content.length, matchIndex + matchedTerm.length + 80);
          snippet = (start > 0 ? '...' : '') + scene.content.substring(start, end).replace(/\n+/g, ' ') + (end < scene.content.length ? '...' : '');
        } else if (isPov) {
          snippet = `Narrated from ${activeEntry.name}'s point of view.`;
        } else if (isSetting) {
          snippet = `Explicitly set at ${activeEntry.name}.`;
        }

        return {
          scene,
          isPov,
          isSetting,
          snippet,
        };
      })
      .filter((res): res is NonNullable<typeof res> => res !== null);
  }, [activeEntry, scenes]);

  // 4. Timeline Events Involving This Entity
  const matchingTimelineEvents = useMemo(() => {
    if (!activeEntry || timelineEvents.length === 0) return [];
    const names = [
      activeEntry.name.toLowerCase(),
      ...(activeEntry.aliases || []).map((a) => a.toLowerCase()),
    ];

    return timelineEvents.filter((ev) => {
      // Check character participants
      if (ev.characters && ev.characters.some((c) => names.includes(c.toLowerCase()))) return true;
      // Check title and summary
      const text = `${ev.title} ${ev.summary} ${ev.lane}`.toLowerCase();
      return names.some((n) => text.includes(n));
    });
  }, [activeEntry, timelineEvents]);

  // Relationship handlers
  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntry || !newRelTarget.trim() || !newRelType.trim()) return;

    const existingRels = activeEntry.relationships || [];
    const updated = {
      ...activeEntry,
      relationships: [...existingRels, { to: newRelTarget.trim(), type: newRelType.trim() }],
    };
    onUpdateLore(updated);
    setNewRelTarget('');
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

  // Alias handlers
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

  // Attribute update handler
  const handleUpdateAttribute = (key: string, value: string) => {
    if (!activeEntry) return;
    const currentAttrs = activeEntry.attributes || {};
    onUpdateLore({
      ...activeEntry,
      attributes: {
        ...currentAttrs,
        [key]: value,
      },
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
      {/* ------------------------------------------------------------- */}
      {/* Left Sidebar: Filtered List of Elements */}
      {/* ------------------------------------------------------------- */}
      <aside style={{
        width: '330px',
        height: '100%',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Header with Search and New Button */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Codex & World Bible
              </h2>
            </div>
            <button
              onClick={() => setIsNewModalOpen(true)}
              title="Add character, location, item, lore, or faction"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 2px 5px rgba(235, 94, 40, 0.25)',
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
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
              placeholder="Search characters, lore, items..."
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

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              style={{
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: selectedCategoryFilter === 'all' ? 600 : 400,
                backgroundColor: selectedCategoryFilter === 'all' ? 'var(--bg-active)' : 'transparent',
                color: selectedCategoryFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              All ({categoryCounts.all})
            </button>

            {(['character', 'location', 'lore', 'item', 'faction'] as LoreCategory[]).map((catId) => {
              const cfg = CODEX_CATEGORIES[catId];
              const isSelected = selectedCategoryFilter === catId;
              const count = categoryCounts[catId] || 0;

              return (
                <button
                  key={catId}
                  onClick={() => setSelectedCategoryFilter(catId)}
                  title={cfg.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? cfg.bgLight : 'transparent',
                    color: isSelected ? cfg.color : 'var(--text-secondary)',
                    border: isSelected ? `1px solid ${cfg.borderLight}` : '1px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getCategoryIcon(catId, 11)}
                  <span>{cfg.shortName}</span>
                  <span style={{ opacity: 0.7, fontSize: '10px' }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredLore.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
              No entries found. Click "+ New" to add your first {selectedCategoryFilter === 'all' ? 'element' : selectedCategoryFilter}.
            </div>
          ) : (
            filteredLore.map((item) => {
              const isSelected = item.id === selectedId;
              const itemConfig = CODEX_CATEGORIES[item.category] || CODEX_CATEGORIES.character;

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
                    borderLeft: isSelected ? `3px solid ${itemConfig.color}` : '3px solid transparent',
                    marginBottom: '2px',
                    transition: 'all 0.1s ease',
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
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: itemConfig.bgLight,
                      border: `1px solid ${itemConfig.borderLight}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {getCategoryIcon(item.category, 14)}
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
                        color: isSelected ? itemConfig.color : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <span>{item.role || itemConfig.name}</span>
                        {item.relationships && item.relationships.length > 0 && (
                          <span style={{ fontSize: '10px', opacity: 0.8 }}>
                            • {item.relationships.length} links
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className="lore-trash-btn"
                    onClick={(e) => handleDeleteEntry(e, item)}
                    title={`Delete ${item.name}`}
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      color: '#dc2626',
                      opacity: 0,
                      transition: 'opacity 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* Right Detail Pane: Category-Specific Attributes & Canon Web */}
      {/* ------------------------------------------------------------- */}
      <main style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        padding: '28px 44px',
        backgroundColor: 'var(--bg-app)',
      }}>
        {activeEntry ? (
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            
            {/* Top Identity Card */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '18px',
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
                      e.currentTarget.style.borderColor = activeConfig.color;
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  />

                  {/* Category Badge & Converter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: activeConfig.bgLight,
                      border: `1px solid ${activeConfig.borderLight}`,
                      color: activeConfig.color,
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      {getCategoryIcon(activeEntry.category, 13)}
                      <span>{activeConfig.name}</span>
                    </div>

                    <select
                      value={activeEntry.category}
                      onChange={(e) => onUpdateLore({ ...activeEntry, category: e.target.value as LoreCategory })}
                      title="Switch category"
                      style={{
                        fontSize: '11px',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="character">Character</option>
                      <option value="location">Location</option>
                      <option value="lore">Lore & World</option>
                      <option value="item">Item & Artifact</option>
                      <option value="faction">Faction & Order</option>
                    </select>
                  </div>
                </div>

                {/* Subtitle / Role & Wiki Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <input
                    value={activeEntry.role || ''}
                    onChange={(e) => onUpdateLore({ ...activeEntry, role: e.target.value })}
                    placeholder={`Role / Subtitle (e.g. ${
                      activeEntry.category === 'character' ? 'Crown Princess' :
                      activeEntry.category === 'location' ? 'Ancient Capital' :
                      activeEntry.category === 'lore' ? 'Arcane Axiom' :
                      activeEntry.category === 'item' ? 'Legendary Blade' :
                      'Knightly Order'
                    })...`}
                    style={{
                      fontSize: '13px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      width: '260px',
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Wiki tag:</span>
                    <code style={{
                      fontFamily: 'var(--font-mono)',
                      color: activeConfig.color,
                      backgroundColor: activeConfig.bgLight,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}>
                      [[{activeEntry.slug}|{activeEntry.name}]]
                    </code>
                  </div>
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
                <span>Delete</span>
              </button>
            </div>

            {/* Anti-Hallucination Canon Status Pill Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} color="#10b981" />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Continuity Grounded:</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Link2 size={13} color={activeConfig.color} />
                  <span>{directRelationships.length + backlinks.length} Lore Connections</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <BookOpen size={13} color="#3b82f6" />
                  <span>{manuscriptAppearances.length} Manuscript Scenes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Calendar size={13} color="#8b5cf6" />
                  <span>{matchingTimelineEvents.length} Timeline Events</span>
                </div>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {activeConfig.tagline}
              </span>
            </div>

            {/* Interactive View Navigation Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '22px',
            }}>
              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  borderBottom: activeTab === 'profile' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'profile' ? 600 : 400,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Layers size={14} color={activeTab === 'profile' ? activeConfig.color : 'var(--text-muted)'} />
                <span>Dedicated Attributes</span>
              </button>

              <button
                onClick={() => setActiveTab('web')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  borderBottom: activeTab === 'web' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 'web' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'web' ? 600 : 400,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Link2 size={14} color={activeTab === 'web' ? activeConfig.color : 'var(--text-muted)'} />
                <span>Connected Lore Web ({directRelationships.length + backlinks.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('manuscript')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  borderBottom: activeTab === 'manuscript' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 'manuscript' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'manuscript' ? 600 : 400,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <BookOpen size={14} color={activeTab === 'manuscript' ? '#3b82f6' : 'var(--text-muted)'} />
                <span>Manuscript Appearances ({manuscriptAppearances.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  borderBottom: activeTab === 'timeline' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 'timeline' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'timeline' ? 600 : 400,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Calendar size={14} color={activeTab === 'timeline' ? '#8b5cf6' : 'var(--text-muted)'} />
                <span>Timeline ({matchingTimelineEvents.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  borderBottom: activeTab === 'notes' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'notes' ? 600 : 400,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <FileText size={14} color={activeTab === 'notes' ? activeConfig.color : 'var(--text-muted)'} />
                <span>Dossier & Notes</span>
              </button>
            </div>

            {/* TAB 1: DEDICATED CATEGORY ATTRIBUTES */}
            {activeTab === 'profile' && (
              <div>
                {/* Short Summary Field */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}>
                    Core Summary & Hook
                  </label>
                  <textarea
                    value={activeEntry.summary || ''}
                    onChange={(e) => onUpdateLore({ ...activeEntry, summary: e.target.value })}
                    rows={2}
                    placeholder={`One or two sentences defining ${activeEntry.name} in the story...`}
                    style={{
                      width: '100%',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Aliases & Alternate Names */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}>
                    Aliases, Titles & Honorifics
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    {(activeEntry.aliases || []).map((alias) => (
                      <span
                        key={alias}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--bg-active)',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          border: '1px solid var(--border-subtle)',
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
                        padding: '4px 10px',
                        borderRadius: '12px',
                        border: '1px dashed var(--border-subtle)',
                        backgroundColor: 'transparent',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        width: '180px',
                      }}
                    />
                  </div>
                </div>

                {/* Category-Specific Grid of Fields */}
                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  padding: '20px',
                  marginBottom: '24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    {getCategoryIcon(activeEntry.category, 18)}
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {activeConfig.name} Attributes
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ({activeConfig.tagline})
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {activeConfig.fields.map((field) => {
                      const value = (activeEntry.attributes && activeEntry.attributes[field.key]) || '';

                      return (
                        <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                              {field.label}
                            </label>
                            {field.helpText && (
                              <span title={field.helpText} style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                                <Info size={12} />
                              </span>
                            )}
                          </div>

                          {field.type === 'select' ? (
                            <select
                              value={value}
                              onChange={(e) => handleUpdateAttribute(field.key, e.target.value)}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                outline: 'none',
                              }}
                            >
                              <option value="">-- Choose {field.label} --</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              value={value}
                              onChange={(e) => handleUpdateAttribute(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              rows={3}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                outline: 'none',
                                resize: 'vertical',
                              }}
                            />
                          ) : (
                            <input
                              value={value}
                              onChange={(e) => handleUpdateAttribute(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                outline: 'none',
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Switch to Full Notes */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setActiveTab('notes')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: activeConfig.color,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    <span>Edit Detailed Dossier & Backstory Notes</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CONNECTED STORY WEB (INTERCONNECTED CROSS-LINKING) */}
            {activeTab === 'web' && (
              <div>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <Link2 size={16} color={activeConfig.color} />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong>Interconnected Canon Web:</strong> Every connection you establish between characters, locations, factions, and items is tracked bidirectionally so neither the writer nor the system ever hallucinates facts.
                  </div>
                </div>

                {/* Section A: Direct Outgoing Links */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Direct Connections ({directRelationships.length})
                  </h4>

                  {directRelationships.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px' }}>
                      No direct connections added yet. Use the form below to link this {activeConfig.name} to another character, faction, location, or artifact.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {directRelationships.map((rel) => {
                        const targetConfig = rel.targetEntity 
                          ? CODEX_CATEGORIES[rel.targetEntity.category]
                          : null;

                        return (
                          <div
                            key={rel.originalIndex}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: activeConfig.bgLight,
                                color: activeConfig.color,
                                border: `1px solid ${activeConfig.borderLight}`,
                              }}>
                                {rel.type}
                              </span>

                              <ArrowRight size={13} color="var(--text-muted)" />

                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {rel.to}
                              </span>

                              {rel.targetEntity && targetConfig && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: targetConfig.bgLight,
                                  color: targetConfig.color,
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                }}>
                                  {targetConfig.shortName}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {rel.targetEntity && (
                                <button
                                  onClick={() => setSelectedId(rel.targetEntity!.id)}
                                  title={`Jump to ${rel.targetEntity.name} in Codex`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--bg-active)',
                                    color: 'var(--accent-primary)',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span>View</span>
                                  <ExternalLink size={11} />
                                </button>
                              )}

                              <button
                                onClick={() => handleRemoveRelationship(rel.originalIndex)}
                                title="Remove connection"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '4px',
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
                      })}
                    </div>
                  )}
                </div>

                {/* Section B: Inbound Backlinks (Inverted Index) */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Inbound Connections ({backlinks.length})
                  </h4>

                  {backlinks.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px' }}>
                      No other codex elements point directly to {activeEntry.name} yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {backlinks.map((link, idx) => {
                        const sourceConfig = CODEX_CATEGORIES[link.sourceEntity.category];

                        return (
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {link.sourceEntity.name}
                              </span>

                              <span style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: sourceConfig.bgLight,
                                color: sourceConfig.color,
                                textTransform: 'uppercase',
                                fontWeight: 700,
                              }}>
                                {sourceConfig.shortName}
                              </span>

                              <span style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--bg-active)',
                                color: 'var(--text-secondary)',
                              }}>
                                connects as: "{link.type}"
                              </span>
                            </div>

                            <button
                              onClick={() => setSelectedId(link.sourceEntity.id)}
                              title={`Jump to ${link.sourceEntity.name} in Codex`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-active)',
                                color: 'var(--accent-primary)',
                                fontSize: '11px',
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <span>Inspect Source</span>
                              <ExternalLink size={11} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Form to Add New Relationship */}
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    + Link to Another Story Element
                  </h4>

                  <form onSubmit={handleAddRelationship} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <input
                        list="codex-elements-datalist"
                        value={newRelTarget}
                        onChange={(e) => setNewRelTarget(e.target.value)}
                        placeholder="Select or type target element..."
                        style={{
                          width: '100%',
                          fontSize: '12px',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <datalist id="codex-elements-datalist">
                        {loreList
                          .filter((l) => l.id !== activeEntry.id)
                          .map((l) => (
                            <option key={l.id} value={l.name}>
                              {l.name} ({CODEX_CATEGORIES[l.category].name})
                            </option>
                          ))}
                      </datalist>
                    </div>

                    <div style={{ flex: '1 1 180px' }}>
                      <input
                        list="codex-presets-datalist"
                        value={newRelType}
                        onChange={(e) => setNewRelType(e.target.value)}
                        placeholder="Relationship (e.g. Wields, Ruler of)..."
                        style={{
                          width: '100%',
                          fontSize: '12px',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <datalist id="codex-presets-datalist">
                        {activeConfig.relationshipPresets.map((preset) => (
                          <option key={preset} value={preset} />
                        ))}
                      </datalist>
                    </div>

                    <button
                      type="submit"
                      disabled={!newRelTarget.trim() || !newRelType.trim()}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: activeConfig.color,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: (!newRelTarget.trim() || !newRelType.trim()) ? 'not-allowed' : 'pointer',
                        opacity: (!newRelTarget.trim() || !newRelType.trim()) ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>Establish Canon Link</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: MANUSCRIPT OCCURRENCES (GROUNDED REALITY) */}
            {activeTab === 'manuscript' && (
              <div>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <BookOpen size={16} color="#3b82f6" />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong>Manuscript Presence:</strong> Every time this {activeConfig.name} is mentioned or active in a scene, it is automatically tracked below with a 1-click jump into the Writer Studio editor.
                  </div>
                </div>

                {manuscriptAppearances.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <AlertCircle size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Not Yet Mentioned in Manuscript
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                      Type <code>@{activeEntry.name}</code> or <code>[[{activeEntry.slug}|{activeEntry.name}]]</code> in any scene editor to weave this element into your novel!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {manuscriptAppearances.map(({ scene, isPov, isSetting, snippet }) => (
                      <div
                        key={scene.id}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {scene.title}
                            </span>
                            {isPov && (
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                                POV Scene
                              </span>
                            )}
                            {isSetting && (
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                                Location Setting
                              </span>
                            )}
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              • {scene.wordCount} words
                            </span>
                          </div>

                          <button
                            onClick={() => onOpenScene(scene.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--accent-primary)',
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <span>Open Scene in Editor</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>

                        {snippet && (
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-app)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontFamily: 'var(--font-serif)',
                            lineHeight: 1.5,
                          }}>
                            {snippet}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: TIMELINE EVENTS */}
            {activeTab === 'timeline' && (
              <div>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <Calendar size={16} color="#8b5cf6" />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong>Canonical Timeline Anchors:</strong> Chronological events from your novel's story timeline involving {activeEntry.name}.
                  </div>
                </div>

                {matchingTimelineEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <Calendar size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No Timeline Events Linked
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                      Add this character or element as a participant in your Timeline view to lock in chronological story milestones!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {matchingTimelineEvents.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ev.title}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                            {ev.date || 'Undated'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>Story Lane: {ev.lane || 'Main'}</span>
                          {ev.characters && ev.characters.length > 0 && (
                            <>
                              <span>•</span>
                              <span>Cast: {ev.characters.join(', ')}</span>
                            </>
                          )}
                        </div>

                        {ev.summary && (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
                            {ev.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: DOSSIER & FULL NOTES */}
            {activeTab === 'notes' && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                }}>
                  Detailed Dossier, Backstory & Lore Notes
                </label>
                <textarea
                  value={activeEntry.content || ''}
                  onChange={(e) => onUpdateLore({ ...activeEntry, content: e.target.value })}
                  rows={18}
                  placeholder="Full background, secret history, personality notes, and rules..."
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '15px',
                    lineHeight: '1.7',
                    padding: '16px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Select an element from the list or click "+ New" to begin building your story bible.
          </div>
        )}
      </main>

      {/* New Codex Entry Popup Modal */}
      <NewCodexModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateEntry}
      />
    </div>
  );
};
