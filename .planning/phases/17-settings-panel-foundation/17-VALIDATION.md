---
phase: 17
slug: settings-panel-foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-17
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

Plan requirement IDs (from plan frontmatter):
- Plan 17-01 `requirements: [POL-01]` — CSS body.dark + new section 24 utility classes
- Plan 17-02 `requirements: [SET-01, POL-01]` — SettingsPage component, utils/settings.ts, SettingsPage.test.tsx (inline)
- Plan 17-03 `requirements: [SET-01, SET-02, POL-01]` — App.tsx wiring, main.tsx startup hydration, KlasTabStrip gear icon + test (inline)

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | POL-01 | — | `body.dark` selector replaces `@media (prefers-color-scheme: dark)`; all 20 tokens defined | grep gate | inline grep on src/index.css | n/a (CSS) | ⬜ pending |
| 17-01-02 | 01 | 1 | POL-01 | — | New section 24 utility classes (.settings-page, .toggle-switch, etc.) present in index.css | grep gate | inline grep on src/index.css | n/a (CSS) | ⬜ pending |
| 17-02-01 | 02 | 1 | SET-01 | — | `utils/settings.ts` exports loadSettings/saveSettings/applyTheme; LazyStore persistence | unit | `npx vitest run utils/settings.test.ts` | created inline (Plan 02) | ⬜ pending |
| 17-02-02 | 02 | 1 | SET-01, POL-01 | — | SettingsPage renders cards; toggle adds/removes body.dark; OS-fallback applies but does NOT persist | unit (jsdom) | `npx vitest run src/components/SettingsPage.test.tsx` | created inline (Plan 02) | ⬜ pending |
| 17-02-03 | 02 | 1 | SET-01 | — | SettingsPage.test.tsx covers SET-01 persist/restore/OS-fallback/body.dark behaviour | unit (jsdom) | `npx vitest run src/components/SettingsPage.test.tsx` | created inline (Plan 02) | ⬜ pending |
| 17-03-01 | 03 | 2 | SET-01, POL-01 | — | KlasTabStrip gear icon present, onSettings callback fires, isSettingsActive applies .active class, legacy '↑ Importeer' absent | unit (jsdom) | `npx vitest run src/components/KlasTabStrip.test.tsx` | created inline (Plan 03 Task 1) | ⬜ pending |
| 17-03-02 | 03 | 2 | SET-01, SET-02 | — | App.tsx routes 4th 'settings' view; prevView restores; handleImportOpen removed; SettingsPage mounted | grep gate + full suite | inline node regex on src/App.tsx + `npx vitest run` | n/a (App wiring) | ⬜ pending |
| 17-03-03 | 03 | 2 | SET-01, POL-01 | — | main.tsx hydrates theme via loadSettings + applyTheme BEFORE ReactDOM.createRoot | grep gate + full suite | inline node regex on src/main.tsx + `npx vitest run` | n/a (startup wiring) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note:** Plan 17-01 tasks use grep gates rather than vitest tests because they modify CSS only (no JS execution path). Plan 17-03 Task 2 and Task 3 use grep gates for the wiring assertions plus the full vitest suite for behavioural regression coverage. Plan 17-02 Task 3 and Plan 17-03 Task 1 create the actual test files inline (`src/components/SettingsPage.test.tsx` and `src/components/KlasTabStrip.test.tsx` respectively) — no separate Wave 0 task is required.

---

## Wave 0 Requirements

All test scaffolding is created inline within Wave 1 / Wave 2 plan tasks — no preparatory Wave 0 work is outstanding:

- [x] `src/components/SettingsPage.test.tsx` — created inline by Plan 02 Task 3 (covers SET-01 persist/restore/OS-fallback/body.dark and POL-01 cascade)
- [x] `src/components/KlasTabStrip.test.tsx` — created inline by Plan 03 Task 1 (covers gear icon presence + onSettings callback + active class + legacy '↑ Importeer' regression guard)
- [x] `utils/settings.test.ts` (optional, may be folded into SettingsPage.test.tsx) — Plan 02 Task 2 creates `utils/settings.ts` with the LazyStore mock; if test coverage stays in SettingsPage.test.tsx this file is not required

*Wave 0 is complete because: (1) the existing vitest infrastructure already supports jsdom + LazyStore class-mock pattern (proven in `tests/storage.test.ts` from Phase 12), and (2) every new test file is authored in the same task that produces the code under test. `wave_0_complete: true` reflects that no test scaffolding precedes the implementation waves.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All components styled correctly in dark mode (spiderweb chart, deelgebieden matrix, modal) | POL-01 | Visual consistency requires human eye | Toggle dark mode, navigate to klas overview, open student detail, open modal — verify no light-mode artifacts |
| App restores dark mode on fresh restart with no light flash | SET-01 | Requires Tauri app restart to verify persistence + startup hydration timing | Close and reopen the app; verify body.dark is applied before any view paints (no flash) |
| Back button returns to correct previous view | SET-01 | View state navigation requires manual flow | Open klas view → open settings → click ← Terug → verify klas view is restored |
| Settings → Bestanden toevoegen → ImportPage → klas end-to-end | SET-02 | Full user flow spans three views + Tauri file picker | Open settings, click "Bestanden toevoegen", complete an import, verify landing on klas overview |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (every task has either a vitest run or a grep gate)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task has automated verification)
- [x] Wave 0 covers all MISSING references (test files are created inline in the same task that produces the code under test)
- [x] No watch-mode flags (`npx vitest run` only — no `--watch`)
- [x] Feedback latency < 15s (~10s estimated full suite)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for execution
