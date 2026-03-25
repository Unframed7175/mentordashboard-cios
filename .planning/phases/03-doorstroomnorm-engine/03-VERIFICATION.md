---
phase: 03-doorstroomnorm-engine
verified: 2026-03-25T12:00:00Z
status: human_needed
score: 6/7 success criteria verified
re_verification: true
  previous_status: gaps_found
  previous_score: 5/7
  gaps_closed:
    - "Mentor kan deelgebieden toewijzen aan leerlijnen via een overzichtelijke UI (NORM-01)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Handmatige controle prognoseberekening voor 19 leerlingen"
    expected: "De berekende prognose (label, totaal >=V, leerlijnen-telling, gaps) klopt met handmatig nagetelde scores voor elke leerling in het klasoverzicht"
    why_human: "ROADMAP Success Criterion #7 vereist verificatie tegen echte PDF-data van 19 specifieke leerlingen. De berekening is correct geimplementeerd maar of de PDF-parser de scores correct aanlevert (deelgebiedScores object) kan alleen met echte PDFs worden bevestigd."
---

# Phase 3: Doorstroomnorm Engine — Verification Report (Re-verification)

**Phase Goal:** App berekent automatisch een doorstroomprognose per leerling op basis van de officiele CIOS-normen, nadat de mentor deelgebieden heeft toegewezen aan leerlijnen
**Verified:** 2026-03-25
**Status:** human_needed — all automated checks pass; one item requires human testing with real PDFs
**Re-verification:** Yes — after NORM-01 gap closure

---

## Re-verification Summary

**Previous status:** gaps_found (5/7, 1 blocker gap)
**Current status:** human_needed (6/7, 0 blocker gaps)

**Gap closed:**

NORM-01 — Leerlijn-toewijzing UI. Three new artifacts deliver this:

- `utils/leerlijnen.js` — new file, full localStorage persistence layer
- `index.html` — `#leerlijn-toewijzing` section with 19-row table skeleton + reset button
- `app.js` — `renderLeerlijntoewijzing()`, `onLeerlijnenChange()`, ltResetBtn handler, show/hide wiring

**Regressions:** None. All previously passing truths remain verified.

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | Mentor kan deelgebieden toewijzen aan leerlijnen via een overzichtelijke UI | ✓ VERIFIED | `#leerlijn-toewijzing` table (index.html line 699), `renderLeerlijntoewijzing()` builds 19 dropdown rows (app.js line 572), `onLeerlijnenChange()` saves and triggers recalculation (app.js line 608) |
| 2   | App telt automatisch V/G/E per leerlijn per leerling | ✓ VERIFIED | `telLeerlijnen()` in prognosis.js lines 56-89 counts voldoendeOfHoger, goedOfHoger, onvoldoende, onbeoordeeld per leerlijn using dynamic mapping |
| 3   | Prognose "Positief (BJ2)" correct berekend: >=13 deelgebieden voldoende totaal | ✓ VERIFIED | BJ2: label 'sbl' when totaalVoldoendeOfHoger >= 13 (line 183/189); BJ1: label 'bj2' when >= 13 (line 144/150). Logic correct; label names differ from requirement wording but runtime is unambiguous. |
| 4   | Prognose "Versneld (SBC)" correct berekend: lesgeven >=4 G, organiseren >=3 G, professioneel handelen >=5 G | ✓ VERIFIED | BJ1 path: VERSNELD_BJ1 constants at lines 29-33; logic at lines 138-142 checks goedOfHoger per leerlijn |
| 5   | Risicosignaal "Negatief" correct berekend: >6 onvoldoende OF >2 onvoldoende binnen een leerlijn | ✓ VERIFIED | Lines 128-131: `totaalOnvoldoende > 6 || leerlijnen.some(ll => telling[ll].onvoldoende > 2)` |
| 6   | Gap-analyse toont hoeveel deelgebieden nog ontbreken t.o.v. elke norm | ✓ VERIFIED | gaps object built at lines 156-171 (BJ1) and 195-210 (BJ2); rendered in buildDetailPrognose() and buildDetailLeerlijnen() in app.js |
| 7   | Berekende prognose komt overeen met handmatige berekening voor alle 19 leerlingen | ? UNCERTAIN | Calculation logic verified. Correctness against actual PDF data requires human testing. |

**Score:** 6/7 success criteria verified (0 failed, 1 needs human)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `utils/leerlijnen.js` | Leerlijn mapping persistence (getLeerlijnenMapping, saveLeerlijnenMapping, resetLeerlijnenMapping) | ✓ VERIFIED | 93 lines, full IIFE with localStorage persistence, cache, validation against all 19 DEELGEBIEDEN IDs, graceful fallback to schema.js defaults |
| `utils/prognosis.js` | Doorstroomnorm calculation engine containing berekenPrognose | ✓ VERIFIED | 311 lines, fully implemented IIFE; telLeerlijnen() now reads dynamic mapping via window.getLeerlijnenMapping |
| `index.html` | Script tags for leerlijnen.js and prognosis.js; leerlijn-toewijzing table skeleton | ✓ VERIFIED | leerlijnen.js at line 763, prognosis.js at line 767 (correct order); `#leerlijn-toewijzing` section at lines 699-715 with lt-tbody, lt-reset-btn, lt-status |

---

## Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `index.html` | `utils/leerlijnen.js` | script tag | ✓ WIRED | Line 763 — loaded after schema.js, before prognosis.js |
| `index.html` | `utils/prognosis.js` | script tag | ✓ WIRED | Line 767 — correctly after leerlijnen.js |
| `utils/leerlijnen.js` | `window.DEELGEBIEDEN` | buildDefault() + isValid() | ✓ WIRED | Lines 17 and 27: reads window.DEELGEBIEDEN for defaults and validation |
| `utils/prognosis.js` | `window.getLeerlijnenMapping` | telLeerlijnen() | ✓ WIRED | Line 63: `var mapping = window.getLeerlijnenMapping ? window.getLeerlijnenMapping() : {};` with graceful fallback |
| `app.js` | `window.getLeerlijnenMapping` | renderLeerlijntoewijzing() | ✓ WIRED | Line 574: called to populate 19 dropdown rows |
| `app.js` | `window.saveLeerlijnenMapping` | onLeerlijnenChange() | ✓ WIRED | Line 615: called on every dropdown change with full mapping object |
| `app.js` | `window.resetLeerlijnenMapping` | ltResetBtn click handler | ✓ WIRED | Line 639: called on reset button click |
| `onLeerlijnenChange` | `renderKlasoverzicht()` | after save | ✓ WIRED | Lines 630-632: recalculates prognoses and re-renders klasoverzicht when students are loaded |
| `ltResetBtn` | `renderKlasoverzicht()` | after reset | ✓ WIRED | Lines 641-643: same recalculation path on reset |
| `autoSave()` | `#leerlijn-toewijzing` visibility | ltSection.style.display | ✓ WIRED | Lines 843-846: section shown after PDF import if students present |
| `loadState()` startup | `#leerlijn-toewijzing` visibility | ltSection.style.display | ✓ WIRED | Lines 1260-1263: section shown on page load if saved state has students |
| Wis-data handler | `#leerlijn-toewijzing` visibility | ltSection.style.display = 'none' | ✓ WIRED | Line 832: hidden when all data is wiped |
| `app.js` | `window.berekenPrognose` | berekenStatus() call | ✓ WIRED | berekenPrognose called per student in klasoverzicht and detail render |
| `app.js` | `p.gaps` | buildDetailPrognose() | ✓ WIRED | gaps.onvoldoendeRuimte, gaps.nodigSBL, gaps.nodigSBC_deelgebieden, etc. rendered in detail view |
| `app.js` | `p.leerlijnen` | buildDetailLeerlijnen() | ✓ WIRED | leerlijnen array rendered as leerlijn-rows with progress bars |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `utils/leerlijnen.js` getLeerlijnenMapping | `_cachedMapping` | localStorage override (if valid) or schema.js DEELGEBIEDEN defaults | Yes — real localStorage data or schema-derived defaults; isValid() guards against corrupt data | ✓ FLOWING |
| `utils/prognosis.js` telLeerlijnen | `mapping` from getLeerlijnenMapping | leerlijnen.js | Yes — dynamic, mentor-editable mapping; falls back gracefully if leerlijnen.js not loaded | ✓ FLOWING |
| `app.js` renderLeerlijntoewijzing | dropdown values | getLeerlijnenMapping() | Yes — renders actual saved mapping with changed-row highlighting | ✓ FLOWING |
| `utils/prognosis.js` berekenPrognose | `student.deelgebiedScores` | PDF parser -> appState.students | Yes — scores populated by parseSinglePDF from real PDFs | ✓ FLOWING |
| `app.js` buildDetailPrognose | `p.gaps`, `p.leerlijnen` | berekenPrognose return value | Yes — computed from actual student scores using current leerlijn mapping | ✓ FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| leerlijnen.js exists and is substantive | File read | 93 lines, full IIFE implementation | ✓ PASS |
| getLeerlijnenMapping exported to window | grep window.getLeerlijnenMapping in leerlijnen.js | Line 40: `window.getLeerlijnenMapping = function()` | ✓ PASS |
| saveLeerlijnenMapping exported to window | grep window.saveLeerlijnenMapping in leerlijnen.js | Line 66: `window.saveLeerlijnenMapping = function(mapping)` | ✓ PASS |
| resetLeerlijnenMapping exported to window | grep window.resetLeerlijnenMapping in leerlijnen.js | Line 82: `window.resetLeerlijnenMapping = function()` | ✓ PASS |
| leerlijnen.js loaded before prognosis.js | Script tag order in index.html | Line 763 (leerlijnen.js) before line 767 (prognosis.js) | ✓ PASS |
| prognosis.js uses getLeerlijnenMapping | grep in prognosis.js | Line 63: conditional call with fallback | ✓ PASS |
| #leerlijn-toewijzing section in HTML | grep in index.html | Lines 699-715: full table structure | ✓ PASS |
| lt-tbody element exists for dropdown population | grep in index.html | Line 709: `<tbody id="lt-tbody"></tbody>` | ✓ PASS |
| renderLeerlijntoewijzing builds 19 rows | Code review app.js lines 572-606 | Loops window.DEELGEBIEDEN, creates select per row, attaches onLeerlijnenChange | ✓ PASS |
| onLeerlijnenChange saves and triggers recalculation | Code review app.js lines 608-635 | saveLeerlijnenMapping + renderKlasoverzicht if students loaded | ✓ PASS |
| ltResetBtn resets mapping and recalculates | Code review app.js lines 637-647 | resetLeerlijnenMapping + renderLeerlijntoewijzing + renderKlasoverzicht | ✓ PASS |
| Section shown after PDF import | Code review app.js lines 842-846 | autoSave() sets display:block and calls renderLeerlijntoewijzing | ✓ PASS |
| Section shown on startup with saved state | Code review app.js lines 1259-1263 | loadState check sets display:block and calls renderLeerlijntoewijzing | ✓ PASS |
| Section hidden on data wipe | Code review app.js line 832 | ltSection.style.display = 'none' | ✓ PASS |
| prognosis.js is substantive | File line count | 311 lines, full BJ1+BJ2 engine | ✓ PASS |
| berekenPrognose exported to window | grep | Line 111: `window.berekenPrognose = function(student, traject)` | ✓ PASS |
| negatief trigger: >6 OR >2 per leerlijn | Code review prognosis.js lines 128-131 | `totaalOnvoldoende > 6 || leerlijnen.some(...)` | ✓ PASS |
| leerlijn mapping uses dynamic getLeerlijnenMapping | grep prognosis.js | Line 63: conditional call with dg.group fallback | ✓ PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| NORM-01 | 03-01-PLAN.md | Mentor kan deelgebieden toewijzen aan leerlijnen via UI | ✓ SATISFIED | leerlijnen.js (persistence), index.html (table skeleton), app.js renderLeerlijntoewijzing + onLeerlijnenChange + ltResetBtn handler — full round-trip: display, change, save, recalculate, reset |
| NORM-02 | 03-01-PLAN.md | App telt automatisch V/G/E per leerlijn per leerling | ✓ SATISFIED | telLeerlijnen() in prognosis.js computes all tallies per leerlijn using dynamic mapping |
| NORM-03 | 03-01-PLAN.md | Prognose "Positief (BJ2)": >=13 deelgebieden voldoende totaal | ✓ SATISFIED | BJ2: 'sbl' label at >= 13; BJ1: 'bj2' label at >= 13. Norm logic correct. |
| NORM-04 | 03-01-PLAN.md | Prognose "Versneld (SBC)": lesgeven >=4 G, org >=3 G, prof >=5 G | ✓ SATISFIED | VERSNELD_BJ1 constants + goedOfHoger checks at lines 138-142 |
| NORM-05 | 03-01-PLAN.md | Risicosignaal "Negatief": >6 onv totaal OF >2 binnen een leerlijn | ✓ SATISFIED | Lines 128-131: exact condition implemented |
| NORM-06 | 03-01-PLAN.md | Gap-analyse: hoeveel deelgebieden nog ontbreken t.o.v. norm | ✓ SATISFIED | gaps object fully populated per traject; rendered in detail view of app.js |

**Orphaned requirements:** None — all 6 NORM-xx requirements are claimed by 03-01-PLAN.md.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `utils/prognosis.js` | 258-295 | `console.group` / `console.log` statements in debugPrognose | INFO | Intentional debug helpers (window.debugPrognose). No impact on production functionality. |
| `utils/prognosis.js` | 309 | `console.log('[prognosis.js] Doorstroomnorm engine geladen...')` | INFO | Load confirmation log — benign. |
| `utils/leerlijnen.js` | 91 | `console.log('[leerlijnen.js] Leerlijn-toewijzing persistence geladen')` | INFO | Load confirmation log — benign. |

No blockers or stubs. All three new artifacts are fully implemented and wired.

**Note on PLAN label mismatch (carried from initial verification):** The PLAN frontmatter must-haves refer to labels `'positief'` and `'versneld'` which do not exist at runtime. The implementation uses `'sbl'`/`'bj2'` and `'versneld_sbc'` respectively. The app.js rendering code is consistent with the actual labels — this is a documentation inaccuracy in the PLAN, not a runtime bug. No action required for goal achievement.

---

## Human Verification Required

### 1. Prognoseberekening vs. handmatige telling voor 19 leerlingen

**Test:** Importeer alle 19 CSD2A PDFs. Open elk leerlingdossier in de detailweergave. Vergelijk de getoonde prognose (label, totaal >=V, leerlijnen-telling) met een handmatige telling van de deelgebiedscores in de PDF.
**Expected:** Label, totaalVoldoendeOfHoger, totaalOnvoldoende en per-leerlijn scores komen exact overeen met handmatige berekening voor alle 19 leerlingen.
**Why human:** ROADMAP Success Criterion #7 vereist verificatie tegen echte leerlingdata. De berekening is correct geimplementeerd maar of de PDF-parser de scores correct aanlevert (deelgebiedScores object) kan alleen met echte PDFs worden bevestigd.

---

## Gaps Summary

No gaps remain. All six NORM-xx requirements are fully implemented and wired.

**NORM-01 gap closed:** The leerlijn-toewijzing feature is complete end-to-end:

1. `utils/leerlijnen.js` provides `getLeerlijnenMapping` (reads localStorage override or schema.js defaults with validation), `saveLeerlijnenMapping` (persists to localStorage, invalidates cache), and `resetLeerwijnenMapping` (removes localStorage override, invalidates cache).
2. `index.html` carries the `#leerlijn-toewijzing` section (hidden by default via `display:none` in CSS) with a full table structure for 19 dropdown rows and a reset button.
3. `app.js` contains `renderLeerlijntoewijzing()` (populates 19 rows with selects reflecting current mapping, highlights deviations from schema defaults), `onLeerlijnenChange()` (collects all dropdowns, saves mapping, updates highlight state, triggers prognosis recalculation), `ltResetBtn` handler (resets to defaults, re-renders UI, recalculates prognoses), and show/hide wiring at import completion, page startup, and data wipe.
4. `utils/prognosis.js` uses `window.getLeerlijnenMapping()` in `telLeerlijnen()` with a graceful fallback to `dg.group` if leerlijnen.js is absent — the dynamic mapping flows correctly into all prognosis calculations.

The phase goal is achieved for all automated verification criteria. Only human verification of the PDF-to-prognosis round-trip remains (Success Criterion #7).

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
