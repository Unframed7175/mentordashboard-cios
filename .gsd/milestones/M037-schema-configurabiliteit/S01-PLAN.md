# S01-PLAN.md — M037 Schema-configurabiliteit PDF Parser

> Gegenereerd: 2026-06-14
> Eng review: CLEARED 2026-06-14 (6 issues, 0 critical gaps)
> Design review: CLEARED 2026-06-14 (score 3→9, 3 beslissingen)
> M35-1 (DEELGEBIEDEN → config/leerlijn.json): **buiten scope M37** — cut per eng review

## Doel

Parser bestand maken tegen jaarlijkse CIOS-schemawijzigingen (M35-2, M35-3, M35-4, M35-5).
Open-world parsing: PDF is de bron van waarheid. Onbekende kolommen worden gesignaleerd
via de drift-banner in ImportPage, niet stil genegeerd.

## Succescriteria

- [ ] Alle 390 bestaande tests blijven groen (geen regressies)
- [ ] `buildColumnMap()` retourneert `{ map, unknownLabels }` en ignoreert geen kolommen meer
- [ ] `isHeaderRow()` werkt positie-gebaseerd (géén MIN_HEADER_MATCHES dependency meer)
- [ ] `VAK_HEADINGS` constant verwijderd — heading detectie via `detectHeadingThreshold()`
- [ ] `DriftBanner` toont bij ≥1 unknownLabel; verdwijnt bij handmatig sluiten
- [ ] `role="alert"`, aria-label dismiss knop, WCAG AA contrast op banner

---

## Taken

### T0 — Handmatige pre-flight validatie (MANUAL — blokkeer M35-3 tot gedaan)

**Eigenaar:** Rafael (handmatig)
**Tijdsinschatting:** ~10 min
**Breekpunt dat het oplost:** positie-heuristiek gaat ervan uit dat de header-rij
≥5 items heeft in "Overzicht Deelgebieden". Als dit in de fixture minder is, faalt T1.

**Actie:**
1. Open `tests/fixtures/` — zoek de Deelgebieden-PDF fixture(s)
2. Tel het aantal items in de "Overzicht Deelgebieden" header-rij
3. Als ≥5 items: ✅ T1 mag starten
4. Als <5 items: pas `MIN_COLUMN_WARN_THRESHOLD` aan in T1 voor de werkelijke waarde

**Status:** ⬜ Niet gestart — BLOKKERENDE pre-flight voor T1

---

### T1 — M35-3: `isHeaderRow()` positie-gebaseerd

**Bestand:** `src/parsers/pdf.ts`
**Tijdsinschatting:** ~20 min (CC)
**Afhankelijkheid:** T0 voltooid

**TDD volgorde (RED → GREEN → REFACTOR):**

RED — schrijf falende test in `tests/pdf.headerDetection.test.ts` (of `pdf.test.ts`):
- Test: rij direct ná "Overzicht Deelgebieden" heading wordt gedetecteerd als header,
  ook als de labels onbekend zijn (geen match op MIN_HEADER_MATCHES)
- Test: rij zonder heading-context met minder dan MIN_COLUMN_WARN_THRESHOLD items
  wordt NIET als header gedetecteerd

GREEN — minimale implementatie:
- Voeg `pageWidth: number` toe aan `TextItem` interface (of als extra param)
- Rewrite `isHeaderRow()`:
  - Argument: `line: TextItem[], prevLine: TextItem[], pageWidth: number`
  - Heuristiek: `prevLine` bevat "Overzicht Deelgebieden" (case-insensitive)
    OF `line.length >= MIN_COLUMN_WARN_THRESHOLD` en items zijn gelijkmatig
    gespreid over `pageWidth`
  - Verwijder de afhankelijkheid van `KNOWN_HEADER_LABELS.has()`
- Voeg `pageWidth` door naar `extractAllTextItems()` output
- Update `findDeelgebiedSection()` om `line[0]?.pageWidth ?? 595` door te geven
- Hernoem `MIN_HEADER_MATCHES` → `MIN_COLUMN_WARN_THRESHOLD` door het hele bestand
- Verwijder dode code regels 506-510 (waren onderdeel van oude label-match logica)

REFACTOR — cleanup + naamsconventies consistent

**Status:** ⬜ Niet gestart

---

### T2 — M35-2: `buildColumnMap()` open-world

**Bestanden:** `src/parsers/pdf.ts`, `tests/pdf.columnAssignment.test.ts`
**Tijdsinschatting:** ~20 min (CC)
**Afhankelijkheid:** T1 voltooid (MIN_COLUMN_WARN_THRESHOLD hernoemd, pageWidth aanwezig)

**TDD volgorde (RED → GREEN → REFACTOR):**

RED — update `tests/pdf.columnAssignment.test.ts`:
- Destructureer het return type: `const { map, unknownLabels } = buildColumnMap(headers)`
- Voeg test toe: bij onbekende header-label retourneert `unknownLabels` die label
- Inverteer de huidige "ignores unknown labels" test →
  was: `expect(map['onbekend']).toBeUndefined()`
  wordt: `expect(unknownLabels).toContain('onbekend')`

GREEN — minimale implementatie in `pdf.ts`:
- Verander return type `buildColumnMap()`:
  ```ts
  type ColumnMapResult = { map: Record<string, number>; unknownLabels: string[] }
  ```
- Bouw de `unknownLabels: string[]` array tijdens de kolom-iteratie:
  ```
  als labelText niet in knownLabels set → push naar unknownLabels
  als labelText wel in knownLabels set → voeg toe aan map
  ```
- Definieer `knownLabels` als `new Set(Object.keys(COLUMN_INDICES))` (of equivalent)
- Update `parseDeelgebiedTable()`: destructureer `{ map, unknownLabels }`,
  aggregeer `unknownLabels` over alle pagina's heen (Set → Array na parse)

REFACTOR — zorg dat `unknownLabels` uniek is (Set-deduplicatie)

**Status:** ⬜ Niet gestart

---

### T3 — M35-4: `VAK_HEADINGS` vervangen door font-size detectie

**Bestand:** `src/parsers/pdf.ts`
**Tijdsinschatting:** ~10 min (CC)
**Afhankelijkheid:** geen (onafhankelijk van T1/T2)

**TDD volgorde (RED → GREEN → REFACTOR):**

RED — schrijf test:
- Test: een rij waarvan `item.fontSize >= detectHeadingThreshold(lines)` wordt
  herkend als vak-heading, ook als de tekst niet in `VAK_HEADINGS` staat
- Test: een gewone datarij met kleinere font-size wordt NIET herkend als heading

GREEN — minimale implementatie:
- Vervang `VAK_HEADINGS.has(labelText.toLowerCase())` →
  `labelItem.fontSize >= detectHeadingThreshold(lines)`
- Verwijder de `VAK_HEADINGS` constant (regel 66 of equivalent)
- `detectHeadingThreshold()` bestaat al in de codebase — gebruik die

REFACTOR — verwijder eventuele import/gebruik van VAK_HEADINGS elders

**Status:** ⬜ Niet gestart

---

### T4 — M35-5: `unknownLabels` doorvoeren + drift-banner (implementatie)

**Bestanden:** `src/parsers/pdf.ts`, `src/components/ImportPage.tsx`, `src/utils/schema.ts` (minor)
**Tijdsinschatting:** ~15 min (CC)
**Afhankelijkheid:** T2 voltooid (`unknownLabels` beschikbaar in parseResult)

**TDD volgorde (RED → GREEN → REFACTOR):**

RED — schrijf RTL tests voor ImportPage:
- Test: na succesvolle parse met unknownLabels verschijnt `.import-drift-banner`
- Test: klikken op dismiss knop verbergt de banner
- Test: nieuwe import reset de banner (unknownLabels leeg bij status: 'processing')

GREEN — thread unknownLabels door:
- `parseSinglePDF()` return type: voeg `unknownLabels: string[]` toe
- Verzamel in `ImportPage.handlePDFs()`:
  ```ts
  const allUnknownLabels = results.flatMap(r => r.unknownLabels ?? [])
  setUnknownLabels([...new Set(allUnknownLabels)])
  ```
- Reset bij start: in `status: 'processing'` block → `setUnknownLabels([])`

**Status:** ⬜ Niet gestart

---

### T-DS1 — Drift-banner component in ImportPage.tsx

**Bestand:** `src/components/ImportPage.tsx`
**Tijdsinschatting:** ~10 min (CC)
**Afhankelijkheid:** T4 (unknownLabels state aanwezig)

**Implementatie (conform design review spec):**

State toevoegen:
```ts
const [unknownLabels, setUnknownLabels] = useState<string[]>([])
```

Reset in processing block (naast bestaande state resets):
```ts
setUnknownLabels([])
```

Collect na parse (in handlePDFs success block):
```ts
const allUnknown = results.flatMap(r => r.unknownLabels ?? [])
if (allUnknown.length > 0) setUnknownLabels([...new Set(allUnknown)])
```

DOM positie — na dropzone, vóór error list:
```jsx
{unknownLabels.length > 0 && (
  <div className="import-drift-banner" role="alert">
    <span className="import-drift-banner__icon" aria-hidden="true">⚠</span>
    <div className="import-drift-banner__body">
      <p className="import-drift-banner__heading">
        {unknownLabels.length === 1
          ? 'Onbekende kolom gevonden'
          : 'Onbekende kolommen gevonden'}
      </p>
      <div className="import-drift-banner__chips">
        {unknownLabels.slice(0, 3).map(l => (
          <span key={l} className="import-drift-banner__chip">{l}</span>
        ))}
        {unknownLabels.length > 3 && (
          <span className="import-drift-banner__chip import-drift-banner__chip--overflow">
            +{unknownLabels.length - 3} meer
          </span>
        )}
      </div>
      <p className="import-drift-banner__subtext">
        {unknownLabels.length === 1
          ? 'Deze kolom wordt niet weergegeven in de grafiek.'
          : 'Deze kolommen worden niet weergegeven in de grafiek.'}
      </p>
    </div>
    <button
      type="button"
      className="import-drift-banner__dismiss"
      aria-label="Sluiten"
      onClick={() => setUnknownLabels([])}
    >×</button>
  </div>
)}
```

**Status:** ⬜ Niet gestart

---

### T-DS2 — Drift-banner CSS in index.css §22

**Bestand:** `src/index.css`
**Tijdsinschatting:** ~3 min (CC)
**Afhankelijkheid:** geen (CSS-only)

**CSS blok toevoegen in §22 (na `.import-dropzone`):**

```css
/* --- Drift-banner (M35-5) --- */
.import-drift-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: var(--status-oranje-bg);
  border-left: 4px solid var(--rag-oranje);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  margin-top: 0.75rem;
}
.import-drift-banner__icon {
  color: var(--rag-oranje);
  font-size: 1rem;
  line-height: 1.5;
  flex-shrink: 0;
}
.import-drift-banner__body {
  flex: 1;
  min-width: 0;
}
.import-drift-banner__heading {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--status-oranje-text);
  margin-bottom: 0.25rem;
}
.import-drift-banner__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.375rem;
}
.import-drift-banner__chip {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #FDE68A;
  color: #92400E;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
}
.import-drift-banner__chip--overflow {
  background: transparent;
  color: #92400E;
  font-family: inherit;
}
.import-drift-banner__subtext {
  font-size: 0.8125rem;
  color: var(--status-oranje-text);
}
.import-drift-banner__dismiss {
  background: transparent;
  border: none;
  color: var(--status-oranje-text);
  cursor: pointer;
  font-size: 1.125rem;
  padding: 0;
  line-height: 1.4;
  opacity: 0.6;
  flex-shrink: 0;
  border-radius: 4px;
}
.import-drift-banner__dismiss:hover { opacity: 1; }
.import-drift-banner__dismiss:focus-visible {
  outline: 2.5px solid var(--accent);
  outline-offset: 2px;
  opacity: 1;
}
```

Dark mode tokens werken automatisch via body.dark — geen extra regels nodig:
- `--status-oranje-bg: #451A03` (donker achtergrond)
- `--status-oranje-text: #FCD34D` (licht tekst)
- `--rag-oranje: #F59E0B` (ongewijzigd)

**Status:** ⬜ Niet gestart

---

## Uitvoervolgorde

```
T0 (handmatig, Rafael) → T1 → T2 → T3 (parallel met T1/T2 mogelijk) → T4 → T-DS1 → T-DS2
```

T3 heeft geen afhankelijkheid van T1/T2 — mag parallel lopen.
T-DS2 (CSS) heeft geen afhankelijkheid — mag op elk moment.

## Buiten scope M37

- M35-1: DEELGEBIEDEN → config/leerlijn.json (te groot, aparte milestone)
- Dark mode visuele QA (vereist Tauri-build, handmatig)
- E2E test met echte PDF fixture voor drift-banner

## Reviews vereist na executie

1. `requesting-code-review` na elke taak (Superpowers)
2. `/review` na voltooide milestone (GStack)
3. `/qa` + `/ship` in Fase 4 (GStack)
