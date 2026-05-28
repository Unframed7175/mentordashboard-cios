## Stack Research — v2.4

**Date:** 2026-05-28
**Milestone:** v2.4 — Data Completeness, Keuzedelen & UI Polish
**Scope:** What is needed for the six v2.4 features on top of the existing Tauri 2 + React 19 + Vite + Vitest + SheetJS 0.20.3 + tauri-plugin-store stack.

> Prior stack research for v2.2 (print-to-PDF, drag-drop fix, onboarding, BPV parser, R&N) is preserved in git history. This file is the v2.4 addendum.

---

### New dependencies needed

**None.** Every v2.4 feature is implementable with the packages already in `package.json`.

| Feature | Required capability | Already available |
|---------|--------------------|--------------------|
| BPV real column matchers | SheetJS `sheet_to_json` + fuzzy header matching | `xlsx` 0.20.3 in devDependencies; `parseBpvExcel()` + `_bpvKolom()` already implemented in `utils/bpv.ts` |
| Keuzedelen per student | Extend StudentRecord + `saveKlassen()` | `tauri-plugin-store` ^2.4.3; `saveKlassen()` in `utils/klassen.ts` serialises full student graph |
| R&N badge on tiles | `normalizeRekenScore()` + presentational render | Both fields on StudentRecord; `normalizeRekenScore()` in `utils/schema.ts`; no new data |
| KLS-DEL non-empty | `deleteKlas()` already handles all records | `deleteKlas()` in `utils/klassen.ts` unconditionally deletes students; only the UX confirmation dialog needs adding |
| UI-DET (spider + section reorder) | CSS resize + JSX reorder | Pure CSS / JSX |
| UI-NAV (banner 2x) | CSS height tweak on `#main-nav` + logo `height` | Pure CSS |

---

### SheetJS BPV column discovery pattern

`parseBpvExcel()` in `utils/bpv.ts` is structurally correct. The helper `_bpvKolom(rowObj, candidates)` iterates header keys case-insensitively and accepts substring matches. The gap is that the real SomToday BPV Excel column names are unknown until a real export file is supplied.

**Diagnostic tool already present:** `debugBpvExcel(buffer)` (bottom of `utils/bpv.ts`) logs all sheet names and the first five rows of every sheet. Call it from the import handler before `parseBpvExcel()` to read exact headers from the console.

Once the real file is available, update only the candidate string arrays in `parseBpvExcel()`. The five arrays to update:

```ts
// 1. Student display name
_bpvKolom(rowObj, ['<REAL_NAME_COL>', 'Student', 'Naam', 'Leerlingnaam', ...])

// 2. Student number / leerlingId
_bpvKolom(rowObj, ['<REAL_ID_COL>', 'Studentnummer', 'Leerlingnummer', ...])

// 3. Goedgekeurde / gerealiseerde uren — this drives gerealiseerdeUren
_bpvKolom(rowObj, ['<REAL_APPROVED_COL>', 'Gerealiseerde uren', 'Gerealiseerd',
                   'Stage-uren goedgekeurd', 'Goedgekeurde uren', ...])

// 4. Ingediende / ingeleverde uren
_bpvKolom(rowObj, ['<REAL_SUBMITTED_COL>', 'Stage-uren ingeleverd', 'Uren ingeleverd', ...])

// 5. Placement location / leerbedrijf
_bpvKolom(rowObj, ['<REAL_LOCATION_COL>', 'Leerbedrijf', 'Organisatie', ...])
```

**No SheetJS API changes needed.** `XLSX.read(buf, { type: 'array', cellDates: true })` handles both `.xls` (BIFF8) and `.xlsx`. The `cpexcel` codepage import at the top of `bpv.ts` must not be removed — it is required for `.xls` Dutch text encoding.

**Risk to note:** SomToday sometimes exports with merged header cells, which `sheet_to_json({ header: 1 })` represents as empty strings for the merged continuation cells. If the real file shows empty header slots where data columns are expected, switch to `XLSX.utils.decode_range(sheet['!ref'])` + manual cell-address iteration to reconstruct headers. Do not preemptively change this until a real file confirms the problem.

---

### Data model extension approach

#### Keuzedelen (KZLD)

Add `keuzedelen` to the StudentRecord shape. No schema migration needed — absent field reads as `undefined`; guard everywhere with `student.keuzedelen ?? []`.

```ts
// Add to typedef comment block in utils/datamodel.ts:
// @property {Keuzedeel[]} [keuzedelen] — per-student keuzedelen list (KZLD)

interface Keuzedeel {
  id: string;       // crypto.randomUUID() — same pattern as Actiepunt.id
  naam: string;     // free text, e.g. "Sportmassage"
  onTrack: boolean; // mentor checkbox: is this student on track?
}
```

**Write path:** mirror `RekenenNederlandsSection.handleChange()` — find all records for `leerlingId` by filtering `klas.students`, mutate in-place on every matching record (keuzedelen is student-level, not period-level), then call `saveKlassen()`. Using `splice`/`push` on the existing array rather than `filter()` preserves the array reference shared with `appState.students` (the bridge set by `switchActiveKlas()`).

**Storage:** `saveKlassen()` serialises `klassenState.klassen` as a whole via `JSON.stringify` + `invoke('encrypt_klassen')` — the new field is included automatically. No store key changes.

#### R&N badge on tiles (TEGEL-RN)

No data model change. `rekenResultaat` and `nederlandsResultaat` already exist on StudentRecord (see `utils/datamodel.ts` typedef, lines 41–42). `normalizeRekenScore()` in `utils/schema.ts` already maps `'3F'/'2F'/'1F'` to `'goed'/'voldoende'/'onvoldoende'`.

Implementation is entirely in `LeerlingTegel.tsx`:

1. Extend `StudentProps` interface to include `rekenResultaat?: string | null` and `nederlandsResultaat?: string | null`.
2. Call `normalizeRekenScore()` on both values.
3. Render a compact inline badge (e.g. "R: ✓" / "N: !" ) — style to match existing `status-badge` classes.
4. In `KlasOverzicht.tsx`, pass the two fields through from the student object to `<LeerlingTegel>`.

#### KLS-DEL (non-empty class deletion)

`deleteKlas()` in `utils/klassen.ts` already deletes all students and switches to the next class — it is correct as-is for non-empty deletion.

The only change is in the UI layer:

1. In `App.tsx`, change `canDelete: klas.students.length === 0` to `canDelete: true` (or rename to reflect that it now means "show delete button" regardless of whether the class has students).
2. Replace the `window.confirm()` in `handleDeleteKlas` with a small React modal that includes a labelled checkbox: "Ik begrijp dat alle leerlingdata van de leerlingen in deze klas permanent wordt verwijderd." The confirm button is disabled until the checkbox is checked.
3. Keep `deleteKlas()` call unchanged after confirmation.

The confirmation modal can be either a new lightweight component (`KlasVerwijderenModal`) or an extension of the existing `KlasModal` pattern — approximately 40–60 lines of JSX.

---

### No-change areas

| Area | Verdict |
|------|---------|
| `xlsx` version / API | Unchanged — 0.20.3 via CDN tarball, no upgrade needed |
| `tauri-plugin-store` version | Unchanged — ^2.4.3 covers all write patterns |
| `utils/klassen.ts` `deleteKlas()` | Unchanged — already correct for non-empty deletion |
| `utils/schema.ts` `normalizeRekenScore()` | Unchanged |
| `utils/bpv.ts` plumbing (`_bpvKolom`, header detection, format detection) | Unchanged — only candidate strings inside the arrays change |
| `SpiderChartCard.tsx` logic | Unchanged — only the CSS `width`/`height` on the container changes |
| `DetailWeergave.tsx` child component logic | Unchanged — only the JSX order of sections changes |
| Tauri Rust backend (commands, capabilities) | Unchanged — no new IPC commands needed |
| Vitest / jsdom test infrastructure | Unchanged |
| `tauri.conf.json` | Unchanged — no new permissions or window config needed |

---

### Implementation sequence recommendation

1. **UI-NAV / UI-DET** — Pure CSS, zero risk, unblock immediately.
2. **TEGEL-RN** — Read-only pass-through from existing data, very low risk.
3. **KLS-DEL** — Small modal component, isolated change.
4. **KZLD** — New data field + CRUD component, moderate scope but pattern is established.
5. **BPV column matchers** — Blocked until real SomToday BPV export file is available. Place last or make conditional on file availability.
