# Phase 10: Scaffold & Toolchain - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Opzetten van de professionele Tauri v2 + Vite + React + TypeScript + Vitest ontwikkelomgeving binnen de bestaande `dashboard-2/` map. Na Phase 10 geldt:
- `npm run dev` start een Tauri desktop window met een React placeholder
- `npm run test` voert 128 bestaande tests uit via Vitest en geeft 0 failures, 128 passed
- TypeScript type-fouten zijn zichtbaar in de editor (noImplicitAny per module)
- `npm run build` produceert een installer-artefact

**Niet in Phase 10:** TypeScript migratie van bestaande utils/parsers (Phase 11), versleutelde opslag (Phase 12), bestands-import UI (Phase 13), React UI her-implementatie (Phase 14).

</domain>

<decisions>
## Implementation Decisions

### Project structuur
- **D-01:** Tauri scaffold (`npm create tauri-app@latest -- --template react-ts`) wordt uitgevoerd **in de bestaande `dashboard-2/` map** — genereert `src/` (Vite+React frontend) en `src-tauri/` (Rust backend) als subfolders naast de bestaande bestanden.
- **D-02:** Bestaande bestanden (`app.js`, `index.html`, `parsers/`, `utils/`, `vendor/`) blijven **ongewijzigd op dezelfde plek** als referentie voor Phase 11 migratie. Ze worden niet gearchiveerd of verplaatst.
- **D-03:** Er is één `package.json` op `dashboard-2/` niveau — het Tauri template overschrijft of breidt deze uit.

### Test migratie aanpak
- **D-04:** Bestaande 128 tests (`tests/*.test.js`) worden **niet herschreven** in Phase 10. Vitest wordt geconfigureerd met `globals: true` en `environment: 'jsdom'` zodat bestaande Jest-compatibele testcode zonder aanpassingen draait.
- **D-05:** Succesdefinitie TCH-03: `npm run test` rapporteert **exact 0 failures en 128 passed** in Vitest output. Skipped tests gelden niet als passed — als een test geskit moet worden door een missing module is dat een failure.
- **D-06:** Jest en de bestaande Jest dev-dependency worden verwijderd; Vitest vervangt ze volledig.

### Tauri window inhoud (Phase 10)
- **D-07:** Het Tauri dev window toont een **lege React placeholder** — app-naam ("Mentordashboard CIOS"), versie ("v2.0 — Scaffold"), en een status melding ("Scaffold complete"). Geen bestaande app.js/index.html geladen in Phase 10.
- **D-08:** TypeScript strict-mode: `strict: false` globaal in `tsconfig.json`. Per module wordt `noImplicitAny` ingeschakeld tijdens Phase 11 migratie. Nieuw scaffolded Phase 10 code (placeholder component) mag strict zijn, maar de tsconfig blokkeert de Phase 11 migratie niet.

### Rust pre-flight bootstrap
- **D-09:** Phase 10 Plan 01 begint met een **expliciete installatie-taak** voor de Rust toolchain:
  1. `winget install Rustlang.Rustup` (Windows) / `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` (macOS)
  2. VS 2022 C++ Desktop workload (Windows) via Visual Studio Installer
  3. `rustup toolchain install stable` + `rustup target add ... (Tauri targets)`
  Developer voert dit handmatig uit als eerste stap — de overige plan-taken gaan ervan uit dat Rust beschikbaar is.
- **D-10:** Tauri init commando: `npm create tauri-app@latest -- --template react-ts` in de `dashboard-2/` directory.

### Claude's Discretion
- Exacte Vitest configuratie parameters (pool, coverage provider, reporter) — planner kiest standaard Vitest defaults.
- Specifieke Tauri permissions in `tauri.conf.json` voor Phase 10 — minimale set; uitgebreid in Phases 12–13.
- ESLint/Prettier configuratie — planner volgt standaard React+TypeScript conventies.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/ROADMAP.md` — Phase 10 goal, success criteria, en requirements TCH-01 t/m TCH-04
- `.planning/REQUIREMENTS.md` — TCH-01, TCH-02, TCH-03, TCH-04 volledige omschrijving
- `.planning/STATE.md` — Accumulated decisions incl. Rust not installed, pdfjs worker strategie, SheetJS codepage

### Bestaande codebase (referentie voor Phase 10)
- `tests/jest.config.js` — Bestaande Jest config (wordt vervangen door vitest.config.ts)
- `tests/prognosis.test.js` — Voorbeeld van `global.window = global` shim pattern dat Vitest jsdom-mode moet supporten
- `utils/prognosis.js` — Voorbeeld IIFE module zonder ES exports (blijft ongewijzigd in Phase 10)

### Technische achtergrond (research)
- `.planning/research/STACK.md` — Exacte library versies (Tauri 2.11.1, React 19.2.6, TypeScript ~5.8, Vitest 4.1.6)
- `.planning/research/PITFALLS.md` — 22 pitfalls incl. localStorage in Tauri prod, pdfjs CSP, SheetJS codepage
- `.planning/research/ARCHITECTURE.md` — IPC patroon, pdfjs `?url` suffix aanpak

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/*.test.js` (9 bestanden, 128 tests): Draaien zonder aanpassing in Vitest met `globals: true` en `environment: 'jsdom'` — de `global.window = global` shims zijn overbodig in jsdom maar breken niets.
- `utils/prognosis.js`, `parsers/excel.js`, etc.: CommonJS/IIFE modules — worden in Phase 10 NIET aangeraakt, blijven als referentie voor Phase 11.

### Established Patterns
- Bestaande `package.json` heeft Jest als dev-dependency — verwijderen en vervangen door Vitest.
- `tests/jest.config.js` wordt vervangen door `vitest.config.ts` in de project root (naast `vite.config.ts`).

### Integration Points
- Vite config (`vite.config.ts`) en Tauri config (`src-tauri/tauri.conf.json`) werken samen: `devUrl` in Tauri wijst naar Vite dev server (standaard poort 1420).
- Bestaande `node_modules/` bevat Jest — na verwijdering opnieuw installeren met `npm install`.

</code_context>

<specifics>
## Specific Ideas

- Tauri dev window toont: titel "Mentordashboard CIOS", versie "v2.0 — Scaffold", status badge "✓ Scaffold complete".
- `npm run dev` = Vite + Tauri tegelijk starten (via `tauri dev`).
- `npm run test` = `vitest run` (geen watch mode, CI-compatibel).
- `npm run build` = `tauri build` (genereert installer).

</specifics>

<deferred>
## Deferred Ideas

- Vitest coverage drempelwaarden instellen — relevant voor Phase 11+ wanneer TypeScript modules worden toegevoegd.
- GitHub Actions CI pipeline — relevant voor Phase 15 (Packaging).
- ESLint strictere regels — relevant wanneer TypeScript migratie voltooid is (Phase 11+).

</deferred>

---

*Phase: 10-scaffold-toolchain*
*Context gathered: 2026-05-12*
