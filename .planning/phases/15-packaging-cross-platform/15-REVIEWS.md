# Phase 15 — Cross-AI Plan Reviews

**Phase:** 15 — Packaging & Cross-platform  
**Date:** 2026-05-15  
**Reviewers invoked:** Codex (success), Gemini (failed — misinterpreted prompt as execution instructions)

---

## Reviewer: Codex

*Reviewed Plans 15-01 and 15-02 by reading actual repo files: tauri.conf.json, Cargo.toml, crypto.rs, vitest.config.ts, App.css, entitlements (missing), release.yml (missing).*

### Plan 15-01: Local Config Changes

**Summary**

Directionally good on macOS signing and Windows installer basics. The weak point is that the plan treats Phase 15 as a packaging-toggle exercise, while PKG-03 is a UI requirement and PKG-01 depends on Windows runtime packaging details not covered here. Current `tauri.conf.json` already uses `bundle.targets: "all"`, `App.css` uses a fallback font stack, and the test guard is stale: the repo currently has 47 test cases, not 43.

**Strengths**

- Limits scope to the right files: `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and `src-tauri/entitlements.plist`
- Preserves `productName` and `identifier`, avoiding unnecessary bundle/signing churn
- `windows.nsis.installMode: "currentUser"` aligns with the no-UAC goal
- Omitting `keychain-access-groups` is consistent with ad-hoc signing and avoids `errSecMissingEntitlement (-34018)`
- Updating `Cargo.toml` metadata is low-risk and improves shipped package identity

**Concerns**

- `HIGH` — Changing `bundle.targets` from `"all"` to `["nsis"]` is risky for PKG-02. This setting is not Windows-local; it can suppress macOS DMG generation.
- `HIGH` — PKG-03 is not addressed. `font-family: Inter, Avenir, Helvetica, Arial, sans-serif` is not deterministic across WebView2 and WebKit; "visually identical" is unlikely without a bundled font or tighter acceptance definition.
- `MEDIUM` — `npm test` will not catch broken bundle settings, broken entitlements, or missing platform installer behavior.
- `MEDIUM` — Test count is stale. Repo has 47 test cases, so the 43-test guard will generate noise.
- `MEDIUM` — No local build sanity check (`npm run build` or `tauri build`) before CI.

**Suggestions**

- Keep `bundle.targets: "all"` unless CI has per-runner override wiring. Do not make the global config Windows-only.
- Add a local preflight: at minimum `npm run build`; ideally also `tauri build --bundles nsis` on Windows.
- Update or remove the hardcoded test count — validate with `npm test` but don't assert a count that diverges from reality.
- Treat PKG-03 as its own item: either bundle a deterministic font or relax requirement to "layout and styling parity within agreed tolerance."
- Add an acceptance note: first macOS launch may show a keychain dialog; document and test explicitly.

**Risk Assessment:** `MEDIUM-HIGH` — Metadata/entitlement changes are low-risk, but `bundle.targets: ["nsis"]` is risky enough to break macOS output, and PKG-03 real work is unaddressed.

---

### Plan 15-02: GitHub Setup + CI Workflow

**Summary**

Reasonable baseline release workflow: correct trigger, correct `tauri-action` usage, correct avoidance of unnecessary secrets, correct `permissions.contents: write`. Main gaps are WebView2 runtime handling on Windows, vague visual parity verification, and first real validation only on a release tag — a poor place to discover matrix or target mistakes.

**Strengths**

- Human checkpoint before GitHub-dependent work is appropriate (repo not yet on GitHub)
- `permissions.contents: write` explicitly included — prevents HTTP 403 on release creation
- Avoids certificate secrets and updater signing keys unnecessary for unsigned internal distribution
- Release-on-tag is simple for end users and matches phase goal
- Matrix scope restricted to Windows and macOS only — correct

**Concerns**

- `HIGH` — PKG-01 not guaranteed. Plan says "no extra dependencies" but doesn't mention WebView2 runtime packaging. A Tauri Windows app can still require WebView2 unless bundling is explicitly configured.
- `HIGH` — PKG-03 verification too vague. "Smoke tests" insufficient for visual parity, especially with cross-platform font stack and default WebView rendering differences.
- `HIGH` — First validation happens on a public release tag. If macOS targets or bundle config are wrong, the first failure is a failed release attempt.
- `MEDIUM` — Matrix mixes target triples (`aarch64-apple-darwin`) and runner labels (`windows-latest`). Workflow should use explicit `include` rows with runner OS and per-job target args.
- `MEDIUM` — `git push -u origin master` is branch-name brittle. Use `git push -u origin HEAD` instead.
- `MEDIUM` — `npm install` weaker than `npm ci` when `package-lock.json` exists.
- `MEDIUM` — Fallback "revert targets to 'all' if macOS CI fails" is too late; tagged release already failed publicly by then.
- `MEDIUM` — SmartScreen, Gatekeeper, and macOS keychain UX not operationalized; no release-note template or support expectation.
- `MEDIUM` — Artifact verification assumes exact filenames, which can vary by target and config.

**Suggestions**

- Add explicit WebView2 bundling config and a clean Windows 10 smoke test to prove PKG-01.
- Keep `bundle.targets: "all"` in global config; override per runner in CI instead.
- Define matrix with explicit `include` rows (runner + target args).
- Use `npm ci` in CI.
- Replace `git push -u origin master` with `git push -u origin HEAD`.
- Add `workflow_dispatch` trigger or branch-push non-release run to validate workflow before first tag.
- Turn PKG-03 into a checklist: same dataset, same window size, same DPI/scaling; screenshots of dashboard, tables, modal, status chips, overflow/wrapping cases.
- Add release notes covering SmartScreen ("More info → Run anyway"), Gatekeeper (right-click → Open), macOS keychain prompt on first launch.
- Verify behavior beyond artifact presence: install, launch, save encrypted data, relaunch, confirm storage works.

**Risk Assessment:** `HIGH` — CI skeleton is fine but as written doesn't prove PKG-01 and doesn't define PKG-03 tightly enough. Biggest practical blocker: WebView2 runtime handling. Biggest quality blocker: vague visual parity validation.

---

### Overall View (Codex)

The plans are close on release automation but not complete for the actual phase goal. Two changes before execution:

1. **Do NOT change global `bundle.targets` to `["nsis"]`** — keep `"all"` or override per runner in CI
2. **Add explicit WebView2 runtime handling and visual parity acceptance criteria**

Without those two fixes, the phase can produce artifacts but still miss PKG-01 and PKG-03.

---

## Reviewer: Gemini

**Status: FAILED** — Gemini CLI misinterpreted the review prompt as execution instructions and began trying to execute the plan rather than reviewing it. Output (701 bytes) is unusable as a peer review. This is a known failure mode with Gemini CLI in `gemini -p -` mode when given imperative-sounding context.

---

## Consensus Summary

| Finding | Severity | Source | Actionable change |
|---|---|---|---|
| `bundle.targets: ["nsis"]` suppresses DMG on macOS | HIGH | Codex | Keep `"all"` globally; override per runner in CI |
| WebView2 runtime not addressed — PKG-01 at risk | HIGH | Codex | Add Windows WebView2 bundle config + smoke test |
| PKG-03 verification too vague | HIGH | Codex | Define per-screen visual checklist |
| First validation on release tag is too late | HIGH | Codex | Add `workflow_dispatch` pre-release workflow run |
| Test count stale (47, not 43) | MEDIUM | Codex | Remove hardcoded count or update |
| `npm install` → `npm ci` in CI | MEDIUM | Codex | Use `npm ci` |
| Matrix mixes target triples and runner labels | MEDIUM | Codex | Use explicit `include` rows |
| SmartScreen/Gatekeeper UX not operationalized | MEDIUM | Codex | Add release notes template |
| `git push origin master` → `git push origin HEAD` | MEDIUM | Codex | Use `HEAD` ref |

### Critical consensus: targets config strategy

Both the research (Assumption A3) and Codex review independently flag `bundle.targets: ["nsis"]` as the highest-risk change in Plan 15-01. The research already documented the fallback ("if macOS CI fails, revert to 'all'"), but Codex argues the correct approach is: **never change global targets to NSIS-only** — instead use tauri-action's per-job `args: --bundles nsis` on the Windows runner and keep global config as `"all"`. This avoids the fallback scenario entirely.

### Recommended plan adjustments

**Plan 15-01:**
- Remove the `bundle.targets: ["nsis"]` change from Task 2 — leave `"all"` in tauri.conf.json
- Fix test count to match actual (or remove hardcoded assertion)
- Add `npm run build` preflight to Task 3

**Plan 15-02:**
- Add `--bundles nsis` to the Windows tauri-action `args` (replaces global NSIS-only)
- Add `workflow_dispatch` trigger for pre-release validation
- Use `npm ci` instead of `npm install`
- Use `git push -u origin HEAD` instead of hardcoded branch name
- Expand PKG-03 smoke test into explicit visual checklist
- Add WebView2 bundling check to PKG-01 verification
- Add release notes for SmartScreen/Gatekeeper/keychain UX

---

*Generated by `/gsd-review --phase 15 --all` on 2026-05-15. To incorporate findings: `/gsd-plan-phase 15 --reviews`*
