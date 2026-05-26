---
phase: 27
reviewers: [gemini, codex]
reviewed_at: 2026-05-26T00:00:00.000Z
plans_reviewed:
  - 27-01-PLAN.md
  - 27-02-PLAN.md
---

# Cross-AI Plan Review — Phase 27: Klasbeheer

## Gemini Review

This review evaluates the implementation plans for **Phase 27: Klasbeheer**, focusing on class renaming and deletion within the `KlasTabStrip`.

### Summary
The plans are well-structured, adhering strictly to the user decisions (D-01–D-07) and the established architectural patterns of the project (singleton state + `refreshKey`). The TDD approach in Wave 1 ensures data integrity before UI implementation, and the removal of redundant logic in `KlasOverzicht` maintains a clean codebase. The strategy for inline editing and conditional deletion is idiomatic for a React/Tauri application.

### Strengths
- **TDD Methodology:** Plan 27-01 prioritizes core logic and persistence testing before touching the UI.
- **Clean Refactoring:** Plan 27-02 includes the removal of the old "Delete" button, preventing UI clutter and multiple "sources of truth" for deletion logic.
- **Event Handling:** Correct use of `e.stopPropagation()` on the delete icon prevents accidental tab switching when deleting a class.
- **UX Fidelity:** Adherence to "Enter/Blur to save, Escape to cancel" provides a standard, intuitive desktop-like experience.

### Concerns
- **LOW — Input Width:** The CSS `width: 8ch` for `.tab-rename-input` may be too restrictive for longer class names, causing text truncation or overflow during editing.
- **MEDIUM — State Persistence Failure:** If `saveKlassen()` fails (e.g., disk I/O error or plugin error), the in-memory `klassenState` will still reflect the change until a hard refresh.
- **LOW — Active Tab Deletion:** While the plan mentions `auto-switch activeKlasId` exists in `deleteKlas`, Wave 2 should ensure `App.tsx` handles the case where the deleted class was the active one to avoid rendering a "dead" state.

### Suggestions
- In `KlasTabStrip.tsx`, use `input.select()` on mount (via `useEffect` triggered by `editingKlasId`) so the user can immediately overwrite the name without backspacing.
- Instead of `8ch`, consider `min-width: 50px; width: auto;` or calculate width based on text length.
- In `App.tsx`, wrap `renameKlas` and `deleteKlas` calls in a try/catch or check boolean return. Show a toast or alert on failure.
- Instead of `students: any[]` in the extended props, use the actual student interface/type from `utils/datamodel.ts`.

### Risk Assessment: LOW
The changes are surgical and follow the existing state management pattern. The most significant risk—data loss during renaming—is mitigated by the TDD plan in Wave 1. The use of `window.confirm` for deletion provides a sufficient safety net.

---

## Codex Review

### Plan 27-01 — `renameKlas()` utility

#### Summary
Dit plan is klein, passend geordend en technisch in lijn met de bestaande `deleteKlas()`-aanpak in `utils/klassen.ts`. Het raakt de juiste abstractielaag voor hernoemen zonder data-key migratie, dus de kans op dataverlies is laag zolang `klasId` de stabiele sleutel blijft. De grootste gap is dat validatie en bewijs van "geen dataverlies" nog te impliciet zijn.

#### Strengths
- Gebruikt `klasId` als stabiele identiteit, waardoor hernoemen alleen metadata wijzigt en leerlingdata niet hoeft te verplaatsen.
- Sluit aan op bestaand mutatiepatroon met `saveKlassen()`, dus weinig extra complexiteit.
- Dependency-volgorde is goed: eerst utility, daarna UI-integratie.
- Tests voor "happy path" en "unknown klasId" dekken de minimale functionele contracten af.

#### Concerns
- **MEDIUM — Validatie bij caller:** Validatie zit volledig bij de caller. Als later een andere caller `renameKlas()` zonder trim/empty-check gebruikt, kan whitespace of lege naam alsnog in state terechtkomen.
- **MEDIUM — RNM-01 onvolledig:** RNM-01 lijkt alleen de naam-mutatie te bewijzen, niet expliciet dat bestaande leerlingdata en periodegegevens intact blijven na save/load.
- **LOW — Save-failure inconsistentie:** Bij een fout in `saveKlassen()` is de in-memory state al gemuteerd.
- **LOW — Whitespace edge case:** Er is geen expliciete test voor "zelfde naam opnieuw opslaan" of voor namen met voor/achterspaties.

#### Suggestions
- Laat `renameKlas()` zelf minimaal `trim()` + non-empty guard doen, ook al valideert de UI al.
- Maak RNM-01 sterker: assert niet alleen `naam`, maar ook dat `students` en andere klasdata ongewijzigd blijven na persist/reload.
- Voeg een test toe voor whitespace-input, zodat het contract rond D-06 niet alleen in UI-logica leeft.

#### Risk Assessment: LOW-MEDIUM
De scope is klein en de gekozen aanpak is juist, maar het plan kan nog beter bewijzen dat "zonder dataverlies" echt afgedekt is en niet alleen verondersteld wordt.

---

### Plan 27-02 — Tab UI, `App.tsx`, cleanup, CSS

#### Summary
Het plan dekt de fase-doelen inhoudelijk goed af: delete in de tab, inline rename, directe zichtbaarheid via `setRefreshKey`, en verwijdering van het oude delete-pad. De grootste risico's zitten niet in businesslogica maar in UI-implementatie: invalid HTML/interactie in `KlasTabStrip.tsx`, async commit-races, en het ontbreken van gerichte componenttests voor precies deze nieuwe flows.

#### Strengths
- Verwijdert het oude delete-pad uit `KlasOverzicht.tsx`, waardoor D-07 netjes wordt gevolgd.
- Houdt delete/rename orchestration in `App.tsx`, wat past bij de huidige mutation + refresh-architectuur.
- Editgedrag sluit goed aan op de beslissingen: `Enter`, `Escape`, `blur`, en inline input.
- Delete-affordance alleen voor `students.length === 0` is direct gekoppeld aan KLS-01.
- Geen over-engineering: geen modal, geen uniqueness-logica, geen extra state-store.

#### Concerns
- **HIGH — Nested button-in-button (invalid HTML):** Als elke klas-tab een `<button>` is, en daarbinnen een `×`-`<button>` komt, creëert dit ongeldige nested interactive content. Dat geeft onvoorspelbaar klik-, focus- en keyboardgedrag.
- **HIGH — Geen UI-specifieke tests:** Het plan noemt geen nieuwe componenttests. `tsc` en bestaande `vitest`-suite geven weinig zekerheid over double-click, blur-save, Escape-cancel en delete-visibility.
- **MEDIUM — commitRename() race condition:** `commitRename()` zet direct `setEditingKlasId(null)` zonder `await` op `onRenameKlas(...)`. Bij dubbele events (`Enter` gevolgd door `blur`) kun je dubbele submits of stille failures krijgen.
- **MEDIUM — `students: any[]` te breed:** De tabstrip heeft feitelijk alleen `studentCount` of `isEmpty` nodig; het doorgeven van de hele array lekt meer data dan nodig en verzwakt typing.
- **MEDIUM — Input breedte:** `width: 8ch` voor `.tab-rename-input` is fragiel voor langere klasnamen.
- **LOW — Keyboard accessibility:** Hover-only reveal van de deleteknop mist `:focus-within` styling voor keyboardgebruikers.
- **LOW — Double-click op niet-actieve tab:** Double-click kan eerst switchen en daarna edit-mode openen; het gedrag moet bewust zijn.

#### Suggestions
- Herstructureer de tab markup: wrapper `<div>` of `<li>` met twee losse interactieve elementen (schakelknop + deleteknop naast elkaar) in plaats van button-in-button.
- Maak `commitRename()` idempotent: guard tegen dubbele commits, handel `Enter`/`blur` via één gedeeld pad af.
- Geef `KlasTabStrip` alleen `studentCount: number` of `canDelete: boolean` in plaats van `students: any[]`.
- Voeg componenttests toe voor `KlasTabStrip`: delete zichtbaar alleen bij lege klas, rename via double-click + Enter/Escape/blur.
- Voeg CSS toe voor `:focus-within` zodat de deleteknop niet alleen via hover bereikbaar is.
- Maak de inputbreedte flexibeler: `min-width` + `max-width` in plaats van harde `8ch`.

#### Risk Assessment: MEDIUM
Het plan is functioneel goed gericht, maar heeft twee reële implementatierisico's: de tab-structuur rond de deleteknop (nested button — invalid HTML) en het ontbreken van gerichte UI-testdekking.

---

## Consensus Summary

Phase 27 reviewed by **2 AI systems** (Gemini, Codex; Claude skipped — self).

### Agreed Strengths

- **TDD ordering is correct** — utility function before UI wiring is the right dependency order (both reviewers)
- **Clean D-07 cleanup** — removing the KlasOverzicht delete button avoids dual delete paths (both reviewers)
- **e.stopPropagation() on ×** — prevents tab-switch from firing on delete click (both reviewers)
- **Scope discipline** — no modal, no uniqueness check, no over-engineering (Codex; Gemini implicitly agrees)

### Agreed Concerns

| Severity | Finding | Reviewers |
|----------|---------|-----------|
| **HIGH** | **Nested `<button>` inside `<button>` invalid HTML** — the outer tab button contains an inner × button; this is invalid HTML and causes unpredictable click/keyboard behavior. Must restructure. | Codex (explicit HIGH), Gemini (implicit — stopPropagation workaround hints at this) |
| **MEDIUM** | **`width: 8ch` too narrow** — `.tab-rename-input` will clip longer class names during editing | Both |
| **MEDIUM** | **`saveKlassen()` failure leaves in-memory state mutated** — no rollback if persist fails | Both |
| **MEDIUM** | **`students: any[]` prop type too broad** — KlasTabStrip only needs `studentCount` or `canDelete` boolean | Codex (explicit), Gemini (suggests real type from datamodel.ts) |
| **MEDIUM** | **No new UI-specific tests** — tsc + existing suite don't cover double-click, blur-save, Escape-cancel, × visibility | Codex (explicit HIGH), Gemini (implicit) |

### Divergent Views

- **Gemini** focuses on the overall risk as LOW, optimistic about established patterns holding.
- **Codex** rates Plan 27-02 risk as MEDIUM specifically due to nested-button HTML invalidity and missing UI tests — considers these must-fix before execution.
- **renameKlas() internal validation:** Codex suggests `renameKlas()` itself should trim+guard; Gemini leaves that to the caller (per D-06). The decision (D-06) says caller validates — but adding an internal guard is a defensible improvement.

### Recommended Pre-Execution Actions

1. **[Must-fix]** Restructure tab markup in Plan 27-02 to avoid nested `<button>` — use a container `<div role="tab">` or wrap items in a `<li>` with separate interactive children.
2. **[Should-fix]** Pass `canDelete: boolean` (or `studentCount: number`) to KlasTabStrip instead of `students: any[]`.
3. **[Should-fix]** Add at least 2 component tests for KlasTabStrip: × visible on empty klas, double-click enters rename mode.
4. **[Nice-to-have]** Make `.tab-rename-input` width flexible (`min-width: 4ch; max-width: 20ch;`).
5. **[Nice-to-have]** Add `input.select()` on rename input mount for better UX.
