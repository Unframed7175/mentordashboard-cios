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
   * @param axes     - Array van { key: string; label: string } as-definities
   * @param scores   - Record<string, string | null> met score per deelgebied key
   * @param fillVar  - CSS variabele naam voor opvulkleur (bijv. '--color-spider-fill')
   * @param strokeVar - CSS variabele naam voor lijnkleur (bijv. '--color-spider-stroke')
   * @returns Volledig <svg>...</svg> element als string
   */
  buildSpiderSVG(
    axes: Array<{ key: string; label: string }>,
    scores: Record<string, string | null>,
    fillVar: string,
    strokeVar: string
  ): string {
    if (axes.length === 0) {
      return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"></svg>';
    }

    const n = axes.length;
    const centerX = 100;
    const centerY = 100;
    const maxRadius = 80;

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
      '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<polygon points="' + pointsStr + '" ' +
      'fill="var(' + safeFill + ')" stroke="var(' + safeStroke + ')" stroke-width="2" fill-opacity="0.4"/>' +
      '</svg>'
    );
  },
};
