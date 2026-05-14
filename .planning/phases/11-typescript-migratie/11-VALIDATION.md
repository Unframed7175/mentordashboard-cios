---
phase: 11
slug: typescript-migratie
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.6 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test -- --coverage` |
| **Estimated runtime** | ~5–15 seconds (grows as test files are added) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test -- --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green (~128 tests)
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-W0-01 | W0 | 0 | MIG-01/02/03 | setup | `npm run typecheck` | ❌ W0: extend tsconfig.json | ⬜ pending |
| 11-W0-02 | W0 | 0 | MIG-01/02/03 | setup | `npm install && npm run test` | ❌ W0: npm install fflate | ⬜ pending |
| 11-W0-03 | W0 | 0 | MIG-01/02 | integration setup | `ls tests/fixtures/` | ❌ W0: create tests/fixtures/ | ⬜ pending |
| 11-01-01 | 01 | 1 | MIG-03 | unit | `npm run test -- tests/prognosis.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | MIG-03 | unit | `npm run test -- tests/aggregation.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | MIG-03 | unit | `npm run test -- tests/backup.test.ts` | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 1 | MIG-03 | unit | `npm run test -- tests/spider.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | MIG-01 | integration | `npm run test -- tests/parseStage.test.ts` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | MIG-02 | integration | `npm run test -- tests/excel.test.ts` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | MIG-01/02/03 | full suite | `npm run test` | ✅ actiepunten.test.js | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tsconfig.json` uitbreiden: `"include": ["src", "utils", "parsers", "tests"]`
- [ ] `npm install fflate` uitvoeren
- [ ] `tests/fixtures/` map aanmaken
- [ ] `tests/fixtures/sample-voortgang.pdf` — geanonimiseerde CIOS voortgang PDF (MIG-01)
- [ ] `tests/fixtures/sample-verzuim.xls` — minimaal XLS met verzuimkolommen + Nederlandse tekens (MIG-02)
- [ ] `tests/prognosis.test.ts` — berekenPrognose unit tests (MIG-03)
- [ ] `tests/aggregation.test.ts` — aggregateDeelgebiedScores tests
- [ ] `tests/backup.test.ts` — buildBackupPayload + applyBackupRestore tests
- [ ] `tests/spider.test.ts` — SpiderChart.buildSpiderSVG tests
- [ ] `tests/feedback.test.ts` — feedback store tests (als feedback util bestaat)
- [ ] `tests/parseStage.test.ts` — parseStageFile integration test

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF fixture geeft byte-identieke output | MIG-01 | Requires real CIOS PDF file — cannot automate without fixture | Run `npm run test -- tests/parseStage.test.ts` after adding fixture |
| Excel .xls met cp1252 encoding leest Nederlandse tekens | MIG-02 | Requires real SomToday .xls export | Run `npm run test -- tests/excel.test.ts` after adding fixture |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
