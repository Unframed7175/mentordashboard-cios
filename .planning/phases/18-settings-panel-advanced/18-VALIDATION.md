---
phase: 18
slug: settings-panel-advanced
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-18
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.x + jsdom + @testing-library/react |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| deelgebied config defaults | W0 | 0 | SET-03 | — | N/A | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ W0 | ⬜ pending |
| deelgebied active filter | W0 | 0 | SET-03 | — | N/A | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ W0 | ⬜ pending |
| deelgebied reset | W0 | 0 | SET-03 | — | N/A | unit | `npm test -- --run tests/deelgebieden.test.ts` | ❌ W0 | ⬜ pending |
| leerlijnen sync accessor | W0 | 0 | SET-04 | — | N/A | unit | `npm test -- --run tests/leerlijnen.test.ts` | ❌ W0 | ⬜ pending |
| prognose active filter | W0 | 0 | SET-04 | — | N/A | unit | `npm test -- --run tests/prognosis.test.ts` | ❌ extend | ⬜ pending |
| verzuim drempels defaults | W0 | 0 | SET-05 | — | N/A | unit | `npm test -- --run tests/verzuimDrempels.test.ts` | ❌ W0 | ⬜ pending |
| berekenStatus geoorloofd threshold | W0 | 0 | SET-05 | — | N/A | unit | `npm test -- --run tests/status.test.ts` | ❌ extend | ⬜ pending |
| berekenStatus ongeoorloofd threshold | W0 | 0 | SET-05 | — | N/A | unit | `npm test -- --run tests/status.test.ts` | ❌ extend | ⬜ pending |
| bpv config defaults | W0 | 0 | SET-06 | — | N/A | unit | `npm test -- --run tests/bpv.test.ts` | ❌ W0 | ⬜ pending |
| bpv progress calculation | W0 | 0 | SET-06 | — | N/A | unit | `npm test -- --run tests/bpv.test.ts` | ❌ W0 | ⬜ pending |
| bpv empty state render | W0 | 0 | SET-06 | — | N/A | unit | `npm test -- --run tests/bpv.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/deelgebieden.test.ts` — stubs for SET-03: getDeelgebiedenConfig defaults, active filter, reset
- [ ] `tests/verzuimDrempels.test.ts` — stubs for SET-05: getVerzuimDrempels defaults and persistence
- [ ] `tests/bpv.test.ts` — stubs for SET-06: getBpvConfig defaults and progress calculation
- [ ] `tests/leerlijnen.test.ts` — extend existing: getLeerlijnenMappingSync() tests
- [ ] `tests/status.test.ts` — extend existing: berekenStatus() with geoorloofd + ongeoorloofd threshold params
- [ ] `tests/prognosis.test.ts` — extend existing: berekenPrognose() with activeDeelgebiedenIds filter

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BPV Excel import parses student hours correctly | SET-06 | BPV format unknown (D-13); requires real file | Import BPV Excel provided by user; verify per-student hours appear in DetailWeergave |
| Deelgebied name change reflects in SpiderChartCard axis labels | SET-03 | Requires visual inspection | Rename a deelgebied in settings; verify axis label updates in spiderweb chart |
| Inactive deelgebied disappears from spider axes and matrix | SET-03 | Requires visual inspection | Toggle a deelgebied inactive; verify it's absent from both DeelgebiedenMatrix and SpiderChartCard |
| Threshold change updates tile RAG status immediately | SET-05 | Requires visual inspection + real data | Lower geoorloofd threshold; verify student tile updates from groen to oranje |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
