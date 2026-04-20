import { useState, useRef, useCallback, useEffect } from 'react';

export function usePanZoom() {
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(0.85);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const canvasRef = useRef(null);

  const onPointerDown = useCallback((e) => {
    // Don't pan if clicking on a node
    if (e.target.closest('.node')) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    canvasRef.current?.classList.add('dragging-pan');
  }, [pan]);

  useEffect(() => {
    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
      canvasRef.current?.classList.remove('dragging-pan');
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom(oldZoom => {
      const newZoom = Math.max(0.2, Math.min(2.5, oldZoom + delta));
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        setPan(p => ({
          x: mx - (mx - p.x) * (newZoom / oldZoom),
          y: my - (my - p.y) * (newZoom / oldZoom)
        }));
      }
      return newZoom;
    });
  }, []);

  const resetView = useCallback(() => {
    setPan({ x: 40, y: 40 });
    setZoom(0.85);
  }, []);

  const focusPoint = useCallback((x, y) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setZoom(1);
    setPan({ x: rect.width / 2 - x, y: rect.height / 2 - y });
  }, []);

  return {
    pan,
    zoom,
    canvasRef,
    onPointerDown,
    onWheel,
    resetView,
    focusPoint
  };
}
