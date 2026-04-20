import React, { useRef, useCallback } from 'react';
import { escapeHtml, highlightCode } from '../utils/helpers';

const ICONS = {
  class: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  fn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
};

export default function Node({
  node,
  position,
  isEntry,
  isExpanded,
  isSelected,
  zoom,
  onPositionChange,
  onToggle,
  onSelect
}) {
  const nodeRef = useRef(null);
  const dragStateRef = useRef(null);

  const iconClass = node.type === 'class' ? 'class' : (node.type === 'file' ? 'file' : 'fn');

  const handlePointerDown = useCallback((e) => {
    // Only drag from the header
    if (!e.target.closest('.node-header')) return;
    // Don't drag from the caret button
    if (e.target.closest('.node-caret')) return;
    e.stopPropagation();
    e.preventDefault();

    onSelect(node.id);

    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
      hasMoved: false
    };

    nodeRef.current?.setPointerCapture(e.pointerId);
    nodeRef.current?.classList.add('dragging');
  }, [node.id, position, onSelect]);

  const handlePointerMove = useCallback((e) => {
    if (!dragStateRef.current) return;
    const dx = (e.clientX - dragStateRef.current.startX) / zoom;
    const dy = (e.clientY - dragStateRef.current.startY) / zoom;

    if (!dragStateRef.current.hasMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
      dragStateRef.current.hasMoved = true;
    }

    onPositionChange(node.id, {
      x: dragStateRef.current.origX + dx,
      y: dragStateRef.current.origY + dy
    });
  }, [node.id, zoom, onPositionChange]);

  const handlePointerUp = useCallback((e) => {
    if (!dragStateRef.current) return;
    const wasDrag = dragStateRef.current.hasMoved;
    dragStateRef.current = null;
    nodeRef.current?.classList.remove('dragging');
    try { nodeRef.current?.releasePointerCapture(e.pointerId); } catch {}

    // If it wasn't a drag, treat as click (expand/collapse)
    if (!wasDrag) {
      onToggle(node.id);
    }
  }, [node.id, onToggle]);

  const classes = [
    'node',
    isEntry && 'entry',
    node.has_bug && 'has-bug',
    isExpanded && 'expanded',
    isSelected && 'selected'
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={nodeRef}
      className={classes}
      style={{ left: position.x, top: position.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="node-header">
        <div className={`node-icon ${iconClass}`}>{ICONS[iconClass]}</div>
        <div className="node-title">{node.name || 'anonymous'}</div>
        <span className="node-meta">{node.type || ''}</span>
        <div className="node-caret">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M3 2l4 3-4 3z" fill="currentColor" />
          </svg>
        </div>
      </div>

      <div className="node-body">
        {node.summary && <div className="node-summary">{node.summary}</div>}
        {(node.code_lines || []).length > 0 ? (
          (node.code_lines || []).map((line, i) => (
            <div key={i} className={`code-line ${line.bug ? 'buggy' : ''}`}>
              <span className="line-num">{line.n}</span>
              <span
                className="line-code"
                dangerouslySetInnerHTML={{ __html: highlightCode(line.text || '') }}
              />
              {line.bug && <span className="bug-tag" title={line.bug}>bug</span>}
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--subtle)' }}>// no code extracted</div>
        )}
      </div>

      <div className="node-foot">
        {isEntry && <span className="chip entry">entry</span>}
        {node.has_bug && <span className="chip bug">bug</span>}
        {node.file && <span className="chip">{node.file.split('/').pop()}</span>}
        {node.start_line && <span className="chip">L{node.start_line}</span>}
      </div>
    </div>
  );
}
