---
plan: 24-02
phase: 24-onboarding-wizard
status: complete
completed: "2026-05-20"
commit: 49135bc
---

# Plan 24-02 Summary — App.tsx Wiring + Tests + Commit

## What was done

Wired `OnboardingWizard` into `src/App.tsx` with four targeted edits. Ran full test suite (green). Committed.

## Edits applied to src/App.tsx

1. **Import** — `import OnboardingWizard from './components/OnboardingWizard';` after SettingsPage import
2. **View union + lazy init** — extended union to include `'onboarding'`; lazy initializer: `Object.keys(klassenState.klassen).length === 0 ? 'onboarding' : 'import'`
3. **handleOnboardingComplete** — `switchActiveKlas(klasId)` → `setRefreshKey(k+1)` → `setView('klas')`
4. **JSX mount** — `{view === 'onboarding' && <OnboardingWizard onComplete={handleOnboardingComplete} />}` before closing `</>`

## Test results

132 passed · 5 skipped — no regressions

## Deviations

None.

## Requirements fulfilled

ONB-01 (first-run detection), ONB-07 (wizard completion → klas view), ONB-08 (returning mentor skips wizard)
