# Stack Research: v2.2 Feature Additions

**Project:** Mentordashboard CIOS
**Milestone:** v2.2 — Onboarding, Export & Data Completeness
**Researched:** 2026-05-19
**Overall confidence:** HIGH (all key findings verified against official Tauri docs and Rust API docs)

> Note: This file supersedes the v2.0 migration stack research for purposes of v2.2 planning.
> The existing stack (Tauri 2, React 19, TypeScript, Vite, SheetJS, pdfjs-dist, tauri-plugin-store, Vitest) is already installed and does not need to change.

---

## Executive Summary

**Net new stack additions for v2.2: zero.**

All five v2.2 features are achievable with the existing installed stack. The only change needed is a one-line `tauri.conf.json` key to fix drag-and-drop. No new npm packages, no new Cargo crates.

---

## Print-to-PDF

### Verdict: Use `window.print()` + CSS `@media print`. No new packages.

**Confidence:** HIGH — confirmed via official Tauri 2 Rust API docs at `docs.rs/tauri/latest/tauri/webview/struct.Webview.html`

The Tauri 2 `Webview` struct documentation states explicitly:

> "window.print() works on all platforms."

On Windows, the Edge WebView2 (which Tauri 2 uses) routes `window.print()` to the native Windows print dialog, which includes "Save as PDF" / "Microsoft Print to PDF" as a destination. The mentor does not need silent/headless PDF generation — they just need a print dialog where they pick "Save as PDF". This is exactly what `window.print()` delivers.

### Integration pattern

Add a print button to `DetailWeergave.tsx` and a `@media print` block to `index.css`:

```tsx
// In DetailWeergave.tsx
<button className="no-print" onClick={() => window.print()}>
  Afdrukken / Opslaan als PDF
</button>
```

```css
/* In index.css */
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  nav, .import-dropzone, .settings-btn { display: none !important; }
  @page { size: A4; margin: 20mm; }
  body { font-size: 11pt; color: #000; background: #fff; }
}
```

The `@media print` block hides UI chrome (navigation, import dropzone, buttons) and formats only the mentorgesprekverslag content for print. No JavaScript PDF generation needed.

### What NOT to add

| Package | Why to skip |
|---------|-------------|
| `@tauri-apps/plugin-printer` | Community plugin by chen-collab — not in official tauri-apps org, Windows-only, no stable release. The official print plugin feature request (plugins-workspace#293) is still open as of 2026-05. Unnecessary when `window.print()` works. |
| `react-to-print` (v3.3.0) | Uses `window.print()` internally, but its docs explicitly state "printing within a WebView is known to generally not work." It adds indirection over a direct `window.print()` call with no benefit, and introduces a failure mode. |
| `@react-pdf/renderer` or `react-pdf` | These generate PDFs programmatically via canvas (for complex programmatic layouts, e-invoices, etc.). For a print-preview use case, browser print-to-PDF is superior: preserves text selection, correct font rendering, no canvas rasterization. |
| New Cargo crate (e.g. `printpdf`) | Server-side PDF generation in Rust is architecturally wrong for this use case. The mentor wants to print the current screen view, not regenerate content from Rust. |

### No new `package.json` entries needed.
### No new `Cargo.toml` entries needed.

---

## Drag-and-Drop Fix

### Root cause

Tauri 2 intercepts OS-level file drop events at the webview level before they reach the HTML5 drag-and-drop system. The config key `dragDropEnabled` defaults to `true`, meaning Tauri's native handler consumes the drag event and the browser's `DataTransfer` never gets populated.

This is documented in the Tauri 2 reference:

> "Disabling it is required to use HTML5 drag and drop on the frontend on Windows."

The `ImportPage.tsx` `onDrop` handler is correctly written — it reads `e.dataTransfer.files`. The bug is that `e.dataTransfer.files` is always empty because Tauri intercepts the event upstream.

**Confidence:** HIGH — confirmed via `v2.tauri.app/reference/javascript/api/namespacewebview/` and GitHub issue #14373 (which documents the confusing naming and default-true behavior).

### Fix: One-line change to `tauri.conf.json`

Add `"dragDropEnabled": false` to the window object in `src-tauri/tauri.conf.json`:

```json
{
  "app": {
    "windows": [
      {
        "title": "Mentordashboard CIOS",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "useHttpsScheme": true,
        "dragDropEnabled": false
      }
    ]
  }
}
```

This disables Tauri's native handler and restores standard HTML5 `DataTransfer` behavior. The existing `onDrop` handler in `ImportPage.tsx` (lines 324–330) works correctly and requires no code changes.

### Why not use Tauri's native `onDragDropEvent` API instead

Tauri 2 offers an alternative API via `getCurrentWebview().onDragDropEvent()` (from `@tauri-apps/api/webview`) that provides `event.payload.paths: string[]` — OS absolute file paths. This approach keeps `dragDropEnabled: true`.

Reason to reject it for this app: The existing parsers (`handlePDFs`, `handleExcel`, `handleBackup`) all accept `File` objects and use `FileReader`/`arrayBuffer()` — standard browser File API. Switching to path-based drag-drop would require rewriting all parser call sites to use `@tauri-apps/plugin-fs` to read files by path. That is substantial rework for zero functional gain. Option A (config flag) costs one line; Option B costs ~50–100 lines of parser refactoring.

### No new `package.json` entries needed.
### No new `Cargo.toml` entries needed.

---

## Onboarding Wizard

### Verdict: Custom React component, no npm package.

**Confidence:** HIGH — standard React pattern assessment.

The onboarding wizard is a 4–5 step linear flow:

1. Klas aanmaken (class name input)
2. Voortgang PDFs importeren (drag existing ImportPage component)
3. Verzuim Excel importeren (drag existing ImportPage component)
4. Stage Excel importeren (optional)
5. Instellingen bevestigen (confirm/link to SettingsPage)

This is `useState<number>` for `currentStep` plus a `completed: boolean[]` array — approximately 80–120 lines of React. All existing page components (`ImportPage`, `SettingsPage`) can be reused inside the wizard steps. A third-party library adds bundle weight and styling conflicts with the existing CIOS CSS variables.

**First-run detection:** Use `tauri-plugin-store` (already installed at `^2.4.3`) to persist an `onboardingComplete: true` flag. Check in `App.tsx` on mount; show `OnboardingWizard` if flag is absent or false.

```typescript
// In App.tsx
const store = new Store('app-data.json'); // already instantiated for class data
const onboardingDone = await store.get<boolean>('onboardingComplete');
if (!onboardingDone) setShowOnboarding(true);
```

### Packages evaluated and rejected

| Package | Reason to skip |
|---------|---------------|
| `react-step-wizard` (v5.3.11) | Last published 4 years ago. Abandoned. |
| `NextStepjs` | Requires Framer Motion as peer dependency. Heavyweight for a 5-step linear flow. |
| `react-multistep` | Headless v6 is technically fine but adds abstraction with no gain over `useState`. |
| `SmartStepper` | Requires react-hook-form + Zod. Overkill. |
| Any library requiring `framer-motion` | Not installed, adds ~130 KB minified, overkill for CSS transitions. |

### No new `package.json` entries needed.
### No new `Cargo.toml` entries needed.

---

## BPV Stage Excel Parser (SheetJS — already installed)

SheetJS (`xlsx` 0.20.3) is already installed via CDN tarball. The BPV parser work is purely a code task: read the new `.xls` format, extract BPV hours per student. No stack change.

The existing `cpexcel` codepage table import pattern (required for legacy `.xls` files) must be preserved — see the v2.0 STACK.md for detail on this pitfall.

**No new packages needed.**

---

## Rekenen & Nederlands Voortgang (pdfjs-dist — already installed)

`pdfjs-dist` is already installed. Extending the PDF parser to extract Rekenen/Nederlands scores is a code task (add new regex/table extraction logic). The existing `workerSrc` setup must not be changed.

**No new packages needed.**

---

## Summary Table

| Feature | npm change | Cargo.toml change | tauri.conf.json change | Work type |
|---------|-----------|------------------|----------------------|-----------|
| Print-to-PDF | None | None | None | CSS `@media print` block + `window.print()` button in `DetailWeergave.tsx` |
| Drag-and-drop fix | None | None | Add `"dragDropEnabled": false` to `app.windows[0]` | Config only |
| Onboarding wizard | None | None | None | New `OnboardingWizard` React component + `tauri-plugin-store` flag (already installed) |
| BPV Excel parser | None | None | None | New parser logic using installed SheetJS |
| Rekenen/NL PDF parser | None | None | None | Extend existing parser using installed pdfjs-dist |

---

## What NOT to Add

| Package/Crate | Category | Reason |
|---------------|----------|--------|
| `@tauri-apps/plugin-printer` | Print | Community plugin, not official, Windows-only, open feature request in tauri-apps/plugins-workspace#293 |
| `react-to-print` | Print | Uses `window.print()` internally but documented as unreliable in WebViews — adds risk, not value |
| `@react-pdf/renderer` | Print | Canvas-based PDF generation; browser print-to-PDF is superior for screen-to-print use case |
| `printpdf` (Rust crate) | Print | Server-side PDF generation; wrong architecture for a print-preview feature |
| `react-step-wizard` | Onboarding | Abandoned (4 years, no updates) |
| `framer-motion` | Onboarding | Heavy dep, overkill for a simple wizard |
| `@tauri-apps/plugin-fs` | Drag-drop | Not needed; Option A (config flag) restores HTML5 DataTransfer without FS plugin |

---

## Sources

- Tauri 2 Webview Rust API (`window.print()` confirmation): https://docs.rs/tauri/latest/tauri/webview/struct.Webview.html
- Tauri 2 `onDragDropEvent` reference + `dragDropEnabled` note: https://v2.tauri.app/reference/javascript/api/namespacewebview/
- `dragDropEnabled` confusing-naming issue (behavior confirmed): https://github.com/tauri-apps/tauri/issues/14373
- `dragDropEnabled` v1→v2 rename discussion: https://github.com/tauri-apps/tauri/discussions/9696
- Tauri print API feature request (still open): https://github.com/tauri-apps/tauri/issues/4917
- Tauri plugins-workspace print plugin tracking issue (still open): https://github.com/tauri-apps/plugins-workspace/issues/293
- `react-to-print` WebView caveat (v3.3.0 README): https://github.com/MatthewHerbst/react-to-print
- chen-collab tauri-plugin-printer (community, Windows-only): https://github.com/chen-collab/tauri-plugin-printer
- Tauri PDF generation feature request (Jan 2025, open): https://github.com/tauri-apps/tauri/issues/12284

**Research date:** 2026-05-19
