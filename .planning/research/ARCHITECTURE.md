## Architecture Research — v2.4

**Project:** Mentor Dashboard (Tauri 2 + React + TypeScript)
**Milestone:** v2.4 — BPV column matchers, Keuzedelen, R&N tiles, non-empty deletion, CSS resizing
**Researched:** 2026-05-28
**Confidence:** HIGH — all findings from direct codebase inspection

---

## Integration Points Per Feature

### Feature 1: BPV Real Column Matchers

**File touched:** `utils/bpv.ts` — `parseBpvExcel()` only

The column-matching logic is factored into the private `_bpvKolom()` helper that takes a priority-ordered array of candidate header strings and performs case-insensitive `includes` matching. Updating column names is purely a data change — replace or prepend the real column names from the sample file into the candidate arrays at lines 246, 251, 259, 265, and 272.

No type changes. No downstream component changes. `BpvData` shape, `saveBpvData()`, and `BpvProgressSection` are all unaffected.

**One risk to verify:** The `llnrMatch` regex (`/^(\d+)(?:[.,]0+)?$/`) strips Excel float formatting from student IDs. If the real `Studentnummer` column contains values like `"12345.0"` (Excel numeric cell), the regex handles it. If it contains leading zeros or alphanumeric IDs, the regex falls back to using the student name as the key — which will break matching against `leerlingId`. Inspect the actual column values in the sample file with `debugBpvExcel()` before writing matchers.

---

### Feature 2: Keuzedelen Per Student

**Files touched:**
- `utils/datamodel.ts` — add `Keuzedeel` JSDoc typedef and `keuzedelen?: Keuzedeel[]` field to the `StudentRecord` typedef comment
- `src/components/DetailWeergave.tsx` — add `<KeuzedeelSection />` call in the section list
- `src/components/KeuzedeelSection.tsx` — **new component**

`utils/klassen.ts` and `saveKlassen()` require no changes. The encrypted blob is the entire `klassenState.klassen` object serialised as JSON — new fields on student records are included automatically.

**Data flow:**
```
KeuzedeelSection
  receives: student (original klassenState array reference)
  mutates:  student.keuzedelen[] in-place on ALL matching records (same leerlingId)
  calls:    saveKlassen() → AES-encrypt → plugin-store.set() + .save()
  calls:    onSaved() → DetailWeergave setRevision(r + 1) → re-render
```

**Canonical pattern to follow:** `RekenenNederlandsSection.tsx` (lines 20–35). Receives `student: any` prop, iterates `klas.students.filter(s => s.leerlingId === student.leerlingId)` to update ALL period records, calls `saveKlassen()`, calls `onSaved?.()`. Do not spread the student object — the `DetailWeergave` comment at line 45 explains why copies break the write path.

**Keuzedeel type (for datamodel.ts JSDoc):**
```
@typedef {Object} Keuzedeel
@property {string} naam        — e.g. "Sport & Bewegen 2"
@property {string} [status]    — 'gehaald' | 'bezig' | 'niet gehaald' | ''
@property {string} [notitie]   — free-text memo
```

**Where to insert in DetailWeergave:** After `RekenenNederlandsSection`, before `FeedbackActiepuntenSection` — it is student-administrative data, not feedback, so it belongs with R&N rather than with feedback/actiepunten.

---

### Feature 3: R&N Badges on Tiles

**Files touched:**
- `src/components/LeerlingTegel.tsx` — extend `StudentProps` interface, add badge render
- No changes to `KlasOverzicht.tsx`, `App.tsx`, or any utility

**Current state:** `LeerlingTegel` receives a `student: StudentProps` prop where `StudentProps` has `naam`, `leerlingId`, `verzuim?`. The `rekenResultaat` and `nederlandsResultaat` fields already exist on student records (written by `RekenenNederlandsSection`, persisted via `saveKlassen()`). `KlasOverzicht` passes the raw student object directly as `student={s}` — TypeScript just needs the interface updated to expose the fields.

**Change to `StudentProps` in LeerlingTegel.tsx:**
```ts
interface StudentProps {
  naam: string;
  leerlingId: string;
  verzuim?: { aanwezigheid: number; geoorloofd: number; ongeoorloofd: number; };
  rekenResultaat?: string | null;
  nederlandsResultaat?: string | null;
}
```

**Badge rendering:** Import `normalizeRekenScore` from `utils/schema.ts` (same function used by `RekenenNederlandsSection` line 38). Derive a badge colour and abbreviated label from the normalised value (`'goed'` | `'voldoende'` | `'onvoldoende'` | `null`). Show nothing when null (field not set).

**Data flow (no new wiring needed):**
```
RekenenNederlandsSection saves
  → klassenState mutated (in-place reference)
  → onSaved() → DetailWeergave setRevision
  → user navigates back to klas view
  → App.tsx refreshKey already increments on klas switch / detail-back triggers
  → KlasOverzicht re-renders, getActiveStudents() returns updated objects
  → LeerlingTegel receives student with rekenResultaat/nederlandsResultaat set
  → badges render
```

Note: if badges should appear immediately after saving in the detail view without a full klas-switch, `DetailWeergave.onBack` will trigger a re-render of `KlasOverzicht` which picks up the latest values. No additional wiring needed.

---

### Feature 4: Non-Empty Class Deletion

**Files touched:**
- `src/App.tsx` — one line change to the `canDelete` predicate (line 156)

**Current gate (App.tsx line 156):**
```ts
canDelete: Array.isArray(klas.students) && klas.students.length === 0,
```

**`deleteKlas()` in `utils/klassen.ts`** already handles non-empty deletion correctly: deletes the class from `klassenState.klassen`, switches to the first remaining class (or sets `activeKlasId = null`), calls `saveKlassen()`. No changes needed in `klassen.ts`.

**`handleDeleteKlas()` in App.tsx** already shows `window.confirm()` with the class name before calling `deleteKlas()`.

**Minimal change:** Set `canDelete: true` for all classes. Optionally improve the confirm message to show student count:

```ts
// In handleDeleteKlas():
const studentCount = klassenState.klassen[klasId]?.students?.length ?? 0;
const countMsg = studentCount > 0 ? ` Dit verwijdert ook ${studentCount} leerling${studentCount === 1 ? '' : 'en'}.` : '';
const confirmed = window.confirm(
  `Klas '${klassenState.klassen[klasId]?.naam ?? klasId}' verwijderen?${countMsg} Dit kan niet ongedaan worden gemaakt.`
);
```

**No new components.** `KlasTabStrip` renders the delete button when `klas.canDelete` is true — that pathway already works for empty classes and will work identically for non-empty ones.

---

### Feature 5: CSS Resizing

**Files touched:**
- `src/components/KlasTabStrip.tsx` — inline `style={{ height: '36px' }}` on logo (line 65)
- `src/components/DetailWeergave.tsx` — section JSX block reorder
- `src/components/SpiderChartCard.tsx` — potentially no change (see note)
- CSS file(s) — `.spider-card` sizing, nav height variables

**SpiderChartCard:** The component calls `SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar, setTooltip)` from `utils/spider.ts` (not yet read). Before adding a `size` prop, inspect `utils/spider.ts` to determine whether `buildSpiderSVG` has a hardcoded pixel dimension or uses `viewBox` with a fluid container. If it uses `viewBox="0 0 N N"` with `width`/`height` attributes equal to `N`, a CSS override on `.spider-card svg { width: Xpx; height: Xpx; }` is the correct approach — no TypeScript changes. If the size is a hardcoded constant without `viewBox`, a `size` prop must be threaded through.

**KlasTabStrip logo:** The `height: '36px'` is a hardcoded inline style. Increase to the desired value (e.g. `48px`) directly on line 65. Alternatively, replace with a CSS class for easier future adjustment.

**DetailWeergave section reorder:** Pure JSX block move. Sections are independent components with no render-order dependencies. Move blocks without changing props.

---

## New vs Modified Components/Utils

| Item | Status | Notes |
|------|--------|-------|
| `utils/bpv.ts` | Modified | Column candidate string arrays only — no signature or type changes |
| `utils/datamodel.ts` | Modified | JSDoc typedef for `Keuzedeel` + `keuzedelen?` field on `StudentRecord` |
| `utils/klassen.ts` | No change | Serialises all student fields automatically |
| `utils/schema.ts` | No change | `normalizeRekenScore` already usable by tile badges |
| `utils/spider.ts` | Inspect only | Read before deciding if `SpiderChartCard` needs a `size` prop |
| `src/components/KeuzedeelSection.tsx` | **New** | Follows `RekenenNederlandsSection` pattern exactly |
| `src/components/DetailWeergave.tsx` | Modified | Add `KeuzedeelSection`, reorder sections |
| `src/components/LeerlingTegel.tsx` | Modified | Extend `StudentProps`, add R&N badge render |
| `src/components/SpiderChartCard.tsx` | Maybe modified | Only if `buildSpiderSVG` needs a size param |
| `src/components/KlasTabStrip.tsx` | Modified | Logo height inline style |
| `src/App.tsx` | Modified | `canDelete: true` + improved confirm message |
| CSS file(s) | Modified | Spider card sizing, nav height |

---

## Data Flow Changes

### Keuzedelen — new write path (new field, existing mechanism)
```
KeuzedeelSection
  → mutates student.keuzedelen[] in-place (klassenState shared array reference)
  → saveKlassen() — no new store key, piggybacks existing encrypted blob
  → onSaved() → DetailWeergave setRevision → re-render
```
No new Tauri commands. No new store keys. No App.tsx wiring.

### R&N on tiles — existing write path, new display path
```
[Write] RekenenNederlandsSection (unchanged)
  → student.rekenResultaat / .nederlandsResultaat set on all records for leerlingId
  → saveKlassen()
  → onSaved() → DetailWeergave setRevision

[Display] KlasOverzicht re-render (triggered by refreshKey on klas switch or import)
  → getActiveStudents() returns student objects with fields populated
  → LeerlingTegel receives student, renders badge via normalizeRekenScore()
```
No new props from App.tsx to KlasOverzicht. The student object already carries the fields.

### Non-empty deletion — no flow change
`deleteKlas()` already handles all cases. Only the `canDelete` boolean changes in `App.tsx`.

### BPV column matchers — no flow change
`parseBpvExcel()` is called during BPV Excel import, returns `BpvData`, stored via `saveBpvData()`. No caller changes.

### CSS resizing — no data flow impact
Pure presentation layer. No state changes.

---

## Suggested Build Order with Rationale

### Step 1 — BPV Real Column Matchers
**Rationale:** Pure utility change. Zero risk of breaking existing components. Requires the real sample Excel file and a `debugBpvExcel()` run to identify exact column names first.

**Pre-condition:** Have the sample `.xlsx` file. Run `debugBpvExcel()` in the Tauri dev console to print all column headers before writing any code.

**Dependency:** None on other v2.4 features.

---

### Step 2 — Non-Empty Class Deletion
**Rationale:** Single-expression change to `canDelete` in `App.tsx` plus an optional confirm message improvement. Completely isolated. No component creation, no type changes. Good quick verification that `deleteKlas()` handles non-empty correctly.

**Dependency:** None.

---

### Step 3 — R&N Badges on Tiles
**Rationale:** Extend an existing presentational component (`LeerlingTegel`) with badges. No new component file. Uses an already-imported utility (`normalizeRekenScore` pattern from schema.ts). Validates that the `refreshKey` → `getActiveStudents()` flow delivers the latest field values to tiles.

**Dependency:** Requires students with `rekenResultaat`/`nederlandsResultaat` set in the store (written by `RekenenNederlandsSection`, which is already shipping). No blocking dependency on other v2.4 features.

---

### Step 4 — Keuzedelen Per Student
**Rationale:** Requires a new component and type additions. Most structurally complex feature. The pattern (`RekenenNederlandsSection`) is well-established, making implementation risk low — but new component creation + `DetailWeergave` wiring should be its own focused step.

**Internal sequence:**
1. Add `Keuzedeel` typedef and `keuzedelen?` field to `utils/datamodel.ts`
2. Create `src/components/KeuzedeelSection.tsx`
3. Wire into `DetailWeergave.tsx`

**Dependency:** None on other v2.4 features. Must do datamodel change before component.

---

### Step 5 — CSS Resizing
**Rationale:** Pure visual. No data flow impact. Do last so `DetailWeergave` section order can be finalised in one pass after `KeuzedeelSection` is placed (Step 4). Spider chart sizing requires reading `utils/spider.ts` first.

**Pre-condition:** Read `utils/spider.ts` to determine `buildSpiderSVG` size approach before writing any code.

**Dependency:** Do after Step 4 so the `DetailWeergave` section reorder includes the Keuzedelen section in its final position.

---

## Critical Implementation Constraints

**Array reference invariant (applies to Keuzedelen):** Any component that writes to student fields must receive the original `klassenState` array reference, not a copy. `DetailWeergave` enforces this at line 45 (`const student = records[idx]` with a comment explaining the pitfall). `KeuzedeelSection` must receive this same reference and mutate in-place. Never spread (`{ ...student }`) before passing to a section component.

**Multi-record update pattern:** Fields that are student-level (not period-specific) must be written to ALL records for the `leerlingId`. `RekenenNederlandsSection` does this with `klas.students.filter(s => s.leerlingId === student.leerlingId).forEach(rec => rec[field] = value)`. Apply the same pattern in `KeuzedeelSection`. If keuzedelen are period-specific rather than student-level, update only the matching record and document that decision explicitly.

**`saveKlassen()` flush contract:** Every write must `await saveKlassen()` and check the boolean return. The store requires both `store.set()` and `store.save()` — both are handled inside `saveKlassen()` already. Never call `store.set()` directly from a component.

**`canDelete` change scope:** Setting `canDelete: true` for all classes is the full change in App.tsx. Do not modify `KlasTabStrip` — the delete button rendering is already conditional on `klas.canDelete` and the `handleDeleteKlas` confirm dialog already exists.
