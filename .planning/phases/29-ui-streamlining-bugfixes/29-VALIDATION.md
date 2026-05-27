---
phase: 29
slug: ui-streamlining-bugfixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-27
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` / `vite.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| UI-01 | Typography tokens consistent across views | visual/manual | — | manual only | ⬜ pending |
| UI-02 | Tile padding increased, hierarchy clear | visual/manual | — | manual only | ⬜ pending |
| UI-03 | Dark mode no hardcoded hex values | code review + visual | — | manual check | ⬜ pending |
| UI-04 | Fade-in transition fires on view switch | visual/manual | — | manual only | ⬜ pending |
| FIX-01 | Nav stripe visible in Tauri WebView2 | visual/manual in `tauri dev` | — | manual only | ⬜ pending |
| FIX-02 | BPV shows loading vs empty states | component test | `npm test -- --grep BpvProgress` | ❌ Wave 0 gap | ⬜ pending |
| PROG-01 | Doorstroomnorm block layout renders correctly | component test | `npm test -- --grep DoortstroomPrognose` | ❌ Wave 0 gap | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/BpvProgressSection.test.tsx` — covers FIX-02 (loading state, empty state, data state transitions)
- [ ] `tests/DoortstroomPrognoseSection.test.tsx` — covers PROG-01 block rendering for BJ1 and BJ2 trajectories

*All other UI requirements (UI-01..04, FIX-01) are visual-only and verified by human review.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Section titles, body, labels consistent | UI-01 | Visual CSS only | Check all 4 views: section titles = 0.6875rem/700/uppercase, body = 0.875rem, labels = 0.75rem/600 |
| Tile whitespace and hierarchy | UI-02 | Visual CSS only | Open klasoverzicht, verify cards have ≥1.25rem padding and clear hierarchy |
| Dark mode has no white spots | UI-03 | Visual CSS only | Toggle dark mode, check all views for hardcoded colors |
| View transitions fire | UI-04 | Visual CSS only | Navigate tab → detail → back, verify 150–200ms fade |
| Nav stripe visible in Tauri | FIX-01 | WebView2-specific rendering | Run `tauri dev`, verify diagonal gradient stripe visible in nav bar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (BpvProgressSection + DoortstroomPrognoseSection)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
