# Phase 26: Tegel Score-telling & Fase-vergelijking — Pattern Map

**Mapped:** 2026-05-23
**Files analyzed:** 4 (2 modified components + 1 CSS file + 2 read-only utility files)
**Analogs found:** 4 / 4 (read-only files serve as their own analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/LeerlingTegel.tsx` | component | transform (props → render) | `src/components/LeerlingTegel.tsx` (self — extend) | exact (self-extension) |
| `src/components/KlasOverzicht.tsx` | component | transform (useMemo compute) | `src/components/KlasOverzicht.tsx` (self — extend) | exact (self-extension) |
| `src/index.css` | config/style | transform | `src/index.css` (self — extend) | exact (self-extension) |
| `utils/klassen.ts` | utility | batch | `utils/klassen.ts` (read-only) | exact (no changes) |
| `src/utils/status.ts` | utility | transform | `src/utils/status.ts` (read-only) | exact (no changes) |

---

## Pattern Assignments

### `src/components/LeerlingTegel.tsx` (component, transform)

**Analog:** `src/components/LeerlingTegel.tsx` — extend this file

**Existing imports pattern** (lines 1–8):
```tsx
import React from 'react';
import { RAG_BORDER, StatusResult } from '../utils/status';
```
New import needed: none. `StatusResult` already imported; `StatusKleur` type is exported from same module if needed but not required — use `status.kleur` direct string comparison.

**Existing props interface** (lines 10–14):
```tsx
interface LeerlingTegelProps {
  student: any;
  status: StatusResult;
  onClick: () => void;
}
```
Add one prop:
```tsx
trend?: 'op' | 'neer' | null;
```

**Existing function signature** (line 16):
```tsx
export default function LeerlingTegel({ student, status, onClick }: LeerlingTegelProps) {
```
Extend destructuring to:
```tsx
export default function LeerlingTegel({ student, status, onClick, trend }: LeerlingTegelProps) {
```

**Existing CSS custom property pattern** (lines 48–63):
```tsx
const ragVar = `var(--rag-${status.kleur}, var(--rag-grijs))`;

return (
  <div
    className="klas-tile"
    style={{ '--tile-accent': ragVar } as React.CSSProperties}
    onClick={onClick}
    onKeyDown={handleKeyDown}
    tabIndex={0}
    role="button"
  >
    <span className="klas-tile-naam">{student.naam}</span>
    <span className={`status-badge status-${status.kleur}`}>{status.label}</span>
    {miniBar}
  </div>
);
```
Insert score-telling row between badge and `{miniBar}`. The `--tile-accent` pattern shows how CSS custom props are passed inline — arrow color is handled purely via CSS classes, no inline style needed.

**Core new render pattern** (insert after line 61, before `{miniBar}`):

Per UI-SPEC.md lines 92–107 and CONTEXT.md D-01/D-02/D-03:
```tsx
{status.kleur !== 'grijs' && (() => {
  const totaalDeelgebieden =
    status.prognose.totaalVoldoendeOfHoger + status.prognose.totaalOnvoldoende;
  const v = status.prognose.totaalVoldoendeOfHoger;
  const o = status.prognose.totaalOnvoldoende;
  const ariaLabel =
    trend === 'op'
      ? `Trend omhoog: ${v} van ${totaalDeelgebieden} deelgebieden voldoende of hoger, ${o} onvoldoende`
      : trend === 'neer'
      ? `Trend omlaag: ${v} van ${totaalDeelgebieden} deelgebieden voldoende of hoger, ${o} onvoldoende`
      : `${v} van ${totaalDeelgebieden} deelgebieden voldoende of hoger, ${o} onvoldoende`;
  return (
    <div className="score-telling" aria-label={ariaLabel}>
      {trend === 'op' && (
        <span className="trend-pijl trend-op" aria-hidden="true" />
      )}
      {trend === 'neer' && (
        <span className="trend-pijl trend-neer" aria-hidden="true" />
      )}
      <span className="score-telling-tekst">
        {v}/{totaalDeelgebieden} {'≥'}V{' · '}{o} O
      </span>
    </div>
  );
})()}
```
Note: `≥` = `≥`, `·` = `·` interpunct — encode as Unicode escapes to avoid editor encoding issues.

**Existing miniBar conditional pattern** (lines 18–39) — follow the same guard pattern (`if (student.verzuim) { ... }`) for the score-telling guard (`status.kleur !== 'grijs'`). The IIFE pattern above is one option; a `let scoreTelling: React.ReactNode = null` variable assigned before the return is equally valid and matches the `miniBar` style used in the file.

---

### `src/components/KlasOverzicht.tsx` (component, transform)

**Analog:** `src/components/KlasOverzicht.tsx` — extend this file

**Existing imports** (lines 1–10):
```tsx
import React, { useState, useMemo } from 'react';
import { getActiveStudents, klassenState, deleteKlas } from '../../utils/klassen';
import { berekenStatus, STATUS_VOLGORDE } from '../utils/status';
import LeerlingTegel from './LeerlingTegel';
```
Add import of `getAllRecordsForStudent`:
```tsx
import { getActiveStudents, getAllRecordsForStudent, klassenState, deleteKlas } from '../../utils/klassen';
```
`STATUS_VOLGORDE` and `berekenStatus` already imported — no additional imports needed.

**Existing statusMap useMemo pattern** (lines 31–37) — the trendMap follows the identical shape:
```tsx
const statusMap = useMemo(() => {
  const students = getActiveStudents();
  const m = new Map<string, ReturnType<typeof berekenStatus>>();
  for (const s of students) m.set(s.leerlingId, berekenStatus(s));
  return m;
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [refreshKey, allStudents.length]);
```
New trendMap (place directly after statusMap, same dependency array):
```tsx
const trendMap = useMemo(() => {
  const students = getActiveStudents();
  const m = new Map<string, 'op' | 'neer' | null>();
  for (const s of students) {
    const records = getAllRecordsForStudent(s.leerlingId);
    if (records.length < 2) {
      m.set(s.leerlingId, null);
      continue;
    }
    const fase1Status = berekenStatus(records[0]);
    const fase2Status = berekenStatus(records[records.length - 1]);
    if (fase1Status.kleur === 'grijs' || fase2Status.kleur === 'grijs') {
      m.set(s.leerlingId, null);
      continue;
    }
    const rank1 = STATUS_VOLGORDE[fase1Status.kleur];
    const rank2 = STATUS_VOLGORDE[fase2Status.kleur];
    if (rank2 > rank1) m.set(s.leerlingId, 'op');
    else if (rank2 < rank1) m.set(s.leerlingId, 'neer');
    else m.set(s.leerlingId, null);
  }
  return m;
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [refreshKey, allStudents.length]);
```

**Existing LeerlingTegel render pattern** (lines 183–191):
```tsx
{sorted.map(s => {
  const status = statusMap.get(s.leerlingId)!;
  return (
    <LeerlingTegel
      key={s.leerlingId}
      student={s}
      status={status}
      onClick={() => onSelectStudent(s.leerlingId, sorted.map(r => r.leerlingId))}
    />
  );
})}
```
Add `trend` prop:
```tsx
{sorted.map(s => {
  const status = statusMap.get(s.leerlingId)!;
  return (
    <LeerlingTegel
      key={s.leerlingId}
      student={s}
      status={status}
      trend={trendMap.get(s.leerlingId) ?? null}
      onClick={() => onSelectStudent(s.leerlingId, sorted.map(r => r.leerlingId))}
    />
  );
})}
```

---

### `src/index.css` (style, transform)

**Analog:** `src/index.css` itself — append new classes after existing tile classes

**Existing tile class block location** (lines 433–503) — new classes slot in after `.mini-verzuim-bar` / `.mvb-*` block (after line 503).

**Existing pattern for inline annotation** (lines 466–472 — `.klas-tile-naam`):
```css
.klas-tile-naam {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text-primary);
  line-height: 1.3;
  padding-left: 0.375rem;
}
```
Score-telling must match `padding-left: 0.375rem` for visual alignment with naam. This value is inherited from the existing rule — not a new design system value.

**Existing RAG color token pattern** (lines 90–94):
```css
--rag-groen:   #22C55E;
--rag-oranje:  #F59E0B;
--rag-rood:    #EF4444;
--rag-blauw:   #3B82F6;
--rag-grijs:   #94A3B8;
```
Trend arrows consume `var(--rag-groen)` and `var(--rag-rood)` directly — no new tokens needed.

**Existing CSS custom property usage in tile** (line 454):
```css
background: var(--tile-accent, var(--rag-grijs));
```
Arrow colors follow same `var()` pattern.

**New CSS classes to append** (per UI-SPEC.md lines 117–156):
```css
/* ── Phase 26: Score-telling & Trend-pijl ────────────────────────────── */
.score-telling {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.4;
  color: var(--text-muted);
  padding-left: 0.375rem; /* matches .klas-tile-naam indentation */
}

.trend-pijl {
  display: inline-block;
  flex-shrink: 0;
  width: 0;
  height: 0;
  vertical-align: middle;
}

.trend-op {
  border-left:   4px solid transparent;
  border-right:  4px solid transparent;
  border-bottom: 5px solid var(--rag-groen); /* #22C55E */
}

.trend-neer {
  border-left:   4px solid transparent;
  border-right:  4px solid transparent;
  border-top:    5px solid var(--rag-rood);  /* #EF4444 */
}
```

**Existing `.mini-verzuim-bar` for sizing reference** (lines 492–499):
```css
.mini-verzuim-bar {
  display: flex;
  height: 5px;
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: var(--border-default);
  margin-top: 2px;
}
```
The new row has no `margin-top` — the parent `.klas-tile` `gap: 0.5rem` (line 442) handles vertical spacing automatically.

---

### `utils/klassen.ts` (utility, batch — READ-ONLY)

**No changes needed.** `getAllRecordsForStudent()` already exists and already sorts oldest-first.

**Key function signature** (lines 254–263):
```ts
export function getAllRecordsForStudent(leerlingId: string): any[] {
  if (!klassenState.activeKlasId) return [];
  var klas = klassenState.klassen[klassenState.activeKlasId];
  if (!klas) return [];
  return klas.students.filter(function(s: any) {
    return s.leerlingId === leerlingId;
  }).sort(function(a: any, b: any) {
    return (a.periode || '').localeCompare(b.periode || '');
  });
}
```
`records[0]` = fase 1 (oldest), `records[records.length - 1]` = fase 2 (newest).

---

### `src/utils/status.ts` (utility, transform — READ-ONLY)

**No changes needed.** All required exports already exist.

**STATUS_VOLGORDE** (lines 19–25):
```ts
export const STATUS_VOLGORDE: Record<string, number> = {
  rood:   0,
  oranje: 1,
  groen:  2,
  blauw:  3,
  grijs:  4,
};
```
Trend comparison: `rank2 > rank1` = up, `rank2 < rank1` = down, equal = null.

**StatusKleur type** (line 43):
```ts
export type StatusKleur = 'groen' | 'oranje' | 'rood' | 'blauw' | 'grijs';
```
Guard: `status.kleur === 'grijs'` hides score-telling row.

**StatusResult.prognose fields** (lines 45–49 + berekenPrognose output):
```ts
export interface StatusResult {
  kleur:    StatusKleur;
  label:    string;
  prognose: any;
}
```
`status.prognose.totaalVoldoendeOfHoger` and `status.prognose.totaalOnvoldoende` are the two score-telling numbers. `totaalDeelgebieden = totaalVoldoendeOfHoger + totaalOnvoldoende`.

---

## Shared Patterns

### useMemo keyed on `[refreshKey, allStudents.length]`
**Source:** `src/components/KlasOverzicht.tsx` lines 31–37
**Apply to:** `trendMap` computation — use identical dependency array as `statusMap`
```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [refreshKey, allStudents.length]);
```
Rationale: `getActiveStudents()` returns a new array reference each call; using `.length` as a stable proxy prevents infinite re-render loops.

### Conditional render guard (null-node pattern)
**Source:** `src/components/LeerlingTegel.tsx` lines 18–39 (`miniBar`)
**Apply to:** score-telling row
```tsx
let miniBar: React.ReactNode = null;
if (student.verzuim) {
  // ... compute ...
  miniBar = (<>...</>);
}
```
Use same style: declare `let scoreTelling: React.ReactNode = null` before return, assign inside `if (status.kleur !== 'grijs')` block, then render `{scoreTelling}` in JSX between badge and `{miniBar}`.

### CSS var() token reference
**Source:** `src/index.css` lines 90–94, line 454
**Apply to:** `.trend-op`, `.trend-neer` border colors — use `var(--rag-groen)` and `var(--rag-rood)` (not hardcoded hex) so dark mode and future palette changes propagate automatically.

### aria-hidden for decorative elements
**Source:** `src/components/LeerlingTegel.tsx` — `role="button"` + `tabIndex={0}` pattern (lines 56–57)
**Apply to:** Arrow `<span>` elements — `aria-hidden="true"` on the arrow, full description on the parent `<div aria-label={...}>`.

---

## No Analog Found

None — all 5 files have direct analogs in the codebase (3 are self-extensions, 2 are read-only references).

---

## Metadata

**Analog search scope:** `src/components/`, `src/utils/`, `utils/`, `src/index.css`
**Files scanned:** 5 source files read in full
**Pattern extraction date:** 2026-05-23
