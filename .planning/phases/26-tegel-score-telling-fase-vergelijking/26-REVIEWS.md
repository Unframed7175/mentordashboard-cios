---
phase: 26
reviewers: [gemini, codex]
reviewed_at: 2026-05-23T12:00:00Z
plans_reviewed:
  - 26-01-PLAN.md
  - 26-02-PLAN.md
---

# Cross-AI Plan Review — Phase 26

> Phase: Tegel Score-telling & Fase-vergelijking
> Reviewed by: Gemini CLI, Codex CLI (Claude Code skipped — self)

---

## Gemini Review

**Summary**

Een goed doordacht plan dat de "Tegel Score-telling & Fase-vergelijking" feature implementeert met een sterke focus op de vooraf gedefinieerde design-keuzes (D-01 t/m D-09). De implementatie maakt gebruik van bestaande utils en breidt de UI op een niet-destructieve manier uit, inclusief aandacht voor accessibility en performance via useMemo.

**Strengths**

- Strikte naleving van design-constraints: gebruik van de CSS "border-trick" (D-04) houdt de bundle klein en consistent met de hand-rolled design filosofie.
- Performance: de trend-berekening wordt efficiënt afgehandeld in een useMemo in de parent, waardoor individuele tegels geen zware data-opzoekacties hoeven te doen tijdens render.
- Accessibility: er is expliciet nagedacht over aria-label en aria-hidden voor de visuele trendindicatoren, wat cruciaal is aangezien CSS-driehoekjes geen semantische betekenis hebben voor screenreaders.
- Data Integrity: het uitsluiten van grijze (onvolledige) fases voor de trend-vergelijking (D-09) voorkomt misleidende pijlen.

**Concerns**

- [LOW] Vertical Alignment: CSS border-triangles hebben vaak een kleine offset nodig om exact op de baseline van de tekst te staan. vertical-align: middle is een goed startpunt, maar visuele fine-tuning kan nodig zijn.
- [MEDIUM] Complexiteit getAllRecordsForStudent: als deze util in een loop wordt aangeroepen en zelf elke keer de volledige database filtert, kan dit bij grote klassen een O(N²) operatie worden. Voor een klas van 30 leerlingen is dit acceptabel, maar het is een aandachtspunt.
- [LOW] Null-safety in status.prognose: in Plan 26-01 wordt totaalVoldoendeOfHoger direct uit status.prognose gehaald. Hoewel gecheckt wordt op status.kleur !== 'grijs', moet gegarandeerd zijn dat prognose altijd gedefinieerd is bij andere kleuren.

**Suggestions**

- Gedetailleerde Aria-labels: gebruik specifieke Nederlandse tekst voor de trend, bijv. "Prognose verbeterd ten opzichte van fase 1".
- Tooltip/Title: voeg een title attribuut toe aan de trend-pijl container zodat muisgebruikers ook via een hover kunnen zien wat de pijl betekent.
- CSS Indent Sync: verifieer in src/index.css of .klas-tile-naam inderdaad 0.375rem padding/margin gebruikt, zodat de score-telling perfect uitlijnt met de naam.

**Risk Assessment: LOW**

De wijzigingen zijn puur additief. Er worden geen bestaande datastructuren aangepast en de logica is beperkt tot de weergave-laag. Het risico op regressies in de kern-functionaliteit is nagenoeg nihil.

---

## Codex Review

### Plan 26-01

**Summary**

Deze planhelft dekt TEGEL-01 en TEGEL-02 redelijk direct: de scoretelling hoort logisch in LeerlingTegel thuis, de optionele trend prop houdt de component API uitbreidbaar, en de CSS-aanpak past bij de bestaande pure-CSS stijl. De grootste gaten zitten niet in de basislayout maar in verificatie en toegankelijkheid.

**Strengths**

- Houdt LeerlingTegel presentational; de tile krijgt alleen data binnen en rekent geen trendlogica uit.
- De insertiepositie klopt met de gewenste volgorde in de tile.
- De status.kleur !== 'grijs' guard sluit goed aan op hoe berekenStatus() nu al Onbekend bepaalt.
- CSS border-triangle is consistent met D-04 en voorkomt extra assets/SVG.

**Concerns**

- [MEDIUM] Er is geen echte UI-verificatie gepland. grep en tsc bewijzen niet dat de score rij op de juiste plek rendert, verborgen blijft voor grijs, of dat de trendpijl zichtbaar is.
- [MEDIUM] De accessibility-aanpak is zwak beschreven. Een aria-label op een generieke div is niet de meest robuuste manier om een niet-tekstuele pijl aan screenreaders uit te leggen.
- [LOW] De plantekst zegt zichtbaar >= en *, terwijl het success-criterium letterlijk "14/19 >=V * 1 O" noemt. Als acceptance exact op die string toetst, krijg je discussie ondanks functioneel juist gedrag.
- [LOW] vertical-align: middle op een flex-item doet in de praktijk niets; voor een border-triangle in een flex row moet de optische uitlijning via align-items of een kleine translate/margin worden gefinetuned.

**Suggestions**

- Voeg componenttests toe voor LeerlingTegel: niet-grijs toont score, grijs toont niets, trend="op" toont op-pijl, trend={null} toont geen pijl.
- Gebruik voor de trend een expliciete screenreader-tekst, bijvoorbeeld een verborgen span met "Trend verbeterd" / "Trend verslechterd", in plaats van alleen een aria-label op de wrapper.
- Reserveer een visuele tuningstap voor de triangle-uitlijning; de nu geplande waarden zijn plausibel, maar waarschijnlijk niet in één keer optisch goed.

**Risk Assessment: LOW-MEDIUM**

De renderingwijziging is klein en lokaal, maar zonder gerichte componenttests en met een vage a11y-aanpak is de kans op een "werkt visueel, maar niet volledig correct" implementatie reëel.

---

### Plan 26-02

**Summary**

Deze planhelft raakt de echte logica en is kritischer. De hoofdrichting klopt: KlasOverzicht hoort de trend te berekenen en via props door te geven. Maar het plan mist een belangrijke TREND-03 guard, leunt op broze memo-dependencies, en valideert de nieuwe trendregels niet expliciet met tests.

**Strengths**

- De logica zit op de juiste plek: KlasOverzicht heeft al toegang tot de studentlijst en statusberekening.
- Hergebruik van getAllRecordsForStudent() sluit aan op bestaand patroon in DetailWeergave.tsx.
- De grijs-guard volgt D-09 en voorkomt onzinnige vergelijking met onbekende statussen.
- Optional prop wiring naar LeerlingTegel is een veilige API-wijziging.

**Concerns**

- [HIGH] TREND-03 is niet volledig afgedekt. Het plan checkt alleen records.length < 2, maar niet of het echt twee verschillende fases/periodes zijn. In DetailWeergave wordt hiervoor een extra guard gebruikt: records[0].periode !== records[last].periode.
- [HIGH] De useMemo dependency [refreshKey, allStudents.length] is fragiel. Trend kan stale worden als records of normeringen wijzigen zonder dat refreshKey of leerlingaantal verandert.
- [MEDIUM] getAllRecordsForStudent() sorteert alfabetisch op periode, niet semantisch op fase-index of datum. Voor "fase 1 versus fase 2" is dat alleen veilig zolang de inputstrings exact goed sorteren.
- [MEDIUM] De requirements spreken over prognose-trend, maar het plan vergelijkt tile-status-rang (berekenStatus + STATUS_VOLGORDE). Dat is niet helemaal hetzelfde, omdat Verzuim ook oranje oplevert en dus prognoseverandering kan maskeren.
- [MEDIUM] Er zijn geen nieuwe tests in het plan, terwijl dit logica is die makkelijk edge cases heeft: minder dan 2 fases, gelijke status, grijs, dubbele periode, op/neer.
- [LOW] npx vitest run als verify-stap bewijst niets zolang er geen tests bijkomen die deze feature raken.

**Suggestions**

- Voeg de distinct-period guard toe: geen trend als oudste en nieuwste record dezelfde periode hebben (records[0].periode === records[records.length - 1].periode → null).
- Overweeg een kleine pure helper bepaalTrend(records): 'op' | 'neer' | null, buiten de component. Dat maakt testen veel eenvoudiger.
- Schrijf gerichte tests voor trendlogica: op, neer, gelijk, één record, twee records met dezelfde periode, en een case waar één van de twee grijs is.
- Als de huidige memo-strategie behouden blijft, documenteer expliciet welke events refreshKey verhogen.

**Risk Assessment: MEDIUM-HIGH**

De basisaanpak is logisch, maar de ontbrekende distinct-phase check en de zwakke memo-invalidatie kunnen direct leiden tot verkeerde of achterlopende trendpijlen, precies in het deel van de feature dat het nieuwe gedrag definieert.

---

## Consensus Summary

### Agreed Strengths

- **Correct architectural split**: Both reviewers confirm LeerlingTegel stays purely presentational and KlasOverzicht owns the computation — this is the right React pattern.
- **CSS border-trick is correct choice**: Both confirm D-04 compliance (no Unicode, no SVG) and consistency with the existing hand-rolled CSS design system.
- **grijs guard (D-09) correctly placed**: Both confirm the explicit grijs exclusion before rank comparison prevents misleading arrows.
- **useMemo in parent is the right performance approach**: Avoids per-tile data lookups during render.

### Agreed Concerns

- **[MEDIUM] Vertical alignment of CSS border-trick triangle**: Both reviewers independently flag that `vertical-align: middle` is unreliable in a flex context and the triangle will likely need a 1–2px manual offset to align with the 12px Industry text cap-height. Plan should not assume first-pass values will be optically correct — a browser verification step is needed.
- **[MEDIUM] getAllRecordsForStudent reliability**: Both note the alphabetical sort on `periode` string is only safe if import filenames/period strings sort correctly. If a period string like "2025-2" sorts after "2025-10", oldest-first would be wrong.

### Divergent Views

- **Gemini: LOW risk overall** — Saw the changes as purely additive with minimal regression risk.
- **Codex: MEDIUM-HIGH risk on Plan 26-02** — Found two HIGH severity issues Gemini missed: (1) missing distinct-period guard for TREND-03, and (2) fragile useMemo dependency array. These are legitimate concerns that could cause stale or incorrect trend arrows in real usage.
- **Codex found missing TREND-03 guard**: `records.length < 2` does not cover the case where the same period was imported twice — `records[0].periode === records[records.length-1].periode` would slip through as a "two-phase" comparison when it is actually the same phase.

### Top Action Items Before Execution

| Priority | Issue | Suggested Fix |
|----------|-------|---------------|
| HIGH | TREND-03 not fully covered: same-period records pass `records.length < 2` check | Add `records[0].periode === records[records.length-1].periode → null` guard in trendMap |
| HIGH | useMemo dependency fragility: trend can go stale | Document or improve refreshKey coverage; acceptable to proceed with existing pattern if refreshKey already handles re-imports |
| MEDIUM | CSS triangle vertical alignment not verified | Executor must check in browser after implementation; small margin-top/bottom may be needed |
| MEDIUM | No unit tests for trend logic | Add component tests for LeerlingTegel (grijs/non-grijs) and a pure `bepaalTrend` helper test |
| LOW | aria-label on div less robust than hidden span | Consider adding `<span className="sr-only">` with Dutch trend text for screen reader users |
