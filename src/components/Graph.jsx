import React, { useMemo } from 'react';
import Node from './Node';

export default function Graph({
  graph,
  positions,
  expanded,
  selected,
  onPositionChange,
  onToggleNode,
  onSelectNode,
  onExpandAll,
  onCollapseAll,
  panZoom
}) {
  const { pan, zoom, canvasRef, onPointerDown, onWheel, resetView } = panZoom;

  const edges = graph.edges || [];

  // Build edges based on current positions
  const edgePaths = useMemo(() => {
    return edges.map((e, idx) => {
      const from = positions[e.from];
      const to = positions[e.to];
      if (!from || !to) return null;

      // Approximate node size based on whether expanded
      const fromW = 280;
      const fromH = expanded.has(e.from) ? 220 : 72;
      const toH = expanded.has(e.to) ? 220 : 72;

      const x1 = from.x + fromW;
      const y1 = from.y + fromH / 2;
      const x2 = to.x;
      const y2 = to.y + toH / 2;

      const dx = Math.abs(x2 - x1);
      const cpOffset = Math.max(40, dx * 0.5);
      const d = `M ${x1},${y1} C ${x1 + cpOffset},${y1} ${x2 - cpOffset},${y2} ${x2},${y2}`;

      const active = selected === e.from || selected === e.to;
      return { idx, d, active, from: e.from, to: e.to };
    }).filter(Boolean);
  }, [edges, positions, expanded, selected]);

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  return (
    <main className="canvas-wrap">
      <div className="canvas-toolbar">
        <button className="tool-btn active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="2" />
            <circle cx="18" cy="6" r="2" />
            <circle cx="12" cy="18" r="2" />
            <line x1="8" y1="7" x2="10" y2="17" />
            <line x1="16" y1="7" x2="14" y2="17" />
          </svg>
          graph
        </button>
        <button className="tool-btn" onClick={onExpandAll}>expand all</button>
        <button className="tool-btn" onClick={onCollapseAll}>collapse all</button>
        <button className="tool-btn" onClick={resetView}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          recenter
        </button>
      </div>

      <div
        className="canvas"
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onWheel={onWheel}
      >
        <svg
          className="graph-svg"
          style={{ transform, transformOrigin: '0 0' }}
          width="3000"
          height="3000"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--border-hi)" />
            </marker>
            <marker id="arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>
          {edgePaths.map((ep) => (
            <path
              key={ep.idx}
              className={`edge ${ep.active ? 'active' : ''}`}
              d={ep.d}
              markerEnd={ep.active ? 'url(#arrow-hot)' : 'url(#arrow)'}
            />
          ))}
        </svg>

        <div className="graph-layer" style={{ transform }}>
          {graph.nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            return (
              <Node
                key={node.id}
                node={node}
                position={pos}
                isEntry={node.id === graph.entry_point}
                isExpanded={expanded.has(node.id)}
                isSelected={selected === node.id}
                zoom={zoom}
                onPositionChange={onPositionChange}
                onToggle={onToggleNode}
                onSelect={onSelectNode}
              />
            );
          })}
        </div>
      </div>

      <div className="canvas-legend">
        <div className="legend-row"><span className="legend-dot" style={{ color: 'var(--accent)' }}></span> entry point</div>
        <div className="legend-row"><span className="legend-dot" style={{ color: 'var(--red)' }}></span> has bug</div>
        <div className="legend-row"><span className="legend-dot" style={{ color: 'var(--blue)' }}></span> file / module</div>
        <div className="legend-row"><span className="legend-dot" style={{ color: 'var(--purple)' }}></span> class</div>
      </div>

      <div className="zoom-badge">{Math.round(zoom * 100)}%</div>
    </main>
  );
}
