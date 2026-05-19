# Research Summary: v2.2 Onboarding, Export & Data Completeness

**Project:** Mentordashboard CIOS
**Researched:** 2026-05-19
**Confidence:** HIGH (stack/architecture/pitfalls); MEDIUM (BPV column names, RNL PDF format — missing sample files)

---

## Executive Summary

v2.2 adds five deliverables to the existing Tauri 2 + React + TypeScript app. **Zero new dependencies** — no new npm packages, no new Cargo crates. The only config change is one line in `tauri.conf.json` which resolves the drag-and-drop bug entirely.

Build order is driven by hard dependencies and risk: drag-drop fix first (unblocks all import paths), print-to-PDF second (zero-dependency quick win), BPV parser and RNL section third/fourth (both partially blocked on sample files), onboarding wizard last (wraps all other flows).

---

## 1. Stack Additions

**Verdict: No new dependencies.**

| Feature | npm | Cargo.toml | tauri.conf.json |
|---------|-----|-----------|----------------|
| Drag-and-drop fix | None | None | `"dragDropEnabled": false` |
| Print-to-PDF | None | None | None |
| BPV Excel parser | None | None | None |
| Rekenen & Nederlands | None | None | None |
| Onboarding wizard | None | None | None |

Explicitly rejected: `@tauri-apps/plugin-printer` (Windows-only, unstable), `react-to-print` (documented unreliable in WebViews), `react-step-wizard` (abandoned 4 years), `framer-motion` (130 KB overkill).

---

## 2. Feature Table Stakes

### BUG-01 — Drag-and-Drop
- `"dragDropEnabled": false` in `app.windows[0]` in `tauri.conf.json`
- Document-level `preventDefault` listeners in `App.tsx` must be **preserved** (prevent browser navigation on accidental drops — not the bug)
- Requires `npm run tauri dev` restart after config change

### EXP — Print-to-PDF
- `window.print()` works in Tauri 2 WebView2 (confirmed: docs.rs/tauri)
- Print-only `<header>` showing leerlingnaam, klas, datum
- `@media print { body > * { display: none; } .print-target { display: block !important; } }`
- `@page { size: A4; margin: 2cm; }` — suppresses Chromium URL header/footer
- `break-inside: avoid` on `.detail-section`
- `print-color-adjust: exact` — preserves RAG badge colors
- "Afdrukken" button in `DetailWeergave.tsx` header

### BPV — Stage Excel Parser
- Separate `parseBpvExcel()` in `utils/bpv.ts` — do NOT reuse `parseExcelFile`
- Separate sheet-scoring keywords: `bpv` (+4), `stage` (+3), `uren` (+2)
- `debugBpvExcel()` helper must run on real file before writing column matchers
- `XLSX.read({ cellDates: true })` for date columns
- Graceful fallback: `gerealiseerdeUren = 0` if column not found

### RNL — Rekenen & Nederlands
- MBO-3 national norms: Rekenen 2F voldoende, Nederlands 2F voldoende (rijksoverheid.nl confirmed)
- New optional fields on `StudentRecord`: `rekenResultaat?: string | null`, `nederlandsResultaat?: string | null`
- `AanvullendSection` manual dropdowns preserved unchanged
- PDF extraction is best-effort (section absent from many PDFs) — `null` fallback, no throw
- `normalizeRekenScore()` separate from `normalizeScore()` — score format may differ from V/G/E

### ONB — Onboarding Wizard
- 5 steps: klas aanmaken (required) → PDFs (required) → verzuim Excel (optional) → stage Excel (optional) → instellingen (optional)
- Add `'onboarding'` to `view` union in `App.tsx`
- First-run detection: `Object.keys(klassenState.klassen).length === 0` in startup `useEffect`
- All wizard state lifted to parent `OnboardingWizard` — step components are purely presentational
- "Overslaan" button on steps 3–5
- **Do NOT mount full `<ImportPage />` inside wizard steps** — use stripped-down inline dropzones with wizard-internal handlers
- `onboardingComplete: true` persisted to store only after final step

---

## 3. Architecture Decisions

**New files:** `src/components/OnboardingWizard.tsx`, `src/components/RekenenNederlandsSection.tsx`

**Modified files:** `src-tauri/tauri.conf.json`, `src/App.tsx`, `src/components/ImportPage.tsx`, `src/components/DetailWeergave.tsx`, `src/components/AanvullendSection.tsx`, `src/index.css`, `parsers/pdf.ts`, `utils/bpv.ts`, `utils/schema.ts`

**`App.tsx` view union:** `'import' | 'klas' | 'detail' | 'settings'` → adds `'onboarding'`

**BPV import routing:** Filename heuristic `/bpv|stage|praktijk/i.test(name)` routes to `handleBpvExcel()` in `ImportPage`; all other `.xls` → existing `handleExcel()`

**RNL section placement:** After `AanvullendSection`, before `StageSection` in `DetailWeergave`

**BPV storage:** `bpv_data` store key holds `{ [leerlingId]: { gerealiseerdeUren } }` — does not merge with `stageData` until real file confirms structure

---

## 4. Watch Out For — Top 5 Pitfalls

**1. CRITICAL — Tauri drag-drop interceptor blocks HTML5 events**
`e.dataTransfer.files` is always empty in Tauri 2 by default. Fix: `"dragDropEnabled": false` in `tauri.conf.json`. Do NOT remove document-level `preventDefault` listeners in `App.tsx`.

**2. HIGH — `window.print()` captures full DOM, not just DetailWeergave**
Fix: `.print-target` wrapper + `@media print { body > * { display: none; } }`. `@page { margin: 0 }` suppresses Chromium's injected URL in print header.

**3. HIGH — Wizard step state lost on back navigation**
`useState` in step components is destroyed on unmount. Fix: lift all state to parent `wizardState` — step components accept props, call `onUpdate(partial)`.

**4. HIGH — BPV Excel selects wrong sheet**
Existing sheet scorer keywords (`verzuim`, `totaal`, `overzicht`) miss BPV sheet names (`"BPV uren"`, `"Deelnemers"`). Fix: separate sheet-scoring function for BPV.

**5. HIGH — Rekenen/Nederlands absent from many PDFs**
Fields must be `string | null` everywhere. `?? null` fallback required on all deserialized old records (missing field on encrypted store data).

---

## 5. Blocked Features

| Feature | Blocked on | Impact if delayed |
|---------|-----------|-------------------|
| BPV column matchers (BPV-01) | Real BPV Excel export file | Scaffold proceeds; `gerealiseerdeUren` shows 0 until unblocked |
| RNL PDF extraction (RNL-04) | Real PDF with Rekenen/Nederlands section | Manual entry works without it; extraction is additive |

---

## 6. Recommended Phase Order

| Phase | Feature | Rationale |
|-------|---------|-----------|
| 20 | BUG-01 Drag-and-Drop Fix | One config line; unblocks all file import paths |
| 21 | EXP-01..04 Print-to-PDF | Zero dependencies; quick win |
| 22 | BPV-01..04 Stage Excel Parser | Scaffold now, column matchers when sample file arrives |
| 23 | RNL-01..04 Rekenen & Nederlands | Data model + UI now; PDF extraction additive |
| 24 | ONB-01..08 Onboarding Wizard | Wraps all prior features; build last |

---

*Sources: Tauri 2 Rust API docs, tauri.conf.json schema, GitHub issues #9448 + #14373, rijksoverheid.nl, examenbladmbo.nl, PatternFly wizard design guidelines, direct codebase inspection.*
