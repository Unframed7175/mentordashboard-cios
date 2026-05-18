import React from 'react';
import { SpiderChart } from '../../utils/spider';
import { DEELGEBIEDEN } from '../../utils/schema';
import { getDeelgebiedenConfigSync } from '../../utils/deelgebieden';

interface SpiderChartCardProps {
  group: 'lesgeven' | 'organiseren' | 'prof_handelen';
  scores: Record<string, string | null>;
  fillVar: string;
  strokeVar: string;
  title: string;
}

export default function SpiderChartCard({ group, scores, fillVar, strokeVar, title }: SpiderChartCardProps) {
  // Active-deelgebied filter (Phase 18 SET-03): only render active deelgebieden
  // Uses sync accessor — pre-warm in main.tsx guarantees populated cache at render time.
  const dgConfig = getDeelgebiedenConfigSync();
  const activeIds = new Set(dgConfig.filter(c => c.active).map(c => c.id));
  const labelById = new Map(dgConfig.map(c => [c.id, c.label]));

  // SCORE-KEY INVARIANT (Phase 18): axis.key MUST be the schema dg.label to match deelgebiedScores storage keys
  const axes = DEELGEBIEDEN
    .filter(dg => dg.group === group)
    .filter(dg => activeIds.has(dg.id))
    .map(dg => ({
      key: dg.label,                            // CRITICAL: schema label for score lookup (Pitfall 3 / Invariant I1)
      label: labelById.get(dg.id) ?? dg.label,  // custom label for display only
    }));

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
