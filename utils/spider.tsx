// utils/spider.tsx — SVG spider chart JSX component
// TypeScript/JSX (Phase 19, Plan 03) — refactored from string-returning to JSX.Element return
// Previously: utils/spider.ts (Phase 11, Plan 04)

import React from 'react';

/**
 * Sanitize a CSS custom property name to prevent SVG/HTML injection.
 * CSS custom property names may only contain: letters, digits, -, _
 * Strips everything else before embedding in SVG attribute values.
 */
function sanitizeCssVar(v: string): string {
  return v.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Zet een score-string om naar een radius waarde (0.0 – 1.0).
 */
function scoreToRadius(score: string | null): number {
  if (score === null || score === undefined) return 0;
  switch (score) {
    case 'onvoldoende': return 0.25;
    case 'voldoende':   return 0.5;
    case 'goed':        return 0.75;
    case 'excellent':   return 1.0;
    default:            return 0;
  }
}

// x, y: ruwe SVG-viewport-coördinaten (0–200); aanroeper converteert naar px via actuele kaartbreedte
export type HoverState = { axisIndex: number; x: number; y: number } | null;

/**
 * SpiderChart — renders an SVG spider chart as JSX.Element from axis definitions and scores.
 *
 * Gebruik: SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar, onHover?)
 */
export const SpiderChart = {
  /**
   * Genereer een <svg> JSX element voor een spider chart.
   *
   * @param axes     - Array van { key: string; label: string } as-definities.
   *   De `key` waarde moet overeenkomen met de sleutels in `scores`.
   *   Conventie: gebruik `dg.label` (bijv. 'V&A', 'M&M') als key — dit is
   *   het formaat dat parseSinglePDF gebruikt voor deelgebiedScores.
   *   SpiderChartCard.tsx geeft axes door met key: dg.label (D-14-10).
   * @param scores   - Record<string, string | null> met score per deelgebied (gekeyed op dg.label)
   * @param fillVar  - CSS variabele naam voor opvulkleur (bijv. '--spider-lesgeven')
   * @param strokeVar - CSS variabele naam voor lijnkleur (bijv. '--spider-lesgeven-stroke')
   * @param onHover  - Optional callback called with HoverState on hit-circle mouse enter/leave.
   *   Receives { axisIndex, x, y } on enter (coords in SVG viewBox space, 0–200), null on leave.
   *   JSX rendering (Phase 19) eliminates the previous dangerouslySetInnerHTML injection surface.
   * @returns JSX.Element — a fully rendered <svg> element
   */
  buildSpiderSVG(
    axes: Array<{ key: string; label: string }>,
    scores: Record<string, string | null>,
    fillVar: string,
    strokeVar: string,
    onHover?: (state: HoverState) => void
  ): JSX.Element {
    const n = axes.length;

    if (n === 0) {
      return <svg width="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" />;
    }

    const centerX = 100;
    const centerY = 100;
    const maxRadius = 80;

    // Grid ring radii (25%, 50%, 75%, 100% of maxRadius)
    const gridLevels = [0.25, 0.5, 0.75, 1.0];

    // Grid polygon rings
    const gridRings = gridLevels.map((level, li) => {
      const r = level * maxRadius;
      const ringPoints = Array.from({ length: n }, (_, i) => {
        const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
        return `${(centerX + Math.cos(angle) * r).toFixed(4)},${(centerY + Math.sin(angle) * r).toFixed(4)}`;
      }).join(' ');
      return (
        <polygon key={`ring-${li}`} points={ringPoints}
          fill="none" stroke="#d1d5db" strokeWidth="0.75" opacity="0.7" />
      );
    });

    // Axis spoke lines from center to outer ring
    const gridLines = Array.from({ length: n }, (_, i) => {
      const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
      const x = (centerX + Math.cos(angle) * maxRadius).toFixed(4);
      const y = (centerY + Math.sin(angle) * maxRadius).toFixed(4);
      return (
        <line key={`spoke-${i}`} x1={centerX} y1={centerY} x2={x} y2={y}
          stroke="#d1d5db" strokeWidth="0.75" opacity="0.7" />
      );
    });

    // Axis label text elements (D-10)
    const axisLabels = axes.map((axis, i) => {
      const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
      const labelX = centerX + Math.cos(angle) * (maxRadius + 12);
      const labelY = centerY + Math.sin(angle) * (maxRadius + 12);
      return (
        <text key={`label-${i}`} x={labelX} y={labelY}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fill="var(--text-secondary)">
          {axis.label}
        </text>
      );
    });

    // Data polygon points
    const points: string[] = [];
    for (let i = 0; i < n; i++) {
      const axis = axes[i];
      const score = scores[axis.key] ?? null;
      const radiusRatio = scoreToRadius(score);
      const radius = radiusRatio * maxRadius;

      // Start bovenaan (−π/2), dan met de klok mee
      const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push(`${x.toFixed(4)},${y.toFixed(4)}`);
    }

    const pointsStr = points.join(' ');
    const safeFill   = sanitizeCssVar(fillVar);
    const safeStroke = sanitizeCssVar(strokeVar);

    // Hit circles for tooltip interaction (D-11)
    // cx/cy are in SVG viewBox space (0–200). Caller converts to px via actual card width.
    const hitCircles = axes.map((axis, i) => {
      const score = scores[axis.key] ?? null;
      const radius = scoreToRadius(score) * maxRadius;
      const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
      const cx = centerX + Math.cos(angle) * radius;
      const cy = centerY + Math.sin(angle) * radius;
      return (
        <circle key={`hit-${i}`} cx={cx} cy={cy} r={6}
          className="spider-hit-circle"
          onMouseEnter={() => onHover?.({ axisIndex: i, x: cx, y: cy })}
          onMouseLeave={() => onHover?.(null)} />
      );
    });

    return (
      <svg width="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        {gridRings}
        {gridLines}
        {axisLabels}
        <polygon points={pointsStr} fill={`var(${safeFill})`}
          stroke={`var(${safeStroke})`} strokeWidth="2" fillOpacity="0.4" />
        {hitCircles}
      </svg>
    );
  },
};
