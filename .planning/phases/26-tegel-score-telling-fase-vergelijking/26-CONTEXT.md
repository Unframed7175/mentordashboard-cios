# Phase 26: Tegel Score-telling & Fase-vergelijking — Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Elke leerlingtegel in het klasoverzicht krijgt twee nieuwe informatielagen:
1. **Score-telling** — toont "14/19 ≥V · 1 O" onder de status-badge (verborgen bij grijs/Onbekend)
2. **Trend-pijl** — ↑ of ↓ op dezelfde rij als de score-telling, alleen als beide fases aanwezig zijn én de kleur-rank verschilt

Geen nieuwe navigatie, geen nieuwe views, geen nieuwe data-imports. Puur visuele uitbreiding van `LeerlingTegel.tsx`.

</domain>

<decisions>
## Implementation Decisions

### Tile Layout (D-01 – D-03)

- **D-01:** Score-telling staat op een **eigen rij onder de badge** — badge op z'n eigen rij, dan één rij met pijl + score-telling, dan mini verzuim-bar. Volgorde van boven naar beneden: naam → badge → [pijl + score] → verzuim-bar.
- **D-02:** Pijl en score-telling staan **op dezelfde rij**: pijl links, score-telling direct rechts ervan. Formaat: `↑ 14/19 ≥V · 1 O` (of zonder pijl als er geen trend is: `14/19 ≥V · 1 O`).
- **D-03:** Score-telling wordt **volledig verborgen** als `status.kleur === 'grijs'` (leerling heeft geen scores). Geen lege ruimte, geen placeholder.

### Trend-pijl Stijl (D-04 – D-06)

- **D-04:** Pijl is een **CSS border-trick** (pure CSS driehoekje) — geen Unicode-karakter, geen SVG. Klasse `.trend-op` (groen) en `.trend-neer` (rood).
- **D-05:** Kleur: **↑ groen** (`var(--rag-groen)` of equivalent) / **↓ rood** (`var(--rag-rood)` of equivalent). Past bij de RAG-kleurlogica van de rest van het dashboard.
- **D-06:** Grootte pijl: **zelfde als de score-tekst** — visueel op één lijn, geen extra prominentie.

### Trend Vergelijkingslogica (D-07 – D-09)

- **D-07:** Vergelijken op **kleur-rank via `STATUS_VOLGORDE`**: `rood=0 < oranje=1 < groen=2 < blauw=3`. Als `rank(fase2) > rank(fase1)` → ↑. Als `rank(fase2) < rank(fase1)` → ↓. Als gelijk → geen pijl (TREND-04).
- **D-08:** "Fase 1" = **oudste record**, "fase 2" = **nieuwste record** voor dezelfde `leerlingId`, via de bestaande `getAllRecordsForStudent()` (gesorteerd op periode-string alphabetisch). Geen exacte periode-naam matching.
- **D-09:** **Grijs (kleur=grijs) telt niet mee als vergelijkbare fase.** Als fase 1 grijs was én fase 2 een echte RAG-kleur heeft: geen pijl tonen. Pijl alleen bij twee echte RAG-kleuren (rood/oranje/groen/blauw).

### Claude's Discretion

- Exacte CSS-waarden voor de border-trick pijl (grootte, margin, vertical-align) — Claude stemt af op de bestaande tile-typografie en Industry font line-height.
- CSS klasse-naamgeving voor pijl-elementen (`.trend-op`/`.trend-neer` of vergelijkbaar).
- Of pijl en score in één `<span>` of aparte elementen — Claude kiest op basis van toegankelijkheid (ARIA) en onderhoudbaarheid.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Componenten
- `src/components/LeerlingTegel.tsx` — de tile component die wordt uitgebreid; bevat huidige layout (naam → badge → verzuim-bar)
- `src/components/KlasOverzicht.tsx` — parent die `LeerlingTegel` rendert; bevat `statusMap` en `allStudents`

### Data & Utilities
- `utils/klassen.ts` — `getActiveStudents()` (één record per leerling) en `getAllRecordsForStudent(leerlingId)` (alle periodes gesorteerd oldest-first); beide worden gebruikt voor trend-detectie
- `src/utils/status.ts` — `STATUS_VOLGORDE` (rang-object voor trend-vergelijking), `StatusResult` interface, `berekenStatus()`; `status.prognose.totaalVoldoendeOfHoger` en `status.prognose.totaalOnvoldoende` zijn de score-telling databronnen

### Requirements
- `.planning/REQUIREMENTS.md` §TEGEL en §TREND — TEGEL-01, TEGEL-02, TREND-01 t/m TREND-04

### Stijl & Branding
- `src/index.css` — bestaande CSS-variabelen: `--rag-rood`, `--rag-oranje`, `--rag-groen`, `--rag-blauw`, `--rag-grijs`, Industry font declaraties, `.klas-tile`, `.status-badge`, `.mini-verzuim-bar`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getAllRecordsForStudent(leerlingId: string): any[]` in `utils/klassen.ts` — returns all period records sorted oldest-first; index 0 = fase 1, last index = fase 2. Already exists, no changes needed.
- `STATUS_VOLGORDE` in `src/utils/status.ts` — `Record<string, number>` met rood=0, oranje=1, groen=2, blauw=3, grijs=4. Gebruik dit voor trend-vergelijking.
- `status.prognose.totaalVoldoendeOfHoger` en `status.prognose.totaalOnvoldoende` — al aanwezig in `StatusResult.prognose` (berekend door `berekenPrognose()`).

### Established Patterns
- `LeerlingTegel` is **pure presentational** — ontvangt `student`, `status`, `onClick`. Trend-data moet via props worden doorgegeven vanuit `KlasOverzicht`, niet direct uit `getAllRecordsForStudent` binnen de tile.
- CSS custom properties pattern (`--tile-accent`) al aanwezig in `LeerlingTegel` — pijl-kleuren volgen hetzelfde patroon via CSS-klassen.
- `statusMap` in `KlasOverzicht` (via `useMemo`) is de plek om ook trend-data voor te berekenen.

### Integration Points
- `KlasOverzicht.tsx` moet naast `statusMap` ook een `trendMap: Map<string, 'op' | 'neer' | null>` berekenen (via `getAllRecordsForStudent` + `berekenStatus` per periode + `STATUS_VOLGORDE` vergelijking).
- `LeerlingTegel` krijgt een nieuwe prop: `trend?: 'op' | 'neer' | null`.
- `KlasOverzicht` geeft `trend={trendMap.get(student.leerlingId) ?? null}` door aan elke `LeerlingTegel`.

</code_context>

<specifics>
## Specific Ideas

- Score-telling formaat is exact: `"14/19 ≥V · 1 O"` — gebruik de `·` interpunct (U+00B7), niet een asterisk of dash.
- CSS border-trick voor pijl: klassiek triangle via `border-left/right/top/bottom: transparent` patroon. Moet vertical-align correct zijn t.o.v. de score-tekst.
- Grijs-check: `status.kleur === 'grijs'` bepaalt of score-telling + pijl verborgen worden — gebruik de bestaande `StatusKleur` type.

</specifics>

<deferred>
## Deferred Ideas

Geen — de discussie is binnen de phase-scope gebleven.

</deferred>

---

*Phase: 26-tegel-score-telling-fase-vergelijking*
*Context gathered: 2026-05-22*
