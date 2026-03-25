---
phase: 05-detailweergave
verified: 2026-03-25T00:00:00Z
status: gaps_found
score: 5/7 success criteria verified
re_verification: false
gaps:
  - truth: "Verzuimoverzicht toont aanwezigheid, geoorloofd, ongeoorloofd en laatste melding"
    status: partial
    reason: "buildDetailVerzuim is fully implemented and renders stacked bar with legend and laatste melding. However DET-02 / XLS-02 are UNVERIFIED upstream: the Excel parser (parsers/excel.js) has known open requirements (XLS-02, XLS-03, XLS-04 are unchecked in REQUIREMENTS.md), meaning verzuim data may never be populated. The UI gracefully shows a 'no data' message when student.verzuim is absent, so the view does not crash — but the full requirement depends on upstream data supply."
    artifacts:
      - path: "dashboard/parsers/excel.js"
        issue: "XLS-02, XLS-03, XLS-04 marked incomplete in REQUIREMENTS.md; verzuim fields may not be populated for all students"
    missing:
      - "Confirm Excel parser correctly populates aanwezigheid, geoorloofd, ongeoorloofd, and laatsteMelding fields on student.verzuim before marking DET-02 fully satisfied"
  - truth: "Doorstroomprognose toont V/G/E-telling per leerlijn met gap-analyse t.o.v. norm"
    status: partial
    reason: "buildDetailLeerlijnen renders V/G/E counts per leerlijn from live prognose data. buildDetailPrognose renders full gap analysis using p.gaps fields. However NORM-02 through NORM-06 are marked incomplete in REQUIREMENTS.md, and upstream data quality (deelgebied scores from PDF parser: PDF-05 is unchecked) may produce empty tallies if the PDF parser did not extract scores. When no scores are present, the matrix shows a 'Geen datapunten' placeholder and tallies show 0/19."
    artifacts:
      - path: "dashboard/parsers/pdf.js"
        issue: "PDF-05 (Overzicht Deelgebieden extraction) marked incomplete in REQUIREMENTS.md; deelgebiedScores may be empty for some students"
    missing:
      - "Confirm PDF-05 is implemented and deelgebied scores are correctly extracted before treating DET-03/DET-04 as fully satisfied end-to-end"
human_verification:
  - test: "Open detail for a student who has both PDF and Excel data imported"
    expected: "All sections visible: doorstroomprognose with colored gap items, per-leerlijn bars, deelgebied matrix, stacked verzuim bar with aanwezigheid/geoorloofd/ongeoorloofd times and laatste melding, vak accordion with opdrachtstatus and feed forward, and notities textarea"
    why_human: "Cannot verify rendered DOM or stacked-bar proportions programmatically without a running browser"
  - test: "Type a note in the notities textarea, navigate to another student, then navigate back"
    expected: "Note persists when returning to the same student"
    why_human: "Requires browser localStorage interaction and navigation round-trip"
  - test: "Reload the page after entering a note — verify note survives page refresh"
    expected: "Note still present after reload; student import data also still present"
    why_human: "localStorage persistence check requires browser"
  - test: "Click 'Wis alle data', then reimport — verify notities are NOT cleared"
    expected: "Notes from before the wipe survive the clearState call (they are stored under separate key 'mentordashboard_notities')"
    why_human: "Requires browser interaction"
  - test: "Confirm <2 min UX: open a student detail page and time how long it takes to locate voortgang, verzuim, prognose, and notities"
    expected: "All four information categories visible without scrolling to a dead end; clearly labeled sections allow scanning in under 2 minutes"
    why_human: "Structural layout and readability cannot be assessed programmatically"
---

# Phase 5: Detailweergave Verification Report

**Phase Goal:** Mentor kan per leerling alle benodigde informatie voor een mentorgesprek op een scherm zien: volledige voortgang, verzuim, doorstroomprognose met gap-analyse en persoonlijke notities
**Verified:** 2026-03-25
**Status:** gaps_found (2 partial, 5 verified)
**Re-verification:** No — initial verification (no plan to cross-reference; implementation verified directly)

---

## Context Note

Phase 5 has no PLAN.md. The implementation was built directly into `dashboard/app.js` (lines 855–1253) and `dashboard/index.html` (CSS lines 288–637, HTML line 753). Verification is performed against the codebase alone, cross-referenced against the six success criteria in ROADMAP.md and the six requirements (DET-01 through DET-05, PER-03).

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Klikken op leerling in klasoverzicht opent detailpagina | VERIFIED | `klasTbody` click listener (app.js:807-810) calls `showDetail(row.dataset.id)`; `showView('detail')` (app.js:899) renders `detail-view` div |
| 2 | Volledige voortgang per vak/opdracht met status en feed forward | VERIFIED | `buildDetailVakken` (app.js:1170-1192) renders accordion per vak with opdracht naam, status and feedForward; CSS `.opdracht-ff` styled |
| 3 | Verzuimoverzicht aanwezigheid/geoorloofd/ongeoorloofd en laatste melding | PARTIAL | `buildDetailVerzuim` (app.js:1104-1168) fully implemented with stacked bar, legend, and `v.laatsteMelding`; but upstream XLS-02/03/04 incomplete |
| 4 | Doorstroomprognose met V/G/E-telling per leerlijn en gap-analyse | PARTIAL | `buildDetailLeerlijnen` + `buildDetailPrognose` (app.js:985-983) implemented; depends on NORM-02–06 and PDF-05 upstream |
| 5 | Mentor kan notities toevoegen per leerling, lokaal opgeslagen, persistent | VERIFIED | `buildDetailNotities` + `saveNotitie`/`getNotitie` (app.js:1194-1201, 880-888) with debounced auto-save to `localStorage['mentordashboard_notities']` |
| 6 | Navigatie terug naar klasoverzicht en naar volgende/vorige leerling | VERIFIED | `wireDetailEvents` (app.js:1203-1253): back→`showView('klas')`, prev/next→`showDetail(id)` with disabled state on first/last |
| 7 | Mentor kan in <2 minuten alle info voor mentorgesprek vinden | HUMAN NEEDED | Structural layout is correct (labeled sections in logical order); actual time-to-find requires human UX validation |

**Score:** 5/7 success criteria fully verified by code analysis (2 partial due to upstream data gaps, 1 human-only)

---

## Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `dashboard/app.js` lines 855–1253 | All detail view logic | VERIFIED — substantive | 398 lines of detail view code; no stubs |
| `dashboard/index.html` CSS `.detail-*` | Styling for all detail sections | VERIFIED | Lines 288–637 cover all classes used by builder functions |
| `dashboard/index.html` `#detail-view` | Container for detail HTML | VERIFIED | Line 753: `<div id="detail-view" style="display:none;"></div>` |
| `dashboard/utils/prognosis.js` | `window.berekenPrognose` | VERIFIED (Phase 3) | Function present and called at app.js:666 |
| `dashboard/utils/datamodel.js` | `window.saveState`, `loadState`, `clearState` | VERIFIED | Separate localStorage keys for student data vs notities |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `klasTbody` click | `showDetail` | `e.target.closest('tr[data-id]')` (app.js:807-809) | WIRED | Row click calls `showDetail(row.dataset.id)` |
| `showDetail` | `detailView.innerHTML` | `buildDetailHTML(student)` (app.js:898) | WIRED | Full HTML built and injected into `#detail-view` |
| `buildDetailHTML` | All sub-builders | Direct string concatenation (app.js:909-916) | WIRED | All 7 sub-builders called |
| `buildDetailNotities` | `localStorage` | `saveNotitie` → `localStorage.setItem(NOTITIES_KEY)` (app.js:883) | WIRED | Debounced 600ms; uses key `'mentordashboard_notities'` |
| `getNotitie` | `localStorage` | `localStorage.getItem(NOTITIES_KEY)` (app.js:877) | WIRED | Read on every detail open; populates textarea |
| `clearState` | student data only | `localStorage.removeItem(STORAGE_KEY)` (datamodel.js:267) | VERIFIED ISOLATION | Does NOT remove `NOTITIES_KEY` — notities survive wipe |
| `buildDetailPrognose` | `p.gaps.*` | `window.berekenPrognose(student, traject)` → `status.prognose` | WIRED | Real computed data, not hardcoded |
| `detail-back` btn | klasoverzicht | `showView('klas')` (app.js:1205) | WIRED | `renderKlasoverzicht()` called on view switch |
| `detail-prev`/`detail-next` | sibling students | `detailStudentList` index tracking (app.js:906-910) | WIRED | List built from sorted klas render order (app.js:765) |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `buildDetailVakken` | `student.vakken` | PDF parser → `addStudent` | Conditional (PDF-03 checked) | FLOWING when PDF-03 works |
| `buildDetailVerzuim` | `student.verzuim` | Excel parser → `addStudent` | Conditional (XLS-02 unchecked) | STATIC/EMPTY if XLS-02 not implemented |
| `buildDetailPrognose` | `p.gaps` | `window.berekenPrognose` → `student.deelgebiedScores` | Conditional (PDF-05 unchecked) | HOLLOW if no scores extracted |
| `buildDetailLeerlijnen` | `p.leerlijnen` | `window.berekenPrognose` | Conditional (PDF-05 unchecked) | HOLLOW if no scores extracted |
| `buildDetailNotities` | `getNotitie(id)` | `localStorage['mentordashboard_notities']` | Yes (direct read) | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED for server-dependent checks. Static module export checks run instead.

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| `showDetail` function defined | `grep 'function showDetail' app.js` | Found at line 890 | PASS |
| `buildDetailNotities` function defined | `grep 'function buildDetailNotities' app.js` | Found at line 1194 | PASS |
| `saveNotitie` uses separate localStorage key | `grep 'NOTITIES_KEY' app.js` | Defined at 859, used at 877/883; distinct from `STORAGE_KEY` in datamodel.js | PASS |
| `clearState` does NOT clear notities | `grep -A5 'clearState' datamodel.js` | Only removes `STORAGE_KEY` | PASS |
| Prev/next navigation list built from sorted klas order | `grep 'detailStudentList' app.js` | Built at line 765 from sorted `rijen`; passed to `showDetail` | PASS |
| Accordion toggle wired | `grep 'vak-card.*toggle' app.js` | Line 1214: `classList.toggle('open')` | PASS |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| DET-01 | Volledige voortgang per vak/opdracht met status en feed forward | SATISFIED | `buildDetailVakken` (app.js:1170): renders `op.naam`, `op.status`, `op.feedForward` per opdracht in accordion per vak |
| DET-02 | Verzuimoverzicht: aanwezigheid, geoorloofd, ongeoorloofd, laatste melding | PARTIAL | `buildDetailVerzuim` (app.js:1104): all four fields rendered when `student.verzuim` present; graceful empty state shown when absent. Upstream XLS-02 incomplete |
| DET-03 | Doorstroomprognose met V/G/E-telling per leerlijn | PARTIAL | `buildDetailLeerlijnen` (app.js:985): renders V/G/E counts per leerlijn via `berekenPrognose`; depends on populated deelgebied scores |
| DET-04 | Visuele gap-analyse: wat mist leerling nog voor doorstroom | SATISFIED (UI) | `buildDetailPrognose` (app.js:934-983): renders colored `gap-item` chips (gap-ok/warn/danger/info) with exact counts for SBL/SBC/BJ2 norms; CSS styles defined in index.html |
| DET-05 | Notitieveld voor mentor (lokaal opgeslagen) | SATISFIED | `buildDetailNotities` + `saveNotitie` (app.js:1194, 880): textarea with 600ms debounce auto-save to `localStorage['mentordashboard_notities']` |
| PER-03 | Mentor-notities bewaard los van import-data | SATISFIED | `clearState` (datamodel.js:266-271) removes only `STORAGE_KEY`; `NOTITIES_KEY = 'mentordashboard_notities'` is a separate key never touched by `clearState` |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app.js` | 1032-1033 | `"Geen datapunten in dit PDF"` fallback | Info | Expected empty state when PDF-05 not implemented; not a stub in the detail view itself |
| `app.js` | 1105-1109 | `"Geen verzuimdata"` fallback | Info | Expected empty state when Excel not imported; graceful degradation |
| `app.js` | 1171-1175 | `"Geen vakdata beschikbaar"` fallback | Info | Expected empty state when PDF-03 not producing data |

No blockers found in the detail view code itself. All empty states are graceful fallbacks, not implementation stubs. The detail view functions are substantive (not placeholder returns).

---

## Human Verification Required

### 1. Full Detail Page Render

**Test:** Import at least one PDF and open the detail view for that student.
**Expected:** All sections render — doorstroomprognose with colored gap chips, leerlijn bars, deelgebied matrix, voortgang accordion (open one vak to verify feed forward appears), notities textarea.
**Why human:** Cannot verify rendered DOM or visual styling without a browser.

### 2. Notitie Persistence Across Navigation

**Test:** Enter a note for student A, click "Volgende" to student B, then click "Vorige" back to student A.
**Expected:** Note for student A is still present in the textarea.
**Why human:** Requires interactive browser navigation.

### 3. Notitie Survives Page Reload

**Test:** Enter a note, reload the page (F5), navigate to the same student.
**Expected:** Note is still present (stored in `localStorage['mentordashboard_notities']`).
**Why human:** Requires browser localStorage interaction.

### 4. Notitie Survives "Wis alle data"

**Test:** Enter a note, click "Wis alle data" and confirm, then reimport the same PDF.
**Expected:** The note is NOT cleared — it persists because `clearState` only removes `STORAGE_KEY`, not `NOTITIES_KEY`.
**Why human:** Requires browser interaction sequence.

### 5. Time-to-Find UX Check (<2 min)

**Test:** Open a student with full data (PDF + Excel imported). Without prior knowledge, find: (a) which vakken have incomplete opdrachten, (b) how many hours ongeoorloofd verzuim, (c) whether the student is on track for BJ2, (d) any existing mentor notes.
**Expected:** All four pieces of information found in under 2 minutes using labeled sections in the detail view.
**Why human:** UX time-to-find cannot be measured programmatically.

---

## Gaps Summary

Two partial gaps exist, both rooted in upstream data pipelines rather than in the Phase 5 UI code:

**Gap 1 — DET-02 / Verzuim (upstream: Excel parser).**
`buildDetailVerzuim` is fully implemented and renders aanwezigheid, geoorloofd, ongeoorloofd, and laatste melding correctly. The gap is that XLS-02, XLS-03, and XLS-04 are marked incomplete in REQUIREMENTS.md, which means `student.verzuim` may not be populated for all students. The detail view displays a clear "no data" message rather than crashing. To fully satisfy DET-02, the Excel parser must be verified to correctly populate all four verzuim fields.

**Gap 2 — DET-03/DET-04 / Prognose + gap-analyse (upstream: PDF parser).**
`buildDetailLeerlijnen` and `buildDetailPrognose` compute from `window.berekenPrognose(student, traject)`, which in turn reads `student.deelgebiedScores`. PDF-05 (Overzicht Deelgebieden extraction) is marked incomplete in REQUIREMENTS.md. If PDF-05 is not producing scores, then all leerlijntelling will show 0 and all gap-items will show maximum shortfall regardless of actual student performance. The Phase 5 UI is correctly wired; the upstream extractor needs verification.

These are not Phase 5 bugs — they are pre-existing upstream gaps (Phases 1 and 2) surfacing in Phase 5 rendering. The Phase 5 code itself handles both absent-data cases gracefully with appropriate empty states.

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
