import React, { useState, useEffect, useRef } from 'react';
import { LoreCategory } from '../../types/project';
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
  onCreate: (category: LoreCategory, name: string, starterContent: string) => void;
}

interface CategoryOption {
  id: LoreCategory;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  bgBadge: string;
  borderColor: string;
  template: (name: string) => string;
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

  const categories: CategoryOption[] = [
    {
      id: 'character',
      name: 'Character',
      tagline: 'Protagonist, antagonist, companion, historical figure, or creature.',
      icon: <User size={22} color="var(--accent-primary)" />,
      bgBadge: 'var(--accent-pill)',
      borderColor: 'var(--accent-primary)',
      template: (title) => `### Overview
A brief 1-2 sentence description of who **${title}** is and their role in the story.

### Core Profile
- **Role:** Protagonist / Antagonist / Supporting Cast
- **Age / Species:** 
- **Occupation / Title:** 
- **Core Desire:** What do they want more than anything?
- **Internal Conflict / Flaw:** What fear or weakness holds them back?

### Appearance & Mannerisms
Distinguishing physical features, posture, signature clothing, voice.

### Backstory & Motivations
Where they come from, pivotal life moments, and why they act.

### Key Relationships
- **Allies & Friends:**
- **Rivals & Adversaries:**
`,
    },
    {
      id: 'location',
      name: 'Location',
      tagline: 'Realm, kingdom, city, building, celestial body, or wild terrain.',
      icon: <MapPin size={22} color="#c06c38" />,
      bgBadge: 'rgba(192, 108, 56, 0.15)',
      borderColor: '#c06c38',
      template: (title) => `### Overview
Atmospheric summary of **${title}**.

### Geography & Atmosphere
- **Region / Kingdom:** 
- **Climate & Weather:** 
- **Sensory Impressions:** Distinct sights, ambient sounds, scents.

### Key Landmarks & Architecture
Notable districts, monuments, ruins, or secret rooms.

### Inhabitants, Culture & Governance
Who controls this area, local laws, customs, and hazards.

### Narrative Significance
Why scenes take place here and what important moments occur.
`,
    },
    {
      id: 'lore',
      name: 'Lore & Worldbuilding',
      tagline: 'Magic system, mythology, religion, ancient history, or cosmic rule.',
      icon: <Sparkles size={22} color="#eab308" />,
      bgBadge: 'rgba(234, 179, 8, 0.15)',
      borderColor: '#eab308',
      template: (title) => `### Overview
The foundational concept, myth, or system of **${title}**.

### Rules, Principles & Costs
- How does it function in this world?
- What are the restrictions, costs, or lethal dangers?
- Who possesses knowledge or mastery of it?

### Historical Origins & Legends
The ancient discovery, mythical war, divine origin, or historical treaty.

### Narrative Impact
How this lore influences character decisions and the main plot stakes.
`,
    },
    {
      id: 'item',
      name: 'Item / Artifact',
      tagline: 'Weapon, enchanted relic, technology, heirloom, or document.',
      icon: <Package size={22} color="#06b6d4" />,
      bgBadge: 'rgba(6, 182, 212, 0.15)',
      borderColor: '#06b6d4',
      template: (title) => `### Overview
Physical description and significance of **${title}**.

### Properties & Abilities
- **Type:** Relic / Weapon / Tool / Technology
- **Special Capabilities:**
- **Limitations / Requirements:**

### Provenance & Current Keeper
Who forged or found it, and who holds or hunts it now.
`,
    },
    {
      id: 'faction',
      name: 'Faction / Order',
      tagline: 'Kingdom, guild, religious order, rebellion, or secret syndicate.',
      icon: <Shield size={22} color="#a855f7" />,
      bgBadge: 'rgba(168, 85, 247, 0.15)',
      borderColor: '#a855f7',
      template: (title) => `### Overview
The public purpose and reputation of **${title}**.

### Leadership & Structure
Key commanders, ranks, oaths, and internal politics.

### Ideology & Objective
What they stand for and what lengths they will go to succeed.

### Allies & Enemies
`,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = categories.find((c) => c.id === selectedCategory) || categories[0];
    const finalName = name.trim() || `New ${chosen.name}`;
    const starterContent = chosen.template(finalName);
    onCreate(selectedCategory, finalName, starterContent);
    onClose();
  };

  const handleSelectCategoryAndSubmit = (catId: LoreCategory) => {
    setSelectedCategory(catId);
    const chosen = categories.find((c) => c.id === catId) || categories[0];
    const finalName = name.trim() || `New ${chosen.name}`;
    const starterContent = chosen.template(finalName);
    onCreate(catId, finalName, starterContent);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
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
          width: '560px',
          maxHeight: '88vh',
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
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-app)',
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
              Create New Story Element
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Choose whether to add a Character, Location, Lore, or Worldbuilding asset.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '4px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Optional Name Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Entry Name <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional — can be changed anytime)</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder="e.g. Captain Eleanor, City of Oakhaven, The Starfire Gem..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Category Choices */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Select Category
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      onDoubleClick={() => handleSelectCategoryAndSubmit(cat.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isSelected ? `2px solid ${cat.borderColor}` : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-app)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: cat.bgBadge,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {cat.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {cat.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                            {cat.tagline}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: isSelected ? `2px solid ${cat.borderColor}` : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? cat.borderColor : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0,
                      }}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Tip: Double-click any card to create immediately
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
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
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <span>Create {categories.find((c) => c.id === selectedCategory)?.name}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
