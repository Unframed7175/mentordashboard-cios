# Requirements: v2.3 Inzicht, Configuratie & Testers Onboarden

**Milestone:** v2.3
**Status:** Active
**Created:** 2026-05-21

---

## Dashboard: Doorstroomnorm Configuratie (NORM)

- [x] **NORM-01**: Mentor kan de SBL-drempel (standaard ≥13 ≥V) aanpassen in de instellingen
- [x] **NORM-02**: Mentor kan de SBC-drempel (standaard ≥15 ≥V) aanpassen in de instellingen
- [x] **NORM-03**: Mentor kan de negatief-drempel (standaard >6 O totaal) aanpassen in de instellingen
- [x] **NORM-04**: Mentor kan de per-leerlijn negatief-drempel (standaard >2 O) aanpassen in de instellingen
- [x] **NORM-05**: Mentor kan de BJ1 versneld-SBC drempels aanpassen (lesgeven ≥4, organiseren ≥3, prof. handelen ≥5)
- [x] **NORM-06**: Ingestelde drempels worden opgeslagen en bewaard tussen sessies
- [x] **NORM-07**: Een "Herstel standaard" knop zet alle drempels terug naar de CIOS-normen

## Dashboard: Tegel Score-telling (TEGEL)

- [x] **TEGEL-01**: De leerling-tegel toont het aantal deelgebieden ≥V en het aantal O onder de status-badge
- [x] **TEGEL-02**: De score-telling wordt verborgen als een leerling geen scores heeft (grijs / Onbekend tegel)

## Dashboard: Fase-vergelijking Trend (TREND)

- [x] **TREND-01**: De tegel toont een pijl omhoog (↑) als de prognose verbeterd is t.o.v. fase 1 (bijv. rood → oranje, oranje → groen)
- [x] **TREND-02**: De tegel toont een pijl omlaag (↓) als de prognose verslechterd is t.o.v. fase 1
- [x] **TREND-03**: De pijl wordt alleen getoond als zowel fase 1 als fase 2 voor dezelfde leerling aanwezig zijn
- [x] **TREND-04**: Als de prognose gelijk is gebleven, wordt geen pijl getoond (geen visuele ruis)

## Dashboard: Klasbeheer (KLS)

- [x] **KLS-01**: Een lege klas (0 leerlingen) toont een "Verwijder klas" knop in de tab of tegel *(validated Phase 27)*
- [x] **KLS-02**: Mentor kan de naam van elke bestaande klas wijzigen zonder de data te verliezen *(validated Phase 27)*
- [x] **KLS-03**: Klasnaam-wijziging is direct zichtbaar in de tab-strip en alle onderdelen *(validated Phase 27)*

## Testers: Bug/Feedback Rapportage (FEED)

- [ ] **FEED-01**: De app heeft een zichtbare "Fout melden" of "Feedback" knop, bereikbaar vanuit elke view
- [ ] **FEED-02**: De knop opent de standaard e-mailapp (mailto:) met het e-mailadres van de ontwikkelaar vooringevuld
- [ ] **FEED-03**: De e-mailbody bevat automatisch: OS + versie, app-versie, laatste import-actie (bestandsnaam/type)
- [ ] **FEED-04**: De e-mailbody bevat automatisch: de laatste N console errors (technische context voor debugging)
- [ ] **FEED-05**: De tester kan een beschrijving van het probleem toevoegen vóór het versturen (subject of body is leeg als uitnodiging)

## Testers: Documentatie & Help (HELP)

- [x] **HELP-01**: De app heeft een in-app helppagina of modal met een korte uitleg van de stappen (importeren → bekijken → afdrukken)
- [x] **HELP-02**: De helppagina is bereikbaar via een zichtbare "?" knop of "Help" link in de navigatie
- [ ] **HELP-03**: Er is een uitgebreid `INSTRUCTIES.md` bestand (of PDF) voor collega-testers dat: installatie, eerste gebruik, importeren, en bekende beperkingen beschrijft
- [ ] **HELP-04**: `INSTRUCTIES.md` bevat contactinformatie en hoe een bug te melden (verwijst naar FEED-knop)

## Testers: Cross-platform Testing (TEST)

- [ ] **TEST-01**: GitHub Actions CI bouwt de app op Windows (x64) bij elke push naar main
- [ ] **TEST-02**: GitHub Actions CI bouwt de app op macOS (Apple Silicon) bij elke push naar main
- [ ] **TEST-03**: CI smoke test verifieert dat de build succesvol is (geen Rust/npm build errors)
- [ ] **TEST-04**: Er is een handmatige testchecklist (TESTPLAN.md) voor collega-testers met stap-voor-stap scenario's: installatie, importeren PDF, importeren verzuim Excel, doorstroom bekijken, afdrukken, feedback melden
- [ ] **TEST-05**: De testchecklist bevat verwacht gedrag per stap zodat testers weten wat goed en fout is

## UX: Streamlining (UI)

- [ ] **UI-01**: Spacing en typografie zijn consistent over alle views (section-titels, body, labels, badges)
- [ ] **UI-02**: Het klasoverzicht is visueel opgeschoond — duidelijke hiërarchie, minder drukke tegels
- [ ] **UI-03**: Dark mode kleuren en contrast zijn verfijnd (geen witte vlekken of slecht leesbare tekst)
- [ ] **UI-04**: View-wissels en tab-navigatie hebben subtiele CSS-transities

## Bugfixes (FIX)

- [ ] **FIX-01**: Nav diagonal stripe (`::after` pseudo-element) wordt correct weergegeven in Tauri WebView
- [ ] **FIX-02**: BPV-sectie toont een duidelijk onderscheid tussen "laden..." en "geen BPV-data geïmporteerd"

---

## Future Requirements (deferred)

- RNL-04 — PDF extractie voor Rekenen/Nederlands (wacht op sample PDF met R&N sectie)
- R&N scores in klasoverzicht-tegels

---

## Out of Scope

- Server-side bug tracking (Sentry, Linear) — lokale tool, geen externe services
- Automatische update-check — mentor beheert installatie handmatig
- Mobiele lay-out — desktop-only tool

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| NORM-01 | Phase 25 | ○ Pending |
| NORM-02 | Phase 25 | ○ Pending |
| NORM-03 | Phase 25 | ○ Pending |
| NORM-04 | Phase 25 | ○ Pending |
| NORM-05 | Phase 25 | ○ Pending |
| NORM-06 | Phase 25 | ○ Pending |
| NORM-07 | Phase 25 | ○ Pending |
| TEGEL-01 | Phase 26 | ✓ Complete |
| TEGEL-02 | Phase 26 | ✓ Complete |
| TREND-01 | Phase 26 | ✓ Complete |
| TREND-02 | Phase 26 | ✓ Complete |
| TREND-03 | Phase 26 | ✓ Complete |
| TREND-04 | Phase 26 | ✓ Complete |
| KLS-01 | Phase 27 | ○ Pending |
| KLS-02 | Phase 27 | ○ Pending |
| KLS-03 | Phase 27 | ○ Pending |
| FEED-01 | Phase 28 | ○ Pending |
| FEED-02 | Phase 28 | ○ Pending |
| FEED-03 | Phase 28 | ○ Pending |
| FEED-04 | Phase 28 | ○ Pending |
| FEED-05 | Phase 28 | ○ Pending |
| UI-01 | Phase 29 | ○ Pending |
| UI-02 | Phase 29 | ○ Pending |
| UI-03 | Phase 29 | ○ Pending |
| UI-04 | Phase 29 | ○ Pending |
| FIX-01 | Phase 29 | ○ Pending |
| FIX-02 | Phase 29 | ○ Pending |
| HELP-01 | Phase 30 | ○ Pending |
| HELP-02 | Phase 30 | ○ Pending |
| HELP-03 | Phase 30 | ○ Pending |
| HELP-04 | Phase 30 | ○ Pending |
| TEST-01 | Phase 30 | ○ Pending |
| TEST-02 | Phase 30 | ○ Pending |
| TEST-03 | Phase 30 | ○ Pending |
| TEST-04 | Phase 30 | ○ Pending |
| TEST-05 | Phase 30 | ○ Pending |
