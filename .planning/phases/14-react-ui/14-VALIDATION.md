---
phase: 14
slug: react-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-15
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + manual smoke test in `npm run dev`
- **Before `/gsd-verify-work`:** Full suite must be green + all 4 success criteria verified manually
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 0 | KOV-01, KOV-02 | — | N/A | unit | `npm test -- --grep "berekenStatus"` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | KOV-01 | — | N/A | manual | `npm test` (regression) + visual in dev window | ✅ existing | ⬜ pending |
| 14-02-02 | 02 | 1 | KOV-02 | — | N/A | manual | `npm test` + visual search/sort verification | ✅ existing | ⬜ pending |
| 14-03-01 | 03 | 2 | DET-V2-01 | — | N/A | manual | `npm test` + manual DetailWeergave all sections | ✅ existing | ⬜ pending |
| 14-03-02 | 03 | 2 | DET-V2-02 | — | XSS via SVG: SpiderChart uses sanitizeCssVar() | manual | `npm test` + manual actiepunten add/edit/delete + restart | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/utils/status.ts` — `detectTraject()`, `berekenStatus()`, `STATUS_VOLGORDE`, `RAG_BORDER` (re-implemented from app.js IIFE)
- [ ] `tests/status.test.ts` — unit tests for `berekenStatus()` covering all 5 status outcomes (grijs, rood, oranje/Risico, oranje/Verzuim, groen/blauw) + `detectTraject()` for BJ1/BJ2 patterns

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| KlasOverzicht tile grid renders all student tiles with correct RAG border + status badge + mini verzuim bar | KOV-01 | React component rendering requires @testing-library/react (not installed) — project pattern is utility unit tests only | Open app, import PDFs, verify all tiles show naam, status badge, verzuim bar |
| Search filters on naam; sort by Naam/Status/Verzuim changes order | KOV-02 | UI interaction | Open app, type in search box, click sort buttons, verify expected ordering |
| KlasTabStrip switches active klas and KlasOverzicht re-renders | KOV-02 | UI interaction + Tauri desktop navigation | Create 2 klassen, import data, click tabs, verify correct students shown |
| DetailWeergave renders all 10 sections (Prognose, Aanvullend, Stage, Feedback, Leerlijnen, Spider, Matrix, Verzuim, Vakken, Notities) | DET-V2-01 | Multi-section UI render | Click student tile, verify all sections present with correct data |
| Actiepunten add/edit/delete persist after app restart | DET-V2-02 | Data persistence — requires Tauri restart | Add actiepunt, restart app, verify actiepunt still appears |
| Notities persist after app restart | DET-V2-01 | Data persistence — requires Tauri restart | Enter notitie text, wait for hint "Opgeslagen", restart app, verify text preserved |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
