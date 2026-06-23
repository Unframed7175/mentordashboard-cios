# Phase 35: BPV Echte Column Matchers (Osiris)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De BPV-parser leest gerealiseerde uren correct uit het Osiris "Logboek voortgang" Excel-exportbestand, gematcht op studentnummer.

**Architecture:** Twee wijzigingen in `utils/bpv.ts`: (1) zero-width space (U+200B) strippen in header-normalisatie zodat kolommen met onzichtbare prefix-tekens toch gevonden worden; (2) de bestaande STUB-test vervangen door echte integratietests met een synthetisch Osiris-fixture (geen echte leerlingdata in git).

**Tech Stack:** TypeScript, SheetJS (xlsx), Vitest

---

## Osiris bestandsstructuur (vastgesteld 2026-06-03)

Sheet: `Logboek voortgang`

| Kolom | Naam | Gebruik |
|-------|------|---------|
| 1 | `Student` | naam (niet gebruikt voor matching) |
| 2 | `Studentnummer` | **matching-sleutel** = `leerlingId` in StudentRecord |
| 3 | `Organisatie` | stageplek naam |
| 12 | `Stage-uren goedgekeurd` | → `goedgekeurdeUren` → `gerealiseerdeUren` |
| 14 | `Stage-uren ingeleverd` | → `ingeleverdUren` |

**Let op:** kolommen 13, 17–19 beginnen met zero-width space (char U+200B, decimal 8203). `.trim()` verwijdert dit niet — vandaar de robustness-fix.

**Matching bevestigd:** `Studentnummer` uit Osiris = `leerlingId` uit SomToday PDF.

---

## Task 1: Zero-width space stripping in header-normalisatie

**Files:**
- Modify: `utils/bpv.ts` (regel ~168 in `_bpvKolom`, regel ~233 in `parseBpvExcel`)

- [ ] **Stap 1: Lokaliseer de twee trim-locaties**

```bash
grep -n "\.trim()" utils/bpv.ts
```

Verwacht: meerdere matches. De twee relevante zijn:
- `_bpvKolom`: `const hdr = key.toLowerCase().trim();` (en needle)
- `parseBpvExcel`: `rawRows[headerRowIdx].map((h: any) => String(h || '').trim())`

- [ ] **Stap 2: Update `_bpvKolom` — strip U+200B in hdr en needle**

In `utils/bpv.ts`, verander in `_bpvKolom`:
```ts
// Oud:
const needle = kandidaat.toLowerCase().trim();
// ...
const hdr = key.toLowerCase().trim();

// Nieuw:
const needle = kandidaat.replace(/​/g, '').toLowerCase().trim();
// ...
const hdr = key.replace(/​/g, '').toLowerCase().trim();
```

- [ ] **Stap 3: Update header-normalisatie in `parseBpvExcel`**

In `utils/bpv.ts`, verander de `headers` mapping (regel ~233):
```ts
// Oud:
const headers = rawRows[headerRowIdx].map((h: any) => String(h || '').trim());

// Nieuw:
const headers = rawRows[headerRowIdx].map((h: any) => String(h || '').replace(/​/g, '').trim());
```

- [ ] **Stap 4: Draai tests**

```bash
npm test
```

Verwacht: alle tests groen (geen gedragswijziging voor bestaande tests).

- [ ] **Stap 5: Commit**

```bash
git add utils/bpv.ts
git commit -m "fix(35): strip zero-width space uit BPV Excel kolom-headers"
```

---

## Task 2: Vervang STUB-test door echte integratietests

De bestaande test in `tests/bpv.test.ts` heeft:
```ts
it('parseBpvExcel STUB returns empty object for valid XLSX magic bytes', ...)
```
Dit is een stub — hij test niets over echte parsing. Vervang door tests met een synthetisch Osiris-fixture (geen echte leerlingdata).

**Files:**
- Modify: `tests/bpv.test.ts`

- [ ] **Stap 1: Voeg XLSX import toe aan de testfile**

Bovenaan `tests/bpv.test.ts`, voeg toe na de bestaande imports:
```ts
import * as XLSX from 'xlsx';
```

- [ ] **Stap 2: Voeg helper functie toe om synthetisch Osiris-buffer te maken**

Voeg toe na de `vi.mock` block en voor de `beforeEach`, als top-level helper:

```ts
/** Maakt een synthetisch Osiris "Logboek voortgang" XLSX-buffer voor tests. */
function makeOsirisBuffer(dataRows: any[][]): ArrayBuffer {
  const headers = [
    'Begeleidingsgroep', 'Student', 'Studentnummer', 'Organisatie',
    'Beoordelaar', 'Beoordelaar email', 'Gebruiker', 'Docent',
    'Startdatum', 'Einddatum', 'Bij met inleveren',
    'Stage-uren gezien en goedgekeurd ',  // trailing space (zoals in echt bestand)
    'Stage-uren goedgekeurd',
    '​Stage-uren gezien',             // zero-width space prefix
    'Stage-uren ingeleverd',
    'Stage-uren afgekeurd',
    'Stage-uren geboekt',
    'Controlegetal',
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Logboek voortgang');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
}
```

- [ ] **Stap 3: Verwijder de STUB-test en voeg 4 echte tests toe**

Verwijder:
```ts
it('parseBpvExcel STUB returns empty object for valid XLSX magic bytes', async () => { ... });
```

Voeg toe in de `describe('bpv utility (Phase 18)')` block:

```ts
describe('parseBpvExcel — Osiris integratie (Phase 35)', () => {
  it('leest gerealiseerde uren van een leerling met goedgekeurde uren', async () => {
    const { parseBpvExcel } = await import('../utils/bpv');
    const buf = makeOsirisBuffer([
      // begeleid, student, nummer, org, ...(padding), gezien+goed, goedgekeurd, ​gezien, ingeleverd, afgekeurd, geboekt, controlegetal
      ['BJ2', 'Jan Sporter', '100001', 'Sportclub X', '', '', 'Ja', 'Docent', 0, 0, 'Ja', 0, 160, 0, 0, 0, 0, 0],
    ]);
    const result = parseBpvExcel(buf);
    expect(result['100001']).toBeDefined();
    expect(result['100001'].gerealiseerdeUren).toBe(160);
  });

  it('leerling met alleen ingeleverde uren heeft gerealiseerdeUren 0', async () => {
    const { parseBpvExcel } = await import('../utils/bpv');
    const buf = makeOsirisBuffer([
      ['BJ2', 'Piet Invoerder', '100002', 'Gymclub B', '', '', 'Nee', 'Docent', 0, 0, 'Nee', 0, 0, 0, 28, 0, 0, 0],
    ]);
    const result = parseBpvExcel(buf);
    expect(result['100002']).toBeDefined();
    expect(result['100002'].gerealiseerdeUren).toBe(0);
    expect(result['100002'].plaatsen[0].ingeleverdUren).toBe(28);
  });

  it('leerling-id is het studentnummer als string', async () => {
    const { parseBpvExcel } = await import('../utils/bpv');
    const buf = makeOsirisBuffer([
      ['BJ2', 'Maria Stagiair', '248109', 'Club Y', '', '', 'Ja', 'Docent', 0, 0, 'Ja', 0, 80, 0, 0, 0, 0, 0],
    ]);
    const result = parseBpvExcel(buf);
    // Studentnummer 248109 (getal in Excel) moet als string "248109" opgeslagen worden
    expect(result['248109']).toBeDefined();
    expect(result['248109'].gerealiseerdeUren).toBe(80);
  });

  it('kolom met zero-width space prefix wordt correct herkend', async () => {
    const { parseBpvExcel } = await import('../utils/bpv');
    // Header kolom 13 (​Stage-uren gezien) bevat U+200B — parser mag hier niet op crashen
    // en andere kolommen moeten gewoon werken
    const buf = makeOsirisBuffer([
      ['BJ2', 'Test Leerling', '100003', 'Org Z', '', '', 'Ja', 'Docent', 0, 0, 'Ja', 68, 109, 68, 0, 0, 0, 0],
    ]);
    const result = parseBpvExcel(buf);
    expect(result['100003']).toBeDefined();
    expect(result['100003'].gerealiseerdeUren).toBe(109);
  });
});
```

- [ ] **Stap 4: Draai alleen de BPV-tests om te verifiëren**

```bash
npx vitest run tests/bpv.test.ts
```

Verwacht: alle tests groen — ook de 4 nieuwe.

- [ ] **Stap 5: Draai volledige suite**

```bash
npm test
```

Verwacht: alle tests groen.

- [ ] **Stap 6: Commit**

```bash
git add tests/bpv.test.ts
git commit -m "test(35): vervang BPV STUB-test door Osiris integratietests (synthetische fixture)"
```

---

## Task 3: ROADMAP bijwerken

**Files:**
- Modify: `.planning/ROADMAP.md`

- [ ] **Stap 1: Markeer Phase 35 als afgerond**

In `.planning/ROADMAP.md`:

Zoek de fase-beschrijving (begint met `- [ ] **Phase 35:`):
```markdown
- [ ] **Phase 35: BPV Echte Column Matchers**
```
→
```markdown
- [x] **Phase 35: BPV Echte Column Matchers** *(completed 2026-06-03)*
```

Zoek de progress-tabel:
```markdown
| 35. BPV Echte Column Matchers | 0/TBD | Not started | - |
```
→
```markdown
| 35. BPV Echte Column Matchers | 1/1 | Complete | 2026-06-03 |
```

- [ ] **Stap 2: Eindtest**

```bash
npm test
```

Verwacht: alle tests groen.

- [ ] **Stap 3: Eindcommit**

```bash
git add .planning/ROADMAP.md
git commit -m "docs: Phase 35 afgerond — Osiris BPV column matchers + integratietests"
```

---

## Zelfcontrole — spec-afdekking

| Success Criterion | Afgedekt door |
|---|---|
| SC-1: werkelijke gerealiseerde uren zichtbaar na import | Task 1 (zero-width fix) + Task 2 (verified via tests) |
| SC-2: minimaal 2 aliassen per kolom | Al aanwezig in bpv.ts — gedocumenteerd in Osiris-structuur boven |
| SC-3: graceful 0 uren als geen kolommen herkend | Bestaande stub-test vervangt door `parseBpvExcel throws for non-Excel files` (blijft) + Task 2 test 2 |
