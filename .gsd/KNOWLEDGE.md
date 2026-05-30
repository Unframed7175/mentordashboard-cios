# KNOWLEDGE.md — Mentordashboard CIOS

> Gegenereerd op: 2026-05-30 (retroactief, op basis van bestaande codebase)
> Projectregels, patronen en valkuilen die je moet kennen voordat je code aanraakt.

---

## Architectuurpatronen

### P-01 · LazyStore: altijd set() + save()
```ts
await store.set('key', value);
await store.save(); // VERPLICHT — set() is in-memory only
```
Vergeten `store.save()` leidt tot data loss bij app-herstart. Dit is de #1 valkuil.

### P-02 · appState bridge (array reference)
Bij elke klas-switch:
```ts
appState.students = klassenState.klassen[klasId].students; // ZELFDE array reference
```
Parsers en legacy-code mutteren `appState.students`. Na een import altijd `setRefreshKey(k => k+1)` aanroepen zodat React re-rendert.

### P-03 · Theme toggling via body.dark
```ts
document.body.classList.toggle('dark', isDark);
```
CSS custom properties worden overschreven door `.dark` op `body`. Niet via inline styles of React state-driven class op een wrapper div.

### P-04 · Status berekening via berekenStatus()
Alle RAG-kleuren lopen via `src/utils/status.ts:berekenStatus()`. Nooit zelf prognose-labels vergelijken in componenten. Gebruik:
```ts
import { berekenStatus } from '../utils/status';
const { kleur, label } = berekenStatus(student);
```

### P-05 · PDF.js worker — workerSrc, niet workerPort
```ts
// CORRECT:
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href;
// FOUT — veroorzaakt silent message loss:
// workerPort = new Worker(...)
```

### P-06 · Traject detectie — periode is leading
`detectTraject(student)` gebruikt `student.periode` als primaire bron. `student.leerjaar` is alleen fallback. Console.warn bij onzeker traject (valt terug op 'bj2').

### P-07 · Normen en drempels: altijd via Sync-accessor
In synchrone call sites (berekenPrognose, berekenStatus):
```ts
const normen = getNormenSync();       // CORRECT
const drempels = getVerzuimDrempelsSync(); // CORRECT
```
Laad de cache vooraf bij app-startup met de async `loadNormen()` / `loadVerzuimDrempels()`.

---

## Bestandsstructuur

```
src/
  components/    React componenten (UI)
  utils/         React-specifieke utils (status.ts)
  App.tsx        Hoofdcomponent — view-state, klas-handlers

utils/            Root-level utils (toegankelijk voor parsers + Tauri Rust bridge)
  klassen.ts     CRUD + persistence voor klassen
  datamodel.ts   In-memory appState + StudentRecord type
  prognosis.ts   Doorstroomnorm engine (BJ1/BJ2)
  normen.ts      Configureerbare doorstroomnormen
  schema.ts      DEELGEBIEDEN constant, score normalization
  settings.ts    Theme persistence
  backup.ts      ZIP backup/restore (fflate)
  verzuimDrempels.ts  Verzuim drempelwaarden
  feedback.ts    Feedback + ring buffer
  actiepunten.ts Actiepunten CRUD store
  leerlijnen.ts  Leerlijn mapping persistence
  aggregation.ts Score aggregatie
  bpv.ts         BPV parsing/processing
  deelgebieden.ts Deelgebieden utils
  spider.tsx     Spider chart data berekening

parsers/
  pdf.ts         SomToday PDF parser (PDF.js ESM)
  excel.ts       SomToday Excel verzuim/BPV parser (SheetJS)

tests/           Vitest unit tests (29 bestanden)
vendor/          PDF.js ESM bundel (pdf.min.mjs + pdf.worker.min.mjs)
src-tauri/       Rust backend (Tauri v2)
```

---

## Datamodel kerntypen

### StudentRecord (utils/datamodel.ts)
| Veld | Type | Beschrijving |
|---|---|---|
| `naam` | string | Volledige naam (bijv. "Bosker, J.G.") |
| `leerlingId` | string | ID uit PDF header |
| `periode` | string | Bijv. "BJ2 Fase 2 DD" |
| `leerjaar` | string | "1" of "2" |
| `filename` | string | Bronbestand |
| `vakken` | Vak[] | Vakken met opdrachten + feedforward |
| `deelgebiedScores` | Record<string, string\|null> | Geaggregeerde scores per deelgebied |
| `datapunten` | Datapunt[] | Per-opdracht scores (gap analyse) |
| `verzuim` | object | `{ geoorloofd: number, ongeoorloofd: number }` (minuten) |
| `actiepunten` | Actiepunt[] | Mentor actiepunten |
| `rekenResultaat` | string\|null | '2F' \| '3F' \| '' \| null |
| `nederlandsResultaat` | string\|null | '2F' \| '3F' \| '' \| null |

### klassenState (utils/klassen.ts)
```ts
{
  klassen: Record<string, { id: string; naam: string; students: StudentRecord[] }>;
  activeKlasId: string | null;
  onboardingCompleted: boolean;
}
```

---

## Testpatronen

### Vitest setup
- Config: `vitest.config.ts`, setup: `tests/vitest-setup.js`
- Environment: jsdom (component tests), node (utils tests)
- Fixtures in `tests/fixtures/`

### Wat unit-testbaar is (zonder Tauri)
- Alle `utils/` functies (prognosis, normen, schema, status, actiepunten, etc.)
- Parsers (pdf.ts, excel.ts) met mock File objecten
- React componenten via @testing-library/react + jsdom

### Wat NIET unit-testbaar is zonder Tauri
- `store.set()` / `store.save()` — mock `@tauri-apps/plugin-store` in tests
- `invoke()` Tauri commands — mock `@tauri-apps/api/core`

### Testvolgorde (TDD)
1. RED: schrijf falende test
2. GREEN: minimale implementatie om test te laten slagen
3. REFACTOR: pas aan zonder tests te breken

---

## Valkuilen en bekende issues

### V-01 · store.save() vergeten
`store.set()` is in-memory only. Data verdwijnt bij app-herstart als `store.save()` niet wordt aangeroepen.

### V-02 · appState bridge niet bijwerken
Na `switchActiveKlas()` moeten alle consumers `appState.students` opnieuw lezen. React components gebruiken `refreshKey` om opnieuw te renderen.

### V-03 · PDF.js workerPort veroorzaakt silent message loss
Gebruik `workerSrc` (string URL), niet `workerPort`. Zie ADR-04.

### V-04 · Prevview guard in settings/help navigatie
`setPrevView` moet bewaken dat alleen content-views ('import', 'klas', 'detail') worden opgeslagen. Niet 'settings', 'onboarding', 'help'. Zie CR-02 in commit history.

### V-05 · countUniekeLeerlingen null-guard
`countUniekeLeerlingen(klas?.students)` — altijd optioneel chainen; students kan undefined zijn voor lege klassen.

### V-06 · Drag-and-drop preventie
`dragover` en `drop` events op `document` moeten worden geblokkeerd (`preventDefault()`) om te voorkomen dat de browser navigeert bij accidenteel slepen.

---

## Commit-conventies

```
feat:    nieuwe functionaliteit
fix:     bugfix
test:    tests toevoegen of aanpassen
docs:    documentatie
chore:   tooling, configuratie, geen logicawijzigingen
design:  UI/CSS aanpassingen zonder logicawijzigingen
refactor: refactoring zonder feature-toevoeging
```

Branch-naamgeving: `feature/[naam]`, `fix/[naam]`, `design/[naam]`

---

## Fase-nummering

Fasen worden genummerd als integers (33, 34, ...). Slices binnen een fase: `-01`, `-02`, `-03` (bijv. `feat(33-02)`). Plan-bestanden staan historisch in git, niet meer in het werkende bestand.

---

## Bekende backlog items

- [ ] **ADR-11 opvolgen:** storage-error-banner vervangen door React toast/modal (Phase 14 — nog niet gedaan)
- [ ] **1 UAT-scenario fase 33** niet geslaagd — nader te onderzoeken
