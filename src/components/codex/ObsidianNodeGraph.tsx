import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { LoreEntry, LoreCategory, SceneItem } from '../../types/project';
import { CODEX_CATEGORIES } from '../../core/codexSchema';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Filter, 
  Search, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  Link2, 
  X,
  Layers,
  Check,
  Eye,
  EyeOff,
  User,
  MapPin,
  Sparkles,
  Package,
  Shield,
  BookOpen
} from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  category: LoreCategory | 'scene';
  role?: string;
  summary?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  degree: number;
  loreEntry?: LoreEntry;
  sceneItem?: SceneItem;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  color: string;
}

interface ObsidianNodeGraphProps {
  loreList: LoreEntry[];
  scenes?: SceneItem[];
  selectedId?: string;
  onSelectNode: (id: string, category: LoreCategory | 'scene') => void;
  onOpenDossier: (loreId: string) => void;
  onOpenScene?: (sceneId: string) => void;
  onAddRelationship?: (sourceId: string, targetName: string, type: string) => void;
  isLocalMode?: boolean; // If true, only render the selected node and its neighbors
}

export const ObsidianNodeGraph: React.FC<ObsidianNodeGraphProps> = ({
  loreList,
  scenes = [],
  selectedId,
  onSelectNode,
  onOpenDossier,
  onOpenScene,
  onAddRelationship,
  isLocalMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport navigation state (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Active interaction state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeSelectedId, setActiveSelectedId] = useState<string | null>(selectedId || null);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Filter settings
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showScenes, setShowScenes] = useState<boolean>(false);
  const [showOrphans, setShowOrphans] = useState<boolean>(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState<boolean>(true);
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({
    character: true,
    location: true,
    lore: true,
    item: true,
    faction: true,
    scene: true,
  });

  // Physics simulation tuning
  const [repulsionStrength, setRepulsionStrength] = useState<number>(2500);
  const [linkDistance, setLinkDistance] = useState<number>(120);

  // Quick link creation inside graph
  const [isLinking, setIsLinking] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkType, setLinkType] = useState('Allied with');

  // Sync prop changes
  useEffect(() => {
    if (selectedId) {
      setActiveSelectedId(selectedId);
    }
  }, [selectedId]);

  // Keep persistent nodes across renders so positions don't reset
  const nodesMapRef = useRef<Map<string, GraphNode>>(new Map());

  // -------------------------------------------------------------
  // 1. Build Graph Nodes & Edges
  // -------------------------------------------------------------
  const { nodes, edges, neighborMap } = useMemo(() => {
    const rawNodes: GraphNode[] = [];
    const rawEdges: GraphEdge[] = [];
    const neighbors = new Map<string, Set<string>>();

    const addNeighbor = (a: string, b: string) => {
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      if (!neighbors.has(b)) neighbors.set(b, new Set());
      neighbors.get(a)!.add(b);
      neighbors.get(b)!.add(a);
    };

    // A. Add Lore entries as nodes
    loreList.forEach((entry) => {
      // Check category filter
      if (!visibleCategories[entry.category]) return;

      const existing = nodesMapRef.current.get(entry.id);
      const config = CODEX_CATEGORIES[entry.category] || CODEX_CATEGORIES.character;

      const node: GraphNode = {
        id: entry.id,
        label: entry.name,
        category: entry.category,
        role: entry.role,
        summary: entry.summary,
        x: existing ? existing.x : (Math.random() - 0.5) * 500,
        y: existing ? existing.y : (Math.random() - 0.5) * 500,
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
        radius: 16,
        color: config.color,
        degree: 0,
        loreEntry: entry,
      };

      rawNodes.push(node);
      nodesMapRef.current.set(entry.id, node);
    });

    // B. Optionally add Scenes as nodes if toggled on
    if (showScenes && visibleCategories['scene']) {
      scenes.forEach((sc) => {
        const scId = `scene-${sc.id}`;
        const existing = nodesMapRef.current.get(scId);

        const node: GraphNode = {
          id: scId,
          label: sc.title,
          category: 'scene',
          role: `${sc.wordCount} words`,
          summary: sc.summary,
          x: existing ? existing.x : (Math.random() - 0.5) * 600,
          y: existing ? existing.y : (Math.random() - 0.5) * 600,
          vx: existing ? existing.vx : 0,
          vy: existing ? existing.vy : 0,
          radius: 13,
          color: '#3b82f6',
          degree: 0,
          sceneItem: sc,
        };

        rawNodes.push(node);
        nodesMapRef.current.set(scId, node);
      });
    }

    const nodeById = new Map<string, GraphNode>(rawNodes.map((n) => [n.id, n]));
    const nodeByName = new Map<string, GraphNode>();
    rawNodes.forEach((n) => {
      nodeByName.set(n.label.toLowerCase(), n);
      if (n.loreEntry?.aliases) {
        n.loreEntry.aliases.forEach((alias) => nodeByName.set(alias.toLowerCase(), n));
      }
    });

    // C. Build Relationships from LoreEntry.relationships
    loreList.forEach((sourceEntry) => {
      if (!sourceEntry.relationships) return;
      const sourceNode = nodeById.get(sourceEntry.id);
      if (!sourceNode) return;

      sourceEntry.relationships.forEach((rel) => {
        const targetNode = nodeByName.get(rel.to.toLowerCase()) || nodeById.get(rel.to);
        if (targetNode && targetNode.id !== sourceNode.id) {
          rawEdges.push({
            id: `${sourceNode.id}->${targetNode.id}`,
            source: sourceNode.id,
            target: targetNode.id,
            label: rel.type || 'Connected',
            color: sourceNode.color,
          });

          sourceNode.degree++;
          targetNode.degree++;
          addNeighbor(sourceNode.id, targetNode.id);
        }
      });
    });

    // D. Connect Scenes to Lore nodes if scenes are visible
    if (showScenes && visibleCategories['scene']) {
      scenes.forEach((sc) => {
        const scNodeId = `scene-${sc.id}`;
        const scNode = nodeById.get(scNodeId);
        if (!scNode) return;

        loreList.forEach((lore) => {
          const lNode = nodeById.get(lore.id);
          if (!lNode) return;

          const isPov = sc.pov && sc.pov.toLowerCase() === lore.name.toLowerCase();
          const isSetting = sc.locations && sc.locations.some((loc) => loc.toLowerCase() === lore.name.toLowerCase());
          const isMentioned = sc.content.toLowerCase().includes(`@${lore.name.toLowerCase()}`) ||
                              sc.content.toLowerCase().includes(lore.name.toLowerCase());

          if (isPov || isSetting || isMentioned) {
            rawEdges.push({
              id: `${scNodeId}->${lore.id}`,
              source: scNodeId,
              target: lore.id,
              label: isPov ? 'POV' : isSetting ? 'Setting' : 'Mentions',
              color: isPov ? '#1d4ed8' : '#3b82f6',
            });
            scNode.degree++;
            lNode.degree++;
            addNeighbor(scNode.id, lNode.id);
          }
        });
      });
    }

    // E. Calculate adaptive radius based on degree
    rawNodes.forEach((node) => {
      node.radius = Math.min(28, Math.max(13, 14 + Math.sqrt(node.degree) * 3.5));
    });

    // F. Filter orphans or Local Subgraph if enabled
    let finalNodes = rawNodes;
    if (!showOrphans) {
      finalNodes = finalNodes.filter((n) => n.degree > 0);
    }

    if (isLocalMode && activeSelectedId) {
      const activeNeighbors = neighbors.get(activeSelectedId) || new Set();
      finalNodes = finalNodes.filter((n) => n.id === activeSelectedId || activeNeighbors.has(n.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      finalNodes = finalNodes.filter((n) => {
        return (
          n.label.toLowerCase().includes(q) ||
          (n.role && n.role.toLowerCase().includes(q)) ||
          (n.summary && n.summary.toLowerCase().includes(q))
        );
      });
    }

    const finalNodeIds = new Set(finalNodes.map((n) => n.id));
    const finalEdges = rawEdges.filter((e) => finalNodeIds.has(e.source) && finalNodeIds.has(e.target));

    return {
      nodes: finalNodes,
      edges: finalEdges,
      neighborMap: neighbors,
    };
  }, [loreList, scenes, visibleCategories, showScenes, showOrphans, isLocalMode, activeSelectedId, searchQuery]);

  // Selected node details
  const activeNode = useMemo(() => {
    return nodes.find((n) => n.id === activeSelectedId) || null;
  }, [nodes, activeSelectedId]);

  // Direct connections of the selected node
  const activeNodeEdges = useMemo(() => {
    if (!activeSelectedId) return [];
    return edges.filter((e) => e.source === activeSelectedId || e.target === activeSelectedId);
  }, [edges, activeSelectedId]);

  // -------------------------------------------------------------
  // 2. Physics Simulation Loop (Coulomb Repulsion + Hooke Spring)
  // -------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    let heat = 1.0;

    const simulate = () => {
      if (isSimRunning && heat > 0.01) {
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));

        // 1. Repulsion between all node pairs
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 400) {
              const force = (repulsionStrength / (dist * dist)) * heat;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              a.vx -= fx;
              a.vy -= fy;
              b.vx += fx;
              b.vy += fy;
            }
          }
        }

        // 2. Spring attraction along edges
        for (let i = 0; i < edges.length; i++) {
          const edge = edges[i];
          const a = nodeMap.get(edge.source);
          const b = nodeMap.get(edge.target);
          if (!a || !b) continue;

          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const displacement = dist - linkDistance;
          const force = displacement * 0.035 * heat;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }

        // 3. Center gravity towards (0, 0)
        nodes.forEach((n) => {
          const distToOrigin = Math.sqrt(n.x * n.x + n.y * n.y) || 1;
          const gravity = 0.015 * heat;
          n.vx -= (n.x / distToOrigin) * (distToOrigin * gravity);
          n.vy -= (n.y / distToOrigin) * (distToOrigin * gravity);

          // Apply velocity and damping
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.82;
          n.vy *= 0.82;
        });

        heat *= 0.992;
      }

      draw();
      animId = requestAnimationFrame(simulate);
    };

    animId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animId);
  }, [nodes, edges, isSimRunning, repulsionStrength, linkDistance]);

  // -------------------------------------------------------------
  // 3. High-DPI Canvas Rendering
  // -------------------------------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Center transform
    ctx.translate(width / 2 + transformRef.current.x, height / 2 + transformRef.current.y);
    ctx.scale(transformRef.current.scale, transformRef.current.scale);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const focusedId = hoveredNodeId || activeSelectedId;
    const activeNeighbors = focusedId ? (neighborMap.get(focusedId) || new Set()) : null;

    // A. Draw Edges / Links
    edges.forEach((edge) => {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) return;

      const isConnectedToFocus = focusedId && (edge.source === focusedId || edge.target === focusedId);
      const isDimmed = focusedId && !isConnectedToFocus;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);

      if (isConnectedToFocus) {
        ctx.strokeStyle = '#eb5e28';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.95;
      } else {
        ctx.strokeStyle = 'var(--border-subtle)';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = isDimmed ? 0.08 : 0.45;
      }
      ctx.stroke();

      // Draw Edge Label if enabled
      if (showEdgeLabels && !isDimmed) {
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;

        ctx.font = '9px var(--font-sans, system-ui)';
        ctx.fillStyle = isConnectedToFocus ? '#eb5e28' : 'var(--text-muted)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.label, midX, midY - 4);
      }
      ctx.restore();
    });

    // B. Draw Nodes
    nodes.forEach((node) => {
      const isSelected = activeSelectedId === node.id;
      const isHovered = hoveredNodeId === node.id;
      const isNeighbor = activeNeighbors ? activeNeighbors.has(node.id) : false;
      const isDimmed = focusedId && !isSelected && !isHovered && !isNeighbor;

      ctx.save();
      ctx.globalAlpha = isDimmed ? 0.15 : 1.0;

      // Glow effect for selected / hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(235, 94, 40, 0.25)' : 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      }

      // Outer circle border
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.stroke();

      // Node Label
      ctx.font = `${Math.max(10, Math.min(13, node.radius * 0.85))}px var(--font-sans, system-ui)`;
      ctx.fillStyle = 'var(--text-primary)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Text background outline for high contrast
      ctx.strokeStyle = 'var(--bg-app)';
      ctx.lineWidth = 3;
      ctx.strokeText(node.label, node.x, node.y + node.radius + 5);
      ctx.fillText(node.label, node.x, node.y + node.radius + 5);

      // Degree indicator badge if connected
      if (node.degree > 1 && !isDimmed) {
        ctx.beginPath();
        ctx.arc(node.x + node.radius * 0.7, node.y - node.radius * 0.7, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'var(--bg-surface)';
        ctx.fill();
        ctx.strokeStyle = 'var(--border-subtle)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '8px var(--font-mono, monospace)';
        ctx.fillStyle = 'var(--text-primary)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${node.degree}`, node.x + node.radius * 0.7, node.y - node.radius * 0.7);
      }

      ctx.restore();
    });

    ctx.restore();
  }, [nodes, edges, hoveredNodeId, activeSelectedId, neighborMap, showEdgeLabels]);

  // Resize canvas to match display size with DPI scaling
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      draw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // -------------------------------------------------------------
  // 4. Mouse & Drag Interaction
  // -------------------------------------------------------------
  const isDraggingCanvasRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const screenX = (clientX - rect.left) * dpr;
    const screenY = (clientY - rect.top) * dpr;

    const worldX = (screenX - canvas.width / 2 - transformRef.current.x) / transformRef.current.scale;
    const worldY = (screenY - canvas.height / 2 - transformRef.current.y) / transformRef.current.scale;

    return { x: worldX, y: worldY };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    // Check if clicked a node
    const hit = nodes.slice().reverse().find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    if (hit) {
      draggedNodeRef.current = hit;
      setActiveSelectedId(hit.id);
      onSelectNode(hit.id, hit.category);
    } else {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      draw();
      return;
    }

    if (isDraggingCanvasRef.current) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      }));
      return;
    }

    // Hover detection
    const hit = nodes.slice().reverse().find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    setHoveredNodeId(hit ? hit.id : null);
  };

  const handleMouseUp = () => {
    isDraggingCanvasRef.current = false;
    draggedNodeRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setTransform((prev) => {
      const newScale = Math.min(3.5, Math.max(0.18, prev.scale * zoomFactor));
      return {
        ...prev,
        scale: newScale,
      };
    });
  };

  // Center & Fit View
  const handleResetCamera = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  // Quick link submission
  const handleCreateQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedId || !linkTargetId.trim() || !onAddRelationship) return;

    const sourceEntry = loreList.find((l) => l.id === activeSelectedId);
    if (!sourceEntry) return;

    onAddRelationship(sourceEntry.id, linkTargetId.trim(), linkType.trim() || 'Connected with');
    setIsLinking(false);
    setLinkTargetId('');
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-app)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Background Subtle Coordinate Grid / Dot Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(var(--border-subtle) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
        opacity: 0.45,
        pointerEvents: 'none',
      }} />

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: draggedNodeRef.current ? 'grabbing' : isDraggingCanvasRef.current ? 'move' : hoveredNodeId ? 'pointer' : 'default',
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* Top Floating Control Bar (Search, Filters, Camera, Fullscreen) */}
      {/* ------------------------------------------------------------- */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        zIndex: 20,
      }}>
        {/* Left: Search & Mode Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-md)',
            backdropFilter: 'blur(8px)',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search graph..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: 'var(--text-primary)',
                width: '140px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div style={{
            padding: '6px 12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-md)',
          }}>
            {isLocalMode ? '🎯 Local Subgraph' : `🕸️ Global Graph: ${nodes.length} Nodes • ${edges.length} Links`}
          </div>
        </div>

        {/* Right: Camera Tools, Settings Drawer Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'auto' }}>
          <button
            onClick={() => setTransform((prev) => ({ ...prev, scale: Math.min(3.5, prev.scale * 1.2) }))}
            title="Zoom In (+)"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <ZoomIn size={15} />
          </button>

          <button
            onClick={() => setTransform((prev) => ({ ...prev, scale: Math.max(0.18, prev.scale * 0.8) }))}
            title="Zoom Out (-)"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <ZoomOut size={15} />
          </button>

          <button
            onClick={handleResetCamera}
            title="Reset Camera & Center"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={() => setIsSimRunning(!isSimRunning)}
            title={isSimRunning ? 'Pause Physics' : 'Resume Physics'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: isSimRunning ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {isSimRunning ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Graph Filters & Physics Settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: showSettings ? 'var(--accent-pill)' : 'var(--bg-surface)',
              color: showSettings ? 'var(--accent-pill-text)' : 'var(--text-primary)',
              border: `1px solid ${showSettings ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Filter size={14} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Obsidian Filters & Physics Settings Drawer */}
      {/* ------------------------------------------------------------- */}
      {showSettings && (
        <div style={{
          position: 'absolute',
          top: '58px',
          right: '16px',
          width: '280px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-lg)',
          padding: '16px',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              Graph Settings & Filters
            </span>
            <button
              onClick={() => setShowSettings(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Category Visibility Toggles */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Visible Elements
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(['character', 'location', 'lore', 'item', 'faction'] as LoreCategory[]).map((catId) => {
                const cfg = CODEX_CATEGORIES[catId];
                const isChecked = visibleCategories[catId];

                return (
                  <label
                    key={catId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.color }} />
                      <span>{cfg.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setVisibleCategories((prev) => ({ ...prev, [catId]: !prev[catId] }))}
                    />
                  </label>
                );
              })}

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  borderTop: '1px dashed var(--border-subtle)',
                  paddingTop: '6px',
                  marginTop: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={12} color="#3b82f6" />
                  <span>Manuscript Scenes</span>
                </div>
                <input
                  type="checkbox"
                  checked={showScenes}
                  onChange={() => setShowScenes(!showScenes)}
                />
              </label>
            </div>
          </div>

          {/* Display Toggles */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Display Options
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <span>Show Unconnected (Orphans)</span>
                <input
                  type="checkbox"
                  checked={showOrphans}
                  onChange={() => setShowOrphans(!showOrphans)}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <span>Show Relationship Labels</span>
                <input
                  type="checkbox"
                  checked={showEdgeLabels}
                  onChange={() => setShowEdgeLabels(!showEdgeLabels)}
                />
              </label>
            </div>
          </div>

          {/* Physics Forces Sliders */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Forces & Spacing
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Node Repulsion</span>
                  <span>{repulsionStrength}</span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="5000"
                  step="200"
                  value={repulsionStrength}
                  onChange={(e) => setRepulsionStrength(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Link Distance</span>
                  <span>{linkDistance}px</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="240"
                  step="10"
                  value={linkDistance}
                  onChange={(e) => setLinkDistance(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Node Inspector Card (Floating HUD on selection) */}
      {/* ------------------------------------------------------------- */}
      {activeNode && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          width: '320px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          padding: '16px',
          zIndex: 25,
          backdropFilter: 'blur(10px)',
        }}>
          {/* Header with Close */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: `${activeNode.color}20`,
                border: `1px solid ${activeNode.color}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {activeNode.category === 'character' && <User size={13} color={activeNode.color} />}
                {activeNode.category === 'location' && <MapPin size={13} color={activeNode.color} />}
                {activeNode.category === 'lore' && <Sparkles size={13} color={activeNode.color} />}
                {activeNode.category === 'item' && <Package size={13} color={activeNode.color} />}
                {activeNode.category === 'faction' && <Shield size={13} color={activeNode.color} />}
                {activeNode.category === 'scene' && <BookOpen size={13} color="#3b82f6" />}
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {activeNode.label}
                </h3>
                <span style={{ fontSize: '11px', color: activeNode.color, fontWeight: 600, textTransform: 'uppercase' }}>
                  {activeNode.role || activeNode.category}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveSelectedId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Summary snippet */}
          {activeNode.summary && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '6px 0 10px', lineHeight: 1.4 }}>
              {activeNode.summary}
            </p>
          )}

          {/* Connections list */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Connected Entities ({activeNodeEdges.length})
            </span>

            {activeNodeEdges.length === 0 ? (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Isolated node (no connections yet).
              </span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '80px', overflowY: 'auto' }}>
                {activeNodeEdges.map((e) => {
                  const targetId = e.source === activeNode.id ? e.target : e.source;
                  const targetNode = nodes.find((n) => n.id === targetId);

                  return (
                    <span
                      key={e.id}
                      onClick={() => {
                        setActiveSelectedId(targetId);
                        onSelectNode(targetId, targetNode?.category || 'character');
                      }}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-active)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        border: '1px solid var(--border-subtle)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{e.label}:</span>
                      <span>{targetNode?.label || targetId}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Linking Form toggle */}
          {isLinking ? (
            <form onSubmit={handleCreateQuickLink} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', padding: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
              <input
                list="graph-link-targets"
                value={linkTargetId}
                onChange={(e) => setLinkTargetId(e.target.value)}
                placeholder="Target entity..."
                style={{
                  fontSize: '11px',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <datalist id="graph-link-targets">
                {loreList.filter((l) => l.id !== activeNode.id).map((l) => (
                  <option key={l.id} value={l.name} />
                ))}
              </datalist>

              <input
                value={linkType}
                onChange={(e) => setLinkType(e.target.value)}
                placeholder="Relation (e.g. Wields, Ruler of)..."
                style={{
                  fontSize: '11px',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsLinking(false)}
                  style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!linkTargetId.trim()}
                  style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--accent-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Link
                </button>
              </div>
            </form>
          ) : null}

          {/* Card Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeNode.category !== 'scene' && (
              <button
                onClick={() => onOpenDossier(activeNode.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span>Open Dossier</span>
                <ExternalLink size={12} />
              </button>
            )}

            {activeNode.category === 'scene' && onOpenScene && activeNode.sceneItem && (
              <button
                onClick={() => onOpenScene(activeNode.sceneItem!.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span>Edit Scene</span>
                <ExternalLink size={12} />
              </button>
            )}

            {onAddRelationship && activeNode.category !== 'scene' && (
              <button
                onClick={() => setIsLinking(!isLinking)}
                title="Establish new connection from this node"
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-active)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Link2 size={13} />
                <span>+ Link</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
