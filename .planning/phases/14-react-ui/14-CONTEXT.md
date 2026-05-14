# Phase 14: React UI - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Herschrijf de drie core-views van de Mentordashboard als React-componenten: KlasOverzicht (tegel-grid), DetailWeergave (voortgang, verzuim, prognose, notities, actiepunten), en de KlasTabStrip (aanmaken/wisselen/verwijderen van klassen). Alle bestaande TypeScript utilities (`berekenPrognose`, `aggregateDeelgebiedScores`, `SpiderChart`, `actiepuntenStore`) worden hergebruikt — geen logica herschrijven. Identieke UX als de huidige app.js, maar nu als React-componenten aangesloten op de versleutelde opslag (Phase 12).

**In scope:** KlasOverzicht tegel-grid (KOV-01), zoeken/sorteren/klas-wisselen (KOV-02), DetailWeergave met alle secties (DET-V2-01), actiepunten en feedback (DET-V2-02), KlasTabStrip + nieuwe-klas-modal, notities migratie van localStorage naar student.notitie.

**Out of scope:** PDF/Excel/backup import (Phase 13 ✓), CIOS-huisstijl CSS tokens (Phase 9 ✓), leerlijn-toewijzing UI herimplementatie (hangt af van uitkomst van deze fase), print-to-PDF export (toekomstige fase), klas hernoemen.

</domain>

<decisions>
## Implementation Decisions

### CIOS Kleurpallet (bijgesteld)
- **D-14-01:** Bijgewerkt kleurpallet voor alle Phase 14 componenten: cyaan `#00a3da` (was `#00AEEF`), navy `#000000` (was `#003057`). Bold sans-serif op structurele elementen ongewijzigd.

### State Reactivity
- **D-14-02:** `App.tsx` houdt een `refreshKey: number` state via `useState`. Na elke succesvolle import roept `ImportPage` een `onImportComplete()` callback-prop aan. `KlasOverzicht` en andere views lezen `appState.students` en `klassenState` opnieuw op elke render — ze zijn altijd up-to-date omdat het module-level singletons zijn.
- **D-14-03:** Geen externe state-library (geen Zustand, geen React context voor klassenState). Refresh-callback is voldoende voor deze usecase.
- **D-14-04:** View-routing via `useState` in `App.tsx`: `'import' | 'klas' | 'detail'`. Geen React Router — Tauri-app heeft geen browser-URL-navigatie nodig. `activeStudentId: string | null` state in `App.tsx` voor de detail-view.

### Klas Management UI
- **D-14-05:** `KlasTabStrip` component: horizontale tab-strip bovenin, identiek aan huidige app.js patroon. Actieve klas highlighted, "+" knop rechts om nieuwe klas aan te maken.
- **D-14-06:** Nieuwe klas aanmaken via React modal-component: naam-input + schooljaar-input (optioneel) + Annuleren/Aanmaken knoppen. Identiek aan de huidige modal-UX.
- **D-14-07:** Klas verwijderen via bevestigingsdialoog (confirm) vanuit de KlasOverzicht-view — identiek aan de huidige "Wis alle data" knop. Geen hernoemen in Phase 14.

### Deelgebieden Matrix
- **D-14-08:** Tabel-opzet behouden: datapunten als rijen, deelgebieden als kolommen gegroepeerd per leerlijn (Lesgeven / Organiseren / Prof. handelen). Horizontaal scrollbaar op kleinere schermen.
- **D-14-09:** Modus-footer: één geaggregeerde score per deelgebied (via `aggregateDeelgebiedScores()`) + groei-badge (↑/=/↓) bij twee periodes. Geen vote-badges (2×V 1×G) — te druk.

### Spider Chart
- **D-14-10:** `SpiderChartCard` React component wraps de bestaande `SpiderChart.buildSpiderSVG()` via `dangerouslySetInnerHTML`. Geen herschrijf — `spider.ts` heeft al XSS-sanitization (`sanitizeCssVar()`). Drie kaarten per leerlijn (Lesgeven / Organiseren / Prof. handelen), identiek aan de huidige layout.

### Notities Opslag
- **D-14-11:** Notities verplaatsen van `localStorage` naar de versleutelde store: `student.notitie: string` field op het meest recente StudentRecord per leerlingId — zelfde patroon als `student.actiepunten[]`. Opgeslagen via `saveKlassen()` na elke wijziging in de textarea.
- **D-14-12:** Migratie bij eerste load: bij render van DetailWeergave: als `student.notitie` undefined is EN `localStorage.getItem('mentordashboard_notities')` een notitie voor dit leerlingId bevat, dan migreer naar `student.notitie` en roep `saveKlassen()` aan. Daarna `localStorage` entry verwijderen.

### Claude's Discretion
- Exacte CSS class-namen voor nieuwe React componenten (geen strikt schema vereist — volg bestaande patroon `klas-tile`, `status-badge`, etc.)
- Debounce-timing op de notitie-textarea (huidige app gebruikt ~500ms of geen debounce — kies wat het meest responsief aanvoelt)
- Exact component-splits binnen DetailWeergave (bijv. of VakkenSection een apart component wordt of inline blijft)
- Leerlijn-toewijzing herimplementatie: de huidige app heeft een leerlijn-toewijzing sectie. Als dit binnen scope past, implementeer het; anders noteer als deferred.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bestaande UI-logica (must-read voor identiek gedrag)
- `app.js` lines 1329–1530 — `renderKlasGrid()`: zoeken, sorteren, tile rendering, berekenStatus, RAG_BORDER, STATUS_VOLGORDE, buildMiniVerzuimBar
- `app.js` lines 1564–1808 — `buildDetailHTML()` en alle sub-functies: header, prognose, leerlijnen, spiderweb, deelgebieden-matrix, verzuim, vakken, notities
- `app.js` lines 1668–1808 — `buildDetailDeelgebieden()`: volledige tabel-structuur, vote-badges, groei-badge, modus-footer
- `app.js` lines 74–160 — `renderKlasTabStrip()`, modal-logica, `createKlas()`, `handleCreateKlas()`

### TypeScript utilities (hergebruiken, NIET herschrijven)
- `utils/prognosis.ts` — `berekenPrognose(student, traject?)`, `berekenAllePrognoses(traject?)` — doorstroomnorm engine
- `utils/aggregation.ts` — `aggregateDeelgebiedScores(datapunten[])` → `{ aggregationDetail }` — modus per deelgebied
- `utils/spider.ts` — `SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar)` → SVG-string — wrap met dangerouslySetInnerHTML
- `utils/actiepunten.ts` — `actiepuntenStore.list/add/update/remove(leerlingId, ...)` — actiepunten CRUD
- `utils/klassen.ts` — `klassenState`, `saveKlassen()`, `switchActiveKlas()`, `createKlas()`, `deleteKlas()` — klas-beheer en persistentie
- `utils/datamodel.ts` — `appState.students[]`, `addStudent()`, `mergeVerzuim()` — student-state
- `utils/schema.ts` — `DEELGEBIEDEN`, `SCORE_LEVELS` — schema voor deelgebied-rendering

### Phase context
- `.planning/ROADMAP.md` §Phase 14 — KOV-01, KOV-02, DET-V2-01, DET-V2-02 requirements
- `.planning/phases/12-versleutelde-opslag/12-CONTEXT.md` — D-12-07 (saveState deprecated → saveKlassen), D-12-08 (async API)
- `.planning/phases/13-bestandstoegang/13-CONTEXT.md` — ImportPage is al klaar; onImportComplete callback wordt hier toegevoegd
- `.planning/phases/13-bestandstoegang/13-01-SUMMARY.md` — App.tsx huidige staat (ImportPage mount, drop guard, storage-error-banner)

### Huisstijl referentie
- `index.html.bak` of `index.html` — CSS variabelen (--cyaan, --navy, status kleuren, klas-tile stijlen)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `utils/prognosis.ts` → `berekenPrognose()` — directe import, geen aanpassing nodig
- `utils/aggregation.ts` → `aggregateDeelgebiedScores()` — directe import voor deelgebieden-matrix footer
- `utils/spider.ts` → `SpiderChart.buildSpiderSVG()` — wrap in `SpiderChartCard` met dangerouslySetInnerHTML
- `utils/actiepunten.ts` → `actiepuntenStore` — directe import voor actiepunten-sectie
- `utils/klassen.ts` → `klassenState`, `saveKlassen()`, `switchActiveKlas()`, `createKlas()`, `deleteKlas()`
- `utils/schema.ts` → `DEELGEBIEDEN`, `SCORE_LEVELS` — voor tabel-structuur en chip-rendering

### Established Patterns
- **Module-level singletons**: `appState`, `klassenState` zijn altijd up-to-date — React componenten lezen ze direct zonder wrapper
- **Prognose-status**: `berekenStatus(student)` → `{ kleur: 'rood'|'oranje'|'groen'|'grijs'|'blauw', label: string, prognose: any }` — app.js line 1222
- **RAG borders**: `{ groen: '#22c55e', oranje: '#f97316', rood: '#ef4444', grijs: '#d1d5db', blauw: '#3b82f6' }`
- **Meest recente record per leerlingId**: filter `appState.students` op `leerlingId`, sort op `periode` descending, neem index 0 — app.js line 1511
- **Verzuim inheritance**: als meest recente record geen verzuim heeft, erfelijk van een ander record van dezelfde leerlingId — app.js line 1517–1521
- **Sort keys**: `'naam'` (NL localeCompare), `'status'` (STATUS_VOLGORDE index), `'verzuim'` (ongeoorloofd minutes desc) — app.js line 1350–1362

### Integration Points
- `App.tsx` (current): heeft al `<ImportPage />`, document drop guard, storage-error-banner — Phase 14 voegt view-routing + KlasTabStrip + KlasOverzicht/DetailWeergave toe
- `main.tsx`: await `loadKlassen()` is al aanwezig — geen aanpassing nodig
- `src/components/ImportPage.tsx`: voeg `onImportComplete?: () => void` prop toe die aangeroepen wordt na succesvolle `saveKlassen()`

</code_context>

---
*Phase: 14-react-ui*
*Context gathered: 2026-05-14*
