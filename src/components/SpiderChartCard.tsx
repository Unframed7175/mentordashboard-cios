import React, { useState } from 'react';
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

function scoreDisplay(score: string | null): string {
  switch (score) {
    case 'onvoldoende': return 'Onvoldoende';
    case 'voldoende':   return 'Voldoende';
    case 'goed':        return 'Goed';
    case 'excellent':   return 'Excellent';
    default:            return 'Geen score';
  }
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

  // Tooltip state for hit-circle hover (D-11, Phase 19 POL-02)
  const [tooltip, setTooltip] = useState<{ axisIndex: number; x: number; y: number } | null>(null);

  if (axes.length === 0) {
    return <div className="spider-empty">Geen scores beschikbaar</div>;
  }

  return (
    <div className="spider-card">
      {SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar, setTooltip)}
      {tooltip && (
        <div
          className="spider-tooltip"
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          {axes[tooltip.axisIndex].label}: {scoreDisplay(scores[axes[tooltip.axisIndex].key] ?? null)}
        </div>
      )}
      <div className="spider-leerlijn-title" style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '8px' }}>
        {title}
      </div>
    </div>
  );
}
