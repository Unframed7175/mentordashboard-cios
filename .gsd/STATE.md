# STATE.md — Mentordashboard CIOS

> Laatste update: 2026-09-14 — Fase 3 M41 afgerond (DESIGN.md + plan-design-review 5→9/10). Volgende: handmatige T0 + T1, daarna Fase 2.
---

## Handoff 2026-09-14 (Fase 3 → Fase 2)

Van: UI UX Pro Max + GStack — Fase 3 (design) — M41 "Uitrol naar collega's"
Naar: Superpowers — Fase 2 (executie)

**Status:** `.gsd/DESIGN.md` gegenereerd (search.py + bestaande tokens). `/plan-design-review` afgerond: 5/10 → 9/10, 21 besluiten in `S01-PLAN.md` § Design-specificatie (IA, staten, reis, microcopy, decoratie, Help-structuur, responsive/a11y, screenshots). Statische a11y-check: 6 contrastfouten → gecorrigeerde tokens + taak DT-A11Y. Pre-delivery checklist (DESIGN.md §10) toegepast op de spec: geen blokkerende bevindingen.

**Openstaand — moet Fase 2 weten:**
- **Fase 2 start pas ná T0 (koude-installatie-observatie) en T1 (auto-update-QA).** T1 faalt → terug naar Fase 0. T0 bepaalt standaard-tak "Open toch" vs "beschadigd" en verifieert NL-knopnamen in de microcopy.
- **Scope gegroeid door besluit 5A:** landingspagina gaat over op het app-design system (nieuwe P1-taak LP-SYS, Lane A begint daarmee). Ook nieuw: T9 (gebruikerssamenvatting op landingspagina), D4 herstructureert Help tot naslag.
- Lane-volgorde: A `T5 → LP-SYS → T2 → D1 → D3 → D5` (T5 in deze repo, rest in ander repo) · B `T3, T6, T9` · C `DT-A11Y → D4 → DT-ICON`.
- Mockups niet gemaakt (gstack designer zonder OpenAI-sleutel) → na LP-SYS/T2 `/design-review` op de live pagina.

**DoD Fase 3 afgevinkt:** DESIGN.md door search-script ✅ · `/plan-design-review` akkoord ✅ · pre-delivery checks zonder blokkers ✅ · statische a11y-check (fouten hersteld in DESIGN.md) ✅ · handoff ✅

---

## Handoff 2026-09-14 (Fase 1 → Fase 3)

Van: GSD — Fase 1 (spec) — M41 "Uitrol naar collega's"
Naar: UI UX Pro Max + GStack — Fase 3 (design), met handmatige T0/T1 parallel

**Status:** `.gsd/milestones/M41-uitrol-naar-collegas/S01-PLAN.md` geschreven (12 taken, gap-analyse t.o.v. juni verwerkt). Requirement F-16 toegevoegd aan `REQUIREMENTS.md`. ROADMAP: M41 → ACTIEF.

**Openstaand — moet de volgende fase weten:**
- **T1 (auto-update-QA) kan M41 terugsturen naar Fase 0**: als een update SmartScreen/Gatekeeper opnieuw triggert, vervalt de ADR-14-aanname. Voer T0 + T1 uit vóór Fase 2.
- **Fase 3-invulling besloten (projectlead, 2026-09-14): optie A** — `.gsd/DESIGN.md` nu genereren (neemt T-2026-06-12-02 mee), daarna `/plan-design-review` + statische a11y-check. Volledige Fase 3 DoD, geen afwijking.
- Landingspagina staat in apart repo `Unframed7175/ciosmentorendashboard`; ankers van `scripts/update-landing-page.mjs` mogen niet breken (T5).
- Nieuw gevonden: `INSTRUCTIES.md` linkt voor installatie nog naar de ruwe releases-pagina en zegt "Geen automatische updates" (onjuist sinds M40) → T3.

**DoD Fase 1 afgevinkt:** PROJECT.md + REQUIREMENTS.md ingevuld ✅ · milestone-map ✅ · S01-PLAN.md met concrete taken ✅ · UI-check: UI-taken aanwezig → Fase 3 ingepland vóór Fase 2 ✅ · handoff ✅

---

## Migration notice

### CLAUDE.md breaking change 2026-09-14 — v1.10.1 → v2.0.0
Actie vereist: bij het starten of afronden van een fase de betreffende sectie in `docs/workflow/STACK.md` lezen (zie tabel "Wanneer lees je wat" in CLAUDE.md) — de volledige DoD staat niet meer automatisch in context. Verwijzingen als "CLAUDE.md §7" in oudere LEARNINGS-bestanden lees je als "STACK.md §7".
Deadline: vóór start Fase 1 van M41

## Stack-check 2026-09-14

```
Stack-status:
  GSD           v1.42.3     ✓ (npm-latest)
  GStack        v1.84.1.0   ✓ (bijgewerkt van v1.58.1.0)
  Superpowers   v6.3.0      ✓
  UI UX Pro Max v2.2.3      ✓ (uipro-cli = npm-latest; skill aanwezig in .claude/skills/)
  Claude Mem    v13.24.23   ✓
```

## Handoff 2026-06-19 (Fase 0 → Fase 1)

Van: GStack — Fase 0 (office-hours + plan-eng-review + plan-design-review) — M41 "Uitrol naar collega's"
Naar: GSD — Fase 1 (spec / milestone-map `M001`-equivalent: `M41-uitrol-naar-collegas/`)

**Status:** Fase 0 DoD afgevinkt. M41 is een **content/distributie-milestone** (geen feature-werk). Kernbeslissing: **geen OS-code-signing**; handmatige install via één link + begeleide gids (zie ADR-14). Design doc: `~/.gstack/projects/Unframed7175-mentordashboard-cios/rafael-master-design-20260618-213848.md` (Status: APPROVED, bevat eng- + design-review-secties + GSTACK REVIEW REPORT).

**Belangrijkste bevinding:** ~80% bestaat al — `INSTRUCTIES.md` bevat de volledige installatiegids; landingspagina (`Unframed7175/ciosmentorendashboard`) bestaat met auto-update. M41 = die gids naar de pre-install landingspagina brengen + content-fixes.

**Taken voor S01-PLAN.md (uit eng + design review):**
- T1 (P1) — auto-update QA: Windows NSIS silent update triggert SmartScreen niet opnieuw; macOS geen re-prompt. **Kritieke verificatie vóór rollout.**
- T2/D2/D3 (P1) — landingspagina: installatiegids als canonieke pre-install-surface; OS-kies-eerst structuur; plain-language downloadknoppen (Apple Silicon/Intel, geen aarch64/x64).
- D1 (P1) — landingspagina: geruststelling-blok vóór elke OS-waarschuwingsscreenshot (vertrouwen-framing).
- T3 (P2) — `INSTRUCTIES.md`: verversen v2.4→huidig; macOS-commando → `xattr -cr`; linken naar landingspagina.
- T5 (P2) — regressietest in `tests/updateLandingPage.test.ts` voor de nieuwe install-sectie (anchors blijven matchen).
- D4 (P2) — `HelpPage.tsx`: post-install kleurlegenda + offline/encrypted-geruststelling (bestaande `index.css`-classes).
- D5 (P2) — landingspagina a11y: alt-text op screenshots, 44px OS-knoppen, ≥4.5:1 contrast, mobiele layout.
- T4 (P2) — bevestig landingspagina-URL is schoon/deelbaar.
- T6/T7 (P3) — Help post-install content; stale-landingspagina-detectie (TODO T-2026-06-18-17).

**NIET in scope:** code-signing (ADR-14 afwijzing B), CIOS IT/managed deploy (C), ci.yml signed-build (TODO T-2026-06-18-05), cross-machine backup (TODO T-2026-06-12-01), DESIGN.md-generatie (TODO T-2026-06-12-02).

**DoD afgevinkt:** office-hours ✅, plan-eng-review ✅ (2 issues opgelost, 1 kritieke verify-gap T1), plan-design-review ✅ (5/10→8/10, 2 beslissingen), ADR-14 ✅, handoff ✅.

**Let op (platform):** review-log/tasks-JSONL/design-doc-rapport-append zijn tijdens deze sessie deels niet weggeschreven door een tijdelijke classifier-outage (geen inhoudelijk verlies — alles staat in design doc + dit handoff). Niet-blokkerend.

---

## Correctie 2026-06-18: M39-nummering rechtgezet in ROADMAP.md
ROADMAP.md claimde M39 = "Uitrol naar collega's" (vastgelegd in commit `cb53378`), maar het daaropvolgende werk
("prognose-verdieping") is zelf onder de naam M39 gereleased (commit `772e823`, v2.10.0) zonder ROADMAP.md
terug te corrigeren — geen van beide had een milestone-map of S01-PLAN.md. ROADMAP.md is nu rechtgezet:
M39 = prognose-verdieping (zoals daadwerkelijk gereleased), M40 = auto-update-systeem (nieuw genummerd, had
nog geen M-nummer), "Uitrol naar collega's" verschoven naar M41 met status WACHT (was ten onrechte ACTIEF
gemarkeerd zonder dat er ooit Fase 0/1-werk voor is gestart).

## Afwijking 2026-06-15: kleine bugfix / bounded refactor
Reden: M38 raakt 2 bestanden (leerlijn.json nieuw + schema.ts import), architectuur al besloten in M35-planning — Fase 0 niet vereist.

## Huidige fase

**Fase 2 · Executie — M41-uitrol-naar-collegas (ACTIEF, wacht op T0 + T1)** — Fase 3 afgerond 2026-09-14.
Plan: `.gsd/milestones/M41-uitrol-naar-collegas/S01-PLAN.md`. Eerst handmatig T0 (koude installatie bij één collega) en T1 (auto-update-QA Windows + macOS).

## Handoff 2026-06-18

Van: GStack/Superpowers — Fase 4 (review & ship M40) + GSD (tracking-reconciliatie)
Naar: GStack — Fase 0 (volgende milestone)
Status: M40 (auto-update-systeem) DONE en gereleased als v2.11.0. `ci.yml`-bugfix + branch protection op `master` ook gemerged (PR #1, `022a0e9`). `master` en `origin/master` zijn gelijk. GSD-tracking (dit bestand + ROADMAP.md) was 3 milestones achter en is nu rechtgezet.
Openstaand: M41 "Uitrol naar collega's" heeft nog geen `/office-hours`-sessie, geen ADR, geen scope. `ci.yml`'s build-job-signingfout (TODOS.md T-2026-06-18-05) vereist een projectlead-besluit voordat hij wordt opgepakt.
DoD afgevinkt: M40 Fase 4-DoD **ja** (review ✅, security scan ✅ 0 vulnerabilities, tests 447/452 groen, CHANGELOG-entry ✅, versiebump ✅, handoff geschreven ✅). M41 Fase 0 **nog niet gestart**.

---

## Milestone afgerond 2026-06-18
- **Versie:** 2.11.0
- **Milestone:** M40-auto-update-systeem — status **DONE**
- **Inhoud:** in-app updater via `tauri-plugin-updater` (Ed25519-signature-verificatie, vervangt GitHub-API-polling), `UpdateModal` (opstart + handmatige check in Instellingen), gesigneerde releases met CHANGELOG-gebaseerde release-body, automatische landingspagina-update na elke release.
- **Uitgevoerd via:** Superpowers Fase 2 (TDD, subagent-driven, geen GSD-milestone-map — design/plan staan in `docs/superpowers/specs/2026-06-17-auto-update-systeem-design.md` en `docs/superpowers/plans/`).
- **Fase 4 (deze sessie, 2026-06-18):** 8-angle parallelle code review op de volledige diff → 4 bevestigde correctheidsbugs gefixt (foutverzwelging in `checkForUpdate()` toonde ten onrechte "up to date"; ontbrekende CHANGELOG-versie-validatie tegen git tag; ongeëscapete HTML-injectie in landingspagina-script; stilzwijgend verlies van onbekende changelog-secties) + 2 kleinere fixes (Escape-toets, foutlogging). `npm audit` high-severity vite-kwetsbaarheid gefixt. CHANGELOG-entry + versiebump. 447/452 tests groen (5 skipped).
- **Bijvangst:** `ci.yml` triggerde op een niet-bestaande branch ("main" i.p.v. "master") — CI heeft hierdoor nog nooit gedraaid. Gefixt + losse snelle `test`-job toegevoegd (PR #1, `022a0e9`). Branch protection op `master` ingesteld: PR verplicht, `test`-check verplicht en up-to-date, `enforce_admins` aan (voorkomt herhaling van een directe push naar master die deze sessie per ongeluk gebeurde vóór de protection er was). 0 verplichte reviewers (solo-maintainer-repo — GitHub laat geen self-approval toe).
- **Backlog (niet-blokkerend, zie TODOS.md):** T-2026-06-18-01 t/m -05 — gedupliceerde UpdateModal-wiring, gesplitste update-statevariabelen, vierde modal-scaffold-duplicatie, Cargo.toml-versiedrift, `ci.yml` build-job mist signing-secrets.

## Milestone afgerond 2026-06-17
- **Versie:** 2.10.0–2.10.2
- **Milestone:** M39-prognose-verdieping — status **DONE**
- **Inhoud:** S/C-compensatieformule voor cijferaggregatie, uitgebreide BJ1/BJ2-doorstroomcriteria, keuzedelen-basisjaar-classificatie, inlever-tellers in prognosekaart; twee bugfixes (BJ1-datapunten zonder status telden onterecht mee; sportvakken-tabel corrumpeerde deelgebiedscores).
- **Uitgevoerd zonder GSD-milestone-map** — geen S01-PLAN.md, rechtstreeks via commits `772e823`/`aa97950`/`7c565aa`. Zie Correctie 2026-06-18 hierboven voor de nummeringsgeschiedenis.

## Milestone afgerond 2026-06-15
- **Versie:** 2.8.0
- **Milestone:** M037-schema-configurabiliteit — status **DONE**

---

## Huidige fase (vorige)

**Fase 2 · Executie — M037-schema-configurabiliteit (DONE)**

Fase 2 start: 2026-06-14
Eng review: CLEARED 2026-06-14 | Design review: CLEARED 2026-06-14
Plan: `.gsd/milestones/M037-schema-configurabiliteit/S01-PLAN.md`

| ID | Taak | Status |
|---|---|---|
| T0 | Handmatige pre-flight (Rafael) | ✅ N/A — 19 kolommen bevestigd via MIN_COLUMN_WARN_THRESHOLD=5 |
| T1 | M35-3: isHeaderRow positie-gebaseerd | ✅ ed93784 |
| T2 | M35-2: buildColumnMap open-world | ✅ ed93784 |
| T3 | M35-4: VAK_HEADINGS → font-size | ✅ ed93784 |
| T4 | M35-5: unknownLabels doorvoeren | ✅ ed93784 |
| T-DS1 | DriftBanner component in ImportPage | ✅ ed93784 |
| T-DS2 | DriftBanner CSS in index.css §22 | ✅ ed93784 |

Testsuite: 400/400 groen | Commit: ed93784 | Fase 2 klaar → Fase 4 ready

---

**Fase 4 · Review & ship — M36-fabrieksreset (DONE)**

Fase 4 voortgang (2026-06-13):
- T1 ✅ backup-payload v2 (store-snapshot + restore-semantiek + reloadRequired)
- T2 ✅ reload alléén na v2-overschrijven-restore (ImportPage + injecteerbare reloadFn)
- T3 ✅ factoryReset() met bindende volgorde en intact faalpad
- T4 ✅ Gevarenzone-sectie + WisDialoog in SettingsPage
- DT1 ✅ dialoog-states conform states-tabel (wissenBezig / backupExporting / fout)
- DT2 ✅ a11y: focus-on-open, ESC sluit, Enter geblokkeerd, TAB focus trap
- T5 ✅ dode clearState() verwijderd uit utils/datamodel.ts
- Code review ✅ (42f5744) — 4 auto-fixes + 2 user-approved fixes
- Security scan ✅ — 0 vulnerabilities
- CHANGELOG ✅ — [2.7.0] entry aanwezig
- Versie bump ✅ — package.json + tauri.conf.json → 2.7.0
- M36-LEARNINGS.md ✅
- Automatische QA ✅ — 17/17 checks groen (scripts/qa-m36.mjs):
  - T6 scenario 1 ✅: wizard zichtbaar bij lege store (onboarding na reset)
  - WisDialoog DOM/ARIA ✅: role, aria-modal, aria-labelledby, focus, disabled-state, ESC
  - axe-core WCAG AA ✅: geen critical/serious violations in dialoog
- T6 scenario 2 ⬜: backup-restore cycle — vereist echte Tauri-build (handmatig)
- DT3 ⬜: dark-mode dialoog visueel — vereist echte Tauri-build (handmatig)

Testsuite: 390 passed | 5 skipped (was 388 — +2 TAB focus trap tests DT2).

## Handoff 2026-06-12 (Fase 3 → Fase 2)

Van: UI UX Pro Max — Fase 3 (beperkt checkpoint)
Naar: Superpowers — Fase 2 (executie)
Status: Statische a11y-check geslaagd na concretisering. Alle contrasten ≥ 4.5:1: actieve wis-knop wit/`#DC2626` (4.83:1), disabled-knop `#7F1D1D`/`#FCA5A5` (5.28:1), dark mode `#FCA5A5`/`#450A0A` (8.51:1).
Openstaand: Lane A (T1→T2 backup v2) en Lane B (T3→T4→DT1→DT2 reset+UI) — TDD: RED → GREEN → REFACTOR; resultaten naar `S01-SUMMARY.md`. Lane C (T5) lift mee. **Bindend voor DT1/DT2-implementatie: disabled-knoptekst `#7F1D1D`, níét `var(--status-rood-text)`.** T6+DT3 zijn handmatige QA in Fase 4.
DoD afgevinkt: **ja** — design contract (UI-spec + wireframe) ✓, statische a11y-check geslaagd ✓, DESIGN.md-gat als TODO vastgelegd door projectlead (geen blokkade) ✓, handoff geschreven ✓

## Prioriteitsvolgorde

| Milestone | Status |
|---|---|
| M36-fabrieksreset | DONE — v2.7.0 (2026-06-13) |
| M37-schema-configurabiliteit | WACHT (voorheen "M35 — gepland"-taken, zie hieronder) |

## Handoff 2026-06-12

Van: GSD — Fase 1 (spec)
Naar: UI UX Pro Max — Fase 3 (beperkt checkpoint), daarna Superpowers — Fase 2 (executie)
Status: `S01-PLAN.md` compleet met 9 taken, lanes (A: T1→T2 backup · B: T3→T4→DT1→DT2 reset+UI · C: T5 micro · Fase 4: T6+DT3 handmatige QA), bindende beslissingen en succescriteria. ROADMAP.md aangemaakt. Map heet `M36-fabrieksreset/` (consistent met M35-naamgeving; eerdere handoff noemde `M036-`).
Openstaand: Fase 3-checkpoint — statische a11y-check op spec-kleuren (wit op `#DC2626` en donkere tekst op `#FCA5A5`, beide ≥ 4.5:1); daarna start Superpowers met Lane A en/of B (TDD: RED → GREEN → REFACTOR), resultaten naar `S01-SUMMARY.md`. Geen nieuwe secrets/deps → geen `.env.example`-wijziging nodig.
DoD afgevinkt: **ja** — PROJECT.md/REQUIREMENTS.md bestaan ✓, milestone-map + S01-PLAN.md ✓, UI-check uitgevoerd (Fase 3 ingepland) ✓, handoff geschreven ✓

## Handoff 2026-06-11

Van: GStack — Fase 0 (/office-hours)
Naar: GStack — Fase 0 vervolg (/plan-eng-review, daarna /plan-design-review)
Status: Oorzaak geverifieerd (installer schoon; app-data persisteert per machine). Premissen en aanpak B bevestigd door projectlead. ADR-13 vastgelegd. Design doc: `~/.gstack/projects/Unframed7175-mentordashboard-cios/rafael-master-design-20260611-213139.md` (APPROVED).
Openstaand: niets — Fase 0 DoD compleet. `/plan-eng-review` afgerond (2026-06-12, CLEAR: 6 issues besloten, 0 critical gaps, ADR-13a). `/plan-design-review` afgerond (2026-06-12, CLEAR: score 4→9, 5 besluiten: wireframe goedgekeurd als visuele referentie, states-tabel, a11y-spec, DESIGN.md-gat als TODO, dark-mode QA-check). Volgende stap: GSD Fase 1 — milestone-map `M036-fabrieksreset/` + S01-PLAN.md op basis van de 9 implementatietaken (T1-T6 eng + DT1-DT3 design) in het design doc.
DoD afgevinkt: **ja** — ADR aanwezig ✓, eng-review ✓ (2026-06-12), design-review ✓ (2026-06-12), handoff geschreven ✓

Volgende milestone na M36: M37 schema-configurabiliteit (zie "Milestone M35 — gepland" hieronder voor de oorspronkelijke parser-taken die nog open staan).

## Milestone afgerond 2026-06-10

- **Versie:** 2.6.0
- **Milestone:** M35-gebruikersfeedback — status **DONE**
- **Commits:** `c30b3f3` (T01–T03), `409ce2a` (T04–T06), `8a9004b` (CSS-cleanup), `95e5eee` (privacy-fix debugPrognose), `10ca08c` (testmock-fix backup/bpv), release-commit (versie + changelog)
- **Fase 4 gates:** code review ✅ · security review ✅ (0 nieuwe bevindingen) · QA healthscore 100 (alle 6 taken visueel geverifieerd in browser) ✅ · `npm audit` 0 vulnerabilities ✅ · tests 358/358 groen ✅ · CHANGELOG-entry [2.6.0] ✅ (incl. backfill 2.4.x–2.5.1)
- **Learnings:** `.gsd/milestones/M35-gebruikersfeedback/M35-LEARNINGS.md`

---

## Project

| Veld | Waarde |
|---|---|
| Naam | Mentordashboard CIOS |
| Type | Tauri v2 desktop app (Windows + macOS) |
| Stack | Tauri 2 · React 19 · TypeScript · Vite · Vitest |
| Versie | 2.4.0 |
| Totale commits | 655 |
| Laatste commit | `cccde00` — feat: opdracht-statusbadges + parser fixes (M34 start) |
| Status uitrol | Nog niet uitgerold — prognose-betrouwbaarheid is de blokkade |

---

## Milestone M34 — voortgang

**Doel:** Reliability + visuele verbeteringen + QOL → uitrolbaar product

### Prioriteit 1 · Reliability

| ID | Taak | Status |
|---|---|---|
| R-01 | Prognose-diagnose met echte PDF-fixtures | ✅ Opgelost — berekening correct, fixture-dump verwijderd |
| R-01a | Parser-bug: `leerjaar` altijd "1" voor BJ2-leerlingen | ✅ Opgelost — leerjaar afgeleid uit periode |
| R-02 | Datapunten-overzicht compleet + fase-onderscheid | ✅ Opgelost — fase-separatoren + inleverstatus-badge + proximity-enrichment voor BJ2 PDFs |
| R-03 | BPV-uren weergave herzien | ✅ Voldaan — bestaande weergave volstaat |

### Prioriteit 2 · Visuele verbeteringen

| ID | Taak | Status |
|---|---|---|
| V-01 | Spider chart groter (280px → ~380px) | ✅ Geïmplementeerd — 380px + schaalfactor bijgewerkt |
| V-02 | Kleuren SBL/SBC herzien (blauw voelt niet passend) | ✅ Geïmplementeerd — SBC/versneld_sbc nu paars (violet) |
| V-03 | Fase-onderscheid in datapunten-overzicht | ✅ Opgelost via R-02 |
| V-04 | Opdracht-statusbadges (kleurgecodeerd) | ✅ Geïmplementeerd |

### Prioriteit 3 · QOL

| ID | Taak | Status |
|---|---|---|
| Q-01 | Zoeken/filteren in klasoverzicht | ✅ Voldaan — bestaande zoekfunctionaliteit volstaat voor v2.1 |
| Q-02 | Klas-aanmaak wizard altijd starten + Overslaan-knop stap 2 | ✅ Overslaan-knop geïmplementeerd |

---

## Milestone M35 — gepland

**Doel:** Schema-configurabiliteit — parser bestand tegen jaarlijkse wijzigingen in deelgebieden, datapunten en leerlijnen

**Aanleiding (sessie 2026-06-06):** CIOS past jaarlijks het aantal deelgebieden, datapunten en leerlijnnamen aan. De huidige parser is closed-world: hij accepteert alleen wat hardcoded in `DEELGEBIEDEN` (schema.ts) staat. Nieuwe of hernoemde kolommen worden stil genegeerd. Elke schema-update vereist nu een code-aanpassing + deployment.

**Ontwerp­richting:** Draai de logica om — de PDF is de bron van waarheid, niet de code.
```
Huidig:  vaste lijst → zoek overeenkomsten in PDF  (breekt bij toevoeging)
Gewenst: lees PDF → ontdek alle kolommen → match aan config  (vangt toevoegingen op)
```

### Concrete taken

| ID | Taak | Breekpunt dat het oplost | Status |
|---|---|---|---|
| M35-1 | `DEELGEBIEDEN` verplaatsen naar `config/leerlijn.json` | Jaarlijkse update vereist nu code-aanpassing | ⬜ Niet gestart |
| M35-2 | `buildColumnMap()` open-world maken: pak **alle** header-kolommen op, ook onbekende (`unknown_<label>`) | Nieuwe deelgebieden verdwijnen nu stil | ⬜ Niet gestart |
| M35-3 | `isHeaderRow()` positie-gebaseerd: rij ná "Overzicht Deelgebieden" heading, niet afhankelijk van label-matches | Detectie faalt als MIN_HEADER_MATCHES niet gehaald wordt | ⬜ Niet gestart |
| M35-4 | `VAK_HEADINGS` vervangen door font-size-detectie (infrastructuur al aanwezig in `detectHeadingThreshold()`) | Hernoemde leerlijnen breken groepering | ⬜ Niet gestart |
| M35-5 | Validatielaag: log schema-drift na elke parse (nieuw in PDF / ontbreekt in config / volledig gematcht) | Schema-wijzigingen zijn nu onzichtbaar | ⬜ Niet gestart |

### Prioriteit­volgorde
1. M35-1 + M35-2 — hoogste rendement, minste complexiteit
2. M35-3 — kleine aanpassing, groot effect op robuustheid
3. M35-4 — verwijdert laatste hardcoded aanname
4. M35-5 — maakt drift zichtbaar voor beheerder

M35 start **na uitrol van M34** en na ontvangst van eerste gebruikersfeedback.

---

## Geïmplementeerd deze sessie (commits)

| Commit | Inhoud |
|---|---|
| `2f39ead` | GSD-infrastructuur: PROJECT, REQUIREMENTS, DECISIONS, KNOWLEDGE, STATE |
| `cccde00` | Parser-fixes + statusbadges (M34 start) |

**Details `cccde00`:**
- `parsers/pdf-status.ts` — STATUS_STRINGS losgekoppeld van PDF.js-vendor
- `parsers/pdf.ts` — 4 ontbrekende SomToday-statussen toegevoegd; `leerjaar` afgeleid uit `periode`
- `src/components/VakkenSection.tsx` — kleurgecodeerde StatusBadge (groen/oranje/rood/grijs)
- `src/components/OnboardingWizard.tsx` — Overslaan-knop op stap 2 PDF-upload
- `utils/datamodel.ts` — tijdelijke fixture-dump log voor prognose-diagnose (**verwijderen na gebruik**)
- `tests/prognose.diagnose.test.ts` — diagnosetests + regressietests leerjaar + STATUS_STRINGS

---

## Openstaande punten

- [x] **R-01 afgerond:** `berekenPrognose()` correct geverifieerd met live PDF-fixture (Bos, V. BJ2 → sbl, 13/19 ≥V). Fixture-dump verwijderd. Regressietest bewaard als `tests/prognose.diagnose.test.ts`.
- [x] **R-02 afgerond:** StatusBadge extracted, datapunten gegroepeerd per periode (fase-scheidingsrij bij ≥2 records), inleverstatus-badge per datapunt via buildDpStatusMap(). 11 nieuwe tests groen.
- [x] **R-03 afgevinkt:** bestaande weergave (voortgangsbalk + stats + plaatsingen-tabel) voldoet
- [ ] **V-01:** Spider chart groter
- [ ] **V-02:** Kleuren SBL/SBC herzien
- [ ] **V-03:** Fase-onderscheid datapunten-overzicht (hangt samen met R-02)
- [ ] **1 UAT-scenario fase 33** — nog steeds open

---

## Kennis opgedaan deze sessie

### Traject-detectie keten
```
student.periode  (primair)  →  detectTraject()  →  'bj1' | 'bj2'
student.leerjaar (fallback)                     ↗
    ↓
berekenPrognose(student, traject)
    ↓
BJ1: 'naar_bj2' | 'versneld_sbc' | 'neutraal' | 'negatief'
BJ2: 'sbl'      | 'sbc'          | 'neutraal' | 'negatief'
    ↓
berekenStatus()  →  RAG-kleur + label
    ↓
DoortstroomPrognoseSection  →  BJ1-blokken of BJ2-blokken
```

### Parser-gedrag SomToday
- SomToday exporteert altijd `Leerjaar 1` in de PDF-header, ook voor BJ2-leerlingen
- Fix: `leerjaar` wordt nu afgeleid uit `periode` als die "BJ1"/"BJ2" bevat
- Gevaarlijke case: `periode` bevat geen traject-indicator → `leerjaar` fallback → was altijd "1" → nu alleen nog bij echt ambigue periodes

### STATUS_STRINGS volledig
Alle 7 SomToday-statussen nu herkend. Eerder ontbraken: `Te laat ingeleverd en wel/niet beoordeeld`, `Niet beoordeelbaar`, `Zelfevaluatie, niet afgerond`.

---

## Handoff log

### Handoff 2026-05-30 (sessie 1)
Van: Pre-GSD  
Naar: GSD Fase 0/1  
Status: GSD retroactief geïnstalleerd, fase 33 afgerond  
Openstaand: GSD-documenten, beslissing volgende feature

### Handoff 2026-05-30 (sessie 2)
Van: GSD Fase 0 + GStack office hours  
Naar: GSD Fase 2 · Executie M34  
Status: M34-scope vastgelegd, 2 commits geleverd, prognose-diagnose actief  
Openstaand voor volgende sessie:
1. R-01 afronden — fixture vullen met echte PDF, bug lokaliseren in `berekenPrognose()` of parser
2. R-02 — datapunten-overzicht fase-onderscheid
3. R-03 — BPV-uren weergave definitie
4. V-01/V-02/V-03 — visuele verbeteringen (klein werk, hoge zichtbaarheid)
5. Fixture-dump verwijderen uit `utils/datamodel.ts` zodra diagnose klaar is
