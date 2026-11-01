import React, { useState, useEffect, useRef } from 'react';
import { LoreCategory } from '../../types/project';
import { CODEX_CATEGORIES } from '../../core/codexSchema';
import { 
  User, 
  MapPin, 
  Sparkles, 
  Package, 
  Shield, 
  X, 
  ArrowRight,
  Check
} from 'lucide-react';

interface NewCodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (category: LoreCategory, name: string, starterContent: string, attributes?: Record<string, string>, role?: string) => void;
}

export const NewCodexModal: React.FC<NewCodexModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LoreCategory>('character');
  const [name, setName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedCategory('character');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getCategoryIcon = (catId: LoreCategory, size: number = 20) => {
    switch (catId) {
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

  const categoryList: LoreCategory[] = ['character', 'location', 'lore', 'item', 'faction'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config = CODEX_CATEGORIES[selectedCategory];
    const finalName = name.trim() || `New ${config.name}`;
    const starterContent = config.defaultTemplate(finalName);
    const initialAttributes: Record<string, string> = {};
    
    // Set a sensible default role based on archetype or category
    let defaultRole = '';
    if (selectedCategory === 'character') defaultRole = 'Protagonist';
    else if (selectedCategory === 'location') defaultRole = 'Sovereign Realm';
    else if (selectedCategory === 'lore') defaultRole = 'Magic System';
    else if (selectedCategory === 'item') defaultRole = 'Ancient Relic';
    else if (selectedCategory === 'faction') defaultRole = 'Knightly Order';

    onCreate(selectedCategory, finalName, starterContent, initialAttributes, defaultRole);
    onClose();
  };

  const handleSelectCategoryAndSubmit = (catId: LoreCategory) => {
    setSelectedCategory(catId);
    const config = CODEX_CATEGORIES[catId];
    const finalName = name.trim() || `New ${config.name}`;
    const starterContent = config.defaultTemplate(finalName);
    const initialAttributes: Record<string, string> = {};

    let defaultRole = '';
    if (catId === 'character') defaultRole = 'Protagonist';
    else if (catId === 'location') defaultRole = 'Sovereign Realm';
    else if (catId === 'lore') defaultRole = 'Magic System';
    else if (catId === 'item') defaultRole = 'Ancient Relic';
    else if (catId === 'faction') defaultRole = 'Knightly Order';

    onCreate(catId, finalName, starterContent, initialAttributes, defaultRole);
    onClose();
  };

  const activeConfig = CODEX_CATEGORIES[selectedCategory];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 10010,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        userSelect: 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '600px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-app)',
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              Create New Codex & Lore Element
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Select a specialized story element type with dedicated attributes and interconnected cross-linking.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '4px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            
            {/* Title / Name Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}>
                Element Name
              </label>
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Name (e.g. ${
                  selectedCategory === 'character' ? 'Eldrin the Grey, Mara Vance...' :
                  selectedCategory === 'location' ? 'The Silver Citadel, Whisperwood...' :
                  selectedCategory === 'lore' ? 'The Ether Tide, Rite of Awakening...' :
                  selectedCategory === 'item' ? 'Blade of Dawn, Crown of Thorns...' :
                  'Order of the Sun, Shadow Syndicate...'
                })`}
                style={{
                  width: '100%',
                  fontSize: '15px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = activeConfig.color;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${activeConfig.bgLight}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Category Selector List */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)',
                marginBottom: '10px',
              }}>
                Select Category (Tailored Attributes & Canon Linking)
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categoryList.map((catId) => {
                  const cat = CODEX_CATEGORIES[catId];
                  const isSelected = selectedCategory === catId;

                  return (
                    <div
                      key={catId}
                      onClick={() => setSelectedCategory(catId)}
                      onDoubleClick={() => handleSelectCategoryAndSubmit(catId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: isSelected
                          ? `1.5px solid ${cat.color}`
                          : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? cat.bgLight : 'var(--bg-app)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface)',
                          border: `1px solid ${isSelected ? cat.color : 'var(--border-subtle)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {getCategoryIcon(catId, 18)}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {cat.name}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: cat.bgLight,
                              color: cat.color,
                              border: `1px solid ${cat.borderLight}`,
                            }}>
                              {cat.tagline}
                            </span>
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      <div style={{ marginLeft: '12px' }}>
                        {isSelected ? (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: cat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '1px solid var(--border-subtle)',
                          }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Tip: Double-click any category to create instantly.
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeConfig.color,
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 2px 6px ${activeConfig.bgLight}`,
                }}
              >
                <span>Create {activeConfig.name}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
