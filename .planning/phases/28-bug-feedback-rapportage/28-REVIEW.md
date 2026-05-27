---
phase: 28-bug-feedback-rapportage
reviewed: 2026-05-27T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - utils/feedback.ts
  - tests/feedbackUtils.test.ts
  - src/main.tsx
  - src/App.tsx
  - src/components/FeedbackModal.tsx
  - src/components/ImportPage.tsx
  - src/components/KlasTabStrip.tsx
  - src/index.css
  - tests/FeedbackModal.test.tsx
  - tests/KlasTabStrip.test.tsx
  - package.json
  - src-tauri/Cargo.toml
  - src-tauri/capabilities/default.json
findings:
  critical: 0
  warning: 0
  info: 1
  total: 1
status: fixed
---

# Phase 28: Code Review Report

**Reviewed:** 2026-05-27
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 28 introduces a feedback/bug-reporting pipeline: a ring-buffer that captures console errors and uncaught rejections, a `buildMailtoUrl` helper that assembles a pre-filled email body, a `FeedbackModal` UI component, and wiring in `main.tsx` / `ImportPage` / `KlasTabStrip`. The overall design is sound and the happy path works correctly. Three bugs compromise reliability or correctness: the mailto: body-length budget is applied before URL-encoding (so the actual URL can be 2-3× longer than intended, risking OS shell truncation on Windows), the hard-truncate fallback produces a body that is still 32 chars over its own stated limit, and `@tauri-apps/api` is declared only as a `devDependency` yet is imported at runtime. Two test methods fire promises without awaiting them, making their assertions silent no-ops. Additional warnings cover missing `setLoading(false)` on the success path, an undefined CSS variable, missing `setLastImport` on BPV success, and emoji icon usage that violates the project's own UI skill rules.

---

## Critical Issues

### CR-01: mailto: body-length limit enforced on raw text, not on the encoded URL

**File:** `utils/feedback.ts:136-159`

**Issue:** `buildMailtoUrl` compares `body.length` against `1500` to decide whether to truncate. However the body is later passed through `encodeURIComponent`, which expands newlines to `%0A` (3 chars), brackets to `%5B`/`%5D`, spaces to `%20`, etc. A body that consists heavily of log lines (containing `[`, `]`, `\n`, spaces) can double or triple in length after encoding. A 1500-char raw body with typical error-log content produces an encoded body of ~3000 chars, giving a total mailto: URL of roughly 3100+ chars. Windows `ShellExecute` (which Tauri's `plugin-opener` calls on Windows) has a practical limit of ~2048 chars; URLs exceeding that are silently truncated or fail to open the correct email body.

**Fix:** Apply the length budget to `encodeURIComponent(body).length`, not `body.length`. A safe upper bound for just the encoded body is around 1800 raw chars (encodes to ~2000) leaving room for the scheme, recipient, and subject. Alternatively, budget the entire URL:

```ts
const MAX_ENCODED_BODY = 1800; // raw chars — encodes to ≤ ~2000

// Replace the existing `if (body.length <= 1500)` check with:
if (encodeURIComponent(body).length <= MAX_ENCODED_BODY) {
  return `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// And the hard truncate guard at line 154:
if (encodeURIComponent(body).length > MAX_ENCODED_BODY) {
  // Binary-search or iterative slice until encoded length fits
  let safe = body.slice(0, 1200) + '...\n[ingekort wegens e-mail limiet]';
  while (encodeURIComponent(safe).length > MAX_ENCODED_BODY) {
    safe = safe.slice(0, safe.length - 50) + '...\n[ingekort wegens e-mail limiet]';
  }
  body = safe;
}
```

---

### CR-02: Hard-truncate fallback produces a body that still exceeds 1500 chars

**File:** `utils/feedback.ts:155-156`

**Issue:** The hard-truncate path does:
```ts
body = body.slice(0, 1497) + '...\n[ingekort wegens e-mail limiet]';
```
The truncation marker `'...\n[ingekort wegens e-mail limiet]'` is 35 characters long. The result is `1497 + 35 = 1532` chars — 32 chars over the 1500-char ceiling the code is trying to enforce. This is an off-by-one math error in the comment ("Hard truncate to 1497 + ellipsis").

**Fix:** Reserve room for the marker before slicing:
```ts
const MARKER = '...\n[ingekort wegens e-mail limiet]';
body = body.slice(0, 1500 - MARKER.length) + MARKER; // = slice(0, 1465) — result: exactly 1500 chars
```

---

### CR-03: `@tauri-apps/api` imported at runtime but declared only as `devDependency`

**File:** `package.json:26` / `utils/feedback.ts:7`

**Issue:** `utils/feedback.ts` imports `getVersion` from `@tauri-apps/api/app`:
```ts
import { getVersion } from '@tauri-apps/api/app';
```
`@tauri-apps/api` appears only under `devDependencies` in `package.json`. In a standard Vite/npm build, `devDependencies` are available during build but are not guaranteed to be installed in CI pipelines that run `npm install --production`, and IDEs / build tools that analyze the package graph may warn or error. For a Tauri app bundled by Vite, the module is currently bundled at build time regardless of dep category, but if CI ever uses `--omit=dev` or a lock-file audit, the import will break silently. The other Tauri plugin imports (`@tauri-apps/plugin-os`, `@tauri-apps/plugin-opener`) are correctly in `dependencies`.

**Fix:** Move `@tauri-apps/api` from `devDependencies` to `dependencies` in `package.json`:
```json
"dependencies": {
  "@tauri-apps/api": "^2.11.0",
  "@tauri-apps/plugin-opener": "^2.5.4",
  ...
}
```
Remove it from `devDependencies`.

---

## Warnings

### WR-01: Two tests in `feedbackUtils.test.ts` fire promises without awaiting — assertions are silent no-ops

**File:** `tests/feedbackUtils.test.ts:130-137` and `tests/feedbackUtils.test.ts:142-148`

**Issue:** Both "pushConsoleError truncates at 200 chars per entry" and "ring buffer entries include timestamp prefix" call `buildMailtoUrl('').then(url => { ... expect(...) ... })` without returning or awaiting the promise. In Vitest (v4), a synchronous `it()` callback that returns `undefined` is considered complete immediately; the `.then()` microtask runs after the test has already been marked as passed. If the `expect()` inside fails, Vitest may or may not attribute the unhandled rejection to the correct test, depending on timing — in practice the test always "passes" regardless of the assertion outcome. These tests do not actually verify what they claim.

**Fix:** Add `return` before `buildMailtoUrl(...)` so Vitest receives the promise and waits for it, or rewrite as `async`/`await`:

```ts
it('pushConsoleError truncates at 200 chars per entry', async () => {
  const longString = 'x'.repeat(300);
  pushConsoleError([longString]);
  const url = await buildMailtoUrl('');
  const { body } = decodeMailto(url);
  const match = body.match(/x+/);
  const longestRun = match ? match[0].length : 0;
  expect(longestRun).toBeLessThanOrEqual(200);
});

it('ring buffer entries include timestamp prefix', async () => {
  pushConsoleError(['hello']);
  const url = await buildMailtoUrl('');
  const { body } = decodeMailto(url);
  expect(body).toMatch(/\[\d{2}:\d{2}:\d{2}\] hello/);
});
```

---

### WR-02: `setLoading(false)` never called on success path in `FeedbackModal`

**File:** `src/components/FeedbackModal.tsx:14-27`

**Issue:** On the success path, `handleVerstuur` calls `setLoading(true)`, then `buildMailtoUrl`, then `openUrl`, then `onClose()`. `setLoading(false)` is never called before `onClose()`. The component is currently always unmounted by `onClose()` (via `setFeedbackOpen(false)` in `App.tsx`), so there is no visible bug today. However, this is a latent defect: if any parent ever decides to keep the component mounted after a successful send (e.g., a "send another" pattern, or a unit test that mocks `onClose` as a no-op), the button remains permanently disabled with no visual feedback. It also makes the component non-reusable.

**Fix:** Call `setLoading(false)` before `onClose()`:
```ts
await openUrl(url);
setLoading(false);
onClose();
```

---

### WR-03: CSS variable `--border-color` is undefined; textarea always uses fallback `#ccc`

**File:** `src/index.css:1491`

**Issue:** The `.feedback-modal-textarea` rule references `var(--border-color, #ccc)`, but the design token system defines `--border-default` (not `--border-color`). Since `--border-color` is never set on `:root` or `body.dark`, the CSS fallback `#ccc` is always used. In dark mode, `#ccc` is a light grey border on a dark surface — it has poor contrast and ignores the dark-mode design tokens entirely.

**Fix:**
```css
.feedback-modal-textarea {
  border: 1px solid var(--border-default);   /* was: var(--border-color, #ccc) */
  ...
}
```
Also add a focus style to complete the form-focus pattern used elsewhere:
```css
.feedback-modal-textarea:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px var(--accent-light);
}
```

---

### WR-04: BPV import success path does not call `setLastImport`

**File:** `src/components/ImportPage.tsx:252-259`

**Issue:** After a successful BPV Excel import, `setLastImport` is never called (compare lines 177 for PDF and line 215 for regular Excel). The feedback email will show `'Geen importactie geregistreerd'` even when a user reports a bug immediately after importing BPV data, losing the most relevant context for debugging BPV-related issues.

**Fix:** Add `setLastImport` after the successful save:
```ts
const count = Object.keys(bpvData).length;
setImportState(prev => ({
  ...prev,
  status: 'done',
  messages: [...prev.messages, `BPV-data verwerkt: ${count} leerling${count !== 1 ? 'en' : ''}`],
}));
setLastImport({ filename: file.name, type: 'Excel' });  // add this line
```

---

### WR-05: Emoji characters used as UI icons in `KlasTabStrip`

**File:** `src/components/KlasTabStrip.tsx:131` and `src/components/KlasTabStrip.tsx:141`

**Issue:** The feedback button uses `🐛` and the settings button uses `⚙` as their visible content. The project's own UI skill (`SKILL.md`) explicitly lists `no-emoji-icons` as a rule: "Use SVG icons, not emojis." Emoji rendering is font-stack dependent and inconsistent across Windows/macOS/Linux. The `⚙` character (U+2699 GEAR) in particular renders as a hollow glyph on many Windows font stacks unless the emoji font is present. Both buttons have `aria-label` attributes so screen-reader accessibility is preserved, but the visual inconsistency and skill-rule violation remain.

**Fix:** Replace emoji content with inline SVG or a CSS-styled element. The settings button already exists across the codebase so it likely has prior art:
```tsx
{/* Feedback button — replace 🐛 with SVG bug icon */}
<button ... aria-label="Fout melden">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {/* Lucide 'bug' icon path */}
    <path d="M8 2l1.5 1.5M16 2l-1.5 1.5M9 9h6M9 12h6M9 15h6M5 8l-2-2M19 8l2-2M5 16l-2 2M19 16l2 2M12 22c-3.3 0-6-2.7-6-6V9a6 6 0 0 1 12 0v7c0 3.3-2.7 6-6 6z"/>
  </svg>
</button>
```

---

## Info

### IN-01: `handleFiles` processing guard reads stale React state

**File:** `src/components/ImportPage.tsx:312-314`

**Issue:** The concurrent-import guard `if (importState.status === 'processing') return;` reads `importState` from the render-cycle closure. If `handleFiles` is somehow called again within the same render cycle (e.g., programmatically), the guard may see a stale `'idle'` status and allow a second concurrent import. In practice this cannot occur from user interaction (the events are sequential in the JS event loop and each call triggers a re-render that updates the closure), but if a test or automation ever invokes the handler twice synchronously, the guard is ineffective. A ref-based guard would be more reliable.

**Fix (optional hardening):** Add a `isProcessingRef = useRef(false)` as a synchronous guard alongside the state-based one, to be truly race-proof under programmatic invocation.

---

### IN-02: `@tauri-apps/api` version pinned in devDependencies only — mismatch with plugin versions

**File:** `package.json:26`

**Issue:** `@tauri-apps/api@^2.11.0` is in `devDependencies` alongside `@tauri-apps/plugin-os@^2.3.2` in `dependencies`. These are separate version constraints that could drift. If a consumer or CI environment installs them independently, the IPC API version and plugin version may diverge. Since Tauri 2 plugins rely on the API layer for invoke/event calls, a version mismatch can produce silent runtime failures. This is a lower-severity follow-on to CR-03.

**Fix:** After moving `@tauri-apps/api` to `dependencies` (per CR-03), align the caret range with the plugin packages, or pin all `@tauri-apps/*` packages to the same minor version range.

---

_Reviewed: 2026-05-27_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
