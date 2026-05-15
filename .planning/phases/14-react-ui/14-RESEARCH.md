# Phase 14: React UI — Research

**Researched:** 2026-05-15
**Domain:** React component architecture, TypeScript utility integration, plain-CSS styling in Tauri/Vite
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-14-01:** Updated colour palette — cyaan `#00a3da`, navy `#000000`. Bold sans-serif on structural elements unchanged.
- **D-14-02:** `App.tsx` holds `refreshKey: number` via `useState`. After successful import, `ImportPage` calls `onImportComplete()` callback prop. `KlasOverzicht` and other views read `appState.students` and `klassenState` on every render — always up-to-date because they are module-level singletons.
- **D-14-03:** No external state library (no Zustand, no React context for klassenState). Refresh-callback is sufficient for this use case.
- **D-14-04:** View routing via `useState` in `App.tsx`: `'import' | 'klas' | 'detail'`. No React Router — Tauri app has no browser-URL navigation. `activeStudentId: string | null` state in `App.tsx` for detail view.
- **D-14-05:** `KlasTabStrip` component: horizontal tab strip at top, identical to current app.js pattern. Active klas highlighted, "+" button on right to create new klas.
- **D-14-06:** New klas via React modal component: name input + schooljaar input (optional) + Annuleren/Aanmaken buttons. Identical to current modal UX.
- **D-14-07:** Delete klas via `window.confirm()` from KlasOverzicht footer — identical to current "Wis alle data" button. No rename in Phase 14.
- **D-14-08:** Table layout retained: datapunten as rows, deelgebieden as columns grouped per leerlijn. Horizontally scrollable on smaller screens.
- **D-14-09:** Modus footer: one aggregated score per deelgebied (via `aggregateDeelgebiedScores()`) + growth badge (↑/=/↓) when two periods. No vote badges — too busy.
- **D-14-10:** `SpiderChartCard` React component wraps existing `SpiderChart.buildSpiderSVG()` via `dangerouslySetInnerHTML`. No rewrite — `spider.ts` already has XSS sanitization (`sanitizeCssVar()`). Three cards per leerlijn (Lesgeven / Organiseren / Prof. handelen), identical to current layout.
- **D-14-11:** Notes moved from `localStorage` to encrypted store: `student.notitie: string` field on most recent StudentRecord per leerlingId — same pattern as `student.actiepunten[]`. Saved via `saveKlassen()` after each change in textarea.
- **D-14-12:** Migration on first load: on render of DetailWeergave: if `student.notitie` is undefined AND `localStorage.getItem('mentordashboard_notities')` contains a note for this leerlingId, migrate to `student.notitie` and call `saveKlassen()`. Then remove `localStorage` entry.

### Claude's Discretion

- Exact CSS class names for new React components (no strict schema required — follow existing pattern `klas-tile`, `status-badge`, etc.)
- Debounce timing on notitie textarea (current app uses ~500ms or none — choose most responsive)
- Exact component splits within DetailWeergave (e.g., whether VakkenSection becomes a separate component or stays inline)
- Leerlijn-toewijzing re-implementation: if it fits within scope, implement it; otherwise note as deferred.

### Deferred Ideas (OUT OF SCOPE)

- PDF/Excel/backup import (Phase 13 complete)
- CIOS house-style CSS tokens (Phase 9 complete)
- Leerlijn-toewijzing UI re-implementation (depends on outcome of this phase)
- Print-to-PDF export (future phase)
- Klas hernoemen (not in Phase 14)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KOV-01 | Klasoverzicht tile-grid shows identical information as current app | Component: `KlasOverzicht` — reads `getActiveStudents()`, calls `berekenStatus()` per student, renders `LeerlingTegel` tiles with RAG border, status badge, mini verzuim bar. KPI strip above grid. |
| KOV-02 | Search, sort and klas switching work identically in React version | Controlled `zoekTerm` state + `sortKey`/`sortAsc` state in `KlasOverzicht`. `KlasTabStrip` calls `switchActiveKlas()` → `setRefreshKey(k+1)`. No debounce on search (app.js pattern). |
| DET-V2-01 | DetailWeergave shows identical information (progress, absence, prognosis, notes) | 10 section components: DoortstroomPrognoseSection, AanvullendSection, StageSection, LeerlijnenSection, SpiderChartCard (×3), DeelgebiedenMatrix, VerzuimSection, VakkenSection, NotitiesTextarea. All data from singleton utilities. |
| DET-V2-02 | Actiepunten and feedback work identically in React version | FeedbackActiepuntenSection with `actiepuntenStore.list/add/update/remove()`. Collapsible panel, inline form for add/edit. After each mutation: call `saveKlassen()` (critical — actiepunten.ts calls deprecated `saveState()` no-op). |
</phase_requirements>

---

## Summary

Phase 14 is a faithful React port of the existing JavaScript `app.js` UI — not a redesign. The full visual specification is locked in `14-UI-SPEC.md`, all data utilities exist and are tested, and the user decisions in `14-CONTEXT.md` prescribe the exact component decomposition and state management patterns. This research focuses on technical integration hazards that will affect how the planner structures the work.

The dominant technical risk is the **`actiepunten.ts` persistence gap**: the store calls `saveState()` which is deprecated as a no-op (D-12-07). After every actiepunten add/update/remove, the React components MUST call `saveKlassen()` explicitly to persist changes to the encrypted store. This is a silent failure mode — the UI will appear to work but data will be lost on app restart.

A secondary risk is the **async nature of `getLeerlijnenMapping()`** in `leerlijnen.ts`. The `prognosis.ts` function calls it synchronously (via the cached module-level singleton), but on first render the cache may not be warmed. Components that depend on prognose calculations must ensure `loadKlassen()` has already completed (it does run in `main.tsx` before React renders). Additionally, `berekenStatus()` from `app.js` is not in any TypeScript utility — it must be re-implemented as a pure helper function in the React codebase.

The overall component count is well-defined: 13 components per the UI-SPEC.md plus the refactored App.tsx. A wave structure works naturally: Wave 0 sets up the file scaffold and the missing `berekenStatus` helper; Wave 1 implements KlasOverzicht + KlasTabStrip + KlasModal; Wave 2 implements all DetailWeergave sections.

**Primary recommendation:** Implement `berekenStatus()` as a standalone pure TypeScript function in `src/utils/status.ts` first (Wave 0), then build components bottom-up: leaf sections before parent wrappers, KlasOverzicht before DetailWeergave.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| View routing | Browser / Client | — | `useState` in App.tsx; no URL; Tauri desktop has no browser navigation |
| KlasTabStrip + klas CRUD | Browser / Client | — | `klassenState` singleton + `createKlas/deleteKlas/switchActiveKlas` from `utils/klassen.ts` |
| KlasOverzicht search/sort | Browser / Client | — | Pure filter/sort over in-memory `getActiveStudents()` result; no server round-trip |
| KPI strip calculations | Browser / Client | — | Aggregation over all student statuses; done inline per render |
| DetailWeergave sections | Browser / Client | — | All data comes from student record in `klassenState` singleton |
| Prognose calculation | Browser / Client (utility) | — | `berekenPrognose()` in `utils/prognosis.ts`; pure function over in-memory data |
| Deelgebieden aggregation | Browser / Client (utility) | — | `aggregateDeelgebiedScores()` in `utils/aggregation.ts`; called per render |
| Spider chart SVG | Browser / Client (utility) | — | `SpiderChart.buildSpiderSVG()` returns SVG string; injected via `dangerouslySetInnerHTML` |
| Actiepunten CRUD | Browser / Client + Encrypted Store | Tauri Rust backend | `actiepuntenStore` mutates in-memory; `saveKlassen()` encrypts + persists via Rust |
| Notities persistence | Browser / Client + Encrypted Store | Tauri Rust backend | Textarea onChange → debounce → `student.notitie = value; saveKlassen()` |
| Storage encryption | Tauri Rust backend | OS Keychain | Already implemented in Phase 12; React just calls `saveKlassen()` |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.2.6 | UI rendering | Already installed [VERIFIED: package.json] |
| react-dom | ^19.2.6 | DOM rendering | Already installed [VERIFIED: package.json] |
| @vitejs/plugin-react | ^6.0.1 | JSX transform + HMR | Already configured in vite.config.ts [VERIFIED: vite.config.ts] |
| typescript | ~5.8.0 | Static typing | Already installed [VERIFIED: package.json] |

### Supporting (existing utilities — import directly)
| Module | Location | Purpose |
|--------|---------|---------|
| `berekenPrognose` | `utils/prognosis.ts` | Doorstroomnorm calculation per student |
| `berekenAllePrognoses` | `utils/prognosis.ts` | Batch prognosis (used by KPI strip) |
| `aggregateDeelgebiedScores` | `utils/aggregation.ts` | Modus score per deelgebied for matrix footer |
| `SpiderChart.buildSpiderSVG` | `utils/spider.ts` | SVG spider chart string |
| `actiepuntenStore` | `utils/actiepunten.ts` | Actiepunten CRUD (in-memory; React must persist via `saveKlassen()`) |
| `klassenState`, `saveKlassen`, `switchActiveKlas`, `createKlas`, `deleteKlas`, `getActiveStudents`, `getAllRecordsForStudent` | `utils/klassen.ts` | Klas management + persistence |
| `appState` | `utils/datamodel.ts` | Student records singleton |
| `DEELGEBIEDEN`, `SCORE_LEVELS` | `utils/schema.ts` | Schema constants for matrix rendering |

### No New Packages Required
All dependencies for this phase already exist in `package.json`. No `npm install` step needed. [VERIFIED: package.json]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain CSS (existing patterns) | CSS Modules | CSS Modules would require renaming all existing class selectors — not worth it for a faithful port |
| `dangerouslySetInnerHTML` for spider SVG | Rewrite as React SVG | Rewrite risks visual divergence from existing output; `spider.ts` already sanitizes inputs |
| `useState` in App.tsx for routing | React Router | No URL-based routing needed in Tauri; Router adds complexity with no benefit |
| `window.confirm()` for delete klas | Custom confirm dialog | Custom dialog is out of scope per D-14-07; `window.confirm()` matches current behavior exactly |

---

## Architecture Patterns

### System Architecture Diagram

```
User interaction
       |
       v
App.tsx [useState: view, refreshKey, activeStudentId]
       |
       +---(view === 'import')-----> ImportPage (existing, + onImportComplete prop)
       |                                  |
       |                            onImportComplete() --> setRefreshKey(k+1) + setView('klas')
       |
       +---(view === 'klas')-------> KlasTabStrip (reads klassenState)
       |                             KlasOverzicht (reads getActiveStudents() per render)
       |                                  |
       |                            tile click --> setView('detail') + setActiveStudentId(id)
       |                            tab click  --> switchActiveKlas() + setRefreshKey(k+1)
       |                            "+" click  --> KlasModal (createKlas() + setRefreshKey)
       |                            delete     --> window.confirm + deleteKlas() + setView
       |
       +---(view === 'detail')-----> KlasTabStrip (reads klassenState)
       |                             DetailWeergave (reads student from klassenState)
       |                                  |
       |                        10 section components
       |                        (each reads from student record + utility functions)
       |                                  |
       |                        actiepunten CRUD --> actiepuntenStore + saveKlassen()
       |                        notitie change   --> debounce 500ms --> saveKlassen()
       |
       v
utils/klassen.ts [klassenState singleton] <--> Rust encrypt_klassen/decrypt_klassen
                                          <--> OS Keychain (AES-256-GCM key)
```

### Recommended Project Structure

```
src/
├── App.tsx                          # View routing, refreshKey, activeStudentId state
├── App.css                          # Global CSS (CSS variables, layout)
├── components/
│   ├── ImportPage.tsx               # Existing (add onImportComplete prop)
│   ├── KlasTabStrip.tsx             # Horizontal tab strip + "+" button
│   ├── KlasModal.tsx                # New klas modal (controlled form)
│   ├── KlasOverzicht.tsx            # Grid view with search/sort/KPI strip
│   ├── LeerlingTegel.tsx            # Single tile (extracted from KlasOverzicht)
│   ├── DetailWeergave.tsx           # Wrapper + header + section list
│   ├── DoortstroomPrognoseSection.tsx
│   ├── FeedbackActiepuntenSection.tsx
│   ├── SpiderChartCard.tsx          # dangerouslySetInnerHTML SVG wrapper
│   ├── DeelgebiedenMatrix.tsx       # Full deelgebieden table
│   ├── VerzuimSection.tsx
│   ├── VakkenSection.tsx            # Accordion per vak
│   └── NotitiesTextarea.tsx         # Debounced textarea with save hint
└── utils/
    └── status.ts                    # berekenStatus() helper (re-implemented from app.js)
```

### Pattern 1: Singleton Read on Every Render (D-14-02/D-14-03)

Module-level singletons (`klassenState`, `appState`) are always current because React renders after `refreshKey` changes. Components read directly without caching.

```typescript
// Source: CONTEXT.md D-14-02 / app.js pattern
function KlasOverzicht({ refreshKey }: { refreshKey: number }) {
  // No useEffect — read singleton directly on each render
  const students = getActiveStudents(); // always current
  const [zoekTerm, setZoekTerm] = useState('');
  const [sortKey, setSortKey] = useState<'naam' | 'status' | 'verzuim'>('naam');
  const [sortAsc, setSortAsc] = useState(true);
  // ...
}
```

**Why this works:** `refreshKey` is passed as a prop (not used inside the component). When it changes, React re-renders the component and `getActiveStudents()` returns fresh data.

### Pattern 2: refreshKey Increment Triggers Re-render

```typescript
// Source: CONTEXT.md D-14-02/D-14-04; UI-SPEC.md Interaction Patterns
function App() {
  const [view, setView] = useState<'import' | 'klas' | 'detail'>('import');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  function handleImportComplete() {
    setRefreshKey(k => k + 1);
    setView('klas');
  }

  function handleKlasSwitch(id: string) {
    switchActiveKlas(id); // async but no await needed — singleton updates synchronously
    setRefreshKey(k => k + 1);
    const hasStudents = getActiveStudents().length > 0;
    setView(hasStudents ? 'klas' : 'import');
  }
  // ...
}
```

### Pattern 3: actiepunten CRUD with Explicit saveKlassen()

```typescript
// Source: actiepunten.ts analysis — saveState() is a no-op; must call saveKlassen()
async function handleAddActiepunt(leerlingId: string, patch: ActiepuntPatch) {
  actiepuntenStore.add(leerlingId, patch); // mutates in-memory student record
  await saveKlassen();                     // REQUIRED: persists to encrypted store
  setActiepunten(actiepuntenStore.list(leerlingId)); // re-render list
}
```

### Pattern 4: SpiderChart via dangerouslySetInnerHTML

```typescript
// Source: CONTEXT.md D-14-10; spider.ts is XSS-safe via sanitizeCssVar()
function SpiderChartCard({ axes, scores, fillVar, strokeVar, title }) {
  const svg = SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar);
  if (!svg || axes.length === 0) {
    return <div className="spider-empty">Geen scores beschikbaar</div>;
  }
  return (
    <div className="spider-card">
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="spider-leerlijn-title">{title}</div>
    </div>
  );
}
```

**Note on spider axes key convention:** `SpiderChart.buildSpiderSVG` expects `axes[i].key` to match keys in `scores`. `deelgebiedScores` from parsed PDFs are keyed on `dg.label` (e.g., 'V&A'), but spider.ts docs say to use `dg.id`. The axes must be built as:
```typescript
const axes = DEELGEBIEDEN
  .filter(dg => dg.group === 'lesgeven')
  .map(dg => ({ key: dg.label, label: dg.label })); // key on label to match deelgebiedScores
```

### Pattern 5: Notities Debounce + Migration

```typescript
// Source: CONTEXT.md D-14-11, D-14-12; UI-SPEC.md NotitiesTextarea
function NotitiesTextarea({ student, leerlingId }) {
  const [value, setValue] = useState(() => {
    // D-14-12: migration from localStorage on first render
    if (student.notitie !== undefined) return student.notitie;
    const legacy = localStorage.getItem('mentordashboard_notities');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed[leerlingId]) {
          // Migrate: write to student record and save
          student.notitie = parsed[leerlingId];
          delete parsed[leerlingId];
          if (Object.keys(parsed).length === 0) {
            localStorage.removeItem('mentordashboard_notities');
          } else {
            localStorage.setItem('mentordashboard_notities', JSON.stringify(parsed));
          }
          saveKlassen(); // fire-and-forget acceptable here
          return student.notitie;
        }
      } catch {}
    }
    return '';
  });
  const [hint, setHint] = useState<'idle' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      student.notitie = v;
      await saveKlassen();
      setHint('saved');
      setTimeout(() => setHint('idle'), 1500);
    }, 500);
  }
  // ...
}
```

### Pattern 6: berekenStatus() Helper (must be re-implemented)

`berekenStatus()` exists only in `app.js` (lines 1222–1240). It is not exported from any TypeScript utility. It must be implemented as a pure function in `src/utils/status.ts`.

```typescript
// Source: app.js lines 1222-1240
const STATUS_VOLGORDE = { rood: 0, oranje: 1, groen: 2, blauw: 3, grijs: 4 } as const;
const RAG_BORDER = { groen: '#22c55e', oranje: '#f97316', rood: '#ef4444', grijs: '#d1d5db', blauw: '#3b82f6' } as const;

export function berekenStatus(student: any, traject?: string): { kleur: string; label: string; prognose: any } {
  const t = traject || detectTraject(student);
  const p = berekenPrognose(student, t);
  const ongeoorloofd = student.verzuim ? student.verzuim.ongeoorloofd : 0;
  const VERZUIM_DREMPEL = 600; // minutes — from app.js
  const heeftScores = p.totaalVoldoendeOfHoger + p.totaalOnvoldoende > 0;

  if (!heeftScores)               return { kleur: 'grijs',  label: 'Onbekend',         prognose: p };
  if (p.label === 'negatief')     return { kleur: 'rood',   label: 'Risico',            prognose: p };
  if (p.label === 'neutraal')     return { kleur: 'oranje', label: 'Let op',            prognose: p };
  if (ongeoorloofd > VERZUIM_DREMPEL) return { kleur: 'oranje', label: 'Verzuim',       prognose: p };
  if (p.label === 'sbc')          return { kleur: 'blauw',  label: 'Profieljaar SBC',   prognose: p };
  if (p.label === 'sbl')          return { kleur: 'groen',  label: 'Op koers',          prognose: p };
  if (p.label === 'versneld_sbc') return { kleur: 'blauw',  label: 'Versneld SBC',      prognose: p };
  if (p.label === 'naar_bj2')     return { kleur: 'groen',  label: 'Op koers BJ2',      prognose: p };
  return                                 { kleur: 'groen',  label: 'Op koers',          prognose: p };
}
```

**Also needed:** `detectTraject()` which detects BJ1/BJ2 from `student.periode` and `student.leerjaar`. This is also in app.js (~line 1195–1220) and not in any TypeScript utility.

### Anti-Patterns to Avoid

- **Calling `actiepuntenStore.add/update/remove()` without `await saveKlassen()`:** `saveState()` in actiepunten.ts is a no-op. Data will be lost on app restart. Every mutation must be followed by `saveKlassen()`.
- **Reading `appState.students` directly in KlasOverzicht:** Use `getActiveStudents()` instead — it deduplicates by leerlingId (newest-first) and returns only active-klas students.
- **Using `useEffect` to load data from singletons:** Singletons are always current after `refreshKey` changes. `useEffect` on load is not needed and creates stale-closure problems.
- **Re-implementing `getLeerlijnenMapping()` synchronously:** It returns `Promise<Record<string, string>>`. In `prognosis.ts` it is called synchronously because the cache is already warm after `loadKlassen()`. Do not call it from React components directly — prognose calculations happen through `berekenPrognose()` which handles this correctly via the cached singleton.
- **Wrapping the entire app in `<React.StrictMode>` double-invocation guards:** Main.tsx already uses StrictMode. In development, effects run twice. Do not rely on one-time side effects in `useEffect` without proper cleanup.
- **Building `axes` with `dg.id` as key when calling `buildSpiderSVG`:** `student.deelgebiedScores` is keyed on `dg.label` ('V&A', 'M&M', etc.), not `dg.id` ('va', 'mm'). Use `dg.label` as the key in axes to match the stored scores.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Klas persistence | Custom storage | `saveKlassen()` from `utils/klassen.ts` | Already implements AES-256-GCM + plugin-store |
| Actiepunten CRUD | Custom list manager | `actiepuntenStore` from `utils/actiepunten.ts` | Has herhaling-detection, ID generation, all edge cases |
| Spider chart SVG | React SVG component | `SpiderChart.buildSpiderSVG()` via `dangerouslySetInnerHTML` | XSS-safe, tested, matches existing visual output exactly |
| Deelgebied aggregation | Custom modus logic | `aggregateDeelgebiedScores()` from `utils/aggregation.ts` | Tie-break logic is non-trivial; tested with 8 test cases |
| Score normalization | Inline string switch | `normalizeScore()` from `utils/schema.ts` | Handles all input variants ('O', 'ONV', 'ONVOLDOENDE') |
| Duplicate klas name detection | Inline check | `createKlas()` from `utils/klassen.ts` | Returns `{ error: 'duplicate' }` on name collision |

**Key insight:** Every utility function used by `app.js` exists as a tested TypeScript module. The React port's job is wiring them to JSX — not reimplementing logic.

---

## Common Pitfalls

### Pitfall 1: actiepunten mutations silently not persisted

**What goes wrong:** Mentor adds an actiepunt, sees it in the UI, restarts the app — it's gone.

**Why it happens:** `actiepuntenStore.add/update/remove()` calls `saveState()` which is deprecated as a no-op since Phase 12 (D-12-07). The in-memory mutation happens but nothing is written to the encrypted store.

**How to avoid:** After every `actiepuntenStore` mutation, call `await saveKlassen()`. Document this explicitly in every task that touches actiepunten CRUD.

**Warning signs:** Actiepunten disappear after app restart in manual testing.

---

### Pitfall 2: Spider chart scores keyed on dg.id instead of dg.label

**What goes wrong:** Spider chart renders as empty (all points at center) even when student has scores.

**Why it happens:** `student.deelgebiedScores` is populated by the PDF parser with keys like `'V&A'`, `'M&M'` (the `dg.label` values). If `axes` is built with `dg.id` as key (`'va'`, `'mm'`), `buildSpiderSVG` looks up `scores['va']` which is always `undefined`.

**How to avoid:** Build axes as `DEELGEBIEDEN.filter(...).map(dg => ({ key: dg.label, label: dg.label }))`.

**Warning signs:** Spider cards render but show no polygon — just the outer SVG frame.

---

### Pitfall 3: `berekenStatus()` / `detectTraject()` missing from TypeScript utilities

**What goes wrong:** Planner references these functions as if they exist in `utils/prognosis.ts` — they do not. They are private functions inside `app.js`'s IIFE.

**Why it happens:** These functions were never migrated to TypeScript in Phases 11–13.

**How to avoid:** Wave 0 of the plan MUST create `src/utils/status.ts` with `detectTraject()`, `berekenStatus()`, `STATUS_VOLGORDE`, and `RAG_BORDER`. All components depend on this.

**Warning signs:** TypeScript compile error "Cannot find name 'berekenStatus'" or "Cannot find name 'detectTraject'".

---

### Pitfall 4: VERZUIM_DREMPEL_MIN value unknown from TypeScript code

**What goes wrong:** The oranje/Verzuim threshold in `berekenStatus()` is set to `VERZUIM_DREMPEL_MIN` in `app.js` but this constant's value is not in any TypeScript module.

**Why it happens:** It is declared in `app.js` near the top of the IIFE as a local `const`. [ASSUMED] The value appears to be 600 minutes based on `minNaarUren(600)` = 10u which matches typical Dutch school absence thresholds.

**How to avoid:** Read the exact value from `app.js` before writing `status.ts`. Grep for `VERZUIM_DREMPEL`.

**Warning signs:** Students shown as 'Verzuim' who should not be, or vice versa.

---

### Pitfall 5: notitie localStorage key format unknown

**What goes wrong:** Migration (D-14-12) reads the wrong key or parses the wrong format, silently discarding existing notes.

**Why it happens:** The localStorage key `'mentordashboard_notities'` and its data format (object `{ [leerlingId]: string }`) is assumed from the app.js notities section. [ASSUMED] The exact key name and format should be verified in `app.js` lines 1817–1820 before implementing migration.

**How to avoid:** Verify the exact key name and format in app.js before implementing `NotitiesTextarea`. Search for `mentordashboard_notities` or `notitie` in app.js.

**Warning signs:** Migration runs but existing notes do not appear in the textarea.

---

### Pitfall 6: DetailWeergave prev/next requires ordered student list

**What goes wrong:** "‹ Vorige" and "Volgende ›" navigate to wrong students or are always disabled.

**Why it happens:** The prev/next IDs depend on the current sorted+filtered order from KlasOverzicht. This ordered list must be passed from KlasOverzicht to App.tsx (as `detailStudentList`) so DetailWeergave can compute `prevId` and `nextId`.

**How to avoid:** When a tile is clicked, pass the full ordered ID list to App.tsx alongside `activeStudentId`. Store as `detailStudentList: string[]` state in App.tsx.

**Warning signs:** Prev/Next buttons always disabled even when other students exist.

---

### Pitfall 7: KlasTabStrip renders inside header — CSS scoping conflict

**What goes wrong:** KlasTabStrip tabs do not inherit `#main-nav` flex layout, or are positioned outside the header.

**Why it happens:** The existing CSS (from `index.html.bak`) expects `.nav-tab` elements to be direct children of `#main-nav`. If `KlasTabStrip` renders with its own wrapper `<div>`, the flex layout breaks.

**How to avoid:** `KlasTabStrip` should render its tabs directly (no wrapping div with conflicting flex context), or App.tsx should render KlasTabStrip inside the existing `#main-nav` slot. Verify `index.html.bak` CSS before writing the header JSX.

**Warning signs:** Tabs appear below the header or do not align horizontally.

---

## Code Examples

### berekenStatus — Verified from app.js lines 1222–1244

```typescript
// Source: app.js lines 1222-1244 (VERIFIED by code reading)
// Recreate in src/utils/status.ts

export const STATUS_VOLGORDE: Record<string, number> = {
  rood: 0, oranje: 1, groen: 2, blauw: 3, grijs: 4
};

export const RAG_BORDER: Record<string, string> = {
  groen: '#22c55e', oranje: '#f97316', rood: '#ef4444', grijs: '#d1d5db', blauw: '#3b82f6'
};

// VERZUIM_DREMPEL_MIN — verify exact value in app.js before coding
const VERZUIM_DREMPEL_MIN = 600; // [ASSUMED: 600 minutes = 10 hours]

export function berekenStatus(student: any, traject?: string): StatusResult {
  const t = traject ?? detectTraject(student);
  const p = berekenPrognose(student, t);
  const ongeoorloofd = student.verzuim?.ongeoorloofd ?? 0;
  const heeftScores = p.totaalVoldoendeOfHoger + p.totaalOnvoldoende > 0;

  if (!heeftScores)                   return { kleur: 'grijs',  label: 'Onbekend',       prognose: p };
  if (p.label === 'negatief')         return { kleur: 'rood',   label: 'Risico',          prognose: p };
  if (p.label === 'neutraal')         return { kleur: 'oranje', label: 'Let op',          prognose: p };
  if (ongeoorloofd > VERZUIM_DREMPEL_MIN)
                                      return { kleur: 'oranje', label: 'Verzuim',         prognose: p };
  if (p.label === 'sbc')              return { kleur: 'blauw',  label: 'Profieljaar SBC', prognose: p };
  if (p.label === 'sbl')              return { kleur: 'groen',  label: 'Op koers',        prognose: p };
  if (p.label === 'versneld_sbc')     return { kleur: 'blauw',  label: 'Versneld SBC',    prognose: p };
  if (p.label === 'naar_bj2')         return { kleur: 'groen',  label: 'Op koers BJ2',    prognose: p };
  return                                     { kleur: 'groen',  label: 'Op koers',        prognose: p };
}
```

### KPI Strip — from app.js lines 1273–1328 (pattern only)

```typescript
// Source: app.js lines 1273-1328 (VERIFIED)
// KPI strip computes over all non-filtered students (not the zoekTerm-filtered view)
const kpiStudents = getActiveStudents(); // all students in active klas
const statuses = kpiStudents.map(s => berekenStatus(s));
const opSchema  = statuses.filter(st => st.kleur === 'groen' || st.kleur === 'blauw').length;
const risico    = statuses.filter(st => st.kleur === 'rood').length;
const verzuim   = statuses.filter(st => st.kleur === 'oranje' && st.label === 'Verzuim').length;
const pctOpSchema = kpiStudents.length > 0 ? Math.round(opSchema / kpiStudents.length * 100) : 0;
```

### DeelgebiedenMatrix — two-period tfoot pattern

```typescript
// Source: app.js lines 1748-1807 (VERIFIED)
const allRecords = getAllRecordsForStudent(student.leerlingId); // oldest-first
const hasTwoPeriods = allRecords.length >= 2
  && allRecords[0].periode !== allRecords[allRecords.length - 1].periode;

// Single period: use aggregateDeelgebiedScores(student.datapunten) for footer chip
// Two periods: oldest = allRecords[0], newest = allRecords[allRecords.length - 1]
//   - scores1 = oldest.deelgebiedScores
//   - scores2 = newest.deelgebiedScores
//   - growth badge: scoreRank(scores2[dg.label]) vs scoreRank(scores1[dg.label])
```

### Mini Verzuim Bar — percentage calculation

```typescript
// Source: app.js lines 1256-1269 (VERIFIED)
function buildMiniVerzuimBar(student: any) {
  if (!student.verzuim) return null;
  const v = student.verzuim;
  const totaal = (v.aanwezigheid || 0) + (v.geoorloofd || 0) + (v.ongeoorloofd || 0);
  if (!totaal) return null;
  const pA = Math.round((v.aanwezigheid || 0) / totaal * 100);
  const pG = Math.round((v.geoorloofd   || 0) / totaal * 100);
  const pO = 100 - pA - pG;
  return { pA, pG, pO, aanwezig: v.aanwezigheid };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `localStorage` for class data | Tauri plugin-store with AES-256-GCM | Phase 12 | `saveKlassen()` is async; actiepunten.ts still uses deprecated `saveState()` no-op |
| `window.klassenState` globals | Named ES module exports | Phase 11 | Import directly: `import { klassenState } from '../../utils/klassen'` |
| Single-file `app.js` | Component files in `src/components/` | Phase 14 (this phase) | New component file per logical unit |
| `innerHTML` HTML building | React JSX | Phase 14 (this phase) | `escapeHtml()` not needed — React auto-escapes |
| `getLeerlijnenMapping()` synchronous | Async Promise (Phase 12) | Phase 12 | Already cached after `loadKlassen()`; safe to use via `berekenPrognose()` |

**Deprecated/outdated:**
- `saveState()` / `loadState()` in `utils/datamodel.ts`: no-op stubs. Never call these directly.
- `window.klassenState`, `window.appState`, `window.berekenPrognose`, etc.: global window assignments. Import as ES modules instead.
- `escapeHtml()` in app.js: Not needed in React JSX — React auto-escapes string children.

---

## Runtime State Inventory

> This phase is a greenfield React UI addition, not a rename/refactor. However one data migration is in scope (D-14-12).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `localStorage` key `'mentordashboard_notities'` (format: `{ [leerlingId]: string }`) — may exist in user's browser storage | Code migration in `NotitiesTextarea` on first render per leerlingId (D-14-12) |
| Live service config | None — no external services | None |
| OS-registered state | None | None |
| Secrets/env vars | None (encryption key is in OS keychain, managed by Phase 12 utilities) | None |
| Build artifacts | None | None |

**Note:** The exact localStorage key name for notities must be verified in app.js before implementing migration. [ASSUMED: `'mentordashboard_notities'`]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `VERZUIM_DREMPEL_MIN` in app.js = 600 minutes | Code Examples (berekenStatus) | Students mis-classified as 'Verzuim' or not — check app.js before coding `status.ts` |
| A2 | localStorage notities key is `'mentordashboard_notities'` with format `{ [leerlingId]: string }` | Pitfall 5, Pattern 5 | Migration code silently fails; existing mentor notes are not migrated |
| A3 | `detectTraject()` logic in app.js lines ~1195–1220 is complete and does not depend on any other removed app.js state | Code Examples | detectTraject in status.ts produces wrong traject for some students |

---

## Open Questions

1. **Exact value of `VERZUIM_DREMPEL_MIN`**
   - What we know: app.js uses `VERZUIM_DREMPEL_MIN` as a threshold for 'Verzuim' status
   - What's unclear: The exact value (likely 600 but not confirmed from the code read so far)
   - Recommendation: Wave 0 task must grep app.js for `VERZUIM_DREMPEL` before writing status.ts

2. **Exact localStorage format for notities**
   - What we know: D-14-12 says migrate from `localStorage.getItem('mentordashboard_notities')`
   - What's unclear: Whether the value is `{ [leerlingId]: string }` or `string` per key
   - Recommendation: Verify by searching app.js for the notities localStorage write before writing NotitiesTextarea migration

3. **Leerlijn-toewijzing scope**
   - What we know: Current app.js has a leerlijn-toewijzing section; CONTEXT.md marks it as Claude's Discretion
   - What's unclear: How complex the React implementation would be; it depends on `leerlijnen.ts` async API
   - Recommendation: Planner should include it as a separate Wave 2 task with a deferred-flag escape hatch

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm test, npm run dev | Yes | Confirmed (npm scripts work per STATE.md) | — |
| Vitest | Test suite | Yes | ^4.1.6 [VERIFIED: package.json] | — |
| @vitejs/plugin-react | JSX compilation | Yes | ^6.0.1 [VERIFIED: package.json] | — |
| react + react-dom | Components | Yes | ^19.2.6 [VERIFIED: package.json] | — |
| @tauri-apps/plugin-store | saveKlassen() | Yes | ^2.4.3 [VERIFIED: package.json] | — |

**No missing dependencies.** All required libraries are already installed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KOV-01 | Tile grid renders student data with correct status color | unit | `npm test -- --grep "KlasOverzicht"` | ❌ Wave 0 |
| KOV-02 | Search filters students; sort orders correctly; klas switch re-renders | unit | `npm test -- --grep "KlasOverzicht"` | ❌ Wave 0 |
| DET-V2-01 | DetailWeergave renders all 10 sections without crash | unit | `npm test -- --grep "DetailWeergave"` | ❌ Wave 0 |
| DET-V2-02 | Actiepunten add/edit/delete call saveKlassen() | unit | `npm test -- --grep "actiepunten"` | ❌ Wave 0 (existing actiepunten.test.js covers store logic only; new test needed for React integration) |

**Note:** Vitest does not support React component rendering by default. The test environment is jsdom (already configured). React Testing Library (`@testing-library/react`) would enable component tests. However, given the project pattern (all existing tests are pure unit tests of utility functions), React component tests are likely out of scope. Manual verification in the Tauri dev window is the primary verification method for UI components.

**Revised approach:** Phase 14 tests should focus on:
- `berekenStatus()` unit tests (new function, verifiable without React)
- `detectTraject()` unit tests
- `notitie` migration logic unit tests

### Sampling Rate

- **Per task commit:** `npm test` (35 existing tests must stay green)
- **Per wave merge:** `npm test` + manual smoke test in `npm run dev`
- **Phase gate:** Full suite green + all 4 success criteria verified manually before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/status.test.ts` — covers `berekenStatus()` for all 5 status outcomes + `detectTraject()` for BJ1/BJ2 patterns
- [ ] `src/utils/status.ts` — the file itself (Wave 0 deliverable)
- [ ] No framework install needed — jsdom already configured

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Tauri app has no authentication |
| V3 Session Management | No | No session concept in desktop app |
| V4 Access Control | No | Single-user local app |
| V5 Input Validation | Yes — notities textarea, actiepunt form inputs, klasnaam modal | React auto-escapes string children; `dangerouslySetInnerHTML` only for `SpiderChart.buildSpiderSVG()` which uses `sanitizeCssVar()` [VERIFIED: spider.ts line 9] |
| V6 Cryptography | No (existing) | AES-256-GCM already implemented in Phase 12; Phase 14 only calls `saveKlassen()` |

### Known Threat Patterns for React + dangerouslySetInnerHTML

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via SVG injection in SpiderChartCard | Tampering | `sanitizeCssVar()` in spider.ts strips non-alphanum chars from CSS var names [VERIFIED: spider.ts] |
| XSS via student name in JSX | Tampering | React auto-escapes string children — no `innerHTML` for student data |
| XSS via klasnaam in modal | Tampering | React controlled input + display in JSX — no innerHTML |

**No new security concerns** introduced by Phase 14. The only `dangerouslySetInnerHTML` usage is the spider chart SVG, which is protected by existing sanitization.

---

## Sources

### Primary (HIGH confidence)

- `app.js` lines 74–160, 1222–1240, 1244, 1256–1269, 1329–1388, 1564–1808 — VERIFIED by direct code reading: berekenStatus, renderKlasGrid, buildDetailHTML, all sub-functions
- `utils/klassen.ts` — VERIFIED: klassenState, saveKlassen, loadKlassen, createKlas, deleteKlas, switchActiveKlas, getActiveStudents, getAllRecordsForStudent
- `utils/actiepunten.ts` — VERIFIED: saveState() is imported but is a no-op; all CRUD mutates in-memory only
- `utils/prognosis.ts` — VERIFIED: berekenPrognose signature, return shape
- `utils/aggregation.ts` — VERIFIED: aggregateDeelgebiedScores signature, return `{ aggregationDetail }`
- `utils/spider.ts` — VERIFIED: buildSpiderSVG, sanitizeCssVar, axes key convention documented in JSDoc
- `utils/schema.ts` — VERIFIED: DEELGEBIEDEN structure, SCORE_LEVELS
- `utils/datamodel.ts` — VERIFIED: saveState() is marked `@deprecated`, returns true (no-op)
- `src/App.tsx` — VERIFIED: current state (ImportPage only, drop guard, storage-error-banner)
- `src/main.tsx` — VERIFIED: loadKlassen() awaited before ReactDOM.render
- `src/components/ImportPage.tsx` — VERIFIED: no onImportComplete prop yet; must be added
- `package.json` — VERIFIED: all dependencies and versions
- `vitest.config.ts` — VERIFIED: jsdom, vmForks pool, setupFiles
- `.planning/phases/14-react-ui/14-CONTEXT.md` — VERIFIED: all decisions D-14-01 through D-14-12
- `.planning/phases/14-react-ui/14-UI-SPEC.md` — VERIFIED: full component inventory, CSS specs, interaction patterns, copywriting contract

### Secondary (MEDIUM confidence)

- `.planning/phases/12-versleutelde-opslag/12-CONTEXT.md` — VERIFIED: D-12-07 (saveState deprecated), D-12-08 (async API)
- `.planning/STATE.md` — VERIFIED: Phase 13 complete status, accumulated decisions

### Tertiary (LOW confidence)

- VERZUIM_DREMPEL_MIN value = 600 — inferred from app.js context; exact value not read from the specific line

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages verified in package.json
- Architecture patterns: HIGH — derived from verified app.js and CONTEXT.md decisions
- Pitfalls: HIGH for actiepunten persistence (code-verified no-op), HIGH for spider axes keys (JSDoc-verified), MEDIUM for notitie localStorage format (decision text, not code-verified)
- Utility integration: HIGH — all utility files read directly

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (stable codebase, no external APIs)
