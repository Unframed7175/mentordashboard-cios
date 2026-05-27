# Roadmap: Mentordashboard CIOS — Dashboard 2

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-03-25) · [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Klasbeheer & Export** — Phases 6–8 (shipped 2026-04-23)
- ✅ **v1.2 Dashboard Redesign** — Phase 9 (shipped 2026-04-24)
- ✅ **v2.0 Stack Modernisering** — Phases 10–15 (shipped 2026-05-16)
- ✅ **v2.1 Settings, Polish & Auto-class Detection** — Phases 16–19 (shipped 2026-05-19)
- ✅ **v2.2 Onboarding, Export & Data Completeness** — Phases 20–24 (shipped 2026-05-20) · [archive](.planning/milestones/v2.2-ROADMAP.md)
- 🔄 **v2.3 Inzicht, Configuratie & Testers Onboarden** — Phases 25–30 (active)

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

- [x] **Phase 16: Auto-class Detection** — Bij eerste import detecteert de app automatisch de klasnaam uit de PDF-header en maakt de klas aan zonder handmatige stap *(completed 2026-05-17)*
- [x] **Phase 17: Settings Panel Foundation** — Mentor kan via een settings-icoon dark mode activeren (volledig gestyled) en nieuwe bestanden toevoegen aan een bestaande klas (completed: 2026-05-17)
- [x] **Phase 18: Settings Panel Advanced** — Mentor kan deelgebieden hernoemen/deactiveren, leerlijn-toewijzing aanpassen, verzuim-drempelwaarden en BPV-uren configureren *(completed 2026-05-18)*
- [x] **Phase 19: UI Polish** — Spiderweb chart tooltips, responsive layout en consistente hover-animaties zijn afgerond (completed 2026-05-19)

<details>
<summary>✅ v2.2 Onboarding, Export & Data Completeness (Phases 20–24) — SHIPPED 2026-05-20</summary>

- [x] **Phase 20: Drag-and-Drop Fix** — Bestanden slepen op het importveld werkt correct voor PDF, .xls en zip-bestanden *(completed 2026-05-19)*
- [x] **Phase 21: Print-to-PDF Export** — Mentor kan een mentorgesprekverslag afdrukken als A4-PDF vanuit de detailweergave *(completed 2026-05-19)*
- [x] **Phase 22: BPV Stage Excel Parser** — App leest echte BPV-uren uit het stage Excel bestand per leerling, inclusief per-placement breakdown *(completed 2026-05-20)*
- [x] **Phase 23: Rekenen & Nederlands** — Mentor kan Rekenen en Nederlands voortgang apart bijhouden met eigen doorstroomnorm *(completed 2026-05-20)*
- [x] **Phase 24: Onboarding Wizard** — Eerste-keer mentor doorloopt een stap-voor-stap wizard om de app volledig in te stellen *(completed 2026-05-20)*

</details>

### v2.3 Inzicht, Configuratie & Testers Onboarden

- [x] **Phase 25: Doorstroomnorm Configuratie** — Mentor kan alle doorstroomdrempels instellen in de settings en deze worden opgeslagen tussen sessies
 (completed 2026-05-21)

- [x] **Phase 26: Tegel Score-telling & Fase-vergelijking** — Klasoverzicht-tegels tonen score-telling en een trend-pijl als beide fases aanwezig zijn *(completed 2026-05-23)*
- [x] **Phase 27: Klasbeheer** — Mentor kan lege klassen verwijderen en bestaande klassen hernoemen zonder dataverlies *(completed 2026-05-26)*
- [x] **Phase 28: Bug/Feedback Rapportage** — Mentor of tester kan met één klik een vooringevulde bugmelding e-mailen inclusief OS/versie en console errors (completed 2026-05-27)
- [ ] **Phase 29: UI Streamlining & Bugfixes** — Consistente spacing/typografie door de hele app, opgeschoond klasoverzicht en twee cosmetic bugfixes
- [ ] **Phase 30: Documentatie, Help & CI** — In-app helppagina, uitgebreide INSTRUCTIES.md voor testers, en GitHub Actions CI builds op Windows en macOS

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

- [x] 16-01-PLAN.md — Auto-detect + auto-create klas from PDF header, toast notification

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

**Plans**: 4 plans
**UI hint**: yes

Plans:
**Wave 1**

- [x] 17-01-PLAN.md — CSS foundation: body.dark selector swap + section 24 (SettingsPage layout, toggle switch styles)
- [x] 17-02-PLAN.md — utils/settings.ts helper + SettingsPage component + SettingsPage.test.tsx (SET-01, POL-01)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 17-03-PLAN.md — App.tsx 4th view wiring + main.tsx startup hydration + KlasTabStrip gear icon + KlasTabStrip.test.tsx (SET-01, SET-02)

**Gap Closure** *(depends on 17-03)*

- [x] 17-04-PLAN.md — Gap closure: dark mode coverage for DeelgebiedenMatrix headers, score chips, gap badges (POL-01)

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

**Plans**: 5 plans
**UI hint**: yes

Plans:

**Wave 0**

- [x] 18-01-PLAN.md — Failing test scaffolds for SET-03/04/05/06 (deelgebieden, verzuimDrempels, bpv, leerlijnen sync, status/prognosis extensions)

**Wave 1** *(blocked on Wave 0)*

- [x] 18-02-PLAN.md — Utility layer: utils/deelgebieden.ts + utils/verzuimDrempels.ts + utils/bpv.ts + getLeerlijnenMappingSync + main.tsx pre-warm

**Wave 2** *(blocked on Wave 1)*

- [x] 18-03-PLAN.md — Backend logic refactor: berekenPrognose activeDeelgebiedenIds + sync mapping fix + berekenStatus internal sync threshold + VerzuimSection runtime threshold
- [x] 18-04-PLAN.md — SettingsPage section 3 (Deelgebieden & Leerlijnen table + inline confirmation) + CSS section 25 (deelgebieden subset)

**Wave 3** *(blocked on Wave 2 — shared files: SettingsPage.tsx + index.css)*

- [x] 18-05-PLAN.md — SettingsPage section 4 (thresholds + BPV) + CSS section 25 (remaining) + DeelgebiedenMatrix/SpiderChartCard active filter + BpvProgressSection + DetailWeergave wiring

Cross-cutting constraints:

- Every save handler MUST pair store.set + store.save (Phase 12 pitfall)
- prognosis.ts MUST use getLeerlijnenMappingSync (never call getLeerlijnenMapping without await — RESEARCH Critical Discovery §1)
- Score key in DeelgebiedenMatrix + SpiderChartCard MUST remain original dg.label (Pitfall 3)
- BPV Excel parser is STUBBED (D-13 unresolved — user must provide sample file before real parser implementation)

### Phase 19: UI Polish

**Goal**: De visuele afwerking van het dashboard is professioneel en consistent — spiderweb chart is leesbaar met tooltips, het layout schaalt correct op kleinere schermen en hover-interacties animeren vloeiend
**Depends on**: Phase 18
**Requirements**: POL-02, POL-03, POL-04
**Success Criteria** (what must be TRUE):

  1. Hover over een punt in het spiderweb chart toont een tooltip met de naam van het deelgebied en de score — as-labels zijn leesbaar zonder overlap
  2. Dashboard (klasoverzicht + detailweergave) werkt correct op vensterbreedtes vanaf 1024px — geen horizontale scroll, geen afgekapte inhoud
  3. KPI tiles, leerling-tegels en nav-tabs hebben een subtiele hover-animatie (150–200ms ease) die consistent is door de hele app

**Plans**: 4 plans
**UI hint**: yes

Plans:

**Wave 1**

- [x] 19-01-PLAN.md — Update spider tests for JSX return type (RED scaffold for Plan 03) (POL-02)
- [x] 19-02-PLAN.md — CSS brand tokens, Industry font @font-face, Material shadows, focus-ring rgba fixes, 4 hover gaps (POL-04)

**Wave 2** *(blocked on 19-01 + 19-02)*

- [x] 19-03-PLAN.md — Spider chart JSX refactor + tooltip + .spider-card responsive (POL-02, POL-03)

**Wave 3** *(blocked on 19-02 + 19-03; has user checkpoints)*

- [x] 19-04-PLAN.md — Dark mode lift to App.tsx, settings slide-in animation, KlasTabStrip logo + nav diagonal stripe, .aanvullend-grid responsive fix (POL-03, POL-04)

---

### Phase 20: Drag-and-Drop Fix

**Goal**: Mentor kan bestanden slepen op het importveld en de app verwerkt ze correct — PDF, .xls en zip worden allemaal herkend zonder dat de browser navigeert weg van de pagina
**Depends on**: Phase 19
**Requirements**: BUG-01
**Success Criteria** (what must be TRUE):

  1. Mentor sleept een voortgang PDF op het importveld — de leerling verschijnt in de klasoverzicht zonder foutmelding
  2. Mentor sleept een .xls verzuim-Excel op het importveld — verzuimdata verschijnt correct in de tegels
  3. Mentor sleept een zip-backup op het importveld — de klasdata wordt hersteld zonder browse-navigatie
  4. Per ongeluk slepen buiten het importveld navigeert de browser niet weg van de app

**Plans**: 1 (20-01 complete)

### Phase 21: Print-to-PDF Export

**Goal**: Mentor kan vanuit de detailweergave van een leerling een mentorgesprekverslag afdrukken als A4-PDF via de browser print-dialoog — het verslag is compleet, correct opgemaakt en bevat alle gespreksrelevante informatie
**Depends on**: Phase 20
**Requirements**: EXP-01, EXP-02, EXP-03, EXP-04
**Success Criteria** (what must be TRUE):

  1. Een "Afdrukken" knop is zichtbaar in de detailweergave — klikken opent de browser print-dialoog zonder extra stappen
  2. Het afgedrukte verslag bevat leerlingnaam, datum, klasnaam, doorstroomprognose (rood/oranje/groen), voortgang per deelgebied, verzuimcijfers en actiepunten
  3. Het verslag past op A4 papier — geen afgekapte inhoud, geen horizontale scroll, correcte paginering bij meerdere pagina's
  4. RAG-kleuren (rood/oranje/groen) van de doorstroomprognose zijn zichtbaar in het afgedrukte verslag

**Plans**: 1 plan

Plans:

- [x] 21-01-PLAN.md — Print-only header + Afdrukken button + A4 print CSS

**UI hint**: yes

### Phase 22: BPV Stage Excel Parser

**Goal**: App leest werkelijke BPV-uren per leerling uit het stage Excel bestand en toont de voortgang t.o.v. het geconfigureerde doelaantal uren — zonder crash als geen stage-bestand is geïmporteerd
**Depends on**: Phase 20
**Requirements**: BPV-01, BPV-02, BPV-03, BPV-04
**Success Criteria** (what must be TRUE):

  1. Mentor importeert het stage Excel bestand via de importpagina — de BPV-sectie in de detailweergave toont werkelijke uren voor die leerling
  2. De BPV voortgangsindicatie toont gerealiseerde uren t.o.v. het geconfigureerde doelurenaantal (bijv. "120 / 200 uren")
  3. Wanneer geen stage-bestand is geïmporteerd, toont de BPV-sectie "Nog geen stage-data" — de app crasht niet
  4. Het stage Excel bestand wordt herkend en apart gerouteerd van het verzuim-Excel bestand op basis van bestandsnaam

**Plans**: TBD

**Note**: Column matchers for BPV-01 are partially blocked — scaffold and routing proceed, but exact column names require a real BPV Excel export file. `gerealiseerdeUren` will show 0 until the sample file is provided and `debugBpvExcel()` is run.

### Phase 23: Rekenen & Nederlands

**Goal**: Mentor kan per leerling de Rekenen en Nederlands voortgang inzien in de detailweergave, elk met een eigen doorstroomnorm los van de deelgebieden-prognose
**Depends on**: Phase 20
**Requirements**: RNL-01, RNL-02, RNL-03, RNL-04
**Success Criteria** (what must be TRUE):

  1. De detailweergave toont een aparte sectie voor Rekenen met de score van die leerling en een groen/rood status op basis van de MBO-3 norm (2F voldoende)
  2. De detailweergave toont een aparte sectie voor Nederlands met de score van die leerling en een groen/rood status op basis van de MBO-3 norm (2F voldoende)
  3. Rekenen en Nederlands scores worden automatisch ingelezen uit de bestaande voortgang PDFs — geen apart bestand vereist
  4. Als een PDF geen Rekenen/Nederlands sectie bevat, toont de sectie "Geen data" — de rest van de detailweergave blijft intact

**Plans**: 2 plans

Plans:

**Wave 1**

- [ ] 23-01-PLAN.md — normalizeRekenScore() in utils/schema.ts + JSDoc fields in utils/datamodel.ts (RNL-01, RNL-02, RNL-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 23-02-PLAN.md — RekenenNederlandsSection component + DetailWeergave mount (RNL-01, RNL-02, RNL-03, RNL-04 scaffold)

**Note**: RNL-04 (PDF extraction) is partially blocked — the data model and manual-entry UI path proceed without a sample PDF. Extraction is additive: `rekenResultaat` and `nederlandsResultaat` default to `null` if the PDF section is absent.

### Phase 24: Onboarding Wizard

**Goal**: Een mentor die de app voor het eerst opent doorloopt een stap-voor-stap wizard die alle benodigde data compleet aanlevert — daarna opent het dashboard direct met de nieuwe klas geladen
**Depends on**: Phase 20 (drag-drop fix required); Phase 21, 22, 23 recommended but not hard-blocked
**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, ONB-05, ONB-06, ONB-07, ONB-08
**Success Criteria** (what must be TRUE):

  1. Bij eerste start zonder klassen opent de app in de onboarding wizard — het dashboard is niet toegankelijk tot de wizard is voltooid of afgebroken
  2. Mentor voltooit stap 1 (klasnaam) en stap 2 (PDFs) — daarna is het dashboard direct bruikbaar met de geïmporteerde leerlingen
  3. Stappen 3 (verzuim Excel), 4 (stage Excel) en 5 (instellingen) kunnen elk worden overgeslagen — de wizard blokkeert niet op optionele data
  4. Na voltooiing van de wizard opent het dashboard met de nieuwe klas als actief tabblad en alle geïmporteerde data zichtbaar
  5. Bij een tweede start (klassen aanwezig) toont de app geen wizard — de mentor komt direct in het dashboard

**Plans**: 2 plans
Plans:

- [ ] 24-01-PLAN.md -- OnboardingWizard component (5 steps) + CSS classes
- [ ] 24-02-PLAN.md -- App.tsx wiring, first-run detection, commit

**UI hint**: yes

---

### Phase 25: Doorstroomnorm Configuratie

**Goal**: Mentor kan alle doorstroomdrempels (SBL, SBC, negatief totaal, negatief per leerlijn, BJ1 versneld-SBC) aanpassen in de settings — wijzigingen zijn persistent en de prognose-engine past zich direct aan
**Depends on**: Phase 24
**Requirements**: NORM-01, NORM-02, NORM-03, NORM-04, NORM-05, NORM-06, NORM-07
**Success Criteria** (what must be TRUE):

  1. De settings-pagina heeft een sectie "Doorstroomdrempels" met invoervelden voor SBL-drempel (≥V), SBC-drempel (≥V), negatief-drempel totaal (O), negatief-drempel per leerlijn (O) en BJ1 versneld-SBC drempels
  2. Na het aanpassen van een drempel herberekent de doorstroomprognose van alle leerlingen in de klasoverzicht direct — de RAG-tegel-kleuren updaten zonder pagina-herstart
  3. Ingestelde drempels overleven een app-herstart — bij heropenen staan de aangepaste waarden nog in de invoervelden
  4. Een "Herstel standaard"-knop zet alle drempelwaarden terug naar de CIOS-normen (SBL ≥13, SBC ≥15, >6 O totaal, >2 O per leerlijn) en herberekent de prognose

**Plans**: 4 plans
**UI hint**: yes

Plans:
**Wave 1**

- [x] 25-01-PLAN.md � Wave 1: RED tests for utils/normen.ts (new file) + tests/prognosis.normen.test.ts (new isolated file, does NOT modify prognosis.test.ts) (NORM-01..07)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 25-02-PLAN.md � Wave 2: utils/normen.ts (LazyStore + Number.isFinite validation + field-level logging + saveNormen failure logging) + utils/prognosis.ts refactor (8 hardcoded sites to normen.*) � turns Plan 01 RED tests GREEN

**Wave 3** *(blocked on Wave 2 completion � Plans 03 and 04 can run in parallel)*

- [x] 25-03-PLAN.md � Wave 3a: main.tsx pre-warm + App.tsx onNormenChanged wiring + SettingsPage Section 5 (8 inputs, SBC<SBL warning, reset, persistence-failure logging) + CSS rules + SettingsPage.test.tsx Section 5 coverage + human-verify checkpoint
- [x] 25-04-PLAN.md � Wave 3b: DoortstroomPrognoseSection.tsx parameterization � replace hardcoded norm text with getNormenSync() reads (NORM-01..05)

### Phase 26: Tegel Score-telling & Fase-vergelijking

**Goal**: Elke leerlingtegel in het klasoverzicht toont hoeveel deelgebieden voldoende/onvoldoende zijn, en een pijl geeft de trend t.o.v. fase 1 aan — alleen als beide fases aanwezig zijn
**Depends on**: Phase 25
**Requirements**: TEGEL-01, TEGEL-02, TREND-01, TREND-02, TREND-03, TREND-04
**Success Criteria** (what must be TRUE):

  1. Iedere tegel van een leerling met scores toont onder de status-badge een telling zoals "14/19 ≥V · 1 O"
  2. Een tegel zonder scores (grijs / Onbekend) toont geen score-telling — de telling wordt verborgen
  3. Als zowel fase 1 als fase 2 voor een leerling zijn geïmporteerd en de prognose is verbeterd (bijv. rood naar oranje), toont de tegel een pijl omhoog (↑)
  4. Als de prognose verslechterd is t.o.v. fase 1, toont de tegel een pijl omlaag (↓) — bij gelijke prognose verschijnt geen pijl

**Plans**: 2 plans
**UI hint**: yes

Plans:

**Wave 1**

- [x] 26-01-PLAN.md � CSS classes (.score-telling, .trend-pijl, .trend-op, .trend-neer) + LeerlingTegel trend prop + score-telling render (TEGEL-01, TEGEL-02)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 26-02-PLAN.md � KlasOverzicht trendMap useMemo + trend prop wiring to LeerlingTegel (TREND-01, TREND-02, TREND-03, TREND-04)

### Phase 27: Klasbeheer

**Goal**: Mentor kan lege klassen direct verwijderen vanuit de tab-strip en elke klas hernoemen zonder de bijbehorende leerlingdata te verliezen
**Depends on**: Phase 24
**Requirements**: KLS-01, KLS-02, KLS-03
**Success Criteria** (what must be TRUE):

  1. Een klas-tabblad met 0 leerlingen toont een "Verwijder klas"-knop — klikken verwijdert de klas na bevestiging en de tab verdwijnt
  2. Mentor kan dubbelklikken op een klas-tab (of een rename-icoon gebruiken) om de klasnaam in-place te bewerken en op te slaan
  3. Na hernoemen is de nieuwe klasnaam direct zichtbaar in de tab-strip, de KPI-header en alle andere plekken in de app — zonder dataverlies

**Plans**: 2 plans
**UI hint**: yes

Plans:

**Wave 1**

- [ ] 27-01-PLAN.md � renameKlas() utility function + RNM-01/RNM-02 unit tests (KLS-02, KLS-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 27-02-PLAN.md � KlasTabStrip hover � delete + double-click inline rename + KlasOverzicht cleanup + CSS (KLS-01, KLS-02, KLS-03)

### Phase 28: Bug/Feedback Rapportage

**Goal**: Elke tester of mentor kan met één klik een vooraf ingevulde bugmelding e-mailen — OS, app-versie, laatste import-actie en console errors worden automatisch meegestuurd
**Depends on**: Phase 24
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04, FEED-05
**Success Criteria** (what must be TRUE):

  1. Een "Fout melden" of "Feedback"-knop is zichtbaar vanuit elke view (nav, footer of persistent floating button)
  2. Klikken opent de standaard e-mailapp met het ontwikkelaar-e-mailadres vooringevuld in het Aan-veld
  3. De e-mailbody bevat automatisch OS-naam, OS-versie, app-versie en de bestandsnaam/type van de laatste import-actie
  4. De e-mailbody bevat de laatste 5–10 console errors die de app heeft gelogd
  5. Het onderwerp-veld of het begin van de body is leeg of bevat een uitnodiging voor de tester om het probleem te beschrijven

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 28-01-PLAN.md — utils/feedback.ts (ring buffer, setLastImport, buildMailtoUrl) + main.tsx console patches + TDD tests

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 28-02-PLAN.md — FeedbackModal UI + KlasTabStrip wiring + App.tsx state + ImportPage.tsx setLastImport calls

**UI hint**: yes

### Phase 29: UI Streamlining & Bugfixes

**Goal**: Het dashboard heeft consistente spacing en typografie door alle views, het klasoverzicht oogt opgeschoond, dark mode heeft geen witte vlekken meer, en twee bekende cosmetic bugs zijn opgelost
**Depends on**: Phase 24
**Requirements**: UI-01, UI-02, UI-03, UI-04, FIX-01, FIX-02
**Success Criteria** (what must be TRUE):

  1. Section-titels, body-tekst, labels en badges gebruiken consistente font-sizes en line-heights door alle views (klasoverzicht, detailweergave, settings, help)
  2. Het klasoverzicht heeft duidelijke visuele hiërarchie — minder drukke tegels, voldoende witruimte, onderscheidbare elementen
  3. Dark mode toont geen witte vlekken of slecht leesbare tekst in welke view dan ook
  4. Tab-navigatie en view-wissels hebben een subtiele CSS-transitie (150–200ms)
  5. De nav diagonal stripe (`::after` pseudo-element) is correct zichtbaar in de Tauri WebView op Windows
  6. De BPV-sectie toont "Laden..." terwijl een import bezig is, en "Geen BPV-data geïmporteerd" als er geen stage-bestand is — niet hetzelfde bericht voor beide toestanden

**Plans**: TBD
**UI hint**: yes

### Phase 30: Documentatie, Help & CI

**Goal**: Collega-testers kunnen de app installeren en gebruiken zonder hulp van de ontwikkelaar — er is een in-app helppagina, een uitgebreide INSTRUCTIES.md en een GitHub Actions CI die automatisch bouwt op Windows en macOS
**Depends on**: Phase 25, Phase 26, Phase 27, Phase 28, Phase 29 (features stable before documentation)
**Requirements**: HELP-01, HELP-02, HELP-03, HELP-04, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):

  1. Een "?"-knop of "Help"-link in de navigatie opent een in-app helppagina met een stap-voor-stap uitleg van importeren, bekijken en afdrukken
  2. `INSTRUCTIES.md` in de repo-root beschrijft installatie, eerste gebruik, importstappen, bekende beperkingen en hoe een bug te melden
  3. GitHub Actions CI bouwt de app succesvol op Windows x64 en macOS Apple Silicon bij elke push naar main — zonder handmatige tussenkomst
  4. `TESTPLAN.md` bevat stap-voor-stap scenario's met verwacht gedrag zodat testers zelfstandig kunnen verifiëren dat de app correct werkt

**Plans**: TBD
**UI hint**: yes

---

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
| 13. Bestandstoegang | 2/2 | Complete | 2026-05-14 |
| 14. React UI | 6/6 | Complete | 2026-05-15 |
| 15. Packaging & Cross-platform | 2/2 | Complete | 2026-05-16 |
| 16. Auto-class Detection | 1/1 | Complete | 2026-05-17 |
| 17. Settings Panel Foundation | 4/4 | Complete | 2026-05-17 |
| 18. Settings Panel Advanced | 5/5 | Complete | 2026-05-18 |
| 19. UI Polish | 4/4 | Complete | 2026-05-19 |
| 20. Drag-and-Drop Fix | 1/1 | Complete | 2026-05-19 |
| 21. Print-to-PDF Export | 1/1 | Complete   | 2026-05-19 |
| 22. BPV Stage Excel Parser | 2/2 | Complete | 2026-05-20 |
| 23. Rekenen & Nederlands | 2/2 | Complete | 2026-05-20 |
| 24. Onboarding Wizard | 3/3 | Complete | 2026-05-20 |
| 25. Doorstroomnorm Configuratie | 4/4 | Complete    | 2026-05-22 |
| 26. Tegel Score-telling & Fase-vergelijking | 0/? | Not started | - |
| 27. Klasbeheer | 0/? | Not started | - |
| 28. Bug/Feedback Rapportage | 2/2 | Complete   | 2026-05-27 |
| 29. UI Streamlining & Bugfixes | 0/? | Not started | - |
| 30. Documentatie, Help & CI | 0/? | Not started | - |
