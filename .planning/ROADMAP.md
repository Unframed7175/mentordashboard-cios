# Roadmap: Mentordashboard CIOS — Dashboard 2

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-03-25) · [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Klasbeheer & Export** — Phases 6–8 (shipped 2026-04-23)
- ✅ **v1.2 Dashboard Redesign** — Phase 9 (shipped 2026-04-24)
- ✅ **v2.0 Stack Modernisering** — Phases 10–15 (shipped 2026-05-16)
- 🔄 **v2.1 Settings, Polish & Auto-class Detection** — Phases 16–19 (active)

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
- [x] **Phase 12: Versleutelde Opslag** — Leerlingdata wordt opgeslagen via plugin-store, versleuteld met AES-256-GCM en OS keychain sleutel; bestaande data gemigreerd; GDPR-verwijderfunctie werkt
 (completed 2026-05-14)
- [x] **Phase 13: Bestandstoegang** — Mentor kan PDFs, Excel-bestanden en zip-backups importeren via drag-drop én bestandsdialoog in de Tauri app *(completed 2026-05-14)*
- [x] **Phase 14: React UI** — Klasoverzicht en detailweergave zijn volledig herschreven als React componenten en tonen identieke informatie als de huidige app *(completed 2026-05-15)*
- [x] **Phase 15: Packaging & Cross-platform** — App bouwt als installeerbare .exe (Windows) en .dmg (Mac); UI ziet er identiek uit op beide platforms; eindgebruiker installeert zonder extra dependencies *(completed 2026-05-16)*

### v2.1 Settings, Polish & Auto-class Detection

- [ ] **Phase 16: Auto-class Detection** — Bij eerste import detecteert de app automatisch de klasnaam uit de PDF-header en maakt de klas aan zonder handmatige stap
- [ ] **Phase 17: Settings Panel Foundation** — Mentor kan via een settings-icoon dark mode activeren (volledig gestyled) en nieuwe bestanden toevoegen aan een bestaande klas
- [ ] **Phase 18: Settings Panel Advanced** — Mentor kan deelgebieden hernoemen/deactiveren, leerlijn-toewijzing aanpassen, verzuim-drempelwaarden en BPV-uren configureren
- [ ] **Phase 19: UI Polish** — Spiderweb chart tooltips, responsive layout en consistente hover-animaties zijn afgerond

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
- [x] 12-01-PLAN.md — Wave 1: Rust crypto commands (crypto.rs, Cargo.toml, lib.rs, capabilities)
- [x] 12-02-PLAN.md — Wave 2: utils/klassen.ts async + deleteStudent + migratie
- [x] 12-03-PLAN.md — Wave 2: utils/leerlijnen.ts async + datamodel.ts deprecatie
- [x] 12-04-PLAN.md — Wave 3: tests/storage.test.ts (STO-01..STO-04)
- [x] 12-05-PLAN.md — Gap closure: key-length guards, write-confirm guard, secure-storage capability (CR-01, CR-03, CR-04, WR-02)

### Phase 13: Bestandstoegang
**Goal**: Mentor kan PDFs, Excel-bestanden en zip-backups aanleveren via drag-drop of OS bestandsdialoog in de Tauri app — de parsers verwerken de bestanden identiek als voorheen
**Depends on**: Phase 12
**Requirements**: IMP-01, IMP-02, IMP-03
**Success Criteria** (what must be TRUE):
  1. Mentor kan één of meerdere PDF-bestanden naar het import-gebied slepen of via "Bestand kiezen" selecteren — de klasoverzicht vult zich met de geïmporteerde leerlingen
  2. Mentor kan een .xls verzuim-Excel importeren via drag-drop of dialoog — verzuimdata verschijnt correct in de tegels
  3. Een bestaande zip.js-backup kan worden geïmporteerd in de nieuwe app en herstelt de klassendata volledig
**Plans**: 2 plans

Plans:

**Wave 1**
- [x] 13-02-PLAN.md — ImportPage component: universal dropzone, batch PDF, Excel, backup restore

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 13-01-PLAN.md — App wiring: loadKlassen() at startup, ImportPage mount, document drop guard

### Phase 14: React UI
**Goal**: Klasoverzicht en detailweergave zijn volledig herschreven als React componenten — de mentor ziet en ervaart exact dezelfde functionaliteit als in de huidige app, inclusief zoeken, sorteren, klas wisselen en actiepunten
**Depends on**: Phase 13
**Requirements**: KOV-01, KOV-02, DET-V2-01, DET-V2-02
**Success Criteria** (what must be TRUE):
  1. Klasoverzicht toont alle leerlingtegels met aanwezigheidspercentage, verzuimbalk en rood/oranje/groen prognose — identiek aan de huidige app
  2. Zoeken op naam, sorteren op status en wisselen tussen klassen werken zonder pagina-reload in de React versie
  3. Detailweergave toont voortgang per deelgebied, verzuim, doorstroomprognose en notities — identiek aan de huidige app
  4. Actiepunten en feed forward zijn bewerkbaar en worden opgeslagen via de versleutelde store
**Plans**: 6 plans

Plans:

**Wave 0**
- [x] 14-01-PLAN.md — Wave 0: status.ts helper (berekenStatus, detectTraject) + status.test.ts

**Wave 1** *(blocked on Wave 0 completion)*
- [x] 14-02-PLAN.md — Wave 1: App.tsx routing + ImportPage onImportComplete prop + KlasTabStrip + KlasModal

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 14-03-PLAN.md — Wave 2a: KlasOverzicht (grid, search, sort, KPI strip) + LeerlingTegel
- [x] 14-04-PLAN.md — Wave 2b: DetailWeergave wrapper + header + DoortstroomPrognoseSection + VerzuimSection + VakkenSection
- [x] 14-05-PLAN.md — Wave 2c: FeedbackActiepuntenSection + SpiderChartCard + DeelgebiedenMatrix + NotitiesTextarea

**Gap Closure** *(depends on 14-04 + 14-05)*
- [x] 14-06-PLAN.md — Gap closure: AanvullendSection + StageSection + LeerlijnenSection (closes DET-V2-01 SC-3 gap)

Cross-cutting constraints:
- `npm test exits 0` required after every task
- `actiepuntenStore.add/update/remove()` must always be followed by `await saveKlassen()` (saveState() is a no-op since Phase 12)
- Spider chart axes must use `dg.label` as key (not `dg.id`) to match `student.deelgebiedScores` format
- Plans 14-03 and 14-04 both modify `src/App.tsx` — executor must apply 14-03 before 14-04

**UI hint**: yes

### Phase 15: Packaging & Cross-platform
**Goal**: De app bouwt als installeerbare .exe (Windows 10/11) en .dmg (macOS 12+) die de eindgebruiker kan installeren zonder extra dependencies; de UI ziet er visueel identiek uit op beide platforms
**Depends on**: Phase 14
**Requirements**: PKG-01, PKG-02, PKG-03
**Success Criteria** (what must be TRUE):
  1. Windows .exe installer installeert de app op een schone Windows 10/11 machine — mentor kan direct starten zonder Rust, Node of Python te installeren
  2. macOS .dmg installeert de app op macOS 12+ — identiek werkend als op Windows
  3. UI-rendering is visueel equivalent op Windows (WebView2) en macOS (WebKit) — geen layout-breuken of kleurverschillen
**Plans**: 2 plans

Plans:

**Wave 0**
- [ ] 15-01-PLAN.md — Wave 0: Cargo.toml metadata + entitlements.plist + tauri.conf.json bundle config (NSIS, macOS ad-hoc signing)

**Wave 1** *(blocked on Wave 0 completion)*
- [ ] 15-02-PLAN.md — Wave 1: Push repo to GitHub (human-action) + create .github/workflows/release.yml CI pipeline

Cross-cutting constraints:
- `npm test exits 0` required after Wave 0 config changes (43-test regression guard)
- `keychain-access-groups` must be ABSENT from entitlements.plist (ad-hoc signing — errSecMissingEntitlement risk)
- `permissions: contents: write` must be present at workflow level in release.yml (mandatory for GitHub Release creation)
- `APPLE_SIGNING_IDENTITY: '-'` must be in release.yml env block (prevents "app is damaged" on Apple Silicon)
- `ubuntu-latest` must NOT appear in CI matrix (Linux build not needed)

---

### Phase 16: Auto-class Detection
**Goal**: Mentor hoeft geen klas handmatig aan te maken voordat bestanden worden geïmporteerd — de app detecteert de klasnaam uit de PDF-header en maakt de klas automatisch aan bij de eerste import
**Depends on**: Phase 15
**Requirements**: ACD-01
**Success Criteria** (what must be TRUE):
  1. Wanneer geen klassen bestaan en de mentor een PDF importeert, verschijnt er geen foutmelding over een ontbrekende klas — de import slaagt direct
  2. Na de auto-detectie import staat de nieuwe klas als actief tabblad in de KlasTabStrip met de naam uit de PDF-header
  3. Als de PDF-header geen herkenbare klasnaam bevat, valt de app terug op een generieke naam (bijv. "Nieuwe klas") in plaats van te crashen
  4. Wanneer al klassen bestaan, verandert het import-gedrag niet — mentor kiest nog steeds de klas handmatig
**Plans**: 1 plan

Plans:
- [ ] 16-01-PLAN.md — Auto-detect + auto-create klas from PDF header, toast notification

**UI hint**: yes

### Phase 17: Settings Panel Foundation
**Goal**: Mentor kan via een settings-icoon een settings-pagina openen, dark mode activeren met een toggle (volledig gestyled in alle componenten), en nieuwe PDFs of een verzuim-Excel toevoegen aan een bestaande klas zonder de klas opnieuw aan te maken
**Depends on**: Phase 16
**Requirements**: SET-01, SET-02, POL-01
**Success Criteria** (what must be TRUE):
  1. Een settings-icoon is zichtbaar in de navigatiebalk; klikken opent de settings-pagina zonder verlies van de huidige klas-context
  2. De dark mode toggle in settings schakelt het dark theme in en uit — alle componenten (tegels, detailweergave, modal, spiderweb chart, deelgebieden matrix) zijn consistent gestyled via CSS-variabelen
  3. De gekozen dark/light voorkeur wordt persistent opgeslagen en hersteld bij herstart van de app
  4. Vanuit settings kan de mentor voor de actieve klas nieuwe PDFs en/of een verzuim-Excel uploaden — de bestaande klasdata blijft intact en wordt aangevuld
**Plans**: TBD
**UI hint**: yes

### Phase 18: Settings Panel Advanced
**Goal**: Mentor kan via de settings-pagina de deelgebieden, leerlijnen, verzuim-drempelwaarden en BPV-uren aanpassen aan de eigen klassituatie — wijzigingen zijn direct zichtbaar in het dashboard
**Depends on**: Phase 17
**Requirements**: SET-03, SET-04, SET-05, SET-06
**Success Criteria** (what must be TRUE):
  1. Mentor kan een deelgebied hernoemen — de nieuwe naam verschijnt direct in de deelgebieden-matrix en het spiderweb chart
  2. Mentor kan een deelgebied inactief zetten — het verdwijnt uit de matrix, het spiderweb chart en de prognose-berekening zonder dataverlies
  3. Mentor kan per deelgebied de leerlijn-toewijzing (lesgeven / organiseren / professioneel handelen) aanpassen — de doorstroomprognose herberekent direct
  4. Mentor kan aparte drempelwaarden instellen voor geoorloofd en ongeoorloofd verzuim — de RAG-status in klasoverzicht-tegels reflecteert de nieuwe grenswaarden
  5. Mentor kan het verwachte aantal BPV-uren configureren — de voortgangsindicatie voor stage past zich aan
**Plans**: TBD
**UI hint**: yes

### Phase 19: UI Polish
**Goal**: De visuele afwerking van het dashboard is professioneel en consistent — spiderweb chart is leesbaar met tooltips, het layout schaalt correct op kleinere schermen en hover-interacties animeren vloeiend
**Depends on**: Phase 18
**Requirements**: POL-02, POL-03, POL-04
**Success Criteria** (what must be TRUE):
  1. Hover over een punt in het spiderweb chart toont een tooltip met de naam van het deelgebied en de score — as-labels zijn leesbaar zonder overlap
  2. Dashboard (klasoverzicht + detailweergave) werkt correct op vensterbreedtes vanaf 1024px — geen horizontale scroll, geen afgekapte inhoud
  3. KPI tiles, leerling-tegels en nav-tabs hebben een subtiele hover-animatie (150–200ms ease) die consistent is door de hele app
**Plans**: TBD
**UI hint**: yes

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
| 11. TypeScript Migratie | 6/6 | Complete | 2026-05-14 |
| 12. Versleutelde Opslag | 5/5 | Complete | 2026-05-14 |
| 13. Bestandstoegang | 0/2 | Ready to execute | - |
| 14. React UI | 0/6 | Not started | - |
| 15. Packaging & Cross-platform | 0/2 | In progress | - |
| 16. Auto-class Detection | 0/TBD | Not started | - |
| 17. Settings Panel Foundation | 0/TBD | Not started | - |
| 18. Settings Panel Advanced | 0/TBD | Not started | - |
| 19. UI Polish | 0/TBD | Not started | - |
