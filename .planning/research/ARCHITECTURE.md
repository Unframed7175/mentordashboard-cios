# Architecture Research: v2.2 Feature Integration

**Project:** Mentordashboard CIOS  
**Milestone:** v2.2 — Onboarding, Export & Data Completeness  
**Researched:** 2026-05-19  
**Confidence:** HIGH — based entirely on direct codebase inspection

---

## Current Architecture Baseline

```
App.tsx  (top-level state machine)
  view: 'import' | 'klas' | 'detail' | 'settings'

  KlasTabStrip        (always rendered, nav bar)
  KlasModal           (conditional, floated modal)
  ImportPage          (view === 'import')
  KlasOverzicht       (view === 'klas')
  DetailWeergave      (view === 'detail')
    DoortstroomPrognoseSection
    AanvullendSection
    StageSection
    FeedbackActiepuntenSection
    LeerlijnenSection
    SpiderChartCard (x3)
    DeelgebiedenMatrix
    VerzuimSection
    BpvProgressSection
    VakkenSection
    NotitiesTextarea
  SettingsPage        (view === 'settings')

Storage layer:
  utils/klassen.ts    — encrypted LazyStore, student records per class
  utils/bpv.ts        — BPV config + data (separate store keys)
  utils/settings.ts   — app settings
  utils/leerlijnen.ts — leerlijn config

Parsers:
  parsers/pdf.ts      — voortgang PDF → StudentRecord
  parsers/excel.ts    — verzuim Excel → VerzuimRecord[]
  utils/bpv.ts        — parseBpvExcel() (currently stubbed, returns {})

Student record shape (utils/datamodel.ts comments + AanvullendSection):
  { naam, leerlingId, periode, leerjaar, filename,
    vakken, deelgebiedScores, datapunten,
    taalniveau?, rekenniveau?,
    actiepunten?, verzuim? }

BPV data stored separately from student records:
  klassenState.klassen[id].stageData[leerlingId]   stage info (StageSection)
  bpv_data store key: BpvData = Record<leerlingId, { gerealiseerdeUren }>
```

---

## Feature 1: Onboarding Wizard (ONB-01..08)

### Routing integration

The wizard is a **new view** added to the `view` union type in `App.tsx`. The current type is:

```typescript
// Current:
'import' | 'klas' | 'detail' | 'settings'

// After ONB:
'onboarding' | 'import' | 'klas' | 'detail' | 'settings'
```

The wizard shows **only on first run** — when `Object.keys(klassenState.klassen).length === 0`. App.tsx already knows `klassenState` (it reads it for `KlasTabStrip`). The trigger goes into the existing startup `useEffect` that loads settings:

```typescript
useEffect(() => {
  (async () => {
    await loadKlassen();          // must happen before the check
    const s = await loadSettings();
    // ... theme logic ...
    const hasNoKlassen = Object.keys(klassenState.klassen).length === 0;
    setView(hasNoKlassen ? 'onboarding' : 'klas');
  })();
}, []);
```

Currently that effect sets no view (view defaults to `'import'`). The change: default to `'onboarding'` when no classes exist, or `'klas'`/`'import'` when they do (matching the existing `handleKlasSwitch` logic: `hasStudents ? 'klas' : 'import'`).

### Completion transition

Onboarding ends with a `handleOnboardingComplete` callback passed into `OnboardingWizard`. It mirrors `handleImportComplete`:

```typescript
function handleOnboardingComplete() {
  setRefreshKey(k => k + 1);
  setView('klas');
}
```

The callback receives either the klasId that was created during the wizard, or simply triggers a view switch after `saveKlassen()`. The wizard itself calls `createKlas` + `saveKlassen` internally (same pattern as `KlasModal`).

### Component structure

Single file for a wizard this size. No sub-directory needed yet.

```
src/components/OnboardingWizard.tsx   (new)
```

The wizard manages its own internal step state:

```typescript
type OnboardingStep =
  | 'welcome'
  | 'klas-aanmaken'
  | 'voortgang-pdfs'
  | 'verzuim-excel'
  | 'stage-excel'
  | 'instellingen'
  | 'klaar';
```

Steps that involve file import reuse `handleFiles` logic — but **not** by mounting full `<ImportPage />`. `ImportPage` has its own `importState` machine that calls `onImportComplete()` to navigate to `'klas'`. Inside the wizard, that callback must advance the wizard step instead of changing the top-level view. The correct approach: embed a stripped-down inline dropzone per step with its own minimal state, calling wizard-internal handlers.

### KlasTabStrip interaction

`KlasTabStrip` is always rendered in `App.tsx`. During onboarding, the tab strip will show no tabs (no klassen yet). The "+" button to create a class manually must be hidden or disabled during onboarding to prevent the wizard and the modal from racing to create classes. Pass a `disableCreate` prop to `KlasTabStrip`, or use a `view === 'onboarding'` guard in the `onCreateKlas` handler in `App.tsx`.

### Files modified
- `src/App.tsx` — add `'onboarding'` to view union, add startup trigger, add `handleOnboardingComplete`, render `<OnboardingWizard />`
- `src/components/KlasTabStrip.tsx` — guard "+" button when `view === 'onboarding'`

### Files created
- `src/components/OnboardingWizard.tsx`

---

## Feature 2: Print-to-PDF (EXP-01..04)

### CSS @media print vs Tauri print plugin

Use **CSS `@media print`** with `window.print()`. PROJECT.md already records "browser print-to-PDF voldoet voor v1.1" as a validated key decision. Tauri has `tauri-plugin-print` but it adds a Rust dependency for something the browser handles natively. On Windows and macOS, `window.print()` opens the system print dialog with the same result. The Tauri print plugin is only needed for fully silent/headless PDF generation — not required here.

No new Cargo dependency. No Rust changes.

### Where print styles live

Add a **dedicated `@media print` block** at the bottom of `src/index.css`. This is consistent with the single-file design-system approach already in place. Component-scoped CSS-in-JS would require JSS or CSS Modules (not in this stack).

```css
@media print {
  /* Hide navigation and chrome */
  .klas-tab-strip,
  .detail-nav-btn,
  .detail-nav-arrows,
  button,
  #storage-error-banner { display: none !important; }

  body { background: white; font-size: 11pt; }
  .detail-section { break-inside: avoid; }
  .spider-charts-row { break-inside: avoid; }
}
```

### Print trigger placement

A "Afdrukken" button in `DetailWeergave.tsx` in the detail header row, alongside the existing back and prev/next buttons:

```typescript
<button onClick={() => window.print()} className="detail-print-btn">
  Afdrukken
</button>
```

The button itself gets `display: none` in `@media print` (included in the hide list above).

### What hides in print

| Element | CSS class / selector | Reason |
|---------|---------------------|--------|
| Nav bar | `.klas-tab-strip` | Navigation, not content |
| Back/prev/next buttons | `.detail-nav-btn`, `.detail-nav-arrows` | Interactive only |
| Afdrukken button | `.detail-print-btn` | Self-hiding |
| All other buttons | `button` | Defensive catch-all |
| Error banner | `#storage-error-banner` | Internal |

Spider chart SVGs are inline SVG and render correctly in print without changes.

### Files modified
- `src/index.css` — add `@media print` block at end
- `src/components/DetailWeergave.tsx` — add print button in header

### Files created
- None

---

## Feature 3: BPV Stage Excel Parser (BPV-01..04)

### Current state

`utils/bpv.ts` exports `parseBpvExcel(buffer: ArrayBuffer): BpvData`. It is **stubbed**: validates magic bytes (XLS or XLSX) and returns `{}`. Comment: "D-13: BPV Excel parser stubbed — replace when user supplies sample BPV Excel file."

`BpvStudentRecord` is currently `{ gerealiseerdeUren: number }`.

### Extending parsers/excel.ts vs utils/bpv.ts

The BPV parser should replace the stub in **`utils/bpv.ts`**, not extend `parsers/excel.ts`. Reason: `parsers/excel.ts` has a specific responsibility (SomToday absence format). BPV is a different domain with different column semantics. Mixing them would require format-detection logic and make both parsers harder to test.

The `parseBpvExcel` function already receives an `ArrayBuffer`. Extend it to use SheetJS (already a project dependency):

```typescript
import * as XLSX from 'xlsx';

export function parseBpvExcel(buffer: ArrayBuffer): BpvData {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  // sheet selection (same scoring heuristic as parsers/excel.ts)
  // header detection (same HEADER_KEYS approach)
  // build BpvData: { [leerlingId]: { gerealiseerdeUren } }
}
```

Add a `debugBpvExcel(file: File)` helper (matching the existing `debugExcelBestand()` in `parsers/excel.ts`) to inspect the actual file before writing column matchers. This is the mandatory first step once the sample file arrives.

### Schema changes (utils/schema.ts)

No changes needed to `schema.ts` (DEELGEBIEDEN, score normalization). BPV hours are not deelgebied scores.

`BpvStudentRecord` in `utils/bpv.ts` may need extension depending on the actual Excel format:

```typescript
// Possible extension (pending sample file):
export interface BpvStudentRecord {
  gerealiseerdeUren: number;
  organisatie?: string;
  startdatum?: string;   // ISO date
  einddatum?: string;
}
```

If organisatie/dates are in the BPV Excel, they could feed `StageSection` — but `StageSection` currently reads from `klassenState.klassen[id].stageData[leerlingId]`, a separate store key. Recommendation: keep BPV uren in `bpv_data` and stage placement info in `stageData` until the BPV Excel format is confirmed. Do not merge unless the sample file makes it obvious.

### How ImportPage detects BPV Excel vs verzuim Excel

`ImportPage.handleFiles` currently routes all `.xls/.xlsx` files to `handleExcel()` (the verzuim parser). Two routing options:

**Option A — Filename heuristic (recommended):** The BPV file likely has a distinctive name (contains "BPV", "stage", "praktijk"). Add a check before routing:

```typescript
const isBpvExcel = /bpv|stage|praktijk/i.test(name);
if (isBpvExcel) {
  bpv = file;
} else {
  excel = file;  // verzuim
}
```

**Option B — Sheet name detection:** Parse the workbook, check for a sheet named "BPV" or similar. More robust but adds latency before routing.

Start with Option A. The mentor knows which file is which; a clear error message when the wrong file is dropped is acceptable. Upgrade to Option B if false positives occur in practice.

`handleFiles` needs a `handleBpvExcel(file: File)` handler:

```typescript
async function handleBpvExcel(file: File) {
  const buffer = await file.arrayBuffer();
  const bpvData = parseBpvExcel(buffer);
  await saveBpvData(bpvData);
  // ... update importState ...
}
```

### Files modified
- `utils/bpv.ts` — replace `parseBpvExcel` stub, add `debugBpvExcel` helper
- `src/components/ImportPage.tsx` — add BPV Excel filename routing, add `handleBpvExcel` handler

### Files created
- None (unless the BPV parser grows large enough to warrant `parsers/bpv-excel.ts` — unlikely)

---

## Feature 4: Rekenen & Nederlands (RNL-01..04)

### Where scores appear in existing data

`AanvullendSection.tsx` already has **manual dropdowns** for `taalniveau` (`''|'2F'|'3F'`) and `rekenniveau` (`''|'MBO 3'|'MBO 4'`), stored on the student record as free-text fields set by the mentor.

The feature "Rekenen & Nederlands voortgang apart bijhouden met eigen doorstroomnorm" implies scores parsed from a source and tracked against a norm — not just manually entered.

If "Rekenen" and "Nederlands" appear as vak names in the SomToday voortgang PDF, they already land in `student.vakken[]` via the existing `parseVakSections` function in `parsers/pdf.ts`. Implementation then needs:
1. **Detection:** identify which vakken entries are Rekenen/Nederlands by name matching
2. **Scoring:** extract completion or score from their opdrachten
3. **Norm:** define the doorstroomnorm (unknown — must be specified by product owner)
4. **Display:** new section in DetailWeergave

### New fields in student schema

Add explicit fields to the student record rather than scanning `vakken[]` at render time. This avoids re-scanning on every render and makes the data explicit in the store.

```typescript
// Add to StudentRecord typedef in utils/datamodel.ts:
// rekenenGeparsed?: { afgerond: number; totaal: number; niveau: string | null }
// nederlandsGeparsed?: { afgerond: number; totaal: number; niveau: string | null }
```

The existing `taalniveau` and `rekenniveau` fields (manual entry) are preserved. The new `*Geparsed` fields are auto-populated from PDF. `AanvullendSection` can show "auto: 2F (uit PDF)" with a manual override — or simply make the dropdowns read-only when auto-detected.

### PDF parser changes

In `parsers/pdf.ts`, `parseVakSections` already captures all vak sections. If Rekenen/Nederlands appear as regular vak sections (large-font headings), they are already in `student.vakken[]` — no parser change needed for extraction. A post-processing step in `parseSinglePDF` derives the structured fields:

```typescript
// After parseVakSections():
const rekenenVak = vakken.find(v => /rekenen/i.test(v.naam));
const nederlandsVak = vakken.find(v => /nederland/i.test(v.naam));
// derive afgerond / totaal counts from their opdrachten
```

**Important:** If Rekenen/Nederlands use a different scoring format than the standard opdracht status model (e.g., a separate percentage or level indicator in the PDF), the parser needs a different extraction strategy. This requires inspecting a real PDF with R&N content. Do not write the parser extension until that inspection is done.

### New UI section

Create `RekenenNederlandsSection.tsx`, rendered in `DetailWeergave` between `AanvullendSection` and `StageSection`. It shows:
- Rekenen: niveau, opdrachten afgerond/totaal, doorstroomnorm status (rood/oranje/groen)
- Nederlands: same structure

The doorstroomnorm values for Rekenen/Nederlands are **currently unknown** — not in `utils/schema.ts` or any existing config. These must be specified before implementation.

### Files modified
- `parsers/pdf.ts` — post-processing in `parseSinglePDF` to extract R&N from `vakken`
- `utils/datamodel.ts` — add `rekenenGeparsed`, `nederlandsGeparsed` to StudentRecord typedef comments
- `src/components/DetailWeergave.tsx` — render `<RekenenNederlandsSection />`
- `src/components/AanvullendSection.tsx` — show auto-detected values, keep manual override

### Files created
- `src/components/RekenenNederlandsSection.tsx`

---

## Feature 5: Drag-and-Drop Fix (BUG-01)

### Current implementation

`ImportPage.tsx` uses standard HTML5 React drag events on a `<div>`:

```typescript
function onDrop(e: React.DragEvent<HTMLDivElement>) {
  e.preventDefault();
  setIsDragging(false);
  if (e.dataTransfer.files.length > 0) {  // this is always 0 for OS drags in Tauri
    handleFiles(e.dataTransfer.files);
  }
}
```

`App.tsx` adds document-level `dragover`/`drop` `preventDefault()` listeners to stop browser navigation.

### Root cause

Confirmed in `.planning/research/PITFALLS.md`: in Tauri 2, when a user drags a file from the OS file manager (Windows Explorer, macOS Finder) onto the WebView, Tauri intercepts the OS-level drop event before it reaches the browser. The HTML5 `e.dataTransfer.files` is empty (`length === 0`). The drop event fires, `isDragging` resets, but `handleFiles` is never called.

The `document.addEventListener('drop', preventNav)` in `App.tsx` calls `e.preventDefault()` on all drops document-wide. This is correct behavior for preventing accidental browser navigation, and is NOT the cause of the empty `dataTransfer.files` — Tauri's interception happens at the OS level, below the browser event.

The fix is confirmed in `.planning/research/ARCHITECTURE.md` (existing migration research): Tauri 2 renamed the event from `tauri://file-drop` (v1) to `tauri://drag-drop`. The payload shape is `{ paths: string[] }` — file system paths, not `File` objects.

### Fix approach

**1. Listen to Tauri's drag-drop event in `ImportPage.tsx`:**

```typescript
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  let unlisten: (() => void) | null = null;
  listen<{ paths: string[] }>('tauri://drag-drop', async (event) => {
    const paths = event.payload.paths;
    if (paths.length === 0) return;
    const files = await Promise.all(paths.map(pathToFile));
    handleFilesArray(files.filter(Boolean) as File[]);
  }).then(fn => { unlisten = fn; });
  return () => { unlisten?.(); };
}, []);
```

**2. Path-to-File conversion:**

Two options:
- **`fetch('asset://localhost/' + encodeURIComponent(path))`** — uses the existing `asset:` CSP allowance in `tauri.conf.json`. No new dependency. File name derived from path.
- **`@tauri-apps/plugin-fs` `readFile(path)`** — explicit, typed. Requires adding `tauri-plugin-fs` to `Cargo.toml` and capability config to `tauri.conf.json`.

Recommendation: try `fetch` first (no new dependency). The `asset:` scheme is already in the CSP (`asset:` in `default-src`). Fallback to `plugin-fs` if fetch has issues with non-ASCII Windows paths.

**3. Refactor `handleFiles(FileList)` to `handleFiles(File[])`:**

Currently `handleFiles` receives a `FileList` and does `Array.from(fileList)` at line 271. Changing the signature to `File[]` is a minor refactor that unifies the HTML5 file picker path and the Tauri drag-drop path.

**`tauri.conf.json` check:** No `fileDropEnabled: false` is present. In Tauri 2, file drop is enabled by default. No config change needed.

**`Cargo.toml` check:** `tauri-plugin-fs` is not currently a dependency. Only add it if the `fetch` approach fails.

### Files modified
- `src/components/ImportPage.tsx` — add `listen('tauri://drag-drop', ...)` useEffect, refactor `handleFiles` signature to `File[]`
- `src/App.tsx` — the document-level `drop` listener can remain as-is (it prevents browser navigation for non-Tauri drops; it does not affect Tauri's event system)

### Files created
- None (unless `plugin-fs` path requires a utility helper)

---

## Dependency Map Between Features

```
BUG-01 (drag-and-drop fix)
  <- no v2.2 dependencies, can ship first
  -> unblocks: ONB wizard steps (import steps need working drag-and-drop)

EXP-01..04 (print-to-PDF)
  <- no v2.2 dependencies
  <- depends on existing DetailWeergave (complete)
  -> no downstream dependencies

BPV-01..04 (BPV stage Excel parser)
  <- BLOCKED on: user supplying sample BPV Excel file
  <- depends on: parseBpvExcel stub already in utils/bpv.ts (ready)
  -> feeds: BpvProgressSection (already consumes BpvData, no component change)

RNL-01..04 (Rekenen & Nederlands)
  <- BLOCKED on: confirming PDF format (does SomToday include R&N?)
  <- BLOCKED on: receiving doorstroomnorm values from product owner
  <- depends on: AanvullendSection (existing manual fields must be preserved)
  -> new: RekenenNederlandsSection component

ONB-01..08 (onboarding wizard)
  <- depends on: BUG-01 (wizard import steps need working drag-and-drop)
  <- depends on: App.tsx view union extension (internal)
  -> no downstream dependencies
```

---

## Suggested Phase Build Order

### Phase 20 — BUG-01: Fix Drag-and-Drop (1–2 days)

**Why first:** Unblocks realistic testing of all file import paths. The onboarding wizard's import steps depend on it. Easiest to diagnose and fix in isolation before other features add complexity.

**Scope:**
- Add `listen('tauri://drag-drop', ...)` in `ImportPage.tsx`
- Implement path-to-File conversion via `fetch('asset://localhost/...')` 
- Refactor `handleFiles(FileList)` to `handleFiles(File[])`
- Manual UAT: drag from Windows Explorer — confirm `e.dataTransfer.files` was the issue, confirm Tauri event fires with correct paths

**Risk:** Path-to-File conversion via `fetch` vs `plugin-fs` needs a quick spike. Do not implement both — pick one and verify.

### Phase 21 — EXP-01..04: Print-to-PDF (1 day)

**Why second:** Self-contained, no dependencies on other v2.2 features, low risk. Ships a complete user-visible feature quickly before tackling harder blocked features.

**Scope:**
- Add `@media print` block to `src/index.css`
- Add "Afdrukken" button to `DetailWeergave.tsx` header
- Manual UAT: Ctrl+P from DetailWeergave, confirm nav hidden, sections visible, spider charts render

### Phase 22 — BPV-01..04: BPV Stage Excel Parser (2–3 days)

**Why third:** The stub is ready; this phase replaces it. Can start as soon as the sample BPV Excel file arrives. If the file arrives before Phase 20/21 complete, this phase can run in parallel.

**Scope:**
- Add `debugBpvExcel()` helper to inspect sample file structure
- Implement real `parseBpvExcel()` in `utils/bpv.ts`
- Add BPV Excel filename routing to `ImportPage.handleFiles`
- Add `handleBpvExcel()` handler in `ImportPage.tsx`
- Decide on `BpvStudentRecord` field extension based on actual Excel columns
- Manual UAT: import sample BPV Excel, verify `BpvProgressSection` shows real uren

**Hard blocker:** User must supply the sample BPV Excel file. Do not start implementation without it.

### Phase 23 — RNL-01..04: Rekenen & Nederlands (2–3 days)

**Why fourth:** Two unknowns must be resolved first — PDF format and doorstroomnorm values. Can start once both are confirmed.

**Scope:**
- Inspect real PDF to confirm R&N vak names and scoring format
- Add post-processing in `parseSinglePDF` for R&N extraction
- Add `rekenenGeparsed` / `nederlandsGeparsed` to StudentRecord typedef
- Create `RekenenNederlandsSection.tsx`
- Extend `AanvullendSection.tsx` to show auto-detected values alongside manual fields
- Add `<RekenenNederlandsSection />` to `DetailWeergave.tsx`

**Hard blocker 1:** Real PDF with Rekenen/Nederlands content must be available before writing the parser.  
**Hard blocker 2:** Doorstroomnorm values must be specified before building the norm display.

### Phase 24 — ONB-01..08: Onboarding Wizard (3–4 days)

**Why last:** Most complex feature. Depends on BUG-01 (Phase 20) for drag-and-drop to work in wizard steps. Building last means all import paths are proven before embedding them in the wizard flow.

**Scope:**
- Extend `view` union in `App.tsx` to include `'onboarding'`
- Add startup trigger in `App.tsx` `useEffect`
- Add `handleOnboardingComplete` callback and render `<OnboardingWizard />`
- Guard `KlasTabStrip` "+" button during onboarding
- Create `OnboardingWizard.tsx` with 7-step flow using inline dropzones per step
- Manual UAT: complete full wizard flow on fresh install (delete `store.json`), verify each step transitions correctly

---

## New vs Modified Files Summary

| File | Status | Feature |
|------|--------|---------|
| `src/App.tsx` | Modified | ONB — add view, startup trigger, callback |
| `src/components/OnboardingWizard.tsx` | **New** | ONB |
| `src/components/KlasTabStrip.tsx` | Modified | ONB — guard "+" button |
| `src/components/ImportPage.tsx` | Modified | BUG-01 (Tauri listener), BPV (routing + handler) |
| `src/components/DetailWeergave.tsx` | Modified | EXP (print button), RNL (new section) |
| `src/components/RekenenNederlandsSection.tsx` | **New** | RNL |
| `src/components/AanvullendSection.tsx` | Modified | RNL — show auto-detected values |
| `src/index.css` | Modified | EXP — `@media print` block |
| `parsers/pdf.ts` | Modified | RNL — R&N post-processing in `parseSinglePDF` |
| `utils/bpv.ts` | Modified | BPV — replace stub, add debug helper |
| `utils/datamodel.ts` | Modified | RNL — add `rekenenGeparsed`, `nederlandsGeparsed` to typedef comments |

---

## Architectural Risks

### BUG-01: Path-to-File conversion method
`tauri://drag-drop` provides `string[]` paths. The existing pipeline expects `File` objects (for `.arrayBuffer()`, `.name`). The `fetch('asset://localhost/...')` approach avoids adding `tauri-plugin-fs` as a dependency. However, Windows absolute paths with drive letters (`C:\...`) need correct encoding for the asset URL scheme. This needs a spike before committing.

### ONB: Wizard vs ImportPage state conflict
Mounting `<ImportPage onImportComplete={...} />` inside wizard steps creates a state conflict: `ImportPage.handleImportComplete` navigates to `'klas'` via the top-level callback. Inside the wizard, that must instead advance the wizard step. Use inline stripped-down dropzones in the wizard rather than mounting full `ImportPage` components.

### RNL: Speculative parser change
The R&N extraction in `parsers/pdf.ts` is speculative until a real PDF is inspected. `parseVakSections` uses font-size-based heading detection — if Rekenen/Nederlands appear as sub-headings with body-text font size, they will not be captured as separate vak sections. Do not write the parser extension until a real PDF is confirmed.

### BPV: Two separate storage keys for BPV and stage data
`BpvProgressSection` reads from `bpv_data` store key. `StageSection` reads from `klassenState.klassen[id].stageData[leerlingId]`. If the BPV Excel contains both uren and stage placement info, the import must decide which key to populate. Keep them separate unless the sample file makes merging clearly correct.
