# Phase 17: Settings Panel Foundation - Research

**Researched:** 2026-05-17
**Domain:** React settings page, CSS dark mode, Tauri plugin-store persistence
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Settings Page Layout**
- D-01: Settings opens as a 4th full-page view state in App.tsx (`'settings'`), replacing the current view — same routing pattern as `'import'` / `'klas'` / `'detail'`.
- D-02: The settings icon is a ⚙ gear — Unicode character or inline SVG — pinned to the far-right edge of the KlasTabStrip nav bar, separated from the class tabs.
- D-03: The settings page uses cards per section — each section (Weergave, Bestanden, and Phase 18 placeholders) is a white card using the existing `.detail-section` / `.detail-section-title` CSS pattern.
- D-04: A `← Terug` back button sits in the settings page header, returning the mentor to whichever view was active before opening settings (App.tsx tracks `prevView`).

**Dark Mode Toggle**
- D-05: Dark mode is user-controlled via a toggle switch (on/off) with a label. The toggle replaces the `@media (prefers-color-scheme: dark)` approach with a `body.dark` class — adding `body.dark { }` overrides in `index.css` that mirror the existing media query tokens. The media query is removed (or commented out) to prevent conflicts.
- D-06: On first launch, the app reads the OS preference (`window.matchMedia('(prefers-color-scheme: dark)').matches`) and uses it as the initial state. Once the user manually toggles, their explicit choice is saved and OS preference is ignored on subsequent starts.
- D-07: The dark/light preference is persisted under a separate `'settings'` key in Tauri plugin-store: `{ theme: 'dark' | 'light' }`. This keeps class data and app preferences isolated. Uses the same plugin-store save/load pattern from Phase 12.
- D-08: Dark mode applies instantly on toggle — no save/confirm step. The `body.dark` class is added/removed immediately, providing instant visual feedback.

**Add-Files Flow**
- D-09: The settings page has a "Bestanden toevoegen" button in the Bestanden section. Clicking it navigates to the existing `ImportPage` view — no new importer built. Auto-detect skips when students already exist (Phase 16 behaviour), so the existing class is unaffected.
- D-10: After completing the import from the settings → ImportPage path, the app lands on the klas overview (`'klas'` view) — same as the existing `handleImportComplete` behaviour. No extra routing state needed.

**Phase 18 Placeholders**
- D-11: The settings page includes visible but disabled/empty section cards for "Deelgebieden & Leerlijnen" and "Drempelwaarden & BPV-uren" with a short placeholder text ("Komt in een volgende versie"). Phase 18 will replace the placeholder content.

### Claude's Discretion
- Exact gear icon implementation (Unicode ⚙ vs inline SVG) — whichever renders more cleanly at the nav bar size
- CSS class names for the settings page components
- Whether `prevView` is stored as a state variable or inferred from a navigation stack

### Deferred Ideas (OUT OF SCOPE)
- Other UI / frontend changes observed during Phase 16 UAT — deferred to Phase 19 (UI Polish)
- Dark mode "System" option (three-way light/dark/system selector) — kept simple for Phase 17
- Settings page animations (slide-in transition for the settings view) — Phase 19 scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SET-01 | Mentor kan schakelen tussen light en dark mode via een settings-icoon; de voorkeur wordt persistent opgeslagen en hersteld bij herstart | D-05 through D-08 lock the implementation; plugin-store `'settings'` key pattern verified against Phase 12 code |
| SET-02 | Mentor kan vanuit de settings-pagina nieuwe PDFs en/of een verzuim-Excel toevoegen aan een bestaande klas, zonder de klas opnieuw aan te maken | D-09/D-10 lock the flow; ImportPage.tsx reused as-is; ACD-01 (Phase 16) already guards skip-when-students-exist |
| POL-01 | Dark mode volledig geimplementeerd — alle componenten consistent gestyled met dark theme CSS-variabelen | CSS token audit verified all tokens already defined in media query; body.dark is a selector swap |
</phase_requirements>

---

## Summary

Phase 17 is a pure-frontend phase: create a new `SettingsPage` React component, wire it as a 4th view state in `App.tsx`, add a gear icon to `KlasTabStrip`, implement dark mode via `body.dark` CSS class, and persist the theme preference to a separate `'settings'` key in the existing Tauri plugin-store. No new dependencies are needed — every element reuses established patterns from Phases 12, 13, and 14.

The dark mode work is the most impactful change: the existing `@media (prefers-color-scheme: dark) { :root { } }` block in `src/index.css` is replaced with an equivalent `body.dark { }` block, giving JavaScript control over the applied theme. All 20 CSS custom-property tokens currently in the media query have been audited and catalogued in the UI-SPEC (17-UI-SPEC.md). This is a find-and-replace on the selector, not a redesign.

The settings-to-import navigation path (`settings → ImportPage → klas`) requires App.tsx to track `prevView` so the back button can restore whatever view was active before opening settings. The `handleImportComplete` path remains unchanged; after a settings-triggered import completes, the app lands on `'klas'` as it always has.

**Primary recommendation:** Implement in two plans — Plan 1: CSS changes (body.dark) + SettingsPage component + plugin-store settings load/save; Plan 2: App.tsx wiring + KlasTabStrip gear icon + prevView tracking + vitest coverage.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Settings view routing (4th state) | Frontend (App.tsx) | — | App.tsx owns all view state; same pattern as import/klas/detail |
| Gear icon in nav bar | Frontend (KlasTabStrip.tsx) | — | Nav bar is rendered by KlasTabStrip; prop callback wired from App.tsx |
| prevView tracking | Frontend (App.tsx) | — | View state machine lives in App.tsx; simple useState |
| Dark mode CSS toggle | Browser / CSS layer | Frontend (JS body.classList) | CSS custom properties resolve at paint time; JS only controls `body.dark` class |
| Theme persistence (read/write) | Frontend (SettingsPage mount/toggle) | Tauri plugin-store (disk) | Same LazyStore pattern as utils/klassen.ts; separate key |
| OS preference detection | Browser (window.matchMedia) | Frontend (SettingsPage mount) | One-time read on first launch; not re-subscribed |
| Add-files navigation | Frontend (SettingsPage → App.tsx callback) | — | Delegates entirely to existing ImportPage; no new importer |

---

## Standard Stack

### Core (all already in project — no new installs needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.6 | Component model | Project standard since Phase 14 |
| @tauri-apps/plugin-store | ^2.4.3 | Theme persistence | Already used for klassen data (Phase 12) |
| CSS Custom Properties | native | Dark mode theming | All tokens already defined in index.css |

[VERIFIED: package.json — all packages already installed, no new dependencies required]

### No New Dependencies
This phase introduces zero new npm packages. Every capability uses existing project infrastructure.

**Installation:**
```bash
# No installation needed — all packages already present
npm install  # verify current install is intact
```

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks gear icon
        │
        ▼
KlasTabStrip.onSettings()
        │
        ▼
App.tsx: setPrevView(view) → setView('settings')
        │
        ▼
SettingsPage renders
        ├─ on mount → store.get('settings')
        │     ├─ found: apply theme, set toggleState
        │     └─ absent: read window.matchMedia → apply, do NOT persist
        │
        ├─ user toggles dark mode
        │     ├─ body.classList.add/remove('dark')  [instant]
        │     └─ store.set('settings', {theme}) → store.save()
        │
        ├─ user clicks ← Terug → App.tsx: setView(prevView)
        │
        └─ user clicks Bestanden toevoegen
              └─ App.tsx: setView('import')
                    └─ ImportPage (unchanged) → handleImportComplete → setView('klas')
```

### Recommended Project Structure
```
src/
├── components/
│   ├── SettingsPage.tsx     # NEW — Phase 17 settings component
│   ├── KlasTabStrip.tsx     # MODIFIED — add onSettings prop + gear icon
│   └── [all others]        # UNCHANGED
├── index.css               # MODIFIED — body.dark block + 6 new CSS classes
└── App.tsx                 # MODIFIED — 4th view state + prevView tracking
```

### Pattern 1: 4th View State in App.tsx

**What:** Extend the existing discriminated union view state to include `'settings'`; add `prevView` state variable.
**When to use:** Any time a new full-page view is added.

```typescript
// Source: existing App.tsx pattern — verified [VERIFIED: src/App.tsx lines 10–14]
const [view, setView] = useState<'import' | 'klas' | 'detail' | 'settings'>('import');
const [prevView, setPrevView] = useState<'import' | 'klas' | 'detail'>('klas');

function handleOpenSettings() {
  // Safe cast: view is 'import'|'klas'|'detail' when gear is clicked
  setPrevView(view as 'import' | 'klas' | 'detail');
  setView('settings');
}

function handleBackFromSettings() {
  setView(prevView);
}
```

### Pattern 2: Plugin-Store Settings Key (replicate Phase 12 pattern)

**What:** Use LazyStore with a separate `'settings'` key for theme persistence.
**When to use:** Any app-level preference that must survive restart.

```typescript
// Source: utils/klassen.ts plugin-store pattern [VERIFIED: utils/klassen.ts lines 11, 127–143]
// In SettingsPage.tsx — replicate the same LazyStore pattern:
import { LazyStore } from '@tauri-apps/plugin-store';

const settingsStore = new LazyStore('store.json', { defaults: {}, autoSave: false });

// Load on mount
const raw = await settingsStore.get<{ theme: 'dark' | 'light' }>('settings');
if (raw?.theme) {
  applyTheme(raw.theme);
  setIsDark(raw.theme === 'dark');
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
  setIsDark(prefersDark);
  // D-06: do NOT persist OS preference — only persist explicit user choice
}

// Save on toggle
async function handleToggle(newDark: boolean) {
  const theme = newDark ? 'dark' : 'light';
  applyTheme(theme);
  setIsDark(newDark);
  await settingsStore.set('settings', { theme });
  await settingsStore.save();  // Required — set() is in-memory only
}

function applyTheme(theme: 'dark' | 'light') {
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}
```

**Critical:** `store.save()` must always follow `store.set()`. In-memory mutation only without `.save()` loses the preference on restart. [VERIFIED: utils/klassen.ts line 137 comment]

### Pattern 3: body.dark CSS Selector (converting media query)

**What:** Replace `@media (prefers-color-scheme: dark) { :root { } }` with `body.dark { }`.
**When to use:** Any time JavaScript must control the applied theme.

```css
/* Source: existing src/index.css lines 98–130 [VERIFIED: src/index.css] */
/* BEFORE (remove): */
@media (prefers-color-scheme: dark) {
  :root {
    --accent: #818CF8;
    /* ... all tokens ... */
  }
}

/* AFTER (replace with): */
body.dark {
  --accent: #818CF8;
  --accent-hover: #A5B4FC;
  --accent-light: #1E1B4B;
  --accent-border: #3730A3;
  --accent-text: #C7D2FE;
  --bg-page: #0B0F1A;
  --bg-surface: #131929;
  --bg-surface-alt: #1A2235;
  --nav-bg: #131929;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-faint: #475569;
  --border-default: #1E293B;
  --border-light: #0F172A;
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 24px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.3);
  --status-groen-bg: #14532D; --status-groen-text: #86EFAC;
  --status-oranje-bg: #451A03; --status-oranje-text: #FCD34D;
  --status-rood-bg: #450A0A; --status-rood-text: #FCA5A5;
  --status-blauw-bg: #1E3A5F; --status-blauw-text: #93C5FD;
  --status-grijs-bg: #1E293B; --status-grijs-text: #94A3B8;
}
```

**Important:** Keep `@media (prefers-reduced-motion: reduce)` untouched — it is separate from the dark mode block. [VERIFIED: src/index.css line 133]

### Pattern 4: Pure CSS Toggle Switch (no library)

**What:** Accessible toggle using hidden checkbox + styled spans.
**When to use:** Any on/off preference toggle.

```css
/* New CSS to add in index.css section 24 */
.toggle-switch { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.toggle-track {
  position: relative;
  width: 44px; height: 24px;
  border-radius: 12px;
  background: var(--border-default);
  border: 1.5px solid var(--border-default);
  transition: background var(--transition-base), border-color var(--transition-base);
  flex-shrink: 0;
}
.toggle-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform var(--transition-base);
}
/* ON state — driven by a .dark-on class toggled by JS on the label/container */
.toggle-track.on { background: var(--accent); border-color: var(--accent); }
.toggle-track.on .toggle-thumb { transform: translateX(20px); }
/* Keyboard focus */
.sr-only:focus-visible + .toggle-track {
  outline: 2.5px solid var(--accent);
  outline-offset: 2px;
}
```

```tsx
// TSX pattern for the toggle
<label className="toggle-switch">
  <input
    type="checkbox"
    className="sr-only"
    checked={isDark}
    onChange={e => handleToggle(e.target.checked)}
    aria-label="Donkere modus"
  />
  <span className={`toggle-track${isDark ? ' on' : ''}`}>
    <span className="toggle-thumb" />
  </span>
  <span>Donkere modus</span>
</label>
```

[ASSUMED] Toggle implementation approach — pure CSS is standard for simple toggles but specific thumb positioning values (translateX 20px) may need visual fine-tuning during execution. The UI-SPEC specifies translateX(22px); treat the spec as authoritative.

### Pattern 5: KlasTabStrip Gear Icon

**What:** Add `onSettings` prop and gear button pinned right using `marginLeft: 'auto'`.
**When to use:** Any nav bar action that opens a full-screen panel.

```tsx
// Source: KlasTabStrip.tsx — existing "↑ Importeer" button uses same marginLeft:auto pattern
// [VERIFIED: src/components/KlasTabStrip.tsx lines 34–41]

interface KlasTabStripProps {
  // ... existing props ...
  onSettings: () => void;
  isSettingsActive?: boolean;  // to apply .active class when settings view is open
}

<button
  className={`nav-tab${isSettingsActive ? ' active' : ''}`}
  style={{ marginLeft: 'auto', fontSize: '18px' }}
  title="Instellingen"
  aria-label="Instellingen openen"
  onClick={onSettings}
>
  ⚙
</button>
```

Note: The existing "↑ Importeer" button uses `marginLeft: 'auto'` — the gear icon replaces this visual position. Check whether the import button moves or stays. Based on the UI-SPEC, the gear icon takes `marginLeft: 'auto'` and the import button is REMOVED from KlasTabStrip (import is now accessed via Settings). [ASSUMED] — Verify against UI-SPEC section on KlasTabStrip; the import button may be demoted or removed.

Actually, re-reading the CONTEXT (D-09): "Bestanden toevoegen" is in SettingsPage and navigates to ImportPage. The existing "↑ Importeer" button in KlasTabStrip should be removed or retained — this is not explicitly stated in CONTEXT.md. The planner must decide: if the import button stays in the nav bar, both gear AND import coexist. The UI-SPEC component inventory (section 1) only mentions the gear icon with `marginLeft: 'auto'`. [ASSUMED] Import button in nav bar is removed (now accessed via Settings → Bestanden toevoegen). Planner should confirm.

### Anti-Patterns to Avoid

- **Applying dark mode via React state rendering different CSS classes per component:** Every component would need theme-aware logic. Use `body.dark` + CSS custom properties so the cascade does the work automatically.
- **Persisting OS preference on first launch:** D-06 explicitly says do NOT persist on OS detection — only persist explicit user choice. Persisting on detection would prevent the OS preference from ever updating if the user changes their OS theme.
- **Using `localStorage` for theme persistence:** Plugin-store is the established persistence layer since Phase 12. localStorage is unreliable in Tauri prod. [VERIFIED: STATE.md accumulated context]
- **Calling `store.set()` without `store.save()`:** `set()` is in-memory only. Without `save()`, theme is lost on restart. [VERIFIED: utils/klassen.ts line 137]
- **Building a new file import UI in SettingsPage:** D-09 locks this — navigate to existing ImportPage only.
- **Adding `prevView` logic inside SettingsPage:** prevView must live in App.tsx alongside the `view` state — SettingsPage only receives `onBack` callback.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme persistence | Custom file I/O or localStorage | LazyStore `'settings'` key | Pattern established in Phase 12; localStorage unreliable in Tauri |
| Toggle switch UI | Icon buttons or custom checkbox styling | Pure CSS with `.sr-only` input | Accessible, zero deps, already used for `.sr-only` in index.css |
| Dark mode token system | Per-component `isDark` props | `body.dark` + CSS custom properties | 20 tokens already defined; cascade applies automatically to all components |
| File import UI | New dropzone in SettingsPage | Navigate to existing ImportPage | All import logic (batch PDF, Excel, error handling) already tested |

**Key insight:** This phase is almost entirely wiring existing infrastructure together. The CSS token system already has both light and dark values — the only missing piece is the selector (`body.dark` instead of `@media`). The import flow already handles the "add to existing class" case (Phase 16). The plugin-store save/load pattern is proven from Phase 12.

---

## Common Pitfalls

### Pitfall 1: store.save() omitted after set()
**What goes wrong:** Theme appears to apply during the session but reverts to OS preference on restart.
**Why it happens:** `LazyStore.set()` is in-memory mutation; disk write only happens on `.save()`.
**How to avoid:** Always chain `await settingsStore.set('settings', { theme }) → await settingsStore.save()`.
**Warning signs:** Toggle works in session, dark mode not restored after closing and reopening app.

### Pitfall 2: Media query and body.dark both active simultaneously
**What goes wrong:** OS dark preference and JS-controlled `body.dark` conflict — toggling produces unexpected results on macOS/Windows systems with dark OS theme.
**Why it happens:** If the `@media (prefers-color-scheme: dark)` block is left in place, it overrides or conflicts with `body.dark` depending on specificity.
**How to avoid:** Remove (or comment out) the entire `@media (prefers-color-scheme: dark) { :root { } }` block. Keep `@media (prefers-reduced-motion: reduce)` — that one is unrelated.
**Warning signs:** Dark mode toggle appears to "not work" on machines with OS dark mode enabled.

### Pitfall 3: prevView holds 'settings' value
**What goes wrong:** Back button returns to settings (infinite loop).
**Why it happens:** `setPrevView(view)` called while `view === 'settings'`.
**How to avoid:** Only call `setPrevView` in `handleOpenSettings`, which is only reachable when the current view is NOT settings. The gear icon should be hidden or non-functional when already in settings view.
**Warning signs:** Back button in settings opens settings again.

### Pitfall 4: OS preference persisted on first launch
**What goes wrong:** User changes OS theme, app ignores it because an explicit preference was stored on first launch.
**Why it happens:** Treating the OS matchMedia read as a "user choice" and immediately persisting it.
**How to avoid:** Only call `settingsStore.set` + `settingsStore.save()` in the toggle handler — never in the "absent key" branch of the mount logic. D-06 is explicit on this.
**Warning signs:** Changing OS theme has no effect on the app after first launch.

### Pitfall 5: KlasTabStrip re-render drops gear icon active state
**What goes wrong:** Gear icon loses active styling when the tab strip re-renders (e.g., after klas list refresh).
**Why it happens:** `isSettingsActive` prop not passed from App.tsx.
**How to avoid:** Pass `isSettingsActive={view === 'settings'}` from App.tsx to KlasTabStrip. The gear icon's `.active` class is conditional on this prop.
**Warning signs:** Gear icon looks inactive even when settings view is displayed.

### Pitfall 6: Dark mode toggle checkbox state out of sync
**What goes wrong:** Toggle renders visually as OFF but `body.dark` is applied (or vice versa).
**Why it happens:** React state (`isDark`) and DOM state (`body.classList`) diverge if theme is applied without updating React state.
**How to avoid:** Always update both: `document.body.classList.add/remove('dark')` AND `setIsDark(newValue)` together, atomically in the same handler.
**Warning signs:** Visual toggle does not match current theme.

---

## Code Examples

### SettingsPage Full Component Skeleton
```tsx
// src/components/SettingsPage.tsx
// Source: pattern derived from DetailWeergave.tsx back-button pattern [VERIFIED: src/App.tsx handleBack]
import React, { useEffect, useState } from 'react';
import { LazyStore } from '@tauri-apps/plugin-store';

const settingsStore = new LazyStore('store.json', { defaults: {}, autoSave: false });

interface SettingsPageProps {
  onBack: () => void;
  onNavigateToImport: () => void;
}

export default function SettingsPage({ onBack, onNavigateToImport }: SettingsPageProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await settingsStore.get<{ theme: 'dark' | 'light' }>('settings');
      if (saved?.theme) {
        const dark = saved.theme === 'dark';
        setIsDark(dark);
        document.body.classList.toggle('dark', dark);
      } else {
        // D-06: OS preference — apply but do NOT persist
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
        document.body.classList.toggle('dark', prefersDark);
      }
    })();
  }, []);

  async function handleToggle(checked: boolean) {
    setIsDark(checked);
    document.body.classList.toggle('dark', checked);
    const theme = checked ? 'dark' : 'light';
    await settingsStore.set('settings', { theme });
    await settingsStore.save();
  }

  return (
    <main className="settings-page">
      <div className="settings-header">
        <button className="detail-nav-btn" onClick={onBack}>← Terug</button>
        <h1>Instellingen</h1>
      </div>

      {/* Weergave */}
      <section className="detail-section">
        <h2 className="detail-section-title">Weergave</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="toggle-switch">
            <input
              type="checkbox"
              className="sr-only"
              checked={isDark}
              onChange={e => handleToggle(e.target.checked)}
              aria-label="Donkere modus"
            />
            <span className={`toggle-track${isDark ? ' on' : ''}`}>
              <span className="toggle-thumb" />
            </span>
            <span>Donkere modus</span>
          </label>
        </div>
      </section>

      {/* Bestanden */}
      <section className="detail-section">
        <h2 className="detail-section-title">Bestanden</h2>
        <button className="btn btn-primary" onClick={onNavigateToImport}>
          Bestanden toevoegen
        </button>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Voeg PDFs of een verzuim-Excel toe aan de actieve klas.
        </p>
      </section>

      {/* Phase 18 placeholders */}
      <section className="detail-section">
        <h2 className="detail-section-title">Deelgebieden &amp; Leerlijnen</h2>
        <p className="settings-placeholder-text">Komt in een volgende versie.</p>
      </section>
      <section className="detail-section">
        <h2 className="detail-section-title">Drempelwaarden &amp; BPV-uren</h2>
        <p className="settings-placeholder-text">Komt in een volgende versie.</p>
      </section>
    </main>
  );
}
```

### App.tsx Changes (routing + prevView)
```tsx
// Additions to App.tsx [VERIFIED: existing pattern in src/App.tsx]
const [view, setView] = useState<'import' | 'klas' | 'detail' | 'settings'>('import');
const [prevView, setPrevView] = useState<'import' | 'klas' | 'detail'>('klas');

function handleOpenSettings() {
  setPrevView(view as 'import' | 'klas' | 'detail');
  setView('settings');
}

function handleBackFromSettings() {
  setView(prevView);
}

function handleNavigateToImportFromSettings() {
  setView('import');
}

// In JSX — add alongside existing view conditionals:
{view === 'settings' && (
  <SettingsPage
    onBack={handleBackFromSettings}
    onNavigateToImport={handleNavigateToImportFromSettings}
  />
)}

// KlasTabStrip — add onSettings prop and isSettingsActive:
<KlasTabStrip
  klassen={...}
  activeKlasId={...}
  onSwitch={handleKlasSwitch}
  onCreateKlas={() => setShowModal(true)}
  onImport={handleImportOpen}
  onSettings={handleOpenSettings}
  isSettingsActive={view === 'settings'}
/>
```

### New CSS for index.css (section 24)
```css
/* --------------------------------------------------------------------------
   24. SettingsPage
   -------------------------------------------------------------------------- */
.settings-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.settings-header h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Toggle switch */
.toggle-switch { display: flex; align-items: center; gap: 12px; cursor: pointer; }

.toggle-track {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--border-default);
  border: 1.5px solid var(--border-default);
  transition: background var(--transition-base), border-color var(--transition-base);
  flex-shrink: 0;
}
.toggle-track.on { background: var(--accent); border-color: var(--accent); }

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform var(--transition-base);
  box-shadow: var(--shadow-xs);
}
.toggle-track.on .toggle-thumb { transform: translateX(20px); }

/* Keyboard focus on toggle */
.sr-only:focus-visible + .toggle-track {
  outline: 2.5px solid var(--accent);
  outline-offset: 2px;
}

/* Phase 18 placeholder text */
.settings-placeholder-text {
  font-size: 0.875rem;
  color: var(--text-faint);
  font-style: italic;
  margin: 0;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@media (prefers-color-scheme: dark)` OS-only | `body.dark` JS-controlled class | Phase 17 | Enables user toggle; removes OS lock-in |
| No settings page | 4th view state `'settings'` | Phase 17 | Foundation for Phase 18 advanced settings |
| Import only via nav bar | Import accessible via Settings + nav bar | Phase 17 | Cleaner mental model; nav bar decluttered |

**Deprecated/outdated:**
- `@media (prefers-color-scheme: dark) { :root { } }` in index.css: replaced by `body.dark { }`. The media query is removed in this phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The "↑ Importeer" button in KlasTabStrip is removed (import now accessed via Settings → Bestanden toevoegen) | Architecture Patterns — Pattern 5 | If button stays, there are two import entry points; nav bar layout changes |
| A2 | Toggle thumb translateX value is 20px (computed as track 44px - 2px left - 18px thumb - 2px right gap - 2px = 20px); UI-SPEC says 22px | Code Examples — toggle CSS | Visual misalignment; thumb may partially overflow track. Use UI-SPEC value (22px) as authoritative |
| A3 | `settingsStore` in SettingsPage uses the same `store.json` file as klassen data (same LazyStore file, different key) | Architecture Patterns — Pattern 2 | If separate files are used, there's a second store.json. Using same file with separate key is consistent with existing pattern |

**Low-risk assumptions:** A3 is consistent with plugin-store documentation where a single store file can hold multiple keys. A1 is a UX decision the planner should confirm explicitly.

---

## Open Questions

1. **Import button in nav bar (KlasTabStrip)**
   - What we know: CONTEXT.md says "Bestanden toevoegen" is in SettingsPage; UI-SPEC shows gear icon at `marginLeft: 'auto'` position
   - What's unclear: Whether the existing "↑ Importeer" button in KlasTabStrip is removed or kept alongside the gear icon
   - Recommendation: Remove it — the gear icon takes the right-edge slot; import via Settings is the new flow. Planner should make this explicit in the plan.

2. **Dark mode applied on main.tsx startup vs. SettingsPage mount**
   - What we know: Theme must be restored at startup. SettingsPage only mounts when `view === 'settings'`.
   - What's unclear: If the user last used dark mode and opens the app to the `'klas'` view, the `body.dark` class is never applied until they open Settings.
   - Recommendation: Load theme in `main.tsx` or App.tsx `useEffect` on startup, independent of SettingsPage mounting. SettingsPage reads the same persisted value for its toggle state. The planner must explicitly handle this startup hydration.

---

## Environment Availability

Step 2.6: SKIPPED — This phase makes no changes to build configuration, Rust, or external tools. All required libraries (`@tauri-apps/plugin-store`, React, CSS) are already installed and verified in the project. No new external dependencies.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.6 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

[VERIFIED: package.json scripts, vitest.config.ts]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SET-01 (theme persist) | `saveSettings` writes `{ theme }` to store and `loadSettings` restores it | unit | `npm test -- --reporter=verbose tests/settings.test.ts` | ❌ Wave 0 |
| SET-01 (OS fallback) | When no saved theme, OS preference is applied and NOT persisted | unit | same | ❌ Wave 0 |
| SET-01 (body.dark) | Toggle adds/removes `body.dark` class | unit (jsdom) | same | ❌ Wave 0 |
| SET-02 (import nav) | Clicking "Bestanden toevoegen" triggers `onNavigateToImport` callback | unit | same | ❌ Wave 0 |
| POL-01 | CSS custom properties are consumed by all components — verified by body.dark class present in DOM | unit (jsdom) | same | ❌ Wave 0 |

**Note:** SettingsPage is a UI component with async Tauri calls (plugin-store). Meaningful tests mock `LazyStore` using the same class-mock pattern from Phase 12. [VERIFIED: STATE.md note "LazyStore mock must be ES6 class (not vi.fn()) — required for new LazyStore() constructor call"]

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green (currently 43 tests) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/settings.test.ts` — covers SET-01 (theme persist/restore/OS fallback/body.dark) and SET-02 (import navigation callback)
- [ ] LazyStore mock for `'settings'` key (can reuse/extend existing mock pattern from `tests/storage.test.ts`)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a (no auth in scope) |
| V3 Session Management | no | n/a |
| V4 Access Control | no | n/a (local single-user app) |
| V5 Input Validation | no | No user text input in Phase 17 (toggle is boolean; no free-text fields) |
| V6 Cryptography | no | Theme preference `{ theme: 'dark' | 'light' }` stored plaintext in plugin-store — not sensitive data; no encryption needed |

**Security assessment:** Phase 17 stores only UI preference data (non-sensitive). The `'settings'` store key holds `{ theme: 'dark' | 'light' }` — no PII, no credentials. No ASVS controls are required beyond what is already implemented in the project (AES-256 encryption applies to student data in `'klassen'` key, not preferences).

---

## Sources

### Primary (HIGH confidence)
- `src/App.tsx` — Current view routing, state shape [VERIFIED: read in this session]
- `src/index.css` — All CSS tokens, existing dark media query, `.detail-section` classes [VERIFIED: read in this session]
- `src/components/KlasTabStrip.tsx` — Current nav bar props and layout [VERIFIED: read in this session]
- `utils/klassen.ts` — LazyStore pattern for plugin-store save/load [VERIFIED: read in this session]
- `src/components/ImportPage.tsx` — Import flow, ACD-01 auto-detect skip logic [VERIFIED: read in this session]
- `.planning/phases/17-settings-panel-foundation/17-CONTEXT.md` — All locked decisions [VERIFIED: read in this session]
- `.planning/phases/17-settings-panel-foundation/17-UI-SPEC.md` — Component inventory, spacing, colors, CSS class list [VERIFIED: read in this session]
- `package.json` — All installed packages and versions [VERIFIED: read in this session]
- `vitest.config.ts` — Test configuration, LazyStore mock requirement [VERIFIED: read in this session]
- `.planning/STATE.md` — Accumulated decisions including LazyStore mock pattern [VERIFIED: read in this session]

### Secondary (MEDIUM confidence)
- Tauri plugin-store documentation patterns (LazyStore async API) — corroborated by working Phase 12 implementation in `utils/klassen.ts`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, verified in package.json
- Architecture: HIGH — all patterns are established in the existing codebase; this phase reuses them
- CSS dark mode: HIGH — all 20 tokens audited from index.css; selector swap is mechanical
- Plugin-store persistence: HIGH — LazyStore pattern proven in Phase 12
- Test coverage: MEDIUM — settings.test.ts does not yet exist; mock pattern is known from storage.test.ts
- Startup theme hydration: MEDIUM — Open Question #2 requires planner decision on where to load theme at startup

**Research date:** 2026-05-17
**Valid until:** 2026-06-17 (stable — no fast-moving dependencies)
