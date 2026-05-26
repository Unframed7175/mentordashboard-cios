# Phase 28: Bug/Feedback Rapportage - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a 🐛 feedback button to the `KlasTabStrip` nav bar that opens a compact modal. The tester types an optional description, clicks Verstuur, and the app opens their default email client with a pre-filled mailto: containing OS info, app version, last import action, and the last 10 console errors. The email goes to `ralvarezstam@cioszuidwest.nl`.

**In scope:**
- 🐛 emoji button in `KlasTabStrip` nav bar, next to ⚙, with `title="Fout melden"` tooltip
- `FeedbackModal` component: textarea ("Beschrijf het probleem"), Verstuur + Annuleren buttons
- `utils/feedback.ts` module: ring buffer (last 10), `setLastImport()`, `buildMailtoUrl()`, `getSystemInfo()`
- Console error capture: `console.error` patch + `window.onerror` in `main.tsx` (before React renders)
- mailto: subject `[Bug] Mentordashboard v{version} — {OS}`, body includes description + OS + version + last import + console errors
- ImportPage calls `setLastImport({ filename, type })` on each successful import

**Out of scope:**
- Any server-side feedback collection
- Screenshots or file attachments
- In-app error notification toasts from the ring buffer
- Viewing past submitted reports in the app

</domain>

<decisions>
## Implementation Decisions

### Button placement & label (D-01 – D-03)

- **D-01:** The feedback button is a **🐛 emoji character** (same approach as ⚙ and × already used in the nav). No SVG needed.
- **D-02:** The button lives in **`KlasTabStrip`** nav bar, next to the ⚙ settings button. Always visible from every view that renders KlasTabStrip.
- **D-03:** The button has `title="Fout melden"` as a tooltip — same pattern as the existing gear button's `title` attribute.

### Feedback modal flow (D-04 – D-07)

- **D-04:** Clicking 🐛 opens a **compact modal** with a `<textarea>` labeled "Beschrijf het probleem", plus **Verstuur** and **Annuleren** buttons. No slide-down panel, no direct mailto: shortcut.
- **D-05:** Description is **optional** — Verstuur is always enabled. The auto-collected technical context (OS, errors) is valuable even without a description.
- **D-06:** Clicking Verstuur **builds the `mailto:` URL client-side** and opens it via `window.location.href = mailtoUrl` (or `open()`). The email client opens; the modal closes. No server call.
- **D-07:** Email subject: **`[Bug] Mentordashboard v{version} — {OS}`** where `{version}` comes from `getVersion()` (`@tauri-apps/api/app`) and `{OS}` from `tauri-plugin-os`.

### Console error ring buffer (D-08 – D-10)

- **D-08:** The ring buffer captures the **last 10 entries**. Initialized in **`main.tsx`** at the top of the file, before `ReactDOM.createRoot()`, so errors from initial load are captured.
- **D-09:** Two capture hooks: **`console.error` patch** (replace original, push to buffer, call original) + **`window.onerror`** handler (for uncaught exceptions). Both feed the same ring buffer array.
- **D-10:** If the ring buffer is empty when Verstuur is clicked: email body includes the line **"Geen console errors geregistreerd"** in the errors section. Never omit the section — so the developer knows capture was active.

### Last import tracking (D-11 – D-12)

- **D-11:** "Last import action" = **last single file**: `{ filename: string, type: 'PDF' | 'Excel' | 'zip', timestamp: string }`. E.g., `"rapport-2B.pdf (PDF), 2026-05-26 19:35"`.
- **D-12:** Tracked in **`utils/feedback.ts`** as a module-level variable. `ImportPage` calls `setLastImport({ filename, type })` after each successful import (PDF add, Excel merge, zip restore). If no import has happened yet: email body shows "Geen importactie geregistreerd".

### Developer email address (D-13)

- **D-13:** mailto: recipient is **`ralvarezstam@cioszuidwest.nl`** — hardcoded constant in `utils/feedback.ts`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing UI integration points
- `src/components/KlasTabStrip.tsx` — Add 🐛 button next to ⚙ (line ~125). Follow the same `<button className="nav-tab ...">` pattern as the settings button. Pass `onFeedback: () => void` prop from App.tsx.
- `src/App.tsx` — Wire `onFeedback` prop to KlasTabStrip; manage `feedbackOpen: boolean` state to show/hide `FeedbackModal`.
- `src/components/ImportPage.tsx` — Call `setLastImport()` from `utils/feedback.ts` after each successful import (addStudent/PDF batch, mergeVerzuim/Excel, applyBackupRestore/zip).
- `src/main.tsx` — Install console.error patch + window.onerror handler at the top (before ReactDOM.createRoot).

### New files to create
- `src/components/FeedbackModal.tsx` — Modal component with textarea, Verstuur, Annuleren.
- `utils/feedback.ts` — Ring buffer, setLastImport, buildMailtoUrl, getSystemInfo. All pure TypeScript, no React.

### Tauri APIs (already available in Tauri 2 — no new deps needed)
- `@tauri-apps/api/app` → `getVersion()` — reads app version from `tauri.conf.json`
- `tauri-plugin-os` → `platform()`, `version()` — OS name and version. Already in `Cargo.toml` and capabilities per STATE.md design notes.

### Requirements
- `.planning/REQUIREMENTS.md` §FEED — FEED-01 through FEED-05

### Style & patterns
- `src/index.css` — `.nav-tab` pattern for the 🐛 button. Use existing modal CSS if a `.modal-overlay` / `.modal-content` class exists; otherwise add minimal styles alongside existing modal patterns.
- `src/components/KlasModal.tsx` — Existing modal implementation; use it as the style reference for `FeedbackModal` (same overlay + dialog structure).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KlasModal.tsx` — Existing modal with overlay + dialog box. Use as the structural template for `FeedbackModal`. Avoids introducing a new modal pattern.
- `KlasTabStrip.tsx` ⚙ button (line ~125) — The settings button is the direct pattern to clone for the 🐛 button. Same `className`, same `title` attribute, same `onClick` callback prop.
- `getVersion()` from `@tauri-apps/api/app` — already used in Phase 15 bundle config; confirm import path before adding.
- `setRefreshKey(k => k + 1)` pattern in `App.tsx` — NOT needed here (feedback does not mutate klas data), but the `useState` + callback prop pattern is the right model for `feedbackOpen`.

### Established Patterns
- **Nav button props in KlasTabStrip** — every global action (switch, create, settings) is passed as a callback prop from `App.tsx`. Add `onFeedback: () => void` the same way.
- **Modal state in App.tsx** — `KlasModal` open/close is managed with `showKlasModal` state in App.tsx. Follow the same pattern for `feedbackOpen`.
- **Pure utils modules** — `utils/klassen.ts`, `utils/settings.ts`, `utils/bpv.ts` are all side-effect-free module-level state + exported functions. `utils/feedback.ts` follows the same convention.

### Integration Points
- `main.tsx` → installs ring buffer before React mounts
- `ImportPage.tsx` → calls `setLastImport()` after each import success path
- `App.tsx` → owns `feedbackOpen` state, passes `onFeedback` to KlasTabStrip, renders `<FeedbackModal>`
- `KlasTabStrip.tsx` → renders 🐛 button, fires `onFeedback` prop
- `FeedbackModal.tsx` → calls `buildMailtoUrl()` from `utils/feedback.ts` on Verstuur

</code_context>

<specifics>
## Specific Ideas

- The 🐛 button should sit **between the ⚙ settings button and any other far-right nav elements** — or directly to the left of ⚙ — so it doesn't break the existing layout.
- `buildMailtoUrl()` should URL-encode the entire body. `encodeURIComponent()` on the full body string is sufficient; no need for a library.
- Email body format (top-to-bottom):
  1. Tester's description (or blank section labeled "Beschrijving:")
  2. `--- Technische info ---`
  3. OS: {platform} {version}
  4. App-versie: {version}
  5. Laatste import: {filename} ({type}), {timestamp} — or "Geen importactie geregistreerd"
  6. `--- Console errors (laatste 10) ---`
  7. Each error on its own line, or "Geen console errors geregistreerd"
- The ring buffer should store error messages as strings (first 200 chars each to cap mailto: length).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 28-bug-feedback-rapportage*
*Context gathered: 2026-05-26*
