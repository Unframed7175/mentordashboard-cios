---
phase: 28
reviewers: [gemini, codex]
reviewed_at: 2026-05-26T20:45:00.000Z
plans_reviewed: [28-01-PLAN.md, 28-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 28: Bug/Feedback Rapportage

## Gemini Review

This review evaluates the implementation plans for **Phase 28: Bug/Feedback Rapportage**.

### Summary
The plans are well-structured, following a disciplined TDD approach for the logic layer before moving to UI integration. Plan 28-01 correctly prioritizes the technical "plumbing" (error capturing and system info retrieval), while Plan 28-02 ensures the feature is accessible and context-aware by instrumenting the import flow. The use of a ring buffer for console errors is an excellent choice for providing technical context without unbounded memory growth.

### Strengths
- **TDD Strategy:** Writing tests for the `mailto:` URL construction is critical, as URI encoding and string formatting for email clients can be brittle.
- **Non-Intrusive Error Capturing:** Patching `console.error` and `window.onerror` at the entry point (`main.tsx`) ensures that even early startup errors (post-initialization) are captured.
- **Contextual Awareness:** Instrumenting `ImportPage.tsx` to track the "Last Import" provides high-value data for debugging the most common failure points in the app.
- **Consistency:** Reusing the modal and navigation patterns (button next to settings) ensures a seamless UX that matches the existing application style.

### Concerns

- **MEDIUM** — `mailto:` URL Length Limits: Many email clients and operating systems have a character limit for `mailto:` links (often around 2,000 characters). 10 errors at 200 characters each ($2,000$ chars) plus user description and system info will likely exceed this limit, causing the link to fail silently or truncate in clients like Outlook.
- **MEDIUM** — Async Tauri APIs in URL Construction: `getVersion()` and `platform()`/`version()` are asynchronous. If the system info isn't pre-cached, there might be a delay or race condition where the email is generated with "unknown" versions.
- **LOW** — External Protocol Handling: Using `window.location.href` for `mailto:` inside a Tauri webview can occasionally be blocked. The `shell` plugin in Tauri is generally the preferred way to trigger OS-level protocol handlers.

### Suggestions
- **Optimize the buffer for URL limits:** Reduce to last 5 errors or 150 chars per error to ensure total URL stays safely under 2,000 characters. Alternatively implement a hard body-size ceiling.
- **Pre-cache system info:** Initialize a singleton in `utils/feedback.ts` that fetches OS info once during `main.tsx` initialization, making `buildMailtoUrl` fast when the user clicks.
- **Use Tauri Shell plugin:** Replace `window.location.href = mailtoUrl` with `import { open } from '@tauri-apps/plugin-shell'; open(mailtoUrl)` — more correct for Tauri apps.
- **Sanitize console errors:** Strip local file paths containing usernames from error strings (optional for local-first app).
- **Timestamp errors:** Add relative timestamp to ring buffer entries (e.g., `[14:02:31] Error: ...`) to help correlate logs.

### Risk Assessment: LOW
The overall risk is low because the feature is additive. Primary risks are functional (email client not opening due to URL length) rather than systemic. Following the suggested optimizations will reduce risk further.

**Decision:** Approve for execution with recommendation to monitor URL length during TDD and use Tauri Shell plugin for opening email client.

---

## Codex Review

### Plan 28-01 Review

**Summary**

Plan 28-01 has a sensible split: isolate the feedback assembly logic in one utility module, cover it with tests, then install global error capture before React mounts. However, the plan is too optimistic about what `window.onerror` captures, too vague about serialization of real `console.error` payloads, and underestimates `mailto:` size. As written, it will likely produce a working happy path, but risks missing important debugging context or generating `mailto:` URLs that fail on real Windows mail clients.

**Strengths**
- Good separation of concerns: utility logic in one module, bootstrapping in `main.tsx`.
- TDD focus is appropriate for string formatting, fallback behavior, and buffer behavior.
- Ring buffer cap keeps the feature bounded instead of unbounded console accumulation.
- Installing capture before `ReactDOM.createRoot` catches at least some early runtime issues.
- Explicit fallback text for empty import/error state is good product design.

**Concerns**
- **HIGH** — JS package name: The official JS guest package for the OS plugin is `@tauri-apps/plugin-os`; `tauri-plugin-os` is the Rust crate name. If the repo uses the official JS package, the tests and implementation paths may be wrong.
- **HIGH** — `window.onerror` only captures synchronous script errors. Unhandled promise rejections are a separate `unhandledrejection` event — async failures will be missed.
- **HIGH** — `mailto:` size risk is not handled end-to-end. Truncating each error to 200 chars does not cap total URL length once you include 10 errors, user description, and metadata.
- **MEDIUM** — `console.error` handling is underspecified. Real calls often include multiple arguments, `Error` objects, and stacks. `String(message)` will lose most useful debugging data.
- **MEDIUM** — `window.onerror = ...` can clobber an existing handler. `addEventListener('error', ...)` is safer.
- **MEDIUM** — Re-patching `console.error` in dev/HMR can stack wrappers and duplicate entries unless there is an installation guard.
- **MEDIUM** — `utils/feedback.ts` outside `src/` — import path from `src/main.tsx` (`'../utils/feedback'`) should be validated against the actual repo layout.
- **LOW** — The RED test target "cannot find module" is valid but shallow; does not prove the first useful contract.

**Suggestions**
- Use the actual JS package names: `@tauri-apps/api/app` and `@tauri-apps/plugin-os`.
- Add `window.addEventListener('unhandledrejection', ...)` to capture async failures alongside `window.onerror`.
- Define a real serializer contract for `pushConsoleError`: join multiple args, prefer `error.stack` when an `Error` object is present, safe stringification for objects.
- Add a hard total body budget: if body exceeds e.g. 1800 chars, truncate with `[ingekort wegens e-mail limiet]` note.
- Prefer `addEventListener('error', handler)` or explicitly chain any existing `window.onerror` handler.
- Add an idempotent patch guard in `main.tsx` so HMR/dev reloads don't wrap `console.error` repeatedly.
- Add tests for: multi-arg `console.error`, `Error` stack serialization, total `mailto:` length truncation.

**Risk Assessment: MEDIUM-HIGH** — The architecture is fine, but two material correctness risks: wrong Tauri JS import assumptions and incomplete error capture.

---

### Plan 28-02 Review

**Summary**

Plan 28-02 is appropriately small and aligned with product decisions. The main weakness is it assumes `KlasTabStrip` guarantees reachability from every view, and it has almost no failure-path design. If `buildMailtoUrl()` rejects or the `mailto:` handoff fails in a packaged Tauri build, the user gets no recovery path and may lose their typed description.

**Strengths**
- Scope is controlled: modal component, nav wiring, and import instrumentation are the right slices.
- Keeping description optional and submit always enabled reduces friction for testers.
- Updating `ImportPage` only on successful import paths is the right data-quality rule.
- Reusing the modal interaction pattern from an existing component reduces UI inconsistency.

**Concerns**
- **HIGH** — No failure handling around `buildMailtoUrl()` or `window.location.href = url`. If system info lookup fails or the `mailto:` handoff is rejected, the user loses the report flow and their typed description.
- **HIGH** — The `mailto:` payload risk from Plan 28-01 is unaddressed here. This is where the feature breaks for real users.
- **MEDIUM** — FEED-01 requires reachability from every view, but plan assumes `KlasTabStrip` is always present. If any views bypass that shell, the requirement is not met.
- **MEDIUM** — `window.location.href = mailto:` behavior in the packaged Tauri app on Windows differs from browser-like dev behavior. Should be verified.
- **MEDIUM** — No component/integration tests for modal open/close, submit behavior, or `setLastImport()` calls. Verification relies on grep-style existence checks.
- **LOW** — Emoji-only button with only `title` is weak for accessibility (though the plan does include `aria-label`).
- **LOW** — The modal `loading` state is set but the plan doesn't explicitly disable Verstuur during loading.

**Suggestions**
- Add explicit submit error handling: keep modal open on failure, preserve textarea content, show inline error message.
- Add packaged-app verification step on Windows for the actual `mailto:` handoff.
- Confirm `KlasTabStrip` is truly global; if not, move trigger higher in the app shell.
- Make `FeedbackModal` resilient: disable submit while launching, ignore repeated clicks, only close after handoff attempt.
- Add targeted UI tests: button visibility, modal open/close, optional description, `window.location.href` set to `mailto:`, `setLastImport()` called on each success path.

**Risk Assessment: MEDIUM** — UI work itself is straightforward, but the plan is light on failure-path behavior. If Plan 28-01's payload/capture issues are not fixed first, this wave exposes those defects directly to testers.

---

### Codex Cross-Plan Verdict

The two-wave split is good and the overall design is proportionate. Biggest gaps are correctness-related:
- JS package name for OS plugin must be verified.
- `unhandledrejection` is missing from the capture strategy.
- `mailto:` needs a total payload budget, not just per-error truncation.
- UI plan needs explicit failure handling and packaged-app verification.

---

## Consensus Summary

### Agreed Strengths
- **TDD approach for feedback.ts** — both reviewers agree testing the URL construction logic is critical given URI encoding brittleness
- **Ring buffer design** — bounded capture is the right call; explicit fallback strings are good UX
- **Incremental wiring pattern** — Plan 28-02 reusing KlasModal patterns and wiring through App.tsx props reduces inconsistency

### Agreed Concerns (Highest Priority)

| # | Concern | Severity | Both reviewers |
|---|---------|----------|---------------|
| 1 | **`mailto:` total URL length** — 10 errors × 200 chars + metadata will exceed ~2000 char limit on many Windows mail clients | HIGH | ✓ Gemini (MEDIUM) + Codex (HIGH) |
| 2 | **`window.location.href` for mailto: in packaged Tauri** — Tauri shell plugin (`@tauri-apps/plugin-shell` `open()`) is the correct approach; `window.location.href` may behave differently in WebView2 | MEDIUM | ✓ Gemini (LOW) + Codex (HIGH) |
| 3 | **Async Tauri API calls in `buildMailtoUrl`** — pre-caching system info avoids latency/race conditions when user clicks Verstuur | MEDIUM | ✓ Gemini (MEDIUM) + Codex (implied) |

### Additional Concerns (Codex only, HIGH confidence)
- **`unhandledrejection` missing** — `window.onerror` only captures synchronous errors; async failures are invisible without `addEventListener('unhandledrejection', ...)`
- **JS package name verification** — confirm actual import path for OS plugin (`@tauri-apps/plugin-os` vs `tauri-plugin-os`) against `package.json`

### Divergent Views
- **Overall risk level:** Gemini rates LOW (approve with minor changes); Codex rates MEDIUM-HIGH (fix before executing). Divergence is mainly about how seriously to weight the `mailto:` URL length issue and Tauri API assumptions.
- **console.error serialization:** Codex flags this as MEDIUM; Gemini doesn't flag it. Codex's concern about `Error` objects losing stack traces is valid but may be acceptable given this is a tester tool, not production logging.

### Recommended Pre-Execution Fixes
1. **Add total body budget** in `buildMailtoUrl`: if `body.length > 1500` chars, truncate console errors section first (keeping 5 instead of 10, then truncating to 100 chars each), append `[ingekort wegens e-mail limiet]`
2. **Use shell plugin for mailto:** `import { open } from '@tauri-apps/plugin-shell'; open(mailtoUrl)` instead of `window.location.href`
3. **Add `unhandledrejection` listener** alongside `window.onerror` in `main.tsx`
4. **Verify JS package name** for tauri-plugin-os in `package.json` before writing tests
5. **Add try/catch in FeedbackModal's handleVerstuur** with user-visible error message on failure
