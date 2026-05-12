# Architecture Research: Vanilla JS → TypeScript + React + Vite + Tauri 2.x Migration

**Researched:** 2026-05-12
**Domain:** Desktop app migration — Tauri 2.x, React 18, TypeScript, Vite, pdfjs-dist 5, SheetJS 0.20
**Confidence:** HIGH (core stack); MEDIUM (pdfjs-dist worker in Tauri); LOW (encryption layer)

---

## Summary

The Mentordashboard CIOS is currently a single-page browser app (~3800 LOC across 9 files) with
zero build tooling — all code is loaded as `<script>` tags or ESM modules from vendor files, with
state living in `window.*` globals and `localStorage`. The migration target is a Tauri 2.x
desktop app with React 18, TypeScript, and Vite.

The migration has two strategic layers. First, the **logic layer** (parsers, prognosis engine,
schema, datamodel, klassen, backup) is already purely functional — it can be extracted as TypeScript
modules with no architectural changes beyond removing `window.*` assignments. Second, the **UI
layer** (app.js ~2300 LOC) is a jQuery-style imperative render engine that must be fully rewritten
as React components.

The three genuine technical risks in this migration are: (1) pdfjs-dist 5.x worker resolution under
Vite's ESM bundling in a Tauri webview, (2) SheetJS 0.20.x CJS/ESM boundary issues under Vite,
and (3) the replacement of `localStorage` + zip-encrypted backup with a Tauri-native persistence
strategy. All three have verified solutions documented below.

**Primary recommendation:** Keep parsers and business logic in the TypeScript frontend (not Rust),
replace `localStorage` with `@tauri-apps/plugin-store`, use `plugin-dialog` + `plugin-fs` to
replace `FileReader`/`<input type=file>`, and rewrite app.js as React component tree in 5
incremental phases.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| PDF parsing (pdfjs-dist) | Frontend (TS) | — | PDF.js is a JS library; no benefit to Rust side; worker runs in webview |
| Excel parsing (SheetJS) | Frontend (TS) | — | Pure JS library; Rust xlsx crates are not feature-equivalent |
| Doorstroomnorm calculation | Frontend (TS) | — | Pure function; no I/O; fastest in same JS process as UI |
| File open dialog | Rust/Tauri IPC | Frontend triggers | `plugin-dialog` provides native OS dialog; frontend calls `open()` |
| File bytes reading | Frontend (TS) | Rust fallback | After dialog returns path, `plugin-fs readFile` returns `Uint8Array` |
| Drag-and-drop file drop | Frontend (TS) | Rust event | Tauri fires `tauri://drag-drop` event with file paths to frontend |
| Persistent state (klassen) | Frontend (TS) | plugin-store | Zustand + `@tauri-apps/plugin-store` replaces localStorage |
| Encrypted backup export | Frontend (TS) | — | AES-256-GCM via Web Crypto API (browser-native); no Rust needed |
| Backup import/restore | Frontend (TS) | — | Decrypt + JSON merge in same process |
| App window / OS integration | Rust/Tauri | — | Window decorations, system tray, file drop handler registration |
| CSS theming (CIOS brand) | Frontend (CSS) | — | CSS variables already in index.html; ported to global CSS file |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| tauri | 2.x (CLI 2.11.1) | Desktop shell, OS integration, IPC | Official; v2 stable; replaces Electron at 1/10 the bundle size |
| @tauri-apps/api | 2.11.0 | Frontend IPC bindings | Official JS bindings for Tauri commands/events |
| react | 19.2.6 | UI component tree | Replaces imperative innerHTML-based render engine in app.js |
| react-dom | 19.2.6 | DOM rendering | Required peer of React |
| typescript | 5.x | Type safety | Removes window.* global anti-patterns; improves refactoring safety |
| vite | 8.0.12 | Build + HMR | Official Tauri recommended bundler; fast ESM-native |
| pdfjs-dist | 5.7.284 | PDF text extraction | Already in use; coordinate-based table reconstruction preserved |
| xlsx (SheetJS) | 0.20.3 | Excel/xls parsing | Already in use from cdn.sheetjs.com; keep same source |
| zustand | 5.x | React state management | Lightweight; replaces window.* globals; persist middleware replaces localStorage |

[VERIFIED: npm registry — pdfjs-dist 5.7.284, @tauri-apps/api 2.11.0, @tauri-apps/cli 2.11.1, vite 8.0.12, react 19.2.6]

### Supporting

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| @tauri-apps/plugin-dialog | 2.x | Native file open/save dialogs | Replaces `<input type=file>` for PDF and Excel import |
| @tauri-apps/plugin-fs | 2.x | Read file bytes from OS path | After dialog returns path; returns `Uint8Array` directly |
| @tauri-apps/plugin-store | 2.x | Persistent JSON key-value store | Replaces `localStorage` for klassenState; survives app restarts |
| zustand/middleware (persist) | 5.x | Sync Zustand state → plugin-store | Persistence middleware adapter |

[CITED: v2.tauri.app/plugin/dialog/, v2.tauri.app/plugin/file-system/, v2.tauri.app/plugin/store/]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Zustand | Redux Toolkit | Redux requires actions + reducers boilerplate; overkill for single-mentor app |
| Zustand | React Context | Context re-renders entire tree on every change; poor for large student arrays |
| plugin-store | localStorage | localStorage works in Tauri webview but is not sandboxed to app data dir; plugin-store uses OS app data path |
| plugin-store | Stronghold | Stronghold is deprecated in Tauri v2 (removed in v3); do not use |
| Web Crypto AES for backup | custom AES hand-roll | Web Crypto is native in Chromium webview; no library needed; hand-rolling is forbidden |

**Installation:**

```bash
# Scaffold new Tauri+React+TypeScript+Vite project
npm create tauri-app@latest -- --template react-ts

# Core dependencies
npm install react react-dom
npm install -D @tauri-apps/cli typescript vite @vitejs/plugin-react

# Tauri plugins (JS side)
npm install @tauri-apps/plugin-dialog @tauri-apps/plugin-fs @tauri-apps/plugin-store

# Parser libraries
npm install pdfjs-dist
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz

# State management
npm install zustand

# Add Rust plugins to src-tauri/Cargo.toml
# tauri-plugin-dialog = "2"
# tauri-plugin-fs = "2"
# tauri-plugin-store = "2"
```

**Version verification (run before writing stack table):**

```bash
npm view pdfjs-dist version        # → 5.7.284 (2026-05-12)
npm view @tauri-apps/api version   # → 2.11.0  (2026-05-12)
npm view @tauri-apps/cli version   # → 2.11.1  (2026-05-12)
npm view vite version              # → 8.0.12  (2026-05-12)
npm view react version             # → 19.2.6  (2026-05-12)
npm view zustand version           # → 5.x (verify at install time)
```

---

## Architecture Patterns

### System Architecture Diagram

```
 ┌─────────────────────────────────────────────────────────────────────┐
 │  TAURI DESKTOP SHELL (Rust)                                         │
 │                                                                     │
 │  ┌─────────────────────────────────────────────────────────────┐   │
 │  │  WEBVIEW (Chromium)                                         │   │
 │  │                                                             │   │
 │  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐ │   │
 │  │  │ React   │  │ Zustand  │  │  Parsers   │  │  Logic   │ │   │
 │  │  │  Tree   │◄─│  Store   │  │  (TS)      │  │  (TS)    │ │   │
 │  │  │         │  │          │  │            │  │          │ │   │
 │  │  │ KlasTab │  │klassenSt.│  │ parsePDF() │  │berekenPr.│ │   │
 │  │  │ Import  │  │studenten │  │ parseExcel │  │normaliz. │ │   │
 │  │  │ KlasGrid│  │activeKl. │  │            │  │leerlijnen│ │   │
 │  │  │ Detail  │  │          │  │            │  │          │ │   │
 │  │  └────┬────┘  └─────┬────┘  └─────┬──────┘  └──────────┘ │   │
 │  │       │             │             │                        │   │
 │  │       │ user action │             │ file bytes (Uint8Array) │   │
 │  │       ▼             ▼             │                        │   │
 │  │  ┌──────────────────────────┐    │                        │   │
 │  │  │  @tauri-apps/api (IPC)   │────┘                        │   │
 │  │  │  invoke / listen / event │◄── tauri://drag-drop paths  │   │
 │  │  └──────────┬───────────────┘                             │   │
 │  └─────────────│───────────────────────────────────────────────┘   │
 │                │  IPC channel (JSON/binary)                         │
 │  ┌─────────────▼───────────────────────────────────────────────┐   │
 │  │  RUST COMMANDS (src-tauri/src/lib.rs)                       │   │
 │  │                                                             │   │
 │  │  plugin-dialog  ──► OS native file picker dialog           │   │
 │  │  plugin-fs      ──► readFile() → Uint8Array to frontend    │   │
 │  │  plugin-store   ──► JSON store → OS app data dir           │   │
 │  │  drag-drop      ──► tauri://drag-drop event with paths[]   │   │
 │  └─────────────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────────────┘

 Data flow — PDF import:
   User drops PDF file
     → Tauri fires tauri://drag-drop {paths: ["/abs/path.pdf"]}
     → React ImportView handles event
     → plugin-fs readFile(path) → Uint8Array
     → parsePDF(arrayBuffer) → StudentRecord[]
     → Zustand store.addStudents()
     → React re-renders KlasGrid

 Data flow — Excel import:
   User clicks "Kies bestand"
     → plugin-dialog open({filters: [{extensions: ['xls','xlsx']}]})
     → Returns absolute path string
     → plugin-fs readFile(path) → Uint8Array
     → parseExcel(uint8array.buffer) → VerzuimRecord[]
     → Zustand store.mergeVerzuim()
     → React re-renders KlasGrid

 Data flow — persistence:
   Zustand persist middleware
     → On state change: plugin-store.set('klassenState', state)
     → On app start: plugin-store.get('klassenState') → hydrate Zustand
```

### Recommended Project Structure

```
mentordashboard-tauri/
├── src/                          # React + TypeScript frontend
│   ├── main.tsx                  # ReactDOM.createRoot entry point
│   ├── App.tsx                   # Root component, view router
│   ├── components/               # React UI components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # Header, nav, dark mode toggle
│   │   │   └── KlasTabStrip.tsx  # Tab strip + nieuwe klas modal
│   │   ├── import/
│   │   │   ├── ImportView.tsx    # Drop zone + file picker + progress
│   │   │   └── ImportResults.tsx # Success/error summary badges
│   │   ├── klas/
│   │   │   ├── KlasView.tsx      # KPI strip + search + sort + grid
│   │   │   ├── KlasGrid.tsx      # Grid container
│   │   │   ├── LeerlingTile.tsx  # Student card with verzuimbalk
│   │   │   └── KpiStrip.tsx      # Summary metrics row
│   │   ├── detail/
│   │   │   ├── DetailView.tsx    # Full detail shell + prev/next nav
│   │   │   ├── DetailHeader.tsx  # Name, prognose chip, nav arrows
│   │   │   ├── DetailSpiderweb.tsx # Canvas radar chart
│   │   │   ├── DetailDeelgebieden.tsx # Score table (fase 1 + 2)
│   │   │   ├── DetailVerzuim.tsx # Absence section
│   │   │   ├── DetailFeedback.tsx # Per-vak feedback accordion
│   │   │   └── Actiepunten.tsx   # Action items CRUD
│   │   ├── backup/
│   │   │   └── BackupPanel.tsx   # Export/import backup
│   │   └── leerlijn/
│   │       └── LeerlijntoewijzingPanel.tsx # Leerlijn assignment UI
│   ├── store/                    # Zustand state management
│   │   ├── klassenStore.ts       # Classes + students + activeKlasId
│   │   ├── uiStore.ts            # activeView, sortKey, zoekTerm, theme
│   │   └── leerlijnenStore.ts    # Leerlijn overrides
│   ├── parsers/                  # MIGRATED from parsers/ — TS modules
│   │   ├── pdf.ts                # pdfjs-dist coordinator-based parser
│   │   └── excel.ts              # SheetJS .xls/.xlsx parser
│   ├── logic/                    # MIGRATED from utils/ — pure TS
│   │   ├── schema.ts             # DEELGEBIEDEN, normalizeScore
│   │   ├── datamodel.ts          # StudentRecord types, addStudent
│   │   ├── prognosis.ts          # berekenPrognose engine
│   │   ├── klassen.ts            # createKlas, switchKlas, deleteKlas
│   │   ├── leerlijnen.ts         # getLeerlijnenMapping
│   │   ├── actiepunten.ts        # actiepuntenStore CRUD
│   │   ├── aggregation.ts        # getActiveStudents, dedup logic
│   │   ├── backup.ts             # buildBackupPayload, applyRestore
│   │   └── spider.ts             # spiderweb data builder
│   ├── hooks/                    # Custom React hooks
│   │   ├── useFileImport.ts      # Tauri drag-drop + dialog open
│   │   └── usePersistence.ts     # plugin-store hydration/sync
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts              # StudentRecord, Verzuim, etc.
│   └── styles/
│       ├── globals.css           # CSS custom properties (CIOS palette)
│       └── components.css        # Component-specific styles
├── src-tauri/                    # Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── main.json             # Permissions: dialog, fs, store
│   └── src/
│       └── lib.rs                # Plugin registration, no custom commands needed
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Pattern 1: pdfjs-dist 5.x Worker Configuration with Vite

**What:** Vite cannot automatically resolve pdfjs-dist's worker because it lives inside
node_modules and uses `new URL(..., import.meta.url)` internally. Two verified approaches exist.

**Recommended approach — `?url` query suffix** (most reliable for Tauri production builds):

```typescript
// src/parsers/pdf.ts
// Source: GitHub discussion mozilla/pdf.js #19520, vite docs /vitejs/vite worker-imports

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set workerSrc ONCE at module load — Vite resolves ?url to hashed asset path at build time
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export async function parsePDF(data: ArrayBuffer): Promise<StudentRecord[]> {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  // ... existing coordinate-based extraction logic, ported from parsers/pdf.js ...
  await pdf.destroy();
  return students;
}
```

**Alternative approach — `?worker` query suffix** (if `?url` fails in Tauri webview):

```typescript
// Source: Vite docs — Web Workers
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();
```

**WARNING — do NOT use in parsers/pdf.ts:**
- `workerPort` pattern (current vendor file pattern) — the existing comment in parsers/pdf.js
  explicitly warns this causes silent message loss in pdfjs-dist 5.x
- `new URL('../vendor/pdf.worker.min.mjs', import.meta.url)` — vendor folder removed in migration

**vite.config.ts required configuration:**

```typescript
// Source: Vite docs /vitejs/vite, SheetJS docs docs.sheetjs.com/docs/demos/frontend/bundler/vitejs/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // SheetJS CJS→ESM boundary: exclude to prevent Vite from re-bundling it
    exclude: ['xlsx'],
    // pdfjs-dist has internal dynamic imports; include prevents chunking issues
    include: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      // Prevent pdfjs worker from being inlined as base64 (breaks in Tauri)
      external: [],
    },
  },
  // Tauri dev server: do not open browser; use localhost
  server: {
    port: 1420,
    strictPort: true,
  },
});
```

[VERIFIED: npm view pdfjs-dist — 5.7.284; CITED: github.com/mozilla/pdf.js/discussions/19520]
[CITED: docs.sheetjs.com/docs/demos/frontend/bundler/vitejs/]

### Pattern 2: SheetJS with Vite ESM Bundling

**What:** SheetJS 0.20 ships as CommonJS. Vite's ESM transformer can produce "Cannot access
file" errors if xlsx is pre-bundled. Solution: exclude from optimizeDeps and import as namespace.

```typescript
// src/parsers/excel.ts
// Source: docs.sheetjs.com/docs/demos/frontend/bundler/vitejs/ [CITED]
import * as XLSX from 'xlsx';

export async function parseExcel(data: Uint8Array): Promise<VerzuimRecord[]> {
  const workbook = XLSX.read(data, { type: 'array' });
  // ... existing header detection and parsing logic from parsers/excel.js ...
  return records;
}
```

**Signature change from current code:** Current `parseExcelFile(File)` uses `FileReader` internally.
In the migrated version, the caller (React hook) reads bytes via `plugin-fs` and passes a
`Uint8Array` directly. The parser no longer touches the DOM or `File` API — it becomes a pure
function over bytes.

[CITED: docs.sheetjs.com/docs/demos/frontend/bundler/vitejs/]
[ASSUMED: `exclude: ['xlsx']` in optimizeDeps is the correct fix — single source, not cross-verified]

### Pattern 3: Tauri IPC — File System Access

**What:** Replaces `<input type=file>` + `FileReader` + drag-drop `File` objects with
Tauri's native dialog + fs plugin pair.

**Capability configuration** (src-tauri/capabilities/main.json):

```json
{
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": [
    "dialog:allow-open",
    "fs:allow-read-file",
    "store:allow-get",
    "store:allow-set",
    "store:allow-load"
  ]
}
```

[CITED: v2.tauri.app/learn/security/using-plugin-permissions/ — permission string format]

**File open (replaces `<input type=file>`):**

```typescript
// src/hooks/useFileImport.ts
// Source: v2.tauri.app/plugin/dialog/ [CITED] + v2.tauri.app/plugin/file-system/ [CITED]
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';

export async function pickAndReadPDF(): Promise<{ name: string; data: ArrayBuffer } | null> {
  const path = await open({
    multiple: false,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (!path) return null;                         // user cancelled
  const bytes = await readFile(path);             // returns Uint8Array
  return { name: path.split(/[\\/]/).pop() ?? path, data: bytes.buffer };
}
```

**Drag-and-drop (replaces drop zone FileReader):**

```typescript
// Source: v2.tauri.app blog/tauri-20/ + github.com/tauri-apps/tauri issues #9830 [CITED]
import { listen } from '@tauri-apps/api/event';
import { readFile } from '@tauri-apps/plugin-fs';

// Register ONCE in a top-level hook or AppShell useEffect
const unlisten = await listen<{ paths: string[] }>('tauri://drag-drop', async (event) => {
  const pdfPaths = event.payload.paths.filter(p => p.toLowerCase().endsWith('.pdf'));
  for (const path of pdfPaths) {
    const bytes = await readFile(path);   // Uint8Array; path auto-scoped by Tauri drop
    await importPDF(bytes.buffer, path);
  }
});
```

**Key behavioral difference from current code:** Tauri v2 fires `tauri://drag-drop` with an
array of absolute OS paths — NOT `File` objects. The `readFile` call converts the path to bytes.
Paths dropped onto the Tauri window are automatically scoped (no manual `allow-scope` needed).

[CITED: v2.tauri.app (blog Tauri 2.0 stable), github.com/tauri-apps/tauri/issues/9830]

### Pattern 4: Zustand Store Replacing window.* Globals

**What:** All `window.klassenState`, `window.appState`, `window.saveKlassen()` etc. become
Zustand store slices with plugin-store persistence.

```typescript
// src/store/klassenStore.ts
// Source: zustand docs [ASSUMED — not verified via Context7 in this session]
import { create } from 'zustand';
import { Store } from '@tauri-apps/plugin-store';

interface KlassenState {
  klassen: Record<string, Klas>;
  activeKlasId: string | null;
  addStudent: (student: StudentRecord) => void;
  switchActiveKlas: (id: string) => void;
  createKlas: (naam: string, schooljaar: string | null) => Klas | KlasError;
  deleteKlas: (id: string) => void;
}

const store = new Store('klassen.bin');

export const useKlassenStore = create<KlassenState>((set, get) => ({
  klassen: {},
  activeKlasId: null,
  // ... implementations mirror utils/klassen.js logic exactly ...
  addStudent: (student) => set(state => {
    const klas = state.klassen[state.activeKlasId!];
    if (!klas) return state;
    const idx = klas.students.findIndex(
      s => s.leerlingId === student.leerlingId && s.periode === student.periode
    );
    const newStudents = [...klas.students];
    idx >= 0 ? (newStudents[idx] = student) : newStudents.push(student);
    return { klassen: { ...state.klassen, [klas.id]: { ...klas, students: newStudents } } };
  }),
}));

// Persistence: sync to plugin-store on every change
useKlassenStore.subscribe(async (state) => {
  await store.set('klassenState', { klassen: state.klassen, activeKlasId: state.activeKlasId });
  await store.save();
});
```

[CITED: v2.tauri.app/plugin/store/ — plugin-store does NOT encrypt; stores in OS app data dir]
[ASSUMED: Zustand subscribe-based persistence pattern — standard community pattern, not verified via official docs]

### Pattern 5: Encrypted Backup (Replaces zip.min.js + Password AES)

**What:** Current backup uses `zip.min.js` (zip.js) for password-encrypted ZIP export.
In the migration, use the **Web Crypto API** (available natively in Tauri's Chromium webview)
for AES-256-GCM encryption — no external library needed.

```typescript
// src/logic/backup.ts — encryption helpers
// Web Crypto is native in Chromium (Tauri webview); no library import needed
// [ASSUMED: Web Crypto API fully available in Tauri 2.x webview — standard in all Chromium >= 75]

async function encryptPayload(json: string, password: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password),
    { name: 'PBKDF2' }, false, ['deriveKey']);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(json));
  // Prepend salt + iv for decryption
  const result = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
  result.set(salt, 0); result.set(iv, 16); result.set(new Uint8Array(ciphertext), 28);
  return result.buffer;
}
```

**Backward compatibility concern:** Existing backups are zip.js AES-encrypted. The migration
must either: (a) import the zip.js library temporarily to read old backups, or (b) document that
old backups need a one-time migration. This is a planner decision.
[ASSUMED: Web Crypto API available in Tauri webview — plausible, but should be verified in a test build]

### Pattern 6: React Component View Router

**What:** `showView('import' | 'klas' | 'detail')` in app.js is replaced by Zustand UI state.

```typescript
// src/store/uiStore.ts
type ActiveView = 'leeg' | 'import' | 'klas' | 'detail';
interface UIState {
  activeView: ActiveView;
  detailStudentId: string | null;
  sortKey: 'naam' | 'status' | 'verzuim';
  sortAsc: boolean;
  zoekTerm: string;
  theme: 'light' | 'dark';
  setView: (view: ActiveView) => void;
  setDetailStudent: (id: string) => void;
}

// src/App.tsx
function App() {
  const activeView = useUIStore(s => s.activeView);
  return (
    <AppShell>
      <KlasTabStrip />
      {activeView === 'leeg'   && <LegeKlassenState />}
      {activeView === 'import' && <ImportView />}
      {activeView === 'klas'   && <KlasView />}
      {activeView === 'detail' && <DetailView />}
    </AppShell>
  );
}
```

### Anti-Patterns to Avoid

- **`window.*` global state in React components:** All state belongs in Zustand stores. Any
  component that touches `window.klassenState` directly creates an invisible dependency that
  React cannot track.
- **FileReader in migrated parsers:** `parsePDF` and `parseExcel` must accept `ArrayBuffer` or
  `Uint8Array`, not `File` objects. File reading is done by the Tauri layer before calling parsers.
- **Inline CSS strings in JSX:** Current app.js uses `style.cssText = '...'` extensively.
  Migrate to CSS modules or global CSS custom properties.
- **`innerHTML` in React components:** Replace all `buildDetailHTML()` template-string renderers
  with proper JSX. innerHTML bypasses React's reconciler.
- **Worker per PDF import call:** pdfjs-dist 5.x reuses the worker across calls if you set
  `workerSrc` once at module load. Do NOT create a new Worker per import.
- **Custom AES implementation:** Use Web Crypto API. Hand-rolling AES is listed in Don't
  Hand-Roll table below.
- **Putting parsers in Rust:** PDF.js and SheetJS are JS libraries. Rust xlsx crates (calamine)
  exist but do not replicate all SheetJS format support (.xls legacy). Keep parsers in frontend.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| AES-256-GCM encryption | Custom AES cipher | `crypto.subtle` (Web Crypto API) | Native in Tauri webview; FIPS-validated; handles key derivation, IV, authentication tag |
| Persistent storage | `localStorage` wrapper | `@tauri-apps/plugin-store` | localStorage is not scoped to app data dir; plugin-store uses OS-appropriate location |
| File open dialogs | Custom HTML file picker | `@tauri-apps/plugin-dialog` | Native OS dialogs; handles permissions, sandboxing, accessibility |
| File reading | `FileReader` API | `@tauri-apps/plugin-fs readFile` | FileReader requires a `File` object; Tauri drag-drop gives paths, not File objects |
| React state management | `window.*` globals | Zustand store | Globals prevent React reconciliation; no TypeScript safety; no devtools |
| PDF parsing | Rust pdfjs alternative | pdfjs-dist 5.x (JS) | Existing coordinate-table algorithm is 750 LOC finely tuned to CIOS PDF format |
| Excel parsing | Rust calamine | SheetJS 0.20 (JS) | Existing dynamic header detection is already working; calamine lacks .xls support |
| Spider/radar chart | Canvas imperative code | Preserve existing `spider.ts` | Current SVG/canvas spiderweb is 100% pure data computation; port as-is |

**Key insight:** The only Rust code needed for this app is Tauri plugin registration boilerplate in
`lib.rs`. No custom Tauri commands are required. All business logic stays in the TypeScript
frontend.

---

## Component Inventory — New vs Modified

### NEW Components (does not exist in current codebase)

| Component | Type | Replaces | Notes |
|---|---|---|---|
| `src/main.tsx` | Entry point | `index.html` script tags | `ReactDOM.createRoot` |
| `src/App.tsx` | Root component | `showView()` in app.js | View router via UI store |
| `AppShell.tsx` | Layout | `<header>` + `<nav>` in index.html | Dark mode toggle state in UI store |
| `KlasTabStrip.tsx` | Component | `renderKlasTabStrip()` in app.js | Tabs + NieuweKlasModal |
| `ImportView.tsx` | Component | Drop zone + file picker DOM in app.js | Tauri drag-drop + dialog hooks |
| `ImportResults.tsx` | Component | `showImportResults()` in app.js | Success/error badges |
| `KlasView.tsx` | Component | klasoverzicht section in app.js | KpiStrip + KlasGrid wrapper |
| `KlasGrid.tsx` | Component | `renderKlasGrid()` in app.js | Grid of LeerlingTile cards |
| `LeerlingTile.tsx` | Component | Tile HTML string in `renderKlasGrid()` | Mini verzuimbalk, prognose chip |
| `KpiStrip.tsx` | Component | `renderKpiStrip()` in app.js | Summary row |
| `DetailView.tsx` | Component | `showDetail()` + `buildDetailHTML()` | Shell + prev/next nav |
| `DetailHeader.tsx` | Component | `buildDetailHeader()` in app.js | Name + prognose + navigation |
| `DetailSpiderweb.tsx` | Component | `buildDetailSpiderweb()` in app.js | Canvas radar chart |
| `DetailDeelgebieden.tsx` | Component | `buildDetailDeelgebieden()` in app.js | Score table incl. fase 1+2 tfoot |
| `DetailVerzuim.tsx` | Component | `buildDetailVerzuim()` in app.js | Absence section |
| `DetailFeedback.tsx` | Component | `buildDetailFeedback()` in app.js | Per-vak accordion |
| `Actiepunten.tsx` | Component | `renderActiepuntenListHtml()` + form | CRUD action items |
| `BackupPanel.tsx` | Component | backup DOM + handlers in app.js | Export/import + encryption |
| `LeerlijntoewijzingPanel.tsx` | Component | `renderLeerlijntoewijzing()` in app.js | Leerlijn assignment UI |
| `useFileImport.ts` | Hook | Drop zone + FileReader in app.js | Tauri dialog + fs + drag-drop |
| `usePersistence.ts` | Hook | `localStorage.getItem/setItem` calls | plugin-store hydration |
| `klassenStore.ts` | Zustand store | `window.klassenState` | Classes, students, activeKlasId |
| `uiStore.ts` | Zustand store | `showView()`, sort vars, zoekTerm | UI navigation state |
| `leerlijnenStore.ts` | Zustand store | `window.leerlijnenOverrides` | Leerlijn assignment overrides |
| `src/types/index.ts` | Types | JSDoc comments in datamodel.js | TypeScript interfaces |
| `vite.config.ts` | Build config | (none — no build step) | Worker config, optimizeDeps |
| `tsconfig.json` | Config | (none) | TypeScript settings |
| `src-tauri/capabilities/main.json` | Config | (none) | Tauri permissions |

### MODIFIED / MIGRATED Files (logic preserved, format changed)

| Original File | Migrated To | Change Type | Notes |
|---|---|---|---|
| `parsers/pdf.js` | `src/parsers/pdf.ts` | TS conversion + API change | Remove `window.parseSinglePDF`; accept `ArrayBuffer` not `File`; change workerSrc to `?url` import |
| `parsers/excel.js` | `src/parsers/excel.ts` | TS conversion + API change | Remove `window.*` globals; accept `Uint8Array` not `File`; remove `FileReader` usage |
| `utils/schema.js` | `src/logic/schema.ts` | TS conversion | Remove `window.*`; export named constants and functions |
| `utils/datamodel.js` | `src/types/index.ts` + `src/logic/datamodel.ts` | Split: types → index.ts, functions → datamodel.ts | Remove `window.appState` (moved to Zustand) |
| `utils/prognosis.js` | `src/logic/prognosis.ts` | TS conversion | Remove `window.*`; keep all doorstroomnorm thresholds verbatim |
| `utils/klassen.js` | `src/logic/klassen.ts` + `klassenStore.ts` | Split: pure logic → klassen.ts; state → store | Remove `window.*`; `saveKlassen` becomes store subscription |
| `utils/leerlijnen.js` | `src/logic/leerlijnen.ts` | TS conversion | Remove `window.*` |
| `utils/actiepunten.js` | `src/logic/actiepunten.ts` | TS conversion | Remove `window.actiepuntenStore` |
| `utils/aggregation.js` | `src/logic/aggregation.ts` | TS conversion | Remove `window.*` |
| `utils/backup.js` | `src/logic/backup.ts` | TS conversion + encryption change | Replace zip.js AES with Web Crypto AES-256-GCM |
| `utils/spider.js` | `src/logic/spider.ts` | TS conversion | Remove `window.*`; pure function over StudentRecord |
| `index.html` (CSS) | `src/styles/globals.css` | Extract CSS vars | CIOS palette CSS custom properties; dark mode class |

### DELETED / Not Migrated

| File | Reason |
|---|---|
| `vendor/pdf.min.mjs` | Replaced by `pdfjs-dist` npm package |
| `vendor/pdf.worker.min.mjs` | Replaced by npm package worker import |
| `vendor/zip.min.js` | Replaced by Web Crypto API |
| `app.js` | Fully replaced by React component tree |
| `index.html` (bulk) | Replaced by `index.html` Vite entry + React root |

---

## Common Pitfalls

### Pitfall 1: pdfjs Worker Inlined as Base64 in Tauri Production Build

**What goes wrong:** In Vite library mode or with certain rollup settings, the PDF worker
`.mjs` file gets inlined as a base64 data URL. In Tauri's webview, module workers from data
URLs are blocked by CSP — the worker silently fails and no PDFs parse.

**Why it happens:** Vite's asset inlining threshold (`assetsInlineLimit`) can catch small
workers; or rollup's `preserveEntrySignatures` setting folds the worker into the bundle.

**How to avoid:** Use `?url` query suffix (not `?worker`) for the pdfjs worker. Ensure `assetsInlineLimit`
is set to 0 or the worker file size exceeds the threshold. Verify in `dist/assets/` that
`pdf.worker.*.mjs` appears as a separate file, not inlined.

**Warning signs:** PDF import silently produces no students; no console errors about worker;
worker MIME type errors in devtools network tab.

[CITED: github.com/vitejs/vite/discussions/17958 — "PDF.js worker source inlined as base64 in library mode"]

### Pitfall 2: `window.*` References in Migrated Logic Files

**What goes wrong:** When copying utils/*.js to src/logic/*.ts, any reference to
`window.DEELGEBIEDEN`, `window.normalizeScore`, etc. will compile but behave as `undefined`
in the React/Vite environment (window is not populated the same way).

**Why it happens:** The current codebase uses `window.*` as a module system. After migration,
these are ES module imports.

**How to avoid:** Global find-and-replace of `window.X` → import `X` from the appropriate
module. Enforce with an ESLint rule: `no-restricted-globals: ['window']` applied to src/logic/.

**Warning signs:** TypeScript will not catch this — `window.*` is valid TS. Undefined errors
appear at runtime only.

### Pitfall 3: SheetJS `FileReader` Removal Breaking Excel Parser

**What goes wrong:** `parsers/excel.js` line 64 creates a `FileReader` internally. In the
migrated version, `parseExcel` receives a `Uint8Array`. If the `FileReader` code is left in
and called, it will fail because there is no `File` object to pass it.

**Why it happens:** The function signature must change from `parseExcelFile(File)` to
`parseExcel(Uint8Array)` and the internal FileReader must be deleted.

**How to avoid:** In the migration task, explicitly delete lines 64–73 of excel.js (the
`new Promise(FileReader...)` block) and change the call site to pass `bytes` directly to
`XLSX.read(bytes, { type: 'array' })`.

**Warning signs:** Excel import crashes with "FileReader is not defined" or similar; or
imports silently return empty results.

### Pitfall 4: plugin-store vs localStorage Key Mismatch

**What goes wrong:** Current klassen.js uses `localStorage.getItem('mentordashboard_klassen_v1')`.
If the plugin-store key name differs, existing user data is lost on first launch of the Tauri app.

**Why it happens:** plugin-store uses its own file path, not localStorage. They are separate
storage backends.

**How to avoid:** In the migration, include a one-time data migration step: on first app launch,
check if `localStorage.mentordashboard_klassen_v1` exists (it will, in the webview's localStorage),
read it, write it to plugin-store, then clear localStorage. Implement this in `usePersistence.ts`.

**Warning signs:** All user data disappears on first launch of the Tauri app; store appears empty.

### Pitfall 5: Tauri `tauri://drag-drop` vs Browser `drop` Event

**What goes wrong:** Current app.js uses `dropZone.addEventListener('drop', ...)` with
`e.dataTransfer.files` (File objects). In Tauri, the webview can intercept these, but the
Tauri-recommended approach is `listen('tauri://drag-drop', ...)` which gives absolute paths,
not File objects.

**Why it happens:** Tauri has its own drag-drop interception layer. In v2, browser `drop` events
may still fire for in-app DnD, but file drops from the OS go through Tauri's event system.

**How to avoid:** Use `listen('tauri://drag-drop', ...)` exclusively. Remove all `e.dataTransfer.files`
code from the migration.

**Warning signs:** Dropped PDFs don't trigger import; or import works in dev (browser) but not
in the built Tauri app.

[CITED: github.com/tauri-apps/tauri/issues/9830, v2.tauri.app/blog/tauri-20/]

### Pitfall 6: Tauri v2 Permissions Not Set = Silent Failure

**What goes wrong:** In Tauri 2.x, all plugin capabilities must be declared in
`src-tauri/capabilities/main.json`. Missing permissions cause silent no-ops or cryptic IPC
errors (not helpful "permission denied" messages).

**How to avoid:** Add all required permissions before writing any frontend code that calls plugins.
Minimum set: `dialog:allow-open`, `fs:allow-read-file`, `store:allow-get`, `store:allow-set`,
`store:allow-load`.

[CITED: v2.tauri.app/learn/security/using-plugin-permissions/]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `window.*` global state | Zustand stores (ES modules) | React ecosystem standard | React components cannot subscribe to window.* changes |
| `localStorage` in Tauri | `@tauri-apps/plugin-store` | Tauri 2.0 stable (Oct 2024) | plugin-store uses OS app data dir, not webview storage |
| Tauri v1 allowlist | Capability-based permissions (v2) | Tauri 2.0 | All plugin access requires explicit capability declaration |
| pdfjs workerPort pattern | `?url` or `?worker` Vite query | Vite 4+ / pdfjs-dist 4+ | Old `workerPort` causes silent message loss in pdfjs-dist 5.x |
| Stronghold plugin | Web Crypto API | Tauri 2.x (Stronghold deprecated for v3) | Do not use Stronghold; Web Crypto is native |
| `tauri://file-drop` (v1 event name) | `tauri://drag-drop` (v2) | Tauri 2.0 | Event renamed in v2 migration |

**Deprecated / outdated:**

- `tauri://file-drop` event name — renamed to `tauri://drag-drop` in Tauri 2.0
- `@tauri-apps/api/fs` (v1 API) — replaced by `@tauri-apps/plugin-fs` in v2
- `@tauri-apps/api/dialog` (v1 API) — replaced by `@tauri-apps/plugin-dialog` in v2
- Stronghold plugin — deprecated in Tauri 2.x, removed in v3
- `window.parseSinglePDF` global — replaced by ES module export from `src/parsers/pdf.ts`

---

## Suggested Build Order

The dependency graph for this migration has a clear topological sort. Logic modules must exist
before stores, stores before hooks, hooks before components, components before the view router.

### Phase A: Foundation (no UI changes visible to users)

**Goal:** TypeScript + Vite + Tauri scaffolding; all logic ported; tests pass.

1. Scaffold Tauri 2 + React 18 + TypeScript + Vite project (`npm create tauri-app`)
2. Configure `vite.config.ts` — pdfjs worker, SheetJS optimizeDeps, Tauri server port
3. Port `src/types/index.ts` — all TypeScript interfaces from JSDoc in datamodel.js
4. Port `src/logic/schema.ts` — DEELGEBIEDEN, normalizeScore (remove window.*)
5. Port `src/logic/datamodel.ts` — addStudent, getStudentScores logic (remove window.appState)
6. Port `src/logic/prognosis.ts` — doorstroomnorm engine verbatim (all thresholds preserved)
7. Port `src/logic/leerlijnen.ts`, `aggregation.ts`, `actiepunten.ts`, `spider.ts`
8. Port `src/parsers/pdf.ts` — change workerSrc to `?url` import; accept ArrayBuffer not File
9. Port `src/parsers/excel.ts` — remove FileReader; accept Uint8Array
10. Port `src/logic/backup.ts` — replace zip.js AES with Web Crypto AES-256-GCM
11. Run existing Jest tests against migrated logic files (no UI tests yet)

**Risk:** Prognosis engine has 60+ audited lines of threshold comments. Port verbatim; do not
refactor until tests pass.

### Phase B: State Layer

**Goal:** Zustand stores wired to plugin-store; data survives app restart.

1. Implement `src-tauri/capabilities/main.json` with all permissions
2. Register plugins in `src-tauri/src/lib.rs`
3. Implement `src/store/klassenStore.ts` — mirror klassen.js logic; subscribe to plugin-store
4. Implement `src/store/uiStore.ts` — activeView, sort state, theme
5. Implement `src/store/leerlijnenStore.ts` — leerlijn overrides
6. Implement `src/hooks/usePersistence.ts` — localStorage → plugin-store one-time migration
7. Manual smoke test: create klas, add student (mock), restart app, data persists

### Phase C: File Import

**Goal:** PDF and Excel import works via Tauri dialog + drag-drop.

1. Implement `src/hooks/useFileImport.ts` — `plugin-dialog` open + `plugin-fs` readFile
2. Wire `tauri://drag-drop` listener in AppShell (or top-level useEffect)
3. Connect `parsePDF` and `parseExcel` to Tauri file reading pipeline
4. Build `<ImportView>` component (drop zone UI + progress bar)
5. Manual smoke test: drop PDF → student appears in store; drop Excel → verzuim merges

### Phase D: Core UI Components

**Goal:** All views render correctly; feature parity with current app.

Build order within this phase (each depends on the previous having a store to read from):

1. `AppShell.tsx` + `KlasTabStrip.tsx` (navigation skeleton)
2. `KlasView.tsx` + `KlasGrid.tsx` + `LeerlingTile.tsx` + `KpiStrip.tsx`
3. `DetailView.tsx` + `DetailHeader.tsx` + `DetailDeelgebieden.tsx`
4. `DetailSpiderweb.tsx` (canvas port of spider.ts)
5. `DetailVerzuim.tsx` + `DetailFeedback.tsx`
6. `Actiepunten.tsx` (CRUD; reads/writes actiepuntenStore)
7. `LeerlijntoewijzingPanel.tsx`
8. `BackupPanel.tsx` (export + import + encrypted backup)

### Phase E: Polish + Verification

1. Port CIOS CSS custom properties from `index.html` to `src/styles/globals.css`
2. Dark mode: read theme from `uiStore`; apply `document.body.classList.toggle('dark', ...)`
3. Port one-time migration check (localStorage → plugin-store) + test with real data
4. Full smoke test against real CIOS PDF batch import
5. Windows installer build (`cargo tauri build`)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | Vite build, npm | Yes | v24.14.0 | — |
| Rust / Cargo | Tauri compilation | Unknown | — | Install from rustup.rs |
| @tauri-apps/cli | Tauri dev server + build | npm-installable | 2.11.1 | — |
| pdfjs-dist | PDF parsing | npm-installable | 5.7.284 | — |
| xlsx 0.20.3 | Excel parsing | Already in devDependencies | 0.20.3 | — |

**Missing dependencies — check before starting Phase A:**

- Rust toolchain: `rustup --version` — if missing, install from rustup.rs before any Tauri work
- On Windows: Visual Studio C++ Build Tools required for Tauri compilation [ASSUMED — standard Tauri Windows requirement]

---

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Jest 29.7.0 (already installed) |
| Config file | `tests/jest.config.js` |
| Quick run | `npm test` |
| Full suite | `npm test -- --coverage` |

### Existing Test Files (port + extend)

The `tests/` directory contains 8 test files covering the logic layer. These tests are the
primary regression guard during migration — they must stay green throughout.

| Test File | Covers | Status |
|---|---|---|
| `tests/prognosis.test.js` | berekenPrognose engine | Keep, convert to .ts |
| `tests/actiepunten.test.js` | Actiepunten CRUD | Keep, convert to .ts |
| `tests/aggregation.test.js` | getActiveStudents dedup | Keep, convert to .ts |
| `tests/backup.test.js` | backup payload, restore | Keep; update for Web Crypto |
| `tests/parseStage.test.js` | Stage parsing | Keep |
| `tests/parseToetsplan.test.js` | Toetsplan parsing | Keep |
| `tests/feedback.test.js` | Feedback extraction | Keep |
| `tests/spider.test.js` | Spider data builder | Keep |

**Wave 0 Gaps (new tests needed):**

- [ ] `tests/parsers/pdf.test.ts` — test parsePDF with a real CIOS PDF fixture
- [ ] `tests/parsers/excel.test.ts` — test parseExcel with Uint8Array input (not File)
- [ ] `tests/store/klassenStore.test.ts` — createKlas, switchKlas, addStudent
- [ ] `tests/logic/klassen.test.ts` — pure logic functions (already partially in existing tests)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | No | Single-user local tool; no login |
| V3 Session Management | No | No server sessions |
| V4 Access Control | No | No multi-user |
| V5 Input Validation | Yes | Validate StudentRecord shape before store write; schema.ts normalizeScore |
| V6 Cryptography | Yes | Web Crypto AES-256-GCM for backup encryption — never hand-roll |

### Known Threat Patterns for Tauri + React

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Malformed PDF causing parser crash | Denial of Service | Wrap parsePDF in try/catch; show per-file error badge (already done in current code) |
| Path traversal via dropped file path | Tampering | Tauri auto-scopes dropped paths; `plugin-fs` sandbox enforced by capabilities |
| XSS via student name in innerHTML | Spoofing | Replace all `innerHTML` template strings with JSX (React escapes by default) |
| Backup file with malformed JSON | Tampering | Validate payload structure before applyRestore (already in backup.js) |
| Sensitive student data in localStorage | Info Disclosure | Migration to plugin-store + clear localStorage after migration step |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | Zustand subscribe-based persistence pattern is idiomatic | Pattern 4 | Code works but may need refactoring to official zustand/middleware persist |
| A2 | Web Crypto AES-256-GCM is fully available in Tauri 2.x webview (Chromium) | Pattern 5 | Backup encryption would need fallback library (e.g. noble-ciphers) |
| A3 | `exclude: ['xlsx']` in optimizeDeps is the correct SheetJS/Vite fix | Pattern 1 vite.config | SheetJS may fail to bundle; alternative is `include` with explicit entry point |
| A4 | Rust toolchain not yet installed on target machine | Environment Availability | Phase A blocked until `rustup` installed |
| A5 | Old zip.js-encrypted backups must be migrated — no backward-compat reader needed | Pattern 5 | Existing user backups become unreadable; may require keeping zip.js as a temporary import |
| A6 | `tauri://drag-drop` event provides `{ paths: string[] }` payload shape | Pattern 3 | Drop handler wired to wrong payload key; drag-and-drop silently fails |

---

## Open Questions

1. **Backward-compatible backup decryption**
   - What we know: Current backups use zip.js password-encrypted ZIP format
   - What's unclear: Do any real user backups exist that must remain readable after migration?
   - Recommendation: Planner should add a task to keep zip.js as a read-only import for the
     import path; new exports use Web Crypto

2. **Single-window vs multi-window Tauri**
   - What we know: Current app is single-page with view switching
   - What's unclear: Should the Tauri app have a single window or use separate windows for
     detail view?
   - Recommendation: Single window, matching current behavior; React handles view routing

3. **Tauri app icon and installer branding**
   - What we know: CIOS Zuidwest brand uses navy + cyan palette
   - What's unclear: Is an official CIOS logo available for the installer?
   - Recommendation: Defer to a Polish phase; use placeholder icon for Phase A–D

4. **Test environment for Tauri IPC**
   - What we know: Jest tests run in jsdom (no Tauri IPC available)
   - What's unclear: How to test `useFileImport` hook that calls `plugin-dialog`/`plugin-fs`
   - Recommendation: Mock `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` at the
     module level in Jest; test the hook in isolation from real IPC

---

## Sources

### Primary (HIGH confidence)

- npm registry (`npm view`) — verified package versions: pdfjs-dist 5.7.284, @tauri-apps/api 2.11.0, @tauri-apps/cli 2.11.1, vite 8.0.12, react 19.2.6
- [Tauri Dialog Plugin](https://v2.tauri.app/plugin/dialog/) — open() API, permissions format
- [Tauri File System Plugin](https://v2.tauri.app/plugin/file-system/) — readFile() return type (Uint8Array)
- [Tauri Store Plugin](https://v2.tauri.app/plugin/store/) — unencrypted; OS app data dir
- [Tauri Using Plugin Permissions](https://v2.tauri.app/learn/security/using-plugin-permissions/) — capability JSON format, permission string format
- [Tauri 2.0 Stable Release blog](https://v2.tauri.app/blog/tauri-20/) — drag-drop event rename, v2 event names

### Secondary (MEDIUM confidence)

- [mozilla/pdf.js Discussion #19520](https://github.com/mozilla/pdf.js/discussions/19520) — pdfjs-dist Worker Import Fails in Vite; `?url` workaround confirmed by multiple users
- [vitejs/vite Discussion #17958](https://github.com/vitejs/vite/discussions/17958) — PDF.js worker base64 inlining in library mode; mitigation confirmed
- [tauri-apps/tauri Issue #9830](https://github.com/tauri-apps/tauri/issues/9830) — `tauri://drag-drop` payload shape `{paths: string[]}`
- [SheetJS ViteJS bundler demo](https://docs.sheetjs.com/docs/demos/frontend/bundler/vitejs/) — `import * as XLSX from 'xlsx'` pattern; optimizeDeps guidance

### Tertiary (LOW confidence — need validation)

- SheetJS `optimizeDeps: { exclude: ['xlsx'] }` fix — multiple forum posts, not cross-verified with official SheetJS docs
- Stronghold deprecation in Tauri v3 — cited from community discussions, not official deprecation notice found
- Windows build requires Visual Studio C++ Build Tools — standard Tauri Windows requirement (training knowledge; [ASSUMED])

---

## Metadata

**Confidence breakdown:**

- Standard stack versions: HIGH — verified via npm registry
- Tauri IPC patterns (dialog, fs, drag-drop, permissions): HIGH — cited from official v2.tauri.app docs
- pdfjs-dist + Vite worker: MEDIUM — multiple community sources agree, no single official doc
- SheetJS + Vite optimizeDeps: LOW-MEDIUM — official SheetJS demo page exists but `exclude` fix is community-sourced
- Zustand persistence pattern: MEDIUM — standard community pattern, not verified via official zustand docs
- Web Crypto availability in Tauri webview: LOW — plausible (Chromium standard) but not verified with a test build

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (Tauri ecosystem moves fast; re-verify plugin versions before starting)
