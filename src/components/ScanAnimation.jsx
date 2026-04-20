import React from 'react';

/**
 * Animated scene: a magnifying glass pans across lines of "code",
 * and as it passes, a red "bug" dot appears on one of the lines.
 *
 * Pure CSS/SVG — no libraries, no JS animations, GPU-accelerated.
 */
export default function ScanAnimation() {
  return (
    <div className="scan-scene">
      <svg viewBox="0 0 300 160" xmlns="http://www.w3.org/2000/svg">
        {/* "Code" lines */}
        <g className="code-lines">
          <rect x="20" y="28"  width="180" height="6" rx="2" fill="var(--border-hi)" />
          <rect x="20" y="44"  width="130" height="6" rx="2" fill="var(--border-hi)" />
          <rect x="36" y="60"  width="210" height="6" rx="2" fill="var(--border-hi)" />
          <rect x="36" y="76"  width="160" height="6" rx="2" fill="var(--border-hi)" />
          <rect x="20" y="92"  width="100" height="6" rx="2" fill="var(--border-hi)" />
          <rect x="36" y="108" width="190" height="6" rx="2" fill="var(--border-hi)" />
          <rect x="20" y="124" width="140" height="6" rx="2" fill="var(--border-hi)" />
        </g>

        {/* Buggy line (becomes visible when lens passes over) */}
        <g className="buggy-line">
          <rect x="36" y="76" width="160" height="6" rx="2" fill="var(--red)" opacity="0.35" />
          <circle cx="205" cy="79" r="3" fill="var(--red)" />
        </g>

        {/* Magnifying glass */}
        <g className="magnifier">
          {/* Lens halo (shows the "scanned" area) */}
          <circle cx="0" cy="0" r="28" fill="var(--accent)" opacity="0.08" />
          {/* Lens */}
          <circle cx="0" cy="0" r="22" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
          {/* Highlight */}
          <circle cx="-8" cy="-8" r="4" fill="var(--accent)" opacity="0.25" />
          {/* Handle */}
          <line x1="16" y1="16" x2="30" y2="30" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      </svg>
      <div className="scan-label">scanning for bugs...</div>
    </div>
  );
}
