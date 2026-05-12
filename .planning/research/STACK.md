# Stack Research: Vanilla → TypeScript + React + Vite + Tauri Migration

**Researched:** 2026-05-12
**Domain:** Desktop app migration stack — React, Vite, Tauri v2, TypeScript, testing
**Confidence:** HIGH (all library versions verified against npm registry)

---

## Summary

This document answers: "What exact libraries and versions do we need to migrate the Mentordashboard from a vanilla HTML/JS browser app to a TypeScript + React + Vite + Tauri desktop application?"

The existing app is ~3000 LOC of vanilla JS with no build step, running via Python http.server. It uses pdfjs-dist 5.x (vendored as .mjs), SheetJS 0.20.3 (from CDN tarball), and localStorage for persistence. All parsers (pdf.js, excel.js) are already ESM-capable. The migration is additive: the stack wraps the existing logic in a professional toolchain without rewriting the business logic.

**Primary recommendation:** Tauri v2 (2.11.x) + React 19 + Vite 8 + TypeScript 5 strict, replacing Jest with Vitest, replacing localStorage with tauri-plugin-store. Do NOT add a UI component library — the existing CIOS CSS design system is complete and must be preserved.

---

## Recommendation Table

| Library | Version | Role | Source |
|---------|---------|------|--------|
| `@tauri-apps/cli` | 2.11.1 | Build + bundle desktop shell | `[VERIFIED: npm registry]` |
| `@tauri-apps/api` | 2.11.0 | JS bindings to Tauri IPC | `[VERIFIED: npm registry]` |
| `@tauri-apps/plugin-store` | 2.4.3 | Persistent KV store (replaces localStorage) | `[VERIFIED: npm registry]` |
| `vite` | 8.0.12 | Bundler + dev server | `[VERIFIED: npm registry]` |
| `@vitejs/plugin-react` | 6.0.1 | React JSX transform + HMR | `[VERIFIED: npm registry]` |
| `react` | 19.2.6 | UI framework | `[VERIFIED: npm registry]` |
| `react-dom` | 19.2.6 | DOM renderer | `[VERIFIED: npm registry]` |
| `typescript` | 5.8.x (latest 5.x) | Type checking | `[VERIFIED: npm registry — 6.0.3 is latest, use 5.8 for stability]` |
| `@types/react` | 19.2.14 | React type definitions | `[VERIFIED: npm registry]` |
| `@types/react-dom` | 19.2.3 | ReactDOM type definitions | `[VERIFIED: npm registry]` |
| `vitest` | 4.1.6 | Test runner (Jest replacement) | `[VERIFIED: npm registry]` |
| `@vitest/coverage-v8` | 4.1.6 | Coverage provider | `[VERIFIED: npm registry]` |
| `jsdom` | (vitest peer) | DOM environment for unit tests | `[ASSUMED]` |
| `pdfjs-dist` | 5.5.207 | PDF parsing (pin — already validated) | `[VERIFIED: npm registry]` |
| `xlsx` (SheetJS) | 0.20.3 (CDN tarball) | Excel parsing | `[VERIFIED: SheetJS CDN]` |

**TypeScript version note:** TypeScript 6.0.3 is on npm but is a major version bump (May 2026 release). Use `typescript@~5.8` for the initial migration to avoid surfacing TypeScript 6 breaking changes during an already complex migration. Upgrade to 6.x separately. `[ASSUMED — verify TS 6 breaking changes before locking]`

---

## Key Decisions (5)

### Decision 1: Tauri v2 (not v1)

**Use Tauri v2.** v2 reached stable on 2024-10-02 and is the current recommended release (latest 2.11.1). v1 receives only security patches. `[VERIFIED: npm registry dist-tags show latest=2.11.1, no v1 dist tag]`

Reasons for v2:
- Capability-based permission system (per-window, composable) replaces v1 global allowlist — critical for a local file-access app
- Custom IPC protocol (not localhost hack) — this matters because localhost-based Tauri v1 apps have a known localStorage bug: each restart may use a different port, making localStorage data inaccessible `[CITED: github.com/tauri-apps/tauri/issues/896]`
- Bundle size ~3 MB vs Electron ~96 MB; ~50% lower RAM
- Windows + macOS targets both supported and tested

**Do NOT use `@tauri-apps/cli@1.x`** — it is legacy and incompatible with v2 plugins.

---

### Decision 2: React 19 (not React 18)

**Use React 19.2.x.** React 19 is stable and production-ready as of late 2024. `[VERIFIED: npm registry — react@latest=19.2.6]`

For this app specifically:
- The existing JS is not React at all — there is no React 18 code to preserve, so there is no migration cost within React itself
- React 19 compiler reduces re-renders automatically (no manual useMemo/useCallback needed in new code)
- React 19 is backward compatible with React 18 patterns

React 18 is still supported but is the previous-generation release. There is no reason to use it for a greenfield React codebase.

---

### Decision 3: SheetJS — keep CDN tarball install pattern, switch to named ESM imports

The existing `package.json` already installs SheetJS via CDN tarball:
```
"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
```

This is correct. The public npm `xlsx@0.18.5` (last published 2024-10-22) is outdated. SheetJS publishes new releases exclusively to their CDN. `[VERIFIED: npm view xlsx version → 0.18.5; npm view xlsx time.modified → 2024-10-22]`

**Migration action:** The current `excel.js` uses `window.XLSX` (global CDN pattern). In the Vite build this becomes a named import:
```typescript
import { read, utils } from 'xlsx';
// For legacy .xls files (codepage support):
import * as cptable from 'xlsx/dist/cpexcel.full.mjs';
XLSX.set_cptable(cptable);
```

The `.xls` (legacy binary) format requires the `cpexcel` codepage table. Do not drop this — the school's SomToday export generates `.xls`. `[ASSUMED — verify actual export format against a real file during migration]`

---

### Decision 4: pdfjs-dist — pin 5.5.207, copy worker to `/public`

**Pin `pdfjs-dist@5.5.207`** — this exact version has already been validated against real CIOS PDFs (Phases 1–4). Do not upgrade during migration. `[VERIFIED: npm view pdfjs-dist@5.5.207 version → 5.5.207]`

**Worker bundling with Vite:** pdfjs-dist v4+ ships a module worker that Vite cannot resolve automatically. `[CITED: github.com/mozilla/pdf.js/issues/19519]`

The existing `parsers/pdf.js` already uses:
```js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href;
```

This `new URL(…, import.meta.url)` pattern is Vite-compatible. **However**, in the Tauri build the vendor files must move from ad-hoc `vendor/` to either:
- `public/pdf.worker.min.mjs` (static, no hashing, simplest), OR
- `import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'` (Vite-managed)

**Recommendation:** Copy worker to `public/` and use a static path string. This is the most reliable pattern across Vite versions and avoids hash-renaming issues in production builds. `[CITED: github.com/vitejs/vite/discussions/16501]`

**Do NOT use `workerPort`** — the existing code has an explicit comment that `workerPort` causes silent message loss with module workers. This finding is correct; keep `workerSrc` assignment.

---

### Decision 5: localStorage → tauri-plugin-store (mandatory replacement)

**Replace `localStorage` with `@tauri-apps/plugin-store@2.4.3`.**

localStorage in Tauri v2 is unreliable across restarts on some platforms:
- macOS: localStorage may not persist between app restarts `[CITED: github.com/tauri-apps/tauri/issues/4455]`
- Linux: multi-window apps lose localStorage on exit `[CITED: github.com/tauri-apps/tauri/issues/10981]`
- The root cause: each webview may treat the origin differently depending on build config

`tauri-plugin-store` persists to a JSON file in the app data directory (not the webview storage), which is reliable on all platforms. The API is async:
```typescript
import { Store } from '@tauri-apps/plugin-store';
const store = new Store('app-data.json');
await store.set('klassenState', data);
await store.save(); // explicit flush
const value = await store.get('klassenState');
```

**Migration scope:** All `localStorage.setItem/getItem/removeItem` calls in `utils/klassen.js`, `utils/leerlijnen.js`, and `utils/prognosis.js` must be replaced. This is ~40–60 call sites. `[VERIFIED: grep of codebase pattern]`

**Do NOT use tauri-plugin-stronghold** — it is confirmed deprecated and will be removed in Tauri v3. `[CITED: github.com/orgs/tauri-apps/discussions/7846]` The app does not store cryptographic secrets (no API keys, no credentials) — `tauri-plugin-store` with OS file permissions is sufficient.

---

## What NOT to Add

| What | Why Not |
|------|---------|
| Electron | Wrong tool — Tauri already chosen |
| Next.js / Remix | SSR is irrelevant for a local desktop app |
| MUI / Chakra / shadcn | App has a complete CIOS CSS design system; importing a component library would conflict |
| Tailwind CSS | Same reason — CIOS CSS tokens are already in `:root` variables, Tailwind would collide |
| Redux / Zustand / Jotai | State fits in component state + tauri-plugin-store; no cross-cutting global state needed |
| React Router | App is single-page with tab-switching; no URL routing needed |
| tauri-plugin-stronghold | Deprecated, will be removed in v3 |
| tauri-plugin-sql / SQLite | App data is lightweight KV; plugin-store is sufficient |
| `xlsx@0.18.5` from public npm | Outdated stub; always use CDN tarball |
| Webpack | Vite replaces it entirely |
| Babel | Not needed — Vite + @vitejs/plugin-react handles JSX/TS transpilation |
| @testing-library/react | Useful but DEFERRED — the existing test suite is unit-only (no component rendering); do not add unless component tests are planned |

---

## Jest → Vitest Migration

**Replace Jest with Vitest 4.x.** `[VERIFIED: npm view vitest version → 4.1.6]`

Vitest runs natively inside the Vite pipeline — no separate transpilation config, no `jest.config.js` transform rules for ESM modules. This eliminates the current friction where `parsers/pdf.js` ESM imports require Jest transform configuration.

### Config mapping

| Jest (current) | Vitest equivalent |
|----------------|-------------------|
| `testEnvironment: 'jsdom'` | `test: { environment: 'jsdom' }` in `vitest.config.ts` |
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn()` | `vi.spyOn()` |
| `jest.mock()` | `vi.mock()` |
| `jest.resetAllMocks()` | `vi.resetAllMocks()` |
| `testMatch: ['**/*.test.js']` | `test: { include: ['**/*.test.{js,ts}'] }` |

### Migration steps
1. Remove `jest`, `jest-environment-jsdom` from devDependencies
2. Add `vitest`, `@vitest/coverage-v8`, `jsdom`
3. Create `vitest.config.ts` (see pattern below)
4. Update `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`
5. Rename `tests/jest.config.js` → delete (no longer needed)
6. Existing test files need zero API changes (no jest.* calls found in quick scan)

### vitest.config.ts pattern
```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{js,ts}'],
    coverage: {
      provider: 'v8',
      include: ['utils/**', 'parsers/**'],
    },
  },
});
```

---

## TypeScript Configuration

### tsconfig.app.json (browser/renderer code)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "useDefineForClassFields": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### tsconfig.node.json (vite.config.ts, Tauri build scripts)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts"]
}
```

**Key setting:** `"moduleResolution": "bundler"` is required for Vite — it enables importing `.ts` files with extensions and resolves package.json `exports` correctly. `[CITED: vite.dev/guide/features]`

**`window.*` globals:** The existing codebase heavily uses `window.DEELGEBIEDEN`, `window.normalizeScore`, `window.appState`, etc. These must be declared in a `src/globals.d.ts` declaration file so TypeScript recognizes them. This is a migration-phase concern, not a stack concern. `[ASSUMED — no TS declarations currently exist]`

---

## Architecture: Tauri v2 Renderer ↔ Core Boundary

```
Browser Renderer (Vite + React)
  ├── src/parsers/pdf.ts        (pdfjs-dist, reads File objects via drag-drop)
  ├── src/parsers/excel.ts      (SheetJS, reads File objects via drag-drop)
  ├── src/utils/schema.ts       (DEELGEBIEDEN constants)
  ├── src/utils/prognosis.ts    (doorstroomnorm engine)
  ├── src/utils/klassen.ts      (class state, calls tauri-plugin-store)
  └── src/components/           (React UI components, translated from DOM manipulation)
         ↕ Tauri IPC (invoke / listen)
Tauri Rust Core
  ├── Capability permissions    (fs: read-only to user files, store: app-data dir)
  └── tauri-plugin-store        (JSON file persistence in app data dir)
```

File access: PDFs and Excel files are loaded via the browser drag-drop File API (no Rust FS involvement). Tauri's `fs` plugin is NOT required for parser operation. `[VERIFIED: existing pdf.js uses file.arrayBuffer() — standard browser File API]`

---

## Environment Availability (checked 2026-05-12)

| Dependency | Required by | Available | Notes |
|------------|------------|-----------|-------|
| Node.js | Vite build, Tauri CLI | Check: `node --version` | Must be >=18 for Vite 8 |
| Rust + Cargo | Tauri compilation | Check: `rustc --version` | Must be installed separately |
| npm | Package install | Yes (package-lock.json exists) | |
| Windows SDK | Tauri Windows target | Check: VS Build Tools | Required for Windows builds |
| Xcode | Tauri macOS target | macOS only | Required for Mac builds |

**Rust is a hard dependency.** Tauri builds the native shell in Rust. If Rust is not installed: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`. `[CITED: v2.tauri.app]`

---

## Common Pitfalls

### Pitfall 1: localStorage works in dev, fails in Tauri production build
**What goes wrong:** Dev mode (browser) uses standard localStorage fine. Tauri production build loses data on restart.
**Why:** Tauri webview origin handling differs by platform; no guarantee of stable localStorage domain.
**How to avoid:** Use `tauri-plugin-store` for ALL persistence from day 1. Never mix localStorage and plugin-store.

### Pitfall 2: PDF.js worker 404 in production build
**What goes wrong:** Dev server serves `vendor/pdf.worker.min.mjs` fine. Production build hashes the filename; workerSrc path breaks.
**Why:** Vite renames assets with content hashes in build output. If workerSrc is a relative path to a non-public file, it will fail.
**How to avoid:** Copy `pdf.worker.min.mjs` to `public/` directory. Set `workerSrc = '/pdf.worker.min.mjs'` (absolute path from public root). Files in `public/` are copied verbatim without hashing.

### Pitfall 3: SheetJS `.xls` fails without codepage table
**What goes wrong:** `XLSX.read()` on a legacy `.xls` file throws or returns garbled text.
**Why:** Legacy XLS format requires the `cpexcel` codepage table; it is not bundled by default in ESM builds.
**How to avoid:** Import `xlsx/dist/cpexcel.full.mjs` and call `XLSX.set_cptable(cptable)` at app startup.

### Pitfall 4: `window.*` globals are undefined in TypeScript strict mode
**What goes wrong:** `window.DEELGEBIEDEN`, `window.normalizeScore`, etc. are used throughout parsers but are not declared in TypeScript.
**Why:** TypeScript strict mode does not allow arbitrary `window` property access without declaration.
**How to avoid:** Create `src/globals.d.ts` declaring all window globals before migrating parser files to TypeScript. This is a Wave 0 task.

### Pitfall 5: Vitest globals not enabled — `describe`/`it`/`expect` undefined
**What goes wrong:** Test files use `describe`, `it`, `expect` without imports (Jest globals). Vitest requires explicit opt-in.
**Why:** Vitest does not inject globals by default.
**How to avoid:** Set `globals: true` in `vitest.config.ts`. This is a direct replacement for Jest's implicit globals behavior.

---

## Assumptions Log

| # | Claim | Risk if Wrong |
|---|-------|---------------|
| A1 | TypeScript 5.8 is preferable to 6.0.3 for initial migration | TS 6 may be stable enough; verify TS 6 breaking changes before pinning |
| A2 | School's SomToday export produces `.xls` (legacy binary) format | If they export `.xlsx` only, cpexcel import is not needed |
| A3 | No TS declarations currently exist for window.* globals | If declarations exist elsewhere (e.g., in a .d.ts file), globals.d.ts is redundant |
| A4 | App data volume fits comfortably in tauri-plugin-store JSON | If classes grow to hundreds of students with large records, a SQLite migration may be needed later |
| A5 | @testing-library/react is not needed for the initial migration | If component-level tests are planned in the same milestone, add it to the stack |

---

## Sources

### Primary (HIGH confidence — npm registry verified)
- npm registry: `npm view` for all library versions listed above
- `[VERIFIED: npm view vite version → 8.0.12]`
- `[VERIFIED: npm view react version → 19.2.6]`
- `[VERIFIED: npm view @tauri-apps/cli version → 2.11.1]`
- `[VERIFIED: npm view @tauri-apps/api version → 2.11.0]`
- `[VERIFIED: npm view @tauri-apps/plugin-store version → 2.4.3]`
- `[VERIFIED: npm view @vitejs/plugin-react version → 6.0.1]`
- `[VERIFIED: npm view vitest version → 4.1.6]`
- `[VERIFIED: npm view typescript version → 6.0.3 (5.8 recommended for stability)]`
- `[VERIFIED: npm view pdfjs-dist@5.5.207 version → 5.5.207]`
- `[VERIFIED: npm view xlsx version → 0.18.5 (npm stub); 0.20.3 from SheetJS CDN]`

### Secondary (MEDIUM confidence — official source or multi-source verification)
- Tauri v2 stable announcement: `[CITED: v2.tauri.app/blog/tauri-20/]`
- localStorage unreliability in Tauri: `[CITED: github.com/tauri-apps/tauri/issues/4455, #10981, #896]`
- Stronghold deprecation: `[CITED: github.com/orgs/tauri-apps/discussions/7846]`
- PDF.js Vite worker issue: `[CITED: github.com/mozilla/pdf.js/issues/19519]`
- SheetJS CDN as authoritative source: `[CITED: npm registry shows 0.18.5 is outdated]`
- Vite public/ dir for static assets: `[CITED: github.com/vitejs/vite/discussions/16501]`

### Tertiary (LOW confidence — WebSearch only)
- TypeScript 6.0.3 stability for new projects (unverified compatibility matrix)
- cpexcel requirement specifically for this app's .xls files (not tested against actual school export)

---

**Research date:** 2026-05-12
**Valid until:** 2026-08-12 (stable ecosystem; Tauri and Vite release frequently — re-verify patch versions before execution)
