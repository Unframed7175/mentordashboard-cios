---
phase: 25
slug: doorstroomnorm-configuratie
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-21
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 0 | NORM-01 | — | N/A | unit | `npx vitest run tests/normen.test.ts` | ❌ W0 | ⬜ pending |
| 25-02-01 | 02 | 1 | NORM-01,02 | — | N/A | unit | `npx vitest run tests/normen.test.ts` | ✅ W0 | ⬜ pending |
| 25-02-02 | 02 | 1 | NORM-03 | — | N/A | unit | `npx vitest run tests/prognosis.test.ts` | ✅ | ⬜ pending |
| 25-03-01 | 03 | 2 | NORM-04,05 | — | N/A | unit | `npx vitest run --reporter=verbose` | ✅ | ⬜ pending |
| 25-04-01 | 04 | 3 | NORM-06 | — | N/A | manual | see manual table | — | ⬜ pending |
| 25-04-02 | 04 | 3 | NORM-07 | — | N/A | manual | see manual table | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/normen.test.ts` — unit tests for `utils/normen.ts`: load/save/reset/sync cache (mirrors `tests/verzuimDrempels.test.ts` with `vi.hoisted` + ES6 class LazyStore mock)
- [ ] `tests/prognosis.test.ts` (extend) — add normen-aware integration tests: verify `berekenPrognose()` uses configurable thresholds from `getNormenSync()`

*Existing vitest infrastructure covers the framework — only test files need to be created/extended.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drempel wijziging herberekent KlasOverzicht RAG-kleuren direct (geen herstart) | NORM-04 | Requires running app + UI interaction | 1. Open app, open KlasOverzicht 2. Open Settings → Doorstroomdrempels 3. Change SBL drempel 4. Blur/Enter — verify KlasOverzicht tiles update color without page reload |
| "Herstel standaard" reset zet alle drempels terug naar DEFAULT_NORMEN | NORM-06 | Requires UI interaction | 1. Change multiple thresholds 2. Click "Herstel standaard" 3. Verify all inputs return to SBL=13, SBC=15, negTotaal=6, negPerLeerlijn=2, bj1Positief=13, versneld{L/O/P}=4/3/5 |
| Drempels overleven app-herstart | NORM-05 | Requires app restart | 1. Change a threshold 2. Close and reopen app 3. Verify changed value is still shown in Settings |
| SBC < SBL waarschuwing verschijnt | NORM-07 | Requires UI interaction | 1. Set SBC-drempel lager dan SBL-drempel 2. Verify orange warning text appears below SBC input 3. Verify no blocking — save still works |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
