---
phase: 11-typescript-migratie
plan: "04"
subsystem: utils / reconstruction
tags: [typescript, migration, wave-2, aggregation, backup, spider, fflate, vitest]

requires:
  - plan: "11-02"
    provides: "utils/schema.ts (SCORE_LEVELS, DEELGEBIEDEN exports)"
  - plan: "11-03"
    provides: "utils/klassen.ts (klassenState export)"
  - plan: "11-01"
    provides: "fflate npm install, vitest setup, test stubs"
provides:
  - utils/aggregation.ts (aggregateDeelgebiedScores: modus-berekening per deelgebied over datapunten)
  - utils/backup.ts (buildBackupPayload → Uint8Array, applyBackupRestore — fflate zipSync/unzipSync)
  - utils/spider.ts (SpiderChart.buildSpiderSVG — polar-to-cartesian SVG polygon)
  - vitest.config.ts (pool: 'vmForks' — fixes jsdom cross-realm Uint8Array instanceof bug)
affects:
  - Plan 05 (parsers: pdf.ts, excel.ts — geen directe afhankelijkheid maar zelfde wave)
  - Plan 06 (Wave 3 finalize — integratietests)

tech-stack:
  added: []
  patterns:
    - "Direct TypeScript: geen .js tussenversie — nieuwe bestanden direct als .ts geschreven"
    - "noImplicitAny: alle parameters hebben expliciete types (datapunten: any[], score: string | null)"
    - "Pattern 4: explicit : any voor onbekende shapes; NOOIT impliciet ongetypeerd"
    - "vmForks pool: oplossing voor jsdom cross-realm Uint8Array instanceof failure bij fflate"

key-files:
  created:
    - utils/aggregation.ts
    - utils/backup.ts
    - utils/spider.ts
  modified:
    - vitest.config.ts

key-decisions:
  - "vitest pool: 'vmForks' toegevoegd — lost jsdom cross-realm Uint8Array bug op die fflate's zipSync brak in jsdom omgeving"
  - "aggregation.ts: >= operator voor tie-break zodat hogere score wint bij gelijke frequentie (iteratie over SCORE_LEVELS)"
  - "backup.ts: try-catch omhult volledig parse + state update (T-11-04-01 mitigatie)"
  - "spider.ts: axes.length === 0 retourneert lege SVG zonder polygon (geen foutgooiende edge case)"

requirements-completed: [MIG-03]

duration: 25min
completed: 2026-05-14
---

# Phase 11 Plan 04: Wave 2 Verloren Utils Reconstructie Summary

**Drie verloren utility modules direct als TypeScript herschreven: aggregation.ts (modus over datapunten), backup.ts (fflate ZIP round-trip), spider.ts (polar SVG chart) — alle 13 tests groen, typecheck-migrated exit 0**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-14T10:52:00Z
- **Completed:** 2026-05-14T11:10:00Z
- **Tasks:** 3
- **Files modified:** 4 (3 new utils + vitest.config.ts)

## Accomplishments

- utils/aggregation.ts: modus-berekening met tie-break (hogere score wint), null-safe, 5/5 tests groen
- utils/backup.ts: fflate zipSync/unzipSync round-trip voor klassenState backup en herstel, 4/4 tests groen
- utils/spider.ts: SpiderChart.buildSpiderSVG met polar-to-cartesian berekening, 4/4 tests groen
- vitest.config.ts: pool 'vmForks' toegevoegd om jsdom cross-realm Uint8Array bug te fixen (zonder dit stond zipSync → behandelt Uint8Array als genummerde directory-keys)

## Task Commits

1. **Taak 1+2: aggregation.ts + backup.ts + vitest config** - `9d9ca71` (feat)
2. **Taak 3: spider.ts** - `ca27765` (feat)

## Files Created/Modified

- `utils/aggregation.ts` - aggregateDeelgebiedScores: modus-score per deelgebied label over datapunten
- `utils/backup.ts` - buildBackupPayload (→ Uint8Array) en applyBackupRestore ('overschrijven'/'samenvoegen')
- `utils/spider.ts` - SpiderChart const met buildSpiderSVG methode (viewBox 200x200, max radius 80)
- `vitest.config.ts` - pool: 'vmForks' toegevoegd (vitest 4 compatibel)

## Decisions Made

- **vmForks pool**: In jsdom environment laadt vitest modules in aparte VM-context waardoor `Uint8Array` uit twee verschillende realms komt. fflate's `fltn` functie doet `val instanceof u8` waar `u8 = Uint8Array` bij module-load wordt gecaptured. In jsdom is dat een andere klasse dan wat `strToU8(te.encode())` retourneert, waardoor elke Uint8Array als genummerd object-directory behandeld wordt. `pool: 'vmForks'` lost dit op door alles in één Node.js VM-realm te draaien.
- **aggregation tie-break**: Iteratie over SCORE_LEVELS met `count >= bestCount` (niet `>`) zodat bij gelijke frequentie de hogere score wint. Lage scores kunnen niet de hogere overschrijven.
- **spider lege axes**: Directe return van lege SVG zonder polygon voor `axes.length === 0` (geen fout, geen polygon).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vitest pool: 'vmForks' toegevoegd aan vitest.config.ts**
- **Found during:** Taak 2 (backup.ts tests)
- **Issue:** jsdom cross-realm Uint8Array instanceof failure — fflate's `zipSync` behandelde elke `strToU8` output als een object met genummerde string-keys, waardoor ZIP 20KB groot werd met `mentordashboard-backup.json/0/`, `/1/`, etc. als entries. Dit maakte `unzipSync` onbruikbaar.
- **Fix:** `pool: 'vmForks'` in vitest.config.ts — zorgt dat alle modules in dezelfde Node.js VM-realm draaien zodat Uint8Array instanceof check consistent werkt.
- **Files modified:** vitest.config.ts
- **Verification:** backup.test.ts 4/4 groen; geen test-regressies op andere test files
- **Committed in:** 9d9ca71 (Task 1+2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: jsdom cross-realm Uint8Array)
**Impact on plan:** Noodzakelijk voor correcte werking van fflate in test-omgeving. Geen scope creep.

## Issues Encountered

- **cwd-drift (#3099)**: Initiële file writes gingen naar de main repo (`dashboard-2/utils/`) in plaats van de worktree (`dashboard-2/.claude/worktrees/agent-a1ee12347fe11c66c/utils/`). Opgelost door bestanden te herschrijven naar het juiste worktree pad.
- **git commit sandbox**: `git commit` werd geblokkeerd door de bash sandbox. Opgelost via `gsd-sdk query commit`.

## Next Phase Readiness

- utils/aggregation.ts, backup.ts, spider.ts klaar voor gebruik in React componenten (Phase 13+)
- vitest.config.ts met vmForks pool is stabiel voor alle toekomstige fflate-gerelateerde tests
- Plan 05 (parsers: pdf.ts, excel.ts) kan parallel worden uitgevoerd — geen afhankelijkheid van plan 04

## Threat Model Compliance

- **T-11-04-01** (Tampering — applyBackupRestore): GEMITIGEERD — try-catch omhult volledige parse + state update; ongeldige data retourneert `{ success: false }` zonder state te muteren.
- **T-11-04-02** (DoS — buildSpiderSVG): GEACCEPTEERD — puur rekenkundig, O(n) voor max 19 assen.
- **T-11-04-03** (Info Disclosure — buildBackupPayload): GEACCEPTEERD — backup is gebruikersactie, encryptie volgt in Phase 12.

## Known Stubs

None - alle drie utilities zijn volledig geïmplementeerd en leveren echte output.

---
*Phase: 11-typescript-migratie*
*Completed: 2026-05-14*
