import React, { useEffect, useState } from 'react';
import { LoreEntry } from '../../types/project';
import { User, MapPin, Sparkles, BookOpen } from 'lucide-react';

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
      (item.role && item.role.toLowerCase().includes(cleanQuery))
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'character':
        return <User size={12} />;
      case 'location':
        return <MapPin size={12} />;
      case 'lore':
      case 'item':
        return <Sparkles size={12} />;
      default:
        return <BookOpen size={12} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '280px',
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
      }}>
        <span>MENTION LORE ({filtered.length})</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>@{cleanQuery}</span>
      </div>

      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {filtered.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const initial = item.name.charAt(0).toUpperCase();

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
                borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--accent-pill)',
                  color: 'var(--accent-pill-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {initial}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    {item.role ? ` • ${item.role}` : ''}
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
        Up and down to choose, Esc to dismiss
      </div>
    </div>
  );
};
