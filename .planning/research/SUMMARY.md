# Research Summary — v2.0 Stack Modernisering

**Project:** Mentordashboard CIOS — v2.0 Stack Modernisering
**Domain:** Vanilla JS desktop migration → TypeScript + React 19 + Vite + Tauri 2
**Researched:** 2026-05-12
**Confidence:** HIGH (stack versions npm-verified; Tauri patterns docs-verified)

---

## 1. Stack Additions

New additions only — pdfjs-dist and SheetJS are already vendored.

| Library | Version | Role |
|---------|---------|------|
| `@tauri-apps/cli` | 2.11.1 | Desktop build + bundler |
| `@tauri-apps/api` | 2.11.0 | JS ↔ Rust IPC bindings |
| `@tauri-apps/plugin-store` | 2.4.3 | Persistent KV store (replaces localStorage) |
| `@tauri-apps/plugin-fs` | 2.5.1 | Native file read after dialog/drag-drop |
| `@tauri-apps/plugin-dialog` | 2.7.1 | OS file picker (replaces `<input type=file>`) |
| `vite` | 8.0.12 | Bundler + dev server |
| `@vitejs/plugin-react` | 6.0.1 | JSX transform + HMR |
| `react` + `react-dom` | 19.2.6 | UI framework |
| `typescript` | ~5.8 | Type safety (skip 6.x for now) |
| `zustand` | 5.x | State management (replaces `window.*` globals) |
| `vitest` + `@vitest/coverage-v8` | 4.1.6 | Test runner (replaces Jest) |

**Do NOT add:** UI component library, Redux, React Router, Tailwind, Stronghold (deprecated), SQLite.

---

## 2. Build Order

| Wave | Focus | Rationale |
|------|-------|-----------|
| **Wave 0** | Scaffold + Vitest | Nothing else runs without toolchain; existing 8 tests must stay green |
| **Wave 1** | TypeScript port of all `utils/` + `parsers/` | Pure logic, zero UI risk; tests are the regression gate |
| **Wave 2** | Zustand store + encrypted persistence | All UI depends on the store; AVG compliance is a blocker, not stretch goal |
| **Wave 3** | File import (drag-drop + dialog) | Core data entry workflow; parsers must exist first |
| **Wave 4** | Klasoverzicht UI | Primary view; depends on store + import |
| **Wave 5** | Detail view + all sub-sections | Most complex render; depends on klasoverzicht nav |
| **Wave 6** | Polish + Tauri packaging | `.exe` / `.dmg` build; CSS cross-platform fixes |

---

## 3. Critical Decisions (Before Planning)

1. **Encryption UX:** OS keychain (seamless, recommended) vs PBKDF2 password prompt on every launch. Must decide before Wave 2.
2. **AES key location:** Key must live in OS keychain via `tauri-plugin-secure-storage`, never co-located with ciphertext in `plugin-store`. Stronghold is off-limits (deprecated for v3).
3. **Backup backward-compatibility:** Old backups use zip.js AES format. Decide now: keep zip.js as a read-only import, or document that old backups require a one-time migration.
4. **Rust experience:** The encryption layer requires ~60 lines of Rust (`aes-gcm` + PBKDF2 crates). If Rust is new to the developer, add 1–2 days buffer to Wave 2.
5. **TypeScript migration strategy:** Enforce `noImplicitAny` per-module incrementally; do not enable full `strict` on all files simultaneously — it produces hundreds of cascade errors on the first pass.

---

## 4. Watch Out For

| # | Pitfall | One-line prevention |
|---|---------|---------------------|
| P-01 | pdfjs worker 404 in production (Vite hashes filename) | Copy `pdf.worker.min.mjs` to `public/`; set `workerSrc = '/pdf.worker.min.mjs'` |
| P-02 | CSP blocks blob: worker in Tauri WebView | Add `script-src blob:` + `worker-src blob:` + `wasm-unsafe-eval` to `tauri.conf.json` CSP |
| P-03 | SheetJS ESM silently drops XLS codepage — garbled Dutch names | Import and register `xlsx/dist/cpexcel.full.mjs` before any `XLSX.read()` call |
| P-07 | localStorage wiped on Windows prod (HTTP vs HTTPS scheme) | Set `useHttpsScheme: true` in tauri.conf.json — or migrate to `plugin-store` before first prod deploy |
| P-09 | `window.XLSX`, `window.parseSinglePDF`, etc. are `undefined` in React ESM | Convert all `window.*` assignments to named ES module exports before touching React |

**Pre-flight blocker:** Rust toolchain (`rustc`) is NOT installed on this machine. Install via `winget install Rustlang.Rustup` + Visual Studio 2022 "C++ build tools" workload before Wave 0.

---

## 5. Open Questions

1. **Rust experience level?** Determines Wave 2 time estimate for the AES-GCM encryption command.
2. **OS keychain vs password prompt?** UX decision for encrypted store unlock — affects Wave 2 design.
3. **Old backup files?** Are there real user backups in the zip.js format that must remain importable after migration?
4. **SheetJS license?** CDN tarball (0.20.3) is used for `.xls` read — verify license compliance for school distribution before Wave 6.
5. **SomToday export format?** Assumed `.xls` (legacy binary). If it exports `.xlsx` only, the cpexcel import is unnecessary. Verify against a real file in Wave 1.

---

*Research completed: 2026-05-12*
*Ready for roadmap: yes*
