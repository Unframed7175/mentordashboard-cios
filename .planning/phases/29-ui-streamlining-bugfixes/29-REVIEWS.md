---
phase: 29
reviewers: [gemini, codex]
reviewed_at: 2026-05-27T14:00:00Z
plans_reviewed:
  - 29-01-PLAN.md
  - 29-02-PLAN.md
  - 29-03-PLAN.md
  - 29-04-PLAN.md
  - 29-05-PLAN.md
---

# Cross-AI Plan Review — Phase 29: UI Streamlining & Bugfixes

---

## Gemini Review

### 1. Summary
The plan is of **high quality**, demonstrating a surgical approach to UI refinement. It correctly prioritizes fixing established bugs (WebView2 stripes, BPV loading states) before moving into the significant architectural rewrite of the `DoortstroomPrognoseSection`. The parallel execution of Waves 2 and 3 is well-calculated, and the "Wave 0" TDD approach is an excellent safeguard for the complex logic transitions required by the new block-based prognosis view.

### 2. Strengths
- **TDD for Logic-Heavy UI:** Using Red/Green testing for the `BpvProgressSection` (3-state logic) and `DoortstroomPrognoseSection` (BJ1/BJ2 branching) is the correct way to handle visual components that rely on complex data mapping.
- **WebView2 Compatibility:** The decision to replace the `::after` pseudo-element with a real DOM element (`.nav-stripe`) is a proven fix for rendering inconsistencies in Tauri/WebView2.
- **Systematic Hex Removal:** Chaining 18+ hex-to-variable replacements across 7 files is a high-signal task that directly resolves the "white spots" in dark mode without over-engineering the styling system.
- **Clear State Management:** Initializing the BPV loading state to `true` and ensuring both `.then` and `.catch` handle state resolution prevents the "infinite loader" bug.

### 3. Concerns
- **[MEDIUM] Prognose Data Mapping:** The rewrite of `DoortstroomPrognoseSection` assumes a specific mapping between `status.prognose` and the new SBL/SBC/Negatief blocks. If the `StatusResult` object keys don't perfectly align with the criteria names, the rewrite will render empty blocks.
- **[LOW] Transition Flash:** Adding `.view-fade-in` with a `translateY` to the outer wrapper of `DetailWeergave` might cause a "jumpy" feeling if the user toggles between students rapidly.
- **[LOW] CSS Variable Scope:** The plan mentions `var(--rag-*)` for the left accent borders. Confirm these variables are already defined in `index.css` from prior phases — if not, the components will lack visual status indicators.
- **[LOW] Side-Effect Components:** If `NotitiesTextarea` auto-saves on unmount or holds unsaved local state, that state will be lost on navigation after the section is removed.

### 4. Suggestions
- **Prognose Helper Validation:** In Wave 3, ensure the `criterionStatus()` helper includes a fallback for `undefined` or `null` scores to prevent the UI from breaking if partial data is imported.
- **Animation Tuning:** For the `.view-fade-in` class, consider using `will-change: opacity, transform` to ensure the 150–200ms transition is smooth in the Tauri environment.
- **BPV Copy Clarity:** Clarify whether "No data" means the file wasn't uploaded at all vs. uploaded but contained no records for that student. The 3-state logic covers this, but the copy should be distinct.
- **Nav Stripe z-index:** Although `pointer-events: none` is included, verify the `z-index: 0` is low enough that it doesn't accidentally cover Settings or other nav buttons if they overlap at smaller window sizes.

### 5. Risk Assessment
**Overall Risk: LOW**

The plan is primarily focused on cosmetic and layout changes. While the `DoortstroomPrognoseSection` rewrite is significant, the use of `getNormenSync` (synchronous) and the TDD approach mitigates the risk of calculation errors. The removal of sections in `DetailWeergave` is a "delete-only" operation which is generally safe in React/TypeScript environments as long as the underlying files are preserved as planned.

---

## Codex Review

*(Review delivered in Dutch, matching the project language)*

### 1. Summary
De planset is over het algemeen goed opgezet: de scope blijft lokaal, de waves zijn logisch gescheiden, en de twee meest gedragsgevoelige wijzigingen krijgen vroeg RED-tests. Het grootste risico zit niet in de CSS-cleanup, maar in Plan `29-05`: de rewrite van `DoortstroomPrognoseSection` kan visueel correct eindigen terwijl de inhoudelijke norm-mapping toch fout is. Daarnaast zijn `UI-01`, `UI-03` en deels `UI-04` nog net te impliciet uitgewerkt; de huidige plannen dekken bekende hotspots, maar nog niet aantoonbaar de hele acceptatiecriteria.

### 2. Strengths
- De wave-volgorde is sterk: tests eerst, daarna CSS-only, daarna parallelle componentwijzigingen, en pas daarna de grote prognose-rewrite.
- Plan `29-01` kiest de juiste twee targets voor RED-tests: `FIX-02` en `PROG-01` zijn precies de wijzigingen met echte render-branching.
- Plan `29-03` noemt expliciet de kritieke valkuil bij BPV: `useState(true)` als initiële loading state — correct voor dit patroon.
- Plan `29-04` houdt de cleanup mechanisch en beperkt zich tot bestaande files; dat verlaagt integratierisico.
- De DOM-vervanging voor de nav-stripe sluit netjes aan op de WebView2-beperking en voorkomt pseudo-element-afhankelijkheid.
- Het plan voorkomt scope creep naar dataflows, API-calls of Tauri-commando's.
- De gekozen subcomponents in `29-05` (`CriterionRow`, `PrognoseBlock`) zijn een redelijke abstrahering voor leesbaarheid zonder meteen een nieuw systeem te introduceren.

### 3. Concerns
- **[HIGH] Plan `29-05` mist expliciete mappingtabel:** Zonder een tabel die per criterium label / bronveld / norm-key / vergelijking specificeert, is de kans reëel dat de blokken netjes renderen maar inhoudelijk verkeerde prognoses tonen.
- **[HIGH] Empty-state gebruikt globale totalen:** `totaalVoldoendeOfHoger === 0 && totaalOnvoldoende === 0` als blokbeslisser is semantisch zwak — een blok kan geen eigen scores hebben terwijl andere blokken die wel hebben.
- **[MEDIUM] UI-01 te smal uitgewerkt:** Alleen `.detail-section-title` auditen dekt waarschijnlijk niet "consistent over alle views" voor body, labels en badges.
- **[MEDIUM] UI-03 kan nog andere violations missen:** "Geen witte vlekken" kan ook uit backgrounds, borders, shadows of niet-getokeniseerde inline styles komen buiten de 18 bekende replacements.
- **[MEDIUM] UI-04 tab-transitie niet expliciet:** De requirement noemt tab-navigatie én view-wissels, maar alleen de view-fade-in is expliciet uitgewerkt; tab-transitie verificatie ontbreekt.
- **[MEDIUM] Load-failure = no-data:** Plan `29-03` behandelt catch-branches effectief als "geen data". Dat voldoet aan FIX-02 maar maskeert echte lees-/importfouten.
- **[MEDIUM] Nav-stripe stacking:** Met alleen `.nav-stripe { position:absolute; z-index:0; }` kan de stripe toch achter de nav-background verdwijnen of boven content liggen als de stacking-context niet goed is.
- **[LOW] Section removal mogelijk bijwerkingen:** Bestaande tests, spacing assumptions of conditionele wrappers die LeerlijnenSection/VakkenSection/NotitiesTextarea verwachten kunnen breken.
- **[LOW] Line-number-gedreven edits zijn fragiel:** Als een file al iets verschoven is, missen de opgegeven regelnummers hun target.
- **[LOW] RED-tests kunnen brittle worden:** Tests voor visuele componenten zijn zinvol voor branching en tekst, maar doorschieten naar markup-snapshots maakt ze snel fragiel.

### 4. Suggestions
- Voeg aan Plan `29-05` een expliciete matrix toe met per criterium: label, bronveld op `student/status`, norm-key uit `getNormenSync()`, en de exact gebruikte vergelijking.
- Maak de leegtest in `DoortstroomPrognoseSection` blok-lokaal: bepaal per blok of er bruikbare scores zijn, niet via globale totalen.
- Gebruik in `BpvProgressSection` liever `try/finally` of `.finally(() => setLoading(false))` dan dubbele `setLoading(false)` in `then` en `catch`.
- Verifieer bij de nav-stripe expliciet `position: relative`, `overflow` en stacking van nav-kinderen in Tauri.
- Voeg een korte handmatige QA-checklist toe: light mode, dark mode, Tauri WebView, detail view, klasoverzicht, tab-switch, reduced motion.
- Bevestig expliciet dat tests worden bijgewerkt na verwijdering van de drie secties.
- Houd `29-05` data-driven: gebruik bestaande helpers en statusdata, vindt geen nieuwe prognoselogica uit.

### 5. Risk Assessment
**Overall Risk: MEDIUM**

De uitvoering is waarschijnlijk beheersbaar omdat de scope lokaal is en de wave-indeling goed is. Het risico wordt omhoog getrokken door één inhoudelijk zwaar punt: `DoortstroomPrognoseSection` kan functioneel fout uitpakken als de norm- en criteriummapping niet vooraf expliciet wordt vastgelegd. Als de mappingmatrix, blok-lokale empty-state en een korte QA-checklist worden toegevoegd, zakt dit naar laag-middel.

---

## Consensus Summary

### Agreed Strengths

Both reviewers agreed on:

1. **Wave structure is correct** — tests → CSS-only → parallel component fixes → complex rewrite. The dependency chain is well-designed.
2. **TDD targets are right** — Wave 0 RED tests for `BpvProgressSection` and `DoortstroomPrognoseSection` are exactly the two components with meaningful render-branching logic.
3. **BPV loading state pattern is sound** — `useState<boolean>(true)` initialization with `setLoading(false)` in both `.then` and `.catch` is the correct implementation.
4. **Nav stripe DOM replacement** — Replacing `::after` with a real DOM element is the proven WebView2 fix.
5. **Scope is well-contained** — No new packages, no new data flows, no API changes.

### Agreed Concerns

1. **[HIGH] DoortstroomPrognoseSection data mapping risk** — Both reviewers flag that the rewrite can render visually correct blocks while the norm mapping is wrong. The plan specifies the data mapping in detail (criterion → source field → norm key → comparison rule), but without an explicit matrix artifact, the executor relies on correctly interpreting the prose in Plan 05 Task 2. **Mitigation:** The data mapping spec in Plan 05 Task 2 `<action>` block is detailed and the Wave 0 RED tests gate the implementation — but a summary matrix in the plan frontmatter or action would reduce ambiguity.

2. **[MEDIUM] Dark mode coverage may be incomplete** — Both reviewers note that the 18 known hex replacements cover catalogued violations but may miss backgrounds, borders, or shadow values outside component inline styles. The hex audit was done by grep on `.tsx` files; `.css` hardcoded values outside the custom property system are not in scope.

### Divergent Views

- **Risk level:** Gemini rates LOW, Codex rates MEDIUM. The divergence is on whether the PROG-01 data mapping risk is mitigated by the detailed plan text (Gemini) or requires an explicit matrix artifact (Codex).
- **Empty state approach:** Codex raises the per-block vs global totals semantic issue (HIGH concern); Gemini does not flag this. Worth investigating: if a student has scores in one leerlijn but not another, the global empty check may suppress all blocks incorrectly.
- **UI-01 scope:** Codex considers the `.detail-section-title`-only audit too narrow for the full UI-01 requirement; Gemini accepts the scoped approach given the source audit already confirmed other tokens are consistent.
- **`.finally()` pattern:** Codex suggests `try/finally` or `.finally(() => setLoading(false))` over two explicit `setLoading(false)` calls — cleaner idiom, equivalent behavior.

---

*Generated: 2026-05-27 | Reviewers: Gemini CLI, Codex CLI | Skipped: Claude (self, running inside Claude Code)*
