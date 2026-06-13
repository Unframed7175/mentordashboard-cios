# STATE.md — Mentordashboard CIOS

> Laatste update: 2026-06-13 — Fase 4 M36-fabrieksreset: 390 tests groen, security clean, CHANGELOG + versie 2.7.0 klaar. T6/DT3 handmatige QA ausstehend.

---

## Huidige fase

**Fase 4 · Review & ship — M36-fabrieksreset (ACTIEF)**

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
- T6 / DT3: handmatige QA op echte Tauri-build — **PENDING (blokkade voor /ship)**

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
| M36-fabrieksreset | ACTIEF (Fase 1 ✓ → Fase 3 ✓ → Fase 2 executie) |
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
