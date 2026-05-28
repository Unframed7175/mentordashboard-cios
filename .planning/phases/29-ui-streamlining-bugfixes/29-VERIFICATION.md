---
phase: 29-ui-streamlining-bugfixes
verified: 2026-05-28T08:25:00Z
status: human_needed
score: 16/16 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open the Tauri app and navigate to the klasoverzicht — verify the diagonal nav gradient stripe renders correctly in the top-right corner of the nav bar"
    expected: "A blue gradient stripe (#009FE3) appears at the top-right of the nav bar, blending from full colour at the corner to transparent"
    why_human: "WebView2-specific CSS rendering of the gradient cannot be verified programmatically; this was the original FIX-01 bug"
  - test: "Toggle dark mode and inspect DetailWeergave sections — verify all colour tokens resolve correctly (no white patches, no illegible text on coloured chips)"
    expected: "All section headers, criterion-row chips, status chips, and progress bar segments are legible in dark mode"
    why_human: "CSS variable resolution to computed colours in dark mode cannot be verified without a browser render; jsdom does not resolve var() to RGB"
  - test: "Open a BJ2 student detail view and verify the DoortstroomPrognoseSection renders SBL, SBC, and Negatief blocks with headers and criterion rows"
    expected: "Three blocks visible, each with a coloured left accent border, a block-name heading, an overall status chip, and criterion rows showing score / threshold"
    why_human: "Block layout is a visual structure that depends on real student data flowing through status.prognose; automated tests verify class presence but not rendered layout quality"
  - test: "Open a BJ1 student detail view and verify BJ2 doorstroom, Versneld SBC, and Negatief blocks render correctly"
    expected: "Three blocks visible for a BJ1 student, each with the correct block name and criterion rows"
    why_human: "BJ1 path requires real student data; visual confirmation needed"
  - test: "Open a student with no scores (grijs tegel) and verify 'Nog geen scores beschikbaar' appears inside each prognose block body, while block headers still render"
    expected: "Block headers visible, body shows the empty-state message in muted text"
    why_human: "Requires a student record with zero voldoendeOfHoger and zero onvoldoende scores"
  - test: "Navigate from klasoverzicht to a student detail view and back — verify the .view-fade-in transition fires (opacity 0 to 1 over 150–200ms)"
    expected: "Subtle fade-in transition plays when detail view loads; no jarring jump"
    why_human: "CSS animation playback cannot be verified programmatically; requires visual observation in the running app"
---

# Phase 29: UI Streamlining & Bugfixes — Verification Report

**Phase Goal:** Fix 6 known UI/UX bugs and streamline the detail view — WebView2 nav gradient, BPV infinite loader, dark mode hex violations, section clutter, tile spacing, and doorstroom prognosis display.
**Verified:** 2026-05-28T08:25:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|---------|
| 1  | `#main-nav::after` CSS block deleted from index.css | VERIFIED | `grep "#main-nav::after" src/index.css` returns empty |
| 2  | `.nav-stripe` CSS class exists in index.css with correct geometry and gradient | VERIFIED | Lines 276–285: position absolute, 140x52px, `linear-gradient(to bottom-left, #009FE3...)`, pointer-events none, z-index 0 |
| 3  | KlasTabStrip renders `<div aria-hidden="true" className="nav-stripe" />` inside #main-nav | VERIFIED | `KlasTabStrip.tsx` line 157: exact element present as last child before `</nav>` |
| 4  | BpvProgressSection renders 'BPV-data laden…' while Promise.all is pending | VERIFIED | Line 38 of BpvProgressSection.tsx; `useState<boolean>(true)` initialises loading=true so initial synchronous render always shows loading text |
| 5  | BpvProgressSection renders 'Geen stage-data — importeer de BPV Excel via het importscherm.' when record is null after loading | VERIFIED | Line 48 of BpvProgressSection.tsx; `.finally()` pattern on line 31 sets loading=false after both paths |
| 6  | No hardcoded hex colors remain in BpvProgressSection.tsx | VERIFIED | `grep "#[0-9a-fA-F]" src/components/BpvProgressSection.tsx` returns empty |
| 7  | `.klas-tile` padding is 1.25rem 1.5rem and gap is 0.75rem | VERIFIED | index.css lines 471+476: `padding: 1.25rem 1.5rem` and `gap: 0.75rem` confirmed |
| 8  | `.view-fade-in` animation class exists with viewFadeIn keyframe | VERIFIED | index.css lines 1398–1403: `.view-fade-in` with `animation: viewFadeIn var(--transition-base) ease forwards` + `@keyframes viewFadeIn` with opacity 0→1 + translateY 4px→0 |
| 9  | `.view-fade-in` prefers-reduced-motion override exists | VERIFIED | index.css line 189: `.view-fade-in { animation: none; }` inside reduced-motion media query |
| 10 | DetailWeergave outer wrapper has `view-fade-in` in className | VERIFIED | DetailWeergave.tsx line 59: `className="print-target view-fade-in"` |
| 11 | DetailWeergave no longer imports or renders LeerlijnenSection, VakkenSection, or NotitiesTextarea | VERIFIED | `grep` returns empty for all three import and JSX patterns; only a code comment mentions NotitiesTextarea |
| 12 | `.detail-section-title` uses font-size 0.6875rem and letter-spacing 0.06em | VERIFIED | index.css lines 588+591 confirm corrected spec values (was 0.07em, fixed in plan 02) |
| 13 | DeelgebiedenMatrix, FeedbackActiepuntenSection, AanvullendSection, RekenenNederlandsSection, VerzuimSection, SettingsPage contain no hardcoded hex values in inline styles | VERIFIED | `grep -n "#[0-9a-fA-F]{6}"` across all 6 files returns empty |
| 14 | DetailWeergave print header uses var(--text-secondary) not '#475569' | VERIFIED | `grep "#475569" src/components/DetailWeergave.tsx` returns empty |
| 15 | DoortstroomPrognoseSection renders per-traject block layout (prognose-block class) with getNormenSync and detectTraject | VERIFIED | DoortstroomPrognoseSection.tsx: `prognose-block` at lines 54+118, `getNormenSync` at line 71, `detectTraject` at line 72; `berekenPrognose` appears only in a comment, not imported |
| 16 | 'Nog geen scores beschikbaar' empty state renders per block in DoortstroomPrognoseSection | VERIFIED | Line 60: `Nog geen scores beschikbaar` inside the PrognoseBlock isEmpty branch |

**Score:** 16/16 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `tests/BpvProgressSection.test.tsx` | FIX-02 gate — 3 tests covering loading/empty/data states; min 40 lines | VERIFIED | 101 lines; imports BpvProgressSection; all 3 tests GREEN after plan 03 |
| `tests/DoortstroomPrognoseSection.test.tsx` | PROG-01 gate — 7 tests covering BJ1/BJ2 block rendering; min 60 lines | VERIFIED | 228 lines; imports DoortstroomPrognoseSection; all 7 tests GREEN after plan 05 |
| `src/index.css` | nav-stripe class, tile padding, fade-in animation, typography rules, prognose-block classes | VERIFIED | All 8 targeted CSS additions/corrections confirmed |
| `src/components/BpvProgressSection.tsx` | FIX-02 — loading state + empty state + hex fixes | VERIFIED | loading boolean, .finally(), 3-state render, zero hex |
| `src/components/KlasTabStrip.tsx` | FIX-01 — nav-stripe DOM element with aria-hidden | VERIFIED | Line 157: `<div aria-hidden="true" className="nav-stripe" />` |
| `src/components/DetailWeergave.tsx` | section removal + full-width spider + view-fade-in + hex fix | VERIFIED | All 4 changes confirmed; no removed sections, no #475569, view-fade-in present |
| `src/components/VerzuimSection.tsx` | UI-03 hex fix — var(--rag-groen) replacements | VERIFIED | `grep "#[0-9a-fA-F]{6}"` returns empty |
| `src/components/DeelgebiedenMatrix.tsx` | UI-03 hex fix — 4 replacements | VERIFIED | `grep "#[0-9a-fA-F]{6}"` returns empty |
| `src/components/DoortstroomPrognoseSection.tsx` | PROG-01 — per-traject block layout rewrite | VERIFIED | prognose-block, prognose-criterion-row, getNormenSync, detectTraject, empty state all present; no hex |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/components/KlasTabStrip.tsx` | `src/index.css` | `.nav-stripe` class on DOM element | WIRED | className="nav-stripe" at line 157; .nav-stripe defined in index.css line 276 |
| `src/components/BpvProgressSection.tsx` | `utils/bpv.ts` | `getBpvConfig + getBpvData` via `.finally()` | WIRED | `.finally(() => setLoading(false))` at line 31; loading state gates render |
| `src/components/DetailWeergave.tsx` | `src/index.css` | `.view-fade-in` class | WIRED | className includes "view-fade-in" at line 59; keyframe defined in index.css line 1400 |
| `src/components/DoortstroomPrognoseSection.tsx` | `utils/normen.ts` | `getNormenSync()` | WIRED | Import at line 3; called at line 71 |
| `src/components/DoortstroomPrognoseSection.tsx` | `utils/status.ts` | `detectTraject` | WIRED | Import at line 2; called at line 72 |
| `src/components/DoortstroomPrognoseSection.tsx` | `src/index.css` | `.prognose-block` CSS classes | WIRED | className="prognose-block" used in JSX; classes defined in index.css lines 641–675+ |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `BpvProgressSection.tsx` | `bpvConfig`, `record` | `getBpvConfig()`, `getBpvData()` via Promise.all | Yes — reads from bpv utility (store-backed) | FLOWING |
| `DoortstroomPrognoseSection.tsx` | `status.prognose` | Passed as prop from DetailWeergave parent; pre-computed by `berekenPrognose` in status.ts | Yes — prop flows from parent's computed status | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite (204 tests) | `npm test` | 204 passed, 5 skipped (209 total), 0 failed | PASS |
| BpvProgressSection tests (3 GREEN) | `npm test -- --grep BpvProgress` | Covered in full suite — 3 tests pass | PASS |
| DoortstroomPrognoseSection tests (7 GREEN) | `npm test -- --grep DoortstroomPrognose` | Covered in full suite — 7 tests pass | PASS |
| nav-stripe DOM element present | `grep "nav-stripe" src/components/KlasTabStrip.tsx` | Line 157 match | PASS |
| #main-nav::after deleted | `grep "#main-nav::after" src/index.css` | No matches | PASS |
| No hex in 6 component files | `grep -n "#[0-9a-fA-F]{6}" ...6 files...` | No matches | PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| UI-01 | 29-01, 29-02, 29-04, 29-05 | Consistent spacing and typography across all views | SATISFIED | `.detail-section-title` corrected to 0.6875rem / 0.06em in index.css line 588+591 |
| UI-02 | 29-01, 29-02 | Klasoverzicht visually cleaned up — clearer hierarchy, less cluttered tiles | SATISFIED | `.klas-tile` padding 1.25rem 1.5rem, gap 0.75rem in index.css lines 471+476 |
| UI-03 | 29-01, 29-03, 29-04, 29-05 | Dark mode colours refined — no white patches or illegible text | SATISFIED | All 16 hardcoded hex inline-style values replaced with CSS tokens across 6 files; BpvProgressSection hex fixed; DoortstroomPrognoseSection rewritten with zero hex |
| UI-04 | 29-01, 29-02, 29-04, 29-05 | View transitions with subtle CSS transitions | SATISFIED | `.view-fade-in` + `@keyframes viewFadeIn` in index.css; applied to DetailWeergave wrapper; prefers-reduced-motion covered |
| FIX-01 | 29-02, 29-03 | Nav diagonal stripe renders correctly in Tauri WebView2 | SATISFIED (automated) / NEEDS HUMAN (visual) | `#main-nav::after` deleted; `.nav-stripe` class added; DOM element added to KlasTabStrip with aria-hidden; visual rendering in WebView2 needs human check |
| FIX-02 | 29-01, 29-03 | BPV section shows clear distinction between "loading" and "no BPV data imported" | SATISFIED | `loading` boolean state initialised true; `.finally()` clears it; "BPV-data laden…" and "Geen stage-data — importeer de BPV Excel via het importscherm." both present; tests GREEN |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No debt markers (TBD/FIXME/XXX), placeholders, or empty implementations found in modified files |

Note: The `#009FE3` hex literal in `.nav-stripe` gradient (index.css line 282) is intentional per UI-SPEC.md — `var(--accent)` was explicitly rejected for WebView2 gradient predictability. This is not a violation.

Note: `#fff` values in VerzuimSection.tsx (white text labels inside coloured bar segments) were intentionally retained per plan 04 decision — they were not in the UI-03 audit list and provide correct contrast.

### Human Verification Required

#### 1. Nav Stripe WebView2 Rendering (FIX-01 Visual Confirmation)

**Test:** Run `tauri dev` (or the production build), open the klasoverzicht — look at the top-right corner of the navigation bar.
**Expected:** A blue gradient stripe (#009FE3) is visible at the top-right of the nav bar, fading from full colour at the corner to transparent toward the left/bottom. It should not obstruct tab click targets (pointer-events: none).
**Why human:** WebView2-specific CSS rendering of linear-gradient cannot be verified programmatically; this was the root cause of FIX-01.

#### 2. Dark Mode Colour Token Resolution (UI-03 Visual Confirmation)

**Test:** Toggle dark mode (if accessible via keyboard shortcut or settings) and inspect the detail view — check status chips in DoortstroomPrognoseSection, progress bars in BpvProgressSection, and badges in DeelgebiedenMatrix.
**Expected:** All UI elements are legible in dark mode; no white patches on dark backgrounds; no illegible colour combinations. CSS variables should resolve to their dark-mode values defined in `body.dark` overrides.
**Why human:** jsdom does not resolve CSS custom properties to computed colours; visual confirmation in a real browser/WebView2 render is required.

#### 3. DoortstroomPrognoseSection BJ2 Block Layout

**Test:** Open a BJ2 student's detail view and scroll to the Doorstroomprognose section.
**Expected:** Three side-by-side (or wrapped) blocks: SBL, SBC, Negatief. Each block has a coloured left accent border, a block header with block name (uppercase) and overall status chip, and criterion rows showing label / score / threshold / 3-state chip.
**Why human:** Block layout requires real student data flowing through status.prognose; automated tests verify CSS class presence but not rendered visual structure.

#### 4. DoortstroomPrognoseSection BJ1 Block Layout

**Test:** Open a BJ1 student's detail view and scroll to the Doorstroomprognose section.
**Expected:** Three blocks: "BJ2 doorstroom", "Versneld SBC", "Negatief". Versneld SBC shows three criterion rows (lesgeven, organiseren, professioneel handelen).
**Why human:** Requires a real BJ1 student record; BJ1 traject path needs visual confirmation.

#### 5. Empty State (No Scores) in DoortstroomPrognoseSection

**Test:** Open a student with no scores (grijs/grey tegel) and inspect the Doorstroomprognose section.
**Expected:** Each block body shows "Nog geen scores beschikbaar" in muted text; block headers still render with block name (no status chip when empty).
**Why human:** Requires a student record with zero voldoendeOfHoger and zero onvoldoende; cannot be replicated without the real data store.

#### 6. View Fade-In Transition (UI-04 Animation)

**Test:** Navigate from the klasoverzicht to a student detail view and observe the transition.
**Expected:** The detail view fades in from opacity 0 to opacity 1 with a slight upward translateY(4px → 0) motion over approximately 200ms. Users with prefers-reduced-motion OS setting should see no animation.
**Why human:** CSS animation playback requires a running browser/WebView2 render; cannot be verified via grep or test suite.

---

## Gaps Summary

No automated gaps found. All 16 must-have truths are VERIFIED by codebase evidence:

- FIX-01: `#main-nav::after` deleted; `.nav-stripe` CSS class added; DOM element with `aria-hidden="true"` added to KlasTabStrip as last child of `#main-nav`.
- FIX-02: BpvProgressSection has `loading` boolean state (initialised `true`), `.finally()` cleanup, "BPV-data laden…" and "Geen stage-data — importeer de BPV Excel via het importscherm." text literals, zero hex colours; 3 tests GREEN.
- UI-01: `.detail-section-title` corrected to `font-size: 0.6875rem; letter-spacing: 0.06em`.
- UI-02: `.klas-tile` padding `1.25rem 1.5rem`, gap `0.75rem`.
- UI-03: Zero hardcoded hex inline-style values across 7 modified component files.
- UI-04: `.view-fade-in` + `@keyframes viewFadeIn` in index.css; applied to DetailWeergave wrapper; prefers-reduced-motion override present.
- PROG-01: DoortstroomPrognoseSection fully rewritten with `prognose-block` layout; `getNormenSync` + `detectTraject` wired; empty state present; no hex; 7 tests GREEN.
- Full test suite: **204/204 tests pass** (5 skipped, 0 failures).

The 6 human verification items are visual/runtime checks that cannot be confirmed programmatically. No blockers or gaps block the phase goal — all automated evidence confirms the goal is achieved. Human items confirm visual quality in the Tauri WebView2 runtime.

---

_Verified: 2026-05-28T08:25:00Z_
_Verifier: Claude (gsd-verifier)_
