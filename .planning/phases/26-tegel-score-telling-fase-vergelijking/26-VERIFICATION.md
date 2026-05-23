---
phase: 26-tegel-score-telling-fase-vergelijking
verified: 2026-05-23T15:00:00Z
status: human_needed
score: 11/11 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open the app in a browser and navigate to a klas met meerdere leerlingen. Verifieer dat elke niet-grijze tegel '{v}/{total} ≥V · {o} O' toont onder het status-badge."
    expected: "Score-telling row visible below the status badge on every non-grijs tile, showing actual computed numbers."
    why_human: "React rendering and actual prognose data values cannot be verified without a running browser instance."
  - test: "Importeer twee exportbestanden van dezelfde leerling voor twee verschillende periodes. Controleer of een tegel een pijl omhoog of omlaag toont afhankelijk van de richting van de RAG-verandering."
    expected: "A green upward CSS triangle appears when fase2 rank > fase1 rank; a red downward triangle when fase2 rank < fase1 rank; no arrow when rank is equal."
    why_human: "Requires actual multi-fase student data imported into the app and visual inspection of the triangle rendering."
  - test: "Verifieer dat een leerling met status grijs (geen scores) geen score-telling row in de tegel toont."
    expected: "No score-telling div visible in the DOM for grijs tiles — confirmed in browser DevTools."
    why_human: "DOM visibility for conditional rendering requires browser inspection; cannot be fully verified via static code grep alone."
  - test: "Controleer dat de CSS border-trick pijl visueel uitlijnt met de 12px Industry tekst naast hem."
    expected: "The triangle sits vertically centered next to the score text — no optical high/low misalignment."
    why_human: "Visual alignment of CSS border-trick triangles depends on font rendering and can only be verified in a live browser."
---

# Phase 26: Tegel Score-telling & Fase-vergelijking Verification Report

**Phase Goal:** Elke leerlingtegel in het klasoverzicht toont hoeveel deelgebieden voldoende/onvoldoende zijn, en een pijl geeft de trend t.o.v. fase 1 aan — alleen als beide fases aanwezig zijn
**Verified:** 2026-05-23T15:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Score-telling row renders inside the tile for students with a non-grijs status | VERIFIED | `LeerlingTegel.tsx` line 44: `if (status.kleur !== 'grijs')` guards the scoreTelling assignment; lines 55-67 assign a `<div className="score-telling">` JSX node; line 90 renders `{scoreTelling}` in JSX. |
| 2  | Score-telling is completely absent from DOM when status.kleur === 'grijs' | VERIFIED | `scoreTelling` is initialized to `null` (line 43) and only overwritten inside `if (status.kleur !== 'grijs')`. When kleur is grijs, `{scoreTelling}` in JSX evaluates to `null` — no DOM node emitted. |
| 3  | Tile layout order is: naam → badge → score-telling → verzuim bar | VERIFIED | `LeerlingTegel.tsx` return JSX (lines 88-92): `span.klas-tile-naam`, `span.status-badge`, `{scoreTelling}`, `{miniBar}` — exact order matches spec. |
| 4  | LeerlingTegel accepts optional trend prop without breaking existing renders | VERIFIED | `LeerlingTegelProps` interface line 14: `trend?: 'op' | 'neer' | null;` — optional prop, existing consumers without trend prop remain valid TypeScript. |
| 5  | CSS classes .score-telling, .trend-pijl, .trend-op, .trend-neer exist in index.css | VERIFIED | `src/index.css` lines 506, 517, 525, 531 — all four classes present after the `.mvb-*` block under the Phase 26 comment header. |
| 6  | KlasOverzicht computes trendMap via useMemo using getAllRecordsForStudent + berekenStatus + STATUS_VOLGORDE | VERIFIED | `KlasOverzicht.tsx` lines 41-78: `trendMap` useMemo calls `getAllRecordsForStudent(s.leerlingId)`, `berekenStatus(records[0])`, `berekenStatus(records[last])`, and `STATUS_VOLGORDE[...]` rank comparison. |
| 7  | Trend is 'op' when rank(fase2) > rank(fase1) and neither fase is grijs | VERIFIED | `KlasOverzicht.tsx` line 64: `if (rank2 > rank1) return 'op';` — preceded by grijs guard at line 59. |
| 8  | Trend is 'neer' when rank(fase2) < rank(fase1) and neither fase is grijs | VERIFIED | `KlasOverzicht.tsx` line 65: `if (rank2 < rank1) return 'neer';` — same grijs guard applies. |
| 9  | Trend is null when fewer than 2 records, same rank, or either fase is grijs | VERIFIED | Step A (line 48): `records.length < 2 → null`; line 66: equal rank → `return null`; line 59: grijs guard → `null`. |
| 10 | Trend is null when records[0].periode equals records[last].periode (duplicate import guard) | VERIFIED | `KlasOverzicht.tsx` line 52: `if (records[0].periode === records[records.length - 1].periode) return null;` — guard fires before berekenStatus is called. |
| 11 | Every LeerlingTegel receives trend={trendMap.get(s.leerlingId) ?? null} | VERIFIED | `KlasOverzicht.tsx` line 231: `trend={trendMap.get(s.leerlingId) ?? null}` inside the `sorted.map` render block. |

**Score:** 11/11 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/LeerlingTegel.tsx` | score-telling render + trend prop interface | VERIFIED | `trend?: 'op' | 'neer' | null` at line 14; scoreTelling null-node block lines 43-68; `{scoreTelling}` in JSX at line 90. |
| `src/index.css` | CSS classes for score-telling row and trend arrows | VERIFIED | `.score-telling` (line 506), `.trend-pijl` (517), `.trend-op` (525), `.trend-neer` (531) — all using CSS custom properties, no hardcoded hex. |
| `src/components/KlasOverzicht.tsx` | trendMap useMemo computation + trend prop wiring | VERIFIED | trendMap useMemo at lines 41-78; `getAllRecordsForStudent` imported at line 8; trend prop at line 231. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/LeerlingTegel.tsx` | `src/index.css` | `className="score-telling"` | VERIFIED | Line 56: `<div className="score-telling" ...>`. Lines 58, 61: `className="trend-pijl trend-op"` and `trend-pijl trend-neer"`. |
| `src/components/KlasOverzicht.tsx` | `utils/klassen.ts` | `getAllRecordsForStudent` import | VERIFIED | Line 8: `import { getActiveStudents, getAllRecordsForStudent, klassenState, deleteKlas } from '../../utils/klassen';` — used at line 70. |
| `src/components/KlasOverzicht.tsx` | `src/components/LeerlingTegel.tsx` | `trend` prop | VERIFIED | Line 231: `trend={trendMap.get(s.leerlingId) ?? null}` on every `LeerlingTegel` in `sorted.map`. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `LeerlingTegel.tsx` | `scoreTelling` (v, o, totaalDeelgebieden) | `status.prognose.totaalVoldoendeOfHoger` + `totaalOnvoldoende` from `berekenStatus()` | Yes — derived from actual student score records via `berekenStatus` | FLOWING |
| `LeerlingTegel.tsx` | `trend` prop | `trendMap.get(s.leerlingId)` in KlasOverzicht | Yes — computed from `getAllRecordsForStudent` + `berekenStatus` rank comparison | FLOWING |
| `KlasOverzicht.tsx` | `trendMap` | `getAllRecordsForStudent(s.leerlingId)` iterating real student records | Yes — reads from klassen store keyed on `refreshKey` | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| CSS classes exist in index.css | `grep -c "score-telling" src/index.css` | 4 matches | PASS |
| trend prop in LeerlingTegel interface | `grep -c "trend?: " src/components/LeerlingTegel.tsx` | 1 match (line 14) | PASS |
| getAllRecordsForStudent used in KlasOverzicht | `grep -c "getAllRecordsForStudent" src/components/KlasOverzicht.tsx` | 2 matches (import + useMemo) | PASS |
| trendMap referenced 3+ times in KlasOverzicht | `grep -c "trendMap" src/components/KlasOverzicht.tsx` | 3 matches (declaration, set, prop) | PASS |
| trend prop wired to LeerlingTegel | `grep "trend=" src/components/KlasOverzicht.tsx` | `trend={trendMap.get(s.leerlingId) ?? null}` | PASS |
| CSS uses CSS custom properties, not hardcoded hex | `grep -n "var(--rag-groen)\|var(--rag-rood)"` in Phase 26 block | Lines 528, 534 — CSS vars used | PASS |
| grijs guard in trendMap computation | `grep -n "grijs" src/components/KlasOverzicht.tsx` | Line 59: `if (fase1Status.kleur === 'grijs' || fase2Status.kleur === 'grijs') return null;` | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TEGEL-01 | Plan 01 | De leerling-tegel toont het aantal deelgebieden ≥V en het aantal O onder de status-badge | SATISFIED | `LeerlingTegel.tsx` lines 55-67: score-telling div with `{v}/{totaalDeelgebieden} ≥V · {o} O` rendered below the badge when not grijs. |
| TEGEL-02 | Plan 01 | De score-telling wordt verborgen als een leerling geen scores heeft (grijs / Onbekend tegel) | SATISFIED | `LeerlingTegel.tsx` line 44: `if (status.kleur !== 'grijs')` — scoreTelling remains null for grijs; `{scoreTelling}` in JSX produces no DOM node. |
| TREND-01 | Plan 02 | De tegel toont een pijl omhoog als de prognose verbeterd is t.o.v. fase 1 | SATISFIED | `KlasOverzicht.tsx` line 64: `rank2 > rank1 → 'op'`; `LeerlingTegel.tsx` line 57-59: renders `<span className="trend-pijl trend-op">` when trend==='op'. |
| TREND-02 | Plan 02 | De tegel toont een pijl omlaag als de prognose verslechterd is t.o.v. fase 1 | SATISFIED | `KlasOverzicht.tsx` line 65: `rank2 < rank1 → 'neer'`; `LeerlingTegel.tsx` line 60-62: renders `<span className="trend-pijl trend-neer">` when trend==='neer'. |
| TREND-03 | Plan 02 | De pijl wordt alleen getoond als zowel fase 1 als fase 2 aanwezig zijn | SATISFIED | `KlasOverzicht.tsx` line 48: `records.length < 2 → null` (length guard ensures two records required); line 52: distinct-period guard prevents duplicate-periode false positive. |
| TREND-04 | Plan 02 | Als de prognose gelijk is gebleven, wordt geen pijl getoond | SATISFIED | `KlasOverzicht.tsx` line 66: `return null` when rank2 === rank1; `LeerlingTegel.tsx` trend=null → neither trend-op nor trend-neer span emitted. |

All 6 requirements (TEGEL-01, TEGEL-02, TREND-01, TREND-02, TREND-03, TREND-04) satisfied in code.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/LeerlingTegel.tsx` | 64 | `{'≥'}V{' · '}{o}` — JSX escape style for special characters | Info | Not a stub. Special-character rendering technique matches plan spec (U+2265, U+00B7). No impact on correctness. |

No TBD, FIXME, XXX, or TODO markers found in modified files. No hardcoded empty data patterns that flow to rendering. No stub returns.

---

### Human Verification Required

#### 1. Score-telling row visible in running app

**Test:** Open the app in a browser with a klas containing at least one leerling with scores. Inspect a non-grijs tile.
**Expected:** The tile shows the score-telling row below the status badge with real numbers, e.g. "14/19 ≥V · 1 O".
**Why human:** React rendering of conditional JSX with live prognose data requires a running browser instance.

#### 2. Trend pijl renders for a multi-fase leerling

**Test:** Import two separate period exports for the same student (different `periode` values). Observe the tile.
**Expected:** If the RAG status improved (e.g. rood → oranje), a green upward CSS triangle appears left of the score text. If worsened, a red downward triangle. If unchanged, no triangle.
**Why human:** Requires actual multi-fase data import and visual inspection of the CSS border-trick triangle rendering.

#### 3. Grijs tile shows no score-telling row

**Test:** Confirm at least one student with no scores (grijs tile) in the klas overzicht.
**Expected:** The grijs tile has no score-telling div visible. Browser DevTools confirms the element is absent from DOM (not merely hidden by CSS).
**Why human:** DOM presence/absence for null-guarded JSX requires browser DevTools inspection to distinguish null-not-rendered from CSS display:none.

#### 4. CSS border-trick triangle vertical alignment

**Test:** Observe a tile with a trend arrow next to the 12px score text.
**Expected:** The triangle aligns vertically centered with the score text — no optical high or low misalignment.
**Why human:** Font rendering and line-height interactions affect visual alignment of CSS border-trick triangles and can only be judged in a live browser.

---

### Gaps Summary

No gaps found. All 11 must-have truths are verified in the codebase. All 6 requirement IDs (TEGEL-01, TEGEL-02, TREND-01, TREND-02, TREND-03, TREND-04) have implementation evidence. The four human verification items are visual/behavioral checks that cannot be confirmed by static code analysis.

---

_Verified: 2026-05-23T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
