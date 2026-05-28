# Research Summary: v2.4 Data Completeness, Keuzedelen & UI Polish

**Project:** Mentordashboard CIOS
**Researched:** 2026-05-28
**Confidence:** HIGH (all features); LOW for BPV column names (blocked on real file)

---

## Executive Summary

v2.4 adds six deliverables to the existing Tauri 2 + React + TypeScript app. **Zero new dependencies** — SheetJS, tauri-plugin-store, React, and plain CSS cover everything. All features are incremental additions with well-established patterns already in the codebase.

BPV column matchers are the only feature blocked on an external deliverable (the real SomToday BPV Excel file). All other five features are fully implementable today.

---

## 1. Stack Additions

**Verdict: No new dependencies.**

| Feature | Existing capability used |
|---------|------------------------|
| BPV real column matchers | SheetJS 0.20.3 — `_bpvKolom()` in `utils/bpv.ts` (pattern established) |
| Keuzedelen per student | `tauri-plugin-store` + `saveKlassen()` — same as `actiepunten` |
| R&N badges on tiles | `normalizeRekenScore()` + `StudentRecord.rekenResultaat` (already present) |
| Non-empty class deletion | `deleteKlas()` in `utils/klassen.ts` (already handles non-empty) |
| UI-DET spider + section reorder | Pure CSS resize + JSX reorder |
| UI-NAV banner 2x | Pure CSS height change |

---

## 2. Feature Table Stakes

### BPV — Real column matchers
- Run `debugBpvExcel(buffer)` on the real file first → logs exact column header names
- Update only the 5 candidate string arrays in `_bpvKolom()` calls inside `parseBpvExcel()`
- Must provide 2+ aliases per column (SomToday renames columns across school years)
- Assert ≥3 key columns present after header detection (guards against merged title rows)
- `gerealiseerdeUren` stays 0 until real file is provided — scaffold already in place

### KZLD — Keuzedelen per student
- New type: `Keuzedeel { id: string; naam: string; onTrack: boolean }`
- New field on StudentRecord: `keuzedelen?: Keuzedeel[]`
- `?? []` guard at every read site (same as `rekenResultaat ?? null` pattern from Phase 23)
- Mutate in-place + `saveKlassen()` — never spread (breaks `appState.students` bridge)
- New `KeuzedeelSection.tsx` in DetailWeergave — after RekenenNederlandsSection, before FeedbackActiepunten
- Add/remove/edit rows inline; checkbox for `onTrack` toggles immediately on click

### TEGEL-RN — R&N on klasoverzicht tiles
- Extend `LeerlingTegel` props: `rekenResultaat?: string | null`, `nederlandsResultaat?: string | null`
- Render as single compact row: `R 2F · N 3F` — reuse `.score-telling` CSS class
- Only show row when at least one field is non-null
- Pass both fields from `KlasOverzicht` via the student object (data already present)
- Mutations in `RekenenNederlandsSection` must write to ALL records for leerlingId (verzuim pattern)

### KLS-DEL — Non-empty class deletion
- `deleteKlas()` already correct for non-empty classes — no change needed
- Change `canDelete` in App.tsx: `true` for all non-active classes (keep `false` for active class)
- New `KlasVerwijderenModal.tsx` (~50 lines): checkbox "Ik begrijp dat alle leerlingdata wordt verwijderd" + disabled confirm button until checked
- Confirm message includes student count: `Klas '${naam}' bevat ${count} leerlingen.`
- After deletion of last class: `setView('import')`

### UI-DET — Spiderweb groter + FeedbackActiepunten naar onderkant
- `.spider-card` width: `160px` → `280px` (or responsive); SVG needs `viewBox` + `width="100%"`
- `FeedbackActiepuntenSection` moved to last position in `DetailWeergave.tsx` JSX
- No logic changes — pure CSS + JSX reorder

### UI-NAV — Nav banner + logo 2x
- `#main-nav min-height: 52px` → `104px`
- `.nav-stripe { height: 52px }` → `104px` (must always match `min-height`)
- Logo `height` in `KlasTabStrip.tsx` inline style: `36px` → `72px`
- Test diagonal stripe renders correctly after height change

---

## 3. Architecture Integration

**New files:** `KeuzedeelSection.tsx`, `KlasVerwijderenModal.tsx`

**Modified files:**
| File | Change |
|------|--------|
| `utils/datamodel.ts` | Add `Keuzedeel` type + `keuzedelen?` field on StudentRecord |
| `utils/bpv.ts` | Update 5 candidate string arrays in `parseBpvExcel()` |
| `src/components/LeerlingTegel.tsx` | Add R&N badge row |
| `src/components/KlasOverzicht.tsx` | Pass `rekenResultaat` / `nederlandsResultaat` to LeerlingTegel |
| `src/components/DetailWeergave.tsx` | Add KeuzedeelSection, reorder sections (FeedbackActiepunten last) |
| `src/components/KlasTabStrip.tsx` | Logo height 2x |
| `src/App.tsx` | `canDelete` logic update, mount `KlasVerwijderenModal` |
| `src/index.css` | Nav height, spider-card size, nav-stripe height |

**Suggested build order:**
1. UI-NAV + UI-DET (pure CSS/JSX, zero risk)
2. TEGEL-RN (read-only, existing data)
3. KLS-DEL (isolated modal, established pattern)
4. KZLD (new field + component, moderate scope)
5. BPV (blocked on real file — build when file arrives)

---

## 4. Critical Watch Out For

**1. Nav stripe hardcoded to 52px** — `.nav-stripe { height }` must always equal `#main-nav { min-height }`. Update both together. Consider replacing `height: 52px` with `height: 100%` on the stripe element.

**2. Spider SVG fixed at 160px** — Use `viewBox` + `width="100%"` on the SVG element so it fills the resized `.spider-card` container. Without this, the chart stays tiny in a larger box.

**3. Keuzedelen field undefined on old records** — `student.keuzedelen ?? []` at every read site from day one. Never call `.length` or `.map()` without this guard. Same pattern as `rekenResultaat ?? null` (Phase 23).

**4. BJ2 reactivity bug for R&N tiles** — `rekenResultaat` mutations must land on ALL records for a `leerlingId` (not just the current active record). Use the verzuim pattern: `appState.students.filter(s => s.leerlingId === id).forEach(s => s.rekenResultaat = value)`.

**5. Hardcoded hex colors break dark mode** — After every new JSX file with `style={}`, grep `src/components/` for `#[0-9a-fA-F]`. Must return zero matches. Use only CSS variables (`var(--text-primary)`, `var(--status-groen-text)`, etc.).

---

## 5. Open Questions (resolve at plan time)

| Question | Needed for | When |
|----------|-----------|------|
| Exact BPV column names in real SomToday export | BPV plan | When user provides file; run `debugBpvExcel()` |
| Spider SVG current `width`/`height`/`viewBox` values | UI-DET plan | Read `SpiderChartCard.tsx` + `utils/spider.ts` |
| Keuzedelen: student-level (all periods) or period-level? | KZLD plan | Student-level assumed (same as R&N pattern) |
| `canDelete` on active class: keep false or use settings panel? | KLS-DEL plan | Keep false for active class (safer UX, simpler) |

---

*Sources: Direct codebase inspection of utils/klassen.ts, utils/bpv.ts, utils/datamodel.ts, utils/schema.ts, src/App.tsx, src/components/KlasTabStrip.tsx, src/components/LeerlingTegel.tsx, src/components/DetailWeergave.tsx, src/components/SpiderChartCard.tsx, src/index.css, .planning/STATE.md, phase summaries 22–29.*
