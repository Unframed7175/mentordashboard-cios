---
phase: 30
slug: documentatie-help-ci
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-28
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.6 |
| **Config file** | vite.config.ts (vitest block) |
| **Quick run command** | `npx vitest run tests/HelpPage.test.tsx` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/HelpPage.test.tsx`
- **After every plan wave:** Run `npm test` (full suite, 204+ tests)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 30-01-01 | 01 | 1 | HELP-01, HELP-02 | N/A — static JSX | unit (RED) | `npx vitest run tests/HelpPage.test.tsx` | ❌ W0 | ⬜ pending |
| 30-01-02 | 01 | 1 | HELP-02 | N/A | unit (RED) | `npx vitest run tests/KlasTabStrip.test.tsx` | ✅ extend | ⬜ pending |
| 30-02-01 | 02 | 2 | HELP-01 | Hard-coded JSX, no dangerouslySetInnerHTML | unit (GREEN) | `npx vitest run tests/HelpPage.test.tsx` | ❌ W0 | ⬜ pending |
| 30-02-02 | 02 | 2 | HELP-02 | N/A | unit (GREEN) | `npx vitest run tests/KlasTabStrip.test.tsx` | ✅ extend | ⬜ pending |
| 30-03-01 | 03 | 2 | TEST-01, TEST-02, TEST-03 | GITHUB_TOKEN only; no extra secrets | CI | `gh run list --workflow=ci.yml --limit=1` | ❌ W0 | ⬜ pending |
| 30-04-01 | 04 | 2 | HELP-03, HELP-04 | N/A — prose doc | manual | `ls INSTRUCTIES.md` | ❌ W0 | ⬜ pending |
| 30-04-02 | 04 | 2 | TEST-04, TEST-05 | N/A — prose doc | manual | `ls TESTPLAN.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/HelpPage.test.tsx` — 4 RED tests covering HELP-01 (sections render) and HELP-02 (onBack callback)
- [ ] `tests/KlasTabStrip.test.tsx` — 2 new RED tests for `onHelp`/`isHelpActive` props (extend existing file)

*CI workflow and documentation files have no automated Wave 0 gate — they are verified by file-existence checks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI builds succeed on Windows x64 | TEST-01 | Requires GitHub Actions runner | Push to main; check Actions tab for `ci.yml` run green on `windows-latest` |
| CI builds succeed on macOS ARM | TEST-02 | Requires GitHub Actions runner | Same run; check `macos-latest` matrix job green |
| INSTRUCTIES.md readable and complete | HELP-03, HELP-04 | Prose quality cannot be automated | Open INSTRUCTIES.md; verify 8 sections present, email address correct |
| TESTPLAN.md scenario tables complete | TEST-04, TEST-05 | Prose quality cannot be automated | Open TESTPLAN.md; verify each scenario has Actie, Verwacht resultaat, Geslaagd? columns |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
