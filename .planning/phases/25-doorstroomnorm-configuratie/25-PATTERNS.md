# Phase 25: Doorstroomnorm Configuratie - Pattern Map

**Mapped:** 2026-05-21
**Files analyzed:** 6 (2 new, 4 modified)
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `utils/normen.ts` | utility (persistence) | request-response (sync cache + async store) | `utils/verzuimDrempels.ts` | exact |
| `utils/prognosis.ts` | utility (domain logic) | transform (sync computation) | `utils/prognosis.ts` (self — parametrisation) | exact (same file) |
| `src/components/SettingsPage.tsx` | component | request-response (controlled inputs + blur/Enter) | `src/components/SettingsPage.tsx` Section 4 (self — add section 5) | exact (same file) |
| `src/App.tsx` | component (orchestrator) | event-driven (callback + state counter) | `src/App.tsx` `handleImportComplete`/`handleKlasSwitch` `setRefreshKey` pattern | exact (same file) |
| `src/main.tsx` | config/startup | batch (pre-warm Promise.all) | `src/main.tsx` existing `Promise.all` block | exact (same file) |
| `tests/normen.test.ts` | test | — | `tests/verzuimDrempels.test.ts` | exact |

---

## Pattern Assignments

### `utils/normen.ts` (utility, persistence — NEW file)

**Analog:** `utils/verzuimDrempels.ts` — copy as starting point, adapt key names and type.

**Imports + module-level setup** (`utils/verzuimDrempels.ts` lines 11–15):
```typescript
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const STORE_KEY = 'verzuim_drempels';          // → change to 'doorstroom_normen'
let _cache: VerzuimDrempels | null = null;     // → change to Normen | null
```

**Interface + defaults pattern** (`utils/verzuimDrempels.ts` lines 17–27):
```typescript
export interface VerzuimDrempels {
  geoorloofd:   number;
  ongeoorloofd: number;
}

export const DEFAULT_VERZUIM_DREMPELS: VerzuimDrempels = {
  geoorloofd:   900,
  ongeoorloofd: 600,
};
```
Adapt to:
```typescript
export interface Normen {
  sbl: number;                 // default 13
  sbc: number;                 // default 15
  negatiefTotaal: number;      // default 6
  negatiefPerLeerlijn: number; // default 2
  bj1Positief: number;         // default 13
  versneldLesgeven: number;    // default 4
  versneldOrganiseren: number; // default 3
  versneldProfHandelen: number;// default 5
}

export const DEFAULT_NORMEN: Normen = {
  sbl: 13, sbc: 15, negatiefTotaal: 6, negatiefPerLeerlijn: 2,
  bj1Positief: 13, versneldLesgeven: 4, versneldOrganiseren: 3, versneldProfHandelen: 5,
};
```

**Sync accessor pattern** (`utils/verzuimDrempels.ts` lines 37–39):
```typescript
export function getVerzuimDrempelsSync(): VerzuimDrempels {
  return _cache ?? DEFAULT_VERZUIM_DREMPELS;
}
```
Adapt to `getNormenSync(): Normen { return _cache ?? DEFAULT_NORMEN; }`.

**Async load with full validation guard** (`utils/verzuimDrempels.ts` lines 48–61):
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
Adapt validation guard to check all 8 Normen fields (`typeof raw.sbl === 'number'` etc.).

**Save with instant-apply + paired store.set/store.save** (`utils/verzuimDrempels.ts` lines 71–81):
```typescript
export async function saveVerzuimDrempels(drempels: VerzuimDrempels): Promise<boolean> {
  _cache = drempels; // instant-apply BEFORE async write (pitfall 5)
  try {
    await store.set(STORE_KEY, drempels);
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.warn('[verzuimDrempels.ts] plugin-store write error:', e);
    return false;
  }
}
```

**Reset pattern** — `verzuimDrempels.ts` has no reset; follow `utils/deelgebieden.ts` reset inline.
Implement as:
```typescript
export async function resetNormen(): Promise<Normen> {
  await saveNormen({ ...DEFAULT_NORMEN });
  return DEFAULT_NORMEN;
}
```

---

### `utils/prognosis.ts` (utility, transform — MODIFY existing file)

**Analog:** Self — parametrisation only. No structural change.

**Current function signature** (`utils/prognosis.ts` line 110):
```typescript
export function berekenPrognose(student: any, traject?: string, activeDeelgebiedenIds?: string[]): any {
```
Add optional `normen` parameter and import:
```typescript
import { getNormenSync, type Normen } from './normen';

export function berekenPrognose(student: any, traject?: string, activeDeelgebiedenIds?: string[], normen?: Normen): any {
  const n = normen ?? getNormenSync();
```

**Hardcoded constants to replace** (complete checklist from lines 127–210):

| Line | Current | Replace with |
|------|---------|-------------|
| 128 | `totaalOnvoldoende > 6` | `totaalOnvoldoende > n.negatiefTotaal` |
| 129 | `telling[ll].onvoldoende > 2` | `telling[ll].onvoldoende > n.negatiefPerLeerlijn` |
| 139–141 | `VERSNELD_BJ1.lesgeven`, `VERSNELD_BJ1.organiseren`, `VERSNELD_BJ1.prof_handelen` | `n.versneldLesgeven`, `n.versneldOrganiseren`, `n.versneldProfHandelen` |
| 144 | `totaalVoldoendeOfHoger >= 13` (BJ1→BJ2) | `>= n.bj1Positief` |
| 158 | `Math.max(0, 13 - totaalVoldoendeOfHoger)` (gaps.nodigBJ2) | `Math.max(0, n.bj1Positief - totaalVoldoendeOfHoger)` |
| 160–162 | `VERSNELD_BJ1.lesgeven/organiseren/prof_handelen` in gaps | `n.versneldLesgeven`, `n.versneldOrganiseren`, `n.versneldProfHandelen` |
| 164 | `6 - totaalOnvoldoende` (gaps.onvoldoendeRuimte, BJ1) | `n.negatiefTotaal - totaalOnvoldoende` |
| 167–169 | `2 - telling[ll].onvoldoende` (gaps BJ1 per leerlijn) | `n.negatiefPerLeerlijn - telling[ll].onvoldoende` |
| 180 | `totaalVoldoendeOfHoger >= 15` (BJ2 SBC) | `>= n.sbc` |
| 183 | `totaalVoldoendeOfHoger >= 13` (BJ2 SBL) | `>= n.sbl` |
| 197 | `Math.max(0, 13 - totaalVoldoendeOfHoger)` (gaps.nodigSBL) | `Math.max(0, n.sbl - totaalVoldoendeOfHoger)` |
| 199 | `Math.max(0, 15 - totaalVoldoendeOfHoger)` (gaps.nodigSBC_deelgebieden) | `Math.max(0, n.sbc - totaalVoldoendeOfHoger)` |
| 203 | `6 - totaalOnvoldoende` (gaps.onvoldoendeRuimte, BJ2) | `n.negatiefTotaal - totaalOnvoldoende` |
| 205–207 | `2 - telling[ll].onvoldoende` (gaps BJ2 per leerlijn) | `n.negatiefPerLeerlijn - telling[ll].onvoldoende` |

The `VERSNELD_BJ1` object (lines 28–32) can be removed after all references are replaced.
`KERN_SBC` (line 24) is NOT replaced — it is a fixed label list, not a configurable threshold.

---

### `src/components/SettingsPage.tsx` (component, request-response — MODIFY: add Section 5)

**Analog:** Self — Section 4 is the direct UI model for Section 5.

**Props interface extension** (`SettingsPage.tsx` lines 25–30):
```typescript
interface SettingsPageProps {
  onBack: () => void;
  onNavigateToImport: () => void;
  isDark: boolean;
  onToggleDark: (isDark: boolean) => void;
  // ADD:
  onNormenChanged: () => void;
}
```

**Import addition** (after existing `loadVerzuimDrempels` import on line 22):
```typescript
import { loadNormen, saveNormen, resetNormen, DEFAULT_NORMEN, type Normen } from '../../utils/normen';
```

**Section 4 state pattern to copy for Section 5** (lines 88–92):
```typescript
// Section 4 state — verzuim thresholds
const [geoorloofdHours, setGeoorloofdHours] = useState<number>(15);
const [ongeoorloofdHours, setOngeoorloofdHours] = useState<number>(10);
```
Add for Section 5:
```typescript
// Section 5 state — doorstroomdrempels
const [normen, setNormen] = useState<Normen>(DEFAULT_NORMEN);
const [confirmingResetNormen, setConfirmingResetNormen] = useState(false);
```

**Section 4 load pattern to copy** (lines 104–113):
```typescript
useEffect(() => {
  Promise.all([loadVerzuimDrempels(), getBpvConfig()])
    .then(([drempels, bpvConfig]) => {
      setGeoorloofdHours(Math.round(drempels.geoorloofd / 60));
      ...
    })
    .catch(err => console.warn('[SettingsPage] section 4 load failed:', err));
}, []);
```
Add separate Section 5 load effect:
```typescript
useEffect(() => {
  loadNormen()
    .then(n => setNormen(n))
    .catch(err => console.warn('[SettingsPage] section 5 load failed:', err));
}, []);
```

**Section 4 number-input blur/Enter save pattern** (lines 156–168) — the Section 4 handlers call save on every onChange. Section 5 differs: save happens only on blur/Enter (D-06, D-07). Handler pattern:
```typescript
async function handleNormenBlur(field: keyof Normen, rawValue: number) {
  const rounded = Math.round(rawValue);
  // clamp per field (see D-09 for min/max)
  const updated = { ...normen, [field]: rounded };
  setNormen(updated);
  await saveNormen(updated);
  onNormenChanged();
}
```

**Section 4 number input JSX pattern** (`SettingsPage.tsx` lines 317–344) — the exact DOM pattern for Section 5 inputs:
```tsx
<div className="settings-threshold-group">
  <div className="settings-threshold-row">
    <label style={{ minWidth: 160 }}>Geoorloofd verzuim waarschuwing</label>
    <input
      type="number"
      className="settings-number-input"
      min={0}
      max={200}
      step={1}
      value={geoorloofdHours}
      onChange={e => handleGeoorloofdChange(Number(e.target.value))}
    />
    <span style={{ color: 'var(--text-muted)' }}>uur</span>
  </div>
</div>
```
Section 5 adds `onBlur` and `onKeyDown` (D-06 blur/Enter trigger, no onChange save):
```tsx
<input
  type="number"
  className="settings-number-input"
  min={1} max={19} step={1}
  value={normen.sbl}
  onChange={e => setNormen(n => ({ ...n, sbl: Number(e.target.value) }))}
  onBlur={() => handleNormenBlur('sbl', normen.sbl)}
  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
/>
```

**Section 3 reset two-button pattern** (`SettingsPage.tsx` lines 289–309) — exact model for Section 5 reset:
```tsx
{!confirmingReset ? (
  <button
    className="btn btn-ghost"
    style={{ marginTop: 8 }}
    onClick={() => setConfirmingReset(true)}
  >
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

**Section wrapper CSS** (lines 312–313, 384) — reuse exactly:
```tsx
<section className="detail-section">
  <h2 className="detail-section-title">Doorstroomdrempels</h2>
  ...
</section>
```

---

### `src/App.tsx` (component/orchestrator, event-driven — MODIFY: add onNormenChanged wiring)

**Analog:** Self — copy the `refreshKey` / `setRefreshKey` pattern already in place.

**Existing refreshKey state** (`App.tsx` line 18):
```typescript
const [refreshKey, setRefreshKey] = useState(0);
```
No new state variable needed (see RESEARCH.md open question 2 resolution).

**Existing setRefreshKey call pattern** (`App.tsx` lines 52–55, 76–78):
```typescript
function handleImportComplete() {
  setRefreshKey(k => k + 1);
  setView('klas');
}
// and:
async function handleKlasSwitch(id: string) {
  await switchActiveKlas(id);
  setRefreshKey(k => k + 1);
  ...
}
```
Add alongside these:
```typescript
function handleNormenChanged() {
  setRefreshKey(k => k + 1);
}
```

**Existing SettingsPage mount** (`App.tsx` lines 144–154):
```tsx
{view === 'settings' && (
  <div className="view-slide-in-right" style={{ overflow: 'hidden' }}>
    <SettingsPage
      key={settingsOpenCount}
      onBack={handleBackFromSettings}
      onNavigateToImport={handleNavigateToImportFromSettings}
      isDark={isDark}
      onToggleDark={handleToggleDark}
    />
  </div>
)}
```
Add `onNormenChanged={handleNormenChanged}` to the `<SettingsPage>` props.

---

### `src/main.tsx` (startup config, batch — MODIFY: add loadNormen to Promise.all)

**Analog:** Self — copy the pre-warm pattern on lines 43–54.

**Existing Promise.all pre-warm block** (`src/main.tsx` lines 43–54):
```typescript
try {
  await Promise.all([
    getDeelgebiedenConfig(),
    loadVerzuimDrempels(),
    getBpvConfig(),
    getBpvData(),
    getLeerlijnenMapping(),
  ]);
} catch (err) {
  console.warn('[main.tsx] Phase 18 cache pre-warm mislukt:', err);
}
```
Add `loadNormen()` to the array and add its import:
```typescript
import { loadNormen } from '../utils/normen';
// ...
await Promise.all([
  getDeelgebiedenConfig(),
  loadVerzuimDrempels(),
  getBpvConfig(),
  getBpvData(),
  getLeerlijnenMapping(),
  loadNormen(),   // Phase 25 — pre-warm doorstroom normen sync cache
]);
```

---

### `tests/normen.test.ts` (test — NEW file)

**Analog:** `tests/verzuimDrempels.test.ts` — copy exactly, adapt to Normen interface.

**vi.hoisted LazyStore mock** (`tests/verzuimDrempels.test.ts` lines 10–32):
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
    async delete(key: string): Promise<void> {
      getStoreMap().delete(key);
    }
  }
  return { LazyStore };
});
```

**beforeEach pattern** (`tests/verzuimDrempels.test.ts` lines 35–38):
```typescript
beforeEach(() => {
  setStoreMap(new Map<string, unknown>());
  vi.resetModules();
});
```

**Test case structure** (`tests/verzuimDrempels.test.ts` lines 42–93) — 4 tests to replicate:
1. `loadNormen` returns `DEFAULT_NORMEN` on cold cache — check all 8 fields
2. `saveNormen` persists round-trip (save → resetModules → reload → compare)
3. `getNormenSync` returns `DEFAULT_NORMEN` when cache cold (no load called)
4. `saveNormen` updates sync cache instantly (pitfall 5)

Additional test required (not in verzuimDrempels.test.ts):
5. `resetNormen` restores all 8 DEFAULT_NORMEN fields

---

## Shared Patterns

### LazyStore store.set() + store.save() pairing
**Source:** `utils/verzuimDrempels.ts` lines 73–76
**Apply to:** `utils/normen.ts` `saveNormen()`
```typescript
await store.set(STORE_KEY, normen);
await store.save(); // VERPLICHT: set() is alleen in-memory
```

### Instant-apply cache-before-await
**Source:** `utils/verzuimDrempels.ts` line 72
**Apply to:** `utils/normen.ts` `saveNormen()`
```typescript
_cache = normen; // instant-apply BEFORE async write
```

### Controlled input onChange + blur/Enter save separation
**Source:** `src/components/SettingsPage.tsx` Section 4 handlers (lines 156–168) — note that Section 4 saves on every onChange. For Section 5 the save is deferred to blur/Enter (D-06). The `NaamInput` component (lines 39–76) shows the correct blur/Enter pattern:
```typescript
function applyIfChanged() { ... onApply(id, trimmed); }
function handleKeyDown(e) {
  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
}
```
Apply the same structure to Section 5 number inputs.

### Math.round() at blur for decimal prevention
**Source:** D-09 decision + pitfall 5 in RESEARCH.md
**Apply to:** `handleNormenBlur` in `SettingsPage.tsx`
```typescript
const rounded = Math.round(rawValue);
```

### refreshKey increment as KlasOverzicht invalidation
**Source:** `src/App.tsx` lines 52–55, 76–78
**Apply to:** `handleNormenChanged` in `App.tsx`
```typescript
setRefreshKey(k => k + 1);
```

---

## No Analog Found

All files have close analogs in the codebase. No novel patterns required.

---

## Metadata

**Analog search scope:** `utils/`, `src/`, `src/components/`, `tests/`
**Files read for pattern extraction:** `utils/verzuimDrempels.ts`, `utils/prognosis.ts`, `src/main.tsx`, `src/App.tsx`, `src/components/SettingsPage.tsx`, `tests/verzuimDrempels.test.ts`
**Pattern extraction date:** 2026-05-21
