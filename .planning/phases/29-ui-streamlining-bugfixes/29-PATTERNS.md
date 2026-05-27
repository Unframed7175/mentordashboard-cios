# Phase 29: UI Streamlining & Bugfixes — Pattern Map

**Mapped:** 2026-05-27
**Files analyzed:** 13
**Analogs found:** 13 / 13

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/DoortstroomPrognoseSection.tsx` | component (full rewrite) | request-response (reads `status.prognose` prop) | current `DoortstroomPrognoseSection.tsx` + `BpvProgressSection.tsx` (section shell) | exact |
| `src/components/DetailWeergave.tsx` | orchestrator component | request-response | self (targeted edit) | exact |
| `src/components/KlasTabStrip.tsx` | layout component | — | self (targeted edit) | exact |
| `src/components/BpvProgressSection.tsx` | component (state fix) | async CRUD | self (targeted edit) | exact |
| `src/components/DeelgebiedenMatrix.tsx` | component (hex fix) | CRUD | self (targeted edit) | exact |
| `src/components/FeedbackActiepuntenSection.tsx` | component (hex fix) | event-driven | self (targeted edit) | exact |
| `src/components/AanvullendSection.tsx` | component (hex fix) | event-driven | self (targeted edit) | exact |
| `src/components/RekenenNederlandsSection.tsx` | component (hex fix) | event-driven | self (targeted edit) | exact |
| `src/components/VerzuimSection.tsx` | component (hex fix) | request-response | self (targeted edit) | exact |
| `src/components/SettingsPage.tsx` | page component (hex fix) | CRUD | self (targeted edit) | exact |
| `src/components/LeerlingTegel.tsx` | presentational component (CSS class) | — | self — CSS class change only | exact |
| `src/index.css` | global stylesheet | — | self (targeted sections) | exact |
| `src/App.css` | secondary stylesheet | — | self (targeted edit) | exact |

---

## Pattern Assignments

### `src/components/DoortstroomPrognoseSection.tsx` (full rewrite — component, request-response)

**Analog 1 — current implementation (what to keep/discard):**
`src/components/DoortstroomPrognoseSection.tsx`

**Props interface to preserve** (lines 1–8):
```typescript
import React, { useState } from 'react';
import { StatusResult, detectTraject } from '../utils/status';
import { getNormenSync } from '../../utils/normen';

interface DoortstroomPrognoseSectionProps {
  student: any;
  status: StatusResult;
}
```

**Key rule from existing code** (line 109 comment):
```typescript
// Use pre-computed prognose from status — do NOT call berekenPrognose again
const p = status.prognose;
const traject = detectTraject(student);
```

**Gap data access pattern** — `p.gaps` fields used in the old component:
- BJ2: `p.gaps.nodigSBL`, `p.gaps.nodigSBC_deelgebieden`, `p.gaps.nodigSBC_kern`
- BJ1: `p.gaps.nodigBJ2`, `p.gaps.nodigVersneld_lesgeven`, `p.gaps.nodigVersneld_organiseren`, `p.gaps.nodigVersneld_profHandelen`
- Both: `p.gaps.onvoldoendeRuimte`, `p.gaps.onvoldoendeRuimtePerLeerlijn`
- Summary: `p.totaalVoldoendeOfHoger`, `p.totaalOnvoldoende`, `p.isNegatief`, `p.traject`

**Threshold access** (lines 25, 34, 56, etc. — call at top of each compute function):
```typescript
const n = getNormenSync();
// n.sbl, n.sbc, n.negatiefTotaal, n.negatiefPerLeerlijn, n.bj1Positief
```

**Analog 2 — section shell pattern:**
`src/components/BpvProgressSection.tsx` (lines 32–34)
```tsx
return (
  <div className="detail-section">
    <p className="detail-section-title">Doorstroomprognose</p>
    {/* ... */}
  </div>
);
```

**Status CSS classes to use for block headers and criterion chips** (from `src/index.css` lines 155–160 + `body.dark` overrides):
```css
/* Already dark-mode safe — use these for all status coloring */
.status-groen  { background: var(--status-groen-bg);  color: var(--status-groen-text); }
.status-oranje { background: var(--status-oranje-bg); color: var(--status-oranje-text); }
.status-rood   { background: var(--status-rood-bg);   color: var(--status-rood-text); }
```

**Gap-item classes for criterion rows** (body.dark overrides exist at lines 181–184):
```css
.gap-ok     { ... }  /* groen equivalent */
.gap-warn   { ... }  /* oranje equivalent */
.gap-danger { ... }  /* rood equivalent */
.gap-info   { ... }  /* neutral / informational */
/* body.dark overrides already in index.css — safe to reuse */
```

**Detail section title pattern** (from `src/index.css` line 587):
```css
.detail-section-title {
  font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
  color: var(--text-faint); letter-spacing: 0.07em;
}
```

**Leerlijn label map to copy** (current component lines 17–21):
```typescript
const LEERLIJN_LABEL: Record<string, string> = {
  lesgeven: 'Lesgeven',
  organiseren: 'Organiseren',
  prof_handelen: 'Professioneel handelen',
};
```

**What the new component must NOT do:**
- Do not call `berekenPrognose()` — only read `status.prognose`
- Do not call `getDrempelwaarden()` (async) — use `getNormenSync()` (sync, safe in render)
- Do not use `normView` toggle state (SBL/SBC buttons removed in rewrite)

---

### `src/components/DetailWeergave.tsx` (targeted edit — orchestrator)

**Analog:** self — targeted removal of imports and JSX blocks

**Current import block to edit** (lines 1–13):
```typescript
import React from 'react';
import { getAllRecordsForStudent, klassenState } from '../../utils/klassen';
import { berekenStatus } from '../utils/status';
import DoortstroomPrognoseSection from './DoortstroomPrognoseSection';
import FeedbackActiepuntenSection from './FeedbackActiepuntenSection';
import SpiderChartCard from './SpiderChartCard';
import DeelgebiedenMatrix from './DeelgebiedenMatrix';
import VerzuimSection from './VerzuimSection';
import BpvProgressSection from './BpvProgressSection';
import VakkenSection from './VakkenSection';           // REMOVE
import NotitiesTextarea from './NotitiesTextarea';     // REMOVE
import RekenenNederlandsSection from './RekenenNederlandsSection';
import LeerlijnenSection from './LeerlijnenSection';   // REMOVE
```

**JSX blocks to remove** (lines 135–136, 175–179):
```tsx
{/* REMOVE — Section 5: LeerlijnenSection */}
<LeerlijnenSection prognose={status.prognose} />

{/* REMOVE — Section 9: VakkenSection */}
<VakkenSection student={student} />

{/* REMOVE — Section 10: NotitiesTextarea */}
<NotitiesTextarea student={student} leerlingId={leerlingId} />
```

**Spider section to make full-width** (lines 139–164) — remove any fixed width on the `.spider-charts-row` div; the inline `style` already uses `display: flex; flexWrap: wrap` which is correct:
```tsx
{/* Current — make full-width by removing width constraint if any */}
<div className="spider-charts-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start' }}>
```

**View fade-in — outer div** (line 62):
```tsx
{/* Add view-fade-in className here */}
<div className="print-target view-fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
```

**Hardcoded hex to fix** (line 66):
```tsx
{/* Before */}
<p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#475569' }}>
{/* After */}
<p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
```

---

### `src/components/KlasTabStrip.tsx` (targeted edit — layout)

**Analog:** self — add one DOM child inside `<nav id="main-nav">`

**Current nav return** (lines 59–158) — `<nav id="main-nav">` ends at line 157 with `</nav>`. Add the stripe div as the last child before the closing tag:
```tsx
return (
  <nav id="main-nav">
    {/* ... existing children ... */}
    <div aria-hidden="true" className="nav-stripe" />  {/* ADD — FIX-01 */}
  </nav>
);
```

**z-index context** — `#main-nav` has `position: relative` (index.css line 270). `.nav-tab` elements have `z-index: 1` (index.css line 301). The `.nav-stripe` div must have `z-index: 0` and `pointer-events: none` to stay below tabs.

---

### `src/components/BpvProgressSection.tsx` (targeted edit — state fix)

**Analog:** self — add loading state, update empty state text, fix hex colors

**Current state declarations** (lines 20–21) — add `loading`:
```typescript
const [bpvConfig, setBpvConfig] = useState<BpvConfig | null>(null);
const [record, setRecord] = useState<BpvStudentRecord | null>(null);
const [loading, setLoading] = useState<boolean>(true);  // ADD — initialize true
```

**Current useEffect** (lines 23–30) — add `setLoading(false)` in both `.then` and `.catch`:
```typescript
useEffect(() => {
  Promise.all([getBpvConfig(), getBpvData()])
    .then(([cfg, data]) => {
      setBpvConfig(cfg);
      setRecord(data[leerlingId] ?? null);
      setLoading(false);  // ADD
    })
    .catch(err => {
      console.warn('[BpvProgressSection] load failed:', err);
      setLoading(false);  // ADD
    });
}, [leerlingId]);
```

**Current JSX conditional** (lines 36–40) — split into three states:
```tsx
{/* Before — lines 36-40 */}
{bpvConfig === null || record === null ? (
  <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
    Nog geen stage-data — importeer de stage Excel via het importscherm.
  </p>
) : ( /* populated */ )}

{/* After */}
if (loading) {
  return (
    <div className="detail-section">
      <p className="detail-section-title">BPV-uren</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>BPV-data laden…</p>
    </div>
  );
}
if (bpvConfig === null || record === null) {
  return (
    <div className="detail-section">
      <p className="detail-section-title">BPV-uren</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Geen stage-data — importeer de BPV Excel via het importscherm.
      </p>
    </div>
  );
}
// ... existing populated state JSX ...
```

**Hardcoded hex fixes** (lines 61, 126, 129):
```typescript
// Line 61: background: overshoot ? '#22C55E' → 'var(--rag-groen)'
// Line 126: color: p.goedgekeurdeUren > 0 ? '#22C55E' → 'var(--rag-groen)'
// Line 129: color: inBehandeling > 0 ? '#F59E0B' → 'var(--rag-oranje)'
```

---

### `src/components/DeelgebiedenMatrix.tsx` (targeted edit — hex fix)

**Analog:** self — three inline color replacements

**Lines 46–48** (GrowthBadge component):
```tsx
// Before
if (r2 > r1) return <span ... style={{ color: '#16a34a' }}>↑</span>;
if (r2 < r1) return <span ... style={{ color: '#dc2626' }}>↓</span>;
return <span ... style={{ color: '#9ca3af' }}>=</span>;

// After
if (r2 > r1) return <span ... style={{ color: 'var(--status-groen-text)' }}>↑</span>;
if (r2 < r1) return <span ... style={{ color: 'var(--status-rood-text)' }}>↓</span>;
return <span ... style={{ color: 'var(--text-muted)' }}>=</span>;
```

**Line 97** (empty state):
```tsx
// Before
<td ... style={{ color: '#9ca3af', ... }}>
// After
<td ... style={{ color: 'var(--text-muted)', ... }}>
```

---

### `src/components/FeedbackActiepuntenSection.tsx` (targeted edit — hex fix)

**Analog:** self — two inline color replacements

**Line 177** (empty state text):
```tsx
// Before: color: '#9ca3af'
// After:  color: 'var(--text-muted)'
```

**Line 190** (save error):
```tsx
// Before: color: '#dc2626'
// After:  color: 'var(--status-rood-text)'
```

---

### `src/components/AanvullendSection.tsx` (targeted edit — hex fix)

**Analog:** self — one inline style replacement

**Line 68** (saved hint color — currently uses inline style overriding the CSS class):
```tsx
// Before
<p className="aanvullend-hint" style={{ color: hint === 'saved' ? '#10b981' : undefined }}>
// After
<p className="aanvullend-hint" style={{ color: hint === 'saved' ? 'var(--status-groen-text)' : undefined }}>
```

**CSS class context** (index.css line 699):
```css
.aanvullend-hint.saved { color: var(--status-groen-text); }
```
Note: The component currently applies the color via inline style instead of the `.saved` class. The fix aligns the inline style with the CSS variable. Alternatively, apply `.saved` class via `className={hint === 'saved' ? 'aanvullend-hint saved' : 'aanvullend-hint'}` which already exists in CSS — either approach is acceptable.

---

### `src/components/RekenenNederlandsSection.tsx` (targeted edit — hex fix)

**Analog:** self — hex replacement at lines 36 and 83

**Lines 36, 83** (saved badge color):
```tsx
// Before: '#10b981'
// After:  'var(--status-groen-text)'
```

**Pattern** (line 36 context):
```tsx
const kleur = status === 'onvoldoende' ? 'var(--status-rood-text)' : '#10b981';
// Fix: replace '#10b981' with 'var(--status-groen-text)'
```

---

### `src/components/VerzuimSection.tsx` (targeted edit — hex fix)

**Analog:** self — multiple inline color replacements

**Empty state** (line 25):
```tsx
// Before: color: '#9ca3af'
// After:  color: 'var(--text-muted)'
```

**Verzuim bar segment backgrounds** (lines 58, 72, 86):
```tsx
// Before: '#22c55e', '#f97316', '#ef4444'
// After:  'var(--rag-groen)', 'var(--rag-oranje)', 'var(--rag-rood)'
```

**Legend dots** (lines 108, 119, 130):
```tsx
// Before: '#22c55e', '#f97316', '#ef4444'
// After:  'var(--rag-groen)', 'var(--rag-oranje)', 'var(--rag-rood)'
```

**High absentee warning** (line 135):
```tsx
// Before: color: '#991b1b'
// After:  color: 'var(--status-rood-text)'
```

---

### `src/components/SettingsPage.tsx` (targeted edit — hex fix)

**Analog:** self — two occurrences at lines 422 and 430

```tsx
// Before: color: '#EF4444'
// After:  color: 'var(--status-rood-text)'
```

---

### `src/components/LeerlingTegel.tsx` (CSS class update — no TSX change)

**Analog:** `src/index.css` section 8, `.klas-tile` class (lines 467–498)

The component uses `className="klas-tile"` (line 95). All padding/gap changes are made in `index.css`, not in this TSX file. The component file itself requires no changes.

**Current CSS baseline** (index.css lines 467–480):
```css
.klas-tile {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 1rem 1.125rem;       /* increase to ~1.25rem 1.5rem */
  cursor: pointer;
  transition: box-shadow var(--transition-base), transform var(--transition-base), border-color var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;                  /* increase to ~0.625rem */
  /* ... */
}
```

---

### `src/index.css` (CSS — multiple targeted sections)

**Section 1 — Remove `#main-nav::after` block** (lines 275–285):
```css
/* DELETE THIS ENTIRE BLOCK */
#main-nav::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 140px;
  height: 52px;
  background: linear-gradient(to bottom-left, #009FE3 0%, #009FE3 25%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
```

**Section 2 — Add `.nav-stripe` class** (after removing the `::after` block, in section 4):
```css
.nav-stripe {
  position: absolute;
  top: 0;
  right: 0;
  width: 140px;
  height: 52px;
  background: linear-gradient(to bottom-left, #009FE3 0%, #009FE3 25%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
```

**Section 3 — Update `.klas-tile` padding/gap** (lines 471, 476):
```css
.klas-tile {
  padding: 1.25rem 1.5rem;  /* was: 1rem 1.125rem */
  gap: 0.625rem;            /* was: 0.5rem */
}
```

**Section 4 — Add view fade-in** (after existing `.view-slide-in-right` block, around line 1341):
```css
/* Analog: existing .view-slide-in-right at line 1336 — same pattern */
.view-fade-in {
  animation: viewFadeIn var(--transition-base) ease forwards;
}

@keyframes viewFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Section 5 — `.spider-charts-row` full-width** — search for any fixed `width` or `max-width` on `.spider-charts-row` and remove it. The `display: flex; flex-wrap: wrap` on the inline style in DetailWeergave (line 141) is already correct. If a CSS class exists that constrains width, remove the constraint.

**Transition token reference** (already in `:root`, line 74):
```css
--transition-base: 200ms ease;   /* use this for all new transitions */
--transition-fast: 150ms ease;
```

**Dark mode variable reference** (body.dark block, lines 131–174) — never add new hardcoded hex values. Always reference:
- Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`, `var(--text-faint)`
- Status: `var(--status-groen-text)`, `var(--status-oranje-text)`, `var(--status-rood-text)`
- RAG bars: `var(--rag-groen)`, `var(--rag-oranje)`, `var(--rag-rood)`

---

### `src/App.css` (secondary styles — minimal changes)

**Analog:** `src/index.css` patterns — same CSS variable system applies. Any changes here follow the same dark mode variable rules documented above. No specific patterns extracted; changes expected to be minimal.

---

## Shared Patterns

### Dark Mode Color Replacement (UI-03)
**Source:** `src/index.css` `:root` and `body.dark` blocks (lines 1–185)
**Apply to:** `BpvProgressSection`, `DeelgebiedenMatrix`, `FeedbackActiepuntenSection`, `AanvullendSection`, `RekenenNederlandsSection`, `VerzuimSection`, `SettingsPage`, `DetailWeergave`

**Rule:** Every inline `style={{ color: '#...' }}` or `style={{ background: '#...' }}` in a component file must be replaced with the corresponding CSS variable. See per-file sections above for exact mappings.

**Test:** Grep `src/components/` for `#[0-9a-fA-F]` after changes — should return zero results in the files listed above.

### Section Shell Pattern
**Source:** `src/components/BpvProgressSection.tsx` lines 32–34
**Apply to:** `DoortstroomPrognoseSection` rewrite

```tsx
<div className="detail-section">
  <p className="detail-section-title">{title}</p>
  {/* section content */}
</div>
```

### CSS Transition Pattern
**Source:** `src/index.css` line 298 (nav-tab), line 473 (klas-tile), line 1336 (view-slide-in-right)
**Apply to:** New `.view-fade-in` keyframe animation in `src/index.css`

```css
/* Always use the existing transition token, never hardcode ms values */
transition: all var(--transition-base);
animation: myAnimation var(--transition-base) ease forwards;
```

### Async Data + Loading State Pattern
**Source:** `src/components/BpvProgressSection.tsx` (with FIX-02 changes applied)
**Apply to:** Any future async sections — not needed elsewhere in phase 29

```typescript
const [data, setData] = useState<T | null>(null);
const [loading, setLoading] = useState<boolean>(true);  // starts true
useEffect(() => {
  fetchData()
    .then(result => { setData(result); setLoading(false); })
    .catch(err => { console.warn(err); setLoading(false); });
}, [dependency]);
```

---

## No Analog Found

All files in Phase 29 have direct analogs in the codebase. No file requires patterns from RESEARCH.md code examples as a primary source; RESEARCH.md examples serve as validation only.

---

## Metadata

**Analog search scope:** `src/components/`, `src/index.css`, `src/App.css`
**Files scanned:** 13 source files read directly
**Pattern extraction date:** 2026-05-27
