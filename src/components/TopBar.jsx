import React from 'react';

export default function TopBar({ status, hasApiKey, theme, onToggleTheme }) {
  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-mark">codescope</span>
        <span className="brand-sub">visual debugger</span>
      </div>
      <div className="top-actions">
        {!hasApiKey && <span className="pill warn">no API key</span>}
        <span className={`pill ${status === 'ready' || status === 'analyzed' ? 'live' : ''}`}>
          {status}
        </span>
        <span className="pill">claude-sonnet-4-6</span>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
