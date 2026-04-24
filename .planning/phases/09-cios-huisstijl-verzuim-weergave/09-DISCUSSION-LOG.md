# Phase 9: CIOS Huisstijl & Verzuim Weergave - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 09-cios-huisstijl-verzuim-weergave
**Areas discussed:** Typografie keuze, Navy kleurwaarde, Dark mode behandeling, Percentage tekst in tegel

---

## Typografie keuze

| Option | Description | Selected |
|--------|-------------|----------|
| System font stack | -apple-system, Segoe UI, Roboto. Geen externe laadtijd. Bold via font-weight 700. | ✓ |
| Inter via Google Fonts | Modern sans-serif, populair. Vereist internetverbinding. | |
| Poppins via Google Fonts | Ronder, vriendelijker. Onderwijs-populair. Vereist internetverbinding. | |
| Jij besluit | Claude kiest passend font. | |

**User's choice:** System font stack
**Notes:** Geen externe afhankelijkheden gewenst. Bold uitstraling via font-weight: 700 op koppen.

---

## Navy kleurwaarde

| Option | Description | Selected |
|--------|-------------|----------|
| Ik geef een hex op | Mentor kent de officiële CIOS kleur. | |
| #003057 (donker CIOS navy) | Klassiek universitair donkerblauw, goed contrast met #00AEEF. | ✓ |
| #002147 (diep marine) | Iets donkerder, formeler. | |
| Jij besluit | Claude leidt passende navy af. | |

**User's choice:** `#003057`
**Notes:** Visueel duidelijk onderscheiden van huidig #1a1a2e; goed contrast met cyaan en wit.

---

## Dark mode behandeling

| Option | Description | Selected |
|--------|-------------|----------|
| Alleen light mode | Dark mode CSS ongewijzigd. Minder risico. | |
| Beide modes updaten | Dark mode krijgt ook cyaan accenten en #003057 header. | ✓ |
| Dark mode verwijderen | Toggle en dark mode CSS verwijderd. | |

**User's choice:** Beide modes updaten

### Dark mode header kleur (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Donkerder navy variant | Bijv. #001a30 — donkerdere tint van #003057. | |
| Zelfde #003057 als light | Exact dezelfde headerkleur in beide modes. | ✓ |
| Jij besluit | Claude kiest passende dark mode header. | |

**User's choice:** Zelfde `#003057` als light mode
**Notes:** Consistente merkervaring; dark mode onderscheidt zich via page/surface achtergronden.

---

## Percentage tekst in tegel

| Option | Description | Selected |
|--------|-------------|----------|
| Vervangt "Xu ongeoorloofd" tekst | Zelfde positie onder de balk, minimale change. | ✓ |
| Percentage boven de balk | Prominent getal boven de 3-delige balk. | |
| Percentage én ongeoorloofd tonen | Twee regels: percentage + ongeoorloofd indien > drempel. | |

**User's choice:** Vervangt "Xu ongeoorloofd" tekst exact
**Notes:** Zelfde positie (onder verzuimbalk), zelfde font-size (0.75rem). Kleur neutraal (--text-muted).

---

## Claude's Discretion

- Exacte hover/light/border afgeleiden van `#00AEEF`
- Of spider-chart stroke-kleuren worden afgestemd op cyaan
- Exacte font-weight per element-type

## Deferred Ideas

Geen.
