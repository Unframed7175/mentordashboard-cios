# Phase 18: Settings Panel Advanced - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 18 fills in the two placeholder sections in `SettingsPage.tsx` that were stubbed out in Phase 17 ("Deelgebieden & Leerlijnen" and "Drempelwaarden & BPV-uren"), and delivers four functional settings features:

- **SET-03**: Rename and/or deactivate any of the 19 deelgebieden. Inactive deelgebieden disappear from the matrix, spiderweb chart, and prognose calculation; their stored scores are preserved.
- **SET-04**: Adjust leerlijn assignment (lesgeven / organiseren / prof. handelen) per deelgebied. Combined with SET-03 in a single table in the UI.
- **SET-05**: Configure separate thresholds for geoorloofd and ongeoorloofd verzuim (in hours). Both thresholds affect the tile status logic.
- **SET-06**: Configure expected BPV-uren per period + import a BPV Excel file + show per-student BPV progress in DetailWeergave.

Changes in settings take effect immediately on the dashboard (no save/confirm step — same pattern as Phase 17 dark mode toggle).

</domain>

<decisions>
## Implementation Decisions

### Deelgebieden & Leerlijnen UI (SET-03 + SET-04)

- **D-01:** SET-03 and SET-04 are combined in a single scrollable table inside the "Deelgebieden & Leerlijnen" section. Each row = one deelgebied. Columns: **Naam** (inline text input) | **Leerlijn** (dropdown: Lesgeven / Organiseren / Prof. handelen) | **Actief** (toggle).
- **D-02:** Deelgebied names are edited **inline** — the Naam column is a text input directly in the table row. Changes apply on blur/Enter and update the matrix and spiderweb immediately.
- **D-03:** A **"Herstel standaard" reset button** is placed below the table. It resets all custom names, leerlijn assignments, and active/inactive states back to the defaults from `utils/schema.ts`.
- **D-04:** When a deelgebied is marked inactive, its student scores are **preserved in the store** (no data deletion). The matrix, spiderweb chart, and prognose calculation simply exclude it. Reactivating restores the scores. No extra warning UI needed.

### Prognose bij inactieve deelgebieden

- **D-05:** The prognose norm "≥13 voldoende" counts **only active deelgebieden**. If 17 are active, a student still needs ≥13 voldoende from those 17. (Fixed threshold, active pool only.)
- **D-06:** SBC leerlijn thresholds (lesgeven ≥4 goed, organiseren ≥3 goed, prof. handelen ≥5 goed) also apply **only to active deelgebieden per leerlijn**. If 2 of 6 lesgeven deelgebieden are disabled, the student needs ≥4 goed from the remaining 4.
- **D-07:** The negatief norm (">6 onvoldoende OR >2 onvoldoende within one leerlijn") also applies **only to active deelgebieden**. Inactive deelgebieden don't contribute to the onvoldoende count.

### Verzuim Drempelwaarden (SET-05)

- **D-08:** Two separate configurable thresholds — **geoorloofd** and **ongeoorloofd** — both affect the tile status (oranje/Verzuim). The geoorloofd threshold is a new addition to `berekenStatus()`.
- **D-09:** Both thresholds are entered as **number inputs in hours** (integers). The app converts to minutes internally (hours × 60). Default values: 15u geoorloofd, 10u ongeoorloofd (preserving the existing hardcoded constant).
- **D-10:** The current hardcoded `VERZUIM_DREMPEL_MIN = 600` in `src/utils/status.ts` is replaced by a runtime-loaded config that reads from plugin-store.

### BPV-uren (SET-06)

- **D-11:** Phase 18 delivers the **full BPV feature**: (1) settings input for expected BPV-uren per period, (2) a new import flow for the BPV Excel file, (3) per-student BPV progress in DetailWeergave.
- **D-12:** BPV progress appears in **DetailWeergave only** (per-student), as a new section similar to VerzuimSection. Not on class overview tiles.
- **D-13:** The BPV Excel file format is **unknown** at planning time. The researcher/planner must ask the user to provide a sample BPV Excel file when building the parser. The user will hand it over at parser implementation time.
- **D-14:** Default expected BPV-uren: TBD (user to specify or reasonable default to be proposed by planner).

### Data Persistence Model

- **D-15:** Deelgebied customizations (custom names + active/inactive state) are stored under a new plugin-store key `'deelgebieden_config'`. Format: `Array<{ id: string, label: string, active: boolean }>`. Leerlijn assignment continues to use the existing `'leerlijnen'` key in `utils/leerlijnen.ts`.
- **D-16:** Verzuim thresholds are stored under a new plugin-store key `'verzuim_drempels'`. Format: `{ geoorloofd: number, ongeoorloofd: number }` (values in minutes). Loaded at app start, passed into `berekenStatus()`.
- **D-17:** BPV config (expected uren) stored under `'bpv_config'`. BPV actual data (per student, from Excel) stored under `'bpv_data'`. Keys follow the existing `LazyStore('store.json')` pattern from `utils/settings.ts` and `utils/klassen.ts`.

### Claude's Discretion

- Exact table CSS for the 19-row deelgebieden table (reuse existing `.ap-row` / `.dg-matrix` patterns vs new classes)
- Whether to debounce the inline naam input or apply on blur only
- BPV section header text and progress bar styling in DetailWeergave
- Default expected BPV-uren value (propose in planning)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Settings & Persistence
- `utils/settings.ts` — LazyStore pattern for plugin-store, `saveSettings`/`loadSettings` — the model to extend for new store keys
- `utils/leerlijnen.ts` — existing leerlijn mapping persistence (key: `'leerlijnen'`), cache pattern, `saveLeerlijnenMapping` — Phase 18 adds a UI for this
- `utils/schema.ts` — `DEELGEBIEDEN` array (19 items), `Deelgebied` interface — Phase 18 makes this runtime-configurable

### SettingsPage Integration
- `src/components/SettingsPage.tsx` — placeholder sections 3 ("Deelgebieden & Leerlijnen") and 4 ("Drempelwaarden & BPV-uren") are the insertion points
- `.planning/phases/17-settings-panel-foundation/17-CONTEXT.md` — Phase 17 decisions (routing, LazyStore pattern, instant-apply behavior)

### Prognose Calculation
- `utils/prognosis.ts` — `berekenPrognose()`, norms (≥13 voldoende, SBC leerlijn thresholds, negatief criteria) — must be updated to accept active deelgebied filter
- `src/utils/status.ts` — `berekenStatus()`, hardcoded `VERZUIM_DREMPEL_MIN = 600` — replace with runtime config

### Components to Update
- `src/components/DeelgebiedenMatrix.tsx` — must filter inactive deelgebieden from display
- `src/components/SpiderChartCard.tsx` — must filter inactive deelgebieden from spider axes
- `src/components/DoortstroomPrognoseSection.tsx` — gap badges, uses prognose output (indirect)

### Requirements
- `.planning/REQUIREMENTS.md` (SET-03, SET-04, SET-05, SET-06) — formal requirement IDs
- `.planning/ROADMAP.md` (Phase 18 section) — success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `utils/leerlijnen.ts`: `getLeerlijnenMapping` / `saveLeerlijnenMapping` / `resetLeerlijnenMapping` — same pattern needed for deelgebied config and verzuim thresholds
- `LazyStore('store.json')` from `@tauri-apps/plugin-store` — all new keys go into the same store file
- `.detail-section` / `.detail-section-title` CSS classes — used throughout SettingsPage for section cards
- `.ap-row` CSS — existing row pattern usable for deelgebieden table rows

### Established Patterns
- Plugin-store: `store.set(key, value)` → `store.save()` — **must always pair set + save** (Pitfall from Phase 12)
- Instant-apply: changes applied immediately without a save button (Phase 17 dark mode pattern)
- In-memory cache with null-on-invalidate: used in `leerlijnen.ts` — apply the same to new config keys
- TypeScript: all new code in `.ts` / `.tsx`; interfaces for all store shapes

### Integration Points
- `SettingsPage.tsx` section 3 & 4: replace placeholder `<p>Komt in een volgende versie.</p>` with functional UI
- `berekenStatus()` in `src/utils/status.ts`: replace hardcoded `VERZUIM_DREMPEL_MIN` with loaded config parameter
- `berekenPrognose()` in `utils/prognosis.ts`: add `activeDeelgebieden: string[]` parameter to filter calculations
- `DeelgebiedenMatrix.tsx`: read active deelgebieden list; filter `DEELGEBIEDEN` and `GROEPEN` to show only active
- `SpiderChartCard.tsx`: read active deelgebieden list; filter spider axes
- `ImportPage.tsx`: add BPV Excel drop target (separate from verzuim Excel)

</code_context>

<specifics>
## Specific Ideas

- BPV Excel file: user will provide a sample file when the parser is being implemented. Do not guess the format — ask for the file.
- Default geoorloofd verzuim threshold: 15u (suggested by Claude based on typical school policy; user may override in planning).
- Default ongeoorloofd verzuim threshold: 10u (preserves the existing `VERZUIM_DREMPEL_MIN = 600` constant behavior).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-settings-panel-advanced*
*Context gathered: 2026-05-17*
