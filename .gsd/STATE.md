# STATE.md — Mentordashboard CIOS

> Laatste update: 2026-06-01 (sessie 4) — M34 ✅ afgerond + macOS PDF-fix, versie 2.4.0

---

## Huidige fase

**Fase 4 · Shipped — M34 volledig afgerond**

Alle R, V en Q taken van M34 zijn geïmplementeerd en gecommit.
Versie 2.1.0 getagged. Klaar voor uitrol naar gebruikers.
M35 (schema-configurabiliteit) start na ontvangst van echte gebruikersfeedback.

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
