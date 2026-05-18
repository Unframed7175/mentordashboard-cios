# Phase 18: Settings Panel Advanced - Research

**Researched:** 2026-05-18 (force-refresh)
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
| SET-03 | Mentor kan in de settings de 19 deelgebieden hernoemen of individueel inactief zetten (inactieve deelgebieden worden verborgen in matrix en prognose) | D-01, D-02, D-15 lock persistence; `DEELGEBIEDEN` array in `utils/schema.ts` is the source of truth (19 items verified); `DeelgebiedenMatrix.tsx` uses DEELGEBIEDEN directly at lines 62-63 and must filter by active config |
| SET-04 | Mentor kan in de settings de leerlijn-toewijzing aanpassen — welk deelgebied valt onder lesgeven / organiseren / professioneel handelen | D-01 combines SET-04 with SET-03 table; existing `saveLeerlijnenMapping` / `getLeerlijnenMapping` pattern reused; `berekenPrognose` calls `getLeerlijnenMapping()` synchronously at line 59 (CRITICAL BUG: verified in codebase) |
| SET-05 | Mentor kan aparte drempelwaarden instellen voor verzuim-signalering: apart voor geoorloofd en ongeoorloofd verzuim | D-08 through D-10 lock threshold storage; `VERZUIM_DREMPEL_MIN = 600` at `src/utils/status.ts` line 15 verified; `VerzuimSection.tsx` also has hardcoded `> 600` at line 43 (verified) |
| SET-06 | Mentor kan het verwachte aantal BPV-uren per periode configureren (gebruikt voor voortgangsindicatie) | D-11 through D-17 lock the full BPV feature; BPV section in DetailWeergave inserts after VerzuimSection (between current sections 8 and 9, verified); BPV Excel parser deferred to implementation time |

</phase_requirements>

---

## Execution Status: Plans Exist, No Code Executed Yet

**IMPORTANT for planning:** The phase already has 5 PLAN.md files created. None of the new utility modules have been written yet.

| File | Expected By | Status |
|------|-------------|--------|
| `utils/deelgebieden.ts` | Plan 18-02 | NOT EXISTS — not yet created |
| `utils/verzuimDrempels.ts` | Plan 18-02 | NOT EXISTS — not yet created |
| `utils/bpv.ts` | Plan 18-02 | NOT EXISTS — not yet created |
| `tests/deelgebieden.test.ts` | Plan 18-01 | NOT EXISTS — not yet created |
| `tests/verzuimDrempels.test.ts` | Plan 18-01 | NOT EXISTS — not yet created |
| `tests/bpv.test.ts` | Plan 18-01 | NOT EXISTS — not yet created |
| `tests/leerlijnen.test.ts` | Plan 18-01 | NOT EXISTS — not yet created |

[VERIFIED: filesystem checks confirmed all seven files absent]

The existing plan structure (Plans 18-01 through 18-05) remains valid. The research below confirms those plans accurately describe what needs to be done, with corrections noted where the current research differs from the previous research pass.

---

## Summary

Phase 18 fills in the two placeholder sections in `SettingsPage.tsx` (sections 3 and 4) that were left as "Komt in een volgende versie" stubs in Phase 17. It delivers four interlocked features across the settings UI, the prognose engine, and the DetailWeergave component.

**Critical bug confirmed:** `berekenPrognose()` at `utils/prognosis.ts` line 59 calls `getLeerlijnenMapping()` without `await`. This is verified from the current codebase — the call `const mapping = getLeerlijnenMapping();` returns a Promise object. The current code works only because the in-memory cache `_cachedMapping` is pre-populated before `berekenPrognose()` is first called in practice. Phase 18 must fix this while also adding the `activeDeelgebieden` filter parameter. The fix is to add `getLeerlijnenMappingSync()` to `utils/leerlijnen.ts`.

**Hardcoded verzuim constant confirmed:** `src/utils/status.ts` line 15 has `const VERZUIM_DREMPEL_MIN = 600;` used at line 124. `VerzuimSection.tsx` line 43 has a separate hardcoded `> 600` check. Both must be replaced with runtime values from `getVerzuimDrempelsSync()`.

**`main.tsx` pre-warm:** The current `src/main.tsx` pre-warms `loadKlassen()` and `loadSettings()` before React renders. Plan 18-02 adds pre-warm calls for the four new sync caches. The startup sequence pattern is confirmed correct from the current file.

**No new dependencies:** Phase 18 is zero-install. All needed libraries are already present.

**Primary recommendation:** Execute the 5 existing plans in wave order — Plan 18-01 (test stubs), Plan 18-02 (utility modules + startup pre-warm), Plans 18-03 and 18-04 (engine refactor + settings UI, parallel wave 2), Plan 18-05 (component wiring + BPV section, wave 3).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deelgebied config persistence | Utility layer (utils/deelgebieden.ts) | Tauri plugin-store (disk) | Mirrors leerlijnen.ts pattern; LazyStore key `'deelgebieden_config'` |
| Leerlijn assignment (SET-04) | Utility layer (utils/leerlijnen.ts) | SettingsPage UI | Existing saveLeerlijnenMapping; UI adds editor for existing data |
| Verzuim threshold persistence | Utility layer (utils/verzuimDrempels.ts) | Tauri plugin-store | New key `'verzuim_drempels'`; follows settings.ts pattern |
| BPV config persistence | Utility layer (utils/bpv.ts) | Tauri plugin-store | Keys `'bpv_config'` + `'bpv_data'`; same LazyStore pattern |
| Prognose active-filter | Backend logic (utils/prognosis.ts) | — | berekenPrognose must receive active deelgebied list; no UI coupling |
| Verzuim status with thresholds | Backend logic (src/utils/status.ts) | — | berekenStatus gains optional threshold params + internal sync fallback |
| Deelgebieden & Leerlijnen settings UI | Frontend (SettingsPage.tsx section 3) | — | Table with text input + select + toggle per row |
| Drempelwaarden & BPV settings UI | Frontend (SettingsPage.tsx section 4) | — | Number inputs + import button |
| DeelgebiedenMatrix filtering | Frontend (DeelgebiedenMatrix.tsx) | Utility layer (getActiveDeelgebieden) | Must read active config and filter DEELGEBIEDEN + GROEPEN |
| SpiderChartCard axis filtering | Frontend (SpiderChartCard.tsx) | Utility layer (getActiveDeelgebieden) | Filters axes by active deelgebieden in group |
| BPV progress section | Frontend (DetailWeergave.tsx + BpvProgressSection.tsx) | Utility layer (bpv.ts) | New component mirroring VerzuimSection layout |
| BPV Excel import | Frontend (SettingsPage.tsx trigger) | Tauri file dialog | Separate from verzuim Excel; parser task gated on sample file |
| CSS section 25 | Browser / CSS layer | — | All new Phase 18 classes added after section 24 (confirmed: section 24 ends at line ~1063 in index.css) |

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
  - berekenStatus(student, traject)        <- reads getVerzuimDrempelsSync() internally
  - berekenPrognose(student, traject, activeDGs)  <- active deelgebieden filter
  - DeelgebiedenMatrix(getActiveDeelgebieden())   <- matrix row filter
  - SpiderChartCard(getActiveDeelgebieden())      <- axis filter
  - BpvProgressSection(bpvConfig, bpvData)        <- progress bar
```

### Recommended Project Structure

```
utils/
├── deelgebieden.ts     # NEW: getDeelgebiedenConfig, getDeelgebiedenConfigSync, saveDeelgebiedenConfig, resetDeelgebiedenConfig
├── verzuimDrempels.ts  # NEW: getVerzuimDrempels, getVerzuimDrempelsSync, saveVerzuimDrempels (defaults: {geoorloofd:900, ongeoorloofd:600})
├── bpv.ts              # NEW: getBpvConfig, saveBpvConfig, getBpvData, saveBpvData
├── leerlijnen.ts       # MODIFIED: add getLeerlijnenMappingSync(); no other API changes
├── prognosis.ts        # MODIFIED: berekenPrognose gains activeDeelgebiedenIds param; internal getLeerlijnenMappingSync() fix
└── schema.ts           # UNCHANGED: DEELGEBIEDEN remains source of truth / reset target

src/utils/
└── status.ts           # MODIFIED: VERZUIM_DREMPEL_MIN removed; berekenStatus gains optional thresholds param; internal getVerzuimDrempelsSync() fallback

src/components/
├── SettingsPage.tsx              # MODIFIED: sections 3 & 4 filled in
├── DeelgebiedenMatrix.tsx        # MODIFIED: filter by getDeelgebiedenConfigSync(), use getLeerlijnenMappingSync()
├── SpiderChartCard.tsx           # MODIFIED: filter axes by active deelgebieden in group
├── VerzuimSection.tsx            # MODIFIED: hardcoded > 600 replaced with getVerzuimDrempelsSync()
├── DetailWeergave.tsx            # MODIFIED: add BpvProgressSection after VerzuimSection (line ~164)
└── BpvProgressSection.tsx        # NEW: progress bar + stats, mirrors VerzuimSection layout

src/main.tsx                      # MODIFIED: add pre-warm for deelgebieden, verzuimDrempels, bpv caches
src/index.css                     # MODIFIED: add section 25 after current section 24 (line ~1005)

tests/
├── deelgebieden.test.ts          # NEW (Wave 0)
├── verzuimDrempels.test.ts       # NEW (Wave 0)
├── bpv.test.ts                   # NEW (Wave 0)
└── leerlijnen.test.ts            # NEW (Wave 0) — adds getLeerlijnenMappingSync tests
```

### Pattern 1: LazyStore Persistence (replicate from leerlijnen.ts)

**What:** A module-level `LazyStore` instance, an in-memory cache variable (null = unloaded), async get/save/reset exported functions, and a synchronous accessor that returns the cached value or builds the default.

**When to use:** All three new store keys (`'deelgebieden_config'`, `'verzuim_drempels'`, `'bpv_config'`, `'bpv_data'`).

```typescript
// Source: utils/leerlijnen.ts (VERIFIED from codebase read — lines 14, 17, 44-69)
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
  _cache = buildDefaultDeelgebiedenConfig();
  return _cache;
}

// Synchronous accessor — returns cache or schema defaults; never a Promise
export function getDeelgebiedenConfigSync(): DeelgebiedConfig[] {
  if (_cache !== null) return _cache;
  return buildDefaultDeelgebiedenConfig();
}

export async function saveDeelgebiedenConfig(config: DeelgebiedConfig[]): Promise<boolean> {
  try {
    _cache = config;           // update cache first for instant-apply
    await store.set(STORE_KEY, JSON.stringify(config));
    await store.save();        // CRITICAL: set() is in-memory only
    return true;
  } catch (e) {
    console.warn('[deelgebieden.ts] write error:', e);
    return false;
  }
}
```

### Pattern 2: berekenStatus with Runtime Thresholds

**What:** `berekenStatus()` removes the hardcoded constant and instead calls `getVerzuimDrempelsSync()` internally when no `thresholds` argument is passed. This preserves backward-compatibility for all 43+ existing call sites (zero changes needed to callers).

**When to use:** Replace `VERZUIM_DREMPEL_MIN = 600` in `src/utils/status.ts` line 15.

```typescript
// Source: src/utils/status.ts (VERIFIED — lines 15, 115-133)
// CURRENT (to be replaced):
const VERZUIM_DREMPEL_MIN = 600; // hardcoded at line 15

// PROPOSED signature change:
import { getVerzuimDrempelsSync } from '../../utils/verzuimDrempels';

export function berekenStatus(
  student: any,
  traject?: string,
  thresholds?: { geoorloofd: number; ongeoorloofd: number }
): StatusResult {
  const t = thresholds ?? getVerzuimDrempelsSync();
  const ongeoorloofd = student.verzuim?.ongeoorloofd ?? 0;
  const geoorloofd   = student.verzuim?.geoorloofd   ?? 0;
  // ... chain at line 121:
  if (ongeoorloofd > t.ongeoorloofd || geoorloofd > t.geoorloofd)
    return { kleur: 'oranje', label: 'Verzuim', prognose: p };
}
```

NOTE: `VerzuimSection.tsx` line 43 also has `(v.ongeoorloofd || 0) > 600`. That check must also use `getVerzuimDrempelsSync().ongeoorloofd`. [VERIFIED: codebase]

### Pattern 3: berekenPrognose Active Deelgebieden Filter

**What:** `berekenPrognose()` gains an optional `activeDeelgebiedenIds: string[]` parameter. `telLeerlijnen()` and the norm checks filter to active deelgebieden only when this parameter is provided.

**Critical fix that must accompany this change:** The current call to `getLeerlijnenMapping()` at line 59 is synchronous but the function is `async`. The fix is to use `getLeerlijnenMappingSync()` (new function to add to `utils/leerlijnen.ts`).

```typescript
// Proposed: add to utils/leerlijnen.ts
export function getLeerlijnenMappingSync(): Record<string, string> {
  if (_cachedMapping !== null) return _cachedMapping;
  return buildDefault(); // falls back to schema defaults if cache cold
}

// Proposed: berekenPrognose signature (utils/prognosis.ts)
export function berekenPrognose(
  student: any,
  traject?: string,
  activeDeelgebiedenIds?: string[]
): any {
  // Filter DEELGEBIEDEN to active only when parameter provided
  const activeDGs = activeDeelgebiedenIds
    ? DEELGEBIEDEN.filter(dg => activeDeelgebiedenIds.includes(dg.id))
    : DEELGEBIEDEN;
  // telLeerlijnen uses activeDGs and getLeerlijnenMappingSync()
}
```

### Pattern 4: Inline Confirmation Pattern (Herstel standaard)

**What:** No modal. When the user clicks "Herstel standaard", the button is replaced in-place with a confirmation row. Controlled by a boolean React state variable (`confirmingReset`).

```typescript
// [CITED: 18-UI-SPEC.md interaction states]
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

- `id`: matches `Deelgebied.id` from schema.ts (`'va'`, `'mm'`, etc.) — 19 items verified in schema
- `label`: the user-edited name (default = `Deelgebied.label`)
- `active`: boolean (default = `true`)

### Pattern 6: main.tsx Pre-warm Sequence

**What:** `src/main.tsx` pre-warms async caches before React renders. Plan 18-02 adds pre-warm calls for the four new sync caches.

```typescript
// Source: src/main.tsx (VERIFIED — current pre-warm pattern lines 9-11, 14-15)
// Current: loadKlassen() + loadSettings()
// Phase 18 adds (in Plan 18-02):
import { getDeelgebiedenConfig } from '../utils/deelgebieden';
import { getVerzuimDrempels } from '../utils/verzuimDrempels';
import { getBpvConfig, getBpvData } from '../utils/bpv';
import { getLeerlijnenMapping } from '../utils/leerlijnen';

// After existing loadKlassen():
await getDeelgebiedenConfig();     // populates _cache for getDeelgebiedenConfigSync()
await getVerzuimDrempels();        // populates _cache for getVerzuimDrempelsSync()
await getBpvConfig();              // populates _cache for getBpvConfigSync()
await getLeerlijnenMapping();      // populates _cachedMapping for getLeerlijnenMappingSync()
```

### Anti-Patterns to Avoid

- **Calling `getLeerlijnenMapping()` without await:** The current code in `prognosis.ts` line 59 calls it synchronously — this is a verified latent bug. Phase 18 must use `getLeerlijnenMappingSync()`. Do not call the async function without await in new code.
- **Calling `store.set()` without `store.save()`:** The Phase 12 pitfall. Every mutation must pair `set` + `save`. Failing to call `save()` leaves changes in memory only — they are lost on app restart.
- **Deleting deelgebied scores when marking inactive:** D-04 is locked — scores are preserved. The inactive state only filters display and calculation. Never delete student score data.
- **Reading store on every render:** Use in-memory cache (null = not loaded, object = loaded). Async store reads in the render path cause race conditions and flickering.
- **Mutating DEELGEBIEDEN from schema.ts:** The schema array is a compile-time constant and the reset target. Never mutate it. Runtime config lives in the store only.
- **Using renamed custom label for score key lookups:** Student scores are keyed by the original schema `dg.label` (e.g., `'V&A'`). Use the custom label only for display; use the original label for score lookups.

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

### 1. CRITICAL (CONFIRMED): `getLeerlijnenMapping()` Called Synchronously in `berekenPrognose()`

**Location:** `utils/prognosis.ts` line 59: `const mapping = getLeerlijnenMapping();`

**Verified:** `getLeerlijnenMapping()` is declared `async function getLeerlijnenMapping(): Promise<Record<string, string>>` at `utils/leerlijnen.ts` line 44. The call at line 59 without `await` returns a Promise object.

The code uses `mapping[dg.id]` on a Promise at line 64 — evaluates to `undefined` for all keys. The fallback `|| dg.group` covers it, effectively using schema defaults always.

**Current behavior:** Works in practice because `_cachedMapping` is pre-populated before `berekenPrognose()` is first called. If cache is cold, silent failure.

**Phase 18 fix:** Add `getLeerlijnenMappingSync()` to `utils/leerlijnen.ts` (returns `_cachedMapping` or calls `buildDefault()`). Update `prognosis.ts` line 59 to use `getLeerlijnenMappingSync()`.

[VERIFIED: codebase read of utils/leerlijnen.ts lines 44-69 and utils/prognosis.ts lines 14-15, 59, 64]

### 2. CONFIRMED: `DeelgebiedenMatrix.tsx` Uses DEELGEBIEDEN Directly

**Location:** `src/components/DeelgebiedenMatrix.tsx` lines 4, 60-65.

Line 4: `import { DEELGEBIEDEN, SCORE_LEVELS, normalizeScore } from '../../utils/schema';`
Lines 60-63: `const groepDG: Record<string, typeof DEELGEBIEDEN> = {}; for (const g of GROEPEN) { groepDG[g.key] = DEELGEBIEDEN.filter(dg => dg.group === g.key); }`

Phase 18 must add a config load (via `getDeelgebiedenConfigSync()`) and filter `DEELGEBIEDEN` by `active: true` before building the groups. The `groepDG` calculation must also use `getLeerlijnenMappingSync()` to handle SET-04 leerlijn reassignments at runtime (see Pitfall 6).

[VERIFIED: codebase read lines 1-15, 59-65]

### 3. CONFIRMED: `SpiderChartCard.tsx` Uses DEELGEBIEDEN Directly

**Location:** `src/components/SpiderChartCard.tsx` lines 3, 14-17.

Line 14: `CRITICAL: use dg.label (not dg.id) as key to match deelgebiedScores storage format (D-14-10)` comment confirmed.
Lines 15-17: `const axes = DEELGEBIEDEN.filter(dg => dg.group === group).map(dg => ({ key: dg.label, label: dg.label }));`

Phase 18 must filter by active state using `getDeelgebiedenConfigSync()`. The axis `key` (used for score lookups) must remain the original schema `dg.label`. The display `label` can be the custom name from config.

[VERIFIED: codebase read lines 3, 14-17]

### 4. CONFIRMED: `VerzuimSection.tsx` Has Hardcoded `> 600` Check

**Location:** `src/components/VerzuimSection.tsx` line 43: `const ongeoorloofdhoogVerzuim = (v.ongeoorloofd || 0) > 600;`

This controls the `{ color: '#991b1b', fontWeight: 700 }` style on the ongeoorloofd time display. Phase 18 must replace `600` with `getVerzuimDrempelsSync().ongeoorloofd`.

[VERIFIED: codebase read lines 43-44]

### 5. CONFIRMED: `berekenStatus()` Signature and Current Logic

**Full current signature (verified):** `berekenStatus(student: any, traject?: string): StatusResult` at `src/utils/status.ts` line 115.

**Current status chain (verified lines 121-132):**
1. No scores → grijs / Onbekend
2. negatief prognose → rood / Risico
3. neutraal prognose → oranje / Let op
4. `ongeoorloofd > VERZUIM_DREMPEL_MIN` → oranje / Verzuim  ← hardcoded 600, replace with runtime
5. sbc → blauw / Profieljaar SBC
6. sbl → groen / Op koers
7. versneld_sbc → blauw / Versneld SBC
8. naar_bj2 → groen / Op koers BJ2
9. fallback → groen / Op koers

**D-08 adds:** geoorloofd threshold check alongside ongeoorloofd in step 4. Both thresholds return `oranje / Verzuim`.

**Current `berekenStatus` call sites (to verify no prop-drilling needed):** `DetailWeergave.tsx` line 47: `const status = berekenStatus(student);` — no props, no third argument. The internal `getVerzuimDrempelsSync()` fallback pattern means zero changes to any call site.

[VERIFIED: codebase reads of status.ts and DetailWeergave.tsx]

### 6. CONFIRMED: `SettingsPage.tsx` Section 3 & 4 Placeholders

**Location:** `src/components/SettingsPage.tsx` lines 93-103.

Section 3 (line 96): `<p className="settings-placeholder-text">Komt in een volgende versie.</p>`
Section 4 (line 100 — same pattern): both sections use `<section className="detail-section">` + `<h2 className="detail-section-title">` wrappers (verified). Phase 18 replaces the `<p>` placeholders only.

[VERIFIED: codebase read lines 92-106]

### 7. CONFIRMED: `DetailWeergave.tsx` Section Order

**Verified section order (lines 117-173):**
1. DoortstroomPrognoseSection (line 118)
2. AanvullendSection (line 121)
3. StageSection (line 124)
4. FeedbackActiepuntenSection (line 127)
5. LeerlijnenSection (line 130)
6. SpiderChartCard row (lines 133-158)
7. DeelgebiedenMatrix (line 161)
8. **VerzuimSection** (line 164) ← BPV section goes AFTER this
9. VakkenSection (line 167)
10. NotitiesTextarea (line 170)

BPV section inserts between lines 164 and 167.

[VERIFIED: codebase read lines 117-173]

### 8. CONFIRMED: `index.css` Section 24 is the Current Last Section

Section 24 "SettingsPage" starts at line ~1005 (verified by grep). Section 25 will be added at the end of the file after the last entry in section 24. The `.settings-placeholder-text` rule is at line ~1064. New Phase 18 CSS classes go in section 25 after that.

[VERIFIED: grep output showing section markers]

### 9. CONFIRMED: `main.tsx` Current Pre-warm Pattern

`src/main.tsx` pre-warms `loadKlassen()` (line 9) and `loadSettings()` (line 16) before `ReactDOM.createRoot()`. Plan 18-02 adds pre-warm calls for the four new async functions in this same startup sequence.

[VERIFIED: codebase read of src/main.tsx]

---

## Common Pitfalls

### Pitfall 1: `store.set()` Without `store.save()` (Phase 12 Pitfall — Repeat Risk)
**What goes wrong:** Config changes appear to work during the session but are lost on app restart.
**Why it happens:** `LazyStore.set()` is in-memory only. `save()` flushes to disk.
**How to avoid:** Every mutation handler must call `await store.set(key, value)` then `await store.save()`. See `utils/leerlijnen.ts` lines 80-82 for the confirmed pattern.
**Warning signs:** Settings persist within a session but reset after closing and reopening the app.

### Pitfall 2: Synchronous Call of Async `getLeerlijnenMapping()`
**What goes wrong:** When the cache is cold, `berekenPrognose()` gets a Promise object instead of the mapping, and all leerlijn group assignments fall through to schema defaults.
**Why it happens:** `getLeerlijnenMapping()` is async but called without await at prognosis.ts line 59. **Confirmed in current codebase.**
**How to avoid:** Add and use `getLeerlijnenMappingSync()` that reads `_cachedMapping` or returns `buildDefault()`. Pre-warm the cache at app startup.
**Warning signs:** Leerlijn changes in settings appear to have no effect on prognose output.

### Pitfall 3: Deelgebied Custom Label vs. Score Storage Key Mismatch
**What goes wrong:** Student scores are stored with the original schema label as key (e.g., `'V&A'`). If the component uses the user-renamed label to look up scores, all scores will be null.
**Why it happens:** `deelgebiedScores` is a flat object keyed by the original `dg.label` from the time of PDF import.
**How to avoid:** Always use the original schema `dg.label` for score lookups. Use the custom label only for display purposes. `SpiderChartCard.tsx` already uses `dg.label` as key — this must be preserved; use a separate display label field from config.
**Warning signs:** SpiderChartCard shows no scores for renamed deelgebieden.

### Pitfall 4: Missing `active: false` Deelgebieden in Cache
**What goes wrong:** If `getDeelgebiedenConfig()` only returns active items, components that reset to default lose inactive state information.
**How to avoid:** The stored config always contains all 19 entries. Active filtering happens at query time in a helper like `getActiveDGIds()`.

### Pitfall 5: React State Refresh After Async Store Write
**What goes wrong:** Instant-apply doesn't feel instant because the component waits for the async store write before updating the UI.
**How to avoid:** Update React state (and the in-memory cache) first, then fire the async store write in the background. Pattern confirmed in `handleToggle()` in SettingsPage.tsx (line 47: `applyTheme()` and `setIsDark()` before `await saveSettings()`).

### Pitfall 6: GROEPEN Constant in DeelgebiedenMatrix Ignores Leerlijn Reassignment
**What goes wrong:** If leerlijn assignment changes via SET-04, the matrix column grouping doesn't update because `groepDG` uses `dg.group` (schema default), not the runtime mapping.
**Why it happens:** `DeelgebiedenMatrix.tsx` lines 60-63 use `dg.group` directly instead of the runtime leerlijn mapping.
**How to avoid:** In Phase 18, `groepDG` must use `getLeerlijnenMappingSync()` to assign deelgebieden to groups. The three column headers (Lesgeven / Organiseren / Prof. handelen) remain fixed; only which deelgebieden appear in each column changes.

---

## Code Examples

### DeelgebiedConfig TypeScript Interface

```typescript
// Source: CONTEXT.md D-15 (locked decision) + schema.ts pattern (VERIFIED)
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
// Source: CONTEXT.md D-17 + UI-SPEC (200u default — VERIFIED in 18-UI-SPEC.md)
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

New CSS section to add at the end of `src/index.css` after section 24 (confirmed end ~line 1063):

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
| Hardcoded `VERZUIM_DREMPEL_MIN = 600` | Must become runtime config in Phase 18 | Phase 18 (this phase) | Small refactor; backward-compatible via internal sync fallback |
| DEELGEBIEDEN always renders all 19 | Must filter by active config in Phase 18 | Phase 18 (this phase) | DeelgebiedenMatrix + SpiderChartCard both affected |
| No geoorloofd threshold check in berekenStatus | Two runtime thresholds (geoorloofd + ongeoorloofd) | Phase 18 (this phase) | New oranje/Verzuim trigger path |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Student `deelgebiedScores` keys are the original schema `dg.label` values, not any custom renamed labels | Critical Code Discovery §3 | If scores were stored with custom labels, renaming would break score display — but this is impossible since imports happen before any rename |
| A2 | The BPV Excel parser can be deferred to a separate task gated on the user providing a sample file | CONTEXT.md D-13 | If the BPV progress section is expected at launch without import, the empty state handles this gracefully |
| A3 | Adding geoorloofd threshold to the `berekenStatus` check chain does not require changes to `KlasOverzicht` render flow beyond the internal sync-cache fix | Architecture §berekenStatus | The internal `getVerzuimDrempelsSync()` fallback means all existing call sites get runtime thresholds automatically without any prop changes |

**Note:** Assumption A1 from the prior research (whether the sync bug was intentional) is now RESOLVED: the bug is confirmed. The fix (`getLeerlijnenMappingSync()`) is safe regardless — it returns the cached value if present, otherwise the schema default.

---

## Open Questions

All questions are resolved. Resolutions carried forward from prior research:

1. **BPV Excel file format** (RESOLVED — deferred per D-13): Plan 18-02 ships `parseBpvExcel(bytes): BpvData` as a stub returning `{}`. The real parser is a follow-up phase item.

2. **Where to load config for berekenStatus callers** (RESOLVED — internal sync fallback): `berekenStatus()` calls `getVerzuimDrempelsSync()` internally when no `thresholds` arg is passed. Zero changes to existing call sites.

3. **DeelgebiedenMatrix leerlijn grouping after SET-04 changes** (RESOLVED — fixed three-column layout): Fixed three-column table; `groepDG` uses `getLeerlijnenMappingSync()` for runtime mapping; empty groups tolerated without column collapse.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 18 is pure TypeScript/React/CSS with no new external dependencies. The Tauri plugin-store and all other dependencies are already installed and verified in Phase 17.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + jsdom + @testing-library/react |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

[VERIFIED: existing tests/ directory contains status.test.ts, prognosis.test.ts, SettingsPage.test.tsx, etc.]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SET-03 | `getDeelgebiedenConfig()` returns defaults (all 19 active) on first call | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ Wave 0 |
| SET-03 | Marking a deelgebied inactive hides it from `getActiveDGIds()` result | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ Wave 0 |
| SET-03 | `resetDeelgebiedenConfig()` restores all 19 to active with schema labels | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ Wave 0 |
| SET-03 | DeelgebiedenMatrix renders only active deelgebieden (smoke, jsdom) | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ Wave 0 |
| SET-04 | `getLeerlijnenMappingSync()` returns cache or schema defaults (never a Promise) | unit | `npm test -- --run tests/leerlijnen.test.ts` | ❌ Wave 0 |
| SET-04 | `berekenPrognose()` with `activeDeelgebiedenIds` filters calculations correctly | unit | `npm test -- --run tests/prognosis.test.ts` | ❌ extend existing |
| SET-05 | `getVerzuimDrempels()` returns defaults `{geoorloofd:900, ongeoorloofd:600}` on first call | unit | `npm test -- --run tests/verzuimDrempels.test.ts` | ❌ Wave 0 |
| SET-05 | `berekenStatus()` returns oranje/Verzuim when ongeoorloofd exceeds custom threshold | unit | `npm test -- --run tests/status.test.ts` | ❌ extend existing |
| SET-05 | `berekenStatus()` returns oranje/Verzuim when geoorloofd exceeds custom geoorloofd threshold | unit | `npm test -- --run tests/status.test.ts` | ❌ extend existing |
| SET-06 | `getBpvConfig()` returns default `{verwachteUren:200}` on first call | unit | `npm test -- --run tests/bpv.test.ts` | ❌ Wave 0 |
| SET-06 | BPV progress percentage calculated correctly (actual/expected × 100) | unit | `npm test -- --run tests/bpv.test.ts` | ❌ Wave 0 |
| SET-06 | BPV section renders empty state when no BPV data imported | unit | `npm test -- --run tests/bpv.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run` (full suite, ~43 tests currently)
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/deelgebieden.test.ts` — covers SET-03 config persistence and active filter
- [ ] `tests/verzuimDrempels.test.ts` — covers SET-05 threshold defaults and persistence
- [ ] `tests/bpv.test.ts` — covers SET-06 config defaults and progress calculation
- [ ] `tests/leerlijnen.test.ts` — new file: adds `getLeerlijnenMappingSync()` tests (existing leerlijnen tests are in-source or absent — no `tests/leerlijnen.test.ts` currently exists)
- [ ] Extend `tests/status.test.ts` — add `berekenStatus()` geoorloofd+ongeoorloofd threshold parameter tests
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

- Codebase reads: `utils/schema.ts` (DEELGEBIEDEN: 19 items confirmed), `utils/leerlijnen.ts` (async bug confirmed at line 59/44), `utils/prognosis.ts` (sync call at line 59 confirmed), `utils/settings.ts` (LazyStore pattern), `src/utils/status.ts` (VERZUIM_DREMPEL_MIN=600 at line 15 confirmed), `src/components/SettingsPage.tsx` (placeholders at lines 93-103 confirmed), `src/components/DeelgebiedenMatrix.tsx` (DEELGEBIEDEN direct use at lines 60-63 confirmed), `src/components/SpiderChartCard.tsx` (DEELGEBIEDEN direct use at lines 15-17 confirmed), `src/components/DetailWeergave.tsx` (section order confirmed), `src/components/VerzuimSection.tsx` (hardcoded >600 at line 43 confirmed), `src/main.tsx` (pre-warm pattern confirmed)
- Filesystem checks: `utils/deelgebieden.ts`, `utils/verzuimDrempels.ts`, `utils/bpv.ts`, `tests/deelgebieden.test.ts`, `tests/verzuimDrempels.test.ts`, `tests/bpv.test.ts`, `tests/leerlijnen.test.ts` — all confirmed NOT EXISTS
- `.planning/phases/18-settings-panel-advanced/18-CONTEXT.md` — locked decisions D-01 through D-17
- `.planning/phases/18-settings-panel-advanced/18-UI-SPEC.md` — visual + interaction contract
- `.planning/phases/18-settings-panel-advanced/18-01-PLAN.md` through `18-05-PLAN.md` — existing plan structure verified

### Secondary (MEDIUM confidence)

- `tests/SettingsPage.test.tsx` — LazyStore mock pattern confirmed present
- `tests/prognosis.test.ts` — existing test pattern confirmed (no `activeDeelgebiedenIds` tests yet)
- `tests/status.test.ts` — existing test pattern confirmed (no threshold-param tests yet)

### Tertiary (LOW confidence — none)

All claims in this research were verified from actual codebase files or locked context documents.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies; all packages verified from previous phase
- Architecture: HIGH — all integration points verified from actual component source code in this session
- Pitfalls: HIGH — sync/async bug and hardcoded values verified from actual source code in this session
- Execution status: HIGH — filesystem checks confirmed no utility files exist yet; all 5 PLANs present
- BPV parser: LOW — format unknown per D-13; explicitly deferred to implementation time

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (stable codebase — re-research only if major refactor lands before planning)
