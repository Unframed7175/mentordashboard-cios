import React from 'react';
import { SpiderChart } from '../../utils/spider';
import { DEELGEBIEDEN } from '../../utils/schema';

interface SpiderChartCardProps {
  group: 'lesgeven' | 'organiseren' | 'prof_handelen';
  scores: Record<string, string | null>;
  fillVar: string;
  strokeVar: string;
  title: string;
}

export default function SpiderChartCard({ group, scores, fillVar, strokeVar, title }: SpiderChartCardProps) {
  // CRITICAL: use dg.label (not dg.id) as key to match deelgebiedScores storage format (D-14-10)
  const axes = DEELGEBIEDEN
    .filter(dg => dg.group === group)
    .map(dg => ({ key: dg.label, label: dg.label }));

  if (axes.length === 0) {
    return <div className="spider-empty">Geen scores beschikbaar</div>;
  }

  const rawSvg = SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar);

  if (!rawSvg) {
    return <div className="spider-empty">Geen scores beschikbaar</div>;
  }

  // Security: buildSpiderSVG embeds only math-computed coordinates and sanitized CSS
  // variable names (see utils/spider.ts sanitizeCssVar). Axis labels are NOT embedded
  // in the SVG string — only their numeric polygon coordinates appear. As a defence-in-depth
  // measure we strip any script tags that could appear if the utility ever changes.
  const svg = rawSvg.replace(/<script[\s\S]*?<\/script>/gi, '');

  return (
    <div className="spider-card" style={{ maxWidth: '180px' }}>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="spider-leerlijn-title" style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '8px' }}>
        {title}
      </div>
    </div>
  );
}
