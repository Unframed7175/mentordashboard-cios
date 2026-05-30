# STATE.md — Mentordashboard CIOS

> Gegenereerd op: 2026-05-30  
> GSD retroactief geïnitialiseerd op een bestaand project (652 commits)

---

## Huidige fase

**Fase 0 → Fase 1 overgang**

Het project is volwassen maar GSD wordt nu voor het eerst ingezet.
Fase 0 (ontdekking) is in de praktijk al doorlopen — er liggen beslissingen en architectuur vast in de code zelf.
De volgende stap is Fase 1 (spec) om bestaande kennis te documenteren in `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md` en `.gsd/DECISIONS.md`.

---

## Project

| Veld | Waarde |
|---|---|
| Naam | Mentordashboard CIOS |
| Type | Tauri v2 desktop app (Windows + macOS) |
| Stack | Tauri 2 · React 19 · TypeScript · Vite · Vitest |
| Versie | 2.0.0 |
| Totale commits | 652 |
| Laatste commit | `75a32ac` — chore: add CLAUDE.md, planning artifacts, VSCode config, and Claude settings |

---

## Wat is dit product

Een offline desktopapplicatie voor mentoren op MBO-scholen (CIOS Zuid-West).
Mentoren kunnen SomToday-exports importeren (PDF voortgang, Excel verzuim, Excel BPV)
en zien per leerling: doorstroomprognose, deelgebieden, verzuim, BPV-voortgang en leerlijnscores.
Geen internetverbinding vereist. Data versleuteld opgeslagen op de lokale computer.

---

## Codebase overzicht

```
src/
  components/    23 React-componenten (KlasOverzicht, DetailWeergave, OnboardingWizard, …)
  utils/         status.ts (prognose-logica)
  App.tsx        Hoofdcomponent — klas-state, import-handlers, routing
tests/           29 testbestanden (Vitest)
parsers/         PDF + Excel parsers (SomToday-formaten)
src-tauri/       Rust backend (Tauri v2)
```

---

## Laaste voltooide fase: Fase 33

**Onderwerp:** KlasVerwijderenModal — klas verwijderen met bevestigingsdialoog

**UAT-resultaat:** 11/12 geslaagd  
**Openstaand punt:** 1 UAT-scenario niet geslaagd (details in git log fase 33)

**Relevante commits (selectie):**
- `4bfcd82` test(33): complete UAT re-verification — 11/12 pass, phase complete
- `163baa0` fix(33-03): guard null/missing leerlingId in countUniekeLeerlingen (WR-04)
- `9b9f986` fix(33): WR-01 remove unused canDelete prop from KlasTabStripProps

---

## Openstaande punten

- [ ] 1 UAT-scenario fase 33 nog niet geslaagd — nader te onderzoeken
- [x] `.gsd/PROJECT.md` aangemaakt (product scope en doelgroep)
- [x] `.gsd/REQUIREMENTS.md` aangemaakt (15 functionele eisen, 5 NF-eisen)
- [x] `.gsd/DECISIONS.md` aangemaakt (12 ADRs vastgelegd)
- [x] `.gsd/KNOWLEDGE.md` aangemaakt (patronen, valkuilen, datamodel)

---

## Volgende stap

1. **Fase 34 starten:** nieuwe feature definiëren via `/office-hours` (GStack Fase 0)
2. **Of:** UAT-issue fase 33 oplossen voor verdere iteratie

---

## Handoff log

### Handoff 2026-05-30
Van: Pre-GSD — geen framework  
Naar: GSD — Fase 0/1 overgang  
Status: Project bestaand en functioneel, fase 33 afgerond (11/12 UAT), GSD retroactief geïnstalleerd  
Openstaand: GSD-documenten invullen, beslissen over volgende feature
