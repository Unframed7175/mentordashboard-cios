---
phase: 19
reviewers: [gemini, codex]
reviewed_at: 2026-05-19T00:00:00Z
plans_reviewed: [19-01-PLAN.md, 19-02-PLAN.md, 19-03-PLAN.md, 19-04-PLAN.md]
---

# Cross-AI Plan Review — Phase 19: UI Polish

---

## Gemini Review

### Summary
The plan for Phase 19 is a robust roadmap for elevating the application's visual and interactive quality. By shifting the spider chart logic from string manipulation to JSX, the team addresses both security (eliminating `dangerouslySetInnerHTML`) and maintainability. The wave-based structure correctly identifies dependencies, ensuring that CSS foundations and testing contracts are established before functional refactors occur. The inclusion of human checkpoints for brand assets and final UAT in Tauri is a pragmatic touch for a project moving toward a v2.1 release.

### Strengths
- **Security & Best Practices**: The refactor in Plan 03 to eliminate `dangerouslySetInnerHTML` in favor of native JSX elements is a significant security and performance improvement.
- **TDD Methodology**: Plan 01 ensures that the structural "contract" for the spider chart is locked in before implementation, preventing regression and ensuring the new API meets requirements.
- **Asset Self-Sufficiency**: Moving away from Google Fonts to bundled OTF files aligns with the Tauri "offline-first" desktop philosophy (Decision D-07/D-08).
- **State Management Strategy**: Lifting `isDark` to `App.tsx` (Plan 04) is the correct architectural move for a global theme, and the use of a `settingsOpenCount` key to force animation re-triggers is a clever, low-overhead solution for UI state.
- **UX Consistency**: The use of Material-inspired shadows and standardized hover durations (150-200ms) will significantly improve the "feel" of the app.

### Concerns
- **[MEDIUM] File Extensions**: Plan 03 mentions renaming `utils/spider.ts` to `.tsx`. If other utilities in `utils/` remain `.ts`, this might cause slight inconsistency in the folder structure, though technically necessary for JSX.
- **[MEDIUM] Tooltip Positioning**: In Plan 03, positioning a `div` tooltip over an `svg` can be tricky regarding coordinate systems (SVG coordinates vs. Page coordinates). If the `onHover` callback does not provide client/page coordinates, the tooltip might appear misaligned.
- **[LOW] Asset Injection**: Plans 02 and 04 rely heavily on "user provided" files (OTF, SVG). If these are missing or improperly formatted (e.g., corrupted OTF), the build will fail. There is no fallback logic defined for missing brand assets.
- **[LOW] CSS Specificity**: Adding many hover gaps and animations in `index.css` (Plan 02/04) might lead to specificity wars if not scoped carefully, though the current project size makes this manageable.

### Suggestions
- **Tooltip Logic**: In Plan 03, ensure the `onHover` callback passes the `event` object or calculated `clientX/Y` so the `SpiderChartCard` can position the tooltip absolutely relative to the viewport or a `position: relative` container.
- **SVG Accessibility**: While refactoring the Spider Chart to JSX, consider adding `aria-label` or `<title>` tags to the hit circles to improve accessibility for screen readers.
- **Dark Mode Transition**: Add `transition: background-color 0.3s ease, color 0.3s ease;` to the `body` or `#root` in Plan 02 to prevent a jarring "flash" when toggling dark mode.
- **Type Safety**: In Plan 03, define a clear TypeScript interface for the `onHover` data (e.g., `interface HoverData { label: string; score: number; x: number; y: number }`) to ensure the communication between the utility and the component is type-safe.

### Risk Assessment
**Risk Level: LOW**

The plans are highly granular and respect the existing architecture. The most complex part (the Spider Chart refactor) is preceded by a "RED" testing phase, which mitigates the risk of breaking existing dashboard functionality. The dependency on human checkpoints for assets is the only significant external bottleneck, but it is clearly documented. The move to JSX actually *reduces* the long-term risk of XSS vulnerabilities and rendering bugs.

---

## Codex Review

### Plan 01 — Spider Tests RED Scaffold

**Summary**
This plan has the right intent: lock the new contract before the JSX refactor lands. The main weakness is that it couples tests to implementation details and deliberately introduces a failing suite without a clear branch/CI containment strategy. As written, it is useful for local RED-first development, but a bit fragile as a team plan.

**Strengths**
- Tests are scoped tightly to the contract change from `string` to `JSX.Element`.
- Using `React.isValidElement` and `renderToStaticMarkup` is a sensible way to validate structure without browser-only tooling.
- Adding assertions for axis labels and hit areas directly supports the phase goal around readability and hover interaction.
- Keeping this in Wave 1 gives Plan 03 a clear GREEN target.

**Concerns**
- **[HIGH]** Intentionally committing a failing test suite is risky unless there is an explicit branch policy; this can break CI and block unrelated work.
- **[MEDIUM]** Requiring `className spider-hit-circle` in tests over-specifies implementation instead of behavior. A refactor to a different selector would fail tests even if UX is correct.
- **[MEDIUM]** "At least 4 failures" is brittle. The exact failure count can change based on how the current implementation behaves, which makes verification noisy.
- **[MEDIUM]** The plan validates element presence, but not tooltip payload correctness or hover wiring, so it only partially protects POL-02.
- **[LOW]** If `utils/spider.ts` becomes `utils/spider.tsx`, test imports may need adjustment; the plan does not mention this dependency.

**Suggestions**
- Define whether Plan 01 is allowed only on a feature branch, or use `test.failing`/temporary skip strategy if CI stability matters.
- Verify expected structure semantically where possible — "contains hover target circles" — instead of locking to one exact class unless that class is part of the public styling contract.
- Replace "at least 4 failures" with a looser RED criterion: the suite must fail because the return type/markup contract is not yet implemented.
- Add one assertion that the rendered SVG contains the expected number of labels or data-point hit targets derived from the input dataset.
- Note the expected file rename/import change up front so Plan 03 does not break the test harness unexpectedly.

**Risk Assessment: MEDIUM**
Good RED-first discipline, but the deliberate failing state and brittle verification wording make it operationally risky unless isolated from mainline CI.

---

### Plan 02 — CSS Tokens, Font, Shadows, Hover Gaps

**Summary**
This plan is a reasonable foundation layer, but it is currently too asset-driven and too narrow to fully guarantee the hover-consistency outcome of the phase. It also assumes all relevant indigo usage lives in `src/index.css`, which is often false in React apps with scattered component styles.

**Strengths**
- Centralizing brand tokens and font setup in `src/index.css` is the right direction.
- Removing remote font dependencies aligns with the Tauri/local-bundle constraint.
- Replacing accent tokens before later UI work reduces duplication in subsequent plans.
- Updating dark-mode accent overrides in the same pass helps avoid color drift between themes.

**Concerns**
- **[HIGH]** "Copy 3 OTF files from user desktop" is not reproducible. The plan depends on manual file placement but does not define filenames, expected paths, or what happens if assets are missing.
- **[HIGH]** The plan claims to support POL-04, but the listed CSS work does not explicitly cover the required hover animations for KPI tiles, leerling-tegels, and nav-tabs.
- **[MEDIUM]** "No old indigo values remain anywhere" is broader than the file list. If hardcoded values exist outside `src/index.css`, this plan will miss them.
- **[MEDIUM]** OTF-only webfont use can increase bundle size and slow first paint; acceptable in Tauri, but the plan should still handle loading behavior explicitly.
- **[LOW]** "Material elevation values" is vague. Without naming the target shadow tokens/selectors, different contributors may implement different shadow systems.

**Suggestions**
- Make asset handling explicit: required filenames, destination paths, and a blocked state if the user has not yet supplied the files.
- Add `font-display: swap` in all `@font-face` blocks to avoid invisible text during font load.
- Expand scope from token changes to an audit pass for hardcoded accent/shadow values across the repo, not just `src/index.css`.
- Explicitly list the selectors that must receive hover transitions for POL-04, or move that requirement fully into Plan 04.
- Define the exact shadow tokens/selectors being updated so "Material" is not left to interpretation.

**Risk Assessment: MEDIUM**
The CSS/token direction is sound, but asset reproducibility and incomplete coverage of the hover requirement are real gaps.

---

### Plan 03 — Spider JSX Refactor, Tooltip, Responsive CSS

**Summary**
This is the core implementation plan for the phase and it is mostly well-shaped. It removes the highest-risk pattern (`dangerouslySetInnerHTML`) and aligns the rendering model with React. The main issues are around under-specified tooltip behavior, incomplete coverage of readability/responsiveness edge cases, and a likely file-type/import ripple if the utility becomes TSX.

**Strengths**
- Eliminating `dangerouslySetInnerHTML` is a strong security and maintainability improvement.
- Returning JSX directly is the correct architectural move given the new hover interactions.
- Using mapped arrays for rings, lines, labels, and hit targets will make the spider chart much easier to reason about and extend.
- The plan keeps the math helpers intact, which reduces regression risk in the chart geometry.
- Tooltip behavior is introduced at the component layer rather than forcing presentation logic into the data utility.

**Concerns**
- **[HIGH]** Axis labels "at endpoints + 12px" is not enough to guarantee readability. Without `textAnchor`, baseline handling, and extra viewBox/padding strategy, labels can still overlap or clip.
- **[HIGH]** Tooltip behavior is under-specified. There is no plan for positioning logic, pointer-event handling, or flicker prevention when moving across hit circles.
- **[MEDIUM]** If `utils/spider.ts` becomes `utils/spider.tsx`, that affects imports, build config assumptions, and possibly test tooling; this is only mentioned as a possibility, not a planned step.
- **[MEDIUM]** The plan does not mention keyboard/focus handling. Hover may be acceptable for desktop, but the lack of focus support is still a UX/accessibility gap.
- **[MEDIUM]** `.spider-card responsive` is too vague. The success criterion includes correct behavior from 1024px with no clipping; this plan does not define the actual responsive constraints to enforce that.
- **[LOW]** Plan 01 tests likely validate structure only, so tooltip correctness may still rely entirely on manual QA.

**Suggestions**
- Specify label placement rules: `textAnchor` by quadrant, baseline alignment, and sufficient SVG padding so endpoint labels do not clip.
- Define tooltip state shape and positioning strategy explicitly, including `pointer-events: none` to avoid hover flicker.
- Treat `.ts` to `.tsx` rename as an expected migration step with import/test updates, not a last-minute contingency.
- Add a component-level test for tooltip content on hover if the current test stack allows it.
- Define concrete responsive rules for `.spider-card` and its container so this plan contributes measurably to the 1024px requirement.

**Risk Assessment: MEDIUM-HIGH**
Architecturally correct and necessary, but the plan still leaves several user-visible edge cases unspecified, especially around label layout and tooltip interaction.

---

### Plan 04 — Dark Mode Lift, Animation, Logo, Responsive

**Summary**
This plan is carrying too many unrelated concerns in one wave and is the highest-risk part of the phase. It includes state ownership changes, branding, animation, manual asset dependency, and responsive cleanup, but several of the phase goals are only implied rather than concretely implemented.

**Strengths**
- Moving `isDark` ownership upward is the right architectural direction if multiple top-level areas depend on theme state.
- Human checkpoints are appropriate for logo assets and final Tauri validation.
- Adding branded navigation and a settings slide-in animation aligns directly with the polish goal.
- Keeping this after the spider refactor avoids mixing major rendering work into the same wave.

**Concerns**
- **[HIGH]** This plan is overloaded: state lift, animation, logos, nav decoration, and responsive fixes in one package. That increases merge and regression risk.
- **[HIGH]** The 1024px success criterion is not concretely covered. One `min-width: 0` rule is unlikely to be enough to eliminate horizontal scroll and clipping across both overview and detail views.
- **[HIGH]** POL-04 requires consistent hover animation on KPI tiles, leerling-tegels, and nav-tabs, but the tasks do not explicitly implement or verify those selectors.
- **[MEDIUM]** `settingsOpenCount` plus `key={settingsOpenCount}` looks like an animation-reset workaround that may remount `SettingsPage` and wipe transient UI state.
- **[MEDIUM]** The plan says `App.tsx` loads settings on mount, but it does not define persistence ownership for dark mode after state is lifted.
- **[MEDIUM]** Adding `overflow:hidden` to layout containers can fix scrollbars but also clip focus rings, tooltips, or other positioned content.
- **[LOW]** Logo delivery is a hard blocker, but the plan does not define a temporary fallback if the user asset handoff is delayed.

**Suggestions**
- Split this into at least two subplans: one for theme-state/animation wiring, one for branding/responsive cleanup.
- Replace the remount-based animation trigger with a class-based or state-driven animation approach if preserving component state matters.
- Add an explicit responsive audit task with target views and selectors for 1024px, not just a single CSS fix.
- Add explicit hover-transition tasks for KPI tiles, leerling cards, and nav tabs so POL-04 is fully covered.
- Define where dark-mode persistence lives after the lift, and verify both load and save behavior.
- Add fallback placeholders for logos so non-logo work can proceed while waiting for user assets.

**Risk Assessment: HIGH**
This plan is doing too much, and two of the core phase outcomes (responsive correctness and consistent hover animation) are not yet specified tightly enough to trust delivery.

---

### Codex — Cross-Plan Assessment

**Top cross-plan risks**
- **[HIGH]** RED-first Plan 01 can destabilize CI unless explicitly isolated.
- **[HIGH]** POL-04 is not fully mapped to concrete implementation tasks; hover consistency is still under-specified.
- **[HIGH]** The 1024px success criterion lacks a real responsive audit plan and is unlikely to be satisfied by the listed CSS tweaks alone.
- **[MEDIUM]** Asset-dependent work for fonts/logos is not reproducible enough.
- **[MEDIUM]** Manual QA exists, but there is little automated coverage for the most user-visible changes.

**Recommended adjustments**
- Keep Plans 01 and 03 largely intact, but tighten Plan 03's label/tooltip specification.
- Expand Plan 02 into a repo-wide style audit or narrow its acceptance criteria to only what it truly covers.
- Split Plan 04 so responsive fixes and hover consistency become explicit, testable deliverables rather than catch-all polish work.
- Add one small verification matrix for 1024px, dark/light, and hover states across the key dashboard surfaces.

**Overall risk level: MEDIUM-HIGH**
The architecture is mostly sound, but the current plans under-specify the exact work needed to guarantee the visual success criteria, especially for responsive behavior and interaction consistency.

---

## Consensus Summary

### Agreed Strengths
- **JSX refactor is the right call** (both reviewers): Eliminating `dangerouslySetInnerHTML` improves security, enables React event handlers, and is architecturally correct.
- **TDD RED scaffold is good discipline** (both reviewers): Plan 01's RED-first approach locks the contract before implementation and gives Plan 03 a clear GREEN target.
- **Local font bundling** (both reviewers): Moving from Google Fonts to bundled OTF files is correct for a Tauri offline-first desktop app.
- **Dark mode state lift** (both reviewers): Moving `isDark` ownership to `App.tsx` is the right architectural direction.

### Agreed Concerns
1. **Tooltip positioning under-specified** (both): SVG coordinate space vs. DOM/page coordinates creates real alignment risk. `onHover` callback needs explicit positioning strategy.
2. **Asset reproducibility** (both): OTF font files and logo files come from user desktop — not version-controlled, no fallback defined.
3. **POL-04 hover coverage gap** (both): The plans list specific hover selectors (4 gaps in Plan 02) but do not cover *all* required hover animations (KPI tiles, leerling-tegels, nav-tabs) explicitly.
4. **1024px responsive coverage too narrow** (Codex HIGH, Gemini implicit): A single `min-width: 0` rule in Plan 04 likely does not close the "no horizontal scroll at 1024px" criterion across all views.

### Divergent Views
- **Plan 01 risk**: Gemini assessed LOW overall (TDD approach praised), Codex rated Plan 01 specifically as MEDIUM (CI instability from intentionally failing tests). Codex concern is valid for a multi-developer team; less relevant if this is a single-developer project running on a feature branch.
- **Plan 04 scope**: Gemini rated the overall phase LOW risk, while Codex rated Plan 04 specifically HIGH. The divergence reflects focus: Gemini looked at the phase goals (which the architecture achieves), Codex looked at delivery confidence (which is weaker for the responsive/hover items).
- **`settingsOpenCount` key-based remount**: Gemini called it "clever, low-overhead"; Codex flagged it as potentially wiping transient component state. Both are correct — the question is whether SettingsPage has stateful UI that should survive reopens.
