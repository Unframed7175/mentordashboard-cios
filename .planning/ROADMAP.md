# Roadmap: Mentordashboard CIOS — Dashboard 2

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-03-25) · [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Klasbeheer & Export** — Phases 6–8 (shipped 2026-04-23)
- ✅ **v1.2 Dashboard Redesign** — Phase 9 (shipped 2026-04-24)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–5) — SHIPPED 2026-03-25</summary>

- [x] Phase 1: PDF Parser (4/4 plans) — completed 2026-03-24
- [x] Phase 2: Excel Import (3/3 plans) — completed 2026-03-25
- [x] Phase 3: Doorstroomnorm Engine (2/2 plans) — completed 2026-03-25
- [x] Phase 4: Klasoverzicht (1/1 plan) — completed 2026-03-25
- [x] Phase 5: Detailweergave (0 plans, implemented in phase 4) — verified 2026-03-25

</details>

<details>
<summary>✅ v1.1 Klasbeheer & Export (Phases 6–8) — SHIPPED 2026-04-23</summary>

- [x] **Phase 6: Multi-class UI** — Mentor beheert meerdere klassen als tabbladen met geïsoleerde data en persistentie
- [x] **Phase 7: Periode Vergelijking** — Detailweergave toont fase 1 en fase 2 naast elkaar met visuele groei-indicatie
- [x] **Phase 8: Revert toetsplan changes** — Verwijder alle Phase 11 toetsplan-code; herstel post-Phase-7 staat

</details>

### v1.2 Dashboard Redesign

- [x] **Phase 9: CIOS Huisstijl & Verzuim Weergave** — Klasoverzicht-tegels tonen aanwezigheidspercentage en het volledige dashboard krijgt de CIOS Zuidwest huisstijl (cyaan, navy, bold sans-serif)

## Phase Details

### Phase 6: Multi-class UI
**Goal**: Mentor kan meerdere klassen aanmaken, beheren en wisselen in één dashboard — elke klas heeft eigen data die na refresh bewaard blijft
**Depends on**: Phase 5 (v1.0 baseline)
**Requirements**: KLS-01, KLS-02, KLS-03, KLS-04, KLS-05, KLS-06
**Success Criteria** (what must be TRUE):
  1. Mentor kan een nieuwe klas aanmaken met een naam en ziet deze direct als tabblad verschijnen
  2. Klikken op een tabblad wisselt de actieve klas — de klasoverzicht, import-UI en leerlijn-toewijzing tonen alleen data van die klas
  3. Na pagina-refresh zijn alle klassen, hun data en de actieve klas hersteld zonder opnieuw te importeren
  4. Mentor kan een klas verwijderen via een bevestigingsdialoog — de klas verdwijnt uit de tabs en de data is gewist uit localStorage
  5. Elke klas kan onafhankelijk PDFs en verzuim-Excel importeren zonder data van andere klassen te overschrijven
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Data layer (klassen.js) + HTML scaffold
- [x] 06-02-PLAN.md — Class tabs, modal, empty state, app.js wiring
- [x] 06-03-PLAN.md — Tile grid klasoverzicht replacing table

### Phase 7: Periode Vergelijking
**Goal**: Mentor kan per leerling de voortgang van fase 1 en fase 2 naast elkaar zien en de doorstroomprognose klopt op de meest recente data
**Depends on**: Phase 6
**Requirements**: CMP-01, CMP-02, CMP-03, CMP-04
**Success Criteria** (what must be TRUE):
  1. Mentor kan voor een klas PDFs van twee periodes importeren — beide periodes worden bewaard zonder elkaar te overschrijven
  2. Detailweergave toont deelgebied-scores van fase 1 en fase 2 in twee kolommen naast elkaar
  3. Deelgebieden waarbij de score gestegen of gedaald is zijn visueel onderscheidbaar (bijv. kleur of pijl) ten opzichte van de vorige periode
  4. Doorstroomprognose in de detailweergave en het klasoverzicht is berekend op basis van de meest recente geïmporteerde periode
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md — Data layer: compound dedup key, getActiveStudents dedup, consumer fixes
- [x] 07-02-PLAN.md — Detail view: two-row tfoot comparison with growth badges

### Phase 8: Revert toetsplan changes
**Goal**: Verwijder alle Phase 11 toetsplan-gerelateerde code uit app.js en index.html — herstel de exacte post-Phase-7 staat zonder toetsplan-import UI, merge logic, deadline-kolom of debug helpers
**Depends on**: Phase 7
**Requirements**: D-01, D-02, D-03, D-04, D-05
**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md — Remove all Phase 11 toetsplan code from app.js and index.html

### Phase 9: CIOS Huisstijl & Verzuim Weergave
**Goal**: Het dashboard ziet eruit als een professioneel CIOS Zuidwest product — klasoverzicht-tegels tonen aanwezigheidspercentage en de volledige UI gebruikt het cyaan/navy kleurpallet met bijpassende typografie
**Depends on**: Phase 8
**Requirements**: VRZ-01, VRZ-02, DES-01, DES-02, DES-03, DES-04
**Success Criteria** (what must be TRUE):
  1. Elke leerlingtegel in het klasoverzicht toont het aanwezigheidspercentage (bijv. "87% aanwezig") in plaats van "Xu ongeoorloofd"
  2. De 3-delige verzuimbalk (aanwezig / geoorloofd / ongeoorloofd) is nog steeds zichtbaar en correct gekleurd in elke tegel
  3. Knoppen, actieve tabbladen, links en highlights gebruiken CIOS cyaan `#00AEEF` als accentkleur door de hele app
  4. De header/navigatiebalk gebruikt CIOS navy donkerblauw — visueel onderscheidbaar van de vorige donkere tint
  5. Typografie en CSS-variabelen in de hele app zijn consistent met het CIOS kleurpallet (geen resterende oude tokennamen of kleuren)
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 09-01-PLAN.md — CSS kleur-tokens (:root + body.dark), hardcoded hex repareren, font-weight 700 structurele elementen
- [x] 09-02-PLAN.md — buildMiniVerzuimBar() aanwezigheidspercentage weergave

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. PDF Parser | 4/4 | Complete | 2026-03-24 |
| 2. Excel Import | 3/3 | Complete | 2026-03-25 |
| 3. Doorstroomnorm Engine | 2/2 | Complete | 2026-03-25 |
| 4. Klasoverzicht | 1/1 | Complete | 2026-03-25 |
| 5. Detailweergave | — | Complete | 2026-03-25 |
| 6. Multi-class UI | 3/3 | Complete | 2026-03-26 |
| 7. Periode Vergelijking | 2/2 | Complete | 2026-04-06 |
| 8. Revert toetsplan changes | 1/1 | Complete | 2026-04-22 |
| 9. CIOS Huisstijl & Verzuim Weergave | 2/2 | Complete | 2026-04-24 |
