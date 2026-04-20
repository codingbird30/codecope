import React, { useState } from 'react';

export default function ReportPanel({ graph, onFocusNode }) {
  const [tab, setTab] = useState('issues');

  if (!graph) {
    return (
      <aside className="rightbar">
        <div className="rb-inner">
          <h2 className="rb-heading"><em>debug</em> report</h2>
          <div className="rb-sub">— analyze a project to see the report —</div>
        </div>
      </aside>
    );
  }

  const issues = graph.issues || [];
  const fixes = graph.fixes || [];
  const edgeCases = graph.edge_cases || [];
  const notes = graph.notes || [];

  const health = issues.length === 0 ? 'A+' :
    issues.filter(i => i.severity === 'high').length > 0 ? 'C' :
      issues.filter(i => i.severity === 'medium').length > 2 ? 'B' : 'B+';
  const healthClass = health.startsWith('A') ? 'green' : health.startsWith('C') ? 'red' : 'amber';

  return (
    <aside className="rightbar">
      <div className="rb-inner">
        <h2 className="rb-heading"><em>debug</em> report</h2>
        <div className="rb-sub">{graph.summary || '—'}</div>

        <div className="stat-grid">
          <div className="stat"><div className="stat-n accent">{graph.nodes.length}</div><div className="stat-l">nodes</div></div>
          <div className="stat"><div className="stat-n red">{issues.length}</div><div className="stat-l">issues</div></div>
          <div className="stat"><div className="stat-n amber">{(graph.edges || []).length}</div><div className="stat-l">edges</div></div>
          <div className="stat"><div className={`stat-n ${healthClass}`}>{health}</div><div className="stat-l">health</div></div>
        </div>

        <div className="rb-tabs">
          {['issues', 'fixes', 'edge', 'notes'].map(t => (
            <button
              key={t}
              className={`rb-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="rb-body">
          {tab === 'issues' && (
            issues.length === 0 ? (
              <div className="empty">No issues detected — looks clean!</div>
            ) : (
              issues.map((i, idx) => (
                <div key={idx} className={`issue sev-${(i.severity || 'low').toLowerCase()}`}>
                  <div className="issue-title">
                    {i.title}
                    <span className={`sev-tag ${(i.severity || 'low').toLowerCase()}`}>
                      {i.severity || 'low'}
                    </span>
                  </div>
                  {i.file && (
                    <div
                      className="issue-where"
                      onClick={() => i.node_id && onFocusNode(i.node_id)}
                    >
                      {i.file}{i.line ? ':' + i.line : ''}
                    </div>
                  )}
                  <div className="issue-reason">{i.reason}</div>
                </div>
              ))
            )
          )}

          {tab === 'fixes' && (
            fixes.length === 0 ? (
              <div className="empty">No fixes proposed.</div>
            ) : (
              fixes.map((f, idx) => (
                <div key={idx} className="fix-block">
                  <div className="fix-title">{f.title}</div>
                  {f.for_issue && (
                    <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>
                      for: {f.for_issue}
                    </div>
                  )}
                  <div className="fix-expl">{f.explanation || ''}</div>
                  <pre className="fix-code">{f.code || ''}</pre>
                </div>
              ))
            )
          )}

          {tab === 'edge' && (
            edgeCases.length === 0 ? (
              <div className="empty">No edge cases flagged.</div>
            ) : (
              edgeCases.map((ec, idx) => (
                <div key={idx} className="issue" style={{ borderLeftColor: 'var(--blue)' }}>
                  <div className="issue-title">{ec.case}</div>
                  <div className="issue-reason">{ec.behavior || ''}</div>
                </div>
              ))
            )
          )}

          {tab === 'notes' && (
            notes.length === 0 ? (
              <div className="empty">No notes.</div>
            ) : (
              notes.map((n, idx) => <div key={idx} className="note">{n}</div>)
            )
          )}
        </div>
      </div>
    </aside>
  );
}
