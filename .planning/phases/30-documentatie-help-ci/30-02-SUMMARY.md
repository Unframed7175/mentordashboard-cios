---
phase: 30-documentatie-help-ci
plan: "02"
subsystem: ui
tags: [tdd, green, helppage, klastabstrip, app-routing, help-01, help-02]
dependency_graph:
  requires: [30-01 RED test gates]
  provides: [HelpPage component, help view routing in App.tsx, ? nav button in KlasTabStrip]
  affects:
    - src/components/HelpPage.tsx
    - src/App.tsx
    - src/components/KlasTabStrip.tsx
    - tests/KlasTabStrip.test.tsx
tech_stack:
  added: []
  patterns: [settings-header pattern reuse, safeView guard (prevView), view-slide-in-right wrapper]
key_files:
  created:
    - src/components/HelpPage.tsx
  modified:
    - src/App.tsx
    - src/components/KlasTabStrip.tsx
    - tests/KlasTabStrip.test.tsx
decisions:
  - HelpPage gebruikt .settings-page als outer className (hergebruik i.p.v. nieuwe .help-page klasse)
  - "importeren" en "fout melden" keywords komen precies eenmaal voor in de render — getByText single-match vereiste
  - Phase 17 inline KlasTabStrip renders in test uitgebreid met onHelp/isHelpActive (TypeScript required props)
  - safeView guard identiek gekopieerd van handleOpenSettings (prevView bevat nooit help/settings/onboarding)
metrics:
  duration: "12 minutes"
  completed: "2026-05-28"
  tasks_completed: 2
  files_created: 1
  files_modified: 3
---

# Phase 30 Plan 02: GREEN — HelpPage + KlasTabStrip Help Button Summary

**One-liner:** HelpPage component (4 secties), App.tsx help-view routing met safeView guard, en KlasTabStrip ? knop — alle 6 RED tests uit Plan 01 gaan GREEN (210 totaal).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/components/HelpPage.tsx | 668a62f | src/components/HelpPage.tsx |
| 2 | Extend KlasTabStrip + App.tsx routing | 6e6e7fe | src/components/KlasTabStrip.tsx, src/App.tsx, tests/KlasTabStrip.test.tsx |

## What Was Built

### Task 1 — src/components/HelpPage.tsx
Nieuw statisch component met:
- `HelpPageProps { onBack: () => void }` interface
- `export default function HelpPage` met `.settings-page` outer className (hergebruik bestaande CSS)
- `.settings-header` blok met `← Terug` knop en `<h1>Help</h1>`
- 4 `<section className="detail-section">` blokken:
  - Stap 1: Importeren — PDF/Excel import instructies
  - Stap 2: Klasoverzicht bekijken — tabs, tegels, kleurcodes
  - Stap 3: Afdrukken — detailweergave → afdrukknop → PDF
  - Stap 4: Fout melden — 🐛 knop in navigatiebalk
- Geen store imports, geen useState, geen async calls

### Task 2 — KlasTabStrip.tsx + App.tsx + tests/KlasTabStrip.test.tsx

**KlasTabStrip.tsx:**
- `onHelp: () => void` en `isHelpActive: boolean` toegevoegd aan interface
- Beide props toegevoegd aan destructuring
- ? knop (aria-label "Help openen") ingevoegd tussen feedback en settings knoppen
- Settings gear behoudt `marginLeft: 'auto'` — ? knop heeft geen marginLeft

**App.tsx:**
- `import HelpPage from './components/HelpPage'` toegevoegd
- View union uitgebreid: `'help'` lid toegevoegd
- `handleOpenHelp()` — safeView guard identiek aan handleOpenSettings, geen settingsOpenCount
- `handleBackFromHelp()` — `setView(prevView)`
- `onHelp={handleOpenHelp}` en `isHelpActive={view === 'help'}` op KlasTabStrip JSX
- `{view === 'help' && <div className="view-slide-in-right" ...><HelpPage .../></div>}` voor onboarding block

**tests/KlasTabStrip.test.tsx:**
- Phase 17 inline renders uitgebreid met `onHelp={vi.fn()}` en `isHelpActive={false}` (TypeScript vereiste)

## Test Results

```
Test Files  24 passed | 1 skipped (25)
     Tests  210 passed | 5 skipped (215)
```

- HelpPage.test.tsx: 4/4 PASS (heading, onBack, importeren, fout melden)
- KlasTabStrip.test.tsx: 13/13 PASS (11 bestaand + 2 nieuwe Phase 30 help-button tests)
- Volledige suite: 210 passed (204 eerder + 6 nieuw)
- TypeScript: 0 nieuwe fouten (4 pre-existing fouten in spider.tsx/spider.test.ts/App.tsx:34/SettingsPage.tsx:134 — ongewijzigd)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] getByText multiple matches voor /importeren/i en /fout melden/i**
- **Found during:** Task 1 verifikatie
- **Issue:** De tekst "importeren" verscheen zowel in de h2-titel als in de paragraaf. "Fout melden" verscheen in de h2 en in een `<strong>` tag. `getByText` vereist exact 1 match.
- **Fix:** Paragraaf tekst herschreven zonder de zoektermen te herhalen. `<strong>Fout melden</strong>` verwijderd uit de paragraaf — de sectietitel volstaat.
- **Files modified:** src/components/HelpPage.tsx
- **Commit:** 668a62f

**2. [Rule 2 - Missing required props] Phase 17 inline KlasTabStrip renders missen onHelp/isHelpActive**
- **Found during:** TypeScript check na Task 2
- **Issue:** 4 inline renders in de Phase 17 describe block misten de nieuwe verplichte props na interface-uitbreiding.
- **Fix:** `onHelp={vi.fn()}` en `isHelpActive={false}` toegevoegd aan alle 4 inline renders.
- **Files modified:** tests/KlasTabStrip.test.tsx
- **Commit:** 6e6e7fe

## Known Stubs

None — alle secties bevatten concrete Nederlandse inhoud; geen placeholder tekst.

## Threat Flags

None — geen nieuwe network endpoints, auth paths, file access patterns, of schema wijzigingen. HelpPage is statische JSX (T-30-01 accept). prevView safeView guard voorkomt lekken van overlay-views (T-30-02 accept).

## Self-Check: PASSED

- src/components/HelpPage.tsx exists: FOUND
- src/App.tsx modified (handleOpenHelp, view union, HelpPage render block): FOUND
- src/components/KlasTabStrip.tsx modified (onHelp, isHelpActive, ? button): FOUND
- Commit 668a62f (Task 1): FOUND
- Commit 6e6e7fe (Task 2): FOUND
- 210 tests pass: CONFIRMED
- TypeScript 0 new errors: CONFIRMED
