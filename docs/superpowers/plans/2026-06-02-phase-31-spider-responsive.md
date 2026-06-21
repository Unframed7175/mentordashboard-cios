# Phase 31: UI Polish — Spider Chart Responsive

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak de drie spider-chart kaarten responsief (min 280px, groeit mee met de container) en herstel de tooltip-schaalfactor zodat deze klopt bij elke kaartbreedte.

**Architecture:** Twee wijzigingen: (1) CSS vervangt de vaste `width: 380px` van `.spider-card` door `min-width: 280px; flex: 1 1 280px` zodat de kaarten de beschikbare ruimte benutten; (2) `SpiderChartCard` krijgt een `useRef` zodat bij hover de werkelijke `clientWidth` wordt gebruikt om SVG-coördinaten (0–200) om te zetten naar pixels — de hardcoded factor `380/200` verdwijnt.

**Tech Stack:** React 19, TypeScript, CSS custom properties, Vitest

---

## Vooraf: controleer wat al klaar is

SC-1 (nav 104px + logo 72px) en SC-3 (FeedbackActiepunten als laatste sectie) zijn al geïmplementeerd in eerdere commits. Geen code nodig — alleen verifiëren.

- [ ] **Verificatie SC-1 — nav en logo**

```bash
grep "min-height: 104" src/index.css
grep "height: '72px'" src/components/KlasTabStrip.tsx
```

Verwacht: beide regels aanwezig.

- [ ] **Verificatie SC-3 — FeedbackActiepunten als laatste**

```bash
grep -n "FeedbackActiepunten\|KeuzedeelSection\|BpvProgress\|VerzuimSection" src/components/DetailWeergave.tsx
```

Verwacht: `FeedbackActiepuntenSection` staat op de hoogste regelnummer → is als laatste sectie gemonteerd.

---

## Task 1: CSS — spider-card responsief maken

**Files:**
- Modify: `src/index.css` (Section 26, ~regel 1398)

- [ ] **Stap 1: Lokaliseer de vaste breedteregel**

```bash
grep -n "spider-card.*380\|380.*spider-card" src/index.css
```

Verwacht: één match, zoiets als:
```
1398:.spider-card { width: 380px; position: relative; }
```

- [ ] **Stap 2: Vervang vaste breedte door flex-gebaseerde responsieve maat**

In `src/index.css`, verander:
```css
.spider-card { width: 380px; position: relative; }
```
naar:
```css
.spider-card { min-width: 280px; flex: 1 1 280px; max-width: 380px; position: relative; }
```

`flex: 1 1 280px` laat de kaart groeien tot `max-width: 380px` en krimpen tot `min-width: 280px`. De SVG binnen de kaart heeft al `width: 100%` (Section 19 CSS) en schaalt automatisch mee.

- [ ] **Stap 3: Draai de tests**

```bash
npm test
```

Verwacht: alle tests groen. CSS-wijzigingen raken geen unit tests.

- [ ] **Stap 4: Commit**

```bash
git add src/index.css
git commit -m "design(31): spider-card responsief — min-width 280px, flex-grow tot 380px"
```

---

## Task 2: Fix tooltip-schaalfactor via useRef

De tooltip-positie wordt nu berekend als `cx * (380 / 200)` — hardcoded op 380px kaartbreedte. Als de kaart smaller rendert, verschijnt de tooltip rechts van het datapunt. De fix: geef ruwe SVG-coördinaten (0–200) door via `HoverState` en bereken de pixelschaal in `SpiderChartCard` op basis van de werkelijke `clientWidth`.

**Files:**
- Modify: `utils/spider.tsx` (regel ~35 type comment, regel ~148 onMouseEnter)
- Modify: `src/components/SpiderChartCard.tsx` (volledig herschreven component)

- [ ] **Stap 1: Update HoverState-type commentaar in spider.tsx**

In `utils/spider.tsx`, verander regel ~35:
```tsx
// Oud:
export type HoverState = { axisIndex: number; x: number; y: number } | null;
```
naar:
```tsx
// x, y: ruwe SVG-viewport-coördinaten (0–200); de aanroeper converteert naar px via actuele kaartbreedte
export type HoverState = { axisIndex: number; x: number; y: number } | null;
```

- [ ] **Stap 2: Verander de hit-circle onMouseEnter om SVG-coördinaten door te geven**

In `utils/spider.tsx`, verander de `hitCircles` map (regel ~148):

**Oud:**
```tsx
onMouseEnter={() => onHover?.({ axisIndex: i, x: cx * (380 / 200), y: cy * (380 / 200) })}
```

**Nieuw:**
```tsx
onMouseEnter={() => onHover?.({ axisIndex: i, x: cx, y: cy })}
```

`cx` en `cy` zijn al in scope als ruwe SVG-coördinaten (0–200). De pixelconversie verhuist naar het component.

- [ ] **Stap 3: Herschrijf SpiderChartCard met useRef en schaalberekening**

Vervang de volledige inhoud van `src/components/SpiderChartCard.tsx` door:

```tsx
import React, { useState, useRef } from 'react';
import { SpiderChart } from '../../utils/spider';
import type { HoverState } from '../../utils/spider';
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

  const [tooltip, setTooltip] = useState<{ axisIndex: number; x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  function handleHover(state: HoverState) {
    if (state === null) { setTooltip(null); return; }
    // Convert SVG-viewport coords (0–200) to pixel offset within the card
    const w = cardRef.current?.clientWidth ?? 380;
    const scale = w / 200;
    setTooltip({ axisIndex: state.axisIndex, x: state.x * scale, y: state.y * scale });
  }

  if (axes.length === 0) {
    return <div className="spider-empty">Geen scores beschikbaar</div>;
  }

  return (
    <div className="spider-card" ref={cardRef}>
      {SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar, handleHover)}
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
```

- [ ] **Stap 4: Controleer op hardcoded hex-kleuren (SC-4)**

```bash
grep -n "#[0-9a-fA-F]" src/components/SpiderChartCard.tsx
```

Verwacht: geen output — alle kleuren gebruiken CSS-variabelen.

```bash
grep -n "#[0-9a-fA-F]" utils/spider.tsx
```

Verwacht: alleen de bestaande `#d1d5db` voor de gridrings (Phase 19, ongewijzigd). Geen nieuwe hex-kleuren toegevoegd.

- [ ] **Stap 5: Draai TypeScript type-check**

```bash
npx tsc --noEmit
```

Verwacht: geen fouten.

- [ ] **Stap 6: Draai de volledige test suite**

```bash
npm test
```

Verwacht: alle tests groen. De bestaande `onHover callback wordt aangeroepen bij mouseenter` test controleert `x: expect.any(Number), y: expect.any(Number)` — SVG-coördinaten zijn nog steeds getallen, test slaagt.

- [ ] **Stap 7: Commit**

```bash
git add utils/spider.tsx src/components/SpiderChartCard.tsx
git commit -m "fix(31): spider tooltip-schaalfactor via useRef — klopt bij elke kaartbreedte"
```

---

## Task 3: ROADMAP bijwerken en afronden

- [ ] **Stap 1: Markeer Phase 31 als afgerond in ROADMAP**

In `.planning/ROADMAP.md`, verander in de progress-tabel:
```markdown
| 31. UI Polish — Nav & Spider | 0/TBD | Not started | - |
```
naar:
```markdown
| 31. UI Polish — Nav & Spider | 1/1 | Complete | 2026-06-02 |
```

Markeer ook Phase 31 in de fase-lijst (zoek `- [ ] **Phase 31**`):
```markdown
- [ ] **Phase 31: UI Polish — Nav & Spider**
```
naar:
```markdown
- [x] **Phase 31: UI Polish — Nav & Spider** *(completed 2026-06-02)*
```

- [ ] **Stap 2: Eindtest**

```bash
npm test
```

Verwacht: alle tests groen.

- [ ] **Stap 3: Eindcommit**

```bash
git add .planning/ROADMAP.md
git commit -m "docs: Phase 31 afgerond — spider responsief + tooltip fix"
```

---

## Zelfcontrole — spec-afdekking

| Success Criterion | Afgedekt door |
|---|---|
| SC-1: nav 104px, logo 72px | Verificatie vooraf (al klaar) |
| SC-2: spider ≥280px, responsief via viewBox + width=100% | Task 1 (CSS) + Task 2 (useRef tooltip) |
| SC-3: FeedbackActiepunten als laatste | Verificatie vooraf (al klaar) |
| SC-4: nul nieuwe hardcoded hex in gewijzigde JSX | Task 2 stap 4 (grep-check) |
