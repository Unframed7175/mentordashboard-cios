# STATE.md — Mentordashboard CIOS

> Laatste update: 2026-05-30 (sessie 2)

---

## Huidige fase

**Fase 2 · Executie — M34 gestart**

Office hours (GStack) heeft de scope van M34 en M35 vastgelegd.
De eerste M34-taken zijn geïmplementeerd en gecommit.
Actieve prioriteit: prognose-betrouwbaarheid afronden, daarna UI-verbeteringen.

---

## Project

| Veld | Waarde |
|---|---|
| Naam | Mentordashboard CIOS |
| Type | Tauri v2 desktop app (Windows + macOS) |
| Stack | Tauri 2 · React 19 · TypeScript · Vite · Vitest |
| Versie | 2.0.0 |
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
| R-02 | Datapunten-overzicht compleet + fase-onderscheid | ⬜ Niet gestart |
| R-03 | BPV-uren weergave herzien | ⬜ Niet gestart |

### Prioriteit 2 · Visuele verbeteringen

| ID | Taak | Status |
|---|---|---|
| V-01 | Spider chart groter (280px → ~380px) | ⬜ Niet gestart |
| V-02 | Kleuren SBL/SBC herzien (blauw voelt niet passend) | ⬜ Niet gestart |
| V-03 | Fase-onderscheid in datapunten-overzicht | ⬜ Niet gestart |
| V-04 | Opdracht-statusbadges (kleurgecodeerd) | ✅ Geïmplementeerd |

### Prioriteit 3 · QOL

| ID | Taak | Status |
|---|---|---|
| Q-01 | Zoeken/filteren in klasoverzicht | 🔄 Gedeeltelijk — KlasOverzicht heeft al zoekfunctionaliteit (refreshKey-gebaseerd) |
| Q-02 | Klas-aanmaak wizard altijd starten + Overslaan-knop stap 2 | ✅ Overslaan-knop geïmplementeerd |

---

## Milestone M35 — gepland

**Doel:** Schema-configurabiliteit — DEELGEBIEDEN en leerlijnen data-driven

| Onderdeel | Status |
|---|---|
| DEELGEBIEDEN naar plugin-store | ⬜ Niet gestart |
| Settings-UI voor schema-beheer | ⬜ Niet gestart |
| Schooljaarversie op studentrecord | ⬜ Niet gestart |
| Parser async schema laden | ⬜ Niet gestart |

M35 start **na uitrol van M34** — eerst echte gebruikersfeedback ophalen.

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
- [ ] **R-02:** datapunten-overzicht compleet + fase-onderscheid (2 fases)
- [ ] **R-03:** BPV-uren weergave definiëren en implementeren
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
