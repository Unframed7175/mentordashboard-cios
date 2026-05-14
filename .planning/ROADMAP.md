# Roadmap: Mentordashboard CIOS — Dashboard 2

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-03-25) · [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Klasbeheer & Export** — Phases 6–8 (shipped 2026-04-23)
- ✅ **v1.2 Dashboard Redesign** — Phase 9 (shipped 2026-04-24)
- 🔄 **v2.0 Stack Modernisering** — Phases 10–15 (in progress)

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

### v2.0 Stack Modernisering

- [x] **Phase 10: Scaffold & Toolchain** — Rust + Tauri + Vite + React + TypeScript + Vitest draaien lokaal; `npm run dev` start de app en alle bestaande tests slagen *(completed 2026-05-13)*
- [x] **Phase 11: TypeScript Migratie** — Alle utils en parsers zijn geporteerd naar TypeScript met identieke output; nul regressies in de test suite *(completed 2026-05-14)*
- [ ] **Phase 12: Versleutelde Opslag** — Leerlingdata wordt opgeslagen via plugin-store, versleuteld met AES-256-GCM en OS keychain sleutel; bestaande data gemigreerd; GDPR-verwijderfunctie werkt
- [ ] **Phase 13: Bestandstoegang** — Mentor kan PDFs, Excel-bestanden en zip-backups importeren via drag-drop én bestandsdialoog in de Tauri app
- [ ] **Phase 14: React UI** — Klasoverzicht en detailweergave zijn volledig herschreven als React componenten en tonen identieke informatie als de huidige app
- [ ] **Phase 15: Packaging & Cross-platform** — App bouwt als installeerbare .exe (Windows) en .dmg (Mac); UI ziet er identiek uit op beide platforms; eindgebruiker installeert zonder extra dependencies

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

---

### Phase 10: Scaffold & Toolchain
**Goal**: Developer kan het project openen, `npm run dev` uitvoeren en de Tauri dev-window zien — Vite + React + TypeScript + Vitest + Tauri 2 draaien allemaal en alle bestaande tests slagen
**Depends on**: Phase 9 (v1.2 codebase)
**Requirements**: TCH-01, TCH-02, TCH-03, TCH-04
**Success Criteria** (what must be TRUE):
  1. `npm run dev` start een Tauri desktop window met de app — geen Python http.server meer nodig
  2. `npm run test` voert alle 128 bestaande tests uit via Vitest en slaagt zonder regressies
  3. TypeScript type-fouten in gewijzigde bestanden zijn direct zichtbaar in de editor (strict mode per module)
  4. `npm run build` produceert een installer-artefact (.exe op Windows, .dmg op Mac) zonder handmatige stappen
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md — Pre-flight + Tauri scaffold + package.json merge + npm install
- [x] 10-02-PLAN.md — Configure Vite, TypeScript, Tauri conf, capabilities, React placeholder; smoke test npm run dev
- [x] 10-03-PLAN.md — Vitest config, jest shim setupFile; 9 tests pass (128-test gap deferred to Phase 11)

### Phase 11: TypeScript Migratie
**Goal**: Alle utils en parsers zijn geporteerd naar TypeScript — pdfjs-dist, SheetJS en de doorstroomnorm engine geven identieke output als de JavaScript originelen, bewezen door de volledige test suite
**Depends on**: Phase 10
**Requirements**: MIG-01, MIG-02, MIG-03
**Success Criteria** (what must be TRUE):
  1. PDF-parser verwerkt dezelfde test-PDFs en geeft byte-identieke output ten opzichte van de JavaScript versie
  2. Excel-parser leest .xls-bestanden inclusief correcte Nederlandse karakters (cpexcel codepage geregistreerd)
  3. Doorstroomnorm engine produceert identieke prognose-berekeningen voor alle 128 test-cases
  4. Geen TypeScript compile-errors in gemigreerde modules (`noImplicitAny` actief per module)
**Plans**: 6 plans

Plans:

**Wave 0**
- [x] 11-01-PLAN.md — Wave 0: tsconfig uitbreiden, fflate installeren, test stubs aanmaken, fixture checkpoint

**Wave 1** *(blocked on Wave 0 completion)*
- [x] 11-02-PLAN.md — Wave 1: Migreer utils/schema.ts + utils/datamodel.ts + utils/leerlijnen.ts (bodem-laag)
- [x] 11-03-PLAN.md — Wave 1b: Migreer utils/klassen.ts + utils/actiepunten.ts + utils/prognosis.ts *(blocked on 11-02)*

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 11-04-PLAN.md — Wave 2: Recreëer utils/aggregation.ts + utils/backup.ts + utils/spider.ts (verloren modules)
- [x] 11-05-PLAN.md — Wave 2: Migreer parsers/pdf.ts + parsers/excel.ts (parsers)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 11-06-PLAN.md — Wave 3: Tests finaliseren — actiepunten.test.js ESM, prognosis/feedback/parseStage/excel tests

Cross-cutting constraints:
- `npm run typecheck-migrated exits 0` required after every migration task (Plans 02–05)
- `npm run test exits 0` required after every wave
- `tsconfig.migrated.json` (noImplicitAny:true) is the noImplicitAny enforcement mechanism (D-11-05)
- Fixture files in `tests/fixtures/` required for MIG-01 (PDF) and MIG-02 (Excel) integration tests

### Phase 12: Versleutelde Opslag
**Goal**: Alle klassendata is opgeslagen via Tauri plugin-store en versleuteld met AES-256-GCM; de sleutel zit in de OS keychain; bestaande localStorage-data wordt automatisch gemigreerd; mentor kan een leerling volledig verwijderen
**Depends on**: Phase 11
**Requirements**: STO-01, STO-02, STO-03, STO-04
**Success Criteria** (what must be TRUE):
  1. Alle klassendata overleeft een app-herstart — opgeslagen via plugin-store, niet localStorage
  2. Opgeslagen leerlingdata is versleuteld op schijf (AES-256-GCM); de encryptiesleutel is uitsluitend zichtbaar in de OS keychain, niet naast de data
  3. Bij eerste start van de nieuwe app worden bestaande localStorage-gegevens automatisch gemigreerd zonder dataverlies
  4. Mentor kan een individuele leerling verwijderen — data is volledig gewist uit de store (Artikel 17 AVG compliance)
**Plans**: 4 plans

Plans:
- [ ] 12-01-PLAN.md — Wave 1: Rust crypto commands (crypto.rs, Cargo.toml, lib.rs, capabilities)
- [ ] 12-02-PLAN.md — Wave 2: utils/klassen.ts async + deleteStudent + migratie
- [ ] 12-03-PLAN.md — Wave 2: utils/leerlijnen.ts async + datamodel.ts deprecatie
- [ ] 12-04-PLAN.md — Wave 3: tests/storage.test.ts (STO-01..STO-04)

### Phase 13: Bestandstoegang
**Goal**: Mentor kan PDFs, Excel-bestanden en zip-backups aanleveren via drag-drop of OS bestandsdialoog in de Tauri app — de parsers verwerken de bestanden identiek als voorheen
**Depends on**: Phase 12
**Requirements**: IMP-01, IMP-02, IMP-03
**Success Criteria** (what must be TRUE):
  1. Mentor kan één of meerdere PDF-bestanden naar het import-gebied slepen of via "Bestand kiezen" selecteren — de klasoverzicht vult zich met de geïmporteerde leerlingen
  2. Mentor kan een .xls verzuim-Excel importeren via drag-drop of dialoog — verzuimdata verschijnt correct in de tegels
  3. Een bestaande zip.js-backup kan worden geïmporteerd in de nieuwe app en herstelt de klassendata volledig
**Plans**: TBD

### Phase 14: React UI
**Goal**: Klasoverzicht en detailweergave zijn volledig herschreven als React componenten — de mentor ziet en ervaart exact dezelfde functionaliteit als in de huidige app, inclusief zoeken, sorteren, klas wisselen en actiepunten
**Depends on**: Phase 13
**Requirements**: KOV-01, KOV-02, DET-V2-01, DET-V2-02
**Success Criteria** (what must be TRUE):
  1. Klasoverzicht toont alle leerlingtegels met aanwezigheidspercentage, verzuimbalk en rood/oranje/groen prognose — identiek aan de huidige app
  2. Zoeken op naam, sorteren op status en wisselen tussen klassen werken zonder pagina-reload in de React versie
  3. Detailweergave toont voortgang per deelgebied, verzuim, doorstroomprognose en notities — identiek aan de huidige app
  4. Actiepunten en feed forward zijn bewerkbaar en worden opgeslagen via de versleutelde store
**Plans**: TBD
**UI hint**: yes

### Phase 15: Packaging & Cross-platform
**Goal**: De app bouwt als installeerbare .exe (Windows 10/11) en .dmg (macOS 12+) die de eindgebruiker kan installeren zonder extra dependencies; de UI ziet er visueel identiek uit op beide platforms
**Depends on**: Phase 14
**Requirements**: PKG-01, PKG-02, PKG-03
**Success Criteria** (what must be TRUE):
  1. Windows .exe installer installeert de app op een schone Windows 10/11 machine — mentor kan direct starten zonder Rust, Node of Python te installeren
  2. macOS .dmg installeert de app op macOS 12+ — identiek werkend als op Windows
  3. UI-rendering is visueel equivalent op Windows (WebView2) en macOS (WebKit) — geen layout-breuken of kleurverschillen
**Plans**: TBD

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
| 10. Scaffold & Toolchain | 3/3 | Complete | 2026-05-13 |
| 11. TypeScript Migratie | 0/6 | Not started | - |
| 12. Versleutelde Opslag | 0/4 | Not started | - |
| 13. Bestandstoegang | 0/? | Not started | - |
| 14. React UI | 0/? | Not started | - |
| 15. Packaging & Cross-platform | 0/? | Not started | - |
