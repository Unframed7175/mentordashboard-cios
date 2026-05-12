# Features Research: Vanilla JS → React + Tauri Migration

**Researched:** 2026-05-12
**Domain:** TypeScript + React 19 + Vite 6 + Tauri v2 — desktop app migration
**Confidence:** HIGH (core stack verified via npm registry + Context7/official Tauri docs)

---

## Summary

The existing mentordashboard is a 2,315-line `app.js` + 1,365-line `index.html` monolith backed by utility modules (`utils/`, `parsers/`) that communicate through `window.*` globals. The entire data layer, rendering logic, and event wiring live in a single DOMContentLoaded block. Functionally, the app is complete and correct — the migration is a structural and compliance lift, not a feature addition.

A migration of this scope has a well-understood build order: scaffold and wire the Tauri shell first, port pure logic modules to TypeScript next (zero UI risk), decompose the rendering monolith into React components last. The hardest single problem is encrypted storage: `localStorage` must be replaced with an AES-256-protected persistent store before the app ships student data in the rebuilt form. Stronghold (the obvious Tauri answer) is officially scheduled for deprecation in v3; the viable alternative is a Zustand store with a custom AES-encrypted JSON storage backend backed by Tauri's `plugin-store` or direct `plugin-fs` writes.

The migration surface is moderate. The logic utilities (`prognosis.js`, `klassen.js`, `leerlijnen.js`, `aggregation.js`, `parsers/pdf.js`, `parsers/excel.js`) are already isolated and tested — they translate to TypeScript almost mechanically. The heavy lift is in `app.js` decomposition: 50+ functions, direct DOM mutation, `window.*` global coupling, and no component boundary. A feature-by-feature decomposition order (import flow → klasoverzicht → detail view → cross-cutting state) is lower risk than a big-bang rewrite.

**Primary recommendation:** Scaffold Tauri + Vite + React + TypeScript first, port logic modules second, decompose UI third. Treat encrypted storage as a Wave 1 blocker (AVG/GDPR compliance), not a stretch goal.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PDF/Excel file reading | Tauri Rust backend (IPC) | React frontend (drag-drop UX) | FileReader API works inside WebView but Tauri's `plugin-fs` + `onDragDropEvent` gives native file paths without browser sandbox restrictions |
| Student data persistence | Tauri backend (plugin-store / plugin-fs) | Zustand (in-memory) | localStorage is off-limits for AVG-compliant encrypted storage in a Tauri app |
| Encryption key management | Tauri backend (Rust AES + PBKDF2) | — | Key must never live in the WebView where JS can read it |
| Doorstroomprognose engine | Frontend (TypeScript module) | — | Pure computation, no OS access needed; keep it in TS for testability |
| PDF text extraction | Frontend (pdf.js / pdfium) | — | pdfium/pdf.js runs fine in WebView; no Rust rewrite needed |
| Excel parsing | Frontend (SheetJS) | — | Same — pure WebView, already working |
| Klasoverzicht UI | React component | — | Tile grid, RAG status, mini-verzuim-bar — pure render |
| Student detail view | React component | — | Multi-section render, event wiring through callbacks |
| Multi-class tabs + state | Zustand store | — | Cross-component shared state; currently a `window.klassenState` global |
| Dark mode | Zustand store + CSS tokens | — | One boolean in store, CSS custom properties do the visual work |
| Per-student deletion (AVG) | Zustand store action + Tauri store write | — | Delete from in-memory store then flush to encrypted file |
| Right-to-erasure audit trail | Out of scope (school FG responsibility) | — | App provides deletion UI; audit logging is institutional |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.0.13 | Type-safe JS | Required for multi-developer projects; superset of JS — incremental migration |
| React | 19.2.6 | UI component model | Largest ecosystem; lowest contributor onboarding cost |
| Vite | 6.0.12 | Build tool + dev server | Recommended by Tauri docs for SPA frameworks; native ESM |
| Tauri | 2.11.0 (API) / 2.11.1 (CLI) | Desktop wrapper + OS APIs | AVG posture: capability-based permissions, Rust backend, ~10 MB bundle |
| Zustand | 5.0.13 | Global state management | Recommended for apps of this size; replaces `window.*` globals |
| Vitest | 4.1.6 | Test runner | Vite-native; replaces Jest; same API surface |

[VERIFIED: npm registry — all versions confirmed 2026-05-12]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tauri-apps/plugin-fs | 2.5.1 | Native file read/write | Reading PDF/Excel bytes after dialog pick or drag-drop |
| @tauri-apps/plugin-dialog | 2.7.1 | System file picker + alerts | File open dialog (replaces `<input type="file">` for Tauri) |
| @tauri-apps/plugin-store | latest (2.x) | JSON persistence to disk | Encrypted app state storage (see Encryption section) |
| @tauri-apps/plugin-stronghold | 2.3.1 | Secret storage | DO NOT USE — scheduled for deprecation in Tauri v3 (see pitfalls) |
| SheetJS (xlsx) | 0.20.3 | Excel parsing | Already vendored; keep as-is, wrap in TypeScript types |
| pdfjs-dist / pdf.min.mjs | current (vendored) | PDF text extraction | Already vendored; keep as-is |

[VERIFIED: npm registry]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand | React Context + useReducer | Context causes full subtree re-renders on every state change; Zustand uses selector subscriptions. For this app (multiple tabs, student grids, live prognose) Zustand is the better fit. |
| Zustand | Redux Toolkit | Redux is 3-5x more boilerplate for equivalent functionality; overkill for a single-user desktop app |
| Tauri plugin-store (custom encrypted) | plugin-stronghold | Stronghold is deprecated-scheduled; avoid new adoption |
| Vitest | Jest | Jest requires extra jsdom config for Vite projects; Vitest is zero-config with Vite |

**Installation (new project):**
```bash
npm create tauri-app@latest -- --template react-ts
npm install zustand
npm install -D vitest @vitest/ui
cargo tauri add fs dialog store
```

[VERIFIED: Tauri v2 official docs — `cargo tauri add <plugin>` is the correct plugin install command]

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  User                                                   │
│   │ drag PDF/Excel                                      │
│   ▼                                                     │
│  React UI (WebView)                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │ ImportZone          KlasoverzichtPage          │    │
│  │  │ onDragDropEvent   │                         │    │
│  │  ▼                   ▼                         │    │
│  │ useImport()         KlasGrid → StudentTile     │    │
│  │  │                   │                         │    │
│  │  │         DetailView → PrognosePanel          │    │
│  │  │                   │                         │    │
│  │  └──────── useStore (Zustand) ─────────────────┘    │
│  │                      │                              │
│  │              useKlassen / useStudents               │
│  └────────────────────────────────────────────────┘    │
│             │ invoke() / readFile()                    │
│             ▼                                          │
│  Tauri IPC Bridge (Rust)                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ plugin-fs: readFile(path) → Uint8Array         │    │
│  │ plugin-dialog: open({filters:[pdf,xlsx]})      │    │
│  │ plugin-store: load/set/get/save (JSON on disk) │    │
│  │ custom-encrypt-cmd: AES-256 encrypt/decrypt    │    │
│  └────────────────────────────────────────────────┘    │
│             │                                          │
│             ▼                                          │
│  OS / Filesystem                                       │
│   AppData/mentordashboard/klassen.enc.json             │
│   AppData/mentordashboard/notities.enc.json            │
└─────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── components/
│   ├── import/
│   │   ├── ImportZone.tsx          # drag-drop + file-picker UI
│   │   └── ImportProgress.tsx      # progress bar during batch import
│   ├── klas/
│   │   ├── KlasTabStrip.tsx        # multi-class tabs
│   │   ├── KlasGrid.tsx            # tile grid container
│   │   └── StudentTile.tsx         # RAG tile + mini-verzuim-bar
│   ├── detail/
│   │   ├── DetailView.tsx          # master detail layout
│   │   ├── PrognosePanel.tsx       # doorstroomprognose display
│   │   ├── DeelgebiedenTable.tsx   # period comparison table
│   │   └── VerzuimSection.tsx      # attendance breakdown
│   └── shared/
│       ├── KpiStrip.tsx            # class-level KPI cards
│       ├── DarkModeToggle.tsx      # theme switch
│       └── SpiderChart.tsx         # radar chart
├── store/
│   ├── index.ts                    # root Zustand store
│   ├── klassen.slice.ts            # multi-class + active class
│   ├── students.slice.ts           # student array for active class
│   └── ui.slice.ts                 # view state, dark mode, selected student
├── services/
│   ├── storage.ts                  # encrypted read/write via Tauri IPC
│   ├── pdfImport.ts               # wraps parsers/pdf.js → TypeScript
│   └── excelImport.ts             # wraps parsers/excel.js → TypeScript
├── utils/
│   ├── prognosis.ts               # doorstroomprognose engine (TS port)
│   ├── klassen.ts                 # class CRUD (TS port, no window.*)
│   ├── schema.ts                  # DEELGEBIEDEN constants
│   ├── leerlijnen.ts              # leerlijn toewijzing
│   └── aggregation.ts             # modus-based deelgebied aggregation
├── types/
│   └── index.ts                   # Student, Klas, PrognosisResult, etc.
├── App.tsx                         # root router/layout
└── main.tsx                        # Tauri entry point
src-tauri/
├── src/
│   ├── main.rs                     # Tauri builder, plugin registration
│   └── commands.rs                 # custom IPC commands (encrypt/decrypt)
├── capabilities/
│   └── main.json                   # fs, dialog, store permissions
└── tauri.conf.json
```

### Pattern 1: Zustand Store with Encrypted Custom Storage

Replace `window.klassenState` + `localStorage` with a Zustand store that persists through a custom Tauri-backed encrypted storage adapter.

```typescript
// Source: https://github.com/pmndrs/zustand + Tauri plugin-store docs
// store/klassen.slice.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { load } from '@tauri-apps/plugin-store'

// Custom Tauri-backed storage that replaces localStorage
const tauriStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const store = await load('mentordashboard.json', { autoSave: false })
    return store.get<string>(name) ?? null
  },
  setItem: async (name: string, value: string) => {
    const store = await load('mentordashboard.json', { autoSave: false })
    await store.set(name, value)
    await store.save()
  },
  removeItem: async (name: string) => {
    const store = await load('mentordashboard.json', { autoSave: false })
    await store.delete(name)
    await store.save()
  },
}))

// Note: For AVG compliance, the JSON file written by plugin-store
// must be AES-256 encrypted at rest (see Encryption section).
```

[VERIFIED: Context7 — Zustand persist middleware + Tauri plugin-store docs]

### Pattern 2: Tauri File Drop for PDF/Excel Import

Replace `FileReader` API drag-drop with Tauri's native `onDragDropEvent` which provides file system paths that `plugin-fs` can then read as bytes.

```typescript
// Source: https://v2.tauri.app/reference/javascript/api/namespacewebview
// components/import/ImportZone.tsx

import { useEffect } from 'react'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { readFile } from '@tauri-apps/plugin-fs'

export function ImportZone({ onFiles }: { onFiles: (bufs: Uint8Array[]) => void }) {
  useEffect(() => {
    let unlisten: (() => void) | undefined

    getCurrentWebview().onDragDropEvent(async (event) => {
      if (event.payload.type === 'drop') {
        const buffers = await Promise.all(
          event.payload.paths.map(path => readFile(path))
        )
        onFiles(buffers)
      }
    }).then(fn => { unlisten = fn })

    return () => unlisten?.()
  }, [onFiles])

  // ... render drop zone UI
}
```

[VERIFIED: Context7 — Tauri v2 webview.onDragDropEvent + plugin-fs.readFile]

### Pattern 3: Per-Student Deletion (AVG Article 17)

The right-to-erasure requirement means the delete action must (a) remove the student from the in-memory Zustand store, (b) remove the student from the active klas's student array in the encrypted store, and (c) cascade-delete associated notities and actiepunten.

```typescript
// store/klassen.slice.ts

deleteStudent: (klasId: string, studentId: string) => set(state => {
  const klas = state.klassen[klasId]
  if (!klas) return state
  return {
    klassen: {
      ...state.klassen,
      [klasId]: {
        ...klas,
        students: klas.students.filter(s => s.id !== studentId),
      }
    }
  }
})
// After set(), the persist middleware flushes to encrypted storage automatically.
// Cascade: notities and actiepunten are stored under student.id keys —
// deleting the student record is sufficient if storage is keyed by studentId.
```

[ASSUMED — implementation pattern is idiomatic Zustand; no official Tauri/GDPR reference]

### Pattern 4: Tauri File Picker (alternative to drag-drop)

```typescript
// Source: https://v2.tauri.app/plugin/dialog
// components/import/ImportZone.tsx

import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'

async function pickAndRead() {
  const paths = await open({
    multiple: true,
    filters: [{ name: 'PDF / Excel', extensions: ['pdf', 'xls', 'xlsx'] }]
  })
  if (!paths) return []
  const pathArray = Array.isArray(paths) ? paths : [paths]
  return Promise.all(pathArray.map(p => readFile(p)))
}
```

[VERIFIED: Context7 — Tauri v2 plugin-dialog open + plugin-fs readFile]

### Anti-Patterns to Avoid

- **Using `plugin-stronghold` for new development:** Officially scheduled for deprecation in v3. Use a custom encrypted storage strategy instead (see Encryption section).
- **Storing the AES key alongside the data in `plugin-store`:** Violates AVG/IBP norm SM.10. Key must be derived from a user password (PBKDF2) or stored in OS keychain separately.
- **Re-using `window.*` globals in React components:** Kills component testability. All `window.klassenState`, `window.appState` etc. must move into the Zustand store.
- **Big-bang rewrite:** Attempt to run both the old and new app side-by-side during migration; the old `index.html + app.js` remains the reference until each feature is verified in React.
- **Putting the encryption key in React state or `localStorage`:** Key must never be accessible to the WebView renderer process. Use Rust IPC commands for encrypt/decrypt operations if key is sensitive.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Encrypted file persistence | Custom crypto + file write | Tauri plugin-store + Rust AES-256 custom command | Side-channel attacks, key management errors, IV reuse bugs |
| PDF text extraction | Custom PDF parser | Keep existing pdf.js (vendored) | Already correct, tested, handles MBO-specific layout |
| Excel/XLS parsing | Custom XLS reader | Keep SheetJS (vendored) | XLS binary format has ~200 edge cases |
| State persistence across tabs | Custom localStorage sync | Zustand `persist` middleware | Cache invalidation, partial writes, and dehydration bugs |
| Component re-render optimization | Custom shouldUpdate | Zustand selector subscriptions | Zustand's selector model is already optimal for this use case |
| Test runner + Vite integration | jest + babel-jest bridge | Vitest | babel-jest + Vite requires non-trivial config; Vitest is zero-config |

---

## Table Stakes vs. Differentiators vs. Defer

### TABLE STAKES — Must ship for the migration to be considered "done"

These are the deliverables without which the rebuilt app is either non-functional or non-compliant.

| # | Deliverable | Complexity | Reason It's Table Stakes |
|---|-------------|------------|--------------------------|
| TS-01 | Tauri v2 + Vite + React + TypeScript project scaffold | LOW | Nothing else builds without it |
| TS-02 | TypeScript ports of all utils (`prognosis`, `klassen`, `leerlijnen`, `schema`, `aggregation`) | MEDIUM | Pure logic, no UI — all existing tests must remain green |
| TS-03 | TypeScript ports of both parsers (`pdf.js`, `excel.js`) | MEDIUM | Parser accuracy is AVG-critical — must pass existing test suite |
| TS-04 | Zustand store replacing `window.klassenState` + `window.appState` | MEDIUM | Every React component depends on this |
| TS-05 | PDF drag-drop import via Tauri `onDragDropEvent` + `plugin-fs` | MEDIUM | Core user workflow — app is useless without import |
| TS-06 | Excel (.xls verzuim) import via Tauri file dialog + SheetJS | MEDIUM | Verzuim data depends on this; required for KPI strip |
| TS-07 | Klasoverzicht tile grid (RAG status, mini-verzuim-bar, aanwezigheidspercentage) | MEDIUM | Primary view mentors see every day |
| TS-08 | Student detail view (deelgebieden, prognose, periode vergelijking) | HIGH | Core feature — most complex render in the app |
| TS-09 | Multi-class tabs with per-class isolation | MEDIUM | Already built in v1.1; must work identically |
| TS-10 | Dark mode toggle (persisted) | LOW | Already built; CSS token system maps cleanly to Zustand |
| TS-11 | **AVG: AES-256 encrypted persistence replacing localStorage** | HIGH | AVG/IBP compliance blocker — plaintext localStorage is not acceptable |
| TS-12 | **AVG: Per-student deletion (artikel 17)** | MEDIUM | Compliance blocker; already documented as HOOG priority in questions.md |
| TS-13 | Existing test suite migrated to Vitest | LOW | Ensures no regressions during migration |
| TS-14 | Tauri capability permissions configured for fs + dialog + store | LOW | Without correct `capabilities/main.json`, fs APIs throw at runtime |

### DIFFERENTIATORS — Important, but migration is functional without them

These ship in the same milestone but can be sequenced after table stakes are verified.

| # | Deliverable | Complexity | Notes |
|---|-------------|------------|-------|
| D-01 | Period comparison view (fase 1 vs fase 2 side-by-side) | MEDIUM | Already working in vanilla; port is mechanical once detail view exists |
| D-02 | Spiderweb chart (SVG radar) | MEDIUM | Visual feature; pure render, no data logic |
| D-03 | KPI strip (class-level aggregates) | LOW | Depends on Zustand store being ready |
| D-04 | Leerlijn toewijzing UI (norm assignment per class) | LOW | Config UI — mostly form inputs |
| D-05 | Backup/restore modal | MEDIUM | JSON export/import; maps to `plugin-fs` save dialog |
| D-06 | Actiepunten (action points) per student | LOW | Already isolated in `utils/actiepunten.js` |
| D-07 | Notities (mentor notes) per student | LOW | Simple textarea + store write |
| D-08 | Stage + feedback sections in detail view | LOW | Pure render, no new logic |
| D-09 | CIOS huisstijl (cyaan/navy CSS tokens) | LOW | CSS variables — trivial once component tree exists |
| D-10 | Windows `.exe` installer + Mac `.dmg` build | LOW | `cargo tauri build` — zero custom code; needed for distribution |
| D-11 | Dataflow documentation (pre-DPIA input for school) | LOW | A markdown/PDF document, not code |

### DEFER — Out of scope for this migration milestone

These are valid future features but add scope that risks delaying the compliance lift.

| # | Deliverable | Defer Reason |
|---|-------------|--------------|
| DEF-01 | Print-to-PDF export | Already deferred to v2 in REQUIREMENTS.md |
| DEF-02 | Rekenen & Nederlands separate norm | Requires new normering definition — v2+ |
| DEF-03 | Cross-class comparison view | Multi-window or complex layout; v2+ |
| DEF-04 | Word/docx export | Out of scope per REQUIREMENTS.md |
| DEF-05 | Cloud sync / server storage | Privacy — explicitly out of scope |
| DEF-06 | Multi-mentor login | Explicitly out of scope |
| DEF-07 | Electron build target | Tauri is the decided wrapper; don't dual-target |
| DEF-08 | SQLCipher / SQLite database | Plugin-store with custom AES is sufficient for current data volume; SQLCipher adds Rust complexity without a demonstrable data-volume need |

---

## Encryption Strategy (AVG Compliance)

The seed file and questions.md both lock AES-256 as the encryption standard. The implementation approach is the main open question.

### Recommended Approach: Rust Custom IPC Command + plugin-store

**Why not plugin-stronghold:** Officially deprecated-scheduled for Tauri v3.
[VERIFIED: WebSearch cross-referencing Tauri plugin docs — deprecation confirmed]

**Why not Zustand `persist` with browser-side CryptoJS:** The AES key would live in the WebView JavaScript context, accessible to any script. IBP norm SM.10 / ISO 27001 A8.24 requires the key NOT to be co-located with the data.

**Recommended pattern (two-tier):**

```
Tier 1 — Key derivation (Rust command):
  User enters password on first launch →
  Rust PBKDF2 (100,000 iterations) derives 256-bit key →
  Key is held in Rust memory only, never sent to WebView

Tier 2 — Data encrypt/decrypt (Rust command):
  Zustand store serializes state to JSON →
  invoke('encrypt_store', { plaintext: json }) →
  Rust AES-256-GCM encrypts with in-memory key →
  Returns ciphertext → written to AppData via plugin-fs

  On load:
  invoke('decrypt_store') →
  Rust reads file, decrypts with in-memory key →
  Returns JSON → Zustand rehydrates
```

This keeps the key in Rust memory (outside WebView) and the ciphertext on disk (never plaintext). The Tauri capability model prevents WebView from calling arbitrary Rust functions — only the explicitly registered `encrypt_store` / `decrypt_store` commands are accessible.

**Complexity:** HIGH — requires writing ~60 lines of Rust (AES-GCM via the `aes-gcm` crate, PBKDF2 via `pbkdf2` crate). This is the hardest single task in the migration.

[ASSUMED — the two-tier architecture is based on Tauri IPC + AVG requirements reasoning; no official Tauri "encrypted storage" blueprint document was found that specifies this exact pattern]

---

## Build Order (Migration Sequence)

The sequence below minimizes risk by establishing a working shell early and porting the riskiest logic (parsers, prognose engine) before UI decomposition.

```
Wave 0 — Scaffold + Infrastructure (1–2 days)
  1. `npm create tauri-app` with react-ts template
  2. Copy vendored pdf.min.mjs + pdf.worker.min.mjs + zip.min.js
  3. Configure tauri.conf.json: window title, bundle identifier
  4. Configure capabilities/main.json: fs, dialog, store permissions
  5. Migrate jest.config.js → vitest.config.ts; verify all 8 existing tests pass

Wave 1 — Logic Modules in TypeScript (2–3 days)
  6. Port utils/schema.js → schema.ts (DEELGEBIEDEN constants, types)
  7. Port utils/prognosis.js → prognosis.ts (doorstroomnorm engine)
  8. Port utils/klassen.js → klassen.ts (class CRUD, no window.*)
  9. Port utils/leerlijnen.js → leerlijnen.ts
  10. Port utils/aggregation.js → aggregation.ts
  11. Port parsers/pdf.js → pdfImport.ts (Uint8Array in, StudentData out)
  12. Port parsers/excel.js → excelImport.ts
  13. Port utils/actiepunten.js, backup.js, spider.js → TypeScript
  14. Write types/index.ts (Student, Klas, PrognosisResult, DeelgebiedScore, etc.)
  [Gate: all Vitest tests green before proceeding]

Wave 2 — State Layer (1 day)
  15. Implement Zustand store (klassen.slice, students.slice, ui.slice)
  16. Implement encrypted storage service (Rust commands + TypeScript wrapper)
  17. Implement per-student deleteStudent action (AVG article 17)
  [Gate: store CRUD round-trips verified; encryption smoke test]

Wave 3 — Import Flow (1 day)
  18. ImportZone component (onDragDropEvent + readFile)
  19. File picker via plugin-dialog (fallback to click-to-browse)
  20. Batch import progress UI
  21. Connect parsers to store actions

Wave 4 — Klasoverzicht (1–2 days)
  22. KlasTabStrip component
  23. StudentTile component (RAG, mini-verzuim-bar, aanwezigheidspercentage)
  24. KlasGrid component
  25. KpiStrip component
  26. Empty state + "nieuwe klas" modal

Wave 5 — Detail View (2–3 days)
  27. DetailView layout + navigation (prev/next student)
  28. PrognosePanel (doorstroomprognose display)
  29. DeelgebiedenTable (period comparison, growth badges)
  30. VerzuimSection
  31. SpiderChart (SVG radar)
  32. NotitiesSection, ActiepuntenSection, FeedbackSection, StageSection
  33. LeerlijnToewijzing UI

Wave 6 — Polish + Packaging (1 day)
  34. DarkModeToggle wired to Zustand ui.slice
  35. CIOS huisstijl CSS tokens applied globally
  36. BackupModal (export/import JSON via plugin-dialog + plugin-fs)
  37. `cargo tauri build` — .exe (Windows) + .dmg (Mac) installer
  38. DataflowDoc.md — field inventory for school pre-DPIA
```

---

## Common Pitfalls

### Pitfall 1: Stronghold Adoption
**What goes wrong:** Developer installs `@tauri-apps/plugin-stronghold` as the natural encryption answer. It works now but will break or require migration when Tauri v3 removes it.
**Why it happens:** Stronghold is the most visible "secure storage" result in Tauri docs.
**How to avoid:** Do not use Stronghold for new development. Use Rust AES-GCM custom command + plugin-store/plugin-fs.
**Warning signs:** `cargo tauri add stronghold` in a plan step.

[VERIFIED: WebSearch — Tauri team confirmed Stronghold deprecation for v3]

### Pitfall 2: WebView `localStorage` vs. Tauri `AppData`
**What goes wrong:** Developer uses Zustand `persist` with the default `localStorage` storage — data persists between sessions but is stored in WebView's profile directory as plaintext JSON. The path varies by platform and is not the app's `AppData`. Under Tauri, WebView cookies/localStorage may not survive app updates.
**Why it happens:** `localStorage` is the Zustand persist default and feels familiar.
**How to avoid:** Always use `createJSONStorage(() => tauriStorage)` with a Tauri plugin-store adapter as the custom storage backend.
**Warning signs:** `persist(fn, { name: 'mentordashboard' })` without a custom `storage` option.

[VERIFIED: Context7 + Tauri GitHub issue #4455 confirming localStorage persistence issues in Tauri]

### Pitfall 3: `window.*` Global Coupling
**What goes wrong:** TypeScript ports still write to `window.klassenState` or call `window.berekenPrognose()`. React components then import these directly. This creates hidden coupling that breaks component isolation and makes testing impossible.
**Why it happens:** It's the fastest way to make existing code "work" in the new shell.
**How to avoid:** Every function that was a `window.*` global must become an ES module export. No `window.*` writes anywhere in `src/`.
**Warning signs:** `window.` appearing in any `.ts` or `.tsx` file under `src/`.

[ASSUMED — standard React migration anti-pattern; widely documented in migration guides]

### Pitfall 4: Capability Permissions Not Configured
**What goes wrong:** `readFile()` or `open()` throws at runtime with a cryptic "not allowed" error because `capabilities/main.json` doesn't include the required permission strings.
**Why it happens:** Tauri v2's capability model is opt-in and defaults to deny. Unlike Tauri v1, permissions are not inherited.
**How to avoid:** Add `fs:default`, `dialog:default`, `store:default` to capabilities in Wave 0. Test every IPC call in development before wiring UI.
**Warning signs:** Runtime errors mentioning "Permission denied" or "capability" in the Tauri dev console.

[VERIFIED: Context7 — Tauri v2 capabilities configuration docs]

### Pitfall 5: Rust Toolchain Not Installed
**What goes wrong:** `cargo tauri dev` fails immediately because Rust is not installed.
**Why it happens:** Rust is not part of standard Node/npm toolchains.
**How to avoid:** Install Rust via `rustup` before Wave 0. On Windows: `winget install Rustlang.Rustup` or download from rustup.rs. Verify with `rustc --version`.
**Warning signs:** This machine's current environment shows `rustc NOT FOUND` (verified 2026-05-12). Rust installation is a Wave 0 prerequisite.

[VERIFIED: `rustc --version` check on this machine returned NOT FOUND — 2026-05-12]

### Pitfall 6: `onDragDropEvent` vs. HTML `ondrop`
**What goes wrong:** Developer uses the standard HTML `dragover`/`drop` event to get dropped files, which returns a `File` object with `FileReader`. In Tauri, this works for files but bypasses the capability model and won't give native file paths — those are needed to call `readFile()`.
**Why it happens:** The HTML drag-drop API works in any browser/WebView, so it "works" locally.
**How to avoid:** Use `getCurrentWebview().onDragDropEvent()` (Tauri API) which delivers file system paths. Pass paths to `readFile()` from `plugin-fs`.
**Warning signs:** `event.dataTransfer.files` appearing in import components.

[VERIFIED: Context7 — Tauri v2 webview.onDragDropEvent API]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All frontend build | YES | v24.14.0 | — |
| npm | Package management | YES | v11.9.0 | — |
| Rust toolchain (rustc + cargo) | Tauri backend build | NO | — | Must install via rustup before Wave 0 |
| WebView2 runtime (Windows) | Tauri on Windows | ASSUMED present | — | Ships with Windows 11 by default |

**Missing dependencies that block execution:**
- **Rust toolchain** — `rustc --version` returned NOT FOUND on 2026-05-12. Install via `winget install Rustlang.Rustup` or https://rustup.rs. Estimated install time: 5–15 minutes. This must happen before any `cargo tauri` command.

**Missing dependencies with fallback:**
- None beyond Rust.

[VERIFIED: npm/node versions via `node --version`; rustc NOT FOUND verified via exec test]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 (migrated from Jest 29.7) |
| Config file | `vitest.config.ts` (Wave 0 — create from jest.config.js) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Existing Tests → Vitest Migration

The existing 8 test files use Jest 29 + jsdom. Vitest is API-compatible with Jest. Migration steps:
1. `npm install -D vitest @vitest/ui jsdom`
2. Create `vitest.config.ts` with `environment: 'jsdom'`
3. Replace `jest.config.js` test runner reference in `package.json`
4. No test file changes needed (Vitest is Jest-compatible for this API surface)

### Phase Requirements → Test Map

| Deliverable | Behavior to Test | Test Type | Automated Command |
|-------------|------------------|-----------|-------------------|
| TS-02 prognosis.ts | Doorstroomnorm boundary conditions | unit | `npx vitest run tests/prognosis.test` |
| TS-02 klassen.ts | createKlas, switchActiveKlas, deleteKlas | unit | `npx vitest run tests/klassen.test` |
| TS-03 pdf.ts | PDF parse returns expected student shape | unit | `npx vitest run tests/parseToetsplan.test` |
| TS-03 excel.ts | Excel parse returns verzuim data | unit | `npx vitest run tests/actiepunten.test` |
| TS-11 encryption | Encrypt→decrypt round-trip returns identical JSON | unit | `npx vitest run tests/storage.test` (Wave 0 gap) |
| TS-12 per-student delete | deleteStudent removes from store + persist flush | unit | `npx vitest run tests/klassen.test` |
| TS-05/06 import flow | Drop event → parser → store state update | integration | `npx vitest run tests/import.test` (Wave 0 gap) |

### Wave 0 Gaps

- [ ] `vitest.config.ts` — replaces `tests/jest.config.js`
- [ ] `tests/storage.test.ts` — covers TS-11 encrypt/decrypt round-trip
- [ ] `tests/import.test.ts` — covers TS-05/06 Tauri file import integration (may require mock of Tauri IPC)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | App has no login (single-mentor, local tool) |
| V3 Session Management | No | Desktop app; no session tokens |
| V4 Access Control | Partial | Tauri capability model is the access control layer — must be configured correctly |
| V5 Input Validation | Yes | PDF/Excel parser input — TypeScript types + runtime shape checks on parsed data |
| V6 Cryptography | Yes | AES-256-GCM via `aes-gcm` Rust crate; PBKDF2 for key derivation — do not hand-roll |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Plaintext student data on disk | Info Disclosure | AES-256-GCM encryption at rest (TS-11) |
| AES key co-located with data | Info Disclosure | PBKDF2 key derivation in Rust; key never leaves Rust memory |
| Malformed PDF/Excel crashing parser | Denial of Service | try/catch in pdfImport.ts + excelImport.ts; show error UI |
| WebView escape via IPC | Elevation of Privilege | Tauri capability model — only fs, dialog, store, custom encrypt commands are allowed |
| IV reuse in AES-GCM | Info Disclosure | Generate random 12-byte IV per encrypt call; prepend to ciphertext |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window.*` globals for state | Zustand slice store | React ecosystem shift ~2022+ | Global mutation bugs eliminated; components subscribe to exactly what they need |
| `FileReader` API for file input | Tauri `onDragDropEvent` + `readFile` | Tauri v2 GA (2024) | Native file paths; works with capability model |
| `localStorage` for persistence | Tauri `plugin-store` (disk JSON) | Tauri v2 | Survives WebView profile resets; platform-independent path |
| Stronghold for encryption | Custom Rust AES-GCM command | Stronghold deprecation announced (v3 target) | Teams must migrate off Stronghold before v3 upgrade |
| Jest + babel-jest for Vite projects | Vitest | Vitest 1.0 (2023) | Zero-config with Vite; same Jest API surface |

**Deprecated/outdated:**
- `plugin-stronghold`: Do not use for new Tauri v2 projects — removal planned for v3.
- `window.*` global communication between JS modules: Replace with ES module exports and Zustand.
- `FileReader` in Tauri context: Still works but does not integrate with capability model; prefer `onDragDropEvent` + `readFile`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Rust AES-GCM two-tier architecture (key in Rust memory, data encrypted at rest) is the correct AVG-compliant replacement for Stronghold | Encryption Strategy | If wrong, may need to evaluate alternative like OS keychain (`tauri-plugin-keychain` or Windows Credential Manager) — adds implementation complexity |
| A2 | Per-student deleteStudent in Zustand + flush to encrypted store satisfies AVG article 17 for this app context | Per-Student Deletion pattern | School's DPO/FG must confirm; app-level deletion may need to also address export files (out of scope per questions.md) |
| A3 | WebView2 runtime is present on the target Windows 11 machines | Environment Availability | Windows 11 ships WebView2 by default since 2022; should be safe but worth confirming on school hardware |
| A4 | Existing PDF/Excel parser logic is correct and complete | Wave 1 logic ports | Parsers are tested; risk is low but parser accuracy is AVG-adjacent (wrong data → wrong prognose) |

---

## Open Questions

1. **Encryption UX: password prompt vs. OS keychain**
   - What we know: IBP SM.10 requires key not to be co-located with data. PBKDF2 from a user password is compliant. OS keychain (Windows Credential Manager) is also compliant and removes the password prompt on every launch.
   - What's unclear: Does the school prefer a password-on-open UX or a seamless OS-keychain UX? OS keychain means losing data if the Windows user profile is deleted.
   - Recommendation: Default to OS keychain via `tauri-plugin-keychain` (community plugin) for UX simplicity; fall back to PBKDF2 password if keychain unavailable. Needs a decision before Wave 2 starts.

2. **Rust experience requirement**
   - What we know: The custom AES-GCM IPC command (~60 lines of Rust) is the hardest task. Rust is not currently installed on this machine.
   - What's unclear: Does the developer have Rust experience, or will this be a first Rust file?
   - Recommendation: If Rust is new, allocate an extra 1–2 days for Wave 2 (learning `tauri::command` macro, `aes-gcm` crate usage). The rest of the migration is pure TypeScript/React.

3. **SheetJS license for `.xls` (old binary format)**
   - What we know: SheetJS is vendored via `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. It supports `.xls` (BIFF8).
   - What's unclear: SheetJS changed to a commercial license for some use cases in 2023. The current vendored version may require a license check for a school-distributed app.
   - Recommendation: Verify license compliance before distribution. The community edition (older versions) may be sufficient for `.xls` read-only use.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/v2_tauri_app` — Tauri v2 file system, dialog, store, stronghold, IPC, capabilities
- npm registry — all package versions verified 2026-05-12
- Context7 `/pmndrs/zustand` — persist middleware, slice pattern, devtools

### Secondary (MEDIUM confidence)
- WebSearch: Tauri plugin-stronghold deprecation — confirmed by multiple results citing official Tauri docs
- WebSearch: Zustand vs Context vs Redux 2025 — state management recommendation for medium apps
- WebSearch: React migration strategy from vanilla JS monolith — standard community practice

### Tertiary (LOW confidence)
- A1: Rust AES-GCM two-tier encryption architecture — reasoned from Tauri IPC model + AVG requirements; no official Tauri blueprint document
- A2: deleteStudent as sufficient AVG article 17 compliance — reasoned from questions.md analysis; DPO confirmation needed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm registry; Tauri docs verified via Context7
- Architecture: HIGH — Tauri capability model and IPC patterns verified via official docs
- Encryption strategy: MEDIUM — Stronghold deprecation verified; specific AES-GCM Rust pattern is reasoned, not from a Tauri blueprint
- Build order: MEDIUM — standard migration sequencing; no project-specific risk analysis
- Pitfalls: HIGH — majority verified via official docs or confirmed tool checks (Rust not installed)

**Research date:** 2026-05-12
**Valid until:** 2026-08-12 (90 days — Tauri v2 is stable; Zustand v5 is stable; only watch for Tauri v3 announcement)
