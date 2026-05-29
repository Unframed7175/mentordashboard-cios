# Phase 33: Klas Verwijderen met Bevestiging - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 33-klas-verwijderen-bevestiging
**Areas discussed:** × knop zichtbaarheid, Modal stijl, Feedback na verwijderen, Actieve klas edge case

---

## × Knop Zichtbaarheid

| Option | Description | Selected |
|--------|-------------|----------|
| Altijd zichtbaar | × staat altijd rechts in de tab, ook voor niet-lege klassen | ✓ |
| Alleen bij hover | × verschijnt pas als de mentor over de tab hovert | |
| Jij bepaalt | Laat aan planner/implementatie over | |

**User's choice:** Altijd zichtbaar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Actieve klas beschermd | Mentor wisselt eerst, dan verschijnt × op vorige klas | |
| Actieve klas ook verwijderbaar | App wisselt automatisch naar andere klas als actieve verwijderd wordt | ✓ |

**User's choice:** Actieve klas ook verwijderbaar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, automatisch wisselen / import | deleteKlas() doet dit al. × op álle klassen | ✓ |
| Nee, actieve klas toch beschermen | Mentor moet eerst wisselen | |

**User's choice:** Ja, automatisch wisselen / import

---

## Modal Stijl

| Option | Description | Selected |
|--------|-------------|----------|
| KlasModal patroon hergebruiken | .modal-overlay + .modal-box structuur. Consistente UX | ✓ |
| Andere stijl | Bijv. popover of inline bevestiging boven de tab | |

**User's choice:** KlasModal patroon hergebruiken

---

| Option | Description | Selected |
|--------|-------------|----------|
| Knop disabled + grijs | Visueel duidelijk dat je eerst moet aanvinken | ✓ |
| Knop zichtbaar maar rood border | Klikbaar maar waarschuwing als je klikt zonder checkbox | |

**User's choice:** Knop disabled + grijs

---

| Option | Description | Selected |
|--------|-------------|----------|
| "Ik begrijp dat alle leerlingdata wordt verwijderd" | Uit STATE.md design note | ✓ |
| Andere tekst | Kortere of andere formulering | |

**User's choice:** "Ik begrijp dat alle leerlingdata wordt verwijderd"

---

## Feedback na verwijderen

| Option | Description | Selected |
|--------|-------------|----------|
| Stilletjes verdwijnen | Modal sluit, tab verdwijnt, huidige view ongewijzigd | ✓ |
| Toast notificatie | Kort bericht "Klas verwijderd" verschijnt onderaan | |

**User's choice:** Stilletjes verdwijnen

---

## Actieve klas edge case

| Option | Description | Selected |
|--------|-------------|----------|
| Geen extra uitleg nodig | Modal toont klasnaam + leerlingenaantal. Voldoende duidelijk | ✓ |
| Extra waarschuwing in modal | "Dit is je huidige actieve klas. Na verwijdering schakel je over naar..." | |

**User's choice:** Geen extra uitleg nodig

---

## Claude's Discretion

- Exact knoplabel voor bevestigknop en annuleerknop
- Visuele stijl van de disabled bevestigknop (kleur, opacity)
- Volgorde van checkbox vs. bevestigknop in de modal

## Deferred Ideas

Geen — discussie bleef binnen de phasescope.
