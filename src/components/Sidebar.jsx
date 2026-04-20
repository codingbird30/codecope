import React, { useRef, useState } from 'react';

export default function Sidebar({
  fileInfo,
  files,
  context, setContext,
  focus, setFocus,
  onFile,
  onAnalyze,
  onReset,
  isAnalyzing,
  hasApiKey
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files[0]) onFile(e.target.files[0]);
  };

  const paths = Object.keys(files || {}).sort();

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        {import.meta.env.DEV && (
          hasApiKey ? (
            <div className="env-ok">API key loaded from .env</div>
          ) : (
            <div className="env-banner">
              <strong>⚠ No API key</strong><br />
              Create <code>.env</code> with<br />
              <code>VITE_ANTHROPIC_API_KEY=sk-ant-...</code><br />
              then restart <code>npm run dev</code>
            </div>
          )
        )}

        <div className="field">
          <label className="field-label">Project</label>
          <div
            className={`upload-zone ${dragging ? 'drag' : ''} ${fileInfo ? 'has-file' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input ref={inputRef} type="file" accept=".zip" onChange={handleChange} hidden />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="u-title">{fileInfo ? fileInfo.name : 'Drop zip file'}</div>
            <div className="u-sub">
              {fileInfo ? `${fileInfo.count} source files · ${(fileInfo.size / 1024).toFixed(1)} KB` : 'or click to browse'}
            </div>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Files detected</label>
          <div className="file-tree">
            {paths.length === 0 ? (
              <div style={{ color: 'var(--subtle)', textAlign: 'center', padding: '20px 0' }}>— no files loaded —</div>
            ) : (
              paths.map(p => (
                <div key={p} className="file-tree-item">
                  <span className="dot"></span>{p}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="field">
          <label className="field-label">Usage context</label>
          <select value={context} onChange={(e) => setContext(e.target.value)}>
            <option value="">None specified</option>
            <option value="production API">Production API</option>
            <option value="high-concurrency server">High-concurrency server</option>
            <option value="CLI tool">CLI tool</option>
            <option value="data pipeline">Data pipeline</option>
            <option value="frontend/browser">Frontend / browser</option>
            <option value="machine learning">ML / data science</option>
          </select>
        </div>

        <div className="field">
          <label className="field-label">Focus (optional)</label>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. security of auth flow, perf of data handler, memory leaks..."
          />
        </div>

        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={onAnalyze}
            disabled={isAnalyzing || paths.length === 0 || !hasApiKey}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </button>
          <button
            className="btn btn-ghost"
            onClick={onReset}
            style={{ maxWidth: '80px' }}
          >
            Reset
          </button>
        </div>
      </div>
    </aside>
  );
}
