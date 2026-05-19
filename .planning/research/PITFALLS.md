# Domain Pitfalls: v2.2 Feature Addition

**Domain:** Adding features to existing Tauri 2 + React + TypeScript + Vite app
**Researched:** 2026-05-19
**Scope:** Print-to-PDF, Onboarding Wizard, BPV Excel Parser, Rekenen/Nederlands, Drag-and-Drop fix

---

## 1. Print-to-PDF in Tauri 2

### Pitfall 1.1: `window.print()` Opens a New Window on Windows (WebView2)

**What goes wrong:** `window.print()` in Tauri 2 on Windows opens the Edge/Chromium **browser-style Print Preview dialog** as an overlay over the WebView. This works but cannot be controlled programmatically: you cannot set page title, suppress URL in header/footer, or pre-select "Save as PDF". The user sees the raw page URL in the print header.

**Risk:** HIGH — the print output will show `tauri://localhost/` (or the internal origin) as the page URL in the browser-injected header/footer. The mentor report looks unprofessional.

**Prevention:**
- Use CSS `@media print` with `@page { margin: 0; }` combined with a print-specific padding container. Setting margin to 0 (or < 8mm) suppresses the Chromium header/footer URL line entirely.
- Add `@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }` to preserve background colors (status badge colors, spider chart fill will be white without this).
- If full header/footer control is needed, use Tauri's `@tauri-apps/plugin-shell` or a Rust command wrapping WebView2's `CoreWebView2.PrintToPdf` — but that adds Rust scope. Start with the CSS `@page margin: 0` approach first; it resolves 90% of the problem.

---

### Pitfall 1.2: Print Captures the Entire DOM, Not Just the Detail View

**What goes wrong:** `window.print()` prints the **full page DOM** — including `KlasTabStrip`, the nav tabs, and any currently visible panels. The detail view component (`DetailWeergave`) is one child of `App.tsx`; there is no print isolation boundary by default.

**Risk:** HIGH — the printed output includes nav and unrelated UI chrome.

**Prevention:**
- Add a CSS rule: `@media print { body > * { display: none; } .print-target { display: block !important; } }`.
- Wrap the content to print in a `<div className="print-target">`.
- This approach works with the existing App.tsx view-conditional rendering. When `view === 'detail'`, only `DetailWeergave` is in the DOM (the others are conditionally excluded), so hiding everything except the print target is safe.
- Do NOT use `document.body.innerHTML = ...` swaps — that destroys React state.

---

### Pitfall 1.3: CSS Page Break Causes Truncated Sections

**What goes wrong:** `DetailWeergave` renders many stacked `detail-section` cards. Without explicit page break hints, Chromium's print engine will break mid-card — cutting a table or spider chart in half.

**Risk:** MEDIUM — cosmetic, but the primary value of the PDF is the "ready for the meeting" quality.

**Prevention:**
- Add `page-break-inside: avoid` (and the modern alias `break-inside: avoid`) to `.detail-section` in `@media print`.
- Add `page-break-before: always` on the deelgebied matrix section specifically (it is the widest element and benefits from starting on a fresh page).
- The spider charts row uses `flexWrap: wrap` — at A4 width (~794px print pixels) the three 180px charts still fit on one row. No change needed there.

---

### Pitfall 1.4: macOS WebKit Treats `@page` Margin Differently

**What goes wrong:** On macOS Tauri (WebKit), `@page { margin: 0 }` may not suppress the Safari-injected header/footer in the same way Chromium does. WebKit has historically been more restrictive.

**Risk:** LOW for this project (primary users are on Windows), but worth noting if the mentor uses a MacBook.

**Prevention:**
- Test on macOS before signing off. If header persists, the fallback is `@page { margin: 15mm }` with a printed `<header>` element in the DOM that visually replaces the browser line (mentor name, class, date).
- This is a known limitation with no CSS-only fix on WebKit; a custom printed header in the DOM is the industry standard workaround.

---

## 2. Onboarding Wizard State Management

### Pitfall 2.1: Step Data Lost on Back Navigation Due to Component Unmount

**What goes wrong:** If each wizard step is its own conditionally rendered component (`{step === 1 && <Step1 />}`), navigating back unmounts Step 2 and its local `useState` is destroyed. Navigating forward again shows a blank Step 2.

**Risk:** HIGH — the wizard's value comes from remembering partial input. A mentor who goes back to change the class name and then proceeds should not lose their uploaded PDFs.

**Prevention:**
- Store all wizard state in the **parent wizard component** (or in a `useReducer` at the wizard root), not inside individual step components.
- Use a single `wizardState: { step, klasNaam, pdfFiles, excelFile, stageFile, settings }` object lifted to the wizard container.
- Step components receive state as props and call `onUpdate(partial)` callbacks — they are pure presentational components.
- This matches the existing pattern in `App.tsx` (global view state) and `ImportPage.tsx` (centralized `importState`). Follow the same pattern.

---

### Pitfall 2.2: Partial Completion Leaves the App in an Inconsistent State

**What goes wrong:** If the user closes the wizard partway (e.g., after creating the class but before importing PDFs), the app has an empty class with no students. On next launch the wizard should resume, but if it does not detect the partial state, the user sees the empty class UI with no explanation.

**Risk:** MEDIUM — confusing for a first-run user.

**Prevention:**
- The wizard "done" flag should only be stored (via `plugin-store`) after the **final step completes** — not per-step.
- Check on app launch: if a class exists but has zero students, treat it as "wizard incomplete" and re-show the wizard rather than the empty klas view.
- The existing `App.tsx` already checks `getActiveStudents().length > 0` to decide between `'import'` and `'klas'` view. The wizard should hook into this same condition.

---

### Pitfall 2.3: Wizard State Survives React StrictMode Double-Invoke

**What goes wrong:** In development with React StrictMode (Vite default), `useEffect` runs twice on mount. If the wizard's initial step setup effect calls `createKlas()` on mount, it will create duplicate empty classes.

**Risk:** LOW in production (StrictMode is dev-only), but causes confusing bugs during development and testing.

**Prevention:**
- Do NOT call `createKlas()` in a `useEffect` on mount. Trigger class creation only on explicit user action (button click — "Volgende" on the class-name step).
- Follow the existing pattern in `ImportPage.tsx` where `autoDetectKlas` is called inside an event handler, never on mount.

---

### Pitfall 2.4: Wizard Intercepts the Normal Import Flow

**What goes wrong:** The wizard uses the same `parseSinglePDF` and `parseExcelFile` functions as `ImportPage`. If both the wizard and the normal import UI are mounted simultaneously (possible if the wizard is overlaid on top of the existing app), two concurrent `saveKlassen()` calls can interleave and corrupt the store.

**Risk:** MEDIUM — the existing `ImportPage` already has a guard (`if (importState.status === 'processing') return`), but the wizard bypasses this if it is a separate code path.

**Prevention:**
- Render the wizard **exclusively** — when the wizard is active, do not render `ImportPage` or any other content-modifying UI.
- The existing `view` state machine in `App.tsx` makes this natural: add `'onboarding'` as a view type and render it exclusively, the same way `'settings'` replaces the main content.
- Reuse `handleFiles` logic from `ImportPage` rather than reimplementing it in the wizard.

---

## 3. BPV Stage Excel Parser

### Pitfall 3.1: Stage Excel Sheet Name Not Matching Scoring Keywords

**What goes wrong:** The existing `parseExcelFile` scores sheets by keywords: `verzuim` (+3), `overzicht` (+2), `totaal` (+1), `leerling` (+1). A BPV stage export from a different system (e.g., Somtoday BPV module, Xedule, or a custom school export) likely has sheet names like `"Stage overzicht"`, `"BPV uren"`, `"Deelnemers"`, or `"Rapportage"`. None of these score high enough on the current verzuim keywords.

**Risk:** HIGH — the wrong sheet (or the first sheet) will be parsed, returning empty or incorrect records.

**Prevention:**
- Implement a **separate BPV parser** (`parsers/bpv-excel.ts`) with its own sheet-selection scoring that scores BPV-relevant keywords: `bpv` (+4), `stage` (+3), `uren` (+2), `deelnemer` (+1), `organisatie` (+1).
- Do NOT reuse `parseExcelFile` for BPV data — the column structures are entirely different.
- Use `debugExcelBestand()` (already exists in `excel.ts`) on the real BPV export file before writing the parser to confirm sheet names and column layout.

---

### Pitfall 3.2: BPV Hours May Be Stored as Numbers, Not as "107u24m" Strings

**What goes wrong:** The existing `parseVerzuimTime` handles the Dutch `"107u24m"` format. BPV stage hours are typically stored as plain decimal numbers (e.g., `107.5`) or as separate integer columns (`Uren goedgekeurd: 107`, `Minuten: 30`). Feeding these to `parseVerzuimTime` will work for plain numbers but will fail for split-column layouts.

**Risk:** MEDIUM — hours parse as 0 instead of the correct value.

**Prevention:**
- Inspect the actual BPV export file with `debugExcelBestand` before writing the parser.
- Parse BPV hours as a plain float if the column is numeric: `parseFloat(String(val)) * 60` (convert to minutes for consistency), or store directly as decimal hours if the `StageSection` renders hours.
- The `stageData` schema in `klassenState` currently has `urenGoedgekeurd` and `urenIngeleverd` fields — verify whether these are minutes or hours before writing the parser, then document the unit clearly.

---

### Pitfall 3.3: Student Name Matching Between BPV Excel and Imported PDF Records

**What goes wrong:** The BPV Excel will have student names in a format potentially different from the PDF-derived names in `klassenState`. The existing `mergeVerzuim` matches by `leerlingnummer`. If the BPV Excel does not include a student number column, or uses a different ID format, matching will fail silently — all BPV records show as "niet gevonden".

**Risk:** HIGH — especially if the BPV export is from a different system than the verzuim export.

**Prevention:**
- Check the BPV export for a student number column. If absent, implement fuzzy name matching (normalize case + whitespace + vowel diacritics, then exact match or Levenshtein distance 1).
- Log unmatched BPV records explicitly in the import result message (same pattern as `unmatched` in `mergeVerzuim`).
- The `cpexcel` registration in `excel.ts` is module-scoped and runs on import. The BPV parser MUST import from the same module or re-register cpexcel — do not assume it is already active just because `excel.ts` was imported first (module execution order is not guaranteed across dynamic imports).

---

### Pitfall 3.4: Dutch Date Columns Parsed as Excel Serial Numbers

**What goes wrong:** SheetJS parses Excel date cells as serial numbers (days since 1900-01-01) when not configured otherwise. A `Startdatum` column containing `2025-09-01` may arrive as `46065` (the serial number). The existing parser passes raw values through without date conversion.

**Risk:** MEDIUM — stage start/end dates will display as numbers in `StageSection`.

**Prevention:**
- Pass `{ cellDates: true }` to `XLSX.read()` in the BPV parser: `XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true })`. This tells SheetJS to convert date serials to JavaScript `Date` objects automatically.
- Then call `.toISOString().split('T')[0]` to get `YYYY-MM-DD` string format, which `formatDutchDate()` in `StageSection.tsx` already handles.
- Note: `cellDates: true` does not affect the existing `parseExcelFile` (verzuim) because that parser uses a separate `XLSX.read` call.

---

## 4. Rekenen & Nederlands in PDF Parser

### Pitfall 4.1: Rekenen/Nederlands Section Absent from Many PDFs

**What goes wrong:** Not all students have a Rekenen or Nederlands entry in their PDF — some students may only have BPV-track vakken, or the section may not appear in certain periods. If the parser assumes these vakken always exist and accesses `vakken.find(v => v.naam === 'Rekenen')` unconditionally, it returns `undefined` and crashes downstream.

**Risk:** HIGH — crashes the parser for a significant subset of students.

**Prevention:**
- Always treat `rekenen` and `nederlands` as **optional** fields on the student record: initialize to `null`.
- In `parseSinglePDF`, after building the `vakken` array, do: `const rekenVak = vakken.find(v => /rekenen/i.test(v.naam)) ?? null`.
- Never throw if absent. The doorstroomnorm calculation for Rekenen/Nederlands must gate on `rekenVak !== null`.
- Display "Geen Rekenen/Nederlands data" in the UI when null, consistent with how `StageSection` handles `stageData === null`.

---

### Pitfall 4.2: Rekenen/Nederlands Vak Name Varies Across PDF Generations

**What goes wrong:** The vak heading in the PDF may appear as `"Rekenen"`, `"Rekenen & Nederlands"`, `"Nederlands"`, `"Taal/Rekenen"`, or abbreviated forms. The existing `parseVakSections` relies on font-size-based heading detection — the vak name is stored as-is. An exact string match will miss variations.

**Risk:** MEDIUM — correct vak detected in test PDFs but fails in real-world exports.

**Prevention:**
- Use a regex for detection: `/rekenen|nederlands|taal/i.test(vak.naam)` rather than exact equality.
- Store the raw vak name and add a derived `type: 'rekenen' | 'nederlands' | null` field based on the regex match.
- Test against at least 3 real PDFs from different students/periods before shipping. Check if CIOS Zuidwest PDFs have separate "Rekenen" and "Nederlands" vak sections or a combined one.

---

### Pitfall 4.3: Rekenen/Nederlands Uses a Different Score Schema Than Deelgebieden

**What goes wrong:** The existing deelgebied scoring uses `V/G/E` (Voldoende/Goed/Excellent, mapped to `'onvoldoende'/'voldoende'/'goed'/'excellent'`). Rekenen/Nederlands may use a numeric scale (`1-10`), a pass/fail (`geslaagd/gezakt`), or a different letter grade. Feeding non-`V/G/E` scores into `normalizeScore()` returns `null`.

**Risk:** HIGH — all Rekenen/Nederlands scores show as null if the schema differs.

**Prevention:**
- Inspect the actual Rekenen/Nederlands section in a real CIOS PDF before writing the doorstroomnorm calculation.
- Add a separate `normalizeRekenScore(str)` function if the score format differs from the main deelgebied scale.
- The doorstroomnorm for Rekenen/Nederlands is a distinct rule (separate from the >= 13 deelgebieden rule) — implement it as a separate function, not by adding Rekenen to the deelgebied score set.

---

### Pitfall 4.4: Extending `StudentRecord` Type Breaks Encrypted Store Deserialization

**What goes wrong:** Adding `rekenScore` and `nederlandsScore` fields to the `StudentRecord` TypeScript type will work for new imports. However, previously stored (encrypted) records that lack these fields will deserialize correctly in TypeScript (the fields will be `undefined`) but any code that accesses them without a `?? null` fallback will crash.

**Risk:** MEDIUM — existing data migrated from v2.0/v2.1 will have undefined fields.

**Prevention:**
- Add new fields as optional with `null` default: `rekenScore?: RekenScore | null`.
- In every component and calculation that reads these fields, use `student.rekenScore ?? null` — never assume presence.
- This is the same pattern used when `stageData` was added: `klas?.stageData?.[leerlingId] ?? null` in `DetailWeergave.tsx`.

---

## 5. Drag-and-Drop Fix in Tauri 2

### Pitfall 5.1: Tauri's Internal Drag-Drop System Intercepts HTML5 Events

**What goes wrong:** This is the root cause of the Phase 16 UAT drag-and-drop bug. Tauri 2 has an **internal drag-and-drop system** that is **enabled by default**. When this system is active, it intercepts OS-level file drop events and routes them through `tauri://file-drop` (a Tauri event), bypassing the HTML5 `ondragover`/`ondrop` DOM events entirely. The `onDrop` handler in `ImportPage.tsx` never fires because the event never reaches the DOM.

**Risk:** CRITICAL — this is the current bug. The fix is a single config line.

**Prevention:** Add `"dragDropEnabled": false` to the window configuration in `tauri.conf.json`:

```json
"app": {
  "windows": [
    {
      "title": "Mentordashboard CIOS",
      "dragDropEnabled": false,
      ...
    }
  ]
}
```

With `dragDropEnabled: false`, Tauri's interceptor is disabled and the standard HTML5 `ondragover`/`ondrop` events fire normally in the WebView. The existing `onDragOver`, `onDrop`, and `onDragLeave` handlers in `ImportPage.tsx` will work without any JavaScript changes.

**Verification:** After adding this config, rebuild with `npm run tauri dev` (config changes require a restart). Test by dragging a PDF onto the drop zone.

---

### Pitfall 5.2: Document-Level Drop Prevention Must Be Preserved

**What goes wrong:** `App.tsx` already registers document-level `dragover` and `drop` event listeners that call `e.preventDefault()` to prevent the browser from navigating away when a file is dropped outside the drop zone. This is correct and must not be removed.

**Risk:** LOW — already present. Risk is accidental removal during the drag-drop fix.

**Prevention:**
- The document-level listeners in `App.tsx` (`preventNav` function) are a required companion to `dragDropEnabled: false`.
- Without them, dropping a file outside the `ImportPage` drop zone causes Tauri WebView to navigate to a `file://` URL (the dropped file), crashing the React app.
- Do not remove these listeners when fixing drag-drop. They serve a different purpose than the drop zone handlers.

---

### Pitfall 5.3: `dragDropEnabled: false` Has No Effect When Set on Dynamically Created Windows

**What goes wrong:** There is a documented Tauri 2 bug (issue #13761) where `dragDropEnabled` does not work when windows are created programmatically via `WebviewWindowBuilder` in Rust — only the `tauri.conf.json` declaration is reliable.

**Risk:** LOW — this project uses a single window declared in `tauri.conf.json`, not dynamic Rust window creation. Not applicable here, but relevant if the onboarding wizard creates a secondary window.

**Prevention:**
- Do not create secondary Tauri windows for the onboarding wizard. Use React conditional rendering within the single window (the existing view state machine approach).
- If a second window is ever needed, set `dragDropEnabled: false` via `WebviewWindowBuilder` AND verify it works in a test build.

---

### Pitfall 5.4: `e.dataTransfer.files` Is Empty on Some Tauri/WebView2 Configurations

**What goes wrong:** Even after setting `dragDropEnabled: false`, some WebView2 versions may deliver `dataTransfer.files` as an empty `FileList` (zero items) while `dataTransfer.items` contains the file entries. This is a WebView2-specific quirk documented in community reports.

**Risk:** LOW — most WebView2 versions handle `dataTransfer.files` correctly; this is an edge case on older Windows 10 installs.

**Prevention:**
- The `onDrop` handler in `ImportPage.tsx` checks `e.dataTransfer.files.length > 0` before calling `handleFiles`. If this is empty, add a fallback: read from `e.dataTransfer.items` instead.
- Only add this fallback if `files.length === 0` is observed during manual testing. Do not add unnecessary complexity upfront.

---

## Phase Applicability Summary

| Phase | Pitfall | Severity |
|-------|---------|----------|
| Print-to-PDF | 1.1 — Browser URL in print header | HIGH |
| Print-to-PDF | 1.2 — Entire DOM printed, not detail view only | HIGH |
| Print-to-PDF | 1.3 — Page break mid-card | MEDIUM |
| Print-to-PDF | 1.4 — macOS WebKit `@page` margin difference | LOW |
| Onboarding | 2.1 — Step state lost on back navigation | HIGH |
| Onboarding | 2.2 — Partial completion leaves empty class | MEDIUM |
| Onboarding | 2.3 — StrictMode double-invoke creates duplicate class | LOW |
| Onboarding | 2.4 — Concurrent `saveKlassen()` from wizard + import | MEDIUM |
| BPV Excel | 3.1 — Wrong sheet selected by scoring keywords | HIGH |
| BPV Excel | 3.2 — Hours stored as decimals, not "107u24m" | MEDIUM |
| BPV Excel | 3.3 — Student name/ID matching fails across systems | HIGH |
| BPV Excel | 3.4 — Date columns parsed as serial numbers | MEDIUM |
| Rekenen/NL | 4.1 — Section absent from many PDFs | HIGH |
| Rekenen/NL | 4.2 — Vak name varies across PDF generations | MEDIUM |
| Rekenen/NL | 4.3 — Different score schema than deelgebieden | HIGH |
| Rekenen/NL | 4.4 — New schema fields break old deserialized records | MEDIUM |
| Drag-drop fix | 5.1 — Tauri intercepts HTML5 drop (root cause) | CRITICAL |
| Drag-drop fix | 5.2 — Document-level drop prevention must be preserved | LOW |
| Drag-drop fix | 5.3 — Config only works in tauri.conf.json, not dynamic windows | LOW |
| Drag-drop fix | 5.4 — `dataTransfer.files` empty in some WebView2 versions | LOW |

---

## Sources

- [Tauri issue #9448: Drag & Drop events not firing on Windows](https://github.com/tauri-apps/tauri/issues/9448)
- [Tauri issue #14373: dragDropEnabled naming and documentation](https://github.com/tauri-apps/tauri/issues/14373)
- [Tauri issue #13761: dragDropEnabled not working with WebviewWindowBuilder](https://github.com/tauri-apps/tauri/issues/13761)
- [Tauri issue #3066: window.print() not working](https://github.com/tauri-apps/tauri/issues/3066)
- [Microsoft Learn: Printing from WebView2 apps](https://learn.microsoft.com/en-us/microsoft-edge/webview2/how-to/print)
- [Chrome for Developers: Add content to print margins using CSS](https://developer.chrome.com/blog/print-margins)
- [Tauri 2 Configuration Reference](https://v2.tauri.app/reference/config/)
- Codebase: `parsers/excel.ts`, `parsers/pdf.ts`, `src/components/ImportPage.tsx`, `src/App.tsx`, `src-tauri/tauri.conf.json` — all read directly (HIGH confidence)
