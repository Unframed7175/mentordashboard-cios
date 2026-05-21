---
phase: 25
reviewers: [gemini, codex]
reviewed_at: 2026-05-21T00:00:00Z
plans_reviewed: [25-01-PLAN.md, 25-02-PLAN.md, 25-03-PLAN.md]
---

# Cross-AI Plan Review — Phase 25: Doorstroomnorm Configuratie

---

## Gemini Review

This review covers the implementation plans for **Phase 25: Doorstroomnorm Configuratie**.

### Summary
The implementation plans for Phase 25 are exceptionally well-structured, technically sound, and demonstrate a deep alignment with the project's established architectural patterns. By employing a strict TDD workflow (Wave 1), followed by a robust utility refactor (Wave 2), and concluding with a detailed UI integration (Wave 3), the plans ensure that the transition from hardcoded thresholds to a configurable system is both safe and verifiable. The reuse of existing patterns—such as the `LazyStore` sync cache and the `refreshKey` invalidation—minimizes technical debt and ensures consistency across the application.

### Strengths
- **Strong TDD Foundation:** Plan 01 establishes a "RED" gate that pins the API contract for both persistence and domain logic before a single line of production code is written.
- **Meticulous Pattern Replication:** The use of `utils/verzuimDrempels.ts` as a template for `utils/normen.ts` ensures that the "instant-apply" and "store-save pairing" patterns (critical for Tauri reliability) are preserved.
- **Attention to "Gap" Logic:** The plans specifically identify and address the risk of hardcoded numbers within the `gaps` object in `berekenPrognose()`. This prevents the common bug where the status color is correct but the "required points" math is wrong.
- **Clean Re-render Strategy:** Reusing `refreshKey` in `App.tsx` for re-calculating the `KlasOverzicht` is an efficient use of existing infrastructure, avoiding the need for new, complex state synchronization libraries.
- **UX/UI Fidelity:** Plan 03 includes specific interaction details (blur/Enter triggers, Math.round, clamping, and the `SBC < SBL` warning) that align perfectly with the provided UI-SPEC and CONTEXT.

### Concerns
- **Logic Refactor Surface Area (MEDIUM):** `utils/prognosis.ts` contains many sites where thresholds are used. Missing even one literal replacement (especially in the `gaps` calculation) will cause logic divergence.
  - *Mitigation:* Plan 02 includes a comprehensive replacement table and an automated grep task to verify no literal thresholds remain.
- **Race Conditions in Settings (LOW):** There is a minor risk that rapid-fire blurring of multiple inputs in `SettingsPage` could lead to race conditions when updating the store.
  - *Mitigation:* The "instant-apply" cache update in `utils/normen.ts` and the synchronous nature of the React state updates in the handlers significantly reduce this risk for standard user input speeds.
- **Type Guard Overhead (LOW):** The `loadNormen` validation guard is extensive (checking all 8 fields). If the store grows, this manual checking becomes brittle.
  - *Mitigation:* For the current scope of 8 fields, this is manageable and provides essential protection against `store.json` corruption.

### Suggestions
- **Field-Level Error Logging:** In `utils/normen.ts`, if the type guard fails, log which specific field was invalid. This will make it much easier to diagnose issues if a user manually edits their `store.json`.
- **Strict Grep Verification:** When running the grep verification in Plan 02, ensure you exclude legitimate uses of the numbers 13 or 15 (e.g., in array indices or unrelated constants) to avoid "grep fatigue" while still catching threshold leaks.
- **Unit Tests for Gaps:** Ensure the new tests in `tests/prognosis.test.ts` explicitly assert the values of `result.gaps.*` fields, not just the `result.label`, to confirm the parameterisation of the gap arithmetic.

### Risk Assessment
**Risk Level: LOW**

The risk is categorized as Low because the implementation relies entirely on proven, existing patterns within the codebase. The logic refactor is the most sensitive part, but it is well-covered by the proposed TDD strategy and the explicit "Pitfall 1" mitigation. The UI changes are additive and follow established styling conventions, making regressions in unrelated areas unlikely.

---

## Codex Review

### Plan 01 Review

#### Summary
Plan 01 is strong on contract-first TDD: it pins the `utils/normen.ts` API, exercises the sync-cache pattern already used elsewhere, and correctly tries to verify that configurable thresholds affect both labels and `gaps`. The main weakness is that its RED-state strategy is internally inconsistent in `tests/prognosis.test.ts`: the proposed top-level import from a non-existent module will break the whole file, so the plan as written cannot simultaneously keep existing prognosis tests passing and add seven isolated RED tests.

#### Strengths
- Reuses proven project patterns instead of inventing a new persistence/test style.
- Defines the `Normen` contract explicitly before implementation.
- Covers the important cache behaviors: cold default, round-trip persistence, sync accessor, instant-apply, reset.
- Correctly treats `gaps` as part of the contract, not just the top-level label.
- Keeps implementation work out of the test plan.

#### Concerns
- `[HIGH]` `tests/prognosis.test.ts` will fail at module-load time if you add a top-level `import { DEFAULT_NORMEN } from '../utils/normen'` before `utils/normen.ts` exists. That means existing tests in the file will not continue to pass, and Vitest may not even execute the new seven tests individually.
- `[HIGH]` The SBC test is underspecified unless the fixture explicitly satisfies `KERN_SBC`. Lowering `sbc` to `10` is not enough if any of `V&A`, `P&O`, `C&B`, `1E&B` is still below `voldoende`.
- `[MEDIUM]` The negatief-per-leerlijn test is fragile if it relies on "first 3 keys" style fixtures. Whether three insufficients land in the same leerlijn depends on schema/mapping, not array order.
- `[MEDIUM]` Several label assertions are too loose. "Positive label, not rood" can still pass on the wrong label (`neutraal` instead of `sbl`/`sbc`/`naar_bj2`).
- `[LOW]` The acceptance criteria for "all 5 tests FAIL with module-not-found" are fine for `tests/normen.test.ts`, but not fine for the additive prognosis tests inside an existing green file.

#### Suggestions
- Split the new prognosis coverage into a separate file such as `tests/prognosis.normen.test.ts` or use dynamic imports inside each new test so existing prognosis tests remain green.
- Make the SBC fixture explicit: set exactly 10 `voldoende` scores and ensure all `KERN_SBC` labels are `voldoende`.
- Make the per-leerlijn fixture explicit: choose labels known to belong to `lesgeven` instead of relying on object key order.
- Tighten assertions to exact labels: SBL → `label === 'sbl'`, SBC → `label === 'sbc'`, BJ1 positief → `label === 'naar_bj2'`, Versneld → `label === 'versneld_sbc'`.
- Assert `isNegatief` directly in tests C and D, not only inferred behavior through label/gaps.

#### Risk Assessment
**MEDIUM**. The intent and coverage are good, but the RED-test strategy for `tests/prognosis.test.ts` is not executable as written.

---

### Plan 02 Review

#### Summary
Plan 02 is the cleanest of the three: narrowly scoped, reuses the existing LazyStore pattern, preserves behavioral compatibility through `getNormenSync()`, and explicitly calls out the highest-risk refactor point: replacing hardcoded values in both decision logic and `gaps`. The main gap is that it stops at the engine, while user-facing explanatory text in `DoortstroomPrognoseSection.tsx` remains hardcoded to old norms.

#### Strengths
- Good scope control: only `utils/normen.ts` and `utils/prognosis.ts`.
- Reuses a known-good persistence pattern from `utils/verzuimDrempels.ts`.
- Correctly requires cache update before `await`.
- Correctly requires `store.set()` plus `store.save()`.
- Preserves existing callers by making the new parameter optional with fallback.
- Explicitly protects the `gaps` object from being missed.

#### Concerns
- `[HIGH]` User-facing explanatory text is still hardcoded in `src/components/DoortstroomPrognoseSection.tsx` (line ~27 and nearby). After this plan, tile colors can be correct while the detailed explanation still says "max. 6", "max. 2", "norm ≥13", "norm ≥15", etc.
- `[MEDIUM]` The validation guard only checks `typeof raw.x === 'number'`. That accepts negative values, absurd values, and non-finite values. The threat model claims store.json tampering mitigation, but the guard is weaker than that claim.
- `[MEDIUM]` `saveNormen()` and `resetNormen()` return success information, but the phase does not appear to use it. A failed write can leave session behavior changed via cache while persistence silently fails.
- `[LOW]` `debugPrognose()` also hardcodes thresholds in its console output, so developer diagnostics become misleading after configuration changes.

#### Suggestions
- Either expand this plan or add a follow-up task to parameterize `src/components/DoortstroomPrognoseSection.tsx` and the debug output in `utils/prognosis.ts`.
- Strengthen `loadNormen()` validation to `Number.isFinite(...)` and enforce the same min/max domain the UI uses.
- Consider whether `resetNormen()` should surface failure more explicitly instead of always returning defaults.
- Add one test for corrupted persisted shape, not just missing shape.

#### Risk Assessment
**MEDIUM**. The engine refactor itself is well designed, but the phase is not truly end-to-end if the dashboard explanation layer keeps stale hardcoded norms.

---

### Plan 03 Review

#### Summary
Plan 03 covers the right wiring path: pre-warm cache, pass a callback through `App.tsx`, save on blur/Enter, clamp/round input, and trigger `refreshKey` so `KlasOverzicht` recomputes status. The biggest problem is completeness: it updates Settings and class-overview invalidation, but not the detailed prognose explanation UI. It also leans too heavily on manual verification for UI changes that are already testable in the existing `SettingsPage` suite.

#### Strengths
- Correctly uses existing `refreshKey` invalidation instead of inventing new state.
- Matches current `SettingsPage` patterns and avoids broad refactors.
- Uses blur/Enter save semantics to avoid flicker.
- Includes rounding and clamping rules explicitly.
- Recognizes startup pre-warm as necessary for sync accessors.
- Manual verification checklist is detailed and realistic.

#### Concerns
- `[HIGH]` This plan still leaves `src/components/DoortstroomPrognoseSection.tsx` hardcoded. The mentor may see updated tile colors but outdated norm explanations in the detail view — a user-facing correctness problem.
- `[MEDIUM]` Task ordering: making `onNormenChanged` required will immediately break existing `SettingsPage` renders/tests until all call sites are updated.
- `[MEDIUM]` The UI path does not check the boolean result of `saveNormen()`. If plugin-store write fails, the app still updates local state and recomputes colors, giving a false impression of persistence.
- `[MEDIUM]` No explicit automated test coverage for the new section despite an existing `tests/SettingsPage.test.tsx` suite that is already set up for this kind of work.
- `[LOW]` `handleNormenBlur` uses the render-time `normen` object to build the saved payload — a functional update would be more robust.

#### Suggestions
- Add `DoortstroomPrognoseSection` to this plan or a Plan 04 so all visible norm copy is driven by current configured norms.
- Extend `tests/SettingsPage.test.tsx` with: section renders, blur saves, Enter triggers blur, SBC<SBL warning, reset confirmation, `onNormenChanged` callback firing.
- Update all `SettingsPage` test renders in the same change as the prop interface, or temporarily make `onNormenChanged` optional until tests are migrated.
- Decide on persistence-failure UX now: toast/banner/log-only. Do not silently imply restart persistence if `saveNormen()` returned `false`.
- Consider centralizing the field metadata (`label`, `min`, `max`, `unit`) to reduce repetitive JSX and avoid mismatch bugs.

#### Risk Assessment
**HIGH**. The runtime wiring is sound, but the user-facing phase is incomplete without updating the detailed prognose text, and the lack of automated UI coverage increases regression risk.

---

### Codex Overall Assessment

The three-plan sequence is directionally correct and the dependency order makes sense. The two issues to fix before execution are:
1. Plan 01's prognosis-test RED strategy, because it is contradictory as written.
2. The missing update of hardcoded explanatory norm text in `DoortstroomPrognoseSection`, because that leaves the app behavior and the app explanation out of sync.

---

## Consensus Summary

### Agreed Strengths
- **TDD wave structure** — Both reviewers praise the RED→GREEN→UI layering as the right approach for this kind of engine refactor.
- **Pattern replication** — Copying `utils/verzuimDrempels.ts` as the template is applauded by both as safe, consistent, and reliable.
- **`gaps` object coverage** — Both note that explicitly targeting the `gaps` arithmetic (not just labels) is a critical and correct inclusion.
- **`refreshKey` re-use** — Both approve of reusing existing `App.tsx` invalidation instead of adding new state.

### Agreed Concerns
1. **`DoortstroomPrognoseSection.tsx` still hardcoded [HIGH]** — Codex flags this in both Plan 02 and Plan 03 as a HIGH concern. Tile colors will update but detailed norm text (e.g. "max. 6", "norm ≥13") will remain stale. This is the single most important gap to close before execution.
2. **`tests/prognosis.test.ts` top-level import RED strategy [HIGH]** — Codex identifies that adding a top-level `import { DEFAULT_NORMEN } from '../utils/normen'` to an existing green test file will break the entire file at module-load time before `utils/normen.ts` exists. Gemini's gaps suggestion (assert `result.gaps.*` fields explicitly) aligns with Codex's fixture precision concern.
3. **Validation guard strength [MEDIUM]** — Both reviewers note the 8-field `typeof` guard accepts negative/non-finite values. `Number.isFinite()` + range checks would be stronger.
4. **Silent persistence failure [MEDIUM]** — Both note that failed `saveNormen()` writes are not surfaced to the user, leaving the in-session experience inconsistent with what actually persisted.

### Divergent Views
- **Overall risk level** — Gemini rates the phase LOW risk overall; Codex rates Plan 03 HIGH and Plans 01–02 MEDIUM. The divergence is explained by Codex focusing on the `DoortstroomPrognoseSection` gap and the prognosis-test import strategy, which Gemini did not independently discover.
- **Automated UI test coverage** — Codex specifically calls for extending `tests/SettingsPage.test.tsx` for Section 5; Gemini does not raise this gap.

### Recommended Actions Before Execution

| Priority | Action | Plan |
|----------|--------|------|
| 🔴 HIGH | Add task to parameterize `DoortstroomPrognoseSection.tsx` norm text using `getNormenSync()` | Add to 25-03 or new 25-04 |
| 🔴 HIGH | Split prognosis normen tests into `tests/prognosis.normen.test.ts` (separate file) to avoid breaking existing green tests | Revise 25-01 |
| 🟡 MEDIUM | Strengthen `loadNormen()` to use `Number.isFinite()` + min/max range per field | Revise 25-02 |
| 🟡 MEDIUM | Add persistence-failure UX decision (at minimum: console.error on failed save) | Revise 25-02/25-03 |
| 🟡 MEDIUM | Extend `tests/SettingsPage.test.tsx` with Section 5 coverage | Add to 25-03 |
| 🟢 LOW | Add field-level error logging in `loadNormen()` type guard | Revise 25-02 |
| 🟢 LOW | Tighten prognosis test label assertions to exact strings (`'sbl'`, `'sbc'`, etc.) | Revise 25-01 |
