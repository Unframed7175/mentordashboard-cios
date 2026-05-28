# Phase 30: Documentatie, Help & CI — Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 7 (5 new, 2 modified)
**Analogs found:** 5 / 7 (INSTRUCTIES.md and TESTPLAN.md are pure prose — no code analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/HelpPage.tsx` | component | request-response | `src/components/SettingsPage.tsx` | role-match |
| `src/App.tsx` | provider/router | request-response | `src/App.tsx` itself (handleOpenSettings pattern) | exact (self-extension) |
| `src/components/KlasTabStrip.tsx` | component | request-response | `src/components/KlasTabStrip.tsx` itself (isSettingsActive pattern) | exact (self-extension) |
| `.github/workflows/ci.yml` | config | batch | `.github/workflows/release.yml` | exact |
| `tests/HelpPage.test.tsx` | test | request-response | `tests/KlasTabStrip.test.tsx` | role-match |
| `tests/KlasTabStrip.test.tsx` | test | request-response | `tests/KlasTabStrip.test.tsx` itself (extend) | exact (self-extension) |
| `INSTRUCTIES.md` | documentation | — | none | no analog |
| `TESTPLAN.md` | documentation | — | none | no analog |

---

## Pattern Assignments

### `src/components/HelpPage.tsx` (component, request-response)

**Analog:** `src/components/SettingsPage.tsx`

**Imports pattern** (`src/components/SettingsPage.tsx` lines 8–24 — condensed to what HelpPage needs):
```typescript
// HelpPage needs NO util imports — static JSX only.
// Minimal import block mirrors SettingsPage structure:
import { useEffect, useState } from 'react';
// HelpPage needs neither — shown only as contrast.
// Actual HelpPage imports:
// (none beyond React — static content, no store calls)
```

**Props interface pattern** (`src/components/SettingsPage.tsx` lines 26–32):
```typescript
interface SettingsPageProps {
  onBack: () => void;
  onNavigateToImport: () => void;
  isDark: boolean;
  onToggleDark: (isDark: boolean) => void;
  onNormenChanged: () => void;
}
// HelpPage simplification — copy the shape, reduce to one prop:
interface HelpPageProps {
  onBack: () => void;
}
```

**Header + back-button pattern** (`src/components/SettingsPage.tsx` lines 243–248):
```tsx
return (
  <main className="settings-page">
    {/* Header with back button */}
    <div className="settings-header">
      <button className="detail-nav-btn" onClick={onBack}>← Terug</button>
      <h1>Instellingen</h1>
    </div>
    ...
```
HelpPage copies this verbatim, replacing `"Instellingen"` with `"Help"` and `"settings-page"` with `"help-page"`.

**Section pattern** (`src/components/SettingsPage.tsx` lines 251–255):
```tsx
<section className="detail-section">
  <h2 className="detail-section-title">Weergave</h2>
  ...content...
</section>
```
Repeat this structure for each help step (Importeren, Bekijken, Afdrukken, Bug melden). No new CSS classes needed for section bodies — `.detail-section` and `.detail-section-title` are already in `src/index.css`.

**Default export pattern** (`src/components/SettingsPage.tsx` line 82):
```typescript
export default function SettingsPage({ onBack, ... }: SettingsPageProps) {
// HelpPage:
export default function HelpPage({ onBack }: HelpPageProps) {
```

---

### `src/App.tsx` — add `'help'` to view union + handlers (self-extension)

**Analog:** `src/App.tsx` itself — mirror the existing `handleOpenSettings` / `handleBackFromSettings` block exactly.

**View union extension** (`src/App.tsx` lines 14–17):
```typescript
// CURRENT (line 14):
const [view, setView] = useState<'import' | 'klas' | 'detail' | 'settings' | 'onboarding'>(
// AFTER:
const [view, setView] = useState<'import' | 'klas' | 'detail' | 'settings' | 'onboarding' | 'help'>(
```
`prevView` type (`src/App.tsx` line 18) does NOT change — it remains `'import' | 'klas' | 'detail'`.

**Handler pattern to copy verbatim** (`src/App.tsx` lines 63–83):
```typescript
function handleOpenSettings() {
  setSettingsOpenCount(c => c + 1);
  // CR-02: guard against non-content views (settings/onboarding) being stored as prevView
  const safeView = (view === 'import' || view === 'klas' || view === 'detail')
    ? view
    : 'klas';
  setPrevView(safeView);
  setView('settings');
}

function handleBackFromSettings() {
  setView(prevView);
}
```
New handlers — copy structure, drop `setSettingsOpenCount` (not needed for help):
```typescript
function handleOpenHelp() {
  const safeView = (view === 'import' || view === 'klas' || view === 'detail')
    ? view
    : 'klas';
  setPrevView(safeView);
  setView('help');
}

function handleBackFromHelp() {
  setView(prevView);
}
```

**KlasTabStrip usage pattern** (`src/App.tsx` lines 138–153) — add two new props:
```tsx
<KlasTabStrip
  ...existing props...
  onSettings={handleOpenSettings}
  onFeedback={handleFeedback}
  onDeleteKlas={handleDeleteKlas}
  onRenameKlas={handleRenameKlas}
  isSettingsActive={view === 'settings'}
  isDark={isDark}
  {/* ADD: */}
  onHelp={handleOpenHelp}
  isHelpActive={view === 'help'}
/>
```

**JSX view-render pattern** (`src/App.tsx` lines 179–190):
```tsx
{view === 'settings' && (
  <div className="view-slide-in-right" style={{ overflow: 'hidden' }}>
    <SettingsPage
      key={settingsOpenCount}
      onBack={handleBackFromSettings}
      ...
    />
  </div>
)}
// ADD after this block, before the onboarding block (line 191):
{view === 'help' && (
  <div className="view-slide-in-right" style={{ overflow: 'hidden' }}>
    <HelpPage onBack={handleBackFromHelp} />
  </div>
)}
```

**Import line to add** (after `src/App.tsx` line 8 `import SettingsPage`):
```typescript
import HelpPage from './components/HelpPage';
```

---

### `src/components/KlasTabStrip.tsx` — add `onHelp` + `isHelpActive` props (self-extension)

**Analog:** `src/components/KlasTabStrip.tsx` itself — mirror the `isSettingsActive` / `onSettings` pattern exactly.

**Interface extension** (`src/components/KlasTabStrip.tsx` lines 4–16):
```typescript
interface KlasTabStripProps {
  klassen: Array<{ id: string; naam: string; canDelete: boolean }>;
  activeKlasId: string | null;
  onSwitch: (klasId: string) => void;
  onCreateKlas: () => void;
  onSettings: () => void;
  onFeedback: () => void;
  onDeleteKlas: (klasId: string) => void;
  onRenameKlas: (klasId: string, newNaam: string) => void;
  isSettingsActive: boolean;
  isDark: boolean;
  // ADD:
  onHelp: () => void;
  isHelpActive: boolean;
}
```

**Destructuring extension** (`src/components/KlasTabStrip.tsx` lines 21–32):
```typescript
export default function KlasTabStrip({
  klassen, activeKlasId, onSwitch, onCreateKlas,
  onSettings, onFeedback, onDeleteKlas, onRenameKlas,
  isSettingsActive, isDark,
  // ADD:
  onHelp, isHelpActive,
}: KlasTabStripProps) {
```

**Button placement — insert between feedback bug button and settings gear** (`src/components/KlasTabStrip.tsx` lines 127–156).

Feedback button pattern (lines 127–144) — shows the `nav-tab` button style without `marginLeft: 'auto'`:
```tsx
<button
  className="nav-tab"
  title="Fout melden"
  aria-label="Fout melden"
  onClick={onFeedback}
>
  <svg .../>
</button>
```

Settings gear pattern (lines 145–156) — shows `active` class conditional + `marginLeft: 'auto'`:
```tsx
<button
  className={`nav-tab${isSettingsActive ? ' active' : ''}`}
  style={{ marginLeft: 'auto' }}
  title="Instellingen"
  aria-label="Instellingen openen"
  onClick={onSettings}
>
  <svg .../>
</button>
```

New `?` button — insert between feedback and settings, WITHOUT `marginLeft: 'auto'` (settings gear keeps auto-margin):
```tsx
<button
  className={`nav-tab${isHelpActive ? ' active' : ''}`}
  title="Help"
  aria-label="Help openen"
  onClick={onHelp}
>
  ?
</button>
```
Plain `?` character (no SVG) is consistent with the existing `+` button at line 118–126 which also uses a plain character.

---

### `.github/workflows/ci.yml` (config, batch)

**Analog:** `.github/workflows/release.yml` (exact match — derive by modification)

**Trigger diff** (`release.yml` lines 1–7 → `ci.yml`):
```yaml
# release.yml trigger (lines 3–7):
on:
  push:
    tags:
      - 'v*'
  workflow_dispatch: {}

# ci.yml trigger (replace with):
on:
  push:
    branches:
      - main
  workflow_dispatch: {}
```

**Permissions** (`release.yml` lines 9–10): `contents: write` can be dropped — no release creation needed. Omit entirely.

**Matrix** (`release.yml` lines 13–27) — drop the Intel macOS row, keep Windows + Apple Silicon only:
```yaml
# release.yml matrix (lines 17–27) — 3 entries including x86_64-apple-darwin:
matrix:
  include:
    - platform: macos-latest
      args: '--target aarch64-apple-darwin'
      rust-targets: 'aarch64-apple-darwin'
    - platform: macos-latest           # REMOVE THIS ENTRY IN ci.yml
      args: '--target x86_64-apple-darwin'
      rust-targets: 'x86_64-apple-darwin'
    - platform: windows-latest
      args: '--bundles nsis --target x86_64-pc-windows-msvc'
      rust-targets: ''
```

**Build step** (`release.yml` lines 46–57) — remove all release keys, keep only `args`:
```yaml
# release.yml build step (lines 46–57) — HAS release keys:
- name: Build and release
  uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    APPLE_SIGNING_IDENTITY: '-'
  with:
    tagName: ${{ github.ref_name }}         # REMOVE
    releaseName: 'Mentordashboard CIOS ...' # REMOVE
    releaseBody: See the release notes...   # REMOVE
    releaseDraft: false                     # REMOVE
    prerelease: false                       # REMOVE
    args: ${{ matrix.args }}               # KEEP

# ci.yml build step (cleaned):
- name: Build
  uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    APPLE_SIGNING_IDENTITY: '-'
  with:
    args: ${{ matrix.args }}
```
All other steps (checkout, setup-node, rust-toolchain, npm ci) are **copied verbatim** from `release.yml` lines 31–45.

---

### `tests/HelpPage.test.tsx` (test, request-response)

**Analog:** `tests/KlasTabStrip.test.tsx` — structure, imports, and describe/it conventions.

**Import block pattern** (`tests/KlasTabStrip.test.tsx` lines 5–8):
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import KlasTabStrip from '../src/components/KlasTabStrip';
// HelpPage equivalent:
import HelpPage from '../src/components/HelpPage';
```

**No-mock test pattern** (`tests/KlasTabStrip.test.tsx` lines 10–27 — Phase 17 describe block):
```typescript
// KlasTabStrip has no async utils to mock; same for HelpPage (static JSX).
// Use describe/it directly with vi.fn() for callbacks:
describe('HelpPage', () => {
  it('renders help heading', () => {
    render(<HelpPage onBack={() => {}} />);
    expect(screen.getByRole('heading', { name: /help/i })).toBeInTheDocument();
  });
  it('calls onBack when Terug is clicked', () => {
    const onBack = vi.fn();
    render(<HelpPage onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /terug/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

**`toBeInTheDocument` availability:** `tests/SettingsPage.test.tsx` uses it via `@testing-library/jest-dom` — confirm `setupFiles` in `vite.config.ts` or use `.toBeTruthy()` as KlasTabStrip tests do (line 26: `expect(...).toBeTruthy()`). Mirror KlasTabStrip style (`toBeTruthy`) to avoid setup dependency.

---

### `tests/KlasTabStrip.test.tsx` — extend with `?` button tests (self-extension)

**Existing pattern to append after** (`tests/KlasTabStrip.test.tsx` lines 167–179 — Phase 28 describe block):
```typescript
describe('KlasTabStrip — feedback button (Phase 28)', () => {
  it('renders a button with aria-label "Fout melden"', () => {
    render(<KlasTabStrip {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Fout melden' })).toBeTruthy();
  });
  it('calls onFeedback when 🐛 button is clicked', () => {
    const onFeedback = vi.fn();
    render(<KlasTabStrip {...makeProps({ onFeedback })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fout melden' }));
    expect(onFeedback).toHaveBeenCalledTimes(1);
  });
});
```
Add analogous Phase 30 describe block using the same `makeProps` factory (lines 88–105). The factory must also pass the two new props — update `makeProps` default to include `onHelp: vi.fn()` and `isHelpActive: false`.

---

## Shared Patterns

### View Wrapper Animation
**Source:** `src/App.tsx` lines 179–190
**Apply to:** `HelpPage` render block in `App.tsx`
```tsx
<div className="view-slide-in-right" style={{ overflow: 'hidden' }}>
  {/* page component */}
</div>
```
All overlay views (settings, help) use this wrapper. Do not omit `overflow: 'hidden'`.

### `safeView` Guard (prevView protection)
**Source:** `src/App.tsx` lines 65–69
**Apply to:** `handleOpenHelp` in `App.tsx`
```typescript
const safeView = (view === 'import' || view === 'klas' || view === 'detail')
  ? view
  : 'klas';
setPrevView(safeView);
```
Critical: ensures overlay views (`'settings'`, `'onboarding'`) are never stored in `prevView`. Copy verbatim.

### `nav-tab active` Class Toggle
**Source:** `src/components/KlasTabStrip.tsx` lines 145–148
**Apply to:** new `?` help button in `KlasTabStrip.tsx`
```tsx
className={`nav-tab${isSettingsActive ? ' active' : ''}`}
// Help equivalent:
className={`nav-tab${isHelpActive ? ' active' : ''}`}
```

### `detail-section` + `detail-section-title` CSS
**Source:** `src/components/SettingsPage.tsx` lines 251–255 (uses `src/index.css` classes)
**Apply to:** all content sections in `HelpPage.tsx`
```tsx
<section className="detail-section">
  <h2 className="detail-section-title">...</h2>
  ...
</section>
```
No new CSS classes needed for section bodies.

### `settings-header` + `detail-nav-btn` CSS
**Source:** `src/components/SettingsPage.tsx` lines 244–248
**Apply to:** `HelpPage` header
```tsx
<div className="settings-header">
  <button className="detail-nav-btn" onClick={onBack}>← Terug</button>
  <h1>...</h1>
</div>
```

### CI Step Order
**Source:** `.github/workflows/release.yml` lines 31–45
**Apply to:** `.github/workflows/ci.yml` steps 1–4 (copy verbatim)
```yaml
- uses: actions/checkout@v4
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: lts/*
- name: Install Rust stable
  uses: dtolnay/rust-toolchain@stable
  with:
    targets: ${{ matrix.rust-targets }}
- name: Install frontend dependencies
  run: npm ci
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `INSTRUCTIES.md` | documentation | — | Pure prose; no code pattern applicable |
| `TESTPLAN.md` | documentation | — | Pure prose; RESEARCH.md §Documentation Content provides the full outline and scenario-table format |

---

## Metadata

**Analog search scope:** `src/components/`, `src/App.tsx`, `.github/workflows/`, `tests/`
**Files scanned:** 6 source files read directly
**Pattern extraction date:** 2026-05-28
