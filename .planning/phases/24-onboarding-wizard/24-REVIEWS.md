---
phase: 24
reviewers: [gemini, codex]
reviewed_at: "2026-05-20T00:00:00.000Z"
plans_reviewed:
  - 24-01-PLAN.md
  - 24-02-PLAN.md
---

# Cross-AI Plan Review — Phase 24: Onboarding Wizard

---

## Gemini Review

This review evaluates the implementation plans for **Phase 24: Onboarding Wizard**.

### 1. Summary
The plan provides a solid foundation for the "First Run" experience by leveraging a full-screen overlay and lazy state initialization in `App.tsx`. The modular approach to step handlers correctly utilizes existing utility functions (`createKlas`, `parseSinglePDF`, etc.), ensuring consistency with the core logic. However, there is a significant discrepancy between the requirements (ONB-06) and the implementation regarding Step 5, and the current logic creates a "ghost class" risk if the user exits the app prematurely.

### 2. Strengths
- **Lazy Initialization:** Using a functional initializer in `App.tsx`'s `useState` for the `view` property is an efficient way to check for existing data exactly once on mount.
- **Overlay Strategy:** Implementing the wizard as a high `z-index` overlay inside `App.tsx` ensures that the main dashboard remains inaccessible and "frozen" until the mentor provides the necessary data.
- **Toolchain Reuse:** The plan intelligently reuses the heavy lifting from `pdf.ts` and `excel.ts` parsers, minimizing code duplication.
- **Step-by-Step State:** The local state management for `processing` and `stepMsg` provides the necessary feedback for potentially slow operations like PDF batch parsing.

### 3. Concerns
- **Requirement Mismatch (ONB-06) [HIGH]:** Requirement **ONB-06** explicitly asks for a Step 5 where the mentor configures settings (thresholds/mapping). The implementation plan instead treats Step 5 as a simple "Success/🎉" screen. This skips a critical part of the CIOS workflow where mentors must align the app's "prognose engine" with their specific period/normering.
- **The "Ghost Class" Loophole [MEDIUM]:** The check `Object.keys(klassenState.klassen).length === 0` is the only guard for the wizard. If a mentor completes Step 1 (Class Creation) but closes the app during Step 2 (PDF Upload), the next time they open the app, the wizard will **not** appear because a class now exists. They will be dropped into an empty dashboard, which violates "Success Criteria 1" (dashboard not accessible until complete).
- **Non-Null Assertion Hazard [MEDIUM]:** Using `onComplete(klasId!)` assumes Step 1 always succeeds and preserves state. While logically sound in a single session, it lacks a fallback. If the component re-renders or state is lost, this will pass `null` to `switchActiveKlas`, likely causing a crash or a broken app state.
- **Missing Atomic Rollback [LOW]:** If `handlePDFs` fails halfway through a batch of 30 files, some students are added while others are not. There is no mention of a "cleanup" or "retry" logic for partial imports during the onboarding flow.

### 4. Suggestions
- **Implement Step 5 Configuration:** Add a simplified version of `SettingsPage` components (specifically the drempelwaarden/thresholds) into Step 5 to satisfy ONB-06.
- **Strengthen the "Completion" Check:** Instead of checking if *any* class exists, check if any class has *students*:
  ```tsx
  () => Object.values(klassenState.klassen).some(k => k.studenten.length > 0) ? 'import' : 'onboarding'
  ```
- **Add a "Back" Button:** Allowing a mentor to go back from Step 2 to Step 1 to fix a typo in the class name is essential UX.
- **Explicit Error Boundaries:** Ensure that if `parseSinglePDF` throws an error, the `processing` state is set to `false` and the error is displayed. A single unhandled rejection might leave the wizard in a permanent "Processing..." state.
- **Step 5 - Quick Map:** For ONB-06, consider a "Default" or "Recommended" settings toggle so the user can truly skip it, but still sees that the options exist.

### 5. Risk Assessment
**Overall Risk: MEDIUM**

The technical implementation of the wizard is safe and follows React/Tauri best practices. The risk is primarily functional:
1. Users may end up in a "half-onboarded" state due to the class-existence check.
2. The missing settings step (ONB-06) means the app might show incorrect "Red/Orange/Green" statuses immediately after onboarding because the thresholds haven't been set for that specific class.

---

## Codex Review

### 1. Summary
De plannen zijn pragmatisch en waarschijnlijk voldoende om een eerste-run wizard technisch zichtbaar te maken, maar ze halen de fase-doelen niet volledig. De grootste afwijking is functioneel: **ONB-06 is niet geïmplementeerd**; stap 5 is een afrondscherm in plaats van instellingenconfiguratie. Daarnaast ontbreekt een expliciete **abort/dismiss flow**, terwijl de succescriteria die mogelijkheid wel noemen. De rest van de flow is redelijk coherent voor klas aanmaken en data-import, maar er zitten nog risico's in null-state afhandeling, foutpaden bij imports, en afhankelijkheid van globale state/init-volgorde.

### 2. Strengths
- De opsplitsing tussen `OnboardingWizard.tsx` en `App.tsx` is helder: UI-flow in één component, app-routing in de root.
- De wizard volgt de domeinvolgorde logisch: klas aanmaken, PDFs, verzuim, BPV, afronden.
- Stap 2 blokkeert op minimaal één PDF; dat sluit goed aan op de eis dat het dashboard na onboarding direct bruikbaar moet zijn.
- Stap 3 en 4 zijn expliciet optioneel via `Overslaan`, wat goed aansluit op de requirements.
- `handleOnboardingComplete` activeert de klas en navigeert daarna naar `klas`, wat de post-onboarding UX simpel houdt.
- De full-screen overlay-benadering voorkomt dat de gebruiker per ongeluk in andere delen van de app terechtkomt tijdens onboarding.

### 3. Concerns
- **HIGH — ONB-06 wordt niet gehaald.** In `src/components/OnboardingWizard.tsx` is stap 5 een "klaar"-scherm met `onComplete(klasId)`, terwijl de requirement expliciet zegt dat stap 5 instellingenconfiguratie moet bevatten, optioneel overslaanbaar.
- **HIGH — Geen abort/dismiss flow, ondanks succescriterium.** De fase zegt dat het dashboard niet toegankelijk is totdat de wizard is voltooid **of afgebroken**. De plannen en de code tonen geen `Afbreken`, `Later`, of veilige exit. Op eerste start zonder bestaande klassen kan de gebruiker hard vastlopen in onboarding.
- **HIGH — `klasId!` non-null assertion is fragiel.** In `OnboardingWizard.tsx` wordt `onComplete(klasId!)` aangeroepen. De code vertrouwt op flow-correctheid in plaats van state-validatie.
- **MEDIUM — Bestaande gebruikers landen op `import` i.p.v. het dashboard.** Als bestaande gebruikers na startup in de import-view landen, is dat UX-afwijkend van de bedoelde "direct dashboard"-ervaring.
- **MEDIUM — Afhankelijkheid van globale init-volgorde is kwetsbaar.** Het plan leunt op `loadKlassen()` in `main.tsx` vóór `ReactDOM.createRoot`. Dat werkt zolang die invariant klopt, maar de onboarding-routing is dan impliciet gekoppeld aan bootstrap-volgorde.
- **MEDIUM — Importfouten niet per bestand geaggregeerd.** Bij meerdere PDFs is onduidelijk of één corrupte PDF de hele batch blokkeert of tot half-opgeslagen state leidt.
- **MEDIUM — Partial-write inconsistentie bij PDF-import.** Als `addStudent` al mutaties doet op in-memory state en later een file faalt, kun je half-geïmporteerde state overhouden zonder rollback.
- **MEDIUM — Bestandsvalidatie alleen op UI-niveau.** Handlers valideren niet inhoudelijk — relevant voor robustness op een lokale desktop.
- **LOW — `processing` guard dekt niet alle UX-races.** Snel navigeren, drop + input-select, of meerdere async errors kunnen verwarrende state opleveren.
- **LOW — Testdekking te smal.** Plan 24-02 noemt alleen "all existing tests pass" — geen wizard-specifieke tests voor first-run routing, skip-paden of `onComplete`-gedrag.

### 4. Suggestions
- Implementeer stap 5 als **instellingenstap** voor ONB-06: toon huidige defaults, maak mapping/drempelwaarden optioneel aanpasbaar, bied `Overslaan` en `Opslaan en naar dashboard`.
- Voeg een expliciete **abort flow** toe: `Afbreken` op elke stap, bevestigingsdialoog, terugval naar lege/import-landingspagina.
- Vervang `klasId!` door harde guard: `if (!klasId) { setStepErr(...); return; }`.
- Maak startup-routing explicieter met `isLoaded`/`bootState` i.p.v. globale sync state uit `main.tsx`.
- Definieer batchgedrag PDF-import: partial success met rapportage per bestand.
- Voeg gerichte tests toe: first-run routing, tweede start, skip-flow, abort, duplicate klasnaam, `onComplete` zonder `klasId`.
- Overweeg persisteren per stap voor crash-resilience.

### 5. Risk Assessment
**Overall Risk: MEDIUM-HIGH**

De flow is dichtbij een werkende MVP, maar er zijn twee fundamentele functionele gaten: **ONB-06 ontbreekt** en **aborteren kan niet**. De overige risico's zitten in robustness (null-assertions, partial imports, bootstrap-afhankelijkheid). Zonder aanvullende tests en flow-correcties is dit te fragiel voor een volledig afgeronde onboardingfase.

---

## Consensus Summary

### Agreed Strengths (both reviewers)
- **Overlay architecture** is correct and clean: fixed position, z-index 100, covers the dashboard during wizard
- **Lazy initializer** in `App.tsx` is the right pattern — synchronous, happens at mount time once
- **Toolchain reuse** of existing parsers (parseSinglePDF, parseExcelFile, parseBpvExcel) is the right choice
- **Step 2 hard gate** (pdfsUploaded > 0 before Volgende) correctly enforces ONB-03
- **Steps 3 & 4 Overslaan** correctly implements ONB-04/ONB-05

### Agreed Concerns (both reviewers)

| Concern | Severity | Both Agree |
|---------|----------|------------|
| **ONB-06 not implemented** — Step 5 is a completion screen, not settings config | HIGH | ✅ |
| **`klasId!` non-null assertion** — fragile, no guard at Step 5 | MEDIUM-HIGH | ✅ |
| **"Ghost class" / early exit** — class exists after Step 1 so wizard skips on next launch, leaving empty dashboard | MEDIUM | ✅ |
| **Partial PDF import** — failed files mid-batch leave inconsistent state | MEDIUM/LOW | ✅ |

### Divergent Views
- **Codex** flagged "no abort flow" as HIGH (success criteria says "voltooid of afgebroken"). **Gemini** framed the same issue as the ghost-class risk but didn't call out the missing abort button directly.
- **Gemini** suggested checking for students (`k.studenten.length > 0`) instead of class existence as the completion guard — stronger and more precise.
- **Codex** raised existing users landing on `import` instead of `klas` as a MEDIUM concern; **Gemini** did not flag this.
- **Codex** flagged lack of test coverage for wizard-specific flows; **Gemini** did not.

### Priority Action Items
1. **ONB-06 gap** — Add a Step 5 settings step (minimal: threshold sliders + mapping review + Overslaan). Currently the spec says Step 5 = settings, implementation has Step 5 = completion. Can be addressed in a gap closure plan.
2. **Ghost class + completion guard** — Change lazy init from `klassen.length === 0` to `klassen.some(k => k.studenten?.length > 0)` to avoid trapping users in an empty dashboard after partial onboarding.
3. **`klasId!` hardening** — Add `if (!klasId) return;` guard before `onComplete(klasId!)` call.
4. **Abort/dismiss flow** — Add `Afbreken` button (with confirmation) to satisfy "voltooid of afgebroken" from success criteria.
