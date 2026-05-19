// ---------------------------------------------------------------------------
// spider.test.ts — SpiderChart.buildSpiderSVG unit tests
// Wave 0 RED scaffold (Plan 19-01): asserts JSX return type of buildSpiderSVG.
// All JSX-related tests are intentionally RED until utils/spider.ts is
// refactored to return JSX.Element in Plan 19-03.
// ---------------------------------------------------------------------------

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpiderChart } from '../utils/spider';
import { DEELGEBIEDEN } from '../utils/schema';

// Build the axes array from DEELGEBIEDEN (all 19 deelgebieden)
const axes = DEELGEBIEDEN.map((dg: any) => ({ key: dg.id, label: dg.label }));

// ── Tests ─────────────────────────────────────────────────────────────────────

test('buildSpiderSVG geeft een JSX element terug', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  expect(React.isValidElement(svg)).toBe(true);
});

test('output rendert naar svg element', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  const html = renderToStaticMarkup(svg as React.ReactElement);
  expect(html).toContain('<svg');
});

test('alle excellent scores geeft polygon terug', () => {
  const scores = Object.fromEntries(DEELGEBIEDEN.map((dg: any) => [dg.id, 'excellent']));
  const svg = SpiderChart.buildSpiderSVG(axes, scores, '--color-spider-fill', '--color-spider-stroke');
  const html = renderToStaticMarkup(svg as React.ReactElement);
  expect(html).toContain('polygon');
});

test('buildSpiderSVG gooit geen fout bij lege scores', () => {
  expect(() => {
    SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  }).not.toThrow();
});

test('axis labels worden gerenderd als text elementen', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  const html = renderToStaticMarkup(svg as React.ReactElement);
  // Each axis should produce a <text> element with the label value
  expect(html).toContain('<text');
  expect(html).toContain(axes[0].label);
});

test('hit circles worden gerenderd voor tooltip interactie', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  const html = renderToStaticMarkup(svg as React.ReactElement);
  expect(html).toContain('spider-hit-circle');
});

test('onHover callback wordt aangeroepen bij mouseenter op hit circle', () => {
  const mockOnHover = vi.fn();
  const svg = SpiderChart.buildSpiderSVG(
    axes,
    {},
    '--color-spider-fill',
    '--color-spider-stroke',
    mockOnHover
  );

  // Traverse the JSX element tree to find the first element with className === 'spider-hit-circle'
  function findHitCircle(element: React.ReactElement | null): React.ReactElement | null {
    if (!element || !React.isValidElement(element)) return null;
    const props = element.props as Record<string, unknown>;
    if (props.className === 'spider-hit-circle') return element;
    const children = React.Children.toArray(props.children ?? []);
    for (const child of children) {
      if (React.isValidElement(child)) {
        const found = findHitCircle(child as React.ReactElement);
        if (found) return found;
      }
    }
    return null;
  }

  const hitCircle = findHitCircle(svg as React.ReactElement);
  // hitCircle will be null until Plan 03 ships (string return has no JSX children)
  // Calling onMouseEnter directly locks the callback contract (D-11 tooltip data shape)
  const circleProps = (hitCircle?.props ?? {}) as Record<string, unknown>;
  const onMouseEnter = circleProps.onMouseEnter as (() => void) | undefined;
  if (onMouseEnter) {
    onMouseEnter();
    expect(mockOnHover).toHaveBeenCalledOnce();
    expect(mockOnHover).toHaveBeenCalledWith({
      axisIndex: expect.any(Number),
      x: expect.any(Number),
      y: expect.any(Number),
    });
  } else {
    // No hit circle found — expected RED state until Plan 03
    // Force the assertion to fail so this test is RED until implementation ships
    expect(hitCircle).not.toBeNull();
  }
});
