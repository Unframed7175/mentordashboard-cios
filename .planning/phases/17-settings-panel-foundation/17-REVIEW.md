---
phase: 17-settings-panel-foundation
reviewed: 2026-05-17T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - src/index.css
  - src/App.css
  - src/App.tsx
  - src/main.tsx
  - src/components/KlasTabStrip.tsx
  - src/components/ImportPage.tsx
  - src/components/SettingsPage.tsx
  - src/components/DeelgebiedenMatrix.tsx
  - utils/settings.ts
  - tests/SettingsPage.test.tsx
  - tests/KlasTabStrip.test.tsx
  - tests/vitest-setup.js
  - vitest.config.ts
findings:
  critical: 2
  warning: 7
  info: 5
  total: 14
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-05-17
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Phase 17 delivers a settings panel (dark-mode toggle, file import shortcut), a refactored `KlasTabStrip` that receives data as props, a `utils/settings.ts` persistence helper, and gap-closure plan 17-04 which added dark-mode CSS overrides for `DeelgebiedenMatrix` category headers, score chips, and gap badges, plus a partial refactor of `DeelgebiedenMatrix.tsx` to use CSS classes instead of inline styles.

The two existing blockers (CR-01, CR-02) remain valid. Gap-closure 17-04 introduces no new critical issues, but the CSS class refactor in `DmChip` is incomplete — inline styles on the component still override the new CSS class values, meaning the refactor has no practical effect on rendering. Two additional warnings and three info items are added from the new files.

---

## Critical Issues

### CR-01: `handleOpenSettings` unsafe type cast traps user in settings view

**File:** `src/App.tsx:36`

**Issue:** `setPrevView(view as 'import' | 'klas' | 'detail')` uses a forced cast to suppress the TypeScript error when `view` is `'settings'`. Because the gear button (`onSettings={handleOpenSettings}`) is rendered unconditionally in `KlasTabStrip` and remains clickable while on the settings page, clicking the gear icon a second time calls `handleOpenSettings` with `view === 'settings'`. This writes the string `'settings'` into `prevView` despite the type claiming it cannot hold that value. When the user then clicks "← Terug", `handleBackFromSettings` calls `setView(prevView)` which sets `view` to `'settings'` again — the back button no longer escapes the settings page.

**Fix:** Guard against re-entering the settings callback, or remove the unsafe cast and widen the `prevView` type. The safest fix is to guard at the call site:

```ts
function handleOpenSettings() {
  if (view === 'settings') return; // already on settings — no-op
  setPrevView(view); // view is narrowed to 'import' | 'klas' | 'detail' here
  setView('settings');
}
```

Alternatively, widen the `prevView` state type and add a safe fallback in `handleBackFromSettings`:

```ts
const [prevView, setPrevView] = useState<'import' | 'klas' | 'detail' | 'settings'>('klas');

function handleBackFromSettings() {
  setView(prevView === 'settings' ? 'klas' : prevView);
}
```

---

### CR-02: `App.css` conflicts with the design system and nukes focus rings

**File:** `src/App.css:8-22`, `src/App.css:89-91`

**Issue:** `App.css` is **never imported** by any source file in the project — it is dead scaffolding left over from the Tauri/Vite template. However, its content is actively dangerous if it is ever accidentally imported:

1. Lines 8–22 define a `:root` block with hardcoded `color: #0f0f0f` and `background-color: #f6f6f6`, directly conflicting with the design-token system in `src/index.css`.
2. Lines 89–91 set `input, button { outline: none }` globally, which destroys keyboard focus rings for all interactive elements — a critical accessibility regression that would nullify the careful `:focus-visible` rules in `index.css`.

The file should be deleted. If kept, it must at minimum be stripped of the `:root` block and the `outline: none` rule.

**Fix:**

```bash
# Delete the file entirely — it is never imported and has no usable content
rm src/App.css
```

If deletion is not acceptable, at minimum remove the conflicting rules:
- Delete lines 8–22 (the `:root` block)
- Delete lines 89–91 (`input, button { outline: none }`)

---

## Warnings

### WR-01: `handleToggle` in `SettingsPage` silently drops `saveSettings` rejection

**File:** `src/components/SettingsPage.tsx:47-52`

**Issue:** `handleToggle` is declared `async` and calls `await saveSettings({ theme })`, but the function is invoked directly from `onChange` without any `.catch()` or try/catch wrapper. If `store.save()` throws (e.g., disk full, plugin-store unavailable), the rejection is an unhandled promise that is silently swallowed. The user sees no error, but their theme preference is not persisted. The DOM update (`applyTheme`) has already fired, so the visual state and stored state diverge.

**Fix:**

```tsx
async function handleToggle(checked: boolean) {
  const theme: Theme = checked ? 'dark' : 'light';
  applyTheme(theme);
  setIsDark(checked);
  try {
    await saveSettings({ theme });
  } catch (err) {
    console.warn('[SettingsPage] saveSettings failed:', err);
    // Optionally surface a toast or revert: applyTheme(checked ? 'light' : 'dark'); setIsDark(!checked);
  }
}
```

---

### WR-02: Rapid toggle clicks can issue concurrent `saveSettings` calls

**File:** `src/components/SettingsPage.tsx:47-52`

**Issue:** The `handleToggle` function fires on every checkbox `onChange` event. Because `handleToggle` is async and the checkbox is never disabled during the save, a user who clicks the toggle multiple times in quick succession will issue multiple concurrent `store.set` + `store.save()` operations against the same key. The final persisted value depends on the order in which the `LazyStore` internal promises resolve — which is non-deterministic.

**Fix:** Disable the checkbox while a save is in progress:

```tsx
const [isSaving, setIsSaving] = useState(false);

async function handleToggle(checked: boolean) {
  if (isSaving) return;
  setIsSaving(true);
  const theme: Theme = checked ? 'dark' : 'light';
  applyTheme(theme);
  setIsDark(checked);
  try {
    await saveSettings({ theme });
  } catch (err) {
    console.warn('[SettingsPage] saveSettings failed:', err);
  } finally {
    setIsSaving(false);
  }
}

// In JSX:
<input
  type="checkbox"
  className="sr-only"
  checked={isDark}
  disabled={isSaving}
  onChange={e => handleToggle(e.target.checked)}
  aria-label="Donkere modus"
/>
```

---

### WR-03: Duplicate OS-preference detection logic in `main.tsx`

**File:** `src/main.tsx:20-22` and `src/main.tsx:31-32`

**Issue:** The `matchMedia('(prefers-color-scheme: dark)').matches` check is written out identically in two separate branches within the same outer try/catch block (lines 20–22 in the happy path and lines 31–32 in the catch block). This duplication means any future change to the OS-preference detection (e.g., adding a listener for live updates) must be applied in two places.

**Fix:** Extract into a helper or restructure so there is a single call site:

```ts
function getOsTheme(): 'dark' | 'light' {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

// Then use getOsTheme() in both the normal and error paths.
```

---

### WR-04: `KlasTabStrip` uses an emoji character as a UI icon

**File:** `src/components/KlasTabStrip.tsx:43`

**Issue:** The settings button renders the gear character as `⚙` (U+2699 GEAR). The project's UI skill (`SKILL.md`) explicitly states: "No emoji icons — use SVG icons (Heroicons, Lucide, Simple Icons)." Beyond the style rule, emoji rendering varies between OS and browser, is not reliably scalable, and cannot be styled with CSS `color` reliably on all platforms.

**Fix:** Replace with a Lucide or Heroicons SVG:

```tsx
// Using an inline SVG (no extra dependency):
<button
  className={`nav-tab${isSettingsActive ? ' active' : ''}`}
  style={{ marginLeft: 'auto' }}
  title="Instellingen"
  aria-label="Instellingen openen"
  onClick={onSettings}
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
             a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
             A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
             l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
             A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
             l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
             a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
             l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
             a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
</button>
```

---

### WR-05: Test coverage excludes `src/components` — component branches are unmeasured

**File:** `vitest.config.ts:10-12`

**Issue:** The `coverage.include` array only lists `utils/**` and `parsers/**`. The newly added `src/components/SettingsPage.tsx` and `src/components/KlasTabStrip.tsx` (as well as all other components) are excluded from coverage reporting. The tests in `tests/SettingsPage.test.tsx` do run, but their coverage data is never collected or enforced, so branch gaps in component code are invisible in CI.

**Fix:**

```ts
coverage: {
  provider: 'v8',
  include: ['utils/**', 'parsers/**', 'src/components/**'],
},
```

---

### WR-06: `DmChip` inline styles override `.dm-chip` CSS class — refactor is incomplete

**File:** `src/components/DeelgebiedenMatrix.tsx:30`

**Issue:** The gap-closure refactor added `.dm-chip` as a CSS class (with `width: 1.625rem`, `height: 1.625rem`, `border-radius: 6px`, etc.) but the `DmChip` component's JSX still carries a `style={{...}}` prop that sets conflicting values: `width: '1.5rem'`, `lineHeight: '1.6rem'`, `borderRadius: '4px'`, `fontWeight: 700`, `fontSize: '0.72rem'`, `textAlign: 'center'`. Inline styles always win over class styles in CSS cascade, so the CSS class values for `width` and `border-radius` are silently overridden. The refactor has no practical effect on rendered output.

The chip height (1.625rem from `.dm-chip`) is also not enforced because the inline styles do not set `height`, leaving a mixed sizing model: height from CSS class, width from inline style.

**Fix:** Remove all inline styles from the chip `<span>` and rely entirely on the `.dm-chip` class:

```tsx
function DmChip({ score }: { score: string | null | undefined }) {
  if (!score) {
    return <span className="dm-chip score-none">—</span>;
  }
  const c = SCORE_CHIP_MAP[score];
  return c
    ? <span className={`dm-chip ${c.css}`}>{c.kort}</span>
    : <span className="dm-chip score-none">?</span>;
}
```

Ensure the `.dm-chip` CSS class in `index.css` is complete (it already defines `display`, `align-items`, `justify-content`, `width`, `height`, `border-radius`, `font-weight`, `font-size`, `letter-spacing`). Add `line-height: 1` if centering is needed without the explicit `lineHeight` inline value.

---

### WR-07: `student` prop is declared and destructured but never used

**File:** `src/components/DeelgebiedenMatrix.tsx:7, 49`

**Issue:** After the 17-04 refactor, `student` is listed in the `DeelgebiedenMatrixProps` interface (typed as `any`) and destructured in the function signature, but it is never referenced anywhere in the component body. All data is now sourced from `getAllRecordsForStudent(leerlingId)`. The dead `any`-typed prop adds confusion about what data the component actually requires, and callers must supply a value they do not need.

**Fix:** Remove the `student` prop from the interface and the destructuring:

```tsx
interface DeelgebiedenMatrixProps {
  leerlingId: string;
}

export default function DeelgebiedenMatrix({ leerlingId }: DeelgebiedenMatrixProps) {
```

Update all call sites to stop passing `student`.

---

## Info

### IN-01: `SettingsPage.tsx` re-runs full `loadSettings` on every mount even though `main.tsx` already hydrated the theme

**File:** `src/components/SettingsPage.tsx:24-44`

**Issue:** On every mount of `SettingsPage`, the `useEffect` fires `loadSettings()` and calls `applyTheme()` again. Because `main.tsx` already ran `loadSettings()` and `applyTheme()` at startup, the mount effect duplicates the work. In the normal case this is harmless (idempotent), but it adds one async round-trip to the store on every visit to the settings page, and it means `applyTheme` is called twice on first render. The lazy `useState` initializer (reading `document.body.classList.contains('dark')`) already correctly captures the hydrated state, so the `applyTheme` call inside the effect is redundant when a theme is already persisted.

**Suggestion:** Guard the `applyTheme` call inside the effect behind a condition that only fires it when the loaded theme differs from the current body state:

```ts
if (saved?.theme) {
  const currentlyDark = document.body.classList.contains('dark');
  const savedDark = saved.theme === 'dark';
  if (currentlyDark !== savedDark) {
    applyTheme(saved.theme); // only re-apply if there is a mismatch
  }
  setIsDark(savedDark);
}
```

---

### IN-02: `src/App.css` `input, button { outline: none }` violates accessibility even as dead code

**File:** `src/App.css:89-91`

**Issue:** (Companion to CR-02.) Even setting aside the file being unreferenced, the pattern of globally removing `outline` from `input` and `button` elements is present in the codebase without any comment explaining it is intentional dead scaffolding. Developers inheriting this file may copy the pattern or accidentally import the file. The rule `input, button { outline: none }` without a matching `:focus-visible` re-addition is a WCAG 2.4.7 violation.

**Suggestion:** Either delete the file (per CR-02 recommendation) or add an explicit comment block at the top:

```css
/* DEAD FILE — do not import. Vite/Tauri template scaffold; all styles
   are in src/index.css. This file is retained only for git history. */
```

---

### IN-03: `!datapunten` null-guard in early return is dead code

**File:** `src/components/DeelgebiedenMatrix.tsx:76`

**Issue:** The condition `if (!datapunten || datapunten.length === 0)` checks `!datapunten` first, but `datapunten` is initialized on line 57 as:

```ts
const datapunten: any[] = allRecords.flatMap((r: any) => r.datapunten || []);
```

`Array.prototype.flatMap` always returns an array; `datapunten` is therefore never `null`, `undefined`, or any other falsy value. The `!datapunten` branch can never be true and is dead code. It is harmless but misleads readers into thinking the variable could be nullish.

**Suggestion:** Simplify to:

```ts
if (datapunten.length === 0) {
```

---

### IN-04: Split `body.dark` block creates maintenance hazard in `index.css`

**File:** `src/index.css:111-141` and `143-155`

**Issue:** Gap-closure 17-04 appended a second `body.dark { ... }` block (lines 143–155) immediately after the first one (lines 111–141) rather than merging the new token overrides into the existing block. Both blocks apply correctly (later declarations win for conflicting properties), but the split layout means the dark-mode token overrides for `DeelgebiedenMatrix` are separated from the rest of the dark-mode palette. Future developers searching for dark-mode token values may not realise there is a second block and miss it.

**Suggestion:** Merge lines 143–155 into the existing `body.dark` block at line 111:

```css
body.dark {
  /* ... all existing tokens ... */

  /* DeelgebiedenMatrix category header tokens */
  --dm-lesgeven-bg:        #1e3a5f;
  --dm-lesgeven-text:      #93c5fd;
  --dm-lesgeven-border:    #1d4ed8;
  /* ... etc. */
}
```

---

### IN-05: `GrowthBadge` and `gap-ok/danger/warn/info` dark overrides use hardcoded hex instead of design tokens

**File:** `src/components/DeelgebiedenMatrix.tsx:44-46`, `src/index.css:162-165`

**Issue:** `GrowthBadge` renders growth indicators with hardcoded hex colors (`#16a34a`, `#dc2626`, `#9ca3af`) that do not adapt to dark mode. In dark mode these greens and reds will appear on a dark background — the contrast may be acceptable, but they bypass the token system entirely. Similarly, the dark overrides for `.gap-ok`, `.gap-danger`, `.gap-warn`, `.gap-info` (index.css lines 162–165) hardcode hex values that duplicate values already present in `--status-*` tokens (e.g., `#14532d` duplicates what would be `--status-groen-bg` in dark mode). If the palette tokens change, these hardcoded values will not update.

**Suggestion:** Use CSS variables in the dark override rules, and add CSS classes for `GrowthBadge` instead of inline styles:

```css
/* index.css — dark overrides using tokens */
body.dark .gap-ok     { background: var(--status-groen-bg);  color: var(--status-groen-text);  }
body.dark .gap-danger { background: var(--status-rood-bg);   color: var(--status-rood-text);   }
body.dark .gap-warn   { background: var(--status-oranje-bg); color: var(--status-oranje-text); }
body.dark .gap-info   { background: var(--status-blauw-bg);  color: var(--status-blauw-text);  }

.growth-up   { color: var(--status-groen-text); }
.growth-down { color: var(--status-rood-text);  }
.growth-same { color: var(--text-muted);        }
```

---

_Reviewed: 2026-05-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
