import React from 'react';

export default function Overlay({ visible, title, sub, progress, steps, error, onDismiss }) {
  if (!visible) return null;

  return (
    <div className="overlay">
      <div className="overlay-box">
        {error ? (
          <>
            <div className="overlay-title err">analysis failed</div>
            <div className="overlay-sub">{error.title || 'Something went wrong'}</div>
            <div className="error-body">{error.message}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.6' }}>
              Check the browser console (F12) for details.<br />
              Common causes: invalid API key, no credits, browser extensions blocking the request, or rate limits.
            </div>
            <button className="btn btn-primary" onClick={onDismiss} style={{ width: 'auto', padding: '8px 24px' }}>
              Dismiss
            </button>
          </>
        ) : (
          <>
            <div className="overlay-title"><em>{title}</em></div>
            <div className="overlay-sub">{sub}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-steps">
              {steps.map((s) => (
                <div key={s.id} className={`progress-step ${s.state}`}>
                  {s.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
