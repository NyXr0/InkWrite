import React, { useState, useMemo, useRef } from 'react';
import { LoreEntry, LoreCategory, SceneItem, TimelineEvent, LoreImage } from '../../types/project';
import { CODEX_CATEGORIES, CodexCategoryConfig, CodexFieldDefinition } from '../../core/codexSchema';
import { compressAndReadImageFile, isValidImageUrl, createLoreImageItem } from '../../core/imageUtils';
import { ImageLightboxModal } from '../ui/ImageLightboxModal';
import { NewCodexModal } from './NewCodexModal';
import { ObsidianNodeGraph } from './ObsidianNodeGraph';
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
  AlertCircle,
  Network,
  Compass,
  GitFork,
  Maximize2,
  Image as ImageIcon,
  Upload,
  Star,
  Check
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
    role?: string,
    imageUrl?: string,
    gallery?: LoreImage[]
  ) => string | void;
  onDeleteLore: (loreId: string) => void;
  onOpenScene: (sceneId: string) => void;
  scenes?: SceneItem[];
  timelineEvents?: TimelineEvent[];
}

export type CodexRibbonTab = 'dossier' | 'graph' | 'local-graph';
type CodexElementTab = 'profile' | 'visuals' | 'web' | 'graph' | 'manuscript' | 'timeline' | 'notes';

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
  // Bottom Ribbon Mode ('dossier' = 2-pane dossiers, 'graph' = Obsidian global graph, 'local-graph' = Local subgraph)
  const [ribbonTab, setRibbonTab] = useState<CodexRibbonTab>('dossier');

  const [selectedId, setSelectedId] = useState<string>(initialSelectedId || loreList[0]?.id || '');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [elementTab, setElementTab] = useState<CodexElementTab>('profile');

  // Relationship creation state
  const [newRelTarget, setNewRelTarget] = useState('');
  const [newRelType, setNewRelType] = useState('');
  const [newAlias, setNewAlias] = useState('');

  // Image & Visuals management state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isEnteringPortraitUrl, setIsEnteringPortraitUrl] = useState(false);
  const [portraitUrlInput, setPortraitUrlInput] = useState('');
  const [isAddingGalleryUrl, setIsAddingGalleryUrl] = useState(false);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [galleryCaptionInput, setGalleryCaptionInput] = useState('');
  const [imageError, setImageError] = useState('');
  const portraitFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

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
    role?: string,
    imageUrl?: string
  ) => {
    const newId = onAddLore(category, entryName, starterContent, attributes, role, imageUrl);
    if (typeof newId === 'string') {
      setSelectedId(newId);
    }
    if (selectedCategoryFilter !== 'all' && selectedCategoryFilter !== category) {
      setSelectedCategoryFilter('all');
    }
  };

  // Image actions for active entry
  const handleUploadPortraitFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEntry) return;
    try {
      setImageError('');
      const dataUrl = await compressAndReadImageFile(file, 1200, 0.85);
      const updatedGallery = [...(activeEntry.gallery || [])];
      // If not already in gallery, add it so it's kept in the visual record
      if (!updatedGallery.some((g) => g.url === dataUrl)) {
        updatedGallery.unshift(createLoreImageItem(dataUrl, 'Primary Portrait'));
      }
      onUpdateLore({
        ...activeEntry,
        imageUrl: dataUrl,
        gallery: updatedGallery,
      });
      setIsEnteringPortraitUrl(false);
      setPortraitUrlInput('');
    } catch (err) {
      setImageError('Failed to process image file. Please try another format.');
    } finally {
      if (portraitFileInputRef.current) portraitFileInputRef.current.value = '';
    }
  };

  const handleApplyPortraitUrl = () => {
    if (!activeEntry || !portraitUrlInput.trim()) return;
    const url = portraitUrlInput.trim();
    if (!isValidImageUrl(url)) {
      setImageError('Please enter a valid image URL (e.g. https://... or data:image/...).');
      return;
    }
    const updatedGallery = [...(activeEntry.gallery || [])];
    if (!updatedGallery.some((g) => g.url === url)) {
      updatedGallery.unshift(createLoreImageItem(url, 'Primary Portrait'));
    }
    onUpdateLore({
      ...activeEntry,
      imageUrl: url,
      gallery: updatedGallery,
    });
    setIsEnteringPortraitUrl(false);
    setPortraitUrlInput('');
    setImageError('');
  };

  const handleRemovePortrait = () => {
    if (!activeEntry) return;
    onUpdateLore({
      ...activeEntry,
      imageUrl: undefined,
    });
  };

  const handleUploadGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEntry) return;
    try {
      setImageError('');
      const dataUrl = await compressAndReadImageFile(file, 1400, 0.85);
      const newImg = createLoreImageItem(dataUrl, galleryCaptionInput.trim() || undefined);
      const updatedGallery = [newImg, ...(activeEntry.gallery || [])];
      onUpdateLore({
        ...activeEntry,
        imageUrl: activeEntry.imageUrl || dataUrl, // if no primary yet, set as primary
        gallery: updatedGallery,
      });
      setGalleryCaptionInput('');
    } catch (err) {
      setImageError('Failed to upload gallery image. Please try another file.');
    } finally {
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  const handleApplyGalleryUrl = () => {
    if (!activeEntry || !galleryUrlInput.trim()) return;
    const url = galleryUrlInput.trim();
    if (!isValidImageUrl(url)) {
      setImageError('Please enter a valid image URL.');
      return;
    }
    const newImg = createLoreImageItem(url, galleryCaptionInput.trim() || undefined);
    const updatedGallery = [newImg, ...(activeEntry.gallery || [])];
    onUpdateLore({
      ...activeEntry,
      imageUrl: activeEntry.imageUrl || url,
      gallery: updatedGallery,
    });
    setGalleryUrlInput('');
    setGalleryCaptionInput('');
    setIsAddingGalleryUrl(false);
    setImageError('');
  };

  const handleDeleteGalleryImage = (imageId: string) => {
    if (!activeEntry || !activeEntry.gallery) return;
    const toDelete = activeEntry.gallery.find((g) => g.id === imageId);
    const updatedGallery = activeEntry.gallery.filter((g) => g.id !== imageId);
    let updatedImageUrl = activeEntry.imageUrl;
    // If deleted image was the primary image, switch to the first remaining or undefined
    if (toDelete && toDelete.url === activeEntry.imageUrl) {
      updatedImageUrl = updatedGallery[0]?.url || undefined;
    }
    onUpdateLore({
      ...activeEntry,
      imageUrl: updatedImageUrl,
      gallery: updatedGallery,
    });
  };

  const handleSetAsPrimaryImage = (url: string) => {
    if (!activeEntry) return;
    onUpdateLore({
      ...activeEntry,
      imageUrl: url,
    });
  };

  const handleUpdateGalleryCaption = (imageId: string, newCaption: string) => {
    if (!activeEntry || !activeEntry.gallery) return;
    const updatedGallery = activeEntry.gallery.map((g) =>
      g.id === imageId ? { ...g, caption: newCaption } : g
    );
    onUpdateLore({
      ...activeEntry,
      gallery: updatedGallery,
    });
  };

  // Compile all images for lightbox viewing (primary + gallery items)
  const allImagesForLightbox = useMemo(() => {
    if (!activeEntry) return [];
    const list: { url: string; caption?: string; id?: string }[] = [];
    const seen = new Set<string>();

    if (activeEntry.imageUrl) {
      list.push({
        url: activeEntry.imageUrl,
        caption: `${activeEntry.name} — Primary Portrait`,
        id: 'primary',
      });
      seen.add(activeEntry.imageUrl);
    }

    if (activeEntry.gallery) {
      for (const item of activeEntry.gallery) {
        if (!seen.has(item.url)) {
          list.push({
            url: item.url,
            caption: item.caption || `${activeEntry.name} Reference`,
            id: item.id,
          });
          seen.add(item.url);
        }
      }
    }

    return list;
  }, [activeEntry]);

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

  // Total connections across all lore entries
  const totalRelationshipsCount = useMemo(() => {
    return loreList.reduce((acc, curr) => acc + (curr.relationships?.length || 0), 0);
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

  // 2. Computed Backlinks (Inverted Index)
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

  // 3. Manuscript Scene Mentions
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
      if (ev.characters && ev.characters.some((c) => names.includes(c.toLowerCase()))) return true;
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

  // Add relationship from inside the Obsidian Node Graph directly
  const handleAddRelationshipFromGraph = (sourceId: string, targetName: string, type: string) => {
    const source = loreList.find((l) => l.id === sourceId);
    if (!source || !targetName.trim() || !type.trim()) return;

    const existingRels = source.relationships || [];
    onUpdateLore({
      ...source,
      relationships: [...existingRels, { to: targetName.trim(), type: type.trim() }],
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
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ------------------------------------------------------------- */}
      {/* Main Content Area: Driven by Bottom Ribbon Selection */}
      {/* ------------------------------------------------------------- */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {ribbonTab === 'graph' ? (
          /* FULLSCREEN OBSIDIAN GLOBAL GRAPH */
          <ObsidianNodeGraph
            loreList={loreList}
            scenes={scenes}
            selectedId={selectedId}
            onSelectNode={(id, cat) => {
              if (cat !== 'scene') setSelectedId(id);
            }}
            onOpenDossier={(id) => {
              setSelectedId(id);
              setRibbonTab('dossier');
            }}
            onOpenScene={onOpenScene}
            onAddRelationship={handleAddRelationshipFromGraph}
            isLocalMode={false}
          />
        ) : ribbonTab === 'local-graph' ? (
          /* FOCUSED LOCAL SUBGRAPH */
          <ObsidianNodeGraph
            loreList={loreList}
            scenes={scenes}
            selectedId={selectedId}
            onSelectNode={(id, cat) => {
              if (cat !== 'scene') setSelectedId(id);
            }}
            onOpenDossier={(id) => {
              setSelectedId(id);
              setRibbonTab('dossier');
            }}
            onOpenScene={onOpenScene}
            onAddRelationship={handleAddRelationshipFromGraph}
            isLocalMode={true}
          />
        ) : (
          /* STANDARD 2-PANE DOSSIER VIEW */
          <>
            {/* Left Sidebar: Filtered List of Elements */}
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
                          {item.imageUrl ? (
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: `1.5px solid ${itemConfig.color}`,
                              backgroundColor: 'var(--bg-app)',
                              flexShrink: 0,
                            }}>
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
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
                          )}

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

            {/* Right Detail Pane */}
            <main style={{
              flex: 1,
              height: '100%',
              overflowY: 'auto',
              padding: '28px 44px',
              backgroundColor: 'var(--bg-app)',
            }}>
              {activeEntry ? (
                <div style={{ maxWidth: '840px', margin: '0 auto' }}>
                  
                  {/* Top Identity Card */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    paddingBottom: '18px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    {/* Hidden Portrait File Input */}
                    <input
                      ref={portraitFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPortraitFile}
                      style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, marginRight: '20px' }}>
                      {/* Entity Portrait Avatar & Quick Action Overlay */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          onClick={() => {
                            if (activeEntry.imageUrl) {
                              setLightboxIndex(0);
                              setLightboxOpen(true);
                            } else {
                              portraitFileInputRef.current?.click();
                            }
                          }}
                          title={activeEntry.imageUrl ? "Click to view full image in Lightbox" : "Click to upload portrait / visual"}
                          style={{
                            width: '68px',
                            height: '68px',
                            borderRadius: '10px',
                            border: `2px solid ${activeConfig.color}`,
                            backgroundColor: activeConfig.bgLight,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-sm)',
                            position: 'relative',
                          }}
                          onMouseEnter={(e) => {
                            const overlay = e.currentTarget.querySelector('.avatar-hover-overlay') as HTMLElement;
                            if (overlay) overlay.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            const overlay = e.currentTarget.querySelector('.avatar-hover-overlay') as HTMLElement;
                            if (overlay) overlay.style.opacity = '0';
                          }}
                        >
                          {activeEntry.imageUrl ? (
                            <img
                              src={activeEntry.imageUrl}
                              alt={activeEntry.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: activeConfig.color }}>
                              {getCategoryIcon(activeEntry.category, 26)}
                              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>+ Art</span>
                            </div>
                          )}

                          {/* Hover action overlay */}
                          <div
                            className="avatar-hover-overlay"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.65)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              opacity: 0,
                              transition: 'opacity 0.15s ease',
                              backdropFilter: 'blur(2px)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => portraitFileInputRef.current?.click()}
                              title="Upload / Change Image"
                              style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                padding: '5px',
                                cursor: 'pointer',
                                display: 'flex',
                              }}
                            >
                              <Upload size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEnteringPortraitUrl((prev) => !prev)}
                              title="Enter Image URL"
                              style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                padding: '5px',
                                cursor: 'pointer',
                                display: 'flex',
                              }}
                            >
                              <Link2 size={13} />
                            </button>
                            {activeEntry.imageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLightboxIndex(0);
                                  setLightboxOpen(true);
                                }}
                                title="Expand Fullscreen"
                                style={{
                                  background: 'rgba(255,255,255,0.2)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  color: '#fff',
                                  padding: '5px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                }}
                              >
                                <Maximize2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
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

                        {/* Quick URL input box for portrait if active */}
                        {isEnteringPortraitUrl && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '10px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-surface)',
                            border: `1px solid ${activeConfig.color}`,
                          }}>
                            <ImageIcon size={13} color={activeConfig.color} />
                            <input
                              type="url"
                              value={portraitUrlInput}
                              onChange={(e) => setPortraitUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleApplyPortraitUrl();
                                }
                              }}
                              placeholder="Paste image web URL (https://...)..."
                              style={{
                                flex: 1,
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                outline: 'none',
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleApplyPortraitUrl}
                              style={{
                                padding: '3px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: activeConfig.color,
                                color: '#fff',
                                cursor: 'pointer',
                              }}
                            >
                              Attach
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEnteringPortraitUrl(false);
                                setPortraitUrlInput('');
                              }}
                              style={{
                                padding: '3px 8px',
                                fontSize: '11px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-subtle)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {imageError && (
                          <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px' }}>
                            {imageError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setRibbonTab('local-graph')}
                        title="Inspect in Obsidian Local Subgraph"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${activeConfig.borderLight}`,
                          backgroundColor: activeConfig.bgLight,
                          color: activeConfig.color,
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Network size={13} />
                        <span>View Graph</span>
                      </button>

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

                  {/* Interactive Sub-Navigation Tabs */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '22px',
                  }}>
                    <button
                      onClick={() => setElementTab('profile')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        border: 'none',
                        borderBottom: elementTab === 'profile' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                        backgroundColor: 'transparent',
                        color: elementTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: elementTab === 'profile' ? 600 : 400,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <Layers size={14} color={elementTab === 'profile' ? activeConfig.color : 'var(--text-muted)'} />
                      <span>Dedicated Attributes</span>
                    </button>

                    <button
                      onClick={() => setElementTab('visuals')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        border: 'none',
                        borderBottom: elementTab === 'visuals' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                        backgroundColor: 'transparent',
                        color: elementTab === 'visuals' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: elementTab === 'visuals' ? 600 : 400,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <ImageIcon size={14} color={elementTab === 'visuals' ? activeConfig.color : 'var(--text-muted)'} />
                      <span>Visuals & Gallery ({((activeEntry.gallery?.length || 0) + (activeEntry.imageUrl && !activeEntry.gallery?.some(g => g.url === activeEntry.imageUrl) ? 1 : 0))})</span>
                    </button>

                    <button
                      onClick={() => setElementTab('web')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        border: 'none',
                        borderBottom: elementTab === 'web' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                        backgroundColor: 'transparent',
                        color: elementTab === 'web' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: elementTab === 'web' ? 600 : 400,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <Link2 size={14} color={elementTab === 'web' ? activeConfig.color : 'var(--text-muted)'} />
                      <span>Connected Lore Web ({directRelationships.length + backlinks.length})</span>
                    </button>

                    <button
                      onClick={() => setElementTab('graph')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        border: 'none',
                        borderBottom: elementTab === 'graph' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                        backgroundColor: 'transparent',
                        color: elementTab === 'graph' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: elementTab === 'graph' ? 600 : 400,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <Network size={14} color={elementTab === 'graph' ? activeConfig.color : 'var(--text-muted)'} />
                      <span>Interactive Node Graph</span>
                    </button>

                    <button
                      onClick={() => setElementTab('manuscript')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        border: 'none',
                        borderBottom: elementTab === 'manuscript' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                        backgroundColor: 'transparent',
                        color: elementTab === 'manuscript' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: elementTab === 'manuscript' ? 600 : 400,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <BookOpen size={14} color={elementTab === 'manuscript' ? '#3b82f6' : 'var(--text-muted)'} />
                      <span>Manuscript Appearances ({manuscriptAppearances.length})</span>
                    </button>

                    <button
                      onClick={() => setElementTab('timeline')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        border: 'none',
                        borderBottom: elementTab === 'timeline' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                        backgroundColor: 'transparent',
                        color: elementTab === 'timeline' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: elementTab === 'timeline' ? 600 : 400,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <Calendar size={14} color={elementTab === 'timeline' ? '#8b5cf6' : 'var(--text-muted)'} />
                      <span>Timeline ({matchingTimelineEvents.length})</span>
                    </button>

                    <button
                      onClick={() => setElementTab('notes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        border: 'none',
                        borderBottom: elementTab === 'notes' ? `2px solid ${activeConfig.color}` : '2px solid transparent',
                        backgroundColor: 'transparent',
                        color: elementTab === 'notes' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: elementTab === 'notes' ? 600 : 400,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <FileText size={14} color={elementTab === 'notes' ? activeConfig.color : 'var(--text-muted)'} />
                      <span>Dossier & Notes</span>
                    </button>
                  </div>

                  {/* SUB-TAB 1: DEDICATED ATTRIBUTES */}
                  {elementTab === 'profile' && (
                    <div>
                      {/* Short Summary */}
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
                    </div>
                  )}

                  {/* SUB-TAB: VISUALS & CONCEPT ART GALLERY */}
                  {elementTab === 'visuals' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                      {/* Hidden File Input for Gallery */}
                      <input
                        ref={galleryFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadGalleryFile}
                        style={{ display: 'none' }}
                      />

                      {/* Primary Portrait Card */}
                      <div style={{
                        padding: '20px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        gap: '24px',
                        alignItems: 'flex-start',
                      }}>
                        {/* Primary Image Preview */}
                        <div style={{
                          width: '220px',
                          height: '220px',
                          borderRadius: '8px',
                          border: `2px solid ${activeConfig.color}`,
                          backgroundColor: activeConfig.bgLight,
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {activeEntry.imageUrl ? (
                            <img
                              src={activeEntry.imageUrl}
                              alt={activeEntry.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => {
                                setLightboxIndex(0);
                                setLightboxOpen(true);
                              }}
                              title="Click to view full image in lightbox"
                            />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: activeConfig.color, textAlign: 'center', padding: '16px' }}>
                              {getCategoryIcon(activeEntry.category, 42)}
                              <span style={{ fontSize: '12px', fontWeight: 600 }}>No Primary Portrait</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Upload an image below to set the official portrait</span>
                            </div>
                          )}

                          {activeEntry.imageUrl && (
                            <div
                              onClick={() => {
                                setLightboxIndex(0);
                                setLightboxOpen(true);
                              }}
                              style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <Maximize2 size={12} />
                              <span>Expand</span>
                            </div>
                          )}
                        </div>

                        {/* Primary Info & Actions */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                backgroundColor: activeConfig.bgLight,
                                color: activeConfig.color,
                                border: `1px solid ${activeConfig.borderLight}`,
                              }}>
                                Primary Visual
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Official canon depiction
                              </span>
                            </div>

                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                              {activeEntry.name}
                            </h3>

                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
                              This primary visual is automatically represented across InxWrite in the Obsidian-style node graph canvas, character inspector HUD, manuscript @mention popups, and quick search.
                            </p>
                          </div>

                          {/* Action Buttons for Primary Art */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => portraitFileInputRef.current?.click()}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '7px 14px',
                                  borderRadius: '6px',
                                  backgroundColor: activeConfig.color,
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxShadow: `0 2px 6px ${activeConfig.bgLight}`,
                                }}
                              >
                                <Upload size={13} />
                                <span>{activeEntry.imageUrl ? 'Replace Portrait' : 'Upload Portrait File'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsEnteringPortraitUrl((prev) => !prev)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '7px 14px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-app)',
                                  color: 'var(--text-primary)',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                <Link2 size={13} />
                                <span>Link Web Image</span>
                              </button>

                              {activeEntry.imageUrl && (
                                <button
                                  type="button"
                                  onClick={handleRemovePortrait}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '7px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #fecaca',
                                    backgroundColor: 'transparent',
                                    color: '#dc2626',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Trash2 size={13} />
                                  <span>Remove Portrait</span>
                                </button>
                              )}
                            </div>

                            {/* Inline URL form */}
                            {isEnteringPortraitUrl && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-app)',
                                border: `1px solid ${activeConfig.color}`,
                              }}>
                                <ImageIcon size={14} color={activeConfig.color} />
                                <input
                                  type="url"
                                  value={portraitUrlInput}
                                  onChange={(e) => setPortraitUrlInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleApplyPortraitUrl();
                                    }
                                  }}
                                  placeholder="Paste image web URL (https://...)..."
                                  style={{
                                    flex: 1,
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    outline: 'none',
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={handleApplyPortraitUrl}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: '4px',
                                    border: 'none',
                                    backgroundColor: activeConfig.color,
                                    color: '#fff',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Attach
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsEnteringPortraitUrl(false);
                                    setPortraitUrlInput('');
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-subtle)',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {imageError && (
                              <div style={{ fontSize: '11px', color: '#dc2626' }}>
                                {imageError}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reference Art & Concept Gallery Section */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '14px',
                        }}>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 3px' }}>
                              Concept Art, Maps & Reference Gallery ({activeEntry.gallery?.length || 0})
                            </h4>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                              Visual references, moodboard clippings, costume studies, and environmental sketches.
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => galleryFileInputRef.current?.click()}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <Upload size={13} color={activeConfig.color} />
                              <span>Upload Reference</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsAddingGalleryUrl((prev) => !prev)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-secondary)',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <Link2 size={13} />
                              <span>Add Web Link</span>
                            </button>
                          </div>
                        </div>

                        {/* Add via URL Form if active */}
                        {isAddingGalleryUrl && (
                          <div style={{
                            padding: '14px',
                            backgroundColor: 'var(--bg-surface)',
                            border: `1px solid ${activeConfig.color}`,
                            borderRadius: '8px',
                            marginBottom: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              Add Web Image to Reference Gallery
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              <input
                                type="url"
                                value={galleryUrlInput}
                                onChange={(e) => setGalleryUrlInput(e.target.value)}
                                placeholder="Image web URL (https://...)..."
                                style={{
                                  flex: 2,
                                  minWidth: '240px',
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-app)',
                                  color: 'var(--text-primary)',
                                  fontSize: '12px',
                                  outline: 'none',
                                }}
                                autoFocus
                              />
                              <input
                                type="text"
                                value={galleryCaptionInput}
                                onChange={(e) => setGalleryCaptionInput(e.target.value)}
                                placeholder="Caption (e.g. 'Castle Gate at Sunset', 'Early armor concept')..."
                                style={{
                                  flex: 2,
                                  minWidth: '200px',
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-app)',
                                  color: 'var(--text-primary)',
                                  fontSize: '12px',
                                  outline: 'none',
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleApplyGalleryUrl}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: activeConfig.color,
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Add to Gallery
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingGalleryUrl(false);
                                  setGalleryUrlInput('');
                                  setGalleryCaptionInput('');
                                }}
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'transparent',
                                  color: 'var(--text-muted)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Gallery Grid */}
                        {activeEntry.gallery && activeEntry.gallery.length > 0 ? (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                            gap: '16px',
                          }}>
                            {activeEntry.gallery.map((item, idx) => {
                              const isPrimary = activeEntry.imageUrl === item.url;
                              // Match index in allImagesForLightbox
                              const lightboxIdx = allImagesForLightbox.findIndex((img) => img.url === item.url);

                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    borderRadius: '8px',
                                    border: isPrimary ? `2px solid ${activeConfig.color}` : '1px solid var(--border-subtle)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: 'var(--shadow-sm)',
                                    position: 'relative',
                                  }}
                                >
                                  {/* Image Container with Hover Controls */}
                                  <div
                                    style={{
                                      height: '160px',
                                      width: '100%',
                                      position: 'relative',
                                      overflow: 'hidden',
                                      backgroundColor: 'var(--bg-app)',
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => {
                                      setLightboxIndex(lightboxIdx >= 0 ? lightboxIdx : 0);
                                      setLightboxOpen(true);
                                    }}
                                  >
                                    <img
                                      src={item.url}
                                      alt={item.caption || `${activeEntry.name} art`}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />

                                    {/* Primary Badge */}
                                    {isPrimary && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        left: '8px',
                                        backgroundColor: activeConfig.color,
                                        color: '#fff',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        padding: '2px 7px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                      }}>
                                        <Star size={10} fill="#fff" />
                                        <span>PRIMARY</span>
                                      </div>
                                    )}

                                    {/* Action overlay */}
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {!isPrimary && (
                                        <button
                                          type="button"
                                          onClick={() => handleSetAsPrimaryImage(item.url)}
                                          title="Set as Main Portrait"
                                          style={{
                                            padding: '5px',
                                            borderRadius: '4px',
                                            backgroundColor: 'rgba(0,0,0,0.65)',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                          }}
                                        >
                                          <Star size={13} />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteGalleryImage(item.id)}
                                        title="Delete from Gallery"
                                        style={{
                                          padding: '5px',
                                          borderRadius: '4px',
                                          backgroundColor: 'rgba(0,0,0,0.65)',
                                          color: '#f87171',
                                          border: 'none',
                                          cursor: 'pointer',
                                          display: 'flex',
                                        }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Caption Editor */}
                                  <div style={{ padding: '10px' }}>
                                    <input
                                      value={item.caption || ''}
                                      onChange={(e) => handleUpdateGalleryCaption(item.id, e.target.value)}
                                      placeholder="Add caption or note..."
                                      style={{
                                        width: '100%',
                                        fontSize: '11px',
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        border: '1px solid transparent',
                                        backgroundColor: 'transparent',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                      }}
                                      onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                        e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                                      }}
                                      onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}

                            {/* Additional Upload Card in Grid */}
                            <div
                              onClick={() => galleryFileInputRef.current?.click()}
                              style={{
                                height: '210px',
                                borderRadius: '8px',
                                border: '1.5px dashed var(--border-subtle)',
                                backgroundColor: 'transparent',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = activeConfig.color;
                                e.currentTarget.style.color = activeConfig.color;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              <Plus size={24} />
                              <span style={{ fontSize: '12px', fontWeight: 600 }}>Add Reference Art</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            padding: '36px 20px',
                            borderRadius: '8px',
                            border: '1.5px dashed var(--border-subtle)',
                            backgroundColor: 'var(--bg-surface)',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                          }}>
                            <div style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              backgroundColor: activeConfig.bgLight,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: activeConfig.color,
                            }}>
                              <ImageIcon size={22} />
                            </div>

                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                                No Reference Visuals or Concept Art Yet
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
                                Add character sketches, location maps, faction banners, or item blueprints to build a visual storyboard for {activeEntry.name}.
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => galleryFileInputRef.current?.click()}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  backgroundColor: activeConfig.color,
                                  color: '#fff',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                <Upload size={13} />
                                <span>Upload Images</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsAddingGalleryUrl(true)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-app)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                <Link2 size={13} />
                                <span>Paste Image Link</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: CONNECTED LORE WEB */}
                  {elementTab === 'web' && (
                    <div>
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

                      {/* Section B: Inbound Backlinks */}
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

                      {/* Add Relationship Form */}
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

                  {/* SUB-TAB 3: EMBEDDED LOCAL NODE GRAPH */}
                  {elementTab === 'graph' && (
                    <div style={{
                      height: '520px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-md)',
                      position: 'relative',
                    }}>
                      <ObsidianNodeGraph
                        loreList={loreList}
                        scenes={scenes}
                        selectedId={activeEntry.id}
                        onSelectNode={(id, cat) => {
                          if (cat !== 'scene') setSelectedId(id);
                        }}
                        onOpenDossier={(id) => {
                          setSelectedId(id);
                          setElementTab('profile');
                        }}
                        onOpenScene={onOpenScene}
                        onAddRelationship={handleAddRelationshipFromGraph}
                        isLocalMode={true}
                      />
                    </div>
                  )}

                  {/* SUB-TAB 4: MANUSCRIPT OCCURRENCES */}
                  {elementTab === 'manuscript' && (
                    <div>
                      {manuscriptAppearances.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <AlertCircle size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            Not Yet Mentioned in Manuscript
                          </h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                            Type <code>@{activeEntry.name}</code> or <code>[[{activeEntry.slug}|{activeEntry.name}]]</code> in any scene editor to ground this element!
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

                  {/* SUB-TAB 5: TIMELINE */}
                  {elementTab === 'timeline' && (
                    <div>
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

                  {/* SUB-TAB 6: DOSSIER & NOTES */}
                  {elementTab === 'notes' && (
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
          </>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Bottom Ribbon Bar: Dedicated Graph & Dossier Switcher */}
      {/* ------------------------------------------------------------- */}
      <nav style={{
        height: '38px',
        backgroundColor: 'var(--bg-app)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 20,
        userSelect: 'none',
      }}>
        {/* Left: Ribbon Mode Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setRibbonTab('dossier')}
            title="Inspect and edit element dossiers & attributes"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: ribbonTab === 'dossier' ? 600 : 400,
              backgroundColor: ribbonTab === 'dossier' ? 'var(--bg-surface)' : 'transparent',
              color: ribbonTab === 'dossier' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: ribbonTab === 'dossier' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              boxShadow: ribbonTab === 'dossier' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={13} color={ribbonTab === 'dossier' ? 'var(--accent-primary)' : 'currentColor'} />
            <span>Element Dossiers</span>
          </button>

          <button
            onClick={() => setRibbonTab('graph')}
            title="Open Obsidian-style interactive Force-Directed Global Node Graph"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: ribbonTab === 'graph' ? 600 : 400,
              backgroundColor: ribbonTab === 'graph' ? 'var(--bg-surface)' : 'transparent',
              color: ribbonTab === 'graph' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: ribbonTab === 'graph' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              boxShadow: ribbonTab === 'graph' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Network size={13} color={ribbonTab === 'graph' ? '#eb5e28' : 'currentColor'} />
            <span>Obsidian Node Graph</span>
          </button>

          <button
            onClick={() => setRibbonTab('local-graph')}
            title={`Open focused local graph for ${activeEntry?.name || 'current element'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: ribbonTab === 'local-graph' ? 600 : 400,
              backgroundColor: ribbonTab === 'local-graph' ? 'var(--bg-surface)' : 'transparent',
              color: ribbonTab === 'local-graph' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: ribbonTab === 'local-graph' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              boxShadow: ribbonTab === 'local-graph' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Compass size={13} color={ribbonTab === 'local-graph' ? '#10b981' : 'currentColor'} />
            <span>Local Subgraph ({activeEntry ? activeEntry.name : 'Selected'})</span>
          </button>
        </div>

        {/* Center: Live Connectivity & Continuity Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {loreList.length} Story Elements
          </span>
          <span>•</span>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            {totalRelationshipsCount} Canon Connections
          </span>
          <span>•</span>
          <span>Obsidian Visualizer Active</span>
        </div>

        {/* Right: Quick actions & category stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span title="Characters" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CODEX_CATEGORIES.character.color }} />
            <span title="Locations" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CODEX_CATEGORIES.location.color }} />
            <span title="Lore" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CODEX_CATEGORIES.lore.color }} />
            <span title="Items" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CODEX_CATEGORIES.item.color }} />
            <span title="Factions" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CODEX_CATEGORIES.faction.color }} />
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={11} strokeWidth={2.5} />
            <span>Add Element</span>
          </button>
        </div>
      </nav>

      {/* New Codex Entry Popup Modal */}
      <NewCodexModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateEntry}
      />

      {/* Fullscreen Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={allImagesForLightbox}
        initialIndex={lightboxIndex}
        entityName={activeEntry?.name}
        onSetAsPrimary={handleSetAsPrimaryImage}
        onDeleteImage={(imgId) => {
          if (imgId === 'primary') {
            handleRemovePortrait();
          } else {
            handleDeleteGalleryImage(imgId);
          }
        }}
        currentPrimaryUrl={activeEntry?.imageUrl}
      />
    </div>
  );
};
