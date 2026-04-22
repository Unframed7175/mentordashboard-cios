# Phase 8: Revert toetsplan changes - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Verwijder alle Phase 11 toetsplan-gerelateerde code uit `app.js` en `index.html`. Dit omvat: toetsplan-merge logic, deadline-sortering in D2-tabel, `normDatapunt()`/tokenSubset matching, RSD/Roosendaal-filter, `window.debugMerge()`, BJ1/BJ2 fase-detectie fix, en de toetsplan import UI (zone + handleToetsplanImport). De D2-tabel keert terug naar de staat ná Phase 7 (originele PDF-volgorde, geen deadline-kolom, geen toetsplan-driven sortering). Phase 7 two-row comparison tfoot met growth badges blijft intact.

</domain>

<decisions>
## Implementation Decisions

### Revert scope
- **D-01:** Alle 12 Phase 11 commits worden teruggedraaid — toetsplan-merge weg, BJ1/BJ2 fix weg, deadline-kolom weg, `window.debugMerge()` weg.
- **D-02:** Terug naar exact de staat na Phase 7 qua code (geen cherry-picks, volledige revert).

### Toetsplan import UI
- **D-03:** De toetsplan import UI (de `toetsplan-zone` in klas-instellingen, `handleToetsplanImport()`, `getActiveToetsplan()`, en alle bijbehorende HTML/JS) wordt volledig verwijderd — terug naar clean staat zonder toetsplan-functionaliteit.

### D2-tabel sortering na revert
- **D-04:** Datapunten in de D2-tabel verschijnen in de originele volgorde uit het PDF — geen deadline-sortering, geen toetsplan-driven ordering.
- **D-05:** De deadline-kolom (`<th>Deadline</th>` en bijbehorende `<td>`) wordt verwijderd.

### Claude's Discretion
- Exacte git-strategie (revert commits vs. handmatige cleanup): planner kiest beste aanpak op basis van dependencies tussen commits.
- Of `normDatapunt()` en `tokenSubset()` helpers ook in andere code gebruikt worden (check vóór verwijderen).
- Hoe `klas.toetsplan` property in opgeslagen localStorage data behandeld wordt na revert (achterwaartse compatibiliteit).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 11 commits (alles moet weg)
- Git commits in scope (nieuwste naar oudste):
  - `0dcb07e` fix(11): sync debugMerge matching logic with findStudentDp (tokenSubset)
  - `c720dc3` fix(11): token-subset matching for number-position and p1/p2 variants
  - `1f80153` debug(11): show year-filtered toetsplan in debugMerge for accurate diagnosis
  - `a0c3b81` fix(11): fix normDatapunt U+2010 + bidirectional merge matching
  - `36928f1` debug(11): add window.debugMerge() to diagnose merge mismatches
  - `f844987` fix(11): strip leading dash/bullet from normDatapunt so PDF rows match toetsplan
  - `0e5f6a8` fix(11): lenient matching merges PDF scores into toetsplan rows
  - `193acb2` fix(11): fix fase filter — prefix-start match prevents BJ1/BJ2 cross-contamination
  - `66944ae` fix(11): exclude RSD/Roosendaal entries from D2 toetsplan merge
  - `08e56fe` fix(11): filter D2 toetsplan datapunten by student school year (BJ/PJ/ExJ)
  - `a3344c0` feat(11): show all toetsplan datapunten in D2 table, sorted by deadline
  - `9060673` feat(11-01): sort datapunten and periodes chronologically by toetsplan deadline

### Referentie toestand (wat overblijft)
- Phase 7 eindtoestand: `1a02d77` docs(07-02) — dit is de baseline na revert.
- Two-row tfoot met growth badges (`2925b80`) moet intact blijven.

### Relevante bestanden
- `app.js` — bevat alle Phase 11 wijzigingen (~100+ regels)
- `index.html` — bevat toetsplan-zone HTML (toetsplan import UI)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app.js`: `getActiveToetsplan()` — helper die `klas.toetsplan` ophaalt; moet mee verwijderd worden
- `app.js`: `normDatapunt()` — normaliseert datapunt-strings voor matching; Phase 11-specifiek, weg
- `app.js`: `findStudentDp()` — token-subset matching; Phase 11-specifiek, weg
- `app.js`: `window.debugMerge()` — debug helper; weg

### Established Patterns
- Browser-only app zonder build-stap — git revert of handmatige cleanup, beide werken
- `klas.toetsplan` zit mogelijk opgeslagen in localStorage bij bestaande gebruikers — graceful fallback nodig (negeer onbekende properties)
- Phase 7 tfoot patroon (two-row comparison + growth badges) moet ongewijzigd blijven

### Integration Points
- D2-tabel rendering in `app.js` (showDetail functie) — dit is het kerngebied van de revert
- `index.html`: `#toetsplan-zone` div en bijbehorende knoppen en input — volledig verwijderen
- `app.js` event listeners voor toetsplan import (lines ~714-848) — volledig verwijderen

</code_context>

<specifics>
## Specific Ideas

- Volledige revert: niets van Phase 11 bewaren, ook niet de BJ1/BJ2 fix.
- Toetsplan import UI volledig weg — geen "toetsplan inladen" knop in klas-instellingen.
- D2-tabel: terug naar PDF-volgorde van datapunten.

</specifics>

<deferred>
## Deferred Ideas

- Eventuele herintroductie van toetsplan-functionaliteit in een latere fase op een andere manier — niet in scope voor Phase 8.

</deferred>

---

*Phase: 08-revert-toetsplan-changes*
*Context gathered: 2026-04-22*
