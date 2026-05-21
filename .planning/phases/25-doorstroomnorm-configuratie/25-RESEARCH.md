# Phase 25: Doorstroomnorm Configuratie - Research

**Researched:** 2026-05-21
**Domain:** React/TypeScript settings UI + Tauri plugin-store persistence + prognosis engine parameterisation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Doorstroomdrempels wordt een nieuwe sectie 5 in `SettingsPage.tsx` — een aparte `<section className="detail-section">` toegevoegd na sectie 4. Geen subsectie in sectie 4.
- **D-02:** Sectie 5 heeft zijn eigen "Herstel standaard" knop conform het Phase 18 patroon.
- **D-03:** Sectie 5 bevat twee visuele blokken: BJ2-drempels (4 inputs) en BJ1-drempels (4 inputs).
- **D-04:** Beide blokken zijn altijd zichtbaar (niet ingeklapt).
- **D-05:** BJ1-blok bevat zowel de BJ1-positief drempel als de versneld-SBC drieluik.
- **D-06:** Prognose herberekent bij blur of Enter — niet tijdens typen.
- **D-07:** Gewijzigde drempel wordt meteen opgeslagen in plugin-store bij blur/Enter (geen aparte save-knop).
- **D-08:** Herberekening propagatie via `onNormenChanged` callback in App.tsx (versie-teller patroon, zelfde als `onVerzuimDrempelsChanged` in Phase 18).
- **D-09:** Alle inputs zijn `<input type="number" step="1">` met bereikgrenzen per veld; decimalen afgerond bij blur.
- **D-10:** Subtiele waarschuwing (oranje tekst) als SBC-drempel < SBL-drempel — geen blokkering.
- **D-11:** Nieuw hulpbestand `utils/normen.ts` volgt het exacte patroon van `utils/verzuimDrempels.ts` (LazyStore, sync cache, DEFAULT constanten, load/save/reset).
- **D-12:** `berekenPrognose()` krijgt een optionele `normen`-parameter; leest via `getNormenSync()` als niet opgegeven.

### Claude's Discretion

- (None specified — alle beslissingen zijn expliciet vergrendeld.)

### Deferred Ideas (OUT OF SCOPE)

- Geen deferred ideas — discussie bleef binnen fase-scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NORM-01 | Mentor kan de SBL-drempel (standaard ≥13 ≥V) aanpassen in de instellingen | `utils/normen.ts` `sbl` veld + sectie 5 BJ2-blok input |
| NORM-02 | Mentor kan de SBC-drempel (standaard ≥15 ≥V) aanpassen in de instellingen | `utils/normen.ts` `sbc` veld + sectie 5 BJ2-blok input |
| NORM-03 | Mentor kan de negatief-drempel (standaard >6 O totaal) aanpassen in de instellingen | `utils/normen.ts` `negatiefTotaal` veld + sectie 5 BJ2-blok input |
| NORM-04 | Mentor kan de per-leerlijn negatief-drempel (standaard >2 O) aanpassen in de instellingen | `utils/normen.ts` `negatiefPerLeerlijn` veld + sectie 5 BJ2-blok input |
| NORM-05 | Mentor kan de BJ1 versneld-SBC drempels aanpassen | `utils/normen.ts` `versneldLesgeven/Organiseren/ProfHandelen` + `bj1Positief` + sectie 5 BJ1-blok inputs |
| NORM-06 | Ingestelde drempels worden opgeslagen en bewaard tussen sessies | LazyStore `store.set()` + `store.save()` in `saveNormen()`, `loadNormen()` pre-warm in `main.tsx` |
| NORM-07 | Een "Herstel standaard" knop zet alle drempels terug naar de CIOS-normen | `resetNormen()` + `onNormenChanged` callback, sectie 5 reset knop met bevestig-patroon |

</phase_requirements>

---

## Summary

Phase 25 is a pure **parameterisation refactor + settings UI extension**. The core work is (1) extracting five families of hardcoded threshold constants from `utils/prognosis.ts` into a new `utils/normen.ts` module, (2) adding an 8-input Section 5 to `SettingsPage.tsx`, and (3) wiring a re-render callback through `App.tsx` so `KlasOverzicht` picks up the new thresholds without a page restart.

Every pattern needed already exists in the codebase. `utils/verzuimDrempels.ts` is a line-for-line template for `utils/normen.ts`. The Section 4 number-input UI in `SettingsPage.tsx` is the visual template for Section 5. The `onVerzuimDrempelsChanged` → `refreshKey` propagation chain in `App.tsx` is the exact callback pattern to replicate for `onNormenChanged`. No new libraries, no new Tauri APIs, no new architectural patterns are introduced.

The highest-risk item is the **`gaps` object inside `berekenPrognose()`**: several hardcoded numbers appear both in the main logic and in the `gaps` computation (e.g., `13 - totaalVoldoendeOfHoger` on lines ~158 and ~197). Both occurrences must be replaced with `normen.*` references, or gap displays will diverge from actual prognosis behaviour after a threshold change. Tests must cover this.

**Primary recommendation:** Copy `utils/verzuimDrempels.ts` as the starting file for `utils/normen.ts`, adapt the type/key names, then replace each hardcoded constant in `prognosis.ts` systematically — use the exact line references in the CONTEXT.md canonical refs section as a checklist.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Threshold persistence (read/write) | `utils/normen.ts` (utility layer) | Tauri plugin-store | Pure data concern; no React |
| Sync cache for hot path | `utils/normen.ts` (`_cache`) | — | berekenPrognose() is called synchronously; async store access forbidden here |
| Prognosis computation | `utils/prognosis.ts` | — | Domain logic; reads cache via `getNormenSync()` |
| Settings UI | `src/components/SettingsPage.tsx` (Section 5) | — | React state for controlled inputs; calls save on blur/Enter |
| Re-render propagation | `src/App.tsx` (`onNormenChanged` + `refreshKey`) | `KlasOverzicht` (consumer) | Follows existing Phase 18 `onVerzuimDrempelsChanged` pattern |
| Startup pre-warm | `src/main.tsx` | — | All async cache fills happen before React mounts |

---

## Standard Stack

### Core (all already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tauri-apps/plugin-store` | (in use) | LazyStore persistence | Established in Phase 12; only reliable store in Tauri 2 prod |
| React (useState, useEffect) | (in use) | Controlled inputs + side effects | Project stack |
| TypeScript | (in use) | Type safety for Normen interface | Project stack |
| Vitest + @testing-library/react | (in use) | Unit + component tests | Established test stack |

No new dependencies. `npm install` not required.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sync cache (_cache pattern) | Re-reading store async on every berekenPrognose call | Async read inside sync call is impossible in the hot path; sync cache is mandatory |
| Callback + refreshKey propagation | Zustand/Redux global store | Over-engineering for a project with zero existing state management library; the callback pattern is already proven |

---

## Architecture Patterns

### System Architecture Diagram

```
[SettingsPage: Section 5 input onBlur/Enter]
         |
         v
[saveNormen(normen)] ─── async ──> [LazyStore store.json 'doorstroom_normen']
         |
    _cache = normen  (instant-apply BEFORE await)
         |
         v
[onNormenChanged() callback] ──> [App.tsx: setRefreshKey(k => k+1)]
                                          |
                                          v
                               [KlasOverzicht re-renders]
                                          |
                                          v
                            [berekenStatus() → berekenPrognose()]
                                          |
                                          v
                                [getNormenSync() returns _cache]
                                          |
                                          v
                              [Updated RAG tile colours displayed]
```

On startup:
```
[main.tsx IIFE]
    └─ loadNormen()  ──async──> [store.get('doorstroom_normen')] ──> _cache populated
    └─ React.render()          (cache is hot before first render)
```

### Recommended Project Structure

```
utils/
├── normen.ts          # NEW — LazyStore + sync cache for Normen (copy of verzuimDrempels.ts)
├── prognosis.ts       # MODIFY — replace 8 hardcoded constants with normen.* reads
├── verzuimDrempels.ts # UNCHANGED — template reference
src/
├── main.tsx           # MODIFY — add loadNormen() to pre-warm Promise.all
├── App.tsx            # MODIFY — add onNormenChanged prop + normenVersion state
└── components/
    └── SettingsPage.tsx  # MODIFY — add Section 5 with 8 inputs + reset button
tests/
└── normen.test.ts     # NEW — mirrors verzuimDrempels.test.ts
```

### Pattern 1: LazyStore + Sync Cache (utils/normen.ts)

**What:** Module-level singleton store + `_cache` variable. Async load pre-warms cache; sync accessor returns cache or defaults. Save updates cache before async write (instant-apply).

**When to use:** Any setting read inside a synchronous computation (berekenPrognose is called synchronously inside React render via useMemo).

```typescript
// Source: utils/verzuimDrempels.ts (VERIFIED: direct file read)
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const STORE_KEY = 'doorstroom_normen';
let _cache: Normen | null = null;

export interface Normen {
  sbl:                  number; // default 13
  sbc:                  number; // default 15
  negatiefTotaal:       number; // default 6
  negatiefPerLeerlijn:  number; // default 2
  bj1Positief:          number; // default 13
  versneldLesgeven:     number; // default 4
  versneldOrganiseren:  number; // default 3
  versneldProfHandelen: number; // default 5
}

export const DEFAULT_NORMEN: Normen = {
  sbl: 13, sbc: 15, negatiefTotaal: 6, negatiefPerLeerlijn: 2,
  bj1Positief: 13, versneldLesgeven: 4, versneldOrganiseren: 3, versneldProfHandelen: 5,
};

export function getNormenSync(): Normen {
  return _cache ?? DEFAULT_NORMEN;
}

export async function loadNormen(): Promise<Normen> {
  if (_cache !== null) return _cache;
  try {
    const raw = await store.get<Normen>(STORE_KEY);
    if (raw && typeof raw.sbl === 'number') {
      _cache = raw;
      return _cache;
    }
  } catch (e: any) {
    console.warn('[normen.ts] read error:', e);
  }
  _cache = { ...DEFAULT_NORMEN };
  return _cache;
}

export async function saveNormen(normen: Normen): Promise<boolean> {
  _cache = normen; // instant-apply FIRST (pitfall 5)
  try {
    await store.set(STORE_KEY, normen);
    await store.save(); // REQUIRED: set() is in-memory only (Phase 12 pitfall)
    return true;
  } catch (e: any) {
    console.warn('[normen.ts] plugin-store write error:', e);
    return false;
  }
}

export async function resetNormen(): Promise<Normen> {
  return saveNormen({ ...DEFAULT_NORMEN }).then(() => DEFAULT_NORMEN);
}
```

### Pattern 2: berekenPrognose normen parameter

**What:** Optional `normen` parameter falls back to `getNormenSync()`. All 8 hardcoded numbers replaced. `gaps` object updated too.

**When to use:** Every call site that needs threshold-aware prognosis (all existing callers pass no normen — they get sync cache automatically).

```typescript
// Source: utils/prognosis.ts analysis (VERIFIED: direct file read)
import { getNormenSync, type Normen } from './normen';

export function berekenPrognose(student: any, traject?: string, activeDeelgebiedenIds?: string[], normen?: Normen): any {
  const n = normen ?? getNormenSync();
  // ...
  // Replace: totaalOnvoldoende > 6  →  totaalOnvoldoende > n.negatiefTotaal
  // Replace: telling[ll].onvoldoende > 2  →  telling[ll].onvoldoende > n.negatiefPerLeerlijn
  // BJ1: totaalVoldoendeOfHoger >= 13  →  >= n.bj1Positief
  // BJ2: totaalVoldoendeOfHoger >= 15  →  >= n.sbc
  // BJ2: totaalVoldoendeOfHoger >= 13  →  >= n.sbl
  // VERSNELD_BJ1 object  →  n.versneldLesgeven / n.versneldOrganiseren / n.versneldProfHandelen
  //
  // gaps object must also use n.* (not hardcoded numbers):
  // nodigBJ2: Math.max(0, n.bj1Positief - totaalVoldoendeOfHoger)
  // nodigSBL: Math.max(0, n.sbl - totaalVoldoendeOfHoger)
  // nodigSBC_deelgebieden: Math.max(0, n.sbc - totaalVoldoendeOfHoger)
  // onvoldoendeRuimte: n.negatiefTotaal - totaalOnvoldoende
  // onvoldoendeRuimtePerLeerlijn.*: n.negatiefPerLeerlijn - telling[ll].onvoldoende
}
```

### Pattern 3: onNormenChanged callback in App.tsx

**What:** SettingsPage receives `onNormenChanged` prop. After save, it calls `onNormenChanged()`. App.tsx increments `normenVersion` (a counter state), which is passed as `key` or included in `refreshKey` dependency so `KlasOverzicht` re-renders.

**When to use:** Any settings change that must trigger downstream re-render without page navigation.

```typescript
// Source: App.tsx pattern analysis (VERIFIED: direct file read)
// EXISTING pattern for reference:
// settingsOpenCount → key={settingsOpenCount} on SettingsPage

// NEW pattern for normen:
const [normenVersion, setNormenVersion] = useState(0);

function handleNormenChanged() {
  setNormenVersion(v => v + 1);
  setRefreshKey(k => k + 1); // refreshKey drives KlasOverzicht re-render
}
// Pass onNormenChanged={handleNormenChanged} to <SettingsPage>
```

Note: `KlasOverzicht` already re-renders when `refreshKey` changes (its `useMemo` dependency). No changes needed inside `KlasOverzicht` itself — the existing `berekenStatus()` → `berekenPrognose()` → `getNormenSync()` call chain will pick up the new cache value automatically.

### Pattern 4: Section 5 UI (SettingsPage.tsx)

**What:** Two subsection `<div>` blocks inside a `<section className="detail-section">`. Each input follows the `.settings-threshold-row` pattern from Section 4. Save on blur/Enter via `handleBlur` helper.

```tsx
// Source: SettingsPage.tsx Section 4 pattern (VERIFIED: direct file read)
<section className="detail-section">
  <h2 className="detail-section-title">Doorstroomdrempels</h2>

  {/* BJ2 block */}
  <p className="settings-subsection-title">BJ2-drempels</p>
  <div className="settings-threshold-group">
    <div className="settings-threshold-row">
      <label style={{ minWidth: 200 }}>SBL-drempel (≥V)</label>
      <input
        type="number" className="settings-number-input"
        min={1} max={19} step={1}
        value={normen.sbl}
        onChange={e => setNormenLocal(n => ({ ...n, sbl: Number(e.target.value) }))}
        onBlur={() => handleNormenBlur()}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
    </div>
    {/* SBC, negatiefTotaal, negatiefPerLeerlijn similar */}
    {sbcWaarschuwing && (
      <p style={{ color: 'orange', fontSize: '0.875rem' }}>
        Let op: SBC-drempel is normaal hoger dan SBL-drempel (standaard: 15 vs 13).
      </p>
    )}
  </div>

  {/* BJ1 block */}
  <p className="settings-subsection-title">BJ1-drempels</p>
  <div className="settings-threshold-group">
    {/* bj1Positief, versneldLesgeven, versneldOrganiseren, versneldProfHandelen */}
  </div>

  {/* Reset button */}
  {!confirmingResetNormen ? (
    <button className="btn btn-ghost" onClick={() => setConfirmingResetNormen(true)}>
      Herstel standaard
    </button>
  ) : (
    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
      <button className="btn btn-ghost" onClick={() => setConfirmingResetNormen(false)}>
        Niet herstellen
      </button>
      <button className="btn btn-primary" onClick={handleResetNormen}>
        Ja, herstel
      </button>
    </div>
  )}
</section>
```

### Anti-Patterns to Avoid

- **Async read inside berekenPrognose:** `berekenPrognose` is called synchronously inside `useMemo`. Never `await store.get()` inside it. Always use `getNormenSync()`.
- **Missing `store.save()` after `store.set()`:** Phase 12 pitfall — `store.set()` writes to memory only; `store.save()` flushes to disk. Both must be awaited in `saveNormen()`.
- **Updating `_cache` after the await:** The instant-apply pattern requires `_cache = normen` BEFORE the first `await`. If `_cache` is set after the await, the sync accessor returns stale values during the async write.
- **Updating gaps with hardcoded numbers:** The `gaps` object in `berekenPrognose` contains raw numbers like `13 - totaalVoldoendeOfHoger` (lines ~158, ~197). These must be updated to `n.sbl`, `n.bj1Positief`, etc., or the gap display will diverge from the threshold configuration.
- **Forgetting `loadNormen()` in main.tsx:** Without pre-warming, `getNormenSync()` returns `DEFAULT_NORMEN` on first render. If the user has saved custom thresholds, they won't take effect until after React mounts and an async effect fires — causing a flicker or incorrect initial RAG colours.
- **SBC validation blocking save:** D-10 specifies the SBC < SBL warning must NOT block the save. Only show oranje text; never throw or return early from the save handler.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Persistence | Custom JSON file write | `LazyStore` from `@tauri-apps/plugin-store` | Already in use; handles Tauri IPC, atomic saves |
| Sync access in hot path | Promise-based cache | `_cache` module variable (existing pattern) | Sync functions cannot await; module-level cache is the established solution |
| Reset confirmation UI | Custom modal | Two-button inline toggle (existing Phase 18 pattern) | Consistent with Section 3 reset UX |

**Key insight:** Every sub-problem in this phase has already been solved and deployed in Phases 12, 17, and 18. The entire implementation is template-filling, not design.

---

## Common Pitfalls

### Pitfall 1: Gaps Object Hardcoding
**What goes wrong:** The `gaps` sub-object in `berekenPrognose` contains hardcoded numbers (`13 - totaalVoldoendeOfHoger`, `6 - totaalOnvoldoende`, `2 - telling[ll].onvoldoende`). If only the main logic conditionals are updated and `gaps` is forgotten, the prognosis label changes correctly but the gap analysis numbers still reference old thresholds.
**Why it happens:** `gaps` is visually separated from the main logic in the file — easy to miss in a search-and-replace.
**How to avoid:** Use a checklist of all 8 replacement sites (from CONTEXT.md canonical refs) and verify each. Include a test that changes a threshold and checks that `gaps.nodigSBL` reflects the new value.
**Warning signs:** Test for `berekenPrognose` passes but `gaps.nodigSBL` equals `13 - totaalVoldoendeOfHoger` rather than `normen.sbl - totaalVoldoendeOfHoger` when sbl is changed.

### Pitfall 2: Store Not Saved (Phase 12 Pitfall)
**What goes wrong:** `await store.set(key, value)` writes to in-memory map only. Without `await store.save()`, the value is lost on app restart.
**Why it happens:** Developers assume `set()` persists.
**How to avoid:** Always pair `store.set()` + `store.save()` — the existing `verzuimDrempels.ts` comment labels this "VERPLICHT".
**Warning signs:** NORM-06 test fails — saved value not found after `vi.resetModules()`.

### Pitfall 3: SettingsPage Props Missing onNormenChanged
**What goes wrong:** SettingsPage.tsx gets new state but App.tsx is not updated to pass `onNormenChanged`, so KlasOverzicht never re-renders after a threshold change.
**Why it happens:** Two-file wiring is easy to leave incomplete.
**How to avoid:** Add `onNormenChanged` to `SettingsPageProps` interface AND add the handler + prop in App.tsx in the same plan.
**Warning signs:** Threshold changes in Settings → navigate back → RAG colours unchanged.

### Pitfall 4: Stale useMemo in KlasOverzicht
**What goes wrong:** `KlasOverzicht` wraps `berekenStatus` in `useMemo` keyed on `[refreshKey, allStudents.length]`. If `refreshKey` is not incremented when normen change, the status map is not recomputed.
**Why it happens:** The `onNormenChanged` callback might update `normenVersion` state but forget to also bump `refreshKey`.
**How to avoid:** `handleNormenChanged` in App.tsx must call `setRefreshKey(k => k + 1)` — this is the single correct way to invalidate KlasOverzicht's useMemo.
**Warning signs:** Console shows re-render of App but tiles don't update colour.

### Pitfall 5: Input Decimal Handling
**What goes wrong:** User types "13.7" — `Number(e.target.value)` = 13.7 is saved to store. On next load `typeof raw.sbl === 'number'` is true (13.7 is a number) so it passes validation. berekenPrognose uses 13.7 as threshold — never reached in practice.
**Why it happens:** D-09 requires rounding at blur but onChange handlers typically use `Number(e.target.value)` directly.
**How to avoid:** In the blur handler, apply `Math.round()` before saving if the raw value is not integer. Or use `parseInt()` in the blur handler specifically.

---

## Code Examples

### Complete loadNormen with validation guard
```typescript
// Source: utils/verzuimDrempels.ts pattern (VERIFIED: direct file read), adapted
export async function loadNormen(): Promise<Normen> {
  if (_cache !== null) return _cache;
  try {
    const raw = await store.get<Normen>(STORE_KEY);
    if (
      raw &&
      typeof raw.sbl === 'number' &&
      typeof raw.sbc === 'number' &&
      typeof raw.negatiefTotaal === 'number' &&
      typeof raw.negatiefPerLeerlijn === 'number' &&
      typeof raw.bj1Positief === 'number' &&
      typeof raw.versneldLesgeven === 'number' &&
      typeof raw.versneldOrganiseren === 'number' &&
      typeof raw.versneldProfHandelen === 'number'
    ) {
      _cache = raw;
      return _cache;
    }
  } catch (e: any) {
    console.warn('[normen.ts] read error:', e);
  }
  _cache = { ...DEFAULT_NORMEN };
  return _cache;
}
```

### main.tsx pre-warm addition
```typescript
// Source: src/main.tsx (VERIFIED: direct file read), line 44 context
await Promise.all([
  getDeelgebiedenConfig(),
  loadVerzuimDrempels(),
  getBpvConfig(),
  getBpvData(),
  getLeerlijnenMapping(),
  loadNormen(),          // ADD THIS
]);
```

### Hardcoded constant replacement map (prognosis.ts)

All line references from CONTEXT.md canonical refs verified against the actual file:

| Line (approx) | Old | New |
|---|---|---|
| ~127 | `totaalOnvoldoende > 6` | `totaalOnvoldoende > n.negatiefTotaal` |
| ~129 | `telling[ll].onvoldoende > 2` | `telling[ll].onvoldoende > n.negatiefPerLeerlijn` |
| ~144 | `totaalVoldoendeOfHoger >= 13` (BJ1 naar BJ2) | `>= n.bj1Positief` |
| ~158 | `Math.max(0, 13 - totaalVoldoendeOfHoger)` (gaps.nodigBJ2) | `Math.max(0, n.bj1Positief - totaalVoldoendeOfHoger)` |
| ~160-162 | `VERSNELD_BJ1.lesgeven/organiseren/prof_handelen` | `n.versneldLesgeven/Organiseren/ProfHandelen` |
| ~164 | `6 - totaalOnvoldoende` (gaps.onvoldoendeRuimte) | `n.negatiefTotaal - totaalOnvoldoende` |
| ~166-170 | `2 - telling[ll].onvoldoende` (gaps.onvoldoendeRuimtePerLeerlijn.*) | `n.negatiefPerLeerlijn - telling[ll].onvoldoende` |
| ~180 | `totaalVoldoendeOfHoger >= 15` (BJ2 SBC) | `>= n.sbc` |
| ~183 | `totaalVoldoendeOfHoger >= 13` (BJ2 SBL) | `>= n.sbl` |
| ~197 | `Math.max(0, 13 - totaalVoldoendeOfHoger)` (gaps.nodigSBL) | `Math.max(0, n.sbl - totaalVoldoendeOfHoger)` |
| ~199 | `Math.max(0, 15 - totaalVoldoendeOfHoger)` (gaps.nodigSBC_deelgebieden) | `Math.max(0, n.sbc - totaalVoldoendeOfHoger)` |
| ~204-207 | `6 - totaalOnvoldoende` + `2 - ...onvoldoende` (BJ2 gaps) | same n.* pattern |

Note: The `VERSNELD_BJ1` object at lines ~28-32 can be removed after replacement; `KERN_SBC` array is NOT replaced — it is a fixed list of deelgebied labels, not a configurable threshold.

---

## Runtime State Inventory

This is not a rename/refactor phase — no runtime state audit required. No existing stored keys are renamed; a new key `'doorstroom_normen'` is introduced in `store.json`.

---

## Environment Availability

No new external tools required. All dependencies present:

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| `@tauri-apps/plugin-store` | normen.ts LazyStore | Yes (in use) | Phase 12+ |
| Vitest + jsdom | tests/normen.test.ts | Yes (in use) | vitest.config.ts confirmed |
| React + @testing-library/react | SettingsPage tests | Yes (in use) | — |
| TypeScript | utils/normen.ts | Yes (in use) | — |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (vmForks pool, jsdom environment) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/normen.test.ts tests/prognosis.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NORM-01 | SBL threshold configurable + persisted | unit | `npx vitest run tests/normen.test.ts` | Wave 0 gap |
| NORM-02 | SBC threshold configurable + persisted | unit | `npx vitest run tests/normen.test.ts` | Wave 0 gap |
| NORM-03 | Negatief totaal threshold configurable | unit | `npx vitest run tests/normen.test.ts` | Wave 0 gap |
| NORM-04 | Negatief per leerlijn threshold configurable | unit | `npx vitest run tests/normen.test.ts` | Wave 0 gap |
| NORM-05 | BJ1 versneld-SBC thresholds configurable | unit | `npx vitest run tests/normen.test.ts` | Wave 0 gap |
| NORM-06 | Thresholds survive app restart (persist round-trip) | unit | `npx vitest run tests/normen.test.ts` | Wave 0 gap |
| NORM-07 | Reset restores DEFAULT_NORMEN | unit | `npx vitest run tests/normen.test.ts` | Wave 0 gap |
| NORM-01..05 (integration) | berekenPrognose uses custom normen | unit | `npx vitest run tests/prognosis.test.ts` | Existing file — add tests |
| NORM-07 (integration) | After reset, berekenPrognose uses defaults | unit | `npx vitest run tests/prognosis.test.ts` | Existing file — add tests |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/normen.test.ts tests/prognosis.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/normen.test.ts` — mirrors `tests/verzuimDrempels.test.ts`; covers: cold-cache default, save round-trip, sync accessor, instant-apply, reset. Should use `vi.hoisted` + ES6 class LazyStore mock (STATE.md mandate line 64).
- [ ] Additions to `tests/prognosis.test.ts` — tests that call `berekenPrognose(student, 'bj2', undefined, { ...DEFAULT_NORMEN, sbl: 10 })` and assert label/gaps respect the custom normen.

---

## Security Domain

This phase writes user-configurable numbers (integers) to `store.json`. No authentication, no secrets, no network calls. ASVS:

| ASVS Category | Applies | Control |
|---------------|---------|---------|
| V5 Input Validation | Yes | `Math.round()` + clamped min/max on each input field (D-09); type guard in `loadNormen()` validation |
| All others | No | Local desktop tool, no auth/session/crypto/network in this phase |

Threat: malformed store.json. Mitigation: `loadNormen()` validates each field with `typeof raw.X === 'number'`; falls back to `DEFAULT_NORMEN` on partial/corrupt data.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | All claims verified from direct file reads | — | — |

**All claims in this research were verified by direct file reads of the actual source files. No assumed claims.**

---

## Open Questions

1. **SettingsPage.tsx props interface extension**
   - What we know: Current `SettingsPageProps` has 4 fields (`onBack`, `onNavigateToImport`, `isDark`, `onToggleDark`). Phase 18 used `key={settingsOpenCount}` to force full remount on open.
   - What's unclear: Should `onNormenChanged` be a prop, or should SettingsPage call `saveNormen` directly and App.tsx detect changes differently?
   - Recommendation: Pass `onNormenChanged` as a prop (consistent with `onToggleDark` pattern). SettingsPage calls it after each `saveNormen()` call in the blur handler. This is explicit and testable.

2. **`normenVersion` vs `refreshKey` in App.tsx**
   - What we know: `refreshKey` already drives `KlasOverzicht` re-render. Adding a separate `normenVersion` counter is possible but redundant.
   - Recommendation: Simply call `setRefreshKey(k => k + 1)` inside `handleNormenChanged` — no additional state variable needed. Simplest change, zero risk.

---

## Sources

### Primary (HIGH confidence)
- `utils/verzuimDrempels.ts` — direct file read; LazyStore pattern template
- `utils/prognosis.ts` — direct file read; all 8 hardcoded constant locations identified
- `src/components/SettingsPage.tsx` — direct file read; Section 4 number-input pattern
- `src/main.tsx` — direct file read; pre-warm Promise.all pattern
- `src/App.tsx` — direct file read; refreshKey propagation and SettingsPage wiring
- `src/utils/status.ts` — direct file read; berekenStatus sync call pattern
- `src/components/KlasOverzicht.tsx` — direct file read; useMemo([refreshKey, allStudents.length]) pattern
- `tests/verzuimDrempels.test.ts` — direct file read; test scaffold template
- `tests/SettingsPage.test.tsx` — direct file read; vi.hoisted + LazyStore ES6 class mock pattern
- `.planning/phases/25-doorstroomnorm-configuratie/25-CONTEXT.md` — user decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all from verified existing codebase
- Architecture: HIGH — all patterns verified from actual source files
- Pitfalls: HIGH — derived from Phase 12/18 state notes and actual code inspection

**Research date:** 2026-05-21
**Valid until:** 2026-06-20 (stable patterns; no external dependencies)
