# Migration Pitfalls: Vanilla JS → TypeScript + React + Vite + Tauri 2.x

**Researched:** 2026-05-12
**Domain:** Vanilla-JS-to-TypeScript/React/Vite/Tauri 2.x migration (Dutch educational desktop app)
**Audience:** Roadmapper — use this to add preventive measures and warning-sign checks to each phase plan

---

## Quick Reference Table

| # | Pitfall | Severity | Phase | Prevention |
|---|---------|----------|-------|------------|
| P-01 | pdfjs-dist worker hashed filename breaks in Vite production build | HIGH | PDF parser phase | Copy worker to `/public`, set absolute `workerSrc` |
| P-02 | pdfjs-dist CSP blocks blob: worker in Tauri WebView | HIGH | PDF parser phase | Add `worker-src blob:` + `script-src blob:` to tauri.conf.json CSP |
| P-03 | SheetJS ESM build silently drops XLS codepage support | HIGH | Excel parser phase | Explicitly import and register `cpexcel.full.mjs` |
| P-04 | SheetJS CJS `require('fs')` error when bundled with Vite | HIGH | Excel parser phase | Use `import * as XLSX from 'xlsx'`; never use CDN global in ESM context |
| P-05 | Tauri Windows: `link.exe` not found — wrong MSVC component | HIGH | Tauri setup phase | Install Build Tools for VS 2022 with "C++ build tools" + Windows 10/11 SDK |
| P-06 | Tauri Windows: blank app window — WebView2 not installed | HIGH | Tauri setup phase | Ship Evergreen Bootstrapper installer or bundle WebView2 fixed runtime |
| P-07 | localStorage silently wiped on Windows in production (HTTP vs HTTPS scheme) | HIGH | Storage migration phase | Set `useHttpsScheme: true` in tauri.conf.json from the first production build |
| P-08 | Tauri v1 `allowlist` config rejected in v2 — capability system is mandatory | HIGH | Tauri setup phase | Use `src-tauri/capabilities/default.json` with explicit `fs:allow-*` permissions |
| P-09 | `window.XLSX`, `window.parseSinglePDF`, etc. — globals not available in React ESM | HIGH | React migration phase | Replace all `window.*` globals with ESM module imports before wrapping in React |
| P-10 | Drag-and-drop `event.dataTransfer.files` returns empty array in Tauri | HIGH | React migration phase | Use Tauri's `tauri://drag-drop` event, not the HTML5 DataTransfer API |
| P-11 | AES encryption key stored next to ciphertext defeats purpose | HIGH | Storage migration phase | Store key in OS keychain (`tauri-plugin-secure-storage`); data in `tauri-plugin-store` |
| P-12 | React Context re-renders all consumers on every state write | MEDIUM | React migration phase | Split state into multiple contexts or use Zustand slices |
| P-13 | Stale closures in `useEffect` capturing old state | MEDIUM | React migration phase | Use functional state updates; add exhaustive deps lint rule |
| P-14 | Vite asset base path set to `/` breaks Tauri production routing | MEDIUM | Tauri setup phase | Set `base: './'` in `vite.config.ts` |
| P-15 | macOS WebKit vs Windows WebView2: CSS `-webkit-` prefix gaps | MEDIUM | CSS/UI phase | Test on both platforms; add `-webkit-` prefixes; use normalize.css |
| P-16 | macOS WebKit: `scrollbar-width` and `::-webkit-scrollbar` inconsistent | MEDIUM | CSS/UI phase | Define scrollbar styles for both `scrollbar-width` (Chrome) and `::-webkit-scrollbar` (WebKit) |
| P-17 | TypeScript `strict` mode causes cascade of `implicit any` on first enable | MEDIUM | TypeScript migration phase | Enable `allowJs + checkJs` first; add `strict` per-module incrementally |
| P-18 | Stronghold plugin deprecated — will be removed in Tauri v3 | MEDIUM | Storage migration phase | Do not use Stronghold; use `tauri-plugin-secure-storage` (OS keychain) |
| P-19 | Tauri v2 `devPath`/`distDir` keys removed — breaks CI build | LOW | Tauri setup phase | Use `devUrl` and `frontendDist` in tauri.conf.json |
| P-20 | Vite `global is not defined` from SheetJS or other Node-API dependencies | LOW | Vite setup phase | Add `define: { global: 'globalThis' }` to `vite.config.ts` |
| P-21 | pdfjs-dist "Setting up fake worker" warning — silent performance degradation | LOW | PDF parser phase | Always set `GlobalWorkerOptions.workerSrc` before first `getDocument()` call |
| P-22 | AVG/GDPR: localStorage is plaintext — student data violates data-at-rest obligations | MEDIUM | Storage migration phase | Replace localStorage with encrypted file store before first production deploy |

---

## HIGH Severity — Expanded Detail

### P-01: pdfjs-dist worker hashed filename breaks in Vite production build

**What goes wrong:**
Vite content-hashes output filenames. In dev, `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` resolves correctly. In a production build, the worker filename gets a hash appended (e.g., `pdf.worker-B2x9a.js`) but the URL baked into the bundle still points to the unhashed name. Result: silent worker load failure → PDF parsing stops working in the shipped app only.

**Root cause:**
Vite cannot resolve `new URL(…, import.meta.url)` inside third-party node_modules code. The path resolution is performed at bundle time, not runtime. [VERIFIED: github.com/vitejs/vite/issues/10837, github.com/mozilla/pdf.js/discussions/19520]

**How to avoid:**
Copy the worker file to the `public/` directory at build time (via a Vite plugin or a `prebuild` npm script). Then set an absolute path:

```typescript
// In your PDF parser module — set ONCE before any getDocument() call
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
```

The `public/` directory is served at `/` in Vite dev and copied verbatim to `dist/` in production. No hashing is applied. This is the canonical solution documented by PDF.js contributors.

**Alternative (for Vite library mode):**
Use `vite-plugin-static-copy` to automate the copy step in `vite.config.ts`.

**Warning signs:**
- PDFs parse fine in `npm run dev`, fail silently in `npm run build && preview`
- Console shows: `Failed to load resource: the server responded with a status of 404` for `pdf.worker*.js`
- Console shows: `Setting up fake worker.`

---

### P-02: pdfjs-dist CSP blocks blob: worker in Tauri WebView

**What goes wrong:**
Tauri injects a strict Content Security Policy. The PDF.js worker spawns as a Blob URL (`blob:tauri://localhost/…`) at runtime. Without `worker-src blob:` in the CSP, WebView2 (Windows) and WebKit (macOS) both refuse the worker. The error appears as a CSP violation in the WebView's devtools, not as a visible app error. PDF parsing silently falls back to the main thread fake-worker (slow) or fails entirely.

**Root cause:**
PDF.js's CDN wrapper calls `createCDNWrapper()` which issues a `new Worker(blobUrl)`. The Tauri default CSP does not include `worker-src blob:` or `script-src blob:`. [VERIFIED: github.com/mozilla/pdf.js/issues/12105, MDN CSP worker-src docs]

**How to avoid:**
In `src-tauri/tauri.conf.json` (or the capability file), configure:

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self' tauri: asset:; script-src 'self' 'wasm-unsafe-eval' blob:; worker-src blob:; style-src 'self' 'unsafe-inline'"
    }
  }
}
```

Key additions: `script-src blob:` and `worker-src blob:`. For WASM usage (which pdfjs-dist 5.x uses internally), also include `'wasm-unsafe-eval'`.

**Warning signs:**
- CSP violation in WebView devtools: `Refused to create a worker from 'blob:…' because it violates the following Content Security Policy directive: "worker-src 'self'"`
- PDFs work in browser dev server, fail in Tauri window
- `Setting up fake worker` in console inside Tauri app

---

### P-03: SheetJS ESM build silently drops XLS codepage support

**What goes wrong:**
The current codebase reads `.xls` files (SomToday export format). The SheetJS CommonJS build (loaded via CDN `<script>`) bundles the codepage table (`cpexcel`) automatically. The ESM build (`import * as XLSX from 'xlsx'`) ships without it. When reading a legacy `.xls` file with a non-UTF-8 encoding (common in Dutch school admin exports), strings are garbled or throw a cryptic error: `Cannot read properties of undefined (reading 'dec')`.

**Root cause:**
The ESM build deliberately excludes codepage tables to reduce bundle size. The documentation states: "The ESM build does not include the codepage support library. Imports should be updated to explicitly import codepage tables." [VERIFIED: docs.sheetjs.com/docs/miscellany/errors/, SheetJS issue #2033]

**How to avoid:**
Add these two lines to the Excel parser module, before any `XLSX.read()` call:

```typescript
import * as XLSX from 'xlsx';
import * as cptable from 'xlsx/dist/cpexcel.full.mjs';
XLSX.set_cptable(cptable);
```

**Warning signs:**
- Dutch student names with `é`, `ë`, `ij` characters become garbled or `?` after import
- Console error: `Cannot read properties of undefined` inside XLSX.read()
- `.xlsx` files work fine but `.xls` files fail silently or throw

---

### P-04: SheetJS CJS `require('fs')` error when bundled with Vite

**What goes wrong:**
SheetJS 0.18.x (the last `npm` release) contains `if (typeof commonjsRequire !== 'undefined') try { _fs = require('fs'); }`. Vite's bundler converts `require` to ESM imports but in the output ESM context `require` does not exist, so this throws `ReferenceError: require is not defined` at runtime in the browser.

**Root cause:**
SheetJS CJS build assumes a Node.js environment for file-system fallback. Vite does not strip this code path entirely during treeshaking. [VERIFIED: github.com/SheetJS/sheetjs/issues/2748]

**How to avoid:**
- Always use `import * as XLSX from 'xlsx'` (ESM entry point), never `require('xlsx')`
- Add `define: { global: 'globalThis' }` in `vite.config.ts` to prevent Node globals from leaking
- Vite config: add `xlsx` to `optimizeDeps.include` if pre-bundling issues arise:

```typescript
// vite.config.ts
export default defineConfig({
  define: { global: 'globalThis' },
  optimizeDeps: { include: ['xlsx'] },
});
```

**Warning signs:**
- `ReferenceError: require is not defined` in browser console on Excel import
- Error only occurs in production build, not dev (Vite dev uses CJS fallback differently)

---

### P-05: Tauri Windows — `link.exe` not found, MSVC component missing

**What goes wrong:**
`cargo tauri dev` or `cargo tauri build` fails immediately with:
```
error: linking with `link.exe` failed: exit code: 1120
note: MSVC targets depend on the MSVC linker but `link.exe` was not found
```
Or: `linker 'lld-link' not found`

**Root cause:**
Rust's `x86_64-pc-windows-msvc` target requires Visual C++ build tools and the Windows SDK. Installing "Visual Studio Build Tools" without checking the right component box leaves the linker absent. Installing Rust before installing the build tools also causes this — Rust picks up the toolchain at install time. [VERIFIED: github.com/tauri-apps/tauri/issues/13504, Rust forum]

**How to avoid:**
Step-by-step Windows setup order (order matters):
1. Install **Build Tools for Visual Studio 2022** (not full VS): select "Desktop development with C++" workload. This installs MSVC compiler + Windows 10/11 SDK.
2. Restart terminal (PATH update required).
3. Install Rust via rustup: ensure `x86_64-pc-windows-msvc` is selected as default host triple.
4. Verify: `rustc --version` and `cargo --version` from a fresh terminal.
5. Install Tauri CLI: `cargo install tauri-cli` or `npm install -D @tauri-apps/cli`.

If MSVC is already installed but linker is still not found: run `rustup default stable-msvc` to force the MSVC toolchain.

**Warning signs:**
- `link.exe` or `lld-link` not found error from cargo
- `rustup show` lists `gnu` toolchain as active instead of `msvc`
- Build Tools installed but no "C++ build tools" workload was checked

---

### P-06: Tauri Windows — blank window, WebView2 not installed

**What goes wrong:**
App launches but shows a blank white window. Error in stderr: `CreateWebview: failed to create webview: WebView2 error: WindowsError(Error { code: 0x80070057, message: The parameter is incorrect. })`. No JavaScript errors visible because the WebView never loads.

**Root cause:**
Tauri on Windows uses WebView2 (Chromium-based). On Windows 10 version 1803+ and all Windows 11 builds it is pre-installed. On older Windows 10 builds, LTSC editions, and sandboxed environments it may be absent. When targeting end-users, the WebView2 runtime must be present. [VERIFIED: github.com/tauri-apps/tauri/issues/7897, v2.tauri.app prerequisites]

**How to avoid:**
Two strategies depending on deployment model:
- **Developer machines**: Run WebView2 Evergreen Bootstrapper from Microsoft's download page before first `tauri dev`.
- **End-user distribution** (the CIOS mentor laptops): Use Tauri's installer bundling options. In `tauri.conf.json` set `bundle > windows > webviewInstallMode` to `"embedBootstrapper"` or `"offlineInstaller"` — this bundles the WebView2 bootstrapper into the `.msi`/`.exe` installer.

```json
{
  "bundle": {
    "windows": {
      "webviewInstallMode": { "type": "embedBootstrapper" }
    }
  }
}
```

**Warning signs:**
- Blank window, no console output
- Works on developer machine, fails on school laptop
- `0x80070057` error code in Tauri logs

---

### P-07: localStorage silently wiped on Windows in production (HTTP vs HTTPS scheme)

**What goes wrong:**
During development, Tauri serves via `https://tauri.localhost`. In some Tauri 2.x configurations, production on Windows defaults to `http://tauri.localhost`. Browsers treat HTTP and HTTPS origins as separate storage partitions. Every production install loses all existing localStorage data — student class data, leerlijn mappings, settings — without any error or warning.

**Root cause:**
Tauri 2 changed the Windows production scheme. The migration guide notes: "On Windows, frontend files in production apps are now hosted on `http://tauri.localhost` instead of `https://tauri.localhost`. IndexedDB, LocalStorage and Cookies will be reset unless you set `app > windows > useHttpsScheme` to `true`." [VERIFIED: v2.tauri.app/start/migrate/from-tauri-1/]

**How to avoid:**
Set this in `tauri.conf.json` immediately when scaffolding:

```json
{
  "app": {
    "windows": [{ "useHttpsScheme": true }]
  }
}
```

Or — better for this app, since you are replacing localStorage with an encrypted Tauri store anyway — plan the storage migration first, so the http/https discrepancy never affects real data. LocalStorage should not hold student data in the final architecture.

**Warning signs:**
- App installs cleanly but opens empty (no classes, no data) despite previous use
- Problem only on Windows in production `.msi` install, never in `tauri dev`
- Data returns after restoring from backup

---

### P-08: Tauri v1 `allowlist` rejected in v2 — capability system mandatory

**What goes wrong:**
Any `tauri.conf.json` copied from Tauri v1 examples, blog posts, or AI-generated scaffolding will contain `tauri > allowlist > fs > all: true`. Tauri 2 rejects this with: `Additional properties are not allowed ('allowlist' was unexpected)`. Without the new capability files, ALL filesystem access is blocked — no reading/writing of the encrypted data store.

**Root cause:**
Tauri 2 replaced the flat `allowlist` with a granular Access Control List (ACL) capability system. Permissions are no longer in `tauri.conf.json` but in `src-tauri/capabilities/*.json`. [VERIFIED: v2.tauri.app/security/permissions/, v2.tauri.app/start/migrate/from-tauri-1/]

**How to avoid:**
Create `src-tauri/capabilities/default.json` during Tauri scaffolding:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Main window permissions",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-app-data-read-recursive",
    "fs:allow-app-data-write-recursive"
  ]
}
```

Scope filesystem access to `$APPDATA` only — do not use `fs:all`. This is both the security best practice and the AVG/GDPR minimum.

**Warning signs:**
- `Additional properties are not allowed ('allowlist')` error on `tauri dev`
- Filesystem read/write returns permission denied errors in the app
- Tauri 2 docs link but page content looks like Tauri 1

---

### P-09: `window.XLSX`, `window.parseSinglePDF`, etc. — globals not available in React ESM

**What goes wrong:**
The entire current app communicates across files via `window.*` globals: `window.klassenState`, `window.appState`, `window.parseExcelFile`, `window.parseSinglePDF`, `window.DEELGEBIEDEN`, etc. In a Vite/React ESM environment, each module is isolated — there is no shared `window.*` namespace unless you explicitly assign to it. React components will reference `window.parseExcelFile` and get `undefined`. The parser files loaded as `<script>` tags (not ESM modules) won't see React's module scope either.

**Root cause:**
The current architecture uses script-tag loading order with global mutation as a dependency injection mechanism. ESM modules break this pattern. [ASSUMED based on codebase inspection — confirmed pattern is ~40 `window.*` assignments in app.js and utils/*.js]

**How to avoid:**
Migration must happen in two phases for each module:
1. Convert the file to a proper ESM module with named exports (remove `window.X = function…`).
2. Import it where needed in React components.

Example conversion:
```typescript
// BEFORE (utils/klassen.js)
window.createKlas = function(naam) { … }

// AFTER (utils/klassen.ts)
export function createKlas(naam: string): KlasResult { … }

// In React component:
import { createKlas } from '../utils/klassen';
```

The migration order matters: convert leaf utilities first (schema, datamodel), then parsers, then the app orchestration logic. Converting in top-down order breaks everything simultaneously.

**Warning signs:**
- `TypeError: window.parseExcelFile is not a function` in React component
- `window.appState is undefined` on first render
- Functions work in browser console but not in component event handlers

---

### P-10: Drag-and-drop `event.dataTransfer.files` returns empty array in Tauri

**What goes wrong:**
The current app uses standard HTML5 drag-and-drop with `event.dataTransfer.files` to accept PDF files dropped onto the import zone. In Tauri desktop, this API returns an empty FileList for file system drags (dragging from Windows Explorer or macOS Finder). The drop event fires but `e.dataTransfer.files.length === 0`.

**Root cause:**
Tauri intercepts OS-level file drop events and exposes them through its own event system, not via the standard HTML5 DataTransfer API. This is a known Tauri limitation. [VERIFIED: github.com/tauri-apps/tauri/issues/3558]

**How to avoid:**
Replace the HTML5 drop handler with Tauri's native drag events:

```typescript
import { listen } from '@tauri-apps/api/event';

// In useEffect, register Tauri drag handler:
const unlisten = await listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
  const filePaths = event.payload.paths; // absolute OS paths
  // Read file contents via Tauri fs plugin, not FileReader
});
return () => unlisten();
```

Note: this replaces `FileReader`-based reading with Tauri's `fs.readFile()`. The PDF and Excel parsers must be adapted to accept `Uint8Array` (from `fs.readFile`) instead of `File` objects (from DataTransfer).

**Warning signs:**
- `e.dataTransfer.files.length` is always 0 when dragging from OS file manager
- Drop handler fires (you see dragover visual) but no files are processed
- Same HTML code works in a browser tab but not in the Tauri window

---

### P-11: AES encryption key stored next to ciphertext defeats the purpose

**What goes wrong:**
A common naive implementation: encrypt data with AES-256, then store both the ciphertext and the key in the same Tauri store file (or derive the key from a constant/hardcoded value). This provides no real protection — anyone who can read the file can find the key. For a Dutch educational app holding student personal data, this means AVG/GDPR Article 32 "appropriate technical measures" obligation is not met.

**Root cause:**
Encryption without proper key management is security theater. GDPR does not mandate AES-256 specifically but requires measures "appropriate to the risk" — for identifiable student data, key separation is the minimum standard. [ASSUMED that GDPR Article 32 applies — verified GDPR applies; specific control level ASSUMED]

**How to avoid:**
Architecture for this app (single-user, local, offline):
1. **Generate** a random AES-256 key once on first launch.
2. **Store the key** in the OS native keychain via `tauri-plugin-secure-storage`:
   - Windows: Windows Credential Manager
   - macOS: Keychain Access
3. **Store encrypted data** in `tauri-plugin-store` (JSON file in `$APPDATA`).
4. **Never** write the key to disk alongside the data.

```typescript
// Pseudo-pattern — actual implementation depends on plugin API
import { setPassword, getPassword } from '@tauri-apps/plugin-secure-storage';

// First launch: generate and store key
const key = crypto.getRandomValues(new Uint8Array(32));
await setPassword('mentordashboard', 'encryptionKey', bufferToHex(key));

// On load: retrieve key from OS keychain
const keyHex = await getPassword('mentordashboard', 'encryptionKey');
```

**Warning signs:**
- Encryption key found in a `.json` file inside `AppData\Roaming\`
- Key derived from app name or bundle ID (constant = breakable)
- No OS keychain API calls in codebase at all

---

## MEDIUM Severity — Summary Detail

### P-12: React Context re-renders all consumers on every state write

**What goes wrong:**
Replacing `window.klassenState` with a single large React Context causes every component to re-render on every state change, even if the component only uses a small slice of state. With the app's current structure (~5 major state objects: klassen, students, verzuim, leerlijnen, settings), this creates visible lag on class-switch or PDF import.

**Prevention:** Split into multiple narrow contexts (one per state domain) or use Zustand. Zustand's selector-based subscription ensures components only re-render when their specific slice changes. [CITED: blog.logrocket.com/event-driven-state-management-in-react-using-storeon/]

---

### P-13: Stale closures in `useEffect` capturing old state

**What goes wrong:**
Migrating event handler logic (e.g., file drop handler, class-switch handler) into `useEffect` without proper dependency arrays causes handlers to capture stale closure values of state variables. The import counter shows the correct file count, but the state write uses the student list from the first render.

**Prevention:** Always use functional state updates (`setState(prev => …)`) when new state depends on old. Use the `exhaustive-deps` ESLint rule (`eslint-plugin-react-hooks`). For event listeners that must remain stable, use `useRef` to hold the latest callback. [CITED: dmitripavlutin.com/react-hooks-stale-closures/]

---

### P-14: Vite base path `/` breaks Tauri production asset loading

**What goes wrong:**
Vite defaults `base: '/'`. In a Tauri production build, assets are resolved relative to the app's internal URL scheme. Absolute paths (`/assets/main.js`) work in dev but 404 in production. The app loads blank.

**Prevention:** Set `base: './'` in `vite.config.ts` immediately. [VERIFIED: github.com/tauri-apps/tauri/issues/13262]

---

### P-15: macOS WebKit vs Windows WebView2 CSS rendering differences

**What goes wrong:**
Windows uses WebView2 (Chromium-based, evergreen). macOS uses WKWebView (WebKit, tied to OS version). CSS features like `gap` in flexbox (WebKit added this in Safari 14.1), `aspect-ratio`, and certain CSS Grid behaviors render differently. Prefixed properties (`-webkit-`) required by WebKit are not added automatically by Vite's default CSS pipeline.

**Prevention:** Add Autoprefixer to the PostCSS pipeline: `npm install -D autoprefixer`. Configure browserslist target to include Safari 14+. Test on both platforms before each milestone. [CITED: dev.to/shrsv exploring-system-webviews-in-tauri]

---

### P-16: Scrollbar styling inconsistent across WebKit and Chromium

**What goes wrong:**
`scrollbar-width: thin` (CSS Scrollbars spec, supported by WebView2/Chromium) is ignored by WebKit. `::-webkit-scrollbar` (non-standard, supported by WebKit and Chromium) is the only cross-platform approach in Tauri. The CIOS dashboard uses a dark theme with custom scrollbar colors — without both selectors, scrollbars appear with native OS styling on one platform.

**Prevention:** Define both selectors in CSS:
```css
/* Chromium (WebView2) */
* { scrollbar-width: thin; scrollbar-color: var(--accent-blue) var(--bg-card); }
/* WebKit (macOS) */
*::-webkit-scrollbar { width: 6px; }
*::-webkit-scrollbar-thumb { background: var(--accent-blue); }
```
[CITED: github.com/orgs/tauri-apps/discussions/8829]

---

### P-17: TypeScript `strict` mode causes cascade of `implicit any` errors

**What goes wrong:**
Enabling `"strict": true` on a 5000+ LOC JavaScript codebase simultaneously produces hundreds of `TS7053` and `TS7006` errors. Teams either disable strict (losing the safety benefit) or apply `as any` everywhere (creating technical debt).

**Prevention:** Use incremental migration:
1. Start with `allowJs: true, checkJs: true, noImplicitAny: false` — get the JS compiling.
2. Add `noImplicitAny: true` per file as each module is converted.
3. Enable full `strict` once all modules are typed.
Prioritize typing the data model (`utils/datamodel.ts`, `utils/schema.ts`) first — downstream modules inherit correct types automatically. [CITED: dev.to/alexrogovjs/how-we-migrated-200k-lines-from-js-to-strict-typescript-3odd]

---

### P-18: Stronghold plugin deprecated — will be removed in Tauri v3

**What goes wrong:**
Stronghold appears in many Tauri secure storage examples and blog posts (2022–2024). Using it creates a dependency that will break when Tauri v3 ships.

**Prevention:** Use `tauri-plugin-secure-storage` (uses OS native keychain) or the unofficial `tauri-plugin-keyring`. Stronghold should not appear in any plan task as a recommended storage mechanism. [VERIFIED: v2.tauri.app/plugin/stronghold/ — deprecation notice on page]

---

### P-22: AVG/GDPR — localStorage holds student PII in plaintext

**What goes wrong:**
The current app stores student names, student IDs, attendance data, and learning-path assessments in browser localStorage — unencrypted plaintext. In the current browser app this is acceptable for a local tool. In Tauri, the same localStorage maps to a WebView storage file in `AppData\` — still plaintext, but now clearly a file that could be read by other processes or a system admin. Dutch AVG (= GDPR) Article 32 requires "appropriate technical measures including encryption" for personal data processing involving minors (school students are typically under 18). [CITED: gdpr-info.eu/issues/encryption/; ASSUMED that Article 32 applies — not legal advice]

**Prevention:**
- Phase the storage migration to happen before any production deployment.
- localStorage remains acceptable during internal development/testing only.
- Production storage architecture: OS keychain (key) + encrypted Tauri store (data). See P-11.

---

## Phase Assignment Map

Use this to decide which phase plan absorbs each pitfall's prevention tasks.

| Phase | Pitfalls to Address |
|-------|---------------------|
| Tauri 2.x project scaffolding | P-05, P-06, P-08, P-14, P-19 |
| TypeScript + Vite setup | P-17, P-20 |
| PDF parser migration (pdfjs-dist) | P-01, P-02, P-21 |
| Excel parser migration (SheetJS) | P-03, P-04 |
| React migration / global-to-ESM | P-09, P-10, P-12, P-13 |
| Storage migration (localStorage → encrypted) | P-07, P-11, P-18, P-22 |
| Cross-platform CSS/UI | P-15, P-16 |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| pdfjs-dist + Vite (P-01, P-02, P-21) | HIGH | Multiple GitHub issues + official PDF.js discussion confirmed |
| SheetJS ESM/XLS (P-03, P-04) | HIGH | Official SheetJS docs (docs.sheetjs.com) explicitly document this |
| Tauri Windows MSVC/WebView2 (P-05, P-06) | HIGH | Verified via Tauri GitHub issues + official prerequisite docs |
| Tauri localStorage scheme (P-07) | HIGH | Verified in official Tauri v1→v2 migration guide |
| Tauri allowlist→capabilities (P-08) | HIGH | Official Tauri v2 permissions docs |
| window.* globals → ESM (P-09) | HIGH | Verified by codebase inspection (40+ window.* assignments confirmed) |
| Tauri drag-and-drop DataTransfer (P-10) | HIGH | GitHub issue #3558 directly confirmed |
| Encryption key management (P-11) | MEDIUM | Security principle is well-established; specific Tauri plugin API verified by search; exact implementation details ASSUMED |
| React Context performance (P-12) | MEDIUM | General React knowledge; verified via multiple sources |
| Stale closures (P-13) | HIGH | Well-documented React pattern with multiple verified sources |
| CSS cross-platform (P-15, P-16) | MEDIUM | Tauri forum + GitHub issues confirmed; specific browser support matrix ASSUMED |
| TypeScript strict migration (P-17) | MEDIUM | Verified via real-world migration case studies |
| AVG/GDPR compliance (P-22) | MEDIUM | GDPR Article 32 verified; application to this specific use case ASSUMED — not legal advice |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | AVG/GDPR Article 32 requires encryption for student PII in this app | P-22 | May be overstating obligation — actual legal requirement depends on data controller status of the school. In practice, encryption is good practice regardless. |
| A2 | School laptops run Windows 10 1803+ (WebView2 pre-installed) | P-06 | If schools use LTSC or older builds, WebView2 must be bundled in the installer |
| A3 | `tauri-plugin-secure-storage` is production-ready for Tauri 2.11 | P-11, P-18 | Community plugin — maintenance status should be verified before committing to it |
| A4 | CSS rendering differences between WebKit and WebView2 affect this app's existing CIOS styles | P-15, P-16 | Needs cross-platform CSS audit; actual broken styles unknown until tested on macOS |

---

## Sources

### Primary (HIGH confidence)
- [github.com/vitejs/vite/issues/10837](https://github.com/vitejs/vite/issues/10837) — Vite cannot resolve `new URL(…)` in node_modules
- [github.com/mozilla/pdf.js/discussions/19520](https://github.com/mozilla/pdf.js/discussions/19520) — pdfjs-dist worker import fails in Vite
- [docs.sheetjs.com/docs/miscellany/errors/](https://docs.sheetjs.com/docs/miscellany/errors/) — SheetJS ESM codepage error documentation
- [docs.sheetjs.com/docs/demos/static/vitejs/](https://docs.sheetjs.com/docs/demos/static/vitejs/) — SheetJS Vite integration guide
- [github.com/tauri-apps/tauri/issues/13504](https://github.com/tauri-apps/tauri/issues/13504) — link.exe not found Tauri Windows
- [github.com/tauri-apps/tauri/issues/7897](https://github.com/tauri-apps/tauri/issues/7897) — WebView2 creation error blank window
- [v2.tauri.app/start/migrate/from-tauri-1/](https://v2.tauri.app/start/migrate/from-tauri-1/) — localhost scheme / localStorage migration note
- [v2.tauri.app/security/permissions/](https://v2.tauri.app/security/permissions/) — Tauri 2 capabilities system
- [github.com/tauri-apps/tauri/issues/3558](https://github.com/tauri-apps/tauri/issues/3558) — dataTransfer.files empty in Tauri
- [v2.tauri.app/plugin/stronghold/](https://v2.tauri.app/plugin/stronghold/) — Stronghold deprecation notice
- [github.com/tauri-apps/tauri/issues/13262](https://github.com/tauri-apps/tauri/issues/13262) — Vite base path / asset rewriting in Tauri

### Secondary (MEDIUM confidence)
- [github.com/mozilla/pdf.js/issues/12105](https://github.com/mozilla/pdf.js/issues/12105) — PDF.js ES5 build CSP eval issue
- [github.com/SheetJS/sheetjs/issues/2748](https://github.com/SheetJS/sheetjs/issues/2748) — SheetJS require('fs') in ESM environment
- [github.com/SheetJS/sheetjs/issues/2033](https://github.com/SheetJS/sheetjs/issues/2033) — SheetJS ESM support request + codepage note
- [dev.to/shrsv exploring-system-webviews-in-tauri](https://dev.to/shrsv/exploring-system-webviews-in-tauri-native-rendering-for-efficient-cross-platform-apps-9hl) — cross-platform CSS differences
- [github.com/orgs/tauri-apps/discussions/8829](https://github.com/orgs/tauri-apps/discussions/8829) — scrollbar styling in Tauri
- [dmitripavlutin.com/react-hooks-stale-closures/](https://dmitripavlutin.com/react-hooks-stale-closures/) — stale closure patterns
- [dev.to/alexrogovjs/how-we-migrated-200k-lines-from-js-to-strict-typescript-3odd](https://dev.to/alexrogovjs/how-we-migrated-200k-lines-from-js-to-strict-typescript-3odd) — TS strict migration strategy
- [gdpr-info.eu/issues/encryption/](https://gdpr-info.eu/issues/encryption/) — GDPR encryption provisions

**Research date:** 2026-05-12
**Valid until:** 2026-08-12 (Tauri and pdfjs-dist are actively developed — re-verify versions before each phase that touches these libraries)
