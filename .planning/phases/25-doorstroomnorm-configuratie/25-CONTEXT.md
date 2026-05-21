# Phase 25: Doorstroomnorm Configuratie - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 25 haalt de vijf hardcoded doorstroomdrempelwaarden uit `utils/prognosis.ts` en maakt ze runtime-configureerbaar via een nieuwe "Doorstroomdrempels" sectie in `SettingsPage.tsx`. Wijzigingen worden persistent opgeslagen via plugin-store en de prognose-engine herberekent direct na elke drempelwijziging zonder app-herstart.

In scope: NORM-01 t/m NORM-07 — SBL, SBC, negatief totaal, negatief per leerlijn, BJ1 versneld-SBC drempels aanpasbaar + persistentie + "Herstel standaard" + directe herberekening.

Niet in scope: UI voor klasoverzicht score-telling (Phase 26), klasbeheer (Phase 27), of andere settings-uitbreidingen.

</domain>

<decisions>
## Implementation Decisions

### SettingsPage plaatsing

- **D-01:** Doorstroomdrempels wordt een **nieuwe sectie 5** in `SettingsPage.tsx` — een aparte `<section className="detail-section">` toegevoegd ná sectie 4 ("Drempelwaarden & BPV-uren"). Geen subsectie in de bestaande sectie 4.
- **D-02 (Claude's discretion):** Sectie 5 heeft zijn eigen **"Herstel standaard"** knop conform het Phase 18 patroon (sectie 3 + sectie 4 hebben ook elk hun eigen reset). Reset zet alle drempels terug naar de CIOS-normen uit `DEFAULT_NORMEN`.

### BJ1 vs BJ2 layout in sectie 5

- **D-03:** Sectie 5 bevat **twee visuele blokken**:
  - **BJ2-drempels:** SBL-drempel (≥V), SBC-drempel (≥V), negatief totaal (O), negatief per leerlijn (O) — 4 inputs
  - **BJ1-drempels:** BJ1-positief drempel (≥V voor doorstroom naar BJ2), versneld-SBC lesgeven (≥G), versneld-SBC organiseren (≥G), versneld-SBC prof. handelen (≥G) — 4 inputs
- **D-04:** Beide blokken zijn **altijd zichtbaar** (niet ingeklapt) — de app ondersteunt in de toekomst ook BJ1-klassen.
- **D-05:** BJ1-blok bevat zowel de BJ1-positief drempel (≥13 ≥V voor doorstroom naar BJ2) als de versneld-SBC drieluik — niet alleen de versneld-SBC inputs.

### Recalculatie trigger

- **D-06:** De prognose herberekent **bij blur of Enter** op een invoerveld — niet tijdens typen. Voorkomt flikkering als mentor "13" typt als "1" dan "13".
- **D-07:** De gewijzigde drempel wordt **meteen opgeslagen in plugin-store bij blur/Enter** (geen aparte save-knop). Consistent met het instant-apply patroon uit Phase 17/18.
- **D-08:** Herberekening propagatie: SettingsPage roept een callback aan (bijv. `onNormenChanged`) die in `App.tsx` de klassen-state licht aanraakt (versie-teller of forceUpdate). `KlasOverzicht` re-rendert en `berekenStatus()` leest de nieuwe waarden via de sync-cache in het nieuwe `utils/normen.ts` hulpbestand. Zelfde patroon als `onVerzuimDrempelsChanged` in Phase 18.

### Input validatie

- **D-09:** Alle inputs zijn `<input type="number" step="1">` met bereikgrenzen:
  - SBL-drempel: min=1, max=19
  - SBC-drempel: min=1, max=19
  - Negatief totaal: min=1, max=19
  - Negatief per leerlijn: min=1, max=6
  - BJ1-positief: min=1, max=19
  - Versneld-SBC per leerlijn: min=1, max=6
  - Decimalen worden afgerond naar geheel getal bij blur.
- **D-10:** Subtiele **waarschuwing** (oranje tekst, geen blokkering) als `SBC-drempel < SBL-drempel`, bijv. "Let op: SBC-drempel is normaal hoger dan SBL-drempel." Mentor kan negeren.

### Data persistence module

- **D-11:** Nieuw hulpbestand `utils/normen.ts` volgt het exacte patroon van `utils/verzuimDrempels.ts`:
  - `LazyStore('store.json')` + `STORE_KEY = 'doorstroom_normen'`
  - `DEFAULT_NORMEN` constanten (SBL=13, SBC=15, negTotaal=6, negPerLeerlijn=2, bj1Positief=13, versneldLesgeven=4, versneldOrganiseren=3, versneldProfHandelen=5)
  - `getNormenSync()` — sync cache accessor voor berekenPrognose()
  - `loadNormen()` — async, pre-warmen in `main.tsx` bij startup
  - `saveNormen()` — async, store.set() + store.save() altijd gepaard
  - `resetNormen()` — zet terug naar DEFAULT_NORMEN en persisteert
- **D-12:** `berekenPrognose()` in `utils/prognosis.ts` krijgt een optionele `normen`-parameter. Als niet opgegeven: leest via `getNormenSync()`. Hardcoded constanten (13, 15, >6, >2, VERSNELD_BJ1) worden vervangen door de sync-cache waarden.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prognose engine (te wijzigen)
- `utils/prognosis.ts` — `berekenPrognose()`, hardcoded drempels (regels ~144, ~158, ~180, ~183, ~197-199, VERSNELD_BJ1 object regels ~28-32) — dit is de centrale wijziging in Phase 25
- `src/utils/status.ts` — `berekenStatus()` roept `berekenPrognose()` aan; leest al de sync-cache via `getVerzuimDrempelsSync()` — zelfde patroon toepassen voor `getNormenSync()`

### Bestaand settings & persistentie patroon (model voor normen.ts)
- `utils/verzuimDrempels.ts` — **exacte template** voor `utils/normen.ts`: LazyStore, sync cache, DEFAULT constanten, load/save/reset functies
- `utils/settings.ts` — LazyStore basispatroon
- `utils/deelgebieden.ts` — alternatief voorbeeld van reset-patroon

### SettingsPage integratie
- `src/components/SettingsPage.tsx` — 4 bestaande secties; sectie 5 wordt hier toegevoegd; bestaande verzuimdrempel-inputs tonen het UI-patroon voor number inputs
- `.planning/phases/18-settings-panel-advanced/18-CONTEXT.md` — Phase 18 beslissingen (instant-apply, LazyStore pattern, sectie-stijlen)

### Startup wiring
- `src/main.tsx` — `loadVerzuimDrempels()`, `loadBpvConfig()` etc. worden hier al aangeroepen bij startup; `loadNormen()` moet hier ook worden toegevoegd

### App.tsx propagatie
- `src/App.tsx` — bevat de `onVerzuimDrempelsChanged`-achtige callbacks; `onNormenChanged` callback volgt hetzelfde patroon

### Requirements
- `.planning/REQUIREMENTS.md` (NORM-01..07) — formele requirement IDs
- `.planning/ROADMAP.md` (Phase 25 sectie) — success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `utils/verzuimDrempels.ts` — kopieer als startpunt voor `utils/normen.ts` (LazyStore, sync cache, DEFAULT, load/save/reset)
- `src/components/SettingsPage.tsx` — bestaande number-input patroon in sectie 4 (verzuim drempelwaarden) is het UI-model voor sectie 5
- `.detail-section` / `.detail-section-title` CSS klassen — reuse voor sectie 5

### Hardcoded constanten in prognosis.ts die vervangen worden
- Regel ~144: `totaalVoldoendeOfHoger >= 13` (BJ1 positief naar BJ2) → `>= normen.bj1Positief`
- Regel ~180: `totaalVoldoendeOfHoger >= 15` (BJ2 SBC) → `>= normen.sbc`
- Regel ~183: `totaalVoldoendeOfHoger >= 13` (BJ2 SBL) → `>= normen.sbl`
- Object `VERSNELD_BJ1` (lesgeven: 4, organiseren: 3, prof_handelen: 5) → `normen.versneldLesgeven` etc.
- Negatief-criteria: ">6 totaal OR >2 per leerlijn" (regels ~126-133) → `normen.negatiefTotaal` / `normen.negatiefPerLeerlijn`

### Established Patterns
- Plugin-store: `store.set(key, value)` → `store.save()` — altijd gepaard (Phase 12 pitfall)
- Instant-apply: sync cache bijwerken VOOR de async write (zie `saveVerzuimDrempels()` — `_cache = drempels` staat boven de await)
- Pre-warmen bij startup in `main.tsx` vóór React mount (zie `loadVerzuimDrempels()` patroon)
- Sync-accessor: `getNormenSync()` retourneert `_cache ?? DEFAULT_NORMEN` — zelfde als `getVerzuimDrempelsSync()`

### Integration Points
- `utils/prognosis.ts` → leest normen via `getNormenSync()` (nieuwe import)
- `src/main.tsx` → roept `loadNormen()` aan bij startup
- `src/App.tsx` → voegt `onNormenChanged` callback toe + versie-teller state
- `src/components/SettingsPage.tsx` → sectie 5 met inputs + save handlers + reset knop
- `src/components/KlasOverzicht.tsx` → re-rendert via App.tsx state update (geen directe wijziging nodig)

</code_context>

<specifics>
## Specific Ideas

- CIOS-normen als DEFAULT_NORMEN: SBL=13, SBC=15, negTotaal=6, negPerLeerlijn=2, bj1Positief=13, versneldLesgeven=4, versneldOrganiseren=3, versneldProfHandelen=5
- SBC < SBL waarschuwing: oranje tekst direct onder het SBC-invoerveld, bijv. "Let op: SBC-drempel is normaal hoger dan SBL-drempel (standaard: 15 vs 13)." — geen alert, geen blokkering
- Sectie-titels voor de twee blokken in sectie 5: "BJ2-drempels" en "BJ1-drempels" (of Nederlandse equivalent)
- Decimalen: `Math.round()` bij blur als de waarde niet integer is

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 25-doorstroomnorm-configuratie*
*Context gathered: 2026-05-21*
