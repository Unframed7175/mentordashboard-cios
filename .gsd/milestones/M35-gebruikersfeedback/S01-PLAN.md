# M35 — Gebruikersfeedback Milestone 1
# Datum: 2026-06-10

## Doel
Verwerking van eerste gebruikersfeedback: 6 fixes op UX, kleurcodering, prognose-logica en navigatiestatus.

## Taken

| ID | Taak | Bestanden | Status |
|---|---|---|---|
| T01 | F5: Ongelijke tegel-groottes — align-items: stretch op #klas-grid | src/index.css | ✅ |
| T02 | F2: Kleurcodering & labels — blauw voor sbc/versneld_sbc, vereenvoudigde labels, verzuim → ronde arcering | src/utils/status.ts · src/index.css · src/components/LeerlingTegel.tsx | ✅ |
| T03 | F1: Filter/sort staat vergeten bij navigatie — state tillen naar App.tsx | src/App.tsx · src/components/KlasOverzicht.tsx | ✅ |
| T04 | F6: Uitkomst-badge + blok-volgorde in doorstroomprognose | src/components/DoortstroomPrognoseSection.tsx | ✅ |
| T05 | F3: Verzuim als signaalblok in doorstroomprognose detail | src/components/DoortstroomPrognoseSection.tsx | ✅ |
| T06 | F4: Niet-ingeleverd/te laat telt als onvoldoende in prognoseberekening | utils/prognosis.ts | ✅ |

## Beslissingen
- sbc/versneld_sbc → blauw (was paars)
- sbl → label "SBL", naar_bj2 → "Naar BJ2", neutraal → "Twijfelgeval"
- Verzuim kleur-override verwijderd → ronde box-shadow ring op tegel
- Niet-ingeleverd/te-laat-niet-beoordeeld telt als onvoldoende in prognosis.ts
- Uitkomst-badge bovenaan doorstroomprognose, actuele route altijd als eerste blok
