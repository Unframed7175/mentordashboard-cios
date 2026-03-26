---
phase: 7
slug: periode-vergelijking
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-03-26
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no automated test runner (browser-only vanilla JS project) |
| **Config file** | None |
| **Quick run command** | Open `index.html` in browser; manual verification |
| **Full suite command** | Manual UAT checklist (pattern from `06-HUMAN-UAT.md`) |
| **Estimated runtime** | ~5 minutes per full UAT run |

---

## Sampling Rate

- **After every task commit:** Visual spot-check in browser (import PDFs, verify targeted behavior)
- **After every plan wave:** Full manual UAT run against all CMP-0x items
- **Before `/gsd:verify-work`:** All CMP-01..04 UAT items must be green
- **Max feedback latency:** ~5 minutes (manual browser check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | CMP-01 | manual | — | N/A | ⬜ pending |
| 07-01-02 | 01 | 1 | CMP-01 | manual | — | N/A | ⬜ pending |
| 07-02-01 | 02 | 2 | CMP-02, CMP-03 | manual | — | N/A | ⬜ pending |
| 07-02-02 | 02 | 2 | CMP-02, CMP-03 | manual | — | N/A | ⬜ pending |
| 07-03-01 | 03 | 3 | CMP-04 | manual | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test infrastructure to create. Project has no `package.json`, no test runner, no test directory. Validation is manual UAT per Phase 6 pattern.

Existing infrastructure covers all phase requirements (via manual UAT).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Import Fase 1 PDFs, then Fase 2 — both sets preserved | CMP-01 | Browser file input, no CLI | Import batch 1 → check tile count; import batch 2 → verify tile count doubles (one per leerlingId per periode) |
| Re-importing same Fase 1 PDF overwrites that period only | CMP-01 | Browser file input | Import Fase 1 twice; verify no duplicate records for same leerlingId+periode |
| Detail view shows two tfoot rows when two periods exist | CMP-02 | Visual DOM check | Click leerling tile after both periods imported; verify two `<tr>` in `tfoot` |
| Detail view shows one tfoot row when only one period exists | CMP-02 | Visual DOM check | Click leerling tile with only Fase 2; verify one `<tr>` in `tfoot` |
| Growth badge ↑ shown for improved scores | CMP-03 | Visual check | Score change O→V or V→G should render green ↑ badge |
| Growth badge ↓ shown for declined scores | CMP-03 | Visual check | Score change G→V or V→O should render red ↓ badge |
| Growth badge = shown for unchanged scores | CMP-03 | Visual check | Same score in both periods renders gray = badge |
| No badge shown when Fase 1 score is null | CMP-03 | Visual check | Deelgebied not assessed in Fase 1 — Fase 2 row shows score chip only, no badge |
| Klasoverzicht tile color reflects most-recent period | CMP-04 | Visual check | After importing Fase 2, tile RAG color should update to Fase 2 prognose |
| Doorstroomprognose in detail reflects most-recent period | CMP-04 | Visual check | Prognose section shows gap analysis based on Fase 2 scores |

---

## Validation Sign-Off

- [ ] All tasks have manual verify checklist items
- [ ] Sampling continuity: browser spot-check after each task
- [ ] Wave 0: no automated infrastructure needed — confirmed
- [ ] No watch-mode flags
- [ ] Feedback latency ~5 minutes (acceptable for manual UAT)
- [ ] `nyquist_compliant: true` set in frontmatter (set after executor confirms)

**Approval:** pending
