# Phase 10: Scaffold & Toolchain — Research

**Researched:** 2026-05-13
**Domain:** Tauri 2.x scaffold in existing directory, Jest→Vitest migration, Windows toolchain
**Confidence:** HIGH

---

## Summary

Phase 10 sets up the Tauri 2 + Vite + React + TypeScript + Vitest toolchain in the existing `dashboard-2/` directory so that `npm run dev` opens a Tauri desktop window and all 128 existing tests pass under Vitest. No TypeScript migration of existing utils/parsers happens here.

The three real challenges in this phase are: (1) safely running `npm create tauri-app` inside a directory that already has files — it will generate a new `package.json` which must be merged with the existing one; (2) configuring Vitest so the existing IIFE-style, CommonJS, `global.window = global` test suite passes without touching test files; and (3) handling two test files (`actiepunten.test.js`, `backup.test.js`) that use `jest.fn()` and `jest.resetModules()` which have no automatic alias in Vitest — a one-line setupFile shim fixes this.

**Critical pre-flight correction:** Decision D-09 assumed Rust was not installed. Verification on 2026-05-13 confirms **Rust 1.95.0 (`stable-x86_64-pc-windows-msvc`) is already installed**, as is VS Build Tools 2026 (18.4.1) which satisfies the MSVC linker requirement. The Rust pre-flight install task is not needed.

**Primary recommendation:** Use `npm create tauri-app@latest -- --template react-ts` interactively (answer "." for project name), then manually merge the generated `package.json` with the existing one, add a Vitest setupFile that shims `global.jest = globalThis.vi`, and delete `tests/jest.config.js`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Tauri scaffold (`npm create tauri-app@latest -- --template react-ts`) is executed in the existing `dashboard-2/` directory — generates `src/` (Vite+React frontend) and `src-tauri/` (Rust backend) as subfolders alongside existing files.
- **D-02:** Existing files (`app.js`, `index.html`, `parsers/`, `utils/`, `vendor/`) remain unchanged on the same location as reference for Phase 11 migration. Not archived or moved.
- **D-03:** One `package.json` at `dashboard-2/` level — Tauri template overwrites or extends this.
- **D-04:** Existing 128 tests (`tests/*.test.js`) are NOT rewritten in Phase 10. Vitest is configured with `globals: true` and `environment: 'jsdom'` so existing Jest-compatible test code runs without changes.
- **D-05:** Success definition TCH-03: `npm run test` reports exactly 0 failures and 128 passed in Vitest output. Skipped tests do not count as passed.
- **D-06:** Jest and the existing Jest dev-dependency are removed; Vitest replaces them completely.
- **D-07:** The Tauri dev window shows a React placeholder only — app name ("Mentordashboard CIOS"), version ("v2.0 — Scaffold"), and a status message ("Scaffold complete"). No existing app.js/index.html loaded in Phase 10.
- **D-08:** TypeScript strict mode: `strict: false` globally in `tsconfig.json`. Per-module `noImplicitAny` is enabled during Phase 11 migration.
- **D-09:** Phase 10 Plan 01 starts with an explicit installation task for the Rust toolchain (winget / rustup). **[SUPERSEDED by environment verification: Rust 1.95.0 + VS Build Tools 2026 already installed — see Environment Availability section.]**
- **D-10:** Tauri init command: `npm create tauri-app@latest -- --template react-ts` in the `dashboard-2/` directory.

### Claude's Discretion

- Exact Vitest configuration parameters (pool, coverage provider, reporter) — planner picks standard Vitest defaults.
- Specific Tauri permissions in `tauri.conf.json` for Phase 10 — minimal set; expanded in Phases 12–13.
- ESLint/Prettier configuration — planner follows standard React+TypeScript conventions.

### Deferred Ideas (OUT OF SCOPE)

- Vitest coverage threshold settings — relevant for Phase 11+ when TypeScript modules are added.
- GitHub Actions CI pipeline — relevant for Phase 15 (Packaging).
- ESLint stricter rules — relevant when TypeScript migration is complete (Phase 11+).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TCH-01 | Developer can start the project with `npm run dev` — no Python http.server | Verified: Tauri 2.11.1 `tauri dev` runs Vite dev server + Tauri window; `npm run dev` maps to `tauri dev` |
| TCH-02 | App builds as installable `.exe` (Windows) and `.dmg` (Mac) via one build command | Verified: `npm run build` maps to `tauri build`; generates NSIS/WiX `.exe` on Windows; VS Build Tools 2026 already installed |
| TCH-03 | All 128 existing tests pass after migration (zero regressions) | Research confirms: Vitest 4.1.6 with `globals: true`, `environment: 'jsdom'`, setupFile shim for `jest.*` → `vi.*`, and `vi.resetModules()` compat shim covers all test patterns found in codebase |
| TCH-04 | TypeScript type errors are visible during development (per-module strict mode) | Verified: `strict: false` globally in `tsconfig.json`; editor shows errors via `tsc --noEmit`; `noImplicitAny` enabled per module in Phase 11 |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Vite dev server | Frontend Server | — | Vite serves the React app; Tauri wraps it |
| React placeholder UI | Frontend (Browser/React) | — | Static component; no Tauri IPC in Phase 10 |
| Tauri window | Rust/Tauri | — | Native OS window frame; proxies to Vite dev server |
| TypeScript compilation check | Build tooling | — | `tsc --noEmit` in editor; no emit; strict: false globally |
| Test runner | Build tooling (Vitest) | — | Runs in Node/jsdom; no Tauri runtime involved |
| Windows installer build | Rust/Tauri | — | `tauri build` compiles Rust + bundles Vite output |
| `src-tauri/` Rust backend | Rust/Tauri | — | Plugin registration only in Phase 10 (no custom commands) |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tauri-apps/cli` | 2.11.1 | Tauri dev server + build | [VERIFIED: npm registry] |
| `@tauri-apps/api` | 2.11.0 | JS bindings for IPC (future phases) | [VERIFIED: npm registry] |
| `vite` | 8.0.12 | Bundler + HMR dev server | [VERIFIED: npm registry] |
| `@vitejs/plugin-react` | 6.0.1 | React JSX transform + HMR | [VERIFIED: npm registry] |
| `react` | 19.2.6 | UI framework | [VERIFIED: npm registry] |
| `react-dom` | 19.2.6 | DOM renderer | [VERIFIED: npm registry] |
| `typescript` | ~5.8 | Type checking (not 6.x — see note) | [VERIFIED: npm registry; 6.0.3 is latest but avoided for stability] |
| `vitest` | 4.1.6 | Test runner (Jest replacement) | [VERIFIED: npm registry] |
| `jsdom` | 29.1.1 | DOM environment for Vitest | [VERIFIED: npm registry — required peer dep for Vitest environment: jsdom] |
| `@vitest/coverage-v8` | 4.1.6 | Coverage provider | [VERIFIED: npm registry] |
| `@types/react` | 19.x | React type definitions | [ASSUMED — verify at install] |
| `@types/react-dom` | 19.x | ReactDOM type definitions | [ASSUMED — verify at install] |

**TypeScript version note:** TypeScript 6.0.3 is on npm (May 2026). Use `typescript@~5.8` for this phase to avoid surfacing TS 6 breaking changes during scaffolding. [ASSUMED — TS 6 stability for new projects not verified]

**jsdom is NOT bundled with Vitest.** It is a peer dependency that must be installed explicitly: `npm install -D jsdom`. [VERIFIED: `npm view vitest peerDependencies` shows `jsdom: '*'`]

### Supporting (Phase 10 only — minimal)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `xlsx` (SheetJS) | 0.20.3 (CDN tarball) | Already in package.json; keep for existing tests | `tests/parseStage.test.js` and `tests/parseToetsplan.test.js` require it |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Jest requires transform config for ESM; Vitest is Vite-native, no config overhead |
| `typescript@~5.8` | `typescript@6.x` | TS 6 is new (May 2026); risk of unexpected breaking changes during scaffolding |

**Installation (after scaffold merge):**

```bash
# Remove Jest, add Vitest + jsdom
npm uninstall jest jest-environment-jsdom
npm install -D vitest @vitest/coverage-v8 jsdom

# Tauri + React stack (generated by scaffold, may already be present)
npm install react react-dom
npm install -D @tauri-apps/cli typescript@~5.8 vite @vitejs/plugin-react @types/react @types/react-dom
```

---

## Architecture Patterns

### System Architecture Diagram (Phase 10 scope)

```
Developer runs: npm run dev
        |
        v
  tauri dev  (Tauri CLI)
   |         |
   v         v
Rust compile  Vite dev server
(src-tauri/)  port 1420
              |
              v
        Tauri window
        (WebView2 on Windows)
              |
              v
        React placeholder
        src/App.tsx
        "Mentordashboard CIOS"
        "v2.0 — Scaffold"
        "Scaffold complete"

Separately:
npm run test
        |
        v
vitest run
        |
        v
jsdom environment
        |
        v
tests/*.test.js  (128 tests, unchanged)
        |
        v
require('../utils/*.js')  — IIFE modules loaded via CommonJS
require('../parsers/*.js') — CommonJS
        |
        v
global.window = global shims work in jsdom
jest.fn() → resolved by setupFile shim
        |
        v
0 failures, 128 passed
```

### Recommended Project Structure (after scaffold)

```
dashboard-2/
├── src/                        # NEW — Vite+React frontend (Phase 10 placeholder)
│   ├── main.tsx               # ReactDOM.createRoot entry point
│   ├── App.tsx                # Placeholder component
│   └── styles.css             # Minimal styles
├── src-tauri/                  # NEW — Tauri Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json        # devUrl, frontendDist, productName
│   ├── capabilities/
│   │   └── default.json       # Minimal permissions (core:default)
│   └── src/
│       ├── main.rs
│       └── lib.rs
├── tests/                      # UNCHANGED — existing 128 tests
│   ├── *.test.js
│   └── jest.config.js         # DELETED — replaced by vitest.config.ts
├── utils/                      # UNCHANGED — existing IIFE modules
├── parsers/                    # UNCHANGED — existing parsers
├── vendor/                     # UNCHANGED
├── app.js                      # UNCHANGED
├── index.html                  # UNCHANGED (old app entry; NOT used by Vite)
├── vitest.config.ts            # NEW — replaces tests/jest.config.js
├── vite.config.ts              # NEW — generated by scaffold
├── tsconfig.json               # NEW — strict: false globally
├── tsconfig.app.json           # NEW — for src/ code
├── tsconfig.node.json          # NEW — for vite.config.ts
└── package.json                # MERGED — scaffold output + existing deps
```

**Important:** The existing `index.html` at the root is the OLD app entry point. Vite uses a NEW `index.html` generated by the scaffold. These are separate files — the old one is left untouched (D-02).

### Pattern 1: `npm create tauri-app` in an existing directory

**What:** The scaffold tool will prompt for a project name. Answering `"."` tells it to scaffold into the current directory. It will generate files and **will overwrite `package.json`** with its own minimal version.

**Critical:** The existing `package.json` has `xlsx` CDN tarball and `jest` deps. The scaffold generates a clean one. The plan MUST merge these:

1. Note the existing `package.json` content before running the scaffold.
2. Run `npm create tauri-app@latest -- --template react-ts` and answer prompts.
3. Merge the scaffold's `package.json` with the pre-noted existing one:
   - Keep scaffold scripts: `"dev": "tauri dev"`, `"build": "tauri build"`, `"preview": "vite preview"`
   - Add/keep existing devDependencies: `xlsx` tarball
   - Remove: `"jest"`, `"jest-environment-jsdom"`
   - Add: `"vitest"`, `"@vitest/coverage-v8"`, `"jsdom"`
   - Add script: `"test": "vitest run"`, `"test:watch": "vitest"`

[ASSUMED — exact scaffold behavior verified by create-tauri-app README; exact overwrite behavior is observed pattern, not documented in official source]

**Scaffold generates (react-ts template):**
```
src/
  main.tsx
  App.tsx
  styles.css
src-tauri/
  Cargo.toml
  tauri.conf.json
  capabilities/default.json
  src/main.rs, lib.rs
index.html         ← NEW scaffold entry (overwrites existing if same name — RISK)
vite.config.ts     ← NEW
tsconfig.json      ← NEW
tsconfig.app.json  ← NEW
tsconfig.node.json ← NEW
package.json       ← OVERWRITTEN — must be merged
```

**RISK: `index.html` collision.** The scaffold generates a new `index.html` as the Vite entry point. The existing `index.html` is the old app. These have the same filename at the same location. The planner must handle this:
- Option A: Backup the old `index.html` to `index.html.bak` before scaffolding. [RECOMMENDED]
- Option B: After scaffolding, restore the old one to `index.old.html` and confirm the new one is correct.

[ASSUMED — based on create-tauri-app behavior as described in docs; needs operator confirmation]

### Pattern 2: Vitest configuration for existing CommonJS IIFE test suite

**What:** The existing tests use CommonJS `require()`, `global.window = global` shims, and IIFE modules (no ES exports). Vitest must be configured to handle this.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{js,ts}'],
    setupFiles: ['./tests/vitest-setup.js'],
    coverage: {
      provider: 'v8',
      include: ['utils/**', 'parsers/**'],
    },
  },
});
```

[VERIFIED: Vitest docs — environment, globals, include, setupFiles are all standard config options]

**Key insight:** The existing tests use CommonJS `require()` throughout. Vitest supports CJS in test files by default — no special transform config needed for `.test.js` files. The IIFE modules (`utils/prognosis.js`, `utils/actiepunten.js`, etc.) are loaded via `require()` and register globals on `window` — this works in jsdom mode because `global.window = global` runs first.

### Pattern 3: Jest shim setupFile

**Critical finding:** Two test files use `jest.*` APIs that do NOT automatically alias to `vi.*` in Vitest, even with `globals: true`:

| File | Usage | Impact |
|------|-------|--------|
| `actiepunten.test.js` | `jest.fn()`, `jest.resetModules()` | Will throw `jest is not defined` |
| `backup.test.js` | `jest.fn()` (×2) | Will throw `jest is not defined` |
| `parseToetsplan.test.js` | `require('jest-environment-jsdom')` (import of `JSDOM`) | Will fail — package removed; but JSDOM is never actually used in the file |

**Solution — setupFile shim** (does not modify test files, satisfying D-04):

```javascript
// tests/vitest-setup.js
// Shim jest globals to vi equivalents so existing tests run without modification.
// Required because actiepunten.test.js and backup.test.js use jest.fn() / jest.resetModules().
import { vi } from 'vitest';

globalThis.jest = {
  fn: vi.fn.bind(vi),
  spyOn: vi.spyOn.bind(vi),
  resetModules: vi.resetModules.bind(vi),
  mock: vi.mock.bind(vi),
  clearAllMocks: vi.clearAllMocks.bind(vi),
  resetAllMocks: vi.resetAllMocks.bind(vi),
};
```

[CITED: Vitest migration guide — vi equivalents documented; shim approach is community pattern, not officially documented as supported — MEDIUM confidence]

**For `parseToetsplan.test.js` JSDOM import:** The line `const { JSDOM } = require('jest-environment-jsdom')` imports a package that will be removed. However, `JSDOM` is imported but **never used in the test file** (confirmed by grep). This line will throw a `Cannot find module 'jest-environment-jsdom'` error. The fix is a one-line mock in vitest.config.ts or a setupFile mock:

```typescript
// In vitest.config.ts, add:
test: {
  alias: {
    'jest-environment-jsdom': './tests/__mocks__/jest-environment-jsdom.js',
  }
}
```

```javascript
// tests/__mocks__/jest-environment-jsdom.js
module.exports = { JSDOM: class JSDOM {} };
```

Alternatively, the single unused import line in `parseToetsplan.test.js` can be removed (it is dead code, not test logic — removing it does not change test behavior and does not conflict with D-04's spirit of "no test rewriting").

[ASSUMED — removing a dead import line counts as "no test rewriting" under D-04; if this interpretation is rejected, use the mock alias approach]

### Pattern 4: Tauri v2 minimal `tauri.conf.json` for Phase 10

```json
{
  "productName": "Mentordashboard CIOS",
  "version": "2.0.0",
  "identifier": "nl.cios.mentordashboard",
  "build": {
    "beforeDevCommand": "npm run vite-dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Mentordashboard CIOS",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "useHttpsScheme": true
      }
    ],
    "security": {
      "csp": "default-src 'self' tauri: asset:; script-src 'self'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"]
  }
}
```

**Key settings:**
- `devUrl: "http://localhost:1420"` — Vite's default port for Tauri projects [CITED: v2.tauri.app configuration docs; 1420 is the Tauri-standard Vite port]
- `frontendDist: "../dist"` — Vite output directory relative to `src-tauri/` [CITED: Tauri v2 migration guide]
- `useHttpsScheme: true` — Critical for Windows localStorage stability (P-07). Set from day 1. [VERIFIED: PITFALLS.md P-07; Tauri v1→v2 migration guide]
- `csp` — Minimal for Phase 10 (no PDF workers, no blob: needed yet)

**v2 key name changes from v1 (avoid these v1 names):**
- `devPath` → `devUrl` [CITED: Tauri migration guide]
- `distDir` → `frontendDist` [CITED: Tauri migration guide]
- `tauri > allowlist` → `src-tauri/capabilities/*.json` [VERIFIED: PITFALLS.md P-08]

### Pattern 5: `vite.config.ts` for Phase 10

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Required for Tauri: use relative base path so assets resolve in production
  base: './',

  // Tauri dev server settings
  server: {
    port: 1420,
    strictPort: true,    // fail if port is taken, not silently shift
    host: 'localhost',   // Tauri expects localhost, not 0.0.0.0
    hmr: true,
  },

  // Phase 10 only — no xlsx or pdfjs-dist needed yet
  // Add optimizeDeps when adding those libraries in Phase 11
});
```

**`base: './'` is mandatory** for Tauri production builds. Without it, absolute paths (`/assets/main.js`) 404 in the packaged app. [VERIFIED: PITFALLS.md P-14; github.com/tauri-apps/tauri/issues/13262]

### Pattern 6: `tsconfig.json` for Phase 10 (`strict: false`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noImplicitAny": false
  },
  "include": ["src"]
}
```

**`strict: false` is required by D-08.** This prevents TypeScript from blocking Phase 11 migration. The new React placeholder code in `src/` can be typed correctly regardless — `strict: false` does not prevent writing typed code, it only prevents type errors from blocking compilation.

### Pattern 7: `package.json` scripts after merge

```json
{
  "name": "mentordashboard",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "tauri dev",
    "vite-dev": "vite",
    "build": "tauri build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.11.1",
    "@tauri-apps/api": "^2.11.0",
    "@vitejs/plugin-react": "^6.0.1",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "~5.8.0",
    "vite": "^8.0.12",
    "vitest": "^4.1.6",
    "@vitest/coverage-v8": "^4.1.6",
    "jsdom": "^29.1.1",
    "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
  }
}
```

**Note on `vite-dev` script:** Tauri's `tauri dev` calls `beforeDevCommand` which should start the Vite server, then Tauri opens the window connecting to it. The scaffold typically sets `beforeDevCommand: "npm run dev"` — but `npm run dev` itself calls `tauri dev`, creating a cycle. The standard pattern is:
- `"dev": "tauri dev"` — developer runs this
- `"vite-dev": "vite"` — called by `beforeDevCommand` in `tauri.conf.json`

OR more simply (common scaffold pattern):
- `"dev": "tauri dev"` — developer runs this
- `beforeDevCommand: "npm run vite"` with `"vite": "vite"` script

[ASSUMED — exact generated script names from scaffold may differ; planner should verify against actual scaffold output]

### Anti-Patterns to Avoid

- **Running `npm create tauri-app` without backing up `index.html` first:** The scaffold generates a new `index.html` that overwrites the existing app entry point.
- **Deleting `tests/jest.config.js` before verifying Vitest finds tests:** The jest config `rootDir: '..'` and `testMatch: ['**/*.test.js']` must be replicated in `vitest.config.ts` before deleting the Jest config.
- **Installing `jest-environment-jsdom` alongside Vitest:** Once Vitest handles jsdom, the Jest package is redundant and its presence can cause import confusion.
- **Using `environment: 'node'` for tests:** The existing tests depend on jsdom globals (`window.localStorage`, `document`). Node environment will cause `localStorage is not defined` failures.
- **Forgetting `globals: true` in Vitest config:** Without this, `describe`, `it`, `expect` are undefined in test files (existing tests do not import them).
- **Setting `base: '/'` in vite.config.ts:** This is the Vite default but breaks Tauri production builds. Must be `'./'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Jest→Vitest API compatibility | Custom test runner | `globals: true` + setupFile shim | 5 lines of shim cover all jest.* usage |
| JSDOM environment | Browser emulator | `jsdom` peer dep + `environment: 'jsdom'` | Standard Vitest config; handles all existing window shims |
| Tauri dev server orchestration | Custom concurrently setup | `tauri dev` (calls `beforeDevCommand`) | Tauri CLI manages process lifecycle |
| Windows installer | Custom NSIS script | `tauri build` (WiX/NSIS bundled) | Tauri generates `.msi` and `.exe` via cargo tauri build |

---

## Common Pitfalls

### Pitfall 1: `jest is not defined` — globals: true does not alias `jest`

**What goes wrong:** `actiepunten.test.js` calls `jest.fn()` and `jest.resetModules()`. `backup.test.js` calls `jest.fn()`. Vitest with `globals: true` injects `vi`, `describe`, `it`, `expect`, `beforeEach`, etc. — but NOT `jest`. Tests throw `ReferenceError: jest is not defined`.

**Why it happens:** Vitest explicitly does not provide a `jest` global alias. The migration guide says to replace `jest.*` with `vi.*` — but D-04 locks that test files are not rewritten.

**How to avoid:** Add a `setupFiles` entry that maps `globalThis.jest` to `vi` equivalents (Pattern 3 above). This runs before every test file without modifying test files.

**Warning signs:** `ReferenceError: jest is not defined` in test output for actiepunten or backup tests.

### Pitfall 2: `Cannot find module 'jest-environment-jsdom'`

**What goes wrong:** `parseToetsplan.test.js` line 31: `const { JSDOM } = require('jest-environment-jsdom')`. After removing `jest-environment-jsdom`, this `require()` throws at module load time — the entire test file fails, costing test count.

**Why it happens:** The import is dead code (JSDOM is never used in that file) but it still executes.

**How to avoid:** Either add a module alias mock in vitest.config.ts (Pattern 3 alternate), or delete the dead import line. The planner must choose and document the approach.

**Warning signs:** `parseToetsplan.test.js` fails with module-not-found error before any tests run.

### Pitfall 3: `index.html` overwrite by scaffold

**What goes wrong:** `npm create tauri-app` generates a new `index.html` (Vite entry point). The existing `index.html` is the current app. If not backed up, the old app entry point is lost (contradicting D-02).

**Why it happens:** Both files live at `dashboard-2/index.html`.

**How to avoid:** Before running the scaffold: `copy index.html index.html.bak`. After scaffolding, verify `index.html` is the new Vite entry (`<div id="root"></div>`), not the old app. The backup preserves D-02 compliance.

**Warning signs:** After scaffolding, `index.html` still shows the old app's `<script src="app.js">` structure instead of a `<div id="root">`.

### Pitfall 4: `package.json` scripts cycle (`dev` → `tauri dev` → `beforeDevCommand: npm run dev`)

**What goes wrong:** If `tauri.conf.json` sets `beforeDevCommand: "npm run dev"` and `package.json` has `"dev": "tauri dev"`, running `npm run dev` triggers an infinite loop (npm → tauri → npm → tauri…).

**Why it happens:** Generated scaffold may set `beforeDevCommand` to `"npm run dev"` — which is fine if `dev` is `vite` but wrong if `dev` is `tauri dev`.

**How to avoid:** Set `"vite": "vite"` (or `"vite-dev": "vite"`) as a separate script and use that in `beforeDevCommand`. Keep `"dev": "tauri dev"` as the developer-facing entry point.

**Warning signs:** Terminal shows alternating npm/tauri invocations; process does not terminate.

### Pitfall 5: `vite.config.ts` base path `/` breaks Tauri production

**What goes wrong:** Vite default `base: '/'`. In a Tauri production `.exe`, assets are resolved relative to the app scheme. Absolute paths (`/assets/main.js`) 404 because the bundled app uses a custom scheme (`tauri://` or `asset://`), not a web server.

**Why it happens:** Standard Vite web config is not compatible with Tauri's asset serving.

**How to avoid:** Always set `base: './'` in `vite.config.ts` from the first scaffold. [VERIFIED: PITFALLS.md P-14]

**Warning signs:** `npm run dev` works, `npm run build` produces a blank window in the installed app.

### Pitfall 6: Vite server port conflict with existing tools

**What goes wrong:** Vite defaults to port 5173; Tauri-specific scaffolds typically use 1420. If another process uses 1420, `tauri dev` fails.

**How to avoid:** Set `strictPort: true` in `vite.config.ts` so the failure is explicit, not a silent port shift that breaks `devUrl`.

---

## Code Examples

### React placeholder component (Phase 10 target)

```tsx
// src/App.tsx
function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Mentordashboard CIOS</h1>
      <p>v2.0 — Scaffold</p>
      <p style={{ color: 'green' }}>Scaffold complete</p>
    </div>
  );
}

export default App;
```

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Vitest config (complete)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{js,ts}'],
    setupFiles: ['./tests/vitest-setup.js'],
    coverage: {
      provider: 'v8',
      include: ['utils/**', 'parsers/**'],
    },
  },
});
```

### Jest shim setupFile

```javascript
// tests/vitest-setup.js
// Shim jest.* to vi.* so existing tests pass without modification.
// Only actiepunten.test.js and backup.test.js use jest.* APIs.
import { vi } from 'vitest';

globalThis.jest = {
  fn:            vi.fn.bind(vi),
  spyOn:         vi.spyOn.bind(vi),
  mock:          vi.mock.bind(vi),
  resetModules:  vi.resetModules.bind(vi),
  clearAllMocks: vi.clearAllMocks.bind(vi),
  resetAllMocks: vi.resetAllMocks.bind(vi),
  restoreAllMocks: vi.restoreAllMocks.bind(vi),
};
```

### Minimal `src-tauri/capabilities/default.json`

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Phase 10 — minimal permissions for scaffold",
  "windows": ["main"],
  "permissions": [
    "core:default"
  ]
}
```

Phase 12+ adds `store:*`, `fs:*`, `dialog:*` permissions.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `jest.config.js` with `testEnvironment: 'jsdom'` | `vitest.config.ts` with `test.environment: 'jsdom'` | Migration in Phase 10 | Vitest is Vite-native; no transform config for ESM modules |
| `tauri > allowlist` (v1) | `src-tauri/capabilities/*.json` | Tauri 2.0 (Oct 2024) | All plugin access requires explicit capability declaration |
| `build.devPath` (v1) | `build.devUrl` (v2) | Tauri 2.0 | Config key renamed |
| `build.distDir` (v1) | `build.frontendDist` (v2) | Tauri 2.0 | Config key renamed |
| `npm test` → Jest | `npm test` → `vitest run` | Phase 10 | No more `jest-environment-jsdom`; jsdom is a direct peer dep |

**Deprecated / outdated — do NOT use:**
- `jest`, `jest-environment-jsdom` — removed in Phase 10
- `tests/jest.config.js` — deleted, replaced by `vitest.config.ts`
- `build.devPath` and `build.distDir` — Tauri v1 config keys that fail in v2

---

## Runtime State Inventory

This is a toolchain scaffolding phase (greenfield additions), not a rename or migration. No runtime state is being renamed. Omitted.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build, npm | Yes | v24.14.0 | — |
| Rust + Cargo | Tauri compilation | **Yes** | 1.95.0 stable-x86_64-pc-windows-msvc | — |
| VS Build Tools (MSVC linker) | Tauri Windows target | **Yes** | Build Tools 2026 (18.4.1) | — |
| WebView2 | Tauri dev window on Windows | Likely (Win11 pre-installed) | — | embedBootstrapper in installer |
| `@tauri-apps/cli` | `tauri dev` + `tauri build` | npm-installable | 2.11.1 | — |
| `vitest` | Test runner | npm-installable | 4.1.6 | — |
| `jsdom` | Vitest test environment | npm-installable | 29.1.1 | — |

**D-09 superseded:** Decision D-09 called for a Rust installation task as the first step in Phase 10 Plan 01. Verification on 2026-05-13 confirms:
- `rustc 1.95.0 (59807616e 2026-04-14)` — stable MSVC toolchain active
- `cargo 1.95.0` — working
- `rustup 1.29.0` — installed
- `Visual Studio Build Tools 2026 (18.4.1)` — MSVC linker available

**The Rust pre-flight task should be removed from Plan 01.** The planner should replace it with a verification step: `rustc --version && cargo --version` to confirm at plan-execution time.

**WebView2:** Windows 11 includes WebView2 as a system component. The developer's machine is confirmed Windows 11 (from environment context). WebView2 should be available for `tauri dev`. For end-user deployment (Phase 15), consider `webviewInstallMode: "embedBootstrapper"` in `tauri.conf.json`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 (replacing Jest 29.7.0) |
| Config file | `vitest.config.ts` (NEW — to be created in Wave 0) |
| Quick run command | `npm run test` (`vitest run` — no watch, CI-compatible) |
| Full suite command | `npm run test -- --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TCH-01 | `npm run dev` starts Tauri window | manual smoke | `tauri dev` — observe window opens | N/A — manual |
| TCH-02 | `npm run build` produces `.exe` | manual smoke | `tauri build` — check `src-tauri/target/release/bundle/` | N/A — manual |
| TCH-03 | 128 tests pass, 0 failures | automated | `npm run test` | ✅ existing test files; ❌ `vitest.config.ts` Wave 0 |
| TCH-04 | TypeScript errors visible in editor | manual smoke | `npm run typecheck` — should complete without errors on Phase 10 code | N/A — manual |

### Sampling Rate

- **Per task commit:** `npm run test` (full Vitest run — fast, ~5–10 seconds for 128 tests)
- **Per wave merge:** `npm run test -- --coverage` (full suite + coverage)
- **Phase gate:** `npm run test` green (0 failures, 128 passed) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest configuration (Pattern 2 above)
- [ ] `tests/vitest-setup.js` — jest shim for `jest.fn()` → `vi.fn()` (Pattern 3 above)
- [ ] `tests/__mocks__/jest-environment-jsdom.js` — OR delete dead import in `parseToetsplan.test.js`
- [ ] `src/main.tsx` — React entry point (generated by scaffold or written manually)
- [ ] `src/App.tsx` — placeholder component (Pattern above)
- [ ] `src-tauri/tauri.conf.json` — minimal v2 config (Pattern 4 above)
- [ ] `vite.config.ts` — with `base: './'` and port 1420 (Pattern 5 above)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Single-user local tool; no login |
| V3 Session Management | No | No server sessions |
| V4 Access Control | No | No multi-user |
| V5 Input Validation | No | Phase 10 is scaffold only — no data input |
| V6 Cryptography | No | Phase 10 placeholder only; no encryption yet |

### Known Threat Patterns for Tauri Scaffold

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tauri allowlist-style config in v2 | Tampering | Use capabilities JSON, not `allowlist` key (P-08) |
| localStorage scheme change (HTTP vs HTTPS) | Info Disclosure | Set `useHttpsScheme: true` in `tauri.conf.json` immediately (P-07) |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `npm create tauri-app` will overwrite `index.html` if present | Pitfall 3, Pattern 1 | If it prompts before overwriting, backup is still low-cost; risk is LOW |
| A2 | `globalThis.jest = { fn: vi.fn.bind(vi), ... }` shim fully satisfies `jest.fn()` and `jest.resetModules()` usage in tests | Pattern 3 | If test calls more obscure jest APIs not in the shim, additional shim entries needed; very LOW risk given scope of usage |
| A3 | `JSDOM` import from `jest-environment-jsdom` in `parseToetsplan.test.js` is never called (dead code) | Pattern 3, Pitfall 2 | If JSDOM is actually used somewhere in that file (not found by grep), removing the import would break a test |
| A4 | TypeScript 5.8 is appropriate (not 6.x) for Phase 10 | Standard Stack | TS 6 may be production-stable enough; LOW risk if using 5.8 conservatively |
| A5 | Vite dev server default port for Tauri scaffold is 1420 | Pattern 4, Pattern 5 | Actual scaffold may use 5173 (Vite default); plan should verify `devUrl` matches actual Vite port |
| A6 | `beforeDevCommand` pattern for separating `tauri dev` from `vite` script avoids cycle | Pattern 7 | Generated scaffold may already handle this correctly with different script names |
| A7 | WebView2 is available on the developer's Windows 11 machine | Environment Availability | If absent: install WebView2 Evergreen Bootstrapper from Microsoft; LOW risk on Windows 11 |

**All HIGH-risk claims in this research are verified or cited. Assumptions A1–A7 are all LOW-risk items.**

---

## Open Questions

1. **Exact create-tauri-app interactive prompts**
   - What we know: The command accepts `"."` as project name to scaffold in-place; `--template react-ts` skips template selection
   - What's unclear: Whether it prompts for additional options (identifier, bundle name) that affect `tauri.conf.json`
   - Recommendation: Planner should include "note the prompt sequence" as a task step; expected prompts: project name (`.`), package manager (`npm`), template (pre-set via `--template react-ts`)

2. **Whether `package.json` is overwritten or merged by scaffold**
   - What we know: The scaffold is documented to generate `package.json`; existing has `jest` and `xlsx`
   - What's unclear: Whether create-tauri-app detects an existing `package.json` and merges or overwrites
   - Recommendation: Treat as overwrite (safer assumption); planner includes a backup-and-merge task

3. **Vitest `vi.resetModules()` interaction with `require()` in tests**
   - What we know: `actiepunten.test.js` uses `jest.resetModules()` then `require('../utils/actiepunten.js')` in `beforeEach`. The shim maps this to `vi.resetModules()`.
   - What's unclear: Vitest's documentation notes that `vi.resetModules()` behavior changed between v3 and v4 regarding pool workers. Tests using `require()` after `resetModules()` may behave differently.
   - Recommendation: Run the test suite immediately after configuring Vitest to verify; if `actiepunten.test.js` fails, investigate the pool configuration.

---

## Sources

### Primary (HIGH confidence)

- npm registry (`npm view`) — verified: @tauri-apps/cli 2.11.1, @tauri-apps/api 2.11.0, vitest 4.1.6, jsdom 29.1.1, vite 8.0.12, react 19.2.6 [VERIFIED]
- `npm view vitest peerDependencies` — confirms `jsdom: '*'` is a peer dep, not bundled [VERIFIED]
- `rustc --version` on target machine — confirms Rust 1.95.0 stable-x86_64-pc-windows-msvc [VERIFIED]
- `rustup show` — confirms active toolchain is MSVC, not GNU [VERIFIED]
- VS Build Tools 2026 (18.4.1) — confirmed via Windows registry query [VERIFIED]
- Node.js v24.14.0 — confirmed via `node --version` [VERIFIED]
- `.planning/research/PITFALLS.md` — P-05, P-06, P-07, P-08, P-14, P-19 apply to Phase 10 [VERIFIED]
- `.planning/research/STACK.md` — library versions, Jest→Vitest config mapping table [VERIFIED]
- Vitest migration guide (`vitest.dev/guide/migration`) — `vi.*` equivalents, `globals: true`, no automatic `jest` alias [CITED]
- Tauri v1→v2 migration guide (`v2.tauri.app/start/migrate/from-tauri-1/`) — `devUrl`, `frontendDist` key names, `useHttpsScheme` [CITED]
- Existing test files (direct inspection) — `jest.fn()` usage in 2 files, dead `JSDOM` import in 1 file [VERIFIED]

### Secondary (MEDIUM confidence)

- Vitest environment docs (`vitest.dev/guide/environment`) — jsdom requires separate install [CITED]
- Tauri configuration docs (`v2.tauri.app/develop/configuration-files/`) — `build.devUrl` structure [CITED]
- `tests/prognosis.test.js` inspection — IIFE load pattern + `global.window = global` shim; Vitest jsdom handles this [VERIFIED by inspection]

### Tertiary (LOW confidence)

- `globalThis.jest` shim approach — community pattern, not in official Vitest docs [WebSearch — single source]
- Exact scaffold prompt sequence for `npm create tauri-app@latest -- --template react-ts` — documented partially in README [WebFetch — incomplete]
- `package.json` overwrite behavior of scaffold in existing directory — inferred from common behavior [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Environment availability (Rust, Node, VS Build Tools): HIGH — verified via shell commands
- Standard stack versions: HIGH — verified via npm registry
- Vitest configuration patterns: HIGH — cited from official docs
- Jest shim approach: MEDIUM — community pattern, works in practice
- Tauri scaffold behavior in existing directory: MEDIUM — partially documented

**Research date:** 2026-05-13
**Valid until:** 2026-07-13 (Tauri and Vitest release frequently — re-verify package versions before execution)
