# Phase 18: Settings Panel Advanced - Research

**Researched:** 2026-05-18
**Domain:** React settings UI, Tauri plugin-store persistence, prognose engine, deelgebieden config
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Deelgebieden & Leerlijnen UI (SET-03 + SET-04)**
- D-01: SET-03 and SET-04 combined in single scrollable table. Columns: Naam | Leerlijn | Actief.
- D-02: Naam column is an inline text input. Changes apply on blur/Enter.
- D-03: "Herstel standaard" reset button below the table with inline confirmation (no modal).
- D-04: Inactive deelgebied scores preserved in store — no deletion. Reactivating restores them.

**Prognose bij inactieve deelgebieden**
- D-05: "≥13 voldoende" counts only active deelgebieden (active pool only, fixed threshold 13).
- D-06: SBC leerlijn thresholds (lesgeven ≥4, organiseren ≥3, prof. handelen ≥5 goed) apply only to active deelgebieden per leerlijn.
- D-07: Negatief norm (>6 onvoldoende OR >2 per leerlijn) applies only to active deelgebieden.

**Verzuim Drempelwaarden (SET-05)**
- D-08: Two thresholds — geoorloofd and ongeoorloofd — both affect tile status (oranje/Verzuim).
- D-09: Entered as hours (integers). Internally stored as minutes (hours × 60). Defaults: 15u geoorloofd, 10u ongeoorloofd.
- D-10: Hardcoded `VERZUIM_DREMPEL_MIN = 600` in `src/utils/status.ts` replaced by runtime-loaded config from plugin-store.

**BPV-uren (SET-06)**
- D-11: Full BPV feature: settings input, BPV Excel import, per-student progress in DetailWeergave.
- D-12: BPV progress in DetailWeergave only (not class overview tiles).
- D-13: BPV Excel file format unknown at planning time — ask user at parser implementation time.
- D-14: Default expected BPV-uren: 200 (half-year BPV default; UI-SPEC confirms 200).

**Data Persistence Model**
- D-15: Deelgebied customizations stored under `'deelgebieden_config'` key. Format: `Array<{ id: string, label: string, active: boolean }>`. Leerlijn assignment continues using existing `'leerlijnen'` key.
- D-16: Verzuim thresholds stored under `'verzuim_drempels'` key. Format: `{ geoorloofd: number, ongeoorloofd: number }` (values in minutes).
- D-17: BPV config stored under `'bpv_config'`. BPV actual data stored under `'bpv_data'`. Both use LazyStore pattern.

### Claude's Discretion
- Exact table CSS (reuse `.ap-row` / `.dg-matrix` patterns vs new classes)
- Whether to debounce inline naam input or apply on blur only
- BPV section header text and progress bar styling in DetailWeergave
- Default expected BPV-uren value (200 confirmed by UI-SPEC)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SET-03 | Mentor kan in de settings de 19 deelgebieden hernoemen of individueel inactief zetten (inactieve deelgebieden worden verborgen in matrix en prognose) | D-01, D-02, D-15 lock persistence; `DEELGEBIEDEN` array in `utils/schema.ts` is the source of truth; `DeelgebiedenMatrix.tsx` uses DEELGEBIEDEN directly and must filter by active config |
| SET-04 | Mentor kan in de settings de leerlijn-toewijzing aanpassen — welk deelgebied valt onder lesgeven / organiseren / professioneel handelen | D-01 combines SET-04 with SET-03 table; existing `saveLeerlijnenMapping` / `getLeerlijnenMapping` pattern reused; `berekenPrognose` calls `getLeerlijnenMapping()` synchronously (CRITICAL BUG: see pitfall section) |
| SET-05 | Mentor kan aparte drempelwaarden instellen voor verzuim-signalering: apart voor geoorloofd en ongeoorloofd verzuim | D-08 through D-10 lock threshold storage; `VERZUIM_DREMPEL_MIN = 600` in `src/utils/status.ts` must be replaced with runtime parameter; `berekenStatus()` signature must accept threshold config |
| SET-06 | Mentor kan het verwachte aantal BPV-uren per periode configureren (gebruikt voor voortgangsindicatie) | D-11 through D-17 lock the full BPV feature; BPV section in DetailWeergave mirrors VerzuimSection pattern; BPV Excel parser deferred to implementation time |

</phase_requirements>

---

## Summary

Phase 18 fills in the two placeholder sections in `SettingsPage.tsx` (sections 3 and 4) that were left as "Komt in een volgende versie" stubs in Phase 17. It delivers four interlocked features across the settings UI, the prognose engine, and the DetailWeergave component.

The most structurally significant change is to `berekenPrognose()` in `utils/prognosis.ts`. That function currently calls `getLeerlijnenMapping()` synchronously at line 59, but `getLeerlijnenMapping()` is declared `async` and returns a `Promise`. This means the current code silently calls the Promise object as if it were a plain object — the mapping falls through to the schema defaults on every call (the in-memory cache returns correctly on repeat calls because the cached result is not a Promise). Phase 18 must resolve this latency/sync mismatch while also adding the `activeDeelgebieden` filter parameter. The safest approach is an in-memory synchronous cache that is pre-loaded at startup, exposing a `getActiveLeerlijnenMappingSync()` function that `berekenPrognose()` can call without await.

The `berekenStatus()` function in `src/utils/status.ts` currently uses a module-level constant `VERZUIM_DREMPEL_MIN = 600`. Phase 18 must add a `geoorloofd` threshold check (new, per D-08) and make both thresholds runtime-configurable. The cleanest approach (consistent with instant-apply pattern) is to pass thresholds as optional parameters to `berekenStatus()` with defaults matching the current hardcoded values.

The BPV feature is scoped to storage config + a DetailWeergave section. The BPV Excel parser format is unknown; the UI-SPEC calls for a file-picker button in SettingsPage that triggers a Tauri file dialog, with parse-error feedback inline. The planner must schedule the parser as a separate task that blocks on the user providing the sample file.

All four features share the instant-apply pattern from Phase 17: user interaction → in-memory state update → `store.set(key, value)` + `store.save()` → downstream components re-render with new config.

**Primary recommendation:** Implement in 5 plans — Plan 1: new utility modules (deelgebieden config, verzuim thresholds, BPV config); Plan 2: berekenPrognose + berekenStatus refactor (active filter + runtime thresholds); Plan 3: SettingsPage sections 3 & 4 UI + CSS section 25; Plan 4: DeelgebiedenMatrix + SpiderChartCard + DetailWeergave BPV section; Plan 5: tests + gap closure.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deelgebied config persistence | Utility layer (utils/deelgebieden.ts) | Tauri plugin-store (disk) | Mirrors leerlijnen.ts pattern; LazyStore key `'deelgebieden_config'` |
| Leerlijn assignment (SET-04) | Utility layer (utils/leerlijnen.ts) | SettingsPage UI | Existing saveLeerlijnenMapping; UI adds editor for existing data |
| Verzuim threshold persistence | Utility layer (utils/verzuimDrempels.ts) | Tauri plugin-store | New key `'verzuim_drempels'`; follows settings.ts pattern |
| BPV config persistence | Utility layer (utils/bpv.ts) | Tauri plugin-store | Keys `'bpv_config'` + `'bpv_data'`; same LazyStore pattern |
| Prognose active-filter | Backend logic (utils/prognosis.ts) | — | berekenPrognose must receive active deelgebied list; no UI coupling |
| Verzuim status with thresholds | Backend logic (src/utils/status.ts) | — | berekenStatus gains optional threshold params |
| Deelgebieden & Leerlijnen settings UI | Frontend (SettingsPage.tsx section 3) | — | Table with text input + select + toggle per row |
| Drempelwaarden & BPV settings UI | Frontend (SettingsPage.tsx section 4) | — | Number inputs + import button |
| DeelgebiedenMatrix filtering | Frontend (DeelgebiedenMatrix.tsx) | Utility layer (getActiveDeelgebieden) | Must read active config and filter DEELGEBIEDEN + GROEPEN |
| SpiderChartCard axis filtering | Frontend (SpiderChartCard.tsx) | Utility layer (getActiveDeelgebieden) | Filters axes by active deelgebieden in group |
| BPV progress section | Frontend (DetailWeergave.tsx + BpvProgressSection.tsx) | Utility layer (bpv.ts) | New component mirroring VerzuimSection layout |
| BPV Excel import | Frontend (ImportPage.tsx or SettingsPage trigger) | Tauri file dialog | Separate from verzuim Excel; parser task gated on sample file |
| CSS section 25 | Browser / CSS layer | — | All new Phase 18 classes added after section 24 |

---

## Standard Stack

### Core (all already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.6 | Component model | Project standard since Phase 14 |
| @tauri-apps/plugin-store | ^2.4.3 | All new config persistence | Same store.json, same LazyStore pattern |
| TypeScript | ^5.x | All new modules | Project mandate; all new files in .ts / .tsx |

[VERIFIED: package.json — confirmed from Phase 17 RESEARCH.md and project STATE.md]

**No new dependencies required.** Phase 18 is zero-install.

---

## Architecture Patterns

### System Architecture Diagram

```
User interaction (SettingsPage)
        |
        v
Handler (blur/Enter/onChange)
        |
        +--> updateInMemoryConfig()      <- instant UI feedback
        |
        +--> store.set(key, value)
        |    store.save()                <- plugin-store flush (CRITICAL: must pair)
        |
        v
Config cache invalidated
        |
        v
Downstream consumers re-read config on next render:
  - berekenStatus(student, traject, thresholds)   <- verzuim thresholds
  - berekenPrognose(student, traject, activeDGs)  <- active deelgebieden filter
  - DeelgebiedenMatrix(getActiveDeelgebieden())   <- matrix row filter
  - SpiderChartCard(getActiveDeelgebieden())      <- axis filter
  - BpvProgressSection(bpvConfig, bpvData)        <- progress bar
```

### Recommended Project Structure

```
utils/
├── deelgebieden.ts     # NEW: getDeelgebiedenConfig, saveDeelgebiedenConfig, resetDeelgebiedenConfig
├── verzuimDrempels.ts  # NEW: getVerzuimDrempels, saveVerzuimDrempels (defaults: {geoorloofd:900, ongeoorloofd:600})
├── bpv.ts              # NEW: getBpvConfig, saveBpvConfig, getBpvData, saveBpvData
├── leerlijnen.ts       # EXISTING: no changes to API; UI now edits this via SettingsPage
├── prognosis.ts        # MODIFIED: berekenPrognose gains activeDeelgebieden param; sync mapping lookup fix
└── schema.ts           # UNCHANGED: DEELGEBIEDEN remains source of truth / reset target

src/utils/
└── status.ts           # MODIFIED: berekenStatus gains threshold params (geoorloofd?, ongeoorloofd?)

src/components/
├── SettingsPage.tsx              # MODIFIED: sections 3 & 4 filled in
├── DeelgebiedenMatrix.tsx        # MODIFIED: filter by getActiveDeelgebieden()
├── SpiderChartCard.tsx           # MODIFIED: filter axes by active deelgebieden in group
├── DetailWeergave.tsx            # MODIFIED: add BpvProgressSection after VerzuimSection
└── BpvProgressSection.tsx        # NEW: progress bar + stats, mirrors VerzuimSection layout

src/index.css                     # MODIFIED: add section 25 (Phase 18 CSS classes)
```

### Pattern 1: LazyStore Persistence (replicate from leerlijnen.ts)

**What:** A module-level `LazyStore` instance, an in-memory cache variable (null = unloaded), get/save/reset exported functions.

**When to use:** All three new store keys (`'deelgebieden_config'`, `'verzuim_drempels'`, `'bpv_config'`, `'bpv_data'`).

```typescript
// Source: utils/leerlijnen.ts (VERIFIED from codebase read)
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const STORE_KEY = 'deelgebieden_config';
let _cache: DeelgebiedConfig[] | null = null;

export async function getDeelgebiedenConfig(): Promise<DeelgebiedConfig[]> {
  if (_cache !== null) return _cache;
  const stored = await store.get<string>(STORE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (isValid(parsed)) { _cache = parsed; return _cache; }
  }
  _cache = buildDefault(); // from DEELGEBIEDEN in schema.ts
  return _cache;
}

export async function saveDeelgebiedenConfig(config: DeelgebiedConfig[]): Promise<boolean> {
  try {
    await store.set(STORE_KEY, JSON.stringify(config));
    await store.save(); // CRITICAL: set() is in-memory only
    _cache = null;      // invalidate cache
    return true;
  } catch (e) {
    console.warn('[deelgebieden.ts] write error:', e);
    return false;
  }
}
```

### Pattern 2: berekenStatus with Runtime Thresholds

**What:** `berekenStatus()` accepts optional threshold parameters so callers can pass runtime-loaded config without breaking existing call sites (backward-compatible defaults).

**When to use:** Replace the hardcoded `VERZUIM_DREMPEL_MIN = 600`.

```typescript
// Source: src/utils/status.ts (VERIFIED from codebase read)
// CURRENT (to be replaced):
const VERZUIM_DREMPEL_MIN = 600; // hardcoded

// PROPOSED signature change:
export function berekenStatus(
  student: any,
  traject?: string,
  thresholds?: { geoorloofd: number; ongeoorloofd: number }
): StatusResult {
  const geoorloofdrempel  = thresholds?.geoorloofd   ?? 900;  // default 15u = 900 min
  const ongeoorloofdrempel = thresholds?.ongeoorloofd ?? 600;  // default 10u = 600 min
  const ongeoorloofd = student.verzuim?.ongeoorloofd ?? 0;
  const geoorloofd   = student.verzuim?.geoorloofd   ?? 0;
  // ... rest of logic unchanged
  if (ongeoorloofd > ongeoorloofdrempel || geoorloofd > geoorloofdrempel)
    return { kleur: 'oranje', label: 'Verzuim', prognose: p };
  // ...
}
```

NOTE: `VerzuimSection.tsx` line 43 also has a hardcoded `> 600` check for the high-verzuim style. That check must also use the runtime threshold (passed as prop or read from config).

### Pattern 3: berekenPrognose Active Deelgebieden Filter

**What:** `berekenPrognose()` gains an optional `activeDeelgebieden: string[]` parameter (array of active deelgebied IDs). When provided, `telLeerlijnen()` and the norm checks filter out inactive items.

**Critical pre-condition:** The current call to `getLeerlijnenMapping()` at prognosis.ts line 59 is **synchronous** but the function is **async**. The current code works accidentally — because the in-memory cache `_cachedMapping` is returned synchronously when it has been pre-loaded (by a prior `getLeerlijnenMapping()` await call elsewhere). Phase 18 must either:

- Option A (preferred): pre-load the mapping at app startup and expose a synchronous cache accessor `getLeerlijnenMappingSync()` that returns the cached value or throws if not yet loaded.
- Option B: make `berekenPrognose()` async and update all callers.

Option A is strongly preferred because `berekenStatus()` calls `berekenPrognose()` synchronously in many render paths, and making the entire status calculation async would require significant refactoring of `KlasOverzicht`, `LeerlingTegel`, and `DoortstroomPrognoseSection`.

```typescript
// Proposed: add synchronous cache accessor to leerlijnen.ts
export function getLeerlijnenMappingSync(): Record<string, string> {
  if (_cachedMapping === null) {
    // Fallback to schema defaults if not yet loaded
    return buildDefault();
  }
  return _cachedMapping;
}

// Proposed: berekenPrognose signature
export function berekenPrognose(
  student: any,
  traject?: string,
  activeDeelgebiedenIds?: string[]
): any {
  // Filter DEELGEBIEDEN to active only
  const activeDGs = activeDeelgebiedenIds
    ? DEELGEBIEDEN.filter(dg => activeDeelgebiedenIds.includes(dg.id))
    : DEELGEBIEDEN;
  // telLeerlijnen and norm checks use activeDGs instead of DEELGEBIEDEN
}
```

### Pattern 4: Inline Confirmation Pattern (Herstel standaard)

**What:** No modal. When the user clicks "Herstel standaard", the button is replaced in-place with a confirmation row. Controlled by a boolean React state variable (`confirmingReset`).

**When to use:** The "Herstel standaard" button in section 3.

```typescript
// Controlled by: const [confirmingReset, setConfirmingReset] = useState(false);
{!confirmingReset ? (
  <button className="btn btn-ghost" onClick={() => setConfirmingReset(true)}>
    Herstel standaard
  </button>
) : (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
      Alles terugzetten naar standaard?
    </span>
    <button className="btn btn-ghost" onClick={() => setConfirmingReset(false)}>
      Niet herstellen
    </button>
    <button className="btn btn-primary" onClick={handleReset}>
      Ja, herstel
    </button>
  </div>
)}
```

### Pattern 5: Active Deelgebieden Config Shape

**What:** The `'deelgebieden_config'` store key holds the full config array — one entry per deelgebied, regardless of active/inactive state.

Per D-15 (locked): `Array<{ id: string, label: string, active: boolean }>`.

- `id`: matches `Deelgebied.id` from schema.ts (`'va'`, `'mm'`, etc.)
- `label`: the user-edited name (default = `Deelgebied.label`)
- `active`: boolean (default = `true`)

The `getDeelgebiedenConfig()` function builds the default from `DEELGEBIEDEN` with `active: true` for all items.

The leerlijn assignment remains in `'leerlijnen'` (separate key, existing `saveLeerlijnenMapping`). The SettingsPage table row has both: the deelgebied label/active fields from `'deelgebieden_config'` and the leerlijn dropdown from `'leerlijnen'`.

### Anti-Patterns to Avoid

- **Calling `getLeerlijnenMapping()` without await:** The current code in `prognosis.ts` calls it synchronously — this is a latent bug. Phase 18 must use a synchronous cache accessor pattern. Do not call the async function without await in new code.
- **Calling `store.set()` without `store.save()`:** The Phase 12 pitfall. Every mutation must pair `set` + `save`. Failing to call `save()` leaves changes in memory only — they are lost on app restart.
- **Deleting deelgebied scores when marking inactive:** D-04 is locked — scores are preserved. The inactive state only filters display and calculation. Never delete student score data.
- **Reading store on every render:** Use in-memory cache (null = not loaded, object = loaded). Async store reads in the render path cause race conditions and flickering.
- **Mutating DEELGEBIEDEN from schema.ts:** The schema array is a compile-time constant and the reset target. Never mutate it. Runtime config lives in the store only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config persistence to disk | Custom file write | `LazyStore('store.json')` from `@tauri-apps/plugin-store` | Already handles flush semantics, JSON encode, and file locking |
| Toggle switch component | New CSS toggle | `.toggle-switch` / `.toggle-track` / `.toggle-thumb` from section 24 | Same classes used in Phase 17 dark mode — Phase 18 adds `.dg-toggle` size override only |
| Inline confirmation dialog | Custom modal or library | `useState(false)` + conditional JSX | Pattern is 3 lines of state + conditional render; no library needed |
| Progress bar for BPV | SVG or canvas | CSS `width` on a `div` inside a track div | VerzuimSection already has the segment-bar pattern; BPV uses a simpler single-fill bar |
| Number input validation | Custom validation library | `min`/`max`/`step` attributes + blur revert | Silent clamp on blur matches UI-SPEC; no visible error state needed |

---

## Critical Code Discoveries

### 1. CRITICAL: `getLeerlijnenMapping()` is Called Synchronously in `berekenPrognose()`

**Location:** `utils/prognosis.ts` line 59: `const mapping = getLeerlijnenMapping();`

**Problem:** `getLeerlijnenMapping()` is declared `async` and returns `Promise<Record<string, string>>`. The call without `await` returns a Promise object, not the mapping. The code uses `mapping[dg.id]` on a Promise, which evaluates to `undefined` for all keys. The fallback `|| dg.group` (prognosis.ts line 64) then covers it, effectively using schema defaults always.

**Current behavior:** The app works correctly only because:
1. The in-memory `_cachedMapping` is populated before `berekenPrognose()` is called (via a prior `getLeerlijnenMapping()` await call in some component mount)
2. BUT: if the cache is cold (null), `_cachedMapping = null` causes the function to return a Promise, and the sync read fails silently

**Phase 18 fix:** Add `getLeerlijnenMappingSync()` to `utils/leerlijnen.ts` that returns the cache or builds default synchronously. Update `prognosis.ts` to call this sync version.

[VERIFIED: codebase read of utils/leerlijnen.ts and utils/prognosis.ts]

### 2. `DeelgebiedenMatrix.tsx` Uses DEELGEBIEDEN Directly

**Location:** `src/components/DeelgebiedenMatrix.tsx` lines 11-15, 61-65.

The component imports `DEELGEBIEDEN` from schema and uses it to build `groepDG` and `allDG`. No external config lookup. Phase 18 must add a config load (via `getDeelgebiedenConfig()`) and filter `DEELGEBIEDEN` by `active: true` before building the groups.

The GROEPEN constant (lines 11-15) is hardcoded with fixed leerlijn keys `'lesgeven'`, `'organiseren'`, `'prof_handelen'`. These group headers do not need to change — only the deelgebied items within each group are filtered by active state.

[VERIFIED: codebase read of DeelgebiedenMatrix.tsx]

### 3. `SpiderChartCard.tsx` Uses DEELGEBIEDEN Directly

**Location:** `src/components/SpiderChartCard.tsx` lines 15-17.

The component filters `DEELGEBIEDEN` by `dg.group === group` to build axes. Phase 18 must also filter by active state. The axes use `dg.label` as key (note: CRITICAL comment in source — "use dg.label (not dg.id) as key to match deelgebiedScores storage format"). This label key must match what is stored in `deelgebiedScores`. When a user renames a deelgebied, the renamed label in `deelgebieden_config` must be used as the axis key AND the scores are still keyed by the original schema label in student data.

**Resolution:** The spider chart should use the original `dg.label` from schema for the score key lookup (student scores are indexed by schema label, not custom label). The display label can be the custom name from config. This means `SpiderChartCard` needs to receive both the original label (for score lookup) and the display label (for rendering).

[VERIFIED: codebase read of SpiderChartCard.tsx and DEELGEBIEDEN schema]

### 4. `VerzuimSection.tsx` Also Has Hardcoded `> 600` Check

**Location:** `src/components/VerzuimSection.tsx` line 43: `const ongeoorloofdhoogVerzuim = (v.ongeoorloofd || 0) > 600;`

This controls the red bold styling for the ongeoorloofd value. Phase 18 should update this to use the runtime threshold. The VerzuimSection component must receive the threshold as a prop from DetailWeergave.

[VERIFIED: codebase read of VerzuimSection.tsx]

### 5. `berekenStatus()` Signature and Current Logic

**Full current signature:** `berekenStatus(student: any, traject?: string): StatusResult`

**Return chain** (status.ts lines 121-132):
1. No scores → grijs / Onbekend
2. negatief prognose → rood / Risico
3. neutraal prognose → oranje / Let op
4. ongeoorloofd > 600 min → oranje / Verzuim  ← **threshold to replace**
5. sbc → blauw / Profieljaar SBC
6. sbl → groen / Op koers
7. versneld_sbc → blauw / Versneld SBC
8. naar_bj2 → groen / Op koers BJ2
9. fallback → groen / Op koers

**D-08 adds:** geoorloofd threshold check. Must decide where in the chain the geoorloofd check sits. Based on D-08 ("both thresholds affect tile status"), insert the geoorloofd check at step 4 alongside ongeoorloofd.

[VERIFIED: codebase read of src/utils/status.ts]

### 6. `SettingsPage.tsx` Section 3 & 4 Placeholders

**Location:** `src/components/SettingsPage.tsx` lines 93-103.

Section 3 (line 95): `<p className="settings-placeholder-text">Komt in een volgende versie.</p>`
Section 4 (line 100): `<p className="settings-placeholder-text">Komt in een volgende versie.</p>`

Both sections already use `<section className="detail-section">` with `<h2 className="detail-section-title">`. Phase 18 replaces the `<p>` placeholders only — the section wrappers are already correct.

[VERIFIED: codebase read of SettingsPage.tsx]

### 7. State Management Pattern in SettingsPage

`SettingsPage.tsx` uses local `useState` hooks (no React context, no global store). Phase 18 follows the same pattern — local state per section. Config is loaded from plugin-store on mount and written on each change. No shared React context is needed because:
- `DeelgebiedenMatrix` and `SpiderChartCard` read config from utility functions on render
- `berekenPrognose` receives active deelgebieden as a parameter from the caller
- `berekenStatus` receives thresholds as optional parameters from the caller

The caller chain for thresholds: config is loaded in `KlasOverzicht` / `DetailWeergave` (wherever `berekenStatus` is called) and passed as a parameter. Alternatively, a module-level sync cache in `utils/verzuimDrempels.ts` (same pattern as leerlijnen sync cache) avoids prop drilling.

**Recommendation (Claude's discretion):** Use a synchronous cache accessor for verzuim thresholds (same pattern as getLeerlijnenMappingSync) so `berekenStatus()` can read the threshold without prop drilling through multiple component layers.

### 8. `DetailWeergave.tsx` — Insertion Point for BPV Section

**Current section order** (DetailWeergave.tsx lines 118-170):
1. DoortstroomPrognoseSection
2. AanvullendSection
3. StageSection
4. FeedbackActiepuntenSection
5. LeerlijnenSection
6. SpiderChartCard row
7. DeelgebiedenMatrix
8. **VerzuimSection** ← BPV section goes AFTER this (per UI-SPEC)
9. VakkenSection
10. NotitiesTextarea

BPV section inserts after VerzuimSection (between sections 8 and 9).

[VERIFIED: codebase read of DetailWeergave.tsx]

### 9. App.tsx — No Changes Needed for Phase 18

`App.tsx` already wires the `'settings'` view, `SettingsPage`, and all callbacks. Phase 18 does not require changes to `App.tsx` routing — the settings page already renders. However, if thresholds are passed as props through the render tree, `App.tsx` may need to load config and pass it down. The synchronous cache approach avoids this.

[VERIFIED: codebase read of App.tsx]

---

## Common Pitfalls

### Pitfall 1: `store.set()` Without `store.save()` (Phase 12 Pitfall — Repeat Risk)
**What goes wrong:** Config changes appear to work during the session but are lost on app restart.
**Why it happens:** `LazyStore.set()` is in-memory only. `save()` flushes to disk.
**How to avoid:** Every mutation handler must call `await store.set(key, value)` then `await store.save()`.
**Warning signs:** Settings persist within a session but reset after closing and reopening the app.

### Pitfall 2: Synchronous Call of Async `getLeerlijnenMapping()`
**What goes wrong:** When the cache is cold, `berekenPrognose()` gets a Promise object instead of the mapping, and all leerlijn group assignments fall through to schema defaults.
**Why it happens:** `getLeerlijnenMapping()` is async but called without await at prognosis.ts line 59.
**How to avoid:** Add and use `getLeerlijnenMappingSync()` that reads `_cachedMapping` or returns `buildDefault()`. Pre-warm the cache at app startup.
**Warning signs:** Leerlijn changes in settings appear to have no effect on prognose output.

### Pitfall 3: Deelgebied Custom Label vs. Score Storage Key Mismatch
**What goes wrong:** Student scores are stored with the original schema label as key (e.g., `'V&A'`). If the component uses the user-renamed label to look up scores, all scores will be null.
**Why it happens:** `deelgebiedScores` is a flat object keyed by the original `dg.label` from the time of PDF import — the schema label, not any custom name.
**How to avoid:** Always use the original schema `dg.label` for score lookups. Use the custom label only for display purposes. Pass both to components that need to render AND look up scores.
**Warning signs:** SpiderChartCard shows no scores for renamed deelgebieden.

### Pitfall 4: Missing `active: false` Deelgebieden in Cache
**What goes wrong:** If `getDeelgebiedenConfig()` only returns active items, components that reset to default lose inactive state information.
**Why it happens:** The config array must hold all 19 entries — active and inactive — so that reactivating a deelgebied is possible and so "Herstel standaard" has the full picture to reset.
**How to avoid:** The stored config always contains all 19 entries. Active filtering happens at query time in a helper like `getActiveDGIds()`.

### Pitfall 5: React State Refresh After Async Store Write
**What goes wrong:** Instant-apply doesn't feel instant because the component waits for the async store write before updating the UI.
**Why it happens:** Mixing async store writes with synchronous React state updates.
**How to avoid:** Update React state (and the in-memory cache) first, then fire the async store write in the background. The store write failure path should show a console warning — the UI should not block on it.

### Pitfall 6: GROEPEN Constant in DeelgebiedenMatrix is Hardcoded
**What goes wrong:** If leerlijn assignment changes so a deelgebied belongs to a different group, the matrix column grouping doesn't update because GROEPEN (the column headers) is a local constant.
**Why it happens:** GROEPEN in `DeelgebiedenMatrix.tsx` is `const GROEPEN = [{ key: 'lesgeven' ... }]` — not derived from the leerlijn mapping.
**How to avoid:** The matrix groups (Lesgeven / Organiseren / Prof. handelen) are fixed column headers per the UI — only which deelgebieden appear in each column changes. Filter each group's deelgebieden using the runtime leerlijn mapping, not the schema `dg.group`. The `groepDG` calculation must use `getLeerlijnenMappingSync()` to assign deelgebieden to groups.

---

## Code Examples

### DeelgebiedenConfig TypeScript Interface

```typescript
// Source: CONTEXT.md D-15 (locked decision) + schema.ts pattern
export interface DeelgebiedConfig {
  id:     string;   // matches Deelgebied.id from schema.ts ('va', 'mm', ...)
  label:  string;   // display label — may differ from schema default
  active: boolean;  // false = hidden in matrix/spider/prognose
}

// Helper: derive active IDs list for berekenPrognose parameter
export function getActiveDGIds(config: DeelgebiedConfig[]): string[] {
  return config.filter(c => c.active).map(c => c.id);
}

// Helper: build config from schema defaults (all active, original labels)
export function buildDefaultDeelgebiedenConfig(): DeelgebiedConfig[] {
  return DEELGEBIEDEN.map(dg => ({ id: dg.id, label: dg.label, active: true }));
}
```

### Verzuim Thresholds TypeScript Interface

```typescript
// Source: CONTEXT.md D-16 (locked decision)
export interface VerzuimDrempels {
  geoorloofd:   number; // minutes; default 900 (15u)
  ongeoorloofd: number; // minutes; default 600 (10u)
}

export const DEFAULT_VERZUIM_DREMPELS: VerzuimDrempels = {
  geoorloofd:   900, // 15u × 60
  ongeoorloofd: 600, // 10u × 60 — preserves existing VERZUIM_DREMPEL_MIN
};
```

### BPV Config and Data TypeScript Interfaces

```typescript
// Source: CONTEXT.md D-17 + UI-SPEC (200u default)
export interface BpvConfig {
  verwachteUren: number; // expected BPV hours per period, default 200
}

export interface BpvStudentData {
  [leerlingId: string]: {
    gerealiseerdeUren: number; // actual hours from BPV Excel
  };
}
```

### Section 25 CSS (new in Phase 18)

New CSS section to add at the end of `src/index.css` after section 24:

```css
/* --------------------------------------------------------------------------
   25. SettingsPage Phase 18 — Deelgebieden & Drempelwaarden
   -------------------------------------------------------------------------- */
.dg-settings-table-wrap {
  max-height: 420px;
  overflow-y: auto;
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
}
.dg-settings-table {
  width: 100%;
  border-collapse: collapse;
}
.dg-settings-row {
  border-bottom: 1px solid var(--border-light);
  font-size: 0.875rem;
}
.dg-settings-row:last-child { border-bottom: none; }
.dg-settings-row:nth-child(even) td { background: var(--bg-surface-alt); }
.dg-settings-row:nth-child(odd)  td { background: var(--bg-surface); }
.dg-settings-row:hover td { background: var(--accent-light) !important; transition: background var(--transition-fast); }

.dg-naam-input {
  width: 100%;
  padding: 4px 8px;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-primary);
  transition: border-color var(--transition-base), background var(--transition-base);
}
.dg-naam-input:focus {
  border-color: var(--border-focus);
  background: var(--bg-surface);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
  outline: none;
}

.dg-leerlijn-select {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.875rem;
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
  box-shadow: var(--shadow-xs);
}
.dg-leerlijn-select:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

/* Scaled-down toggle for table context */
.dg-toggle .toggle-track { width: 32px; height: 18px; border-radius: 9px; }
.dg-toggle .toggle-thumb { width: 12px; height: 12px; }
.dg-toggle .toggle-track:not(.on) .toggle-thumb { transform: translateX(2px); }
.dg-toggle .toggle-track.on     .toggle-thumb { transform: translateX(16px); }

.settings-threshold-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.settings-threshold-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.settings-number-input {
  width: 80px;
  padding: 0.5rem;
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.875rem;
  text-align: right;
  box-shadow: var(--shadow-xs);
  outline: none;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}
.settings-number-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.bpv-progress-wrap { display: flex; flex-direction: column; gap: 8px; }
.bpv-bar-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--border-light);
  overflow: hidden;
}
.bpv-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: var(--accent);
  transition: width 300ms ease;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded leerlijn mapping | Plugin-store with LazyStore + migration | Phase 12/11 | Phase 18 just adds UI editor for existing store key |
| Hardcoded `VERZUIM_DREMPEL_MIN = 600` | Must become runtime config in Phase 18 | Phase 18 (this phase) | Small refactor; backward-compatible with default value |
| DEELGEBIEDEN always renders all 19 | Must filter by active config in Phase 18 | Phase 18 (this phase) | DeelgebiedenMatrix + SpiderChartCard both affected |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `getLeerlijnenMapping()` is currently called synchronously in `berekenPrognose()` and this is a latent bug, not intentional design | Critical Code Discoveries §1 | If it was intentional (e.g., cache is always pre-warmed before berekenPrognose is ever called), the fix is still safe because `getLeerlijnenMappingSync()` returns the same cached value |
| A2 | Student `deelgebiedScores` keys are the original schema `dg.label` values, not any custom renamed labels | Critical Code Discoveries §3 | If scores are stored with custom labels, renaming would break score display — but this seems impossible since imports happen before any rename |
| A3 | The BPV Excel parser can be deferred to a separate task gated on the user providing a sample file | Code context §D-13 | If the BPV progress section is expected at launch without import, the empty state handles this gracefully |
| A4 | Adding geoorloofd threshold to the `berekenStatus` check chain does not require changes to `KlasOverzicht` render flow beyond loading the threshold from config | Architecture §berekenStatus | If KlasOverzicht has many call sites for berekenStatus, adding a third parameter may require touching more files |

**If this table is empty:** All claims would be verified — but these four are flagged because they involve runtime behavior that cannot be 100% confirmed from static file reads.

---

## Open Questions (RESOLVED)

All three questions resolved during planning. Resolutions captured below.

1. **BPV Excel file format** (RESOLVED — deferred per D-13)
   - What we know: The user will provide a sample BPV Excel file at parser implementation time (D-13).
   - What's unclear: Column names, whether data is per-row or per-student, date format, etc.
   - Recommendation: Plan the BPV parser task as a separate plan that starts with the user providing the sample. The UI and storage plumbing can be built without it.
   - **Resolution:** Deferred per D-13. Plan 18-02 ships `parseBpvExcel(bytes): BpvData` as a stub returning `{}`. Plan 18-05 wires the import button to call the stub and surface the "Onbekend BPV-bestandsformaat" error copy when parse returns empty. A follow-up phase will implement the real parser once the user provides a sample file. This question is OUT OF SCOPE for Phase 18.

2. **Where to load config for berekenStatus callers** (RESOLVED — internal sync fallback)
   - What we know: `berekenStatus()` is called in `DetailWeergave.tsx` (line 47) and presumably in `KlasOverzicht.tsx` / `LeerlingTegel.tsx`.
   - What's unclear: Whether to use synchronous cache in verzuimDrempels.ts or prop-drill the thresholds from a parent component.
   - Recommendation: Synchronous cache in `utils/verzuimDrempels.ts` (same pattern as getLeerlijnenMappingSync) avoids prop drilling.
   - **Resolution:** Synchronous cache wins. Plan 18-03 Task 2 updates `berekenStatus()` so that when the `thresholds` argument is undefined, the function body calls `getVerzuimDrempelsSync()` internally to resolve defaults. All existing call sites (KlasOverzicht tile, LeerlingTegel, DetailWeergave) automatically pick up runtime thresholds without any prop-drilling or call-site changes. This is the SC-4 wiring path.

3. **DeelgebiedenMatrix leerlijn grouping after SET-04 changes** (RESOLVED — fixed three-column layout, hide empty groups)
   - What we know: The GROEPEN constant in the component hardcodes three group labels.
   - What's unclear: If a user moves all deelgebieden out of one leerlijn into another, should an empty column disappear from the matrix?
   - Recommendation: Keep GROEPEN fixed (three columns always shown); empty groups show an empty column. This avoids dynamic column width changes.
   - **Resolution:** Fixed three-column table layout retained. When all deelgebieden in a leerlijn are toggled off (active=false) OR reassigned to a different leerlijn via SET-04, the column header stays but the empty leerlijn group renders without rows (effectively hidden body). Plan 18-05 Task 2 builds the runtime-mapping-aware `groepDG` so visually-empty groups are tolerated; the table structure does not collapse. This avoids dynamic column width recalculation.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 18 is pure TypeScript/React/CSS with no new external dependencies. The Tauri plugin-store and all other dependencies are already installed and verified in Phase 17.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.x + jsdom + @testing-library/react |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SET-03 | `getDeelgebiedenConfig()` returns defaults (all 19 active) on first call | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ Wave 0 |
| SET-03 | Marking a deelgebied inactive hides it from `getActiveDGIds()` result | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ Wave 0 |
| SET-03 | `resetDeelgebiedenConfig()` restores all 19 to active with schema labels | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ Wave 0 |
| SET-03 | DeelgebiedenMatrix renders only active deelgebieden (smoke, jsdom) | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ Wave 0 |
| SET-04 | `saveLeerlijnenMapping()` persists mapping, invalidates cache | unit | `npm test -- --run tests/leerlijnen.test.ts` | ❌ Wave 0 (extend existing pattern) |
| SET-04 | `getLeerlijnenMappingSync()` returns cache or schema defaults | unit | `npm test -- --run tests/leerlijnen.test.ts` | ❌ Wave 0 |
| SET-04 | `berekenPrognose()` with `activeDeelgebiedenIds` filters calculations correctly | unit | `npm test -- --run tests/prognosis.test.ts` | ❌ extend existing |
| SET-05 | `getVerzuimDrempels()` returns defaults `{geoorloofd:900, ongeoorloofd:600}` on first call | unit | `npm test -- --run tests/verzuimDrempels.test.ts` | ❌ Wave 0 |
| SET-05 | `berekenStatus()` returns oranje/Verzuim when ongeoorloofd exceeds custom threshold | unit | `npm test -- --run tests/status.test.ts` | ❌ extend existing |
| SET-05 | `berekenStatus()` returns oranje/Verzuim when geoorloofd exceeds custom geoorloofd threshold | unit | `npm test -- --run tests/status.test.ts` | ❌ extend existing |
| SET-06 | `getBpvConfig()` returns default `{verwachteUren:200}` on first call | unit | `npm test -- --run tests/bpv.test.ts` | ❌ Wave 0 |
| SET-06 | BPV progress percentage calculated correctly (actual/expected × 100) | unit | `npm test -- --run tests/bpv.test.ts` | ❌ Wave 0 |
| SET-06 | BPV section renders empty state when no data imported | unit | `npm test -- --run tests/bpv.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run` (full suite, ~43 tests currently)
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/deelgebieden.test.ts` — covers SET-03 config persistence and active filter
- [ ] `tests/verzuimDrempels.test.ts` — covers SET-05 threshold defaults and persistence
- [ ] `tests/bpv.test.ts` — covers SET-06 config defaults and progress calculation
- [ ] `tests/leerlijnen.test.ts` — extend existing pattern to add `getLeerlijnenMappingSync()` tests
- [ ] Extend `tests/status.test.ts` — add `berekenStatus()` threshold parameter tests
- [ ] Extend `tests/prognosis.test.ts` — add `berekenPrognose()` active deelgebieden filter tests

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | not applicable (local desktop app) |
| V3 Session Management | no | not applicable |
| V4 Access Control | no | not applicable (single user) |
| V5 Input Validation | yes (partial) | Number inputs: `min`/`max` attrs + silent clamp on blur; text inputs: revert to previous value on empty blur |
| V6 Cryptography | no | BPV data is non-personal aggregate hours; does not need encryption per D-17 (follows leerlijnen.ts precedent of plain JSON) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via custom deelgebied name rendered as HTML | Tampering | React JSX escapes all string values by default; never use `dangerouslySetInnerHTML` with user-entered labels |
| BPV Excel with malformed content crashing parser | Denial of service | Wrap parser in try/catch; show inline error copy from UI-SPEC; do not propagate exceptions to React render |
| Threshold inputs accepting negative or extreme values | Tampering | `min="0"` on number input + silent clamp on blur; stored minutes value clamped before writing to store |

---

## Sources

### Primary (HIGH confidence)

- Codebase reads of `utils/schema.ts`, `utils/leerlijnen.ts`, `utils/settings.ts`, `utils/prognosis.ts`, `src/utils/status.ts`, `src/components/SettingsPage.tsx`, `src/components/DeelgebiedenMatrix.tsx`, `src/components/SpiderChartCard.tsx`, `src/components/DetailWeergave.tsx`, `src/components/VerzuimSection.tsx`, `src/App.tsx`, `src/index.css` — all VERIFIED from actual file contents
- `.planning/phases/18-settings-panel-advanced/18-CONTEXT.md` — locked decisions D-01 through D-17
- `.planning/phases/18-settings-panel-advanced/18-UI-SPEC.md` — visual + interaction contract
- `.planning/phases/17-settings-panel-foundation/17-CONTEXT.md` — LazyStore and instant-apply patterns
- `.planning/phases/17-settings-panel-foundation/17-RESEARCH.md` — Phase 17 research (standard stack, plugin-store versions)
- `.planning/REQUIREMENTS.md` — SET-03 through SET-06 formal requirements

### Secondary (MEDIUM confidence)

- `tests/SettingsPage.test.tsx` — LazyStore mock pattern (ES6 class, shared storeMap) — VERIFIED from test file
- `tests/status.test.ts` — existing test patterns for berekenStatus — VERIFIED from test file
- `.planning/STATE.md` accumulated decisions — plugin-store pitfalls confirmed

### Tertiary (LOW confidence — none)

All claims in this research were verified from actual codebase files or locked context documents.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies; all packages verified from previous phase
- Architecture: HIGH — all integration points verified from actual component source code
- Pitfalls: HIGH — sync/async bug and hardcoded values verified from actual source code
- BPV parser: LOW — format unknown per D-13; explicitly deferred to implementation time

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (stable codebase — re-research only if major refactor lands before planning)
