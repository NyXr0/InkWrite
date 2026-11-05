import React, { useEffect, useState } from 'react';
import { LoreEntry, LoreCategory } from '../../types/project';
import { CODEX_CATEGORIES } from '../../core/codexSchema';
import { User, MapPin, Sparkles, Package, Shield, BookOpen } from 'lucide-react';

interface LoreTagPopupProps {
  query: string;
  loreList: LoreEntry[];
  position: { top: number; left: number };
  onSelect: (entry: LoreEntry) => void;
  onClose: () => void;
}

export const LoreTagPopup: React.FC<LoreTagPopupProps> = ({
  query,
  loreList,
  position,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter lore by query (slug or name)
  const cleanQuery = query.toLowerCase().replace(/^@/, '');
  const filtered = loreList.filter((item) => {
    return (
      item.name.toLowerCase().includes(cleanQuery) ||
      item.slug.toLowerCase().includes(cleanQuery) ||
      (item.role && item.role.toLowerCase().includes(cleanQuery)) ||
      (item.aliases && item.aliases.some((a) => a.toLowerCase().includes(cleanQuery)))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [cleanQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) {
    return null;
  }

  const getCategoryIcon = (category: LoreCategory) => {
    const color = CODEX_CATEGORIES[category]?.color || 'var(--accent-primary)';
    switch (category) {
      case 'character':
        return <User size={13} color={color} />;
      case 'location':
        return <MapPin size={13} color={color} />;
      case 'lore':
        return <Sparkles size={13} color={color} />;
      case 'item':
        return <Package size={13} color={color} />;
      case 'faction':
        return <Shield size={13} color={color} />;
      default:
        return <BookOpen size={13} color={color} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '300px',
        backgroundColor: 'var(--bg-popover)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        padding: '6px 10px',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-active)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>MENTION STORY ELEMENT ({filtered.length})</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>@{cleanQuery}</span>
      </div>

      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
        {filtered.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const config = CODEX_CATEGORIES[item.category] || CODEX_CATEGORIES.character;

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                borderLeft: isSelected ? `3px solid ${config.color}` : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.imageUrl ? (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    border: `1.5px solid ${config.color}`,
                    flexShrink: 0,
                    backgroundColor: 'var(--bg-app)',
                  }}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    backgroundColor: config.bgLight,
                    border: `1px solid ${config.borderLight}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getCategoryIcon(item.category)}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: config.color, fontWeight: 600 }}>{config.name}</span>
                    {item.role && <span>• {item.role}</span>}
                  </div>
                </div>
              </div>

              {isSelected && (
                <kbd style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)'
                }}>
                  Enter
                </kbd>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '5px 10px',
        fontSize: '10px',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-app)',
        textAlign: 'center',
      }}>
        Up/Down to choose, Enter to tag, Esc to dismiss
      </div>
    </div>
  );
};
