# Phase 6: Multi-class UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 06 — Multi-class UI
**Areas discussed:** Tab-positie, Nieuwe klas flow, Leerlijn-scope, Startstate, Klasoverzicht UI (tegel)

---

## Tab-positie

| Option | Description | Selected |
|--------|-------------|----------|
| Boven de nav | Aparte rij klastabbladen boven de bestaande Import/Overzicht nav | ✓ |
| Geïntegreerd in nav | Klastabbladen naast Import/Overzicht in dezelfde balk | |

**User's choice:** Boven de nav
**Notes:** Duidelijkste hiërarchie — klas wissel eerst, dan view wissel.

---

## Nieuwe klas flow

| Option | Description | Selected |
|--------|-------------|----------|
| + knop → modal | Modal met tekstveld voor klasnaam | ✓ |
| Inline invoer | Inline tekstveld in de tabbalk | |

**User's choice:** + knop → modal

---

## Leerlijn-scope

| Option | Description | Selected |
|--------|-------------|----------|
| Per klas apart | Elke klas heeft eigen leerlijn-toewijzing | |
| Gedeeld voor alle klassen | Één leerlijn-toewijzing geldt voor alle klassen | ✓ |

**User's choice:** Ja, gedeeld
**Notes:** "Deelgebieden zijn vast, de vakken + gekoppelde opdrachten moeten wel flexibel zijn." — Clarified to mean: the 19 deelgebieden and their leerlijn-mapping are fixed/shared; the student data (voortgang, vakken, opdrachten) per class comes from PDFs and is naturally per-class.

---

## Startstate

| Option | Description | Selected |
|--------|-------------|----------|
| Lege staat + prompt | App start zonder klassen, prompt uitnodigen | ✓ |
| Standaard klas 'Mijn klas' | App start met één lege standaard klas | |

**User's choice:** Lege staat + prompt

---

## Klasoverzicht UI — Tegel

| Option | Description | Selected |
|--------|-------------|----------|
| Zelfde tabel, gefilterd per klas | Bestaande tabel blijft | |
| Klastabbladen bovenin tabel | Subtabs boven leerlingentabel | |
| Toon alle klassen tegelijk | Secties per klas onder elkaar | |
| Tegel-vorm (eigen input) | Van tabel naar tegel-grid | ✓ |

**User's choice:** Tegel-vorm — "ik wil van de tabelvorm af stappen en naar een tegel vorm gaan"
**Follow-up — Tegel inhoud:**
- ✓ Naam + RAG-kleur
- ✓ Prognose badge
- ✓ Verzuim via de huidige statusbar (compact versie van de stacked bar)
- ✗ V/G/E mini-balk (not selected)

**Follow-up — Tegel raster:**
- ✓ 3–4 per rij (compact grid)

---

## Claude's Discretion

- localStorage key scheme voor multi-class
- `window.appState` uitbreiding (classes map vs activeClass string)
- Tile hover state en animaties
- Sort/search placement boven de tile grid
- Class tab rename UX

