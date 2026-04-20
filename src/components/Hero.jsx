import React, { useRef, useState } from 'react';

export default function Hero({ onFile }) {
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

  return (
    <div className="hero">
      <div className="hero-inner">
        <h1 className="hero-title">See your code<br /><em>think</em>.</h1>
        <p className="hero-sub">
          Upload a zipped project. Get an interactive call graph, line-by-line analysis,<br />
          and an AI debugging partner — all in one view.
        </p>

        <label
          className={`hero-upload ${dragging ? 'drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <h3>Drop a .zip file or click to browse</h3>
          <p>Up to 50 files · JavaScript, TypeScript, Python, Java, Go, Rust, and more</p>
          <input ref={inputRef} type="file" accept=".zip" onChange={handleChange} hidden />
        </label>

        <div className="hero-features">
          <div className="hero-feat">
            <h4>🔍 AST-level visualization</h4>
            <p>Expand any function to see every line, color-coded and interactive.</p>
          </div>
          <div className="hero-feat">
            <h4>🐛 Inline bug detection</h4>
            <p>Issues are pinned to the exact line where they occur in the graph.</p>
          </div>
          <div className="hero-feat">
            <h4>⚡ Call-flow tracing</h4>
            <p>Follow execution from entry point through every function call.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
