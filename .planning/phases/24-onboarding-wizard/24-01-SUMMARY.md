---
plan: 24-01
phase: 24-onboarding-wizard
status: complete
completed: "2026-05-20"
commit: 49135bc
---

# Plan 24-01 Summary — OnboardingWizard Component + CSS

## What was done

Created `src/components/OnboardingWizard.tsx` — a 5-step guided setup wizard for first-run mentors — and appended wizard CSS classes to `src/index.css`.

## Artifacts produced

- **src/components/OnboardingWizard.tsx** (new) — 270 lines; full 5-step wizard
- **src/index.css** — appended `.onboarding-overlay`, `.onboarding-card`, `.btn-primary-accent` (and `:hover`, `:disabled` variants)

## Step breakdown

| Step | Title | Key behaviour |
|------|-------|---------------|
| 1 | Welkom | klasNaamInput → createKlas() + switchActiveKlas(); Enter key support |
| 2 | PDFs uploaden | multi-file PDF dropzone; Volgende disabled until pdfsUploaded > 0 (ONB-03) |
| 3 | Verzuim Excel | single-file .xls/.xlsx dropzone; Overslaan available (ONB-04) |
| 4 | Stage Excel (BPV) | single-file .xls/.xlsx dropzone; Overslaan available (ONB-05) |
| 5 | Klaar | 🎉 confirmation + "Naar het dashboard →" → onComplete(klasId) (ONB-06) |

## CSS variables used (confirmed present in both themes)
- `--border-default`, `--accent-hover`, `--shadow-md`, `--accent`, `--bg-page`, `--bg-surface`, `--text-muted`, `--status-rood-text`

## Deviations

None.

## Requirements fulfilled

ONB-01 (first-run detection wired in Plan 24-02), ONB-02 (class name input), ONB-03 (PDF required for Volgende), ONB-04 (Verzuim Overslaan), ONB-05 (BPV Overslaan), ONB-06 (completion callback)
