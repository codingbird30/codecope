import React, { useState, useCallback, useRef } from 'react';
import TopBar from './components/TopBar';
import Hero from './components/Hero';
import Sidebar from './components/Sidebar';
import Graph from './components/Graph';
import ReportPanel from './components/ReportPanel';
import Overlay from './components/Overlay';
import { useTheme } from './hooks/useTheme';
import { usePanZoom } from './hooks/usePanZoom';
import { processZip } from './utils/zip';
import { analyzeCode } from './utils/api';
import { layoutGraph } from './utils/layout';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

const INITIAL_STEPS = [
  { id: 's1', label: 'Sending source to Claude', state: 'active' },
  { id: 's2', label: 'Parsing files and tracing calls', state: 'pending' },
  { id: 's3', label: 'Finding bugs & edge cases', state: 'pending' },
  { id: 's4', label: 'Building graph visualization', state: 'pending' },
];

const UNPACK_STEPS = [
  { id: 'unpack', label: 'Unzipping archive', state: 'active' },
  { id: 'filter', label: 'Filtering source files', state: 'pending' },
  { id: 'ready',  label: 'Ready for analysis', state: 'pending' },
];

function updateStep(steps, id, state) {
  return steps.map(s => s.id === id ? { ...s, state } : s);
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const panZoom = usePanZoom();

  // ── File / project state ──────────────────────────────────
  const [files, setFiles] = useState({});
  const [fileInfo, setFileInfo] = useState(null);
  const [context, setContext] = useState('');
  const [focus, setFocus] = useState('');

  // ── Graph state ───────────────────────────────────────────
  const [graph, setGraph] = useState(null);
  const [positions, setPositions] = useState({});
  const [expanded, setExpanded] = useState(new Set());
  const [selected, setSelected] = useState(null);

  // ── UI state ──────────────────────────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState('idle');

  // ── Overlay state ─────────────────────────────────────────
  const [overlay, setOverlay] = useState({
    visible: false,
    title: '',
    sub: '',
    progress: 0,
    steps: UNPACK_STEPS,
    error: null,
  });

  const hasResults = !!graph;

  // ── File handling ─────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Please upload a .zip file.');
      return;
    }

    setOverlay({ visible: true, title: 'unpacking', sub: `reading ${file.name}`, progress: 10, steps: UNPACK_STEPS, error: null });

    try {
      setOverlay(o => ({ ...o, progress: 20 }));

      const extracted = await processZip(file);

      setOverlay(o => ({
        ...o,
        progress: 70,
        steps: updateStep(updateStep(o.steps, 'unpack', 'done'), 'filter', 'active'),
      }));

      await new Promise(r => setTimeout(r, 200));

      setOverlay(o => ({
        ...o,
        progress: 100,
        steps: updateStep(updateStep(updateStep(o.steps, 'unpack', 'done'), 'filter', 'done'), 'ready', 'done'),
      }));

      setFiles(extracted);
      setFileInfo({
        name: file.name,
        count: Object.keys(extracted).length,
        size: file.size,
      });
      setStatus('ready');
      setGraph(null);
      setPositions({});
      setExpanded(new Set());
      setSelected(null);

      setTimeout(() => setOverlay(o => ({ ...o, visible: false })), 400);
    } catch (e) {
      setOverlay(o => ({
        ...o,
        error: { title: 'Failed to unpack', message: e.message },
      }));
    }
  }, []);

  // ── Analysis ──────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!API_KEY) {
      alert('No API key found. Add VITE_ANTHROPIC_API_KEY to your .env file and restart the dev server.');
      return;
    }
    if (Object.keys(files).length === 0) {
      alert('Upload a zip file first.');
      return;
    }

    setIsAnalyzing(true);
    setStatus('analyzing');

    const steps = INITIAL_STEPS.map((s, i) => ({ ...s, state: i === 0 ? 'active' : 'pending' }));
    setOverlay({ visible: true, title: 'analyzing', sub: 'claude is reading your code', progress: 15, steps, error: null });

    try {
      const result = await analyzeCode({
        files,
        context,
        focus,
        apiKey: API_KEY,
        onProgress: (type, value) => {
          if (type === 'progress') {
            setOverlay(o => ({ ...o, progress: value }));
          } else {
            // type is step id, value is new state
            setOverlay(o => ({
              ...o,
              steps: updateStep(o.steps, type, value),
            }));
          }
        },
      });

      const computedPositions = layoutGraph(result);

      // s4 done
      setOverlay(o => ({
        ...o,
        progress: 100,
        steps: updateStep(o.steps, 's4', 'done'),
      }));

      setGraph(result);
      setPositions(computedPositions);
      setExpanded(new Set());
      setSelected(null);
      setStatus('analyzed');
      panZoom.resetView();

      setTimeout(() => setOverlay(o => ({ ...o, visible: false })), 500);
    } catch (e) {
      console.error('[codescope]', e);
      setOverlay(o => ({
        ...o,
        error: { title: 'Analysis failed', message: e.message },
      }));
      setStatus('ready');
    } finally {
      setIsAnalyzing(false);
    }
  }, [files, context, focus, panZoom]);

  // ── Reset ─────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setFiles({});
    setFileInfo(null);
    setGraph(null);
    setPositions({});
    setExpanded(new Set());
    setSelected(null);
    setContext('');
    setFocus('');
    setStatus('idle');
    panZoom.resetView();
  }, [panZoom]);

  // ── Node interactions ─────────────────────────────────────
  const handlePositionChange = useCallback((id, pos) => {
    setPositions(prev => ({ ...prev, [id]: { ...prev[id], ...pos } }));
  }, []);

  const handleToggleNode = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectNode = useCallback((id) => {
    setSelected(id);
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!graph) return;
    setExpanded(new Set(graph.nodes.map(n => n.id)));
  }, [graph]);

  const handleCollapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const handleFocusNode = useCallback((id) => {
    const pos = positions[id];
    if (!pos) return;
    setSelected(id);
    setExpanded(prev => new Set([...prev, id]));
    panZoom.focusPoint(pos.x + 140, pos.y + 80);
  }, [positions, panZoom]);

  const handleCanvasClick = useCallback((e) => {
    if (!e.target.closest('.node')) {
      setSelected(null);
    }
  }, []);

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <div className={`app ${(fileInfo || hasResults) ? '' : 'no-results'}`} onClick={handleCanvasClick}>
        <TopBar
          status={status}
          hasApiKey={!!API_KEY}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Hero: only when no file uploaded yet */}
        {!fileInfo && !hasResults && (
          <Hero onFile={handleFile} />
        )}

        {/* Three-panel layout: once a file is loaded */}
        {(fileInfo || hasResults) && (
          <>
            <Sidebar
              fileInfo={fileInfo}
              files={files}
              context={context}
              setContext={setContext}
              focus={focus}
              setFocus={setFocus}
              onFile={handleFile}
              onAnalyze={handleAnalyze}
              onReset={handleReset}
              isAnalyzing={isAnalyzing}
              hasApiKey={!!API_KEY}
            />

            {hasResults ? (
              <Graph
                graph={graph}
                positions={positions}
                expanded={expanded}
                selected={selected}
                onPositionChange={handlePositionChange}
                onToggleNode={handleToggleNode}
                onSelectNode={handleSelectNode}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
                panZoom={panZoom}
              />
            ) : (
              <main className="canvas-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--subtle)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>⬡</div>
                  <div>Press <strong style={{ color: 'var(--accent)' }}>Analyze</strong> to build the graph</div>
                </div>
              </main>
            )}

            <ReportPanel
              graph={graph}
              onFocusNode={handleFocusNode}
            />
          </>
        )}
      </div>

      <Overlay
        {...overlay}
        onDismiss={() => setOverlay(o => ({ ...o, visible: false, error: null }))}
      />
    </>
  );
}
