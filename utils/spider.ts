// utils/spider.ts — SVG spider chart berekeningen
// TypeScript (Phase 11, Plan 04) — directe TypeScript versie, geen .js tussenversie

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

/**
 * SpiderChart — berekent SVG spider chart markup vanuit as-definities en scores.
 *
 * Gebruik: SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar)
 */
export const SpiderChart = {
  /**
   * Genereer een <svg> string voor een spider chart.
   *
   * @param axes     - Array van { key: string; label: string } as-definities.
   *   De `key` waarde moet overeenkomen met de sleutels in `scores`.
   *   Conventie: gebruik `dg.label` (bijv. 'V&A', 'M&M') als key — dit is
   *   het formaat dat parseSinglePDF gebruikt voor deelgebiedScores.
   *   SpiderChartCard.tsx geeft axes door met key: dg.label (D-14-10).
   * @param scores   - Record<string, string | null> met score per deelgebied (gekeyed op dg.label)
   * @param fillVar  - CSS variabele naam voor opvulkleur (bijv. '--spider-lesgeven')
   * @param strokeVar - CSS variabele naam voor lijnkleur (bijv. '--spider-lesgeven-stroke')
   * @returns Volledig <svg>...</svg> element als string
   */
  buildSpiderSVG(
    axes: Array<{ key: string; label: string }>,
    scores: Record<string, string | null>,
    fillVar: string,
    strokeVar: string
  ): string {
    if (axes.length === 0) {
      return '<svg width="160" height="160" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"></svg>';
    }

    const n = axes.length;
    const centerX = 100;
    const centerY = 100;
    const maxRadius = 80;

    // Grid ring radii (25%, 50%, 75%, 100% of maxRadius)
    const gridLevels = [0.25, 0.5, 0.75, 1.0];

    // Build axis spoke lines and grid polygon rings
    let gridLines = '';
    let gridRings = '';

    for (const level of gridLevels) {
      const r = level * maxRadius;
      const ringPoints: string[] = [];
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        ringPoints.push(x.toFixed(4) + ',' + y.toFixed(4));
      }
      gridRings +=
        '<polygon points="' + ringPoints.join(' ') + '" ' +
        'fill="none" stroke="#d1d5db" stroke-width="0.75" opacity="0.7"/>';
    }

    // Axis spokes from center to outer ring
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
      const x = centerX + Math.cos(angle) * maxRadius;
      const y = centerY + Math.sin(angle) * maxRadius;
      gridLines +=
        '<line x1="' + centerX + '" y1="' + centerY + '" ' +
        'x2="' + x.toFixed(4) + '" y2="' + y.toFixed(4) + '" ' +
        'stroke="#d1d5db" stroke-width="0.75" opacity="0.7"/>';
    }

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

      points.push(x.toFixed(4) + ',' + y.toFixed(4));
    }

    const pointsStr = points.join(' ');
    const safeFill   = sanitizeCssVar(fillVar);
    const safeStroke = sanitizeCssVar(strokeVar);

    return (
      '<svg width="160" height="160" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      gridRings +
      gridLines +
      '<polygon points="' + pointsStr + '" ' +
      'fill="var(' + safeFill + ')" stroke="var(' + safeStroke + ')" stroke-width="2" fill-opacity="0.4"/>' +
      '</svg>'
    );
  },
};
