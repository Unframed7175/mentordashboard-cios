---
phase: 27-klasbeheer
verified: 2026-05-26T19:15:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Hover over an empty-klas tab (0 students) — confirm the × button appears on hover"
    expected: "× button fades in on mouse hover, is invisible at rest"
    why_human: "CSS opacity transition cannot be verified by grep; requires a running browser"
  - test: "Tab-focus (keyboard Tab key) onto a tab — confirm × button appears via :focus-within"
    expected: "× button visible when tab has keyboard focus, not just mouse hover"
    why_human: ":focus-within CSS behaviour requires live browser rendering to confirm"
  - test: "Double-click a tab naam — confirm inline input appears with text pre-selected"
    expected: "Input appears with autoFocus, existing name is fully selected so user can type immediately"
    why_human: "input.select() pre-selection cannot be asserted in jsdom tests (fireEvent does not trigger browser text selection); requires manual smoke"
  - test: "Rename a klas via Enter — confirm the tab strip label updates immediately without page reload"
    expected: "Tab strip re-renders with new name after Enter; KlasOverzicht header (if any) also reflects updated name"
    why_human: "KLS-03 end-to-end name propagation requires a running Tauri app with encrypted store; cannot be verified by unit tests alone"
  - test: "Click × on an empty klas tab — confirm window.confirm dialog appears; on OK, tab is removed"
    expected: "Confirm dialog shows klas name; on confirm, tab disappears and another tab activates"
    why_human: "window.confirm interaction requires a browser context; jsdom tests only verify the handler wiring"
  - test: "Attempt to delete a non-empty klas — confirm no × button is visible on its tab"
    expected: "Tabs for classes with students have no × button at all (not even hidden)"
    why_human: "canDelete=false hides the button via conditional render; confirm with a real import that the computed value is correct"
---

# Phase 27: Klasbeheer Verification Report

**Phase Goal:** KLS-01 (hover × delete for empty klassen), KLS-02 (inline rename via double-click), KLS-03 (name change immediately visible in tab strip)
**Verified:** 2026-05-26T19:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

Plan 01 must-haves (KLS-02 / KLS-03 utility layer):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `renameKlas(klasId, newNaam)` exists as an exported async function in `utils/klassen.ts` | VERIFIED | Lines 117-125: `export async function renameKlas(klasId: string, newNaam: string): Promise<boolean>` |
| 2 | `renameKlas` updates the `naam` field on the klas object in `klassenState.klassen` | VERIFIED | Line 122: `klassenState.klassen[klasId].naam = newNaam` |
| 3 | `renameKlas` calls `saveKlassen()` and persists the new name across a simulated app restart | VERIFIED | Line 123: `await saveKlassen(); return true`. RNM-01 test asserts naam survives a full reset+reload cycle (lines 108-114 of storage.test.ts) |
| 4 | `renameKlas` returns false for unknown klasId and does not call saveKlassen | VERIFIED | Lines 119-121: early-return `false` guard. RNM-02 test confirms no side effects (storage.test.ts line 121-127) |
| 5 | After rename + save + reload, existing student data on the klas is unchanged (data integrity) | VERIFIED | RNM-01 test (storage.test.ts line 116): `expect(klassenState.klassen['klas_1'].students).toEqual(originalStudents)` asserts data integrity explicitly |

Plan 02 must-haves (KLS-01 / KLS-02 / KLS-03 UI layer):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | Each tab is a `<div role="tab">` element (NOT a `<button>`), so the inner × `<button>` is valid HTML | VERIFIED | KlasTabStrip.tsx line 64: `role="tab"` on the wrapping `<div>`. The only `<button>` elements are + create, settings gear, and the × delete button |
| 7 | A × button appears (and is invisible otherwise) inside each tab whose klas has `canDelete === true` | VERIFIED | KlasTabStrip.tsx lines 100-109: conditional render `{klas.canDelete && <button className="delete-tab-btn" ...>}`. CSS hides it by default (`opacity: 0; pointer-events: none`). TAB-01 test asserts exactly 1 delete button for 2 klassen (one canDelete=true, one false) |
| 8 | Clicking × triggers `window.confirm` with the klas name, then calls `deleteKlas` and `setRefreshKey` on confirm | VERIFIED | App.tsx lines 104-111: `handleDeleteKlas` calls `window.confirm(...)` then `await deleteKlas(klasId)` then `setRefreshKey(k => k + 1)` |
| 9 | Double-clicking a tab's name span replaces it with a focused inline `<input>` pre-filled with the current naam; Pressing Enter or blur saves; Escape cancels; empty trim reverts | VERIFIED | KlasTabStrip.tsx lines 70-98: conditional render of `<input ... className="tab-rename-input">` when `editingKlasId === klas.id`. `commitRename` guards empty trim (lines 47-51). TAB-02 and TAB-03 tests confirm double-click, Enter save, and Escape cancel |
| 10 | `commitRename()` is guarded by `isCommittingRef` so Enter-then-blur does not double-submit; saving calls `onRenameKlas` then `setRefreshKey` | VERIFIED | KlasTabStrip.tsx lines 43-56: `isCommittingRef.current` guard pattern. App.tsx lines 113-116: `handleRenameKlas` calls `renameKlas` then `setRefreshKey(k => k + 1)` |

**Score: 10/10 truths verified**

---

### Requirements Coverage

| REQ-ID | Source Plan | Description | Status | Evidence |
|--------|-------------|-------------|--------|----------|
| KLS-01 | 27-02 | Empty klas (0 leerlingen) toont "Verwijder klas" knop in tab | SATISFIED | `canDelete` prop computed in App.tsx as `students.length === 0`; × button rendered only when `canDelete === true`; CSS reveals on hover/:focus-within |
| KLS-02 | 27-01, 27-02 | Mentor kan naam wijzigen zonder data te verliezen | SATISFIED | `renameKlas()` mutates only `naam` field; RNM-01 proves `students` is intact after full persist/reload cycle; inline rename UX wired end-to-end |
| KLS-03 | 27-01, 27-02 | Klasnaam-wijziging is direct zichtbaar in tab-strip en alle onderdelen | SATISFIED | `handleRenameKlas` calls `setRefreshKey(k => k + 1)` after `renameKlas()`; this forces App.tsx to re-derive `klassen` prop from `klassenState.klassen` and re-render KlasTabStrip with updated naam |

No orphaned requirements found. REQUIREMENTS.md maps KLS-01/02/03 to Phase 27 — all three are covered by plans 27-01 and 27-02.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `utils/klassen.ts` | `renameKlas` export | VERIFIED | Lines 117-125; exported async function, correct signature |
| `tests/storage.test.ts` | RNM-01, RNM-02 unit tests | VERIFIED | Lines 92-127; both tests import and call `renameKlas`; full data-integrity assertion present in RNM-01 |
| `src/components/KlasTabStrip.tsx` | hover × delete + double-click inline rename, `<div role="tab">` outer wrapper | VERIFIED | 132 lines; `editingKlasId` state (line 31), `isCommittingRef` (line 33), `canDelete` conditional delete button (line 100), `<div role="tab">` outer wrapper (line 64) |
| `src/components/KlasOverzicht.tsx` | delete button removed (D-07) | VERIFIED | `grep handleDelete`, `grep "Klas verwijderen"`, `grep onKlasDeleted`, `grep deleteKlas` all return 0 matches |
| `src/App.tsx` | `handleDeleteKlas` and `handleRenameKlas` wired to KlasTabStrip | VERIFIED | Lines 104-116: both handlers present; lines 138-139: `onDeleteKlas={handleDeleteKlas}` and `onRenameKlas={handleRenameKlas}` passed as props |
| `src/index.css` | CSS for `.delete-tab-btn` (hover + :focus-within) and `.tab-rename-input` | VERIFIED | Lines 316-348: 3 rules for `.delete-tab-btn` (base opacity:0, :hover opacity:1, :focus-within opacity:1); `.tab-rename-input` with `min-width`/`max-width` only (no hard `width:`) |
| `tests/KlasTabStrip.test.tsx` | TAB-01, TAB-02, TAB-03 component tests | VERIFIED | 161 lines; TAB-01 (canDelete button count), TAB-02 (double-click input), TAB-03 Enter + Escape — all present and role-based assertions used |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `utils/klassen.ts` | `tests/storage.test.ts` | named import `renameKlas` | WIRED | storage.test.ts line 36: `import { ..., renameKlas } from '../utils/klassen'` |
| `src/App.tsx` | `src/components/KlasTabStrip.tsx` | `onDeleteKlas` and `onRenameKlas` props | WIRED | App.tsx lines 138-139 pass handlers; KlasTabStrip.tsx lines 11-12 declare props; lines 105, 53 call them |
| `src/components/KlasTabStrip.tsx` | `utils/klassen.ts` | `onRenameKlas` callback (which calls `renameKlas`) | WIRED | Indirect via App.tsx: `handleRenameKlas` calls `renameKlas` (App.tsx line 114); KlasTabStrip calls `onRenameKlas` (line 53) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `KlasTabStrip.tsx` | `klassen` prop (tab names) | `Object.values(klassenState.klassen)` in App.tsx line 129-133 | Yes — derived from live in-memory singleton populated by `loadKlassen()` on app start | FLOWING |
| `KlasTabStrip.tsx` | `canDelete` (delete eligibility) | `(klas.students?.length ?? 1) === 0` computed in App.tsx line 132 | Yes — real student array length from klassenState | FLOWING |
| `KlasOverzicht.tsx` | student list / klas header | Props from App.tsx + `getActiveStudents()` (pre-existing pattern) | Yes — existing verified data flow, unchanged by Phase 27 | FLOWING (pre-existing) |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| RNM-01 and RNM-02 tests pass | `npx vitest run tests/storage.test.ts` | 6 tests passed (includes RNM-01, RNM-02 and pre-existing STO tests) | PASS |
| TAB-01, TAB-02, TAB-03 component tests pass | `npx vitest run tests/KlasTabStrip.test.tsx` | 9 tests passed (4 Phase 17 gear tests + 5 Phase 27 TAB tests) | PASS |
| Full test suite | `npx vitest run` | 157 passed, 5 skipped, 0 failures | PASS |
| TypeScript compile (phase files only) | `npx tsc --noEmit` | 4 errors — all pre-existing before Phase 27 (confirmed by `git show fc38499:src/App.tsx` and `utils/spider.tsx`) | INFO (pre-existing, not a Phase 27 regression) |

**Note on TypeScript errors:** `tsc --noEmit` reports 4 errors in `src/App.tsx`, `src/components/SettingsPage.tsx`, `tests/spider.test.ts`, and `utils/spider.tsx`. All four exist verbatim in the pre-Phase-27 commit `fc38499`. None of the Phase 27 files (`KlasTabStrip.tsx`, `KlasOverzicht.tsx`, `utils/klassen.ts`) contribute any new TS errors.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `utils/klassen.ts` | 19-27 | `// Phase 14: replace with proper React component` comment on `showStorageError` | INFO | Pre-existing from Phase 12; not introduced by Phase 27 |

No TBD, FIXME, XXX, or PLACEHOLDER markers found in Phase 27 modified files.

---

### Human Verification Required

#### 1. Hover × Button Visibility

**Test:** Open the app in a running Tauri dev window. Import at least one student into klas A so it is non-empty. Create an empty klas B. Hover over the klas B tab.
**Expected:** A × button fades in on hover inside the klas B tab. Hovering over klas A (non-empty) shows no × button.
**Why human:** CSS `opacity` transition triggered by `:hover` cannot be asserted in jsdom unit tests; requires a live browser rendering engine.

#### 2. Keyboard :focus-within Accessibility

**Test:** Tab-navigate (keyboard) to an empty klas tab and confirm it receives focus.
**Expected:** The × delete button becomes visible when the tab has keyboard focus (`:focus-within` CSS rule).
**Why human:** `:focus-within` CSS behaviour requires a live browser context.

#### 3. Input Pre-Selection on Double-Click

**Test:** Double-click a tab naam (e.g., "Klas A").
**Expected:** An inline text input appears with the full klas name pre-selected (blue highlight / text cursor covers all characters) so the user can type immediately without first selecting the old name.
**Why human:** `inputRef.current.select()` runs in a `useEffect` after React renders. jsdom's `fireEvent.doubleClick` exercises the state change but does not simulate browser text-selection mechanics.

#### 4. KLS-03 End-to-End Name Propagation

**Test:** Rename a klas via double-click + Enter. Observe the tab strip label and any other view that shows the klas name (e.g., KlasOverzicht header if it renders naam).
**Expected:** Tab strip label updates immediately after Enter without page reload. If KlasOverzicht shows the klas naam in a heading, it also reflects the new name.
**Why human:** Requires a running Tauri app with the real encrypted plugin-store; `setRefreshKey` triggering a full re-render cascade can only be confirmed visually in a live session.

#### 5. Delete Flow — Confirm Dialog and Tab Removal

**Test:** Click the × button on an empty klas tab. Interact with the `window.confirm` dialog.
**Expected:** Dialog shows klas name in the message. On "OK", the tab disappears and the next available klas becomes active. On "Annuleren", nothing changes.
**Why human:** `window.confirm` in jsdom is a no-op; actual dialog interaction requires a Tauri WebView.

#### 6. canDelete Runtime Accuracy

**Test:** Import students into a klas; confirm its × button disappears (or was never shown). Remove all students; confirm × button reappears after the next refresh.
**Expected:** canDelete is computed from live `students.length` on every render; tabs with students are always non-deletable.
**Why human:** Requires a full import → delete workflow in a running app to verify `students?.length ?? 1` fallback evaluates correctly with real data.

---

### Gaps Summary

No automated gaps found. All 10 must-have truths are VERIFIED by codebase inspection and passing tests. The 6 human verification items are observational/UX checks that require a running Tauri application — they cannot be falsified by static analysis or unit tests. Status is `human_needed` pending these checks.

---

_Verified: 2026-05-26T19:15:00Z_
_Verifier: Claude (gsd-verifier)_
