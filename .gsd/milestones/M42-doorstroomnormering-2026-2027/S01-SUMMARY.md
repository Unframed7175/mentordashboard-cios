# S01-SUMMARY.md — M42 Doorstroomnormering 2026/2027

> Eigendom: Superpowers (Fase 2 DoD-punt, zie CLAUDE.md schrijfrechten-tabel). Samenvatting van alle uitgevoerde taken uit `S01-PLAN.md`. Details/besluiten per taak staan in de commit-historie en in `.gsd/DECISIONS.md` (ADR-17 t/m ADR-17e); dit bestand is het overzicht.

## Status: alle taken (T1-T12) klaar, gereviewd, gemerged

| Lane | Taken | Status |
|---|---|---|
| A | T1 (vestiging-detectie), T2 (fase-extractie), T3 (WVO-traject-veld), T3b (Roosendaal-traject-keuze) | DONE, gemerged 2026-09-15/16 |
| B | T4/T5/T6b (`telDatapuntenMetPatroon` + specialisaties), T6 (fase-gefilterde leerlijn-telling) | DONE, gemerged 2026-09-16/17 |
| C | T7 (`VestigingNormen`), T7b (vestiging in `berekenPrognose`), T8 (`berekenBj1Uitkomst`), T9a/T9c (`berekenBj2GeneriekPad`/`berekenBj2RoosendaalSblKeuze`), T10 (schema-guard retirement) | DONE, gemerged via PR #28 (2026-09-21) |
| D | T11 (SettingsPage per-vestiging normen UI), T12 (DoortstroomPrognoseSection block-layout) | DONE, gemerged via PR #28 (2026-09-21) |

**Geblokkeerd, buiten scope van deze milestone-fase:**
- T9b (Goes/Dordrecht) — wacht op databron B1K1/B1K2, projectlead zoekt dit zelf uit.
- T13 (Onstage-BPV-import) — wacht op een voorbeeldbestand.

## Wat is gebouwd

Een nieuwe, vestiging-bewuste doorstroomnormering-engine die het CIOS-beoordelingsmodel 2026/2027 implementeert:

- **Vestiging** (Roosendaal/Goes/Dordrecht) als klas-eigenschap, automatisch herkend uit de klascode met handmatige override (`KlasTabStrip`).
- **Fase-extractie** uit datapunt-labeltekst (structureel veld, geen nieuwe databron nodig).
- **WVO-traject** en (Roosendaal-only) **BJ2-traject-keuze** (SBL/SBC) als nieuwe leerling-velden.
- **`VestigingNormen`**: per-vestiging drempelwaarden-profiel (naast de generieke `Normen`), incl. Roosendaal-only "levels afgerond"-eisen.
- Drie BJ1/BJ2-beslisfuncties (`berekenBj1Uitkomst`, `berekenBj2GeneriekPad`, `berekenBj2RoosendaalSblKeuze`) die samen het volledige nieuwe beoordelingsmodel dekken, inclusief het nieuwe `bespreekgeval`-label voor BJ2 (geen negatief-tier, ADR-17d).
- SettingsPage sectie 5 (Doorstroomdrempels) volledig herbouwd voor de per-vestiging-architectuur; DoortstroomPrognoseSection herbouwd rond de nieuwe gaps-vorm.

## `/review` (2026-09-21/22) — bevindingen en fixes

Volledige samenvatting: zie PR #28-comment en `.gsd/STATE.md`-handoff 2026-09-22. Kort:
- Lost-update race in per-vestiging-normen-opslag → serialiserende FIFO-queue (`caa67d3`).
- `debugPrognose` (dev-console) las pre-migratie-veldnamen sinds T8 → hersteld + een tweede, zelf-gevonden bug (`onvoldoendeRuimte`) in dezelfde functie (`cfbeaed`).
- Twee ontbrekende precedence-regressietests (`negatief` > `versneld_sbc`, `sbc` > `sbl`) (`6471707`).
- **`telLevelsAfgerond` telde losse activiteiten i.p.v. volledig afgeronde levels** — geverifieerd tegen de echte Roosendaal-voorbeeld-PDF's, tot 4x te soepel voor de Roosendaal-drempels (`003c4e5`).

## Release-prep (2026-09-22, zie STATE.md-handoff voor volledige details)

`npm audit fix` (high-severity schoon), een live axe-core wcag2aa-sweep (1 M42-regressie + 2 kleine vooraf-bestaande bugs gefixt; grotere vooraf-bestaande a11y-debt bewust genoteerd, niet gefixt), CHANGELOG-entry + versiebump naar 2.12.0, PR #29 (`feature/deelgebieden-schema-2026-2027` → `master`) geopend met groene CI.

**Nog open:** `/qa`-skill niet gedraaid, LEARNINGS niet geschreven, geen release-tag gepusht (bewuste, aparte vervolgstap).
