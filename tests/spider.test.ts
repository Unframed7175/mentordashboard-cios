// ---------------------------------------------------------------------------
// spider.test.ts — SpiderChart.buildSpiderSVG unit tests
// Wave 0 stub: imports will fail until utils/spider.ts is created in Wave 2.
// Tests run as-is once spider.ts and schema.ts exist.
// ---------------------------------------------------------------------------

import { SpiderChart } from '../utils/spider';
import { DEELGEBIEDEN } from '../utils/schema';

// Build the axes array from DEELGEBIEDEN (all 19 deelgebieden)
const axes = DEELGEBIEDEN.map((dg: any) => ({ key: dg.id, label: dg.label }));

// ── Tests ─────────────────────────────────────────────────────────────────────

test('buildSpiderSVG geeft een string terug', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  expect(typeof svg).toBe('string');
  expect(svg.length).toBeGreaterThan(0);
});

test("output bevat '<svg'", () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  expect(svg).toContain('<svg');
});

test('alle excellent scores geeft polygon terug', () => {
  const scores = Object.fromEntries(DEELGEBIEDEN.map((dg: any) => [dg.id, 'excellent']));
  const svg = SpiderChart.buildSpiderSVG(axes, scores, '--color-spider-fill', '--color-spider-stroke');
  expect(svg).toContain('polygon');
});

test('lege scores object gooit geen fout', () => {
  expect(() => {
    SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  }).not.toThrow();
});
