---
phase: 30-documentatie-help-ci
plan: "04"
subsystem: documentation
tags: [docs, instructies, testplan, help, dutch]
dependency_graph:
  requires: []
  provides: [INSTRUCTIES.md, TESTPLAN.md]
  affects: []
tech_stack:
  added: []
  patterns: [markdown-documentation, manual-test-checklist]
key_files:
  created:
    - INSTRUCTIES.md
    - TESTPLAN.md
  modified: []
decisions:
  - "Used ralvarezstam@cioszuidwest.nl (from utils/feedback.ts) — not the gmail address"
  - "UTF-8 encoding required for U+2610 checkbox character in TESTPLAN.md"
  - "Get-Content without -Encoding UTF8 fails checkbox match on Windows — verified with explicit UTF8 flag"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-28"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
requirements_fulfilled:
  - HELP-03
  - HELP-04
  - TEST-04
  - TEST-05
---

# Phase 30 Plan 04: Documentatie — INSTRUCTIES.md en TESTPLAN.md

## One-liner

Nederlandse installatie- en gebruiksgids (INSTRUCTIES.md) en handmatig testscenario-checklist (TESTPLAN.md) met 13 scenario-tabellen aangemaakt voor collega-testers.

## What Was Built

### Task 1 — INSTRUCTIES.md (commit `0fecc3a`)

Aangemaakt: `INSTRUCTIES.md` in de repo root (~70 regels Markdown).

8 H2-secties in volgorde:
1. **Wat is dit?** — één alinea intro (desktop app, geen internetverbinding vereist)
2. **Installatie op Windows** — 5 genummerde stappen inclusief SmartScreen workaround
3. **Installatie op macOS** — 4 stappen inclusief xattr-commando en Privacy-alternatief
4. **Eerste gebruik** — verwijzing naar onboarding wizard
5. **Bestanden importeren** — drie subsecties: SomToday PDF, Verzuim Excel, BPV Excel
6. **Dashboard bekijken** — klas-tabs, tegels met kleurcodering, detailweergave, afdrukken
7. **Bekende beperkingen** — BPV-kolom-herkenning, Rekenen/Nederlands optioneel, geen auto-updates
8. **Bug melden** — `🐛 Fout melden`-knop, e-mailadres `ralvarezstam@cioszuidwest.nl`

### Task 2 — TESTPLAN.md (commit `6cefbdd`)

Aangemaakt: `TESTPLAN.md` in de repo root (~130 regels Markdown).

Intro-alinea met instructies voor testers + 13 `## Testscenario`-secties (1 t/m 13). Elk scenario heeft een tabel met kolommen `Stap | Actie | Verwacht resultaat | Geslaagd?`. Elke tabelrij heeft `☐` (U+2610) in de kolom Geslaagd?.

Scenario-dekking:
- 1: Installatie Windows
- 2: Installatie macOS
- 3: Onboarding wizard
- 4: PDF importeren
- 5: Verzuim Excel importeren
- 6: BPV stage Excel importeren
- 7: Detailweergave bekijken
- 8: Fase-vergelijking
- 9: Afdrukken / Print-to-PDF
- 10: Bug melden via bug-knop
- 11: Instellingen aanpassen
- 12: Klas hernoemen en verwijderen
- 13: Help pagina openen en sluiten

## Verification Results

### INSTRUCTIES.md

```
email:True foutMelden:True bpv:True windows:True mac:True beperkingen:True
```

Alle 6 checks: GESLAAGD

### TESTPLAN.md

```
header:True scenario13:True checkbox:True actie:True verwacht:True
```

Alle 5 checks: GESLAAGD (met `-Encoding UTF8` vanwege U+2610 Unicode-teken)

## Deviations from Plan

### Auto-fixed Issues

Geen bugs of blokkerende problemen gevonden.

### Encoding Note (niet-afwijking, documentatie)

Het verificatiescript in het plan gebruikt `Get-Content` zonder `-Encoding UTF8`. Op Windows leest PowerShell zonder expliciete encoding soms ANSI in plaats van UTF-8, waardoor U+2610 niet herkend wordt als regex-match. Het bestand zelf bevat het juiste Unicode-teken (bevestigd met `[char]0x2610` index-check). De verificatie is geslaagd wanneer de juiste encoding wordt opgegeven. Dit is geen afwijking van de inhoud maar een omgevingsdetail.

## Known Stubs

Geen stubs. Beide documenten bevatten volledige inhoud zonder placeholders.

## Threat Flags

Geen nieuwe threat surface. Conform plan:
- `ralvarezstam@cioszuidwest.nl` is intentioneel gepubliceerd (al aanwezig in FeedbackModal source code)
- `xattr -c` commando is read-only; geen verhoogde privileges
- Geen packages geïnstalleerd

## Self-Check: PASSED

- INSTRUCTIES.md bestaat in repo root: BEVESTIGD
- TESTPLAN.md bestaat in repo root: BEVESTIGD
- Commit `0fecc3a` bestaat: BEVESTIGD (git log)
- Commit `6cefbdd` bestaat: BEVESTIGD (git log)
- INSTRUCTIES.md bevat `ralvarezstam@cioszuidwest.nl`: BEVESTIGD
- INSTRUCTIES.md bevat `Fout melden`: BEVESTIGD
- INSTRUCTIES.md bevat `BPV`: BEVESTIGD
- TESTPLAN.md bevat `Geslaagd?`: BEVESTIGD
- TESTPLAN.md bevat `Testscenario 13`: BEVESTIGD
- TESTPLAN.md bevat U+2610 checkbox: BEVESTIGD
