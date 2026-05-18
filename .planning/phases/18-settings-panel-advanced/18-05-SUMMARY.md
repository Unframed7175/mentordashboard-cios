---
phase: 18-settings-panel-advanced
plan: "05"
subsystem: settings-ui
tags: [settings-ui, thresholds, bpv, matrix-filter, spider-filter, detail-weergave, css, wave-3]
dependency_graph:
  requires:
    - 18-02 (utils/deelgebieden.ts + utils/verzuimDrempels.ts + utils/bpv.ts + getDeelgebiedenConfigSync + getLeerlijnenMappingSync)
    - 18-03 (berekenStatus runtime thresholds + VerzuimSection runtime ongeoorloofd)
    - 18-04 (SettingsPage section 3 deelgebieden table + CSS section 25 dg-* rules)
  provides:
    - src/components/SettingsPage.tsx — section 4 with threshold inputs + BPV config + import button (SET-05, SET-06)
    - src/components/BpvProgressSection.tsx — new component: empty state + progress bar + stats row (SET-06)
    - src/components/DeelgebiedenMatrix.tsx — active-deelgebied filter + runtime leerlijn-mapping group assignment (SET-03, SET-04)
    - src/components/SpiderChartCard.tsx — active-deelgebied filter + Invariant I1 score-key preserved (SET-03)
    - src/components/DetailWeergave.tsx — BpvProgressSection mounted between VerzuimSection and VakkenSection (D-12)
    - src/index.css — CSS section 25 completion (threshold + BPV classes appended below dg-* rules)
  affects:
    - All students' DetailWeergave views (BPV section now rendered)
    - DeelgebiedenMatrix and SpiderChartCard rendering (inactive deelgebieden now hidden)
tech_stack:
  added: []
  patterns:
    - Sync cache accessor pattern (getDeelgebiedenConfigSync, getLeerlijnenMappingSync) — no useState/useEffect in matrix/spider
    - Hidden file input ref pattern for BPV Excel import (no external library)
    - D-13 stub: parseBpvExcel returns {} — error copy shown only on exception (I3)
    - I2: threshold hours→minutes×60 on save; minutes÷60 on load
    - I4: CSS appended below existing section 25 dg-* rules, no duplicate section header
key_files:
  created:
    - src/components/BpvProgressSection.tsx
  modified:
    - src/components/SettingsPage.tsx (section 4 implemented, section 4 placeholder removed)
    - src/components/DeelgebiedenMatrix.tsx (active filter + leerlijn-mapping)
    - src/components/SpiderChartCard.tsx (active filter + Invariant I1)
    - src/components/DetailWeergave.tsx (BpvProgressSection import + mount)
    - src/index.css (section 25 completed with 6 threshold/BPV classes)
decisions:
  - "Sync accessors (getDeelgebiedenConfigSync + getLeerlijnenMappingSync) used in DeelgebiedenMatrix and SpiderChartCard — no useState/useEffect needed; main.tsx pre-warm guarantees populated cache at render time"
  - "BpvProgressSection uses Promise.all([getBpvConfig(), getBpvData()]) in useEffect — async load appropriate since BPV data is per-student and not pre-warmed"
  - "parseBpvExcel D-13 stub: returns {} successfully — bpvImportError state path only fires on exception (I3)"
  - "Threshold inputs use onChange (instant-apply per UI-SPEC); I2: hours×60 for storage, ÷60 for display"
  - "axis.key = dg.label in SpiderChartCard (Invariant I1 — score-key invariant preserved; Pitfall 3)"
metrics:
  duration: "360s"
  completed: "2026-05-18"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 5
---

# Phase 18 Plan 05: Wave 3 UI Completion Summary

**One-liner:** Section 4 threshold inputs (hours→minutes×60) + BPV config + import button in SettingsPage, new BpvProgressSection component with empty/populated states, active-deelgebied filtering in DeelgebiedenMatrix and SpiderChartCard with Invariant I1 preserved, and CSS section 25 completed with all 6 threshold/BPV classes.

## What Was Built

Wave 3 completes all Phase 18 UI deliverables. After this plan the full settings panel, the BPV progress view, and the active-deelgebied filtering are operational.

### Section 4 Final Structure (SettingsPage)

```
<section className="detail-section">
  <h2 className="detail-section-title">Drempelwaarden & BPV-uren</h2>

  <div className="settings-threshold-group">          <!-- flex column, gap 8px, mb 16px -->
    <div className="settings-threshold-row">           <!-- Geoorloofd row -->
      <label style={{ minWidth: 160 }}>Geoorloofd verzuim waarschuwing</label>
      <input type="number" className="settings-number-input" min={0} max={200} step={1} value={geoorloofdHours} onChange={...} />
      <span>uur</span>
    </div>
    <div className="settings-threshold-row">           <!-- Ongeoorloofd row -->
      <label style={{ minWidth: 160 }}>Ongeoorloofd verzuim waarschuwing</label>
      <input type="number" className="settings-number-input" min={0} max={200} step={1} value={ongeoorloofdHours} onChange={...} />
      <span>uur</span>
    </div>
  </div>

  <hr />

  <div className="settings-threshold-row">            <!-- BPV expected hours row -->
    <label style={{ minWidth: 160 }}>Verwachte BPV-uren per periode</label>
    <input type="number" className="settings-number-input" min={0} max={9999} step={1} value={bpvUren} onChange={...} />
    <span>uur</span>
  </div>
  <input type="file" ref={fileInputRef} accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleBpvImportFile} />
  <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>BPV-uren importeren</button>
  <p>Importeer de BPV Excel om gerealiseerde uren per leerling bij te houden.</p>
  {bpvImportError && <p style={{ color: '#EF4444' }}>{bpvImportError}</p>}
</section>
```

**Invariant I2 confirmed:** On load, `drempels.geoorloofd / 60` (minutes → hours); on save, `hours * 60` (hours → minutes). Appears twice (once per threshold save call).

### BpvProgressSection Structure

| State | Render |
|-------|--------|
| `bpvConfig === null \|\| record === null` | Empty state: `"Geen BPV-data — importeer de BPV Excel via Instellingen."` |
| Both non-null | `<div className="bpv-progress-wrap">` with bar row + stats row |

**Bar row:**
- `<div className="bpv-bar-track"><div className="bpv-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: overshoot ? '#22C55E' : undefined }} /></div>`
- `#22C55E` overshoot green — fires when `gerealiseerd >= verwacht`
- Percentage label `{pct}%` at 14px / 700 / text-primary

**Stats row:** three stats — Gerealiseerd / Verwacht / Verschil (each with 11px uppercase text-muted label + 14px 700 text-primary value). Verschil prefixed `+` when non-negative, `−` when negative.

### DeelgebiedenMatrix — Invariant I1 Confirmation

`getDeelgebiedenConfigSync()` and `getLeerlijnenMappingSync()` called synchronously inside the render function body (no hooks). Active filter built as `new Set(dgConfig.filter(c => c.active).map(c => c.id))`.

**Score lookups use `dg.label` (schema label) throughout:**
- `dp.scores[dg.label]` — datapunt score lookup (line unchanged)
- `scores1[dg.label]`, `scores2[dg.label]` — period comparison rows (unchanged)
- `aggregationDetail[dg.label]` — Eindoordeel footer (unchanged)

Only the column header display label uses `labelById.get(dg.id) ?? dg.label` (custom label for display).

**Runtime leerlijn-mapping group assignment (Pitfall 6):** `const dgLeerlijn = mapping[dg.id] || dg.group` — reassigned deelgebieden appear in the user-configured leerlijn column, not just the schema default.

### SpiderChartCard — Invariant I1 Confirmation

```typescript
// SCORE-KEY INVARIANT (Phase 18): axis.key MUST be the schema dg.label to match deelgebiedScores storage keys
const axes = DEELGEBIEDEN
  .filter(dg => dg.group === group)
  .filter(dg => activeIds.has(dg.id))
  .map(dg => ({
    key: dg.label,                            // CRITICAL: schema label for score lookup (Pitfall 3 / Invariant I1)
    label: labelById.get(dg.id) ?? dg.label,  // custom label for display only
  }));
```

`dg.id` is NOT used as score lookup key anywhere in this file.

### BPV Parser — D-13 Stub Confirmation

`parseBpvExcel` in `utils/bpv.ts` is the D-13 stub returning `{}`. The import button:
1. Triggers hidden `<input type="file">` via ref
2. Reads file as `ArrayBuffer` via `file.arrayBuffer()`
3. Calls `parseBpvExcel(buffer)` — stub returns `{}` successfully
4. Merges `{}` with existing data → `saveBpvData(merged)` — no-op (no records)
5. `setBpvImportError(null)` — no error shown

**Error path fires only if `parseBpvExcel` throws OR returns `null`/non-object.** With the current stub, neither condition is met. This is intentional until the real parser ships (user must supply a sample BPV Excel file).

### CSS Section 25 — Completion

6 new classes appended below the existing 16 dg-* rules (same section 25 block, no new section header):

| Class | Role |
|-------|------|
| `.settings-threshold-group` | Flex column container, gap 8px, margin-bottom 16px |
| `.settings-threshold-row` | Flex row, align-items center, gap 8px |
| `.settings-number-input` | 80px wide number input, text-align right, border-focus ring |
| `.settings-number-input:focus` | Border-focus + 3px accent box-shadow |
| `.bpv-progress-wrap` | Flex column, gap 8px |
| `.bpv-bar-track` | flex: 1, height 8px, border-radius 4px, overflow hidden |
| `.bpv-bar-fill` | height 100%, background var(--accent), transition width 300ms ease |

`src/index.css` contains exactly ONE occurrence of `25. SettingsPage Phase 18` (the section header from Plan 18-04). All dg-* rules from 18-04 are untouched.

## Test Counts

- Full suite: **89/89 passed** | 5 skipped (pre-existing skips, unrelated to Phase 18)
- typecheck-migrated: **0 errors**
- Pre-existing SettingsPage tests: **6/6 GREEN** (unchanged)
- Phase 18 utility tests (18-01 scope): **20/20 GREEN** (unchanged)
- Phase 18 backend tests (18-03 scope): **8/8 GREEN** (unchanged)
- Phase 18 SettingsPage section 3 tests (18-04 scope): **8/8 GREEN** (unchanged)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `parseBpvExcel` returns `{}` | `utils/bpv.ts` | ~130 | D-13: no sample BPV Excel file available. Import button calls it without error (empty merge). Replace when mentor supplies sample file. |
| `bpvImportError` never fires in normal use | `src/components/SettingsPage.tsx` | section 4 | D-13: error path only triggers if parseBpvExcel throws; current stub never throws. Intentional until real parser ships. |

## Threat Flags

No new threat surface introduced. BpvProgressSection reads only from the bpv store (no new network endpoints). The file input in SettingsPage reads an ArrayBuffer client-side — no server upload, no path traversal. All user-supplied strings are rendered via React JSX (no `dangerouslySetInnerHTML`).

## Self-Check: PASSED

- src/components/SettingsPage.tsx: contains `settings-threshold-group`, `settings-threshold-row`, `settings-number-input`, `Geoorloofd verzuim waarschuwing`, `Ongeoorloofd verzuim waarschuwing`, `Verwachte BPV-uren per periode`, `BPV-uren importeren`, `Importeer de BPV Excel om gerealiseerde uren per leerling bij te houden.`, `parseBpvExcel`, `saveBpvData`, `saveVerzuimDrempels`, `saveBpvConfig`, `Onbekend BPV-bestandsformaat. Probeer een ander bestand.`, `* 60` (×2 threshold saves), does NOT contain `Komt in een volgende versie`
- src/components/BpvProgressSection.tsx: EXISTS, contains `BPV-uren`, `Geen BPV-data — importeer de BPV Excel via Instellingen.`, `Gerealiseerd`, `Verwacht`, `Verschil`, `bpv-bar-track`, `bpv-bar-fill`, `berekenBpvPct`, `getBpvConfig`, `getBpvData`, `#22C55E`
- src/components/DeelgebiedenMatrix.tsx: contains `getDeelgebiedenConfigSync`, `getLeerlijnenMappingSync`, `activeIds`, `mapping[dg.id] || dg.group`
- src/components/SpiderChartCard.tsx: contains `getDeelgebiedenConfigSync`, `activeIds`, `key: dg.label`, `label: labelById.get(dg.id)`
- src/components/DetailWeergave.tsx: contains `import BpvProgressSection from './BpvProgressSection'`, `<BpvProgressSection leerlingId={leerlingId} />`, appears after VerzuimSection and before VakkenSection
- src/index.css: contains `.settings-threshold-group`, `.settings-threshold-row`, `.settings-number-input`, `.bpv-progress-wrap`, `.bpv-bar-track`, `.bpv-bar-fill`, exactly 1 occurrence of `25. SettingsPage Phase 18`, still contains `.dg-settings-table-wrap`, `.dg-naam-input`, `.dg-leerlijn-select`, `.dg-toggle`
- Commits: 9c1b2bc (Task 1 — SettingsPage + BpvProgressSection), c68191a (Task 2 — DeelgebiedenMatrix + SpiderChartCard), d1f0708 (Task 3 — DetailWeergave + CSS)
- npm test -- --run: 89/89 passed (5 skipped)
- npm run typecheck-migrated: 0 errors
