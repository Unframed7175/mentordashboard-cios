---
phase: 08-revert-toetsplan-changes
verified: 2026-04-22T10:00:00Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open index.html in a browser and go to the Import tab"
    expected: "No 'Toetsplan importeren' section is visible — only stage import and backup sections are present"
    why_human: "DOM rendering and visual layout cannot be verified by static grep"
  - test: "Create a klas and import a PDF, then inspect the klas tab button"
    expected: "No 'Toetsplan: N fases' badge appears on any klas tab"
    why_human: "Requires actual browser rendering and localStorage state to verify dynamic badge logic"
  - test: "Open a student detail view and inspect the D2 table"
    expected: "Datapunten appear in original PDF order with no Deadline column; the table header has only 'Datapunt' and groep columns"
    why_human: "Requires importing a real PDF and rendering the detail view to confirm column structure and row order"
  - test: "Import PDFs for two periods for one klas, open a student detail view, inspect the tfoot"
    expected: "Two tfoot rows appear: one for the oldest periode, one for the newest, each with growth badge arrows (V/G/E with directional indicator)"
    why_human: "Requires multi-period import and live DOM inspection to verify two-row tfoot with growthBadge rendering"
  - test: "Open a student detail view and locate the Feedback & actiepunten panel"
    expected: "Only 'Mentor actiepunten' sub-section is visible; no 'Feedback per deelgebied' sub-section appears"
    why_human: "Requires browser rendering to confirm sub-section structure"
---

# Phase 8: Revert Toetsplan Changes — Verification Report

**Phase Goal:** Verwijder alle Phase 11 toetsplan-gerelateerde code uit app.js en index.html — herstel de exacte post-Phase-7 staat zonder toetsplan-import UI, merge logic, deadline-kolom of debug helpers
**Verified:** 2026-04-22T10:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | No toetsplan-zone or import UI exists in the page (no #toetsplan-import-section) | VERIFIED | `toetsplan-zone`, `toetsplan-import-section`, `toetsplan-choose-btn`, `toetsplan-input id`, `toetsplan-status id`, `klas-schooljaar-section` all absent from index.html |
| 2 | D2 table (buildDetailDeelgebieden) renders datapunten in original PDF order — no deadline sorting, no toetsplan merge | VERIFIED | Function body contains `datapunten.map(...)` with comment "Render datapunten in original PDF order (no toetsplan merge, no deadline sorting)"; no deadline/toetsplan logic in function body (only in comment) |
| 3 | D2 table has no Deadline column (no `<th>Deadline</th>`, no deadlineCell) | VERIFIED | `grep deadlineCell` = 0, `grep Deadline</th>` = 0 across entire app.js |
| 4 | Phase 7 two-row tfoot with growth badges is intact (oldest/newest periode rows with growthBadge) | VERIFIED | `function growthBadge` present, `hasTwoPeriods` present, `oldest.periode` and `newest.periode` present; no extra empty `<td></td>` Deadline placeholder in tfoot rows |
| 5 | Phase 13 Feedback & actiepunten panel still renders (buildDetailFeedback returns the mentor-actiepunten sub-section) | VERIFIED | `function buildDetailFeedback` present; no `feedbackHtml`, no `Feedback per deelgebied`, no `getActiveToetsplan` inside function; `Mentor actiepunten` and `actiepunten-list` present in function body |
| 6 | No normDatapunt, findStudentDp, findPDFScoresForDatapunt, debugMerge, debugToetsplanKoppeling, getActiveToetsplan, detectJaarPrefix, filterFasesForStudent, buildDetailTijdlijn, tokenSet, tokenSubsetMatch functions remain | VERIFIED | All 12 function names absent from app.js (programmatic check: all returned false) |
| 7 | renderKlasTabStrip produces no toetsplan-badge elements | VERIFIED | `toetsplan-badge` absent from renderKlasTabStrip function body; `renderToetsplanZone` call absent from function body |
| 8 | renderToetsplanZone is not called anywhere | VERIFIED | `renderToetsplanZone()` not found anywhere in app.js — both the function definition and all call sites removed |
| 9 | buildDetailDeelgebiedenTijdlijn sorts periods alphabetically (no toetsplan deadline-based sort) | VERIFIED | Function `buildDetailDeelgebiedenTijdlijn` does not exist anywhere in app.js — it was removed entirely along with its only call site in buildDetailHTML |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app.js` | Phase 11 code removed, Phase 7+13 intact | VERIFIED | 714 lines removed per SUMMARY; all 17 Phase 11 identifiers absent; all 6 Phase 7+13 identifiers present |
| `index.html` | toetsplan-import-section HTML removed | VERIFIED | All 8 toetsplan HTML/CSS identifiers absent; all 3 required preserved sections (stage-zone, backup-section, nieuwe-klas-schooljaar) intact |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `buildDetailHTML` | `buildDetailDeelgebieden` | `buildDetailDeelgebieden(student)` | WIRED | Pattern found in buildDetailHTML function body |
| `buildDetailHTML` | `buildDetailFeedback` | `buildDetailFeedback(student)` | WIRED | Pattern found in buildDetailHTML function body |
| `buildDetailHTML` | `buildDetailTijdlijn` | (removed) | VERIFIED ABSENT | Call site removed — function no longer exists |
| `buildDetailHTML` | `buildDetailDeelgebiedenTijdlijn` | (removed) | VERIFIED ABSENT | Call site removed — function no longer exists |

---

### Data-Flow Trace (Level 4)

Not applicable — this is a deletion phase. No new data sources introduced. The surviving `buildDetailDeelgebieden` renders `datapunten` from `student` (same source as post-Phase-7 baseline). No new wiring to verify.

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — this is a browser-only static HTML/JS app with no runnable entry point (no Node server, no CLI). All behavioral verification requires a browser (see Human Verification section).

---

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|---------|
| D-01 | 08-CONTEXT.md | Alle 12 Phase 11 commits worden teruggedraaid | SATISFIED | All 12 Phase 11 functions absent from app.js; commits 079c27d and 9c39e37 exist in git log |
| D-02 | 08-CONTEXT.md | Terug naar exact de staat na Phase 7 qua code | SATISFIED | Phase 7 artifacts (growthBadge, hasTwoPeriods, oldest.periode) all intact |
| D-03 | 08-CONTEXT.md | Toetsplan import UI volledig verwijderd | SATISFIED | All toetsplan-zone HTML, handleToetsplanImport, renderToetsplanZone, getActiveToetsplan absent |
| D-04 | 08-CONTEXT.md | Datapunten in D2-tabel in originele PDF-volgorde | SATISFIED | buildDetailDeelgebieden uses datapunten.map in PDF order; no sorting logic present |
| D-05 | 08-CONTEXT.md | Deadline-kolom verwijderd | SATISFIED | No `<th>Deadline</th>`, no `deadlineCell`, no empty `<td></td>` placeholder in tfoot |

**Note on requirement ID scope:** D-01 through D-05 are phase-local decision IDs defined in `08-CONTEXT.md`, not entries in `.planning/REQUIREMENTS.md`. REQUIREMENTS.md uses KLS-*, CMP-*, EXP-* namespaces for v1.1 product requirements — none of those are claimed by Phase 8, which is a cleanup phase with its own decision-scoped IDs. No orphaned REQUIREMENTS.md IDs were found for Phase 8.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app.js` | 1860 | `placeholder="Onderwerp actiepunt..."` | Info | HTML input placeholder attribute — legitimate UI hint, not a code stub |
| `app.js` | 2051 | `placeholder="Schrijf hier notities..."` | Info | HTML textarea placeholder attribute — legitimate UI hint, not a code stub |

No blocker or warning anti-patterns found. Both placeholder hits are HTML form field hint text, not code stubs.

---

### Human Verification Required

#### 1. Import tab — no toetsplan section visible

**Test:** Open `index.html` in a browser and navigate to the Import tab.
**Expected:** No "Toetsplan importeren" section visible. Only the stage import drop zone and backup section are present.
**Why human:** Static grep confirms HTML elements are absent, but visual rendering confirmation requires a browser.

#### 2. Klas tab — no toetsplan badge

**Test:** Create a klas (or use an existing localStorage klas) and inspect the klas tab button.
**Expected:** No "Toetsplan: N fases" badge appears on the tab button.
**Why human:** The `klas.toetsplan` property may still exist in localStorage from before the revert. Only a browser test with real localStorage state confirms the badge code is truly gone from rendered output.

#### 3. D2 table — PDF order, no Deadline column

**Test:** Import a PDF for a student, open the student's detail view, and inspect the D2 (Deelgebieden) table.
**Expected:** Datapunten appear in original PDF order; table header shows only "Datapunt" and groep columns — no "Deadline" column.
**Why human:** Requires a real PDF import to populate datapunten and trigger the render path.

#### 4. Two-row tfoot with growth badges

**Test:** Import PDFs for two different periods for the same klas, open a student detail view, and inspect the tfoot.
**Expected:** Two footer rows appear — one for the oldest periode, one for the newest — each showing growth badge arrows (V/G/E with up/down/equal indicator).
**Why human:** Requires multi-period import and live DOM inspection to confirm the hasTwoPeriods branch renders correctly.

#### 5. Feedback & actiepunten — mentor actiepunten only

**Test:** Open any student detail view and locate the "Feedback & actiepunten" collapsible panel.
**Expected:** Only "Mentor actiepunten" sub-section is shown. No "Feedback per deelgebied" sub-section appears.
**Why human:** Requires browser rendering to confirm the panel structure.

---

### Gaps Summary

No automated gaps found. All 9 must-have truths verified. All Phase 11 identifiers confirmed absent. All Phase 7+13 preservation checks pass. Commits 079c27d and 9c39e37 confirmed in git history.

Status is `human_needed` because this is a browser-only app — the five behavioral checks above (visual rendering, import flow, D2 table structure, tfoot rendering, feedback panel) require a live browser session with real data to confirm goal achievement end-to-end.

---

_Verified: 2026-04-22T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
