# Phase 18: Settings Panel Advanced - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 10 new/modified files
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `utils/deelgebieden.ts` | utility / persistence | CRUD | `utils/leerlijnen.ts` | exact |
| `utils/verzuimDrempels.ts` | utility / persistence | CRUD | `utils/leerlijnen.ts` + `utils/settings.ts` | exact |
| `utils/bpv.ts` | utility / persistence | CRUD | `utils/leerlijnen.ts` | exact |
| `utils/prognosis.ts` (MODIFY) | backend logic | transform | self (extend existing) | self |
| `src/utils/status.ts` (MODIFY) | backend logic | transform | self (extend existing) | self |
| `src/components/SettingsPage.tsx` (MODIFY) | component | request-response | `src/components/SettingsPage.tsx` section 1 | exact |
| `src/components/DeelgebiedenMatrix.tsx` (MODIFY) | component | CRUD | `src/components/DeelgebiedenMatrix.tsx` | self |
| `src/components/SpiderChartCard.tsx` (MODIFY) | component | transform | `src/components/SpiderChartCard.tsx` | self |
| `src/components/DetailWeergave.tsx` (MODIFY) | component | request-response | `src/components/VerzuimSection.tsx` | role-match |
| `src/components/BpvProgressSection.tsx` (NEW) | component | request-response | `src/components/VerzuimSection.tsx` | exact |
| `src/index.css` (MODIFY) | config / CSS | — | `src/index.css` section 24 | exact |

---

## Pattern Assignments

### `utils/deelgebieden.ts` (utility, CRUD)

**Analog:** `utils/leerlijnen.ts` (lines 1-105) — exact same LazyStore pattern.

**Imports pattern** (from leerlijnen.ts lines 1-17):
```typescript
import { DEELGEBIEDEN } from './schema';
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const STORE_KEY = 'deelgebieden_config';
let _cache: DeelgebiedConfig[] | null = null; // null = unloaded
```

**Interface definition** (CONTEXT.md D-15 + RESEARCH.md pattern 5):
```typescript
export interface DeelgebiedConfig {
  id:     string;   // matches Deelgebied.id from schema.ts ('va', 'mm', ...)
  label:  string;   // display label — may differ from schema default
  active: boolean;  // false = hidden in matrix/spider/prognose
}
```

**buildDefault helper** (mirrors leerlijnen.ts lines 20-26):
```typescript
function buildDefault(): DeelgebiedConfig[] {
  return DEELGEBIEDEN.map(dg => ({ id: dg.id, label: dg.label, active: true }));
}
```

**Validation helper** (mirrors leerlijnen.ts lines 29-36):
```typescript
function isValid(config: any): boolean {
  if (!Array.isArray(config) || config.length !== DEELGEBIEDEN.length) return false;
  return DEELGEBIEDEN.every(dg => config.some((c: any) => c.id === dg.id));
}
```

**get function pattern** (mirrors leerlijnen.ts lines 44-70):
```typescript
export async function getDeelgebiedenConfig(): Promise<DeelgebiedConfig[]> {
  if (_cache !== null) return _cache;
  try {
    const stored = await store.get<string>(STORE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValid(parsed)) { _cache = parsed; return _cache!; }
    }
  } catch (e: any) {
    console.warn('[deelgebieden.ts] read error:', e);
  }
  _cache = buildDefault();
  return _cache;
}
```

**save function pattern** (mirrors leerlijnen.ts lines 78-88 — CRITICAL: set + save pair):
```typescript
export async function saveDeelgebiedenConfig(config: DeelgebiedConfig[]): Promise<boolean> {
  try {
    await store.set(STORE_KEY, JSON.stringify(config));
    await store.save(); // VERPLICHT: set() is alleen in-memory
    _cache = null;      // invalidate cache
    return true;
  } catch (e: any) {
    console.warn('[deelgebieden.ts] plugin-store write error:', e);
    return false;
  }
}
```

**reset function pattern** (mirrors leerlijnen.ts lines 95-103):
```typescript
export async function resetDeelgebiedenConfig(): Promise<void> {
  try {
    await store.delete(STORE_KEY);
    await store.save();
  } catch (e: any) {
    console.warn('[deelgebieden.ts] plugin-store remove error:', e);
  }
  _cache = null;
}
```

**Derived helper** (unique to deelgebieden — needed by prognosis + matrix):
```typescript
// Returns array of active deelgebied IDs for berekenPrognose parameter
export function getActiveDGIds(config: DeelgebiedConfig[]): string[] {
  return config.filter(c => c.active).map(c => c.id);
}
```

---

### `utils/verzuimDrempels.ts` (utility, CRUD)

**Analog:** `utils/leerlijnen.ts` (same LazyStore pattern) + `utils/settings.ts` (simpler object shape).

**Key difference from leerlijnen.ts:** Stores a plain object (not JSON-stringified array). Mirrors `settings.ts` lines 33-36 where `store.set('settings', settings)` passes the object directly (not stringified).

**Imports + constants** (pattern from settings.ts lines 7-10):
```typescript
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const STORE_KEY = 'verzuim_drempels';
```

**Interface + defaults** (CONTEXT.md D-16 + RESEARCH.md pattern 2):
```typescript
export interface VerzuimDrempels {
  geoorloofd:   number; // minutes; default 900 (15u)
  ongeoorloofd: number; // minutes; default 600 (10u — preserves VERZUIM_DREMPEL_MIN)
}

export const DEFAULT_VERZUIM_DREMPELS: VerzuimDrempels = {
  geoorloofd:   900,
  ongeoorloofd: 600,
};

let _cache: VerzuimDrempels | null = null;
```

**Synchronous cache accessor** (NEW pattern, needed because berekenStatus is sync — per RESEARCH.md critical discovery §1 + §5):
```typescript
export function getVerzuimDrempelsSync(): VerzuimDrempels {
  return _cache ?? DEFAULT_VERZUIM_DREMPELS;
}
```

**Async load** (pattern from settings.ts lines 22-25):
```typescript
export async function loadVerzuimDrempels(): Promise<VerzuimDrempels> {
  if (_cache !== null) return _cache;
  try {
    const raw = await store.get<VerzuimDrempels>(STORE_KEY);
    if (raw && typeof raw.geoorloofd === 'number' && typeof raw.ongeoorloofd === 'number') {
      _cache = raw;
      return _cache;
    }
  } catch (e: any) {
    console.warn('[verzuimDrempels.ts] read error:', e);
  }
  _cache = { ...DEFAULT_VERZUIM_DREMPELS };
  return _cache;
}
```

**Save function** (pattern from settings.ts lines 33-36 — CRITICAL: set + save):
```typescript
export async function saveVerzuimDrempels(drempels: VerzuimDrempels): Promise<boolean> {
  try {
    await store.set(STORE_KEY, drempels);
    await store.save(); // VERPLICHT
    _cache = drempels;  // update cache immediately (pitfall 5: update state before async write)
    return true;
  } catch (e: any) {
    console.warn('[verzuimDrempels.ts] plugin-store write error:', e);
    return false;
  }
}
```

---

### `utils/bpv.ts` (utility, CRUD)

**Analog:** `utils/leerlijnen.ts` (LazyStore pattern), `utils/settings.ts` (simple object shape).

**Two keys:** `'bpv_config'` (expected uren) and `'bpv_data'` (per-student actual uren from Excel). Both in same `store.json`.

**Interfaces** (CONTEXT.md D-17 + RESEARCH.md code examples):
```typescript
export interface BpvConfig {
  verwachteUren: number; // default 200 per RESEARCH.md D-14
}

export interface BpvStudentRecord {
  gerealiseerdeUren: number;
}

export type BpvData = Record<string, BpvStudentRecord>; // keyed by leerlingId
```

**Config get/save** — same pattern as `loadVerzuimDrempels` / `saveVerzuimDrempels` above with key `'bpv_config'` and default `{ verwachteUren: 200 }`.

**Data get/save** — same pattern with key `'bpv_data'`, stored as JSON string (object may be large). Default: `{}`.

**Progress helper** (utility function for BpvProgressSection):
```typescript
export function berekenBpvPct(gerealiseerd: number, verwacht: number): number {
  if (!verwacht) return 0;
  return Math.min(100, Math.round((gerealiseerd / verwacht) * 100));
}
```

---

### `utils/leerlijnen.ts` (MODIFY — add sync accessor)

**Self-modification.** Add one new export after the existing `resetLeerlijnenMapping` (line 103):

**New sync cache accessor** (RESEARCH.md critical discovery §1 + §2, proposed pattern):
```typescript
/**
 * getLeerlijnenMappingSync()
 * Returns cached mapping synchronously, or schema defaults if cache is cold.
 * Use in berekenPrognose() (and any other sync call site) instead of the async version.
 * Pre-warm the cache by calling getLeerlijnenMapping() at app startup.
 */
export function getLeerlijnenMappingSync(): Record<string, string> {
  if (_cachedMapping !== null) return _cachedMapping;
  // Cache cold: return schema defaults (same as buildDefault())
  return buildDefault();
}
```

---

### `utils/prognosis.ts` (MODIFY — add activeDeelgebiedenIds param)

**Self-modification.** Two changes:

**1. Fix sync call to async getLeerlijnenMapping (line 59).**

Current (line 15-16 imports + line 59 usage):
```typescript
import { getLeerlijnenMapping } from './leerlijnen';
// ...
const mapping = getLeerlijnenMapping(); // BUG: async called without await
```

Replace with:
```typescript
import { getLeerlijnenMappingSync } from './leerlijnen';
// ...
const mapping = getLeerlijnenMappingSync(); // sync cache accessor
```

**2. Add activeDeelgebiedenIds parameter to berekenPrognose (line 110) and telLeerlijnen (line 55).**

Current signature (line 110):
```typescript
export function berekenPrognose(student: any, traject?: string): any {
```

Modified signature:
```typescript
export function berekenPrognose(
  student: any,
  traject?: string,
  activeDeelgebiedenIds?: string[]
): any {
```

Pass activeDeelgebiedenIds into telLeerlijnen — modify telLeerlijnen signature (line 55) and filter pattern (lines 56, 63-65):

Current (line 56 + 63-65):
```typescript
function telLeerlijnen(scores: any): any {
  const deelgebieden = DEELGEBIEDEN;
  // ...
  var dgs = deelgebieden.filter(function(dg: any) {
    var dgLeerlijn = mapping[dg.id] || dg.group;
    return dgLeerlijn === ll;
  });
```

Modified:
```typescript
function telLeerlijnen(scores: any, activeDeelgebiedenIds?: string[]): any {
  const deelgebieden = activeDeelgebiedenIds
    ? DEELGEBIEDEN.filter(dg => activeDeelgebiedenIds.includes(dg.id))
    : DEELGEBIEDEN;
  // ...
  var dgs = deelgebieden.filter(function(dg: any) {
    var dgLeerlijn = mapping[dg.id] || dg.group;
    return dgLeerlijn === ll;
  });
```

---

### `src/utils/status.ts` (MODIFY — runtime thresholds)

**Self-modification.** Two changes:

**1. Remove hardcoded constant (line 15) and add optional threshold parameter.**

Remove:
```typescript
const VERZUIM_DREMPEL_MIN = 600; // line 15
```

**2. Modify berekenStatus signature (line 115) and add geoorloofd check.**

Current signature (line 115):
```typescript
export function berekenStatus(student: any, traject?: string): StatusResult {
```

Modified signature:
```typescript
export function berekenStatus(
  student: any,
  traject?: string,
  thresholds?: { geoorloofd: number; ongeoorloofd: number }
): StatusResult {
```

Replace hardcoded check (lines 118-125) with:
```typescript
  const ongeoorloofd = student.verzuim?.ongeoorloofd ?? 0;
  const geoorloofd   = student.verzuim?.geoorloofd   ?? 0;
  const ongeoorloofdrempel = thresholds?.ongeoorloofd ?? 600;  // 10u default
  const geoorloofdrempel   = thresholds?.geoorloofd   ?? 900;  // 15u default
  const heeftScores  = p.totaalVoldoendeOfHoger + p.totaalOnvoldoende > 0;

  if (!heeftScores)                return { kleur: 'grijs',  label: 'Onbekend',        prognose: p };
  if (p.label === 'negatief')      return { kleur: 'rood',   label: 'Risico',          prognose: p };
  if (p.label === 'neutraal')      return { kleur: 'oranje', label: 'Let op',          prognose: p };
  if (ongeoorloofd > ongeoorloofdrempel || geoorloofd > geoorloofdrempel)
                                   return { kleur: 'oranje', label: 'Verzuim',         prognose: p };
```

Note: callers using `getVerzuimDrempelsSync()` from `utils/verzuimDrempels.ts` can pass the threshold without prop drilling. Existing call sites at `DetailWeergave.tsx` line 47 (`berekenStatus(student)`) remain backward-compatible — the optional parameter defaults preserve the current behavior.

---

### `src/components/SettingsPage.tsx` (MODIFY — sections 3 and 4)

**Self-modification.** The section wrappers are already correct (lines 93-103). Only the `<p className="settings-placeholder-text">` placeholders are replaced.

**Pattern for state initialization on mount** (mirrors existing lines 24-44 useEffect pattern):
```typescript
// On mount: load deelgebieden config, verzuim drempels (instant-apply, no save button)
useEffect(() => {
  (async () => {
    try {
      const config = await getDeelgebiedenConfig();
      setDgConfig(config);
      const leerlijnen = await getLeerlijnenMapping();
      setLeerlijnenMapping(leerlijnen);
    } catch (err) {
      console.warn('[SettingsPage] loadDeelgebieden failed:', err);
    }
  })();
}, []);
```

**Pattern for instant-apply handler** (mirrors existing handleToggle lines 47-52):
```typescript
async function handleDgActiveToggle(id: string, active: boolean) {
  const next = dgConfig.map(c => c.id === id ? { ...c, active } : c);
  setDgConfig(next);              // immediate React state update (pitfall 5: update first)
  await saveDeelgebiedenConfig(next); // async persist in background
}
```

**Toggle pattern in JSX** (mirrors existing lines 66-79 toggle-track pattern):
```typescript
<label className="toggle-switch dg-toggle">
  <input
    type="checkbox"
    className="sr-only"
    checked={row.active}
    onChange={e => handleDgActiveToggle(row.id, e.target.checked)}
    aria-label={`${row.label} actief`}
  />
  <span className={`toggle-track${row.active ? ' on' : ''}`}>
    <span className="toggle-thumb" />
  </span>
</label>
```

**Inline confirmation pattern for "Herstel standaard"** (RESEARCH.md pattern 4):
```typescript
const [confirmingReset, setConfirmingReset] = useState(false);

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

**Number input pattern for verzuim thresholds** (RESEARCH.md "Don't Hand-Roll"):
```typescript
<input
  type="number"
  className="settings-number-input"
  min={0}
  max={999}
  step={1}
  value={geoorloofdhuren}
  onChange={e => setGeoorloofdhuren(Number(e.target.value))}
  onBlur={e => {
    // Silent clamp on blur — no error state shown
    const clamped = Math.max(0, Math.min(999, Number(e.target.value)));
    handleSaveGeoorloofd(clamped);
  }}
/>
```

---

### `src/components/DeelgebiedenMatrix.tsx` (MODIFY — filter inactive)

**Self-modification.** Add async config load on mount via `useEffect` + `useState`, then filter `DEELGEBIEDEN` before building `groepDG`.

**Add state + effect** (pattern from SettingsPage.tsx lines 19-44):
```typescript
import { useEffect, useState } from 'react';
import { getDeelgebiedenConfig, type DeelgebiedConfig } from '../../utils/deelgebieden';
import { getLeerlijnenMappingSync } from '../../utils/leerlijnen';

// Inside component:
const [dgConfig, setDgConfig] = useState<DeelgebiedConfig[] | null>(null);

useEffect(() => {
  getDeelgebiedenConfig().then(setDgConfig);
}, []);
```

**Filter DEELGEBIEDEN before groepDG** (replaces existing lines 60-65):

Current (lines 60-65):
```typescript
const groepDG: Record<string, typeof DEELGEBIEDEN> = {};
for (const g of GROEPEN) {
  groepDG[g.key] = DEELGEBIEDEN.filter(dg => dg.group === g.key);
}
const allDG = GROEPEN.flatMap(g => groepDG[g.key]);
```

Modified — also use getLeerlijnenMappingSync for leerlijn-reassignment support (RESEARCH.md pitfall 6):
```typescript
const activeIds = dgConfig ? dgConfig.filter(c => c.active).map(c => c.id) : null;
const mapping = getLeerlijnenMappingSync();
const groepDG: Record<string, typeof DEELGEBIEDEN> = {};
for (const g of GROEPEN) {
  groepDG[g.key] = DEELGEBIEDEN.filter(dg => {
    const dgLeerlijn = mapping[dg.id] || dg.group;
    if (dgLeerlijn !== g.key) return false;
    if (activeIds && !activeIds.includes(dg.id)) return false;
    return true;
  });
}
const allDG = GROEPEN.flatMap(g => groepDG[g.key]);
```

Note: `dg.label` is still used for score key lookups (RESEARCH.md critical discovery §3, pitfall 3 — do not change this).

---

### `src/components/SpiderChartCard.tsx` (MODIFY — filter inactive axes)

**Self-modification.** Add `activeDeelgebiedenIds` prop OR load config internally. Simplest approach (avoids prop drilling): load config via `useEffect`+`useState` same as DeelgebiedenMatrix.

**Current axes build** (lines 15-17):
```typescript
const axes = DEELGEBIEDEN
  .filter(dg => dg.group === group)
  .map(dg => ({ key: dg.label, label: dg.label }));
```

**Modified axes build** (add activeIds filter; keep `dg.label` as key for score lookup — CRITICAL per RESEARCH.md §3):
```typescript
const axes = DEELGEBIEDEN
  .filter(dg => dg.group === group)
  .filter(dg => !activeIds || activeIds.includes(dg.id))
  .map(dg => ({
    key: dg.label,            // CRITICAL: schema label for score lookup (not custom label)
    label: displayLabel(dg),  // custom label from config for display only
  }));
```

Where `displayLabel(dg)` looks up the custom label from `dgConfig` by `dg.id`, falls back to `dg.label` if not found.

---

### `src/components/BpvProgressSection.tsx` (NEW)

**Analog:** `src/components/VerzuimSection.tsx` (lines 1-150) — exact same structure: section wrapper, title, empty state, data display.

**Props interface** (mirrors VerzuimSectionProps pattern):
```typescript
interface BpvProgressSectionProps {
  leerlingId: string;
}
```

**Empty state pattern** (mirrors VerzuimSection lines 20-29):
```typescript
if (!bpvData) {
  return (
    <div className="detail-section">
      <p className="detail-section-title">BPV-voortgang</p>
      <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
        Geen BPV-data — importeer een BPV Excel-bestand om dit te zien.
      </p>
    </div>
  );
}
```

**Progress bar pattern** (simpler than verzuim bar — single fill, uses CSS class from section 25):
```typescript
<div className="bpv-bar-track">
  <div
    className="bpv-bar-fill"
    style={{ width: `${pct}%` }}
  />
</div>
```

**State load pattern** (mirrors VerzuimSection using student prop, but BPV uses async load):
```typescript
const [bpvConfig, setBpvConfig] = useState<BpvConfig | null>(null);
const [bpvRecord, setBpvRecord] = useState<BpvStudentRecord | null>(null);

useEffect(() => {
  Promise.all([getBpvConfig(), getBpvData()]).then(([config, data]) => {
    setBpvConfig(config);
    setBpvRecord(data[leerlingId] ?? null);
  });
}, [leerlingId]);
```

---

### `src/components/DetailWeergave.tsx` (MODIFY — add BpvProgressSection)

**Self-modification.** Add import and insert `<BpvProgressSection>` after `<VerzuimSection>` (line 164).

**Import to add** (follows existing import list pattern lines 1-13):
```typescript
import BpvProgressSection from './BpvProgressSection';
```

**Insert after line 164** (`<VerzuimSection student={student} />`):
```typescript
{/* Section 8: VerzuimSection */}
<VerzuimSection student={student} />

{/* Section 8b: BpvProgressSection — per D-12, DetailWeergave only */}
<BpvProgressSection leerlingId={leerlingId} />

{/* Section 9: VakkenSection */}
<VakkenSection student={student} />
```

Also update VerzuimSection threshold: add the ongeoorloofd threshold prop to VerzuimSection so it can use the runtime value instead of the hardcoded `> 600` at `VerzuimSection.tsx` line 43. Pass the sync threshold from `getVerzuimDrempelsSync().ongeoorloofd`.

---

### `src/index.css` (MODIFY — add section 25)

**Self-modification.** Append after section 24 (which ends around line 1040).

**Section header pattern** (mirrors existing section 24 header at lines 1005-1007):
```css
/* --------------------------------------------------------------------------
   25. SettingsPage Phase 18 — Deelgebieden & Drempelwaarden
   -------------------------------------------------------------------------- */
```

Full CSS block is already specified verbatim in RESEARCH.md lines 541-646. Copy directly from there. Key classes:
- `.dg-settings-table-wrap`, `.dg-settings-table`, `.dg-settings-row` — table container
- `.dg-naam-input` — inline text input for deelgebied name
- `.dg-leerlijn-select` — dropdown for leerlijn assignment
- `.dg-toggle` — size override for toggle in table context (reuses `.toggle-track`/`.toggle-thumb`)
- `.settings-threshold-group`, `.settings-threshold-row`, `.settings-number-input` — threshold inputs
- `.bpv-progress-wrap`, `.bpv-bar-track`, `.bpv-bar-fill` — BPV progress bar

---

## Shared Patterns

### LazyStore Cache Pattern
**Source:** `utils/leerlijnen.ts` (entire file, 105 lines)
**Apply to:** `utils/deelgebieden.ts`, `utils/verzuimDrempels.ts`, `utils/bpv.ts`

Core rules:
1. Module-level `LazyStore('store.json', { defaults: {}, autoSave: false })` — same file, different key
2. Module-level `let _cache: T | null = null` — null means unloaded
3. `get()` — check cache first, then async store read, then build default
4. `save()` — ALWAYS pair `store.set(key, val)` + `store.save()` (Phase 12 pitfall)
5. `reset()` — `store.delete(key)` + `store.save()` + null cache

### Synchronous Cache Accessor Pattern
**Source:** RESEARCH.md critical discovery §1 + proposed `getLeerlijnenMappingSync()` pattern
**Apply to:** `utils/leerlijnen.ts` (new export), `utils/verzuimDrempels.ts` (new export)

```typescript
export function getXxxSync(): T {
  return _cache ?? DEFAULT_XXX;
}
```

Required because `berekenPrognose()` and `berekenStatus()` are synchronous and called from React render paths. Pre-warm by calling the async loader at app startup.

### Instant-Apply Pattern (No Save Button)
**Source:** `src/components/SettingsPage.tsx` lines 47-52 (`handleToggle`)
**Apply to:** All handlers in SettingsPage sections 3 and 4

```typescript
async function handleXxx(value: T) {
  setLocalState(value);      // 1. Update React state immediately (pitfall 5)
  await saveXxx(value);      // 2. Persist to store in background
}
```

### Toggle Switch Pattern
**Source:** `src/components/SettingsPage.tsx` lines 66-79
**Apply to:** Active toggle column in deelgebieden settings table

Reuse existing CSS classes `.toggle-switch`, `.toggle-track`, `.toggle-thumb`. Apply `.dg-toggle` size override class from section 25 CSS.

### Error Handling in Async Loads
**Source:** `src/components/SettingsPage.tsx` lines 36-43
**Apply to:** All `useEffect` async loads in new components

```typescript
try {
  const result = await loadXxx();
  setState(result);
} catch (err) {
  console.warn('[ComponentName] loadXxx failed:', err);
  // leave state at default — no crash, no visible error
}
```

### LazyStore Mock Pattern (Tests)
**Source:** `tests/SettingsPage.test.tsx` lines 12-34
**Apply to:** `tests/deelgebieden.test.ts`, `tests/verzuimDrempels.test.ts`, `tests/bpv.test.ts`, `tests/leerlijnen.test.ts` (extended)

```typescript
const { getStoreMap, setStoreMap } = vi.hoisted(() => {
  let _map = new Map<string, unknown>();
  return {
    getStoreMap: () => _map,
    setStoreMap: (m: Map<string, unknown>) => { _map = m; },
  };
});

vi.mock('@tauri-apps/plugin-store', () => {
  class LazyStore {
    async get<T>(key: string): Promise<T | null> {
      return (getStoreMap().get(key) as T) ?? null;
    }
    async set(key: string, value: unknown): Promise<void> {
      getStoreMap().set(key, value);
    }
    async save(): Promise<void> {}
    async delete(key: string): Promise<void> { getStoreMap().delete(key); }
  }
  return { LazyStore };
});
```

Note: add `async delete()` to the mock since `resetXxx()` functions call `store.delete()` (leerlijnen.ts line 97). The existing mock in SettingsPage.test.tsx omits it — extend for new test files.

### Section Wrapper Pattern in DetailWeergave
**Source:** `src/components/VerzuimSection.tsx` lines 19-29 (section wrapper + empty state)
**Apply to:** `src/components/BpvProgressSection.tsx`

```tsx
return (
  <div className="detail-section">
    <p className="detail-section-title">[Section Title]</p>
    {/* content or empty state */}
  </div>
);
```

---

## No Analog Found

All files have analogs. No entries.

---

## Critical Anti-Patterns to Avoid

Per RESEARCH.md — these must be called out explicitly for the planner:

1. **Do NOT call `getLeerlijnenMapping()` without `await`** — use the new `getLeerlijnenMappingSync()` in all sync call sites. The current call in `prognosis.ts` line 59 is a bug to fix, not a pattern to copy.

2. **Do NOT call `store.set()` without `store.save()`** — every mutation must pair both calls (Phase 12 pitfall, confirmed from leerlijnen.ts save pattern).

3. **Do NOT delete student scores when marking deelgebied inactive** — D-04 is locked. Inactive state filters display only. The config always stores all 19 entries regardless of active state.

4. **Do NOT use custom label as score lookup key** — `deelgebiedScores` is keyed by the original schema `dg.label`. Use `dg.label` for lookups; use the custom config label only for display (RESEARCH.md pitfall 3).

5. **Do NOT mutate the `DEELGEBIEDEN` array from `schema.ts`** — it is a compile-time constant and reset target. Runtime config lives in `store.json` only.

---

## Metadata

**Analog search scope:** `utils/`, `src/utils/`, `src/components/`, `tests/`
**Files read:** `utils/leerlijnen.ts`, `utils/settings.ts`, `utils/prognosis.ts`, `utils/schema.ts`, `src/utils/status.ts`, `src/components/SettingsPage.tsx`, `src/components/DeelgebiedenMatrix.tsx`, `src/components/SpiderChartCard.tsx`, `src/components/DetailWeergave.tsx`, `src/components/VerzuimSection.tsx`, `src/index.css` (sections 23-24), `tests/SettingsPage.test.tsx`, `tests/status.test.ts`
**Pattern extraction date:** 2026-05-18
