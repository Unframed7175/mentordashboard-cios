---
phase: 03-doorstroomnorm-engine
verified: 2026-03-25T00:00:00Z
status: gaps_found
score: 5/7 success criteria verified
re_verification: false
gaps:
  - truth: "Mentor kan deelgebieden toewijzen aan leerlijnen via een overzichtelijke UI"
    status: failed
    reason: "NORM-01 and ROADMAP Success Criterion #1 require a mentor-facing UI to assign deelgebieden to leerlijnen. No such UI exists. The leerlijn-to-deelgebied mapping is permanently hardcoded in utils/schema.js (the `group` field on each DEELGEBIED entry). The mentor cannot change it."
    artifacts:
      - path: "utils/schema.js"
        issue: "Leerlijn groupings are hardcoded constants, not configurable by mentor"
      - path: "index.html"
        issue: "No UI element exists for leerlijn mapping — neither a form, dropdown, drag-and-drop, nor settings panel"
      - path: "app.js"
        issue: "No event handler or rendering function for leerlijn-mapping UI"
    missing:
      - "A UI component (settings panel or configuration view) that lets the mentor see and optionally reassign which deelgebied belongs to which leerlijn"
      - "Persistence of any custom mapping the mentor makes"
      - "Event wiring from UI to recalculate prognoses after mapping change"

  - truth: "PLAN must-have label contract: 'positief' and 'versneld' labels"
    status: failed
    reason: "The PLAN frontmatter must-haves assert labels named 'positief' and 'versneld'. The actual implementation uses different label names: 'sbl'/'bj2' (not 'positief') and 'versneld_sbc' (not 'versneld'). This is a label contract mismatch, but the underlying norm logic is implemented correctly — the discrepancy is in documentation accuracy. The app.js prognosis rendering code handles the correct labels ('sbl', 'bj2', 'versneld_sbc') and works end-to-end. Impact: low for runtime, but the PLAN's must-have truths are inaccurate."
    artifacts:
      - path: "utils/prognosis.js"
        issue: "BJ2 labels are 'negatief' | 'sbc' | 'sbl' | 'neutraal'; BJ1 labels are 'negatief' | 'versneld_sbc' | 'bj2' | 'neutraal'. No 'positief' or 'versneld' label exists anywhere in the codebase."
    missing:
      - "Either: update PLAN must-haves to match actual label names OR align the implementation labels with the original plan (low priority — runtime is not broken)"

human_verification:
  - test: "Handmatige controle prognoseberekening voor 19 leerlingen"
    expected: "De berekende prognose (label, leerlijnen-telling, gaps) klopt met handmatig nagetelde scores voor elke leerling in het klasoverzicht"
    why_human: "ROADMAP Success Criterion #7 vereist verificatie tegen echte PDF-data van 19 specifieke leerlingen. De berekening zelf is correct geimplementeerd, maar de match met echte data kan niet programmatisch worden geverifieerd zonder de daadwerkelijke leerling-PDFs."
---

# Phase 3: Doorstroomnorm Engine — Verification Report

**Phase Goal:** App berekent automatisch een doorstroomprognose per leerling op basis van de officiele CIOS-normen, nadat de mentor deelgebieden heeft toegewezen aan leerlijnen
**Verified:** 2026-03-25
**Status:** gaps_found — 1 blocker gap (NORM-01 / Success Criterion #1: no leerlijn mapping UI)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | Mentor kan deelgebieden toewijzen aan leerlijnen via een overzichtelijke UI | ✗ FAILED | No mapping UI exists; groupings hardcoded in schema.js |
| 2   | App telt automatisch V/G/E per leerlijn per leerling | ✓ VERIFIED | `telLeerlijnen()` in utils/prognosis.js lines 56-86 counts voldoendeOfHoger, goedOfHoger, onvoldoende, onbeoordeeld per leerlijn |
| 3   | Prognose "Positief (BJ2)" correct berekend: >=13 deelgebieden voldoende totaal | ✓ VERIFIED | BJ2: label 'sbl' when totaalVoldoendeOfHoger >= 13 (line 179); BJ1: label 'bj2' when >= 13 (line 140). Logic is correct; label names differ from requirement wording. |
| 4   | Prognose "Versneld (SBC)" correct berekend: lesgeven >=4 G, organiseren >=3 G, professioneel handelen >=5 G | ✓ VERIFIED | BJ1 path: VERSNELD_BJ1 constants at lines 29-33; logic at lines 134-138 checks goedOfHoger per leerlijn |
| 5   | Risicosignaal "Negatief" correct berekend: >6 onvoldoende OF >2 onvoldoende binnen een leerlijn | ✓ VERIFIED | Lines 124-127: `totaalOnvoldoende > 6 || leerlijnen.some(ll => telling[ll].onvoldoende > 2)` |
| 6   | Gap-analyse toont hoeveel deelgebieden nog ontbreken t.o.v. elke norm | ✓ VERIFIED | gaps object built at lines 152-167 (BJ1) and 191-206 (BJ2); rendered in buildDetailPrognose() and buildDetailLeerlijnen() in app.js |
| 7   | Berekende prognose komt overeen met handmatige berekening voor alle 19 leerlingen | ? UNCERTAIN | Calculation logic verified. Correctness against actual PDF data requires human testing. |

**Score:** 5/7 success criteria verified (1 failed, 1 needs human)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `utils/prognosis.js` | Doorstroomnorm calculation engine containing berekenPrognose | ✓ VERIFIED | 307 lines, fully implemented IIFE with berekenPrognose, berekenAllePrognoses, debugPrognose |
| `index.html` | Script tag for prognosis.js loaded before app.js | ✓ VERIFIED | Line 732: `<script src="utils/prognosis.js"></script>` — correctly positioned after schema.js/datamodel.js/excel.js and before app.js module |

---

## Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `index.html` | `utils/prognosis.js` | script tag | ✓ WIRED | Line 732 in index.html |
| `utils/prognosis.js` | `window.DEELGEBIEDEN` | `window.DEELGEBIEDEN` in telLeerlijnen() | ✓ WIRED | Line 57: `var deelgebieden = window.DEELGEBIEDEN;` — reads groups from schema.js |
| `app.js` | `window.berekenPrognose` | berekenStatus() call | ✓ WIRED | Line 581: `const p = window.berekenPrognose(student, traject);` — called from berekenStatus() which is called for every student render |
| `app.js` | `p.gaps` | buildDetailPrognose() | ✓ WIRED | Lines 849-879: gaps.onvoldoendeRuimte, gaps.nodigSBL, gaps.nodigSBC_deelgebieden, gaps.nodigBJ2, etc. all rendered in detail view |
| `app.js` | `p.leerlijnen` | buildDetailLeerlijnen() | ✓ WIRED | Lines 894-905: leerlijnen array rendered as leerlijn-rows with progress bars |
| Mentor UI | Leerlijn-to-deelgebied mapping | (no UI) | ✗ NOT_WIRED | NORM-01 requires mentor UI for this — does not exist |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `utils/prognosis.js` berekenPrognose | `student.deelgebiedScores` | PDF parser → appState.students | Yes — scores populated by parseSinglePDF from real PDFs | ✓ FLOWING |
| `app.js` buildDetailPrognose | `p.gaps`, `p.leerlijnen` | berekenPrognose return value | Yes — computed from actual student scores | ✓ FLOWING |
| Leerlijn mapping | `DEELGEBIEDEN[n].group` | Hardcoded in schema.js | Static constant, not mentor-configurable | ✗ STATIC — acceptable for calculation correctness, NOT acceptable for NORM-01 |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| prognosis.js is a non-empty file | File exists and is 307 lines | 307 lines, fully implemented | ✓ PASS |
| berekenPrognose exported to window | grep `window.berekenPrognose` | Line 107: `window.berekenPrognose = function(student, traject) {` | ✓ PASS |
| berekenAllePrognoses exported to window | grep `window.berekenAllePrognoses` | Line 225: `window.berekenAllePrognoses = function(traject) {` | ✓ PASS |
| prognosis.js loaded before app.js in index.html | Script tag order in index.html | Line 732 (prognosis.js) before line 736 (app.js module) | ✓ PASS |
| negatief trigger: >6 OR >2 per leerlijn | Code logic at lines 124-127 | `totaalOnvoldoende > 6 \|\| leerlijnen.some(...)` — exact NORM-05 condition | ✓ PASS |
| lesgeven >=4 G/E constant in VERSNELD_BJ1 | grep VERSNELD_BJ1 | Lines 29-33: `lesgeven: 4, organiseren: 3, prof_handelen: 5` | ✓ PASS |
| app.js calls berekenPrognose per student | grep berekenPrognose in app.js | Line 581: called in berekenStatus() invoked per student in renderKlasoverzicht and buildDetailHTML | ✓ PASS |
| Leerlijn mapping UI | grep for mapping/toewijz UI elements | No form, no panel, no UI element found | ✗ FAIL |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| NORM-01 | 03-01-PLAN.md | Mentor kan deelgebieden toewijzen aan leerlijnen via UI | ✗ BLOCKED | Leerlijn groupings hardcoded in schema.js. No UI for reassignment. |
| NORM-02 | 03-01-PLAN.md | App telt automatisch V/G/E per leerlijn per leerling | ✓ SATISFIED | telLeerlijnen() in prognosis.js computes all tallies per leerlijn |
| NORM-03 | 03-01-PLAN.md | Prognose "Positief (BJ2)": >=13 deelgebieden voldoende totaal | ✓ SATISFIED | BJ2: 'sbl' label at >= 13; BJ1: 'bj2' label at >= 13. Norm logic correct. |
| NORM-04 | 03-01-PLAN.md | Prognose "Versneld (SBC)": lesgeven >=4 G, org >=3 G, prof >=5 G | ✓ SATISFIED | VERSNELD_BJ1 constants + goedOfHoger checks at lines 134-138 |
| NORM-05 | 03-01-PLAN.md | Risicosignaal "Negatief": >6 onv totaal OF >2 binnen een leerlijn | ✓ SATISFIED | Lines 124-127: exact condition implemented |
| NORM-06 | 03-01-PLAN.md | Gap-analyse: hoeveel deelgebieden nog ontbreken t.o.v. norm | ✓ SATISFIED | gaps object fully populated per traject; rendered in detail view of app.js |

**Orphaned requirements:** None — all 6 NORM-xx requirements are claimed by 03-01-PLAN.md.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `utils/prognosis.js` | 260-261 | `console.group` / `console.log` statements in debugPrognose | INFO | These are intentional debug helpers (window.debugPrognose), not unintentional stubs. No impact on production functionality. |
| `utils/prognosis.js` | 305 | `console.log('[prognosis.js] Doorstroomnorm engine geladen...')` | INFO | Load confirmation log — benign. |

No blockers or stubs found in the calculation engine itself. The NORM-01 gap is architectural (missing feature), not a code anti-pattern.

**Note on PLAN label mismatch:** The PLAN frontmatter must-haves refer to labels `'positief'` and `'versneld'` which do not exist at runtime. The implementation uses `'sbl'`/`'bj2'` and `'versneld_sbc'` respectively. The app.js rendering code is consistent with the actual labels — this is a documentation inaccuracy in the PLAN, not a runtime bug.

---

## Human Verification Required

### 1. Prognoseberekening vs. handmatige telling voor 19 leerlingen

**Test:** Importeer alle 19 CSD2A PDFs. Open elk leerlingdossier in de detailweergave. Vergelijk de getoonde prognose (label, totaal >=V, leerlijnen-telling) met een handmatige telling van de deelgebiedscores in de PDF.
**Expected:** Label, totaalVoldoendeOfHoger, totaalOnvoldoende en per-leerlijn scores komen exact overeen met handmatige berekening voor alle 19 leerlingen.
**Why human:** ROADMAP Success Criterion #7 vereist verificatie tegen echte leerlingdata. De berekening is correct geimplementeerd maar of de PDF-parser de scores correct aanlevert (deelgebiedScores object) kan alleen met echte PDFs worden bevestigd.

---

## Gaps Summary

**1 blocker gap — NORM-01: Geen leerlijn-mapping UI**

NORM-01 (REQUIREMENTS.md) en ROADMAP Success Criterion #1 vereisen dat de mentor deelgebieden kan toewijzen aan leerlijnen via een UI. Dit is niet geimplementeerd. De leerlijn-groepering is permanent hardcoded in `utils/schema.js` via het `group` veld op elk DEELGEBIED-object.

De berekening zelf werkt correct met de hardcoded mapping — NORM-02 t/m NORM-06 zijn allemaal aantoonbaar geimplementeerd. Maar de gebruikerseis van configureerbare toewijzing (NORM-01) ontbreekt volledig.

**Optionele noot voor planner:** Het is verdedigbaar dat de huidige mapping correct is voor de doelgroep (B02-definitief.xlsx v1.0 groeperingen) en dat een mentor-UI voor herindeling niet strikt noodzakelijk is voor de phase-3 doelstelling. Als de vaste mapping volstaat, kan NORM-01 worden herbeoordeeld als "not applicable for this implementation" in overleg met de stakeholder. Als echter de requirement letterlijk van kracht blijft, is een configuratiepaneel nodig.

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
