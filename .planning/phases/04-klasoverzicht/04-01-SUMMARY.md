---
phase: 04-klasoverzicht
plan: "01"
subsystem: klasoverzicht-ui
tags: [klasoverzicht, persistentie, localStorage, nav, tabel, rag, sort, search]
dependency_graph:
  requires: [window.berekenPrognose, window.appState, window.saveState, window.loadState]
  provides: [klasoverzicht view, nav tabs, auto-save, auto-load]
  affects: [utils/datamodel.js, index.html, app.js]
metrics:
  duration: "15 min"
  completed: "2026-03-24"
  tasks_completed: 2
  files_modified: 3
---

# Phase 04 Plan 01: Klasoverzicht Summary

## What Was Built

### utils/datamodel.js (extended)
- `window.saveState()` — serialiseert students naar localStorage key 'mentordashboard_v1'
- `window.loadState()` — deserialiseert bij opstarten, retourneert true als data geladen
- `window.clearState()` — wist localStorage + reset appState

### index.html (rewritten)
- Donkere nav bar met "Importeren" en "Klasoverzicht" tabs + live leerling-teller badge
- `#import-view` wrapper (bestaande import UI ongewijzigd)
- `#klasoverzicht-view`:
  - Zoekbalk (live filter op naam)
  - Sorteerknoppengroep: Naam / Status / Verzuim
  - Tabel: Naam | Status badge | Deelgebieden ≥V (met progress bar) | Ongeoorloofd | Totaal verzuim
  - "Wis alle data" knop

### app.js (extended)
- `showView('klas'|'import')` — toggle views + nav active state
- `berekenStatus(student)` — combineert prognose label + verzuim drempel (600 min = 10u):
  - rood: negatief prognose
  - oranje: neutraal OF ongeoorloofd > 10u
  - groen: sbl
  - blauw: sbc (profieljaar route)
  - grijs: geen scores
- `renderKlasoverzicht()` — rendert gefilterde en gesorteerde tabel
- `showNaarKlasBtn()` — voegt "Naar klasoverzicht →" toe na import
- `autoSave()` (via `window._afterPDFImport`) — auto-save na PDF + Excel import
- Startup: `window.loadState()` → als data aanwezig, direct naar klasoverzicht

## Decisions
- Verzuim drempel 600 min (10 uur ongeoorloofd) voor oranje — praktische grens
- SBC-route apart als blauw badge, niet samengevoegd met groen
- localStorage key 'mentordashboard_v1' — versie in key voor toekomstige migratie
- Confirm dialoog voor "Wis alle data" — destructieve actie

## Self-Check: PASSED
