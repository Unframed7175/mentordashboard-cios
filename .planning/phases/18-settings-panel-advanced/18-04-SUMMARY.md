---
phase: 18-settings-panel-advanced
plan: "04"
subsystem: settings-ui
tags: [settings-ui, deelgebieden, leerlijnen, table, css, tdd, wave-2]
dependency_graph:
  requires:
    - 18-02 (utils/deelgebieden.ts + utils/leerlijnen.ts + LazyStore utilities)
  provides:
    - src/components/SettingsPage.tsx — section 3 deelgebieden table (SET-03 + SET-04)
    - src/index.css — CSS section 25 with dg-* classes
  affects:
    - src/components/SettingsPage.tsx (section 3 placeholder replaced with table)
    - src/index.css (new section 25 appended after section 24)
tech_stack:
  added: []
  patterns:
    - NaamInput inline component with blur/Enter apply, Escape revert, useEffect sync
    - Instant-apply pattern (state update before async store write — pitfall 5)
    - Inline confirmation without modal (confirmingReset boolean state — D-03)
    - TDD RED/GREEN cycle for section 3 behavior tests
key_files:
  created: []
  modified:
    - src/components/SettingsPage.tsx (section 3 implemented, section 4 placeholder unchanged)
    - src/index.css (section 25 with 16 dg-* CSS rules appended after section 24)
    - tests/SettingsPage.test.tsx (8 new section 3 RED tests + vi.hoisted mock refactor)
decisions:
  - "NaamInput extracted as inline component to manage per-row local state (value + blur logic)"
  - "vi.hoisted() used for deelgebieden/leerlijnen mocks to avoid TDZ error in vi.mock factory"
  - "Section 4 placeholder left intentionally (Plan 18-05 scope per plan specification)"
  - "Worktree lacked Phase 16-18 files — merged master (fast-forward) before Task 1 to unblock"
metrics:
  duration: "~900s"
  completed: "2026-05-18"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 3
---

# Phase 18 Plan 04: Deelgebieden & Leerlijnen Settings UI Summary

**One-liner:** 19-row deelgebieden table with inline Naam input, Leerlijn dropdown, and Actief toggle in SettingsPage section 3, plus Herstel standaard inline confirmation and CSS section 25 dg-* classes.

## What Was Built

Wave 2 implementation of the "Deelgebieden & Leerlijnen" section (section 3) in SettingsPage.tsx. This delivers SET-03 (rename and deactivate deelgebieden) and SET-04 (leerlijn reassignment) as a fully interactive 19-row table.

### Final Structure of Section 3

```
<section className="detail-section">
  <h2 className="detail-section-title">Deelgebieden & Leerlijnen</h2>
  <div className="dg-settings-table-wrap">         <!-- max-height 420px, scrollable -->
    <table className="dg-settings-table">
      <thead><tr>
        <th>Naam</th>
        <th style={{ width: 160 }}>Leerlijn</th>
        <th style={{ width: 68 }}>Actief</th>
      </tr></thead>
      <tbody>
        {dgConfig.map(row => (
          <tr key={row.id} className="dg-settings-row">
            <td><NaamInput id={row.id} label={row.label} onApply={handleNaamApply} /></td>
            <td><select className="dg-leerlijn-select" ...>Lesgeven/Organiseren/Prof.handelen</select></td>
            <td><label className="toggle-switch dg-toggle"><input type="checkbox" className="sr-only" .../></label></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  {/* Herstel standaard button OR inline confirmation */}
</section>
```

### The Four Handlers

| Handler | Store calls |
|---------|-------------|
| `handleNaamApply(id, newLabel)` | `setDgConfig(next)` → `await saveDeelgebiedenConfig(next)` |
| `handleLeerlijnChange(id, leerlijn)` | `setLeerlijnenMapping(nextMapping)` → `await saveLeerlijnenMapping(nextMapping)` |
| `handleActiveToggle(id, active)` | `setDgConfig(next)` → `await saveDeelgebiedenConfig(next)` |
| `handleReset()` | `await Promise.all([resetDeelgebiedenConfig(), resetLeerlijnenMapping()])` → re-fetch → `setDgConfig` + `setLeerlijnenMapping` + `setConfirmingReset(false)` |

All handlers follow the instant-apply pattern: state updated before async store write so UI feels immediate.

### NaamInput Component

Inline component that:
- Maintains local `value` state initialized to `label`
- Re-syncs via `useEffect([label])` when label changes externally (after reset)
- On blur: if changed and non-empty → calls `onApply(id, trimmed)`; else reverts to `label`
- On Enter keydown: blurs input (triggers same logic)
- On Escape keydown: reverts to `label` and blurs (no save fires)

### Herstel Standaard Inline Confirmation

Controlled by `confirmingReset` boolean state:

```
{!confirmingReset
  ? <button ... onClick={() => setConfirmingReset(true)}>Herstel standaard</button>
  : <div ...>
      <span>Alles terugzetten naar standaard?</span>
      <button ... onClick={() => setConfirmingReset(false)}>Niet herstellen</button>
      <button ... onClick={handleReset}>Ja, herstel</button>
    </div>
}
```

No modal — inline in-place replacement per D-03.

## CSS Section 25

Section 25 was appended after the final rule of section 24 in `src/index.css`. Section 24 header and all its rules are unchanged.

Section 25 contains ONLY dg-* classes (16 rules total):
- `.dg-settings-table-wrap` — scrollable table container (max-height 420px)
- `.dg-settings-table` — table layout
- `.dg-settings-row`, `.dg-settings-row:last-child`, `:nth-child(even/odd)`, `:hover td`
- `.dg-naam-input`, `.dg-naam-input:focus`
- `.dg-leerlijn-select`, `.dg-leerlijn-select:focus`
- `.dg-toggle .toggle-track` / `.toggle-thumb` size overrides
- `.dg-toggle .toggle-track:not(.on)/.on .toggle-thumb` position transforms
- `.dg-settings-table thead th` sticky header styling

**Note for 18-05:** Append threshold and BPV CSS classes BELOW the existing dg-* rules in section 25. Do NOT add a new section header — 18-05 adds to the SAME section 25 block.

## TDD Gate Compliance

RED gate commit: `f7431c4` — 8 failing section 3 tests added to tests/SettingsPage.test.tsx  
GREEN gate commit: `e7a63ad` — implementation turns all 8 tests GREEN

## Test Counts

- SettingsPage.test.tsx section 3 tests: **8/8 GREEN** (new — SET-03 + SET-04)
- SettingsPage.test.tsx pre-existing tests: **6/6 GREEN** (unchanged)
- Full suite: **85/85 passing** + 4 expected RED (status.test.ts + prognosis.test.ts — Phase 18-03 scope, not regressions)
- typecheck-migrated: **0 errors**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Merged master into worktree to unblock file access**
- **Found during:** Plan startup (pre-Task 1)
- **Issue:** The worktree branch `worktree-agent-aad5fc9e5f01b26ab` was spawned from commit 77426d1 (Phase 15), which predates Phase 17 (when SettingsPage.tsx and src/index.css were created). Both target files were absent from the worktree.
- **Fix:** `git merge master --no-edit` — fast-forward merge bringing in all Phase 16–18 commits (74 files). No conflicts.
- **Impact:** None on final output — fast-forward merge preserves all history.

**2. [Rule 1 - Bug] vi.hoisted() required for deelgebieden/leerlijnen module mocks**
- **Found during:** Task 2 RED test phase (first test run)
- **Issue:** `vi.mock('../utils/deelgebieden', () => ({ ... }))` factory referenced `mockGetDeelgebiedenConfig` which was declared as a top-level `const` — TDZ error because `vi.mock` is hoisted to top of file before variable declarations.
- **Fix:** Moved all mock function variables inside `vi.hoisted()` return object so they're available before `vi.mock` factories execute.
- **Files modified:** `tests/SettingsPage.test.tsx`

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Section 4 `<p className="settings-placeholder-text">Komt in een volgende versie.</p>` | `src/components/SettingsPage.tsx` | Intentional — Plan 18-05 implements Drempelwaarden & BPV-uren section |

Section 4 stub is expected and does not block SET-03/SET-04 delivery.

## Threat Flags

No new threat surface introduced. SettingsPage section 3 handles only user-supplied deelgebied names (rendered via React JSX string escaping — no `dangerouslySetInnerHTML`). No new network endpoints, auth paths, or file access patterns.

## Self-Check: PASSED

- src/components/SettingsPage.tsx: EXISTS, contains `dg-settings-table-wrap`, `getDeelgebiedenConfig`, `saveDeelgebiedenConfig`, `resetDeelgebiedenConfig`, `getLeerlijnenMapping`, `saveLeerlijnenMapping`, `resetLeerlijnenMapping`, `confirmingReset`, `Herstel standaard`, `Alles terugzetten naar standaard?`, `Niet herstellen`, `Ja, herstel`
- src/index.css: EXISTS, contains `25. SettingsPage Phase 18`, `dg-settings-table-wrap`, `dg-naam-input`, `dg-leerlijn-select`, `dg-toggle`, does NOT contain `settings-threshold-group` or `bpv-bar-track`
- tests/SettingsPage.test.tsx: EXISTS, contains 8 new section 3 tests, all GREEN
- Commits verified:
  - 5f96a42: feat(18-04): add CSS section 25 deelgebieden classes to index.css
  - f7431c4: test(18-04): add failing section 3 tests for deelgebieden table (RED)
  - e7a63ad: feat(18-04): implement section 3 deelgebieden table in SettingsPage.tsx (GREEN)
- Full suite: 85 passing + 4 expected RED (18-03 scope)
- typecheck-migrated: 0 errors
