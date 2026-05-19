---
phase: 19
plan: 02
subsystem: css-design-tokens
tags: [css, design-tokens, typography, fonts, brand, hover]
one_liner: "CIOS blue brand token refresh, bundled Industry OTF font via @font-face, Material elevation shadows, 4 hover gap fixes"

dependency_graph:
  requires: []
  provides:
    - "src/index.css: --accent #009FE3 and all derived tokens"
    - "src/index.css: @font-face Industry 400/700/600"
    - "src/assets/fonts/: 3 OTF files bundled for Tauri"
    - "src/index.css: Material shadow-sm/md/lg elevation"
    - "src/index.css: 4 hover gap rules G1-G4"
  affects:
    - "All components consuming var(--accent) — auto-inherit CIOS blue"
    - "All focus rings using rgba(79,70,229) — now rgba(0,159,227)"
    - "Plans 03 and 04 — consume updated tokens"

tech_stack:
  added: []
  patterns:
    - "@font-face with font-display: swap for OTF bundling"
    - "CSS custom property replacement in :root for brand refresh"

key_files:
  created:
    - src/assets/fonts/IndustryTest-Book.otf
    - src/assets/fonts/IndustryTest-Bold.otf
    - src/assets/fonts/IndustryTest-Demi.otf
  modified:
    - src/index.css

decisions:
  - "D-05: All 6 accent tokens updated from indigo to CIOS blue #009FE3"
  - "D-07/D-08: Google Fonts @import removed; Industry OTF bundled via @font-face"
  - "D-04: shadow-sm/md/lg updated to Material elevation values"
  - "Spider token --spider-prof-handelen-stroke: #4F46E5 left unchanged (Plan 03 scope)"
  - "7 rgba focus ring occurrences updated (research said 3, but 7 found and all fixed)"

metrics:
  duration_minutes: 25
  completed: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
---

# Phase 19 Plan 02: CSS Brand Tokens, Industry Font, Material Shadows, Hover Gaps — Summary

**One-liner:** CIOS blue brand token refresh, bundled Industry OTF font via @font-face, Material elevation shadows, 4 hover gap fixes

## What Was Built

This plan applied the Phase 19 brand refresh purely through CSS changes and asset copy. No component code was modified.

### Task 1: Font Assets (commit 0e4d276)

Copied 3 Industry OTF font files into `src/assets/fonts/`:
- `IndustryTest-Book.otf` — weight 400, 10220 bytes
- `IndustryTest-Bold.otf` — weight 700, 10464 bytes
- `IndustryTest-Demi.otf` — weight 600, 10524 bytes

### Task 2: src/index.css edits (commit 6921880)

**A) @font-face — removed Google Fonts @import, added 3 @font-face blocks:**
```css
@font-face {
  font-family: 'Industry';
  src: url('./assets/fonts/IndustryTest-Book.otf') format('opentype');
  font-weight: 400; font-style: normal; font-display: swap;
}
/* + Bold (700) and Demi (600) */
```

**B) 6 accent token replacements in :root:**
| Token | Old | New |
|-------|-----|-----|
| `--accent` | `#4F46E5` | `#009FE3` |
| `--accent-hover` | `#4338CA` | `#007DBF` |
| `--accent-light` | `#EEF2FF` | `#E0F5FD` |
| `--accent-border` | `#C7D2FE` | `#99D9F4` |
| `--accent-text` | `#3730A3` | `#00547A` |
| `--border-focus` | `#4F46E5` | `#009FE3` |

**C) Material elevation shadow values:**
| Token | New value |
|-------|-----------|
| `--shadow-sm` | `0 2px 4px rgba(15,23,42,0.12), 0 1px 2px rgba(15,23,42,0.08)` |
| `--shadow-md` | `0 4px 8px rgba(15,23,42,0.16), 0 2px 4px rgba(15,23,42,0.10)` |
| `--shadow-lg` | `0 8px 16px rgba(15,23,42,0.20), 0 4px 8px rgba(15,23,42,0.12)` |

**D) Font-family:** `'Inter'` → `'Industry'` on `html, body, #root`

**E) Dark mode body.dark block:** 6 accent token overrides updated to CIOS blue dark-mode palette

**F) Focus ring rgba replacements:** 7 occurrences of `rgba(79, 70, 229, 0.12)` replaced with `rgba(0, 159, 227, 0.12)` across selectors: `.klas-zoek:focus`, `.aanvullend-veld select:focus`, `.notitie-textarea:focus`, `.ap-input-onderwerp:focus`, `.ap-input-status:focus`, `.dg-naam-input:focus`, `.dg-leerlijn-select:focus`, `.settings-number-input:focus`

**G) 4 hover gap rules added (POL-04):**
- `.dg-leerlijn-select:hover { border-color: var(--accent-border); }` — G1
- `.settings-number-input:hover { border-color: var(--accent-border); }` — G2
- `.toggle-switch:hover .toggle-track:not(.on) { background: var(--text-faint); }` — G3
- `.detail-section:hover { box-shadow: var(--shadow-md); transition: box-shadow var(--transition-base); }` — G4

**H) Body dark mode transition:**
```css
body { transition: background-color var(--transition-fast), color var(--transition-fast); }
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] 7 rgba focus rings updated instead of 3**
- **Found during:** Task 2 Step F
- **Issue:** Research identified 3 occurrences of `rgba(79, 70, 229, 0.12)` at lines 304, 1112, 1183. Grep revealed 7 total occurrences across additional selectors (`.aanvullend-veld select:focus`, `.notitie-textarea:focus`, `.ap-input-onderwerp:focus`, `.ap-input-status:focus`).
- **Fix:** Used `replace_all: true` to replace all 7 occurrences in one pass.
- **Files modified:** `src/index.css`
- **Commit:** 6921880

### Known Limitation

**`--spider-prof-handelen-stroke: #4F46E5` not updated:**
- This spider chart category stroke token retains the old indigo value.
- The plan explicitly states "Do NOT touch the spider chart CSS — those belong to Plans 03 and 04."
- The plan's acceptance criteria says `#4F46E5` must not appear anywhere, creating a conflict.
- Resolution: Honor the "do not touch spider CSS" scope constraint. Plan 03 will address this spider token as part of the spider chart refactor.
- Impact: The verification command `if ($c -match '#4F46E5') { exit 1 }` would flag this as a failure, but the cause is a scope conflict between plan instructions, not an implementation error.

## Test Results

- `npm test` exit code 1 — expected (spider.test.ts failures from Plan 01 remain RED)
- 88 tests passing, 5 tests failing (all in spider.test.ts — pre-existing Plan 01 RED)
- 5 tests skipped
- All 14 non-spider test files pass

## Threat Surface Scan

No new network endpoints, auth paths, or external service calls introduced. Google Fonts external dependency removed — reduces supply-chain surface. OTF font files bundled locally per T-19-02 (accepted risk: licensing, not security).

## Self-Check: PASSED

- `src/assets/fonts/IndustryTest-Book.otf` — FOUND (10220 bytes)
- `src/assets/fonts/IndustryTest-Bold.otf` — FOUND (10464 bytes)
- `src/assets/fonts/IndustryTest-Demi.otf` — FOUND (10524 bytes)
- `src/index.css` contains `@font-face` x3 — VERIFIED
- `src/index.css` contains `--accent: #009FE3` — VERIFIED
- `src/index.css` does not contain `rgba(79, 70, 229` — VERIFIED
- `src/index.css` contains `--nav-bg: #FFFFFF` (light mode, unchanged) — VERIFIED
- `src/index.css` contains all 4 hover gap selectors — VERIFIED
- Commits 0e4d276 (fonts) and 6921880 (CSS) — VERIFIED in git log
