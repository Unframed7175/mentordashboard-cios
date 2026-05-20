---
phase: 24-onboarding-wizard
plan: 03
status: complete
completed_at: "2026-05-20T00:00:00.000Z"
commit: 4767da1
gap_closure: true
---

# Plan 24-03 Summary — Gap Closure (REVIEWS.md → ONB-06 + 3 fixes)

## What was done

Closed all four consensus gaps identified by the Gemini + Codex cross-AI review (24-REVIEWS.md):

### GAP 1 — ONB-06 Settings Step (HIGH)
- Expanded wizard from 5 to 6 steps
- New **Step 5** shows two `number` inputs for verzuim drempelwaarden (geoorloofd / ongeoorloofd, in hours)
- `useEffect` loads saved values via `loadVerzuimDrempels()` on mount
- **Overslaan** skips without saving (defaults remain); **Opslaan & Volgende →** calls `saveVerzuimDrempels()` then advances
- Step 6 becomes the 🎉 completion screen

### GAP 2 — Ghost-class trap (MEDIUM)
- **App.tsx lazy init** replaced:
  ```tsx
  // Before (could skip wizard if class exists but has no students):
  Object.keys(klassenState.klassen).length === 0 ? 'onboarding' : 'import'
  // After:
  Object.values(klassenState.klassen).some((k: any) => k.students?.length > 0) ? 'import' : 'onboarding'
  ```

### GAP 3 — `klasId!` non-null assertion (MEDIUM)
- "Naar het dashboard" button now has an explicit null guard:
  ```tsx
  if (!klasId) { setStepErr('Interne fout: klas ID ontbreekt. Herstart de wizard.'); return; }
  onComplete(klasId);
  ```

### GAP 4 — No abort/dismiss flow (HIGH per Codex)
- **Afbreken** button added, visible on steps 2–5 (not step 1, not step 6)
- Calls `onComplete(klasId)` if `klasId` already set (class was created), otherwise `onAbort?.()`)
- `App.tsx` passes `onAbort={() => setView('import')}` to the wizard

## Files changed

| File | Change |
|------|--------|
| `src/components/OnboardingWizard.tsx` | +107 lines: 6-step wizard, settings form, handleSaveDrempels, Afbreken, klasId guard |
| `src/App.tsx` | 2 edits: students-check lazy init + onAbort prop |

## Verification results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` (OnboardingWizard errors) | ✅ 0 errors |
| `loadVerzuimDrempels` hits ≥ 2 | ✅ 2 |
| `saveVerzuimDrempels` hits ≥ 1 | ✅ 2 |
| `step === 6` hits ≥ 1 | ✅ 2 |
| `Afbreken` hits ≥ 1 | ✅ 1 |
| `onAbort` hits ≥ 2 (wizard) | ✅ 3 |
| `if (!klasId)` hits ≥ 1 | ✅ 1 |
| `van 6` hits = 1 | ✅ 1 |
| `students?.length` in App.tsx | ✅ 1 |
| Old `Object.keys(klassenState.klassen).length` removed | ✅ 0 hits |
| `onAbort` in App.tsx | ✅ 1 |
| `npx vitest run` | ✅ 132 passed, 0 failed |

## Commit

```
4767da1 feat(24-03): ONB-06 settings step, ghost-class fix, klasId guard, abort flow (GAP 1-4)
```
