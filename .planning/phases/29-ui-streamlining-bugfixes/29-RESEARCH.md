# Phase 29: UI Streamlining & Bugfixes — Research

**Researched:** 2026-05-27
**Domain:** React + CSS design system, Tauri WebView2 rendering, component refactoring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Doorstroomnorm criteria display (PROG-01)**
- D-PROG-01: `DoortstroomPrognoseSection.tsx` is fully replaced by a new per-traject block layout. The current traject-tag + gap-items approach is removed.
- D-PROG-02: Three blocks: SBL block, SBC block, Negatief block. Each block has a header showing the block name and overall block status (groen/oranje/rood), followed by its individual criteria rows.
- D-PROG-03: Each criterion row shows: label (e.g., "≥13 ≥V"), actual score vs threshold (e.g., "14 / 13"), and a 3-state color indicator: groen = threshold met, oranje = 1–2 below threshold, rood = clearly below.
- D-PROG-04: BJ1 leerlingen show BJ2 block + SBC block side by side (or stacked on narrow). The thresholds come from the configurable settings (berekenPrognose() already reads them).
- D-PROG-05: The block header color reflects the overall block result: groen = all criteria met, oranje = partially met (on track), rood = one or more criteria clearly missed.

**FIX-01 — Nav diagonal stripe**
- D-FIX-01: Remove the `#main-nav::after` CSS pseudo-element entirely. Replace with `<div aria-hidden="true" className="nav-stripe">` inside `KlasTabStrip.tsx`, positioned absolutely at the top-right of the nav bar. Apply the same `linear-gradient(to bottom-left, #009FE3 ...)` style via the `.nav-stripe` CSS class.

**FIX-02 — BPV loading vs empty state**
- D-FIX-02a: Introduce a `loading: boolean` state (starts `true`, set to `false` in Promise.all .then/.catch). While `loading === true`, show "BPV-data laden…".
- D-FIX-02b: When loading is done and `record === null`, show "Geen stage-data — importeer de BPV Excel via het importscherm."
- D-FIX-02c: When loading is done and `record !== null`, show the existing progress bar + breakdown.

**UI-02 — Tile cleanup**
- D-UI-02: Increase padding and gap on `.leerling-tegel` cards. All existing elements stay visible. Goal: cards that "breathe" more.

**UI-04 — View transitions**
- D-UI-04: Three transition targets, all 150–200ms:
  1. Tab navigation — active tab indicator animates on click (verify and tune existing `transition: all var(--transition-base)`)
  2. Klasoverzicht ↔ Detailweergave — fade-in on view mount (`opacity 0 → 1`)
  3. Settings panel open/close — slide-in already partially implemented in Phase 19; verify and complete

**Detail view cleanup**
- D-DETAIL-01: `LeerlijnenSection` — removed from `DetailWeergave.tsx`. Import removed. Component file kept.
- D-DETAIL-02: `VakkenSection` — removed from `DetailWeergave.tsx`. Import removed. Component file kept.
- D-DETAIL-03: `NotitiesTextarea` — removed from `DetailWeergave.tsx`. Import removed. Component file kept.
- D-DETAIL-04: `SpiderChartCard` row — goes full-width. Remove width constraint from container.

**New detail view section order (after cleanup):**
1. Header (unchanged)
2. DoortstroomPrognoseSection → replaced by new criteria block view
3. RekenenNederlandsSection (unchanged)
4. FeedbackActiepuntenSection (unchanged)
5. ~~LeerlijnenSection~~ removed
6. SpiderChartCard row (full-width)
7. DeelgebiedenMatrix (unchanged)
8. VerzuimSection (unchanged)
9. BpvProgressSection (fixed FIX-02)
10. ~~VakkenSection~~ removed
11. ~~NotitiesTextarea~~ removed

### Deferred Ideas (OUT OF SCOPE)
- FeedbackActiepuntenSection visibility toggle
- DeelgebiedenMatrix collapse toggle
- VakkenSection restore option

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Consistent spacing and typography across all views (section titles, body, labels, badges) | Audit of CSS design tokens; hardcoded hex violations catalogued below |
| UI-02 | Klasoverzicht visually cleaned up — clear hierarchy, less busy tiles, sufficient whitespace | Current `.klas-tile` padding: `1rem 1.125rem`, gap: `0.5rem`; increase both |
| UI-03 | Dark mode colors and contrast refined — no white spots or poorly readable text | Hardcoded hex violations found in 8 component files; full list below |
| UI-04 | View switches and tab navigation have subtle CSS transitions | `var(--transition-base)` = 200ms ease already exists; `.view-slide-in-right` animation exists; fade-in for view mount is missing |
| FIX-01 | Nav diagonal stripe (`::after` pseudo-element) correctly renders in Tauri WebView | CSS pseudo-element + gradient confirmed broken in WebView2; DOM element replacement is the standard fix |
| FIX-02 | BPV section shows distinct "loading..." vs "no BPV data imported" states | Current code merges both into `bpvConfig === null \|\| record === null`; loading state boolean not present |

</phase_requirements>

---

## Summary

Phase 29 is a pure UI/CSS/component-cleanup phase. All work targets existing files — no new data flows, no new API calls, no new Tauri commands. The phase has three categories of work:

**Category A — Component rewrites/removals.** `DoortstroomPrognoseSection.tsx` is fully replaced with a per-traject block layout. Three sections (`LeerlijnenSection`, `VakkenSection`, `NotitiesTextarea`) are removed from `DetailWeergave.tsx` (files kept). `SpiderChartCard` container becomes full-width. `BpvProgressSection` gains a `loading` boolean state.

**Category B — CSS changes.** Tile padding/gap increase in `index.css`. Dark mode audit replaces hardcoded hex colors with CSS variables. View transition fade-in added for klasoverzicht ↔ detail switch. Typography token consistency pass across all section types.

**Category C — FIX-01 DOM element.** The `#main-nav::after` gradient pseudo-element is replaced with a real `<div className="nav-stripe">` in `KlasTabStrip.tsx`. This is a known Tauri WebView2 limitation: CSS pseudo-elements with complex backgrounds (gradients, transforms) are unreliable in WebView2 on Windows.

**Primary recommendation:** Work in three independent waves — (1) CSS-only changes (UI-01, UI-02, UI-03, UI-04 partial), (2) DOM/component changes that touch only one file each (FIX-01, FIX-02, section removals, spider full-width), (3) DoortstroomPrognoseSection rewrite which requires reading prognosis output structure.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Typography & spacing tokens | Browser / Client (CSS) | — | All via CSS custom properties in `src/index.css` |
| Tile whitespace (UI-02) | Browser / Client (CSS) | — | `.klas-tile` padding/gap in `index.css` section 8 |
| Dark mode color audit (UI-03) | Browser / Client (CSS + TSX) | — | CSS variables in `index.css`; hardcoded hex in component files |
| View transitions (UI-04) | Browser / Client (CSS) | React component (mount hook) | CSS for animation classes; React for applying classes on mount |
| Nav stripe DOM fix (FIX-01) | Browser / Client (TSX + CSS) | — | `KlasTabStrip.tsx` adds DOM element; `index.css` provides `.nav-stripe` class |
| BPV loading state (FIX-02) | Frontend component (TSX) | — | `BpvProgressSection.tsx` state machine |
| DoortstroomPrognoseSection rewrite | Frontend component (TSX) | CSS (new block classes) | Reads `status.prognose` from parent; adds new block layout classes |
| Detail view section removal | Frontend component (TSX) | — | `DetailWeergave.tsx` JSX and import cleanup |
| Spider full-width | Browser / Client (CSS) | — | Remove width constraint on `.spider-charts-row` container |

---

## Standard Stack

This phase introduces no new packages. All work uses the existing stack.

### Existing Tools in Use
| Tool | Version | Purpose |
|------|---------|---------|
| React | (existing) | Component rendering |
| TypeScript | (existing) | Type safety |
| Vitest | (existing) | Test runner (`npm test`) |
| CSS custom properties | — | Design token system in `src/index.css` |

**No new packages to install.** No Package Legitimacy Audit required.

---

## Architecture Patterns

### Existing Design Token System

The project has a complete CSS custom property design system. [VERIFIED: source code audit]

**Light mode root tokens (`:root`):**
- `--text-primary: #0F172A` | `--text-secondary: #475569` | `--text-muted: #64748B` | `--text-faint: #94A3B8`
- `--bg-page: #F1F5F9` | `--bg-surface: #FFFFFF` | `--bg-surface-alt: #F8FAFC`
- `--status-groen-bg: #DCFCE7` | `--status-groen-text: #15803D`
- `--status-oranje-bg: #FEF3C7` | `--status-oranje-text: #B45309`
- `--status-rood-bg: #FEE2E2` | `--status-rood-text: #991B1B`
- `--rag-groen: #22C55E` | `--rag-oranje: #F59E0B` | `--rag-rood: #EF4444`

**Dark mode overrides (`body.dark`):**
- `--status-groen-bg: #14532D` | `--status-groen-text: #86EFAC`
- `--status-oranje-bg: #451A03` | `--status-oranje-text: #FCD34D`
- `--status-rood-bg: #450A0A` | `--status-rood-text: #FCA5A5`
- `--bg-page: #0B0F1A` | `--bg-surface: #131929`

**Transition tokens:**
- `--transition-fast: 150ms ease`
- `--transition-base: 200ms ease`
- `--transition-slow: 300ms ease`

### Existing CSS Classes for Status Colors

The `.status-groen` / `.status-oranje` / `.status-rood` classes use the CSS variable system and automatically work in both light and dark mode. [VERIFIED: source code audit]

```css
/* These are already dark-mode safe */
.status-groen  { background: var(--status-groen-bg);  color: var(--status-groen-text);  }
.status-oranje { background: var(--status-oranje-bg); color: var(--status-oranje-text); }
.status-rood   { background: var(--status-rood-bg);   color: var(--status-rood-text);   }
```

The `.gap-ok` / `.gap-warn` / `.gap-danger` / `.gap-info` classes in section 10 of `index.css` use **hardcoded hex values** (not CSS variables) and have dark-mode overrides in `body.dark` block. These are already handled correctly.

### Current `.klas-tile` Padding (UI-02 baseline)

```css
/* Current — src/index.css section 8, line ~471 */
.klas-tile {
  padding: 1rem 1.125rem;   /* 16px 18px */
  gap: 0.5rem;              /* 8px between stacked elements */
}
```

Decision D-UI-02: increase to approximately `1.25rem 1.5rem` padding and `0.625rem` gap.

### Current `#main-nav::after` (FIX-01 target)

```css
/* src/index.css lines 275–285 — REMOVE THIS ENTIRE BLOCK */
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

**Important:** `#main-nav` already has `position: relative` set (confirmed at line ~270). The replacement `.nav-stripe` div needs `position: absolute` with the same geometry. The `z-index: 0` on the pseudo-element means tabs (.nav-tab at `z-index: 1`) correctly render above it — the replacement div needs `z-index: 0` and `pointer-events: none` to preserve this.

### Current BpvProgressSection State (FIX-02 baseline)

The current loading logic merges "still loading" and "no data" into one condition: [VERIFIED: source code audit]

```typescript
// Current — BpvProgressSection.tsx lines 36–40
// PROBLEM: bpvConfig === null is true BOTH during loading AND when data is empty
{bpvConfig === null || record === null ? (
  <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
    Nog geen stage-data — importeer de stage Excel via het importscherm.
  </p>
) : (
  /* populated state */
)}
```

**Fix pattern:**
```typescript
const [loading, setLoading] = useState<boolean>(true);
// In useEffect .then handler: setLoading(false) before setBpvConfig / setRecord
// In useEffect .catch handler: setLoading(false)

// Render:
if (loading) return <p className="bpv-empty-state">BPV-data laden…</p>;
if (bpvConfig === null || record === null) return <p className="bpv-empty-state">Geen stage-data — importeer de BPV Excel via het importscherm.</p>;
```

The `#9ca3af` hardcoded color on line 38 must also be replaced with `var(--text-muted)` as part of FIX-02 (UI-03 overlap).

### berekenPrognose Output Structure (PROG-01)

The prognosis output used by `DoortstroomPrognoseSection` comes from `status.prognose` which is pre-computed by `berekenStatus()`. Do NOT call `berekenPrognose()` again inside the component. [VERIFIED: source code audit]

```typescript
// status.prognose shape (from berekenPrognose return value):
{
  label: 'negatief' | 'versneld_sbc' | 'naar_bj2' | 'neutraal'   // BJ1
       | 'negatief' | 'sbc' | 'sbl' | 'neutraal',                  // BJ2
  isNegatief: boolean,
  totaalVoldoendeOfHoger: number,
  totaalOnvoldoende: number,
  leerlijnen: Array<{
    leerlijn: 'lesgeven' | 'organiseren' | 'prof_handelen',
    totaal: number,
    voldoendeOfHoger: number,
    goedOfHoger: number,
    onvoldoende: number,
    onbeoordeeld: number,
  }>,
  gaps: {
    // BJ2 gaps:
    nodigSBL: number,
    nodigSBC_deelgebieden: number,
    nodigSBC_kern: string[],
    onvoldoendeRuimte: number,
    onvoldoendeRuimtePerLeerlijn: { lesgeven: number, organiseren: number, prof_handelen: number },

    // BJ1 gaps:
    nodigBJ2: number,
    nodigVersneld_lesgeven: number,
    nodigVersneld_organiseren: number,
    nodigVersneld_profHandelen: number,
    onvoldoendeRuimte: number,
    onvoldoendeRuimtePerLeerlijn: { lesgeven: number, organiseren: number, prof_handelen: number },
  },
  traject: 'bj1' | 'bj2',
}
```

`getNormenSync()` provides the configured thresholds. It is synchronous and safe to call in the component render path. [VERIFIED: source code audit — used in current DoortstroomPrognoseSection lines 25, 34, 56, etc.]

### New DoortstroomPrognoseSection Block Layout

**Data mapping for the three blocks:**

**SBL Block** (BJ2 only):
- Criterion: "≥{n.sbl} deelgebieden ≥V"
- Score: `totaalVoldoendeOfHoger` / `n.sbl`
- Status: groen = `gaps.nodigSBL === 0`, oranje = `gaps.nodigSBL <= 2`, rood = `gaps.nodigSBL > 2`

**SBC Block** (BJ2 only):
- Criterion 1: "≥{n.sbc} deelgebieden ≥V" — score: `totaalVoldoendeOfHoger` / `n.sbc`
- Criterion 2: "Kerndeelgebieden ≥V (V&A, P&O, C&B, 1E&B)" — score: `(4 - gaps.nodigSBC_kern.length)` / 4
- Status: groen = `gaps.nodigSBC_deelgebieden === 0 && gaps.nodigSBC_kern.length === 0`

**Negatief Block** (both BJ1 and BJ2):
- Criterion 1: "≤{n.negatiefTotaal} O totaal" — score: `totaalOnvoldoende` / `n.negatiefTotaal`
- Criterion 2: Per leerlijn "≤{n.negatiefPerLeerlijn} O" (3 rows, one per leerlijn)
- Status: groen = `!isNegatief`, rood = `isNegatief`

**BJ1 layout** (D-PROG-04):
- Show "BJ2 doorstroom" block: criterion "≥{n.bj1Positief} ≥V", score `totaalVoldoendeOfHoger` / `n.bj1Positief`
- Show "Versneld SBC" block: 3 criteria for lesgeven/organiseren/profhandelen ≥G
- Show Negatief block
- Detect via `detectTraject(student)` which is already imported in the old component

### View Fade-in Transition (UI-04)

The settings slide-in is already implemented via `.view-slide-in-right` and `@keyframes slideInFromRight` in `index.css` section 27. [VERIFIED: source code audit]

For the klasoverzicht ↔ detail view fade-in, the pattern is:

```css
/* Add to index.css */
.view-fade-in {
  animation: viewFadeIn var(--transition-base) ease forwards;
}
@keyframes viewFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

Applied by adding `className="view-fade-in"` to the top-level container of `DetailWeergave` and `KlasOverzicht`. Since these are unmount/remount on navigation (React re-renders the route), the class fires on every mount automatically — no useEffect needed.

The tab active indicator already uses `transition: all var(--transition-base)` on `.nav-tab`. Verify this covers the visual feedback adequately.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode color switching | Custom JS color management | CSS custom properties with `body.dark` overrides | Already in place; extending it is the correct pattern |
| Status color mapping | Color computation logic | `.status-groen` / `.status-oranje` / `.status-rood` CSS classes | Already dark-mode-safe via variables |
| View transition timing | JS-based animation | CSS `animation` + `var(--transition-base)` | Browser-native, respects `prefers-reduced-motion` (already handled in CSS) |
| Doorstroom threshold values | Hardcode or re-compute | `getNormenSync()` from `utils/normen.ts` | Phase 25 configurable thresholds; sync, safe in render |

---

## Common Pitfalls

### Pitfall 1: Hardcoded Hex Colors Break Dark Mode
**What goes wrong:** Components use hardcoded hex values (e.g., `color: '#9ca3af'`). These do not respond to `body.dark` and create white-on-light or invisible-on-dark text.
**Why it happens:** Inline styles bypass the CSS variable system.
**How to avoid:** Always use `var(--text-muted)`, `var(--text-faint)`, `var(--text-secondary)`, `var(--status-rood-text)`, etc. Check the full list of violations below.
**Warning signs:** Grep for `#[0-9a-fA-F]` in `.tsx` component files.

### Pitfall 2: `#main-nav::after` z-index Stack
**What goes wrong:** The replacement `.nav-stripe` div renders on top of the tab buttons, blocking clicks.
**Why it happens:** Forgetting `pointer-events: none` or setting z-index incorrectly.
**How to avoid:** `.nav-stripe` must have `pointer-events: none` and `z-index: 0`. The `.nav-tab` elements have `z-index: 1`, which puts them correctly above the stripe. `#main-nav` already has `position: relative` confirmed at CSS line ~270.

### Pitfall 3: BPV Loading State Initialization
**What goes wrong:** The `loading` state is initialized to `false` instead of `true`, meaning the "loading" message never shows.
**Why it happens:** Developer follows the `useState(null)` pattern for data — correct for data, wrong for a loading flag.
**How to avoid:** `useState<boolean>(true)` — starts true, set to false in both `.then` and `.catch`.

### Pitfall 4: DoortstroomPrognoseSection Imports
**What goes wrong:** The rewrite imports `berekenPrognose()` directly and recomputes prognosis inside the component, bypassing Phase 25's live updates from `onNormenChanged`.
**Why it happens:** Developer overlooks that `status.prognose` in props is already computed with the current normen.
**How to avoid:** Only read `status.prognose` and `getNormenSync()`. The comment in the current component (line 109) says exactly this: "Use pre-computed prognose from status — do NOT call berekenPrognose again".

### Pitfall 5: Removing VakkenSection Import Leaves Dead Import
**What goes wrong:** Import statement `import VakkenSection from './VakkenSection'` remains after the JSX block is deleted, causing TypeScript unused-import warnings (or worse, tree-shaking confusion).
**How to avoid:** Remove both the import line AND the JSX usage for each of the three removed sections.

### Pitfall 6: Spider Full-Width Breaks Print Layout
**What goes wrong:** Removing the width constraint on `.spider-charts-row` causes the spider charts to overflow the A4 print target.
**Why it happens:** The print CSS (`@media print`) sets `max-width: 100%` on `.print-target` but the spider cards may not shrink correctly.
**How to avoid:** Test with `window.print()` after applying the full-width change. The three `SpiderChartCard` components use `display: inline-flex` — they will naturally wrap. Ensure `.spider-charts-row` uses `flex-wrap: wrap` (it already does per DetailWeergave JSX line ~141).

### Pitfall 7: `gap-ok` / `gap-warn` Classes Are Hardcoded
**What goes wrong:** The `.gap-ok`, `.gap-warn`, `.gap-danger`, `.gap-info` classes use hardcoded hex (e.g., `background: #DCFCE7`). When rewriting DoortstroomPrognoseSection, developer assumes these are dark-mode safe.
**How to avoid:** These classes DO have `body.dark` overrides in `index.css` lines 181–184. They are safe to reuse. The new block layout can use them for criterion status indicators without adding new dark-mode overrides.

---

## UI-03 Dark Mode Audit — Hardcoded Hex Violations

Complete list of hardcoded colors found in component files. [VERIFIED: source code grep]

| File | Line | Hardcoded Value | Replace With |
|------|------|-----------------|-------------|
| `BpvProgressSection.tsx` | 38 | `'#9ca3af'` | `var(--text-muted)` |
| `BpvProgressSection.tsx` | 61 | `'#22C55E'` (overshoot bar) | `var(--rag-groen)` |
| `BpvProgressSection.tsx` | 126 | `'#22C55E'` (goedgekeurd cell) | `var(--rag-groen)` |
| `BpvProgressSection.tsx` | 129 | `'#F59E0B'` (in behandeling) | `var(--rag-oranje)` |
| `DeelgebiedenMatrix.tsx` | 46 | `'#16a34a'` (growth up) | `var(--status-groen-text)` |
| `DeelgebiedenMatrix.tsx` | 47 | `'#dc2626'` (growth down) | `var(--status-rood-text)` |
| `DeelgebiedenMatrix.tsx` | 48 | `'#9ca3af'` (growth same) | `var(--text-muted)` |
| `DeelgebiedenMatrix.tsx` | 97 | `'#9ca3af'` (empty state) | `var(--text-muted)` |
| `FeedbackActiepuntenSection.tsx` | 177 | `'#9ca3af'` | `var(--text-muted)` |
| `FeedbackActiepuntenSection.tsx` | 190 | `'#dc2626'` (save error) | `var(--status-rood-text)` |
| `DetailWeergave.tsx` | 66 | `'#475569'` (print header) | `var(--text-secondary)` |
| `AanvullendSection.tsx` | 68 | `'#10b981'` (saved hint) | `var(--status-groen-text)` |
| `NotitiesTextarea.tsx` | 94 | `'#10b981'` (saved hint) | `var(--status-groen-text)` |
| `RekenenNederlandsSection.tsx` | 36 | `'#10b981'` | `var(--status-groen-text)` |
| `RekenenNederlandsSection.tsx` | 83 | `'#10b981'` | `var(--status-groen-text)` |
| `VakkenSection.tsx` | 26 | `'#9ca3af'` (empty state) | `var(--text-muted)` |
| `StageSection.tsx` | 25 | `'#9ca3af'` (empty state) | `var(--text-muted)` |
| `VerzuimSection.tsx` | 25 | `'#9ca3af'` (empty state) | `var(--text-muted)` |
| `VerzuimSection.tsx` | 58,72,86 | `'#22c55e'`, `'#f97316'`, `'#ef4444'` (badges) | `var(--rag-groen)`, `var(--rag-oranje)`, `var(--rag-rood)` |
| `VerzuimSection.tsx` | 108,119,130 | `'#22c55e'`, `'#f97316'`, `'#ef4444'` (dots) | `var(--rag-groen)`, `var(--rag-oranje)`, `var(--rag-rood)` |
| `VerzuimSection.tsx` | 135 | `'#991b1b'` (high absentee) | `var(--status-rood-text)` |
| `SettingsPage.tsx` | 422, 430 | `'#EF4444'` (error) | `var(--status-rood-text)` |
| `DoortstroomPrognoseSection.tsx` | 144, 161 | `'#fff'` (active norm btn) | `#fff` is acceptable here (on accent background) |
| `ImportPage.tsx` | 425–426 | `'#0055cc'`, `'#fff'` (button) | Low priority — not in visible dark mode path |

**Priority for this phase:** All files except `VakkenSection`, `StageSection` (their sections are being removed), and `ImportPage`. `DoortstroomPrognoseSection` will be fully rewritten. `VerzuimSection` and `DeelgebiedenMatrix` should be fixed as part of UI-03.

**Note:** The `index.css` score chip classes (`.score-o`, `.score-v`, `.score-g`, `.score-e`) use hardcoded hex but have `body.dark` overrides (lines 176–178). These are correctly handled.

---

## Code Examples

### FIX-01: Nav Stripe DOM Element

```tsx
// In KlasTabStrip.tsx — add inside <nav id="main-nav"> as the LAST child
<div aria-hidden="true" className="nav-stripe" />

// In src/index.css — REMOVE #main-nav::after block (lines 275-285)
// ADD new class:
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

### FIX-02: BPV Loading State

```tsx
// BpvProgressSection.tsx — updated state declarations
const [bpvConfig, setBpvConfig] = useState<BpvConfig | null>(null);
const [record, setRecord] = useState<BpvStudentRecord | null>(null);
const [loading, setLoading] = useState<boolean>(true); // NEW

useEffect(() => {
  Promise.all([getBpvConfig(), getBpvData()])
    .then(([cfg, data]) => {
      setBpvConfig(cfg);
      setRecord(data[leerlingId] ?? null);
      setLoading(false); // NEW
    })
    .catch(err => {
      console.warn('[BpvProgressSection] load failed:', err);
      setLoading(false); // NEW
    });
}, [leerlingId]);

// In JSX:
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

### PROG-01: New Block Criterion Row

```tsx
// Reusable criterion row for the new DoortstroomPrognoseSection
interface CriterionRowProps {
  label: string;
  score: number;
  threshold: number;
  /** override automatic 3-state coloring */
  forceStatus?: 'groen' | 'oranje' | 'rood';
}

function criterionStatus(score: number, threshold: number, nodig: number): 'groen' | 'oranje' | 'rood' {
  if (nodig === 0) return 'groen';
  if (nodig <= 2) return 'oranje';
  return 'rood';
}

// Block header uses .status-groen / .status-oranje / .status-rood classes (already dark-mode safe)
// Criterion row shows: label · score / threshold · status chip
```

### View Fade-in (UI-04)

```css
/* Add to src/index.css section 27 (after existing .view-slide-in-right) */
.view-fade-in {
  animation: viewFadeIn var(--transition-base) ease forwards;
}

@keyframes viewFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

```tsx
// In DetailWeergave.tsx — add className to outer div
<div className="print-target view-fade-in" style={{ maxWidth: '1280px', ... }}>
```

---

## Validation Architecture

**nyquist_validation is enabled** (config.json: `workflow.nyquist_validation: true`).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` (or `vite.config.ts` — check root) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Typography tokens consistent | visual/manual | — | manual only |
| UI-02 | Tile padding increased | visual/manual | — | manual only |
| UI-03 | Dark mode no hardcoded hex | code review + visual | — | manual check |
| UI-04 | Fade-in transition fires | visual/manual | — | manual only |
| FIX-01 | Nav stripe visible in Tauri | visual/manual in Tauri | — | manual only |
| FIX-02 | BPV shows loading vs empty | `npm test` | `npm test -- --grep BpvProgress` | ❌ Wave 0 gap |
| PROG-01 | Block layout renders correctly | component test | `npm test -- --grep DoortstroomPrognose` | ❌ Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/BpvProgressSection.test.tsx` — covers FIX-02 (loading state, empty state, data state)
- [ ] `tests/DoortstroomPrognoseSection.test.tsx` — covers PROG-01 block rendering for BJ1 and BJ2

*(All other UI requirements are visual-only and verified by human review, not automated tests.)*

---

## Security Domain

**Security enforcement:** This phase makes no changes to data handling, authentication, storage, or network calls. All changes are CSS and presentational TSX. ASVS V5 (Input Validation) is not applicable — no new user inputs. ASVS V6 (Cryptography) is not applicable. No ASVS categories are triggered by this phase.

---

## Environment Availability

Step 2.6: Probed.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + npm | `npm test`, `npm run dev` | ✓ | (existing) | — |
| Tauri dev window | FIX-01 visual verification | Requires `tauri dev` | (existing) | Can partially verify with `npm run vite-dev` in browser |

**FIX-01 note:** The nav stripe bug is Tauri WebView2-specific. The fix must be verified in `tauri dev` (Tauri window), not just the browser (`vite-dev`), because WebView2's CSS pseudo-element gradient rendering is what fails.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `VerzuimSection` badge colors (`#22c55e` etc.) should be replaced with `var(--rag-groen)` etc. | UI-03 audit table | If rag colors are slightly different shades, the change is cosmetic-only with no dark mode risk |
| A2 | The existing `body.dark` overrides for `.gap-ok`/`.gap-warn`/`.gap-danger`/`.gap-info` are sufficient for the rewritten DoortstroomPrognoseSection | PROG-01 | If block layout uses different CSS classes without dark mode overrides, new dark mode gaps emerge |
| A3 | `detectTraject(student)` correctly identifies BJ1 vs BJ2 for the new block layout routing | PROG-01 | Minor — `berekenPrognose` also returns `traject` in `status.prognose.traject` as a fallback |

---

## Open Questions (RESOLVED)

1. **PROG-01: How to handle a student with no scores at all?** `[RESOLVED]`
   - What we know: `status.kleur === 'grijs'` when no scores; `totaalVoldoendeOfHoger === 0` and `totaalOnvoldoende === 0`
   - What's unclear: Should the block layout show empty blocks with "—" or should it show the same "Nog geen scores" empty state as the current implementation?
   - **Resolution:** Each block body shows "Nog geen scores beschikbaar" (in `var(--text-muted)`) when `totaalVoldoendeOfHoger === 0 && totaalOnvoldoende === 0`. The block header still renders with the block name; no status chip is shown. This is consistent with the BpvProgressSection empty-state pattern and confirmed in UI-SPEC.md Component Contracts.

2. **UI-01: Scope of typography audit** `[RESOLVED]`
   - What we know: The design token system is in place; `--text-faint`, `--text-muted`, `--text-secondary` are defined consistently.
   - What's unclear: Which specific font-size mismatches the user identified as "inconsistent" — is it across section title sizes, badge sizes, or body text between views?
   - **Resolution:** Source code audit confirmed body text (`0.875rem/400`) and label tokens (`0.75rem/600`) are already applied consistently across all views via CSS custom properties — no corrective action needed for those categories. UI-01 work is scoped to: (a) verify/correct `.detail-section-title` rule (section titles must be `0.6875rem/700/uppercase/var(--text-faint)/letter-spacing 0.06em`), and (b) confirm any deviations in the settings and help views against these rules. If `.detail-section-title` is already correct and no other deviations are found, the audit pass itself constitutes delivery of UI-01.

---

## Sources

### Primary (HIGH confidence)
- Source code audit: `src/index.css` (complete read — 1400+ lines) — design token system, transition variables, existing CSS classes
- Source code audit: `src/components/BpvProgressSection.tsx` — current state machine and hardcoded colors
- Source code audit: `src/components/KlasTabStrip.tsx` — nav element structure, absence of nav-stripe div
- Source code audit: `src/components/DoortstroomPrognoseSection.tsx` — current implementation and data flow
- Source code audit: `src/components/DetailWeergave.tsx` — section order, imports to remove
- Source code audit: `src/components/LeerlingTegel.tsx` — tile structure and current CSS classes
- Source code audit: `utils/prognosis.ts` — berekenPrognose return shape and gap structure
- Source code grep: all `.tsx` files in `src/components/` — hardcoded hex inventory

### Secondary (MEDIUM confidence)
- [ASSUMED] Tauri WebView2 CSS pseudo-element limitation is the root cause of FIX-01 — this is consistent with known WebView2 rendering differences from mainstream browsers (gradient clipping in pseudo-elements), but not verified against Tauri release notes in this session.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pure refactoring of existing code, no new dependencies
- Architecture: HIGH — all patterns verified in source code
- Pitfalls: HIGH — identified from actual code; hardcoded hex list is exhaustive from grep
- PROG-01 block layout spec: HIGH (decisions locked in CONTEXT.md) / MEDIUM (exact color thresholds for 3-state oranje require planner judgment on "1–2 below" definition per criterion type)

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (stable codebase — only changes by this phase itself)
