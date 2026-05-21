# Phase 25: Doorstroomnorm Configuratie - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 25-doorstroomnorm-configuratie
**Areas discussed:** SettingsPage plaatsing, BJ1 vs BJ2 layout, Recalculatie trigger, Input validatie

---

## SettingsPage plaatsing

| Option | Description | Selected |
|--------|-------------|----------|
| Nieuwe sectie 5 | Aparte `<section className="detail-section">` na sectie 4 | ✓ |
| Subsectie in sectie 4 | Extra blok onder de bestaande verzuim + BPV inputs | |

**User's choice:** Nieuwe sectie 5 (aanbevolen)
**Notes:** Consistent met de bestaande sectie-structuur; sectie 4 wordt anders te lang.

**Follow-up: Herstel standaard plaatsing**

| Option | Description | Selected |
|--------|-------------|----------|
| Reset-knop per sectie | Sectie 5 eigen "Herstel standaard" knop, conform Phase 18 patroon | |
| Je beslist | Claude kiest de logische plaatsing | ✓ |

**User's choice:** Claude beslist
**Notes:** Claude koos voor een reset-knop per sectie (consistent met Phase 18 patroon).

---

## BJ1 vs BJ2 layout

| Option | Description | Selected |
|--------|-------------|----------|
| Twee blokken: BJ2 en BJ1 | BJ2-drempels blok + BJ1-drempels blok in sectie 5 | ✓ |
| Plat formulier zonder groepering | Alle 7 inputs direct onder sectietitel | |

**User's choice:** Twee blokken: BJ2 en BJ1 (aanbevolen)

**Follow-up: BJ1 zichtbaarheid**

| Option | Description | Selected |
|--------|-------------|----------|
| Altijd zichtbaar | Beide blokken direct zichtbaar | ✓ |
| BJ1 standaard ingeklapt | Accordion-stijl, verbergt BJ1-inputs | |

**User's choice:** Altijd zichtbaar
**Notes:** Gebruiker verduidelijkte dat BJ1-klassen in de toekomst ook ondersteund worden — "ook BJ1 in de toekomst".

**Follow-up: BJ1-blok inhoud**

| Option | Description | Selected |
|--------|-------------|----------|
| BJ1-positief + versneld-SBC | 4 inputs: BJ1-positief drempel + 3 versneld-SBC drempels | ✓ |
| Alleen versneld-SBC (3 inputs) | BJ1-positief deelt drempel met BJ2 SBL | |

**User's choice:** BJ1-positief + versneld-SBC (aanbevolen)

---

## Recalculatie trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Op blur of Enter | Herberekent na verlaten invoerveld | ✓ |
| Debounced tijdens typen (~300ms) | Herberekent 300ms na laatste toetsaanslag | |

**User's choice:** Op blur of Enter (aanbevolen)
**Notes:** Voorkomt flikkering terwijl mentor nog aan het typen is.

**Follow-up: Opslagmoment**

| Option | Description | Selected |
|--------|-------------|----------|
| Meteen opslaan bij blur/Enter | Instant-apply, geen save-knop | ✓ |
| Opslaan bij "Sluiten" settings | Bewaard bij verlaten settings-pagina | |

**User's choice:** Meteen opslaan bij blur/Enter (aanbevolen)

**Follow-up: Propagatie-mechanisme**

| Option | Description | Selected |
|--------|-------------|----------|
| Via App.tsx re-render door state-update | onNormenChanged callback, versie-teller, KlasOverzicht re-rendert | ✓ |
| Je beslist | Claude bepaalt mechanisme | |

**User's choice:** Via App.tsx re-render (aanbevolen)

---

## Input validatie

| Option | Description | Selected |
|--------|-------------|----------|
| Clamp op redelijk bereik | min/max per veld, decimalen afgerond | ✓ |
| Geen strikte validatie | Plain number inputs, geen min/max | |

**User's choice:** Clamp op redelijk bereik (aanbevolen)

**Follow-up: SBC < SBL waarschuwing**

User verduidelijkte: "de SBC drempel is juist Hoger dan de SBL drempel" — bevestigde dat SBC normaal hoger is dan SBL (standaard 15 > 13). Koos voor subtiele waarschuwing als SBC < SBL ingesteld wordt.

| Option | Description | Selected |
|--------|-------------|----------|
| Geen waarschuwing | Mentor is verantwoordelijk | |
| Subtiel waarschuwen (oranje tekst) | Waarschuwing zonder blokkering | ✓ |

**User's choice:** Subtiele waarschuwing als SBC < SBL

**Follow-up: Integer-only inputs**

User vroeg: "Alleen gehele getallen (integers)?"
**Antwoord:** Ja — `type="number" step="1"` met `Math.round()` bij blur.

---

## Claude's Discretion

- **Reset-knop plaatsing:** Sectie 5 heeft zijn eigen "Herstel standaard" knop, conform het Phase 18 patroon.

## Deferred Ideas

Geen — discussie bleef binnen het fase-domein.
