# S01-PLAN.md — M42 Doorstroomnormering 2026/2027

> Fase: 1 (Spec) — GSD. Vervolg op ADR-16 (deelgebieden-schema, DONE), ADR-17 (architectuurbeslissingen Fase 0), ADR-17a (antwoorden OQ-1/OQ-2/OQ-3), ADR-17b (OQ-2 opgelost: Roosendaal "levels") en `/plan-eng-review` van 2026-09-16 (D2–D14 hieronder verwerkt).
> Bron: `26-27 Doorstroomnormeringen N3N4.pdf` (CIOS Zuidwest-NL, aangeleverd 2026-09-15).
> Doel: `berekenPrognose()` levert weer een echt SBL/SBC/BJ2/versneld_sbc/negatief-label i.p.v. `normen_onbekend`, conform het nieuwe beoordelingsmodel.

---

## Gap-analyse (huidig datamodel vs. nieuwe normen)

| Nodig voor nieuwe norm | Bestaat al? | Bron |
|---|---|---|
| Vestiging per klas (Roosendaal/Goes/Dordrecht) | ⚠️ Automatisch afleidbaar uit klascode (CSD/CSG/CSR) + handmatige override als fallback | ADR-17a |
| BPV-uren/opleidingsactiviteiten — hybride Onstage-import + handmatig | ⚠️ Handmatig deel bestaat al; **Onstage-parser blokkeert op ontbrekend voorbeeldbestand** | ADR-17a (OQ-1) |
| WVO-traject-deelname per BJ1-leerling | ❌ Nieuw handmatig veld | ADR-17 §2 |
| Fase (F1/F2/F3) als structureel veld per datapunt | ❌ Nu alleen tekstprefix in label | ADR-17 §3 |
| "Betekenisvol Bewegen"-subtelling (Professionele houding) | ✅ Afleidbaar uit bestaande datapunten (sectienaam) | ADR-17 §4 |
| Rekenen-domeintelling (aantal afgeronde eindtoets-domeinen) | ✅ Afleidbaar uit bestaande "Rekenen -eindtoets domein N"-datapunten | ADR-17 §4 |
| Nederlands schrijven/gesprekken op 2F/3F | ✅ Bestaat al (`nlSchrijven`, `nlGesprekvoeren`) | `DoortstroomPrognoseSection.tsx` |
| KD behaald/haalbaar vóór 1 december | ⚠️ Alleen status, geen deadline — bewust niet geautomatiseerd (ADR-17 §5) | `utils/keuzedelen.ts` |
| Roosendaal "levels 2/3 behaald" | ✅ Afleidbaar uit bestaande datapunten (naam-patroon `Level <n> <activiteit>` in sectie "Extern praktijkleren") | ADR-17b |
| BPV/POK-uren voldaan (handmatige basis) | ✅ Bestaat al (`pokUren`, `bpvGerealiseerd`) | `utils/bpv.ts` |
| Roosendaal SBL-vs-SBC-traject-keuze (BJ2) | ❌ Nieuw handmatig veld (zelfde patroon als WVO-traject) | eng-review D5 |
| Basiskerntaken B1K1/B1K2 (Goes/Dordrecht-SBC) | ❌ **Geblokkeerd** — geen databron gevonden in parser, PDF-samples of bestaande handmatige velden | eng-review D10 |
| Vestiging bij `berekenPrognose`/`berekenStatus` | ❌ Geen van de 3 aanroepplekken (status.ts, KlasOverzicht.tsx, DetailWeergave.tsx) geeft vestiging door | eng-review D12 |

---

## Open vragen — status

- **OQ-1 (opleidingsactiviteiten):** ✅ beantwoord — hybride Onstage-import + handmatig, zie ADR-17a. Blokkerend detail: geen voorbeeld-Onstage-export ontvangen; parsertaak (T13) kan pas starten zodra die er is. Het "voldaan"-criterium zelf kan intussen op de bestaande handmatige BPV-velden draaien (T9 hoeft niet op T13 te wachten).
- **OQ-2 (Roosendaal "levels"):** ✅ opgelost — 2 voorbeeldexports ontvangen (BJ1 Fase 1 en BJ2). "Levels" zijn benoemde datapunten (`Level <n> <activiteit>`) in de sectie "Extern praktijkleren", geen nieuw databegrip. Zie ADR-17b. T9c is niet langer geblokkeerd.
- **OQ-3 (vestiging-detectie):** ✅ beantwoord — automatisch uit klascode-prefix (CSD/CSG/CSR), met handmatige override als fallback. Zie T1 hieronder.

---

## Taken (na `/plan-eng-review` 2026-09-16 — klaar voor executie op het niet-geblokkeerde deel)

### Lane A — Datamodel-uitbreiding
- **T1** — Vestiging-detectie: `detecteerVestiging(klasNaam)`. **D7:** matcht alléén het eerste spatie/streepje-gescheiden token van de klasnaam, case-insensitive, tegen exact `CSD`/`CSG`/`CSR` (geen substring-zoektocht — "CSGroep1" matcht dus niét). Plus `vestiging`-override-veld op klas-niveau (`klassenState.klassen[id].vestigingOverride`) voor wanneer de klasnaam geen/verkeerde code bevat. Effectieve vestiging = override ?? gedetecteerd ?? null (→ `normen_onbekend`). Kleine UI in klas-instellingen voor de override.
- **T2** — `fase: number | null`-veld op datapunt, geëxtraheerd in `parsers/pdf.ts` uit de bestaande labeltekst (regex op leidend `F<n>`-token, met en zonder `- `-prefix; anker aan het begin van de string om valse treffers als "Formulier F1" te voorkomen). **D4:** datapunten zonder herkenbare fase krijgen `fase: null`, en `fase: null` telt mee in élke fase-gefilterde telling (nooit uitgesloten) — dit dekt zowel Roosendaal's "Intern/Extern praktijkleren" (draagt geen F-prefix) als leerlingen die vóór deze update al zijn geïmporteerd (zie "Bekende beperking" hieronder).
- **T3** — WVO-traject-veld op leerling (`student.wvoTraject: boolean | null`), nieuwe kleine UI-sectie in `DetailWeergave` (BJ1-leerlingen), overleeft re-import zoals `kdStatus`/`actiepunten`. **D9:** `wvoTraject: null` sluit alléén de versneld_sbc-tak uit (zoals een ontbrekende deelscore dat ook al doet) — naar_bj2/negatief blijven gewoon berekenbaar.
- **T3b** *(eng-review D5)* — Roosendaal BJ2-traject-keuze: `student.roosendaalTraject: 'sbl' | 'sbc' | null`, zelfde UI-/persistence-patroon als T3. Zonder invulling: `normen_onbekend` voor die leerling (alleen relevant binnen T9c/Roosendaal).
- **T7b** *(eng-review D12, zelf gemist in de architectuur-review)* — Vestiging bereikbaar maken voor de engine: `berekenPrognose`/`berekenStatus` krijgen een optionele vestiging-parameter; de 3 echte aanroepplekken (`src/utils/status.ts`, `KlasOverzicht.tsx`, `DetailWeergave.tsx`) geven de vestiging van de actieve klas door (al bekend via `klassenState`). Zonder deze taak kan T7's per-vestiging-normenprofiel de engine nooit bereiken.
- **T13** — *(geblokkeerd op OQ-1-voorbeeldbestand)* Onstage-BPV-import: nieuwe parser naast de bestaande Cumlaude-BPV-Excel-import (F-03), met handmatige correctie/aanvulling zoals nu al kan. Scope pas te bepalen zodra een voorbeeldexport binnen is.
- **T9b-1** *(eng-review D10, geblokkeerd)* — Databron voor "Basiskerntaken B1K1/B1K2" (Goes/Dordrecht-SBC-eis) uitzoeken bij CIOS Goes/Dordrecht-collega's: los datapunt in de PDF, aparte registratie, of iets anders? Zonder dit is T9b niet uitvoerbaar.

### Lane B — Nieuwe aggregatiefuncties (puur rekenlogica, TDD)
- **T4/T5/T6b** — **D6:** gedeelde helper `telDatapuntenMetPatroon(datapunten, naamPatroon, statusPredicate)` (nieuw, in `utils/prognosis.ts` of `utils/datapuntTelling.ts`), met drie smalle specialisaties:
  - `telBetekenisvolBewegenProfHouding()`: telt hoeveel van de 4 "Betekenisvol Bewegen"-praktijkbeoordelingen ≥voldoende zijn.
  - `telRekenDomeinen()`: telt afgeronde eindtoets-domeinen + haalt hoogste behaald rekenniveau op.
  - `alleLevelsBehaald(datapunten, level)`: matcht naam-patroon `Level <n> <activiteit>` ÓF `<activiteit> level <n>` (woordvolgorde niet vast — matchen op het cijfer, niet op positie) en controleert dat élk gevonden datapunt een positief-ingeleverde status heeft. Aantal gevonden datapunten is niet vast (groeit gedurende het jaar) — zie ADR-17b.
- **T6** — Fase-gefilterde leerlijn-telling. **D14 (eng-review, belangrijk):** bron is `student.datapunten` (met de nieuwe `fase`-tag uit T2), NIET `student.deelgebiedScores` — dat laatste is al een hele-jaar "laatste-score-wint"-aggregaat zonder fase-informatie; filteren daarop zou per ongeluk het hele jaar tellen i.p.v. één fase. Combineert met de bestaande `activeDeelgebiedenIds`-filter (Phase 18) — test beide filters samen. **Verplicht (Lane A final-review, D-later):** lees fase altijd via het geëxporteerde `getFase(dp)` uit `parsers/pdf.ts`, nooit `dp.fase` rechtstreeks — anders worden leerlingen die vóór Lane A al zijn geïmporteerd (fase-property ontbreekt, is `undefined`, niet `null`) stilzwijgend uitgesloten i.p.v. meegeteld (zie "Bekende beperking" hierboven).

### Lane C — Vestiging-bewuste doorstroomengine
- **T7** — Nieuw normenprofiel-type per vestiging (Roosendaal / Goes / Dordrecht). **D2:** nieuwe functie `getNormenVoorVestiging(vestiging)` in `utils/normen.ts`, náást de bestaande `getNormenSync()` (die ongewijzigd blijft — geen signature-wijziging op een functie met 3+ bestaande aanroepers). **D3:** opgeslagen onder een NIEUWE store-key (bv. `doorstroom_normen_per_vestiging`); de oude `doorstroom_normen`-key blijft ongebruikt staan, geen migratie.
- **T8** — `berekenPrognose()` BJ1-tak herschrijven naar het nieuwe 3-uitkomsten-model (naar_bj2 / versneld_sbc / negatief) met fase-2-scoping (via T6) + WVO-traject-check (via T3, zie D9). **D8:** het brondocument se "bespreekgeval" (niet aan alle eisen voldaan, geen van beide positieve paden) hergebruikt het bestaande label `neutraal` — geen nieuw label. **D16 (correctie, Lane C pre-flight — het brondocument, p.3, is NIET generiek):** Roosendaal heeft twee aanvullende BJ1-drempels bovenop de generieke criteria: `naar_bj2` vereist voor Roosendaal aanvullend **minimaal 4 levels afgerond** (via T6b's `alleLevelsBehaald`/level-telling); `versneld_sbc` vereist voor Roosendaal aanvullend **minimaal 8 levels afgerond**. Het brondocument noemt bij `versneld_sbc` letterlijk "minimaal 8 levels afgerond voor SBL en minimaal 10 levels voor SBC" in één kolom zonder BJ1-traject-keuzeveld — **projectlead-beslissing (2026-09-18):** dit is ÉÉN drempel (≥8), niet een dubbele poort; de "10 voor SBC"-vermelding is vooruitwijzende info voor de latere BJ2-traject-keuze (T3b/T9c), geen tweede BJ1-gate. Geen nieuw BJ1-traject-veld nodig. T8 gebruikt hiervoor de al doorgegeven vestiging (T7b) — geen aparte per-vestiging-normen-call nodig voor dit specifieke stuk, want de level-drempel is code-vast (brondocument), niet configureerbaar via T7's normenprofiel.
- **T9** — `berekenPrognose()` BJ2-tak herschrijven, opgesplitst per vestiging:
  - **T9a** — generiek SBL/SBC-pad. **D13 (eng-review, geverifieerd tegen brondocument):** `KERN_SBC` (`['V&A','P&O','C&B','1E&B']`) wordt verwijderd — het nieuwe document heeft voor dit pad géén kern-deelgebieden-eis, alleen het totaalaantal ("minimaal 10 deelgebieden voldoende"); de oude labels bestaan bovendien niet meer in het huidige schema.
  - **T9b** — Goes/Dordrecht-SBC-pad (basiskerntaken B1K1/B1K2) — **blijft geblokkeerd tot T9b-1 een databron heeft opgeleverd.**
  - **T9c** — Roosendaal-keuzeproces-pad: gebruikt T3b's `roosendaalTraject`-veld om te bepalen welk criteria-pad (SBL-examinering of profieljaar-SBC) van toepassing is, plus "alle levels N behaald" via T6b.
- **T10** — `SUPPORTED_LEERLIJNEN`/schema-guard (ADR-16) bijwerken zodat de nieuwe engine als "ondersteund schema" geldt; `normen_onbekend` blijft het pad voor klassen zonder (afgeleide of override-)vestiging.

### Lane D — UI
- **T11** — `SettingsPage.tsx` normen-sectie herzien: per-vestiging profielen configureerbaar i.p.v. één vaste set (huidige `max=19`-velden zijn sowieso stale, zie ADR-16-vervolg).
- **T12** — `DoortstroomPrognoseSection.tsx`: nieuwe criteria-rijen (fase-scoping, Betekenisvol Bewegen, WVO-traject, vestiging-specifieke SBC-pad) i.p.v. de huidige (nu dode) 3-leerlijnen-rijen.

**Volgorde-advies:** Lane A eerst (T7b en T3b zijn klein maar randvoorwaardelijk voor Lane C; T13 en T9b-1 los oppakken zodra hun voorbeeldbestanden er zijn), dan B (los toetsbaar), dan C (T9a/T9c/T10 kunnen nu, T9b blijft on hold), D laatst (leunt op C).

## Bekende beperking (eng-review D11, bewust geen aparte taak)

Leerlingen die vóór deze update al zijn geïmporteerd (mentoren doen dit nu al met echte 2026/2027-PDF's) hebben **geen `fase`-property op hun datapunten** (`undefined`, niet een expliciete `null`) — die property wordt pas bij parse-tijd toegevoegd (T2). **Correctie (final-review Lane A):** D4's "fase=null telt overal mee" geldt alleen als elke consument leest via het geëxporteerde `getFase(dp)` (`parsers/pdf.ts`), dat zowel `undefined` als `null` normaliseert naar `null` — een directe `dp.fase === null`-vergelijking mist deze legacy-datapunten stilzwijgend. Lane B's fase-gefilterde telling (T6) **moet** `getFase()` gebruiken, nooit `dp.fase` rechtstreeks lezen. Dankzij die normalisatie breekt dit niet: fase-2-scoping werkt voor deze leerlingen simpelweg nog niet totdat ze opnieuw geïmporteerd worden (wat toch al gebeurt bij elke nieuwe periode). Geen crash, geen foutieve telling — alleen minder precies tot her-import. Niet apart bouwen (geen her-import-banner); wel expliciet vermeld zodat niemand aanneemt dat fase-scoping met terugwerkende kracht werkt.

---

## Niet in scope (deze milestone)

- Herijking van de *bestaande* `KERN_SBC`/`DEFAULT_NORMEN` als losstaande actie — vervalt, wordt volledig vervangen door de vestiging-bewuste engine (Lane C).
- Migratie-tooling voor historische leerlingen op het oude 19-deelgebieden-schema (geen coexistentie nodig, bevestigd door projectlead — ADR-16).
- Automatisering van de KD-"1 december"-deadline (ADR-17 §5, expliciet uitgesteld).
- **T13 (Onstage-import)** — pas in scope zodra een voorbeeldbestand binnen is; de rest van M42 hoeft daar niet op te wachten.
- **T9b (Goes/Dordrecht basiskerntaken-pad)** — pas in scope zodra T9b-1 een databron voor B1K1/B1K2 heeft opgeleverd (eng-review D10); T9a/T9c/rest van M42 hoeft daar niet op te wachten.
- **Her-import-prompt/banner voor pre-M42-leerlingen zonder fase-tag** — bewust niet gebouwd, zie "Bekende beperking" hierboven (eng-review D11).

## DoD Fase 1 — afgerond, `/plan-eng-review` 2026-09-16 CLEAR op het niet-geblokkeerde deel

- [x] OQ-1/OQ-3 beantwoord door projectlead (ADR-17a)
- [x] OQ-2 — Roosendaal-voorbeeldexports ontvangen en verwerkt (ADR-17b); T9c niet langer geblokkeerd
- [x] `/plan-eng-review` uitgevoerd 2026-09-16: 4 architectuur-issues (D2–D5), 2 code-kwaliteit-issues (D6–D7), 2 test-issues (D8–D9), outside-voice met 5 bevindingen (D10–D14) — alle verwerkt in de taken hierboven
- [x] Taken T1–T12 (excl. T13/T9b) + nieuwe T3b/T7b/T9b-1 hebben elk een concreet bestand + acceptatiecriterium
- [x] Geen UI-vragen open die eerst Fase 3 (design) nodig hebben — bevestigd: rekenlogica + bestaande UI-patronen (settings-select, checkbox-veld zoals keuzedelen)
- [ ] T9b-1 (B1K1/B1K2-databron) en T13 (Onstage-sample) blijven open — niet blokkerend voor start van Fase 2 op de rest

---

## Wat al bestaat (hergebruikt, niet opnieuw gebouwd)

| Bouwsteen | Bestaand patroon | Hergebruikt door |
|---|---|---|
| Sync-cache-accessor voor store-gebaseerde config | `getNormenSync()`/`getVerzuimDrempelsSync()`/`getLeerlijnenMappingSync()` (pre-warm bij startup, sync read in engine) | T7's `getNormenVoorVestiging()` |
| Handmatig veld dat re-import overleeft | `kdStatus`/`actiepunten` (niet overschreven door parser-merge) | T3 (WVO-traject), T3b (Roosendaal-traject) |
| Open-world parse / closed-world aggregatie-scheiding | `parsers/pdf.ts` (raw) vs. `utils/aggregation.ts`/`utils/prognosis.ts` (interpretatie) | T4/T5/T6/T6b staan bewust in de aggregatie-laag, niet in de parser |
| RAG-statuslabel-mapping | `berekenStatus()`'s label→kleur-tabel in `src/utils/status.ts` | T8/T9's nieuwe labels hergebruiken bestaande kleuren (`neutraal`→oranje, etc.) |
| `activeDeelgebiedenIds`-filter (Phase 18) | al aanwezig in `berekenPrognose()` | T6 combineert dit met de nieuwe fase-filter |
| Store-key-versionering via "nieuwe key, oude genegeerd" | ADR-16's aanpak voor het deelgebieden-schema zelf | T7's normen-opslag (D3) |

Niets hiervan wordt onnodig herbouwd — de nieuwe taken zijn allemaal nieuwe *toepassingen* van bestaande patronen, geen nieuwe patronen.

## Diagram — doorstroombesluit per traject en vestiging

```
berekenPrognose(student, traject, vestiging)
    │
    ├─ vestiging = null?  →  normen_onbekend (ADR-16-patroon)
    │
    └─ vestiging bekend  →  getNormenVoorVestiging(vestiging)
            │
            ├─ traject = bj1 (T8) ─────────────────────────────────────────────
            │     │
            │     ├─ negatief?        4+ dg 'onvoldoende' in fase 2, of
            │     │                   >4 datapunten onbeoordeeld in fase 2
            │     │                       → negatief
            │     │
            │     ├─ versneld_sbc?    fase-2 L&O ≥5 goed + ProfH ≥3 goed
            │     │                   + BVB 3/4 + WVO=true + NL richting 3F
            │     │                   + Rek MBO4 (3 domeinen) + stage-eisen
            │     │                   + Roosendaal aanvullend: ≥8 levels afgerond
            │     │                       → versneld_sbc
            │     │
            │     ├─ naar_bj2?        ≥9 dg voldoende + ProfH-aanvulling BVB 3/4
            │     │                   + NL richting 2F + Rek MBO3 (3 domeinen)
            │     │                   + stage-eisen
            │     │                   + Roosendaal aanvullend: ≥4 levels afgerond
            │     │                       → naar_bj2
            │     │
            │     └─ anders               → neutraal ("bespreekgeval")
            │
            └─ traject = bj2 (T9) ─────────────────────────────────────────────
                  │
                  ├─ vestiging = Roosendaal? (T9c)
                  │     │
                  │     └─ roosendaalTraject?
                  │           ├─ 'sbl'  fase-3 ≥7 dg voldoende + alle levels 2 behaald
                  │           │             → sbl / negatief
                  │           └─ 'sbc'  gebruikt T9a-pad (generiek SBL/SBC) + alle levels 3 behaald
                  │
                  └─ anders (generiek / Goes-Dordrecht)
                        │
                        ├─ generiek SBL/SBC (T9a)   ≥7 dg voldoende → sbl
                        │                            ≥10 dg voldoende → sbc
                        │                            (GEEN kern-deelgebieden-check meer, D13)
                        │
                        └─ Goes/Dordrecht (T9b)      basiskerntaken B1K1/B1K2
                                                       — GEBLOKKEERD op T9b-1
```

## Failure modes (per nieuwe codepad)

| Codepad | Realistisch faalscenario | Test? | Foutafhandeling? | Zichtbaar of stil? |
|---|---|---|---|---|
| T1 `detecteerVestiging` | Klas hernoemd zonder code, geen override | ja (nieuw) | `normen_onbekend`-pad (bestaand); sinds de Lane-A-fix toont de "Automatisch"-optie in `KlasTabStrip` expliciet "niet herkend" i.p.v. een stille lege staat | **Zichtbaar in de vestiging-select** (Lane A-fix). De grijze "Normen onbekend"-tegel zelf verschijnt pas zodra T7b/T10 vestiging in de prognose-engine verwerken — vóór die taken heeft een niet-herkende vestiging geen effect op de klasoverzicht-tegel. |
| T2 fase-regex | Onverwacht labelformaat (nieuwe PDF-lay-out) | ja (nieuw, incl. edge cases) | valt terug op `fase: null` (nooit throw) | Stil, maar **veilig** (D4: telt overal mee, geen uitsluiting) |
| T3/T3b handmatige velden | Re-import overschrijft handmatige invoer per ongeluk | **ja — verplicht, zelfde patroon als bestaande `kdStatus`-regressietest** | merge-logica moet handmatige velden expliciet overslaan | **Kritiek als dit ontbreekt** — stille dataverlies |
| T6 fase-telling | Dubbeltelling van fase=null-datapunten in twee fase-emmers tegelijk | ja (nieuw) | telfunctie moet één-op-één tellen, geen overlap | Stil als getest wordt gemist — foutieve (te hoge) telling |
| T7b vestiging-plumbing | Een 4e aanroepplek (toekomstig) vergeet vestiging door te geven | n.v.t. (toekomstig) | valt terug op `normen_onbekend` (veilig default) | **Zichtbaar**, nooit stil-fout |
| T8/T9 ontbrekende deelscore | Rekenscore/Nederlands-score nog niet ingevuld | ja (bestaand patroon: null telt niet als voldaan) | consistent met bestaande null-behandeling | Zichtbaar via gaps-object in UI |

Geen van deze faalscenario's is stil-fout zonder test of foutafhandeling — de "veilig falen naar `normen_onbekend`"-filosofie (ADR-16) dekt de meeste randgevallen af. De enige die als **kritiek** gemarkeerd is (T3/T3b re-import-overschrijving) moet een verplichte regressietest krijgen tijdens executie, geen losse beslissing.

## Worktree-parallellisatiestrategie

| Stap | Modules | Hangt af van |
|---|---|---|
| T1 (vestiging-detectie) | `utils/klassen.ts`, klas-instellingen-UI | — |
| T2 (fase-extractie) | `parsers/pdf.ts` | — |
| T3/T3b (handmatige velden) | `utils/datamodel.ts`/`utils/klassen.ts`, `DetailWeergave.tsx` | — |
| T4/T5/T6/T6b (aggregatiefuncties) | `utils/prognosis.ts` (nieuw bestand mogelijk) | T2 (voor T6's fase-data) |
| T7/T7b (normen + plumbing) | `utils/normen.ts`, `utils/prognosis.ts`, `src/utils/status.ts`, `KlasOverzicht.tsx`, `DetailWeergave.tsx` | T1 (vestiging moet bestaan) |
| T8/T9/T10 (engine) | `utils/prognosis.ts` | T4–T6b, T7/T7b |
| T11/T12 (UI) | `SettingsPage.tsx`, `DoortstroomPrognoseSection.tsx` | T7–T10 |

**Lane A** (parallel, geen onderlinge afhankelijkheid): T1 · T2 · T3/T3b — alle drie raken verschillende bestanden, geen gedeelde module.
**Lane B** (wacht op T2): T4 · T5 · T6 · T6b — onderling parallel (los toetsbaar), maar T6 heeft T2's fase-data nodig.
**Lane C** (sequentieel, gedeeld bestand `utils/prognosis.ts`): T7 → T7b → T8 → T9 → T10 — deze raken allemaal dezelfde engine-file, dus na elkaar, niet naast elkaar.
**Lane D** (wacht op Lane C): T11 · T12 — onderling parallel, beide leunen op de afgeronde engine.

**Uitvoeringsvolgorde:** Launch Lane A (T1, T2, T3/T3b) parallel in 3 worktrees. Merge. Dan Lane B (T4/T5/T6/T6b) parallel in worktrees, T6 pas na T2's merge. Merge. Dan Lane C sequentieel (zelfde bestand — geen worktree-winst, wél TDD-stapsgewijs). Dan Lane D parallel.

**Conflictwaarschuwing:** T7, T7b, T8, T9, T10 raken allemaal `utils/prognosis.ts` — expliciet sequentieel houden, niet als "parallel genoeg" behandelen ondanks dat het losse taken lijken.

## Implementation Tasks

Gesynthetiseerd uit deze review. Elke taak komt uit een specifieke bevinding hierboven.

- [ ] **T1 (P1, human: ~1u / CC: ~10min)** — utils/klassen.ts — Vestiging-detectie + override-veld
  - Surfaced by: ADR-17a OQ-3, eng-review D7 (strikte token-match)
  - Files: `utils/klassen.ts`, klas-instellingen-UI
  - Verify: unit tests op alle CSD/CSG/CSR-varianten + false-positive-preventie ("CSGroep1")
- [ ] **T2 (P1, human: ~1u / CC: ~10min)** — parsers/pdf.ts — Fase-extractie uit datapunt-label
  - Surfaced by: ADR-17 §3, eng-review D4
  - Files: `parsers/pdf.ts`
  - Verify: unit tests incl. geen-prefix (→null), dash/geen-dash, geen valse treffer op "Formulier F1"
- [ ] **T3 (P1, human: ~45min / CC: ~10min)** — DetailWeergave.tsx — WVO-traject-veld
  - Surfaced by: ADR-17a OQ-1-aangrenzend, eng-review D9
  - Files: `utils/datamodel.ts`, `src/components/DetailWeergave.tsx`
  - Verify: unit test re-import-persistentie (regressiepatroon van `kdStatus`) + wvoTraject=null blokkeert alleen versneld_sbc
- [ ] **T3b (P1, human: ~30min / CC: ~5min)** — DetailWeergave.tsx — Roosendaal-traject-keuze-veld
  - Surfaced by: eng-review D5
  - Files: `utils/datamodel.ts`, `src/components/DetailWeergave.tsx`
  - Verify: zelfde testpatroon als T3
- [ ] **T4/T5/T6b (P1, human: ~2u / CC: ~20min)** — utils/prognosis.ts — Gedeelde telDatapuntenMetPatroon() + 3 specialisaties
  - Surfaced by: ADR-17 §4, ADR-17b, eng-review D6 (DRY)
  - Files: `utils/prognosis.ts` (of nieuw `utils/datapuntTelling.ts`)
  - Verify: unit tests per specialisatie + woordvolgorde-onafhankelijkheid voor Level-matching
- [ ] **T6 (P1, human: ~1.5u / CC: ~15min)** — utils/prognosis.ts — Fase-gefilterde leerlijn-telling
  - Surfaced by: eng-review D14 (bron = datapunten, niet deelgebiedScores)
  - Files: `utils/prognosis.ts`
  - Verify: unit test dat bevestigt geen dubbeltelling + combinatie met activeDeelgebiedenIds
- [ ] **T7 (P1, human: ~1u / CC: ~10min)** — utils/normen.ts — getNormenVoorVestiging() + nieuwe store-key
  - Surfaced by: eng-review D2, D3
  - Files: `utils/normen.ts`
  - Verify: unit tests per vestiging + bevestiging dat oude 'doorstroom_normen'-key ongemoeid blijft
- [ ] **T7b (P1, human: ~1u / CC: ~10min)** — src/utils/status.ts, KlasOverzicht.tsx, DetailWeergave.tsx — Vestiging doorgeven aan de engine
  - Surfaced by: eng-review D12
  - Files: `utils/prognosis.ts`, `src/utils/status.ts`, `src/components/KlasOverzicht.tsx`, `src/components/DetailWeergave.tsx`
  - Verify: integratietest die bevestigt dat een klas se vestiging daadwerkelijk het juiste normenprofiel oplevert
- [ ] **T8 (P1, human: ~2u / CC: ~20min)** — utils/prognosis.ts — BJ1 3-uitkomsten-model
  - Surfaced by: ADR-17a, eng-review D8, D9
  - Files: `utils/prognosis.ts`
  - Verify: unit tests per uitkomst (naar_bj2/versneld_sbc/negatief/neutraal) × fase-2-scoping × WVO-varianten
- [ ] **T9a (P1, human: ~1.5u / CC: ~15min)** — utils/prognosis.ts — Generiek BJ2 SBL/SBC-pad
  - Surfaced by: ADR-17a, eng-review D13 (KERN_SBC verwijderen)
  - Files: `utils/prognosis.ts`
  - Verify: unit tests sbl/sbc/negatief zonder kern-check
- [ ] **T9c (P1, human: ~1.5u / CC: ~15min)** — utils/prognosis.ts — Roosendaal-keuzeproces-pad
  - Surfaced by: ADR-17b, eng-review D5
  - Files: `utils/prognosis.ts`
  - Verify: unit tests per roosendaalTraject-waarde × alleLevelsBehaald-varianten
- [ ] **T10 (P1, human: ~30min / CC: ~10min)** — utils/prognosis.ts — Schema-guard bijwerken
  - Surfaced by: ADR-16, eng-review D12 (vestiging-afhankelijkheid)
  - Files: `utils/prognosis.ts`
  - Verify: **REGRESSIE (verplicht, IRON RULE)** — `tests/prognosis.schemaGuard.test.ts` moet worden herschreven: het huidige 12-deelgebieden-schema is straks weer "ondersteund" en mag geen `normen_onbekend` meer teruggeven wanneer vestiging bekend is
- [ ] **T11 (P2, human: ~1.5u / CC: ~15min)** — SettingsPage.tsx — Per-vestiging normen-UI
  - Surfaced by: ADR-16-vervolg
  - Files: `src/components/SettingsPage.tsx`
  - Verify: component-test analoog aan bestaande SettingsPage.test.tsx
- [ ] **T12 (P2, human: ~1.5u / CC: ~15min)** — DoortstroomPrognoseSection.tsx — Nieuwe criteria-rijen
  - Surfaced by: hele milestone
  - Files: `src/components/DoortstroomPrognoseSection.tsx`
  - Verify: component-test per vestiging-pad
- [ ] **T9b-1 (P3, geblokkeerd, human: ~30min navraag / CC: n.v.t.)** — CIOS Goes/Dordrecht — Databron B1K1/B1K2 uitzoeken
  - Surfaced by: eng-review D10
  - Files: n.v.t. (onderzoek, geen code)
  - Verify: n.v.t.
- [ ] **T9b (P3, geblokkeerd op T9b-1)** — utils/prognosis.ts — Goes/Dordrecht basiskerntaken-pad
  - Surfaced by: ADR-17a
  - Files: `utils/prognosis.ts`
  - Verify: unit tests zodra databron bekend is
- [ ] **T13 (P3, geblokkeerd op OQ-1-sample)** — nieuwe parser — Onstage-BPV-import
  - Surfaced by: ADR-17a OQ-1
  - Files: nieuw bestand in `parsers/`
  - Verify: n.v.t. tot sample binnen is

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | niet uitgevoerd (geen groot product-/scope-besluit, engineering-interne wijziging) |
| Outside Review | Claude subagent (Codex niet geïnstalleerd) | Independent 2nd opinion | 1 | completed | 5 bevindingen (B1K1/B1K2-databron, fase-migratie pre-M42, vestiging-plumbing, dode KERN_SBC, fase-telbron) — alle geverifieerd en verwerkt (D10–D14) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 (dit plan) | CLEAR | 10 issues (4 architectuur, 2 code-kwaliteit, 2 test, 2 nieuwe taken uit outside-voice), 0 unresolved, 0 open kritieke gaps (T3/T3b-regressie is nu een verplicht Verify-punt) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 (voor M42) | — | niet uitgevoerd — geen nieuwe designvragen, rekenlogica + hergebruik van bestaande UI-patronen (settings-select, checkbox zoals keuzedelen) |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | niet uitgevoerd |

**OUTSIDE COVERAGE:** provider=Claude subagent (Codex niet geïnstalleerd op deze machine), phase=plan-review, status=completed. 5 findings, allemaal geaccepteerd en verwerkt in de taken hierboven (D10–D14). Geen Codex-dekking beschikbaar — installeer `@openai/codex` voor een echte outside-model-read bij een volgende review.

**CROSS-MODEL:** n.v.t. — geen native Codex-pass naast de Claude-subagent-pass, dus geen cross-model-vergelijking mogelijk voor dit plan.

**VERDICT:** ENG CLEARED — klaar voor Fase 2-executie op T1–T12 excl. T9b (blijft geblokkeerd op T9b-1) en T13 (blijft geblokkeerd op OQ-1-sample).

NO UNRESOLVED DECISIONS
