# Phase 19: UI Polish - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 7 files to be created or modified
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/index.css` | config (design tokens) | transform | self — extend existing sections | self-extend |
| `utils/spider.ts` | utility | transform | self — return type refactor | self-refactor |
| `src/components/SpiderChartCard.tsx` | component | request-response | self — consumer of spider.ts | self-refactor |
| `src/App.tsx` | provider/router | event-driven | self — add settingsOpenCount state | self-extend |
| `src/components/KlasTabStrip.tsx` | component | request-response | self — add logo + isDark prop | self-extend |
| `src/assets/fonts/` (new directory) | config (static assets) | file-I/O | `src/assets/react.svg` (existing asset pattern) | role-match |
| `tests/spider.test.ts` | test | transform | self — update string assertions to JSX | self-update |

---

## Pattern Assignments

### `src/index.css` (config, design tokens — self-extend)

**Analog:** `src/index.css` itself — all Phase 19 changes are additions or targeted value replacements within the existing CSS architecture. Never replace; always extend.

**Section 1 — @font-face (replaces line 9 Google Fonts @import):**
```css
/* Replace this line (line 9): */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* With these @font-face blocks (place before :root block): */
@font-face {
  font-family: 'Industry';
  src: url('./assets/fonts/IndustryTest-Book.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Industry';
  src: url('./assets/fonts/IndustryTest-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Industry';
  src: url('./assets/fonts/IndustryTest-Demi.otf') format('opentype');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
```

**Section 1 — Accent token replacements (current values from lines 16–20, 37):**
```css
/* Current (to be replaced in-place): */
--accent:           #4F46E5;   /* line 16 */
--accent-hover:     #4338CA;   /* line 17 */
--accent-light:     #EEF2FF;   /* line 18 */
--accent-border:    #C7D2FE;   /* line 19 */
--accent-text:      #3730A3;   /* line 20 */
--border-focus:     #4F46E5;   /* line 37 */

/* Phase 19 target values: */
--accent:           #009FE3;
--accent-hover:     #007DBF;
--accent-light:     #E0F5FD;
--accent-border:    #99D9F4;
--accent-text:      #00547A;
--border-focus:     #009FE3;
```

**Section 1 — Shadow token replacements (current values from lines 41–43):**
```css
/* Current (to be replaced in-place): */
--shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);  /* line 41 */
--shadow-md: 0 4px 12px rgba(15, 23, 42, 0.10), 0 2px 4px rgba(15, 23, 42, 0.06); /* line 42 */
--shadow-lg: 0 10px 24px rgba(15, 23, 42, 0.12), 0 4px 8px rgba(15, 23, 42, 0.06);/* line 43 */

/* Phase 19 Material elevation targets: */
--shadow-sm: 0 2px 4px rgba(15, 23, 42, 0.12), 0 1px 2px rgba(15, 23, 42, 0.08);
--shadow-md: 0 4px 8px rgba(15, 23, 42, 0.16), 0 2px 4px rgba(15, 23, 42, 0.10);
--shadow-lg: 0 8px 16px rgba(15, 23, 42, 0.20), 0 4px 8px rgba(15, 23, 42, 0.12);
```

**Section 2 — font-family replacement (line 181):**
```css
/* Current (line 181): */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Phase 19 target: */
font-family: 'Industry', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Dark mode block 1 — accent additions (add to existing body.dark block, lines 111–141):**
```css
/* These 6 tokens replace the existing dark-mode accent values in body.dark: */
body.dark {
  --accent:        #009FE3;
  --accent-hover:  #007DBF;
  --accent-light:  #003B57;
  --accent-border: #005F8E;
  --accent-text:   #7DD4F5;
  --border-focus:  #009FE3;
  /* ... rest of body.dark block unchanged ... */
}
```

**Section 4 — Nav `#main-nav` additions (current block at lines 236–249):**
```css
/* Current #main-nav already has position: sticky, z-index: 50 */
/* Add overflow: hidden to contain the ::after diagonal: */
#main-nav {
  /* ... existing properties (lines 236–249) ... */
  overflow: hidden;  /* NEW — contain ::after diagonal stripe */
}

/* NEW pseudo-element (add after existing #main-nav block): */
#main-nav::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 120px; height: 52px;
  background: linear-gradient(to bottom-left, #009FE3 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}

/* Existing .nav-tab needs z-index to render above stripe: */
.nav-tab {
  /* ... existing properties (lines 251–264) ... */
  position: relative;  /* NEW */
  z-index: 1;          /* NEW */
}
```

**Section 9 — `.detail-section:hover` addition (after `.detail-section` at line 468):**
```css
/* Current .detail-section (line 468): box-shadow: var(--shadow-sm) */
/* ADD: */
.detail-section:hover {
  box-shadow: var(--shadow-md);
  transition: box-shadow var(--transition-base);
}
```

**Hover gap fixes — all four confirmed missing rules (G1–G4):**
```css
/* G1 — add after .dg-leerlijn-select:focus block (line 1131): */
.dg-leerlijn-select:hover {
  border-color: var(--accent-border);
}

/* G2 — add after .settings-number-input:focus block (line 1184): */
.settings-number-input:hover {
  border-color: var(--accent-border);
}

/* G3 — add after existing .toggle-track.on block (line 1047): */
.toggle-switch:hover .toggle-track:not(.on) {
  background: var(--text-faint);
}

/* G4 — already covered by .detail-section:hover above */
```

**Hardcoded rgba focus ring fixes (lines 1112, 1130, 1183):**
```css
/* Old indigo value rgba(79, 70, 229, 0.12) → new CIOS blue rgba(0, 159, 227, 0.12) */
/* Fix at line 1112 (.dg-naam-input:focus box-shadow): */
box-shadow: 0 0 0 3px rgba(0, 159, 227, 0.12);

/* Fix at line 1130 (.dg-leerlijn-select:focus box-shadow): */
box-shadow: 0 0 0 3px rgba(0, 159, 227, 0.12);

/* Fix at line 1183 (.settings-number-input:focus box-shadow): */
box-shadow: 0 0 0 3px rgba(0, 159, 227, 0.12);
```

**Spider chart CSS additions (new section — add as section 26 or at end of file):**
```css
/* Spider tooltip */
.spider-tooltip {
  position: absolute;
  background: var(--bg-surface);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
  transform: translate(-50%, -100%);
  opacity: 1;
  transition: opacity var(--transition-fast);
}

/* Spider hit circle hover targets */
.spider-hit-circle {
  fill: transparent;
  cursor: pointer;
  transition: fill var(--transition-fast);
}
.spider-hit-circle:hover {
  fill: rgba(0, 0, 0, 0.08);
}
```

**Settings slide-in animation (add to CSS — new section or append):**
```css
.view-slide-in-right {
  animation: slideInFromRight var(--transition-base) ease forwards;
}

@keyframes slideInFromRight {
  from { transform: translateX(100%); opacity: 0.7; }
  to   { transform: translateX(0);    opacity: 1;   }
}
```

**SpiderChartCard inline `maxWidth` responsive fix (CSS for `.spider-card`):**
```css
/* Update or add .spider-card rule — the inline maxWidth: 180px in SpiderChartCard.tsx
   should become width: 100%; max-width: 180px for edge-case overflow handling */
.spider-card {
  width: 100%;
  max-width: 180px;
  position: relative;  /* required for absolutely positioned .spider-tooltip */
}
```

---

### `utils/spider.ts` (utility, transform — self-refactor)

**Analog:** `utils/spider.ts` itself — full file is 123 lines. The refactor changes only the return type and body of `buildSpiderSVG`. All math (angles, radii, `scoreToRadius`) is preserved.

**Current function signature (lines 46–51):**
```typescript
buildSpiderSVG(
  axes: Array<{ key: string; label: string }>,
  scores: Record<string, string | null>,
  fillVar: string,
  strokeVar: string
): string
```

**Target signature after refactor:**
```typescript
// Add React import at top of file (line 1):
import React from 'react';

buildSpiderSVG(
  axes: Array<{ key: string; label: string }>,
  scores: Record<string, string | null>,
  fillVar: string,
  strokeVar: string,
  onHover?: (state: { axisIndex: number; x: number; y: number } | null) => void
): JSX.Element
```

**Current string-concatenation pattern (lines 64–90) — convert to JSX arrays:**
```typescript
// CURRENT (string concatenation loops) — lines 64–90:
let gridLines = '';
let gridRings = '';
for (const level of gridLevels) { gridRings += '<polygon .../>'; }
for (let i = 0; i < n; i++) { gridLines += '<line .../>'; }

// TARGET (JSX array map):
const gridRings = gridLevels.map((level, li) => {
  const r = level * maxRadius;
  const ringPoints = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
    return `${(centerX + Math.cos(angle) * r).toFixed(4)},${(centerY + Math.sin(angle) * r).toFixed(4)}`;
  }).join(' ');
  return (
    <polygon key={`ring-${li}`} points={ringPoints}
      fill="none" stroke="#d1d5db" strokeWidth="0.75" opacity="0.7" />
  );
});

const gridLines = Array.from({ length: n }, (_, i) => {
  const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
  const x = (centerX + Math.cos(angle) * maxRadius).toFixed(4);
  const y = (centerY + Math.sin(angle) * maxRadius).toFixed(4);
  return (
    <line key={`spoke-${i}`} x1={centerX} y1={centerY} x2={x} y2={y}
      stroke="#d1d5db" strokeWidth="0.75" opacity="0.7" />
  );
});
```

**Current polygon element (lines 114–121) — convert to JSX:**
```typescript
// CURRENT (string return):
return (
  '<svg width="160" height="160" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
  gridRings + gridLines +
  '<polygon points="' + pointsStr + '" fill="var(' + safeFill + ')" .../>' +
  '</svg>'
);

// TARGET (JSX return — note camelCase SVG attributes):
return (
  <svg width="160" height="160" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    {gridRings}
    {gridLines}
    {axisLabels}
    <polygon points={pointsStr} fill={`var(${safeFill})`}
      stroke={`var(${safeStroke})`} strokeWidth="2" fillOpacity="0.4" />
    {hitCircles}
  </svg>
);
```

**NEW axis label elements (add after grid lines, before data polygon):**
```typescript
const axisLabels = axes.map((axis, i) => {
  const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
  const labelX = centerX + Math.cos(angle) * (maxRadius + 12);
  const labelY = centerY + Math.sin(angle) * (maxRadius + 12);
  return (
    <text key={`label-${i}`} x={labelX} y={labelY}
      textAnchor="middle" dominantBaseline="middle"
      fontSize="10" fill="var(--text-secondary)">
      {axis.label}
    </text>
  );
});
```

**NEW hit circle elements (for tooltip hover — add after data polygon):**
```typescript
const hitCircles = axes.map((axis, i) => {
  const score = scores[axis.key] ?? null;
  const radius = scoreToRadius(score) * maxRadius;
  const angle = (2 * Math.PI * i / n) - (Math.PI / 2);
  const cx = centerX + Math.cos(angle) * radius;
  const cy = centerY + Math.sin(angle) * radius;
  // Scale SVG coords (200 viewBox) to DOM pixels (160 rendered)
  return (
    <circle key={`hit-${i}`} cx={cx} cy={cy} r={6}
      className="spider-hit-circle"
      onMouseEnter={() => onHover?.({ axisIndex: i, x: cx * (160 / 200), y: cy * (160 / 200) })}
      onMouseLeave={() => onHover?.(null)} />
  );
});
```

**Empty state — convert string to JSX (line 53):**
```typescript
// CURRENT:
return '<svg width="160" height="160" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"></svg>';

// TARGET:
return <svg width="160" height="160" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" />;
```

**`sanitizeCssVar` (line 9):** Preserve unchanged — still useful to prevent malformed CSS `var()` calls even in JSX attribute strings.

---

### `src/components/SpiderChartCard.tsx` (component, request-response — self-refactor)

**Analog:** `src/components/SpiderChartCard.tsx` itself — full file is 54 lines, all in context above.

**Current imports (lines 1–4) — add useState:**
```typescript
// Current:
import React from 'react';
import { SpiderChart } from '../../utils/spider';
import { DEELGEBIEDEN } from '../../utils/schema';
import { getDeelgebiedenConfigSync } from '../../utils/deelgebieden';

// Add:
import React, { useState } from 'react';
// (other imports unchanged)
```

**Remove dangerouslySetInnerHTML block (lines 34–48):**
```typescript
// REMOVE these lines entirely (34–48):
const rawSvg = SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar);
if (!rawSvg) { return <div ...>Geen scores beschikbaar</div>; }
// Security: buildSpiderSVG embeds only math-computed coordinates...
const svg = rawSvg.replace(/<script[\s\S]*?<\/script>/gi, '');
return (
  <div className="spider-card" style={{ maxWidth: '180px' }}>
    <div dangerouslySetInnerHTML={{ __html: svg }} />
    ...
  </div>
);
```

**Replace with tooltip state + JSX render:**
```typescript
// Tooltip state (add after axes computation):
const [tooltip, setTooltip] = useState<{ axisIndex: number; x: number; y: number } | null>(null);

// Score display formatter (add as local helper or import from shared util):
function scoreDisplay(score: string | null): string {
  switch (score) {
    case 'onvoldoende': return 'Onvoldoende';
    case 'voldoende':   return 'Voldoende';
    case 'goed':        return 'Goed';
    case 'excellent':   return 'Excellent';
    default:            return 'Geen score';
  }
}

// New return block:
return (
  <div className="spider-card" style={{ width: '100%', maxWidth: '180px', position: 'relative' }}>
    {SpiderChart.buildSpiderSVG(axes, scores, fillVar, strokeVar, setTooltip)}
    {tooltip && (
      <div
        className="spider-tooltip"
        style={{ top: tooltip.y, left: tooltip.x }}
      >
        {axes[tooltip.axisIndex].label}: {scoreDisplay(scores[axes[tooltip.axisIndex].key] ?? null)}
      </div>
    )}
    <div className="spider-leerlijn-title" style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '8px' }}>
      {title}
    </div>
  </div>
);
```

**Security comment removal:** Remove the comment block at lines 41–44 (the `dangerouslySetInnerHTML` defense rationale). JSX eliminates this surface entirely. Update the function JSDoc in `utils/spider.ts` to note the JSX refactor removed the injection risk.

---

### `src/App.tsx` (provider/router, event-driven — self-extend)

**Analog:** `src/App.tsx` itself — full file is 119 lines, all in context above.

**Current state declarations (lines 11–16) — add settingsOpenCount:**
```typescript
// Current state (lines 11–16):
const [view, setView] = useState<'import' | 'klas' | 'detail' | 'settings'>('import');
const [prevView, setPrevView] = useState<'import' | 'klas' | 'detail'>('klas');
const [refreshKey, setRefreshKey] = useState(0);
const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
const [detailStudentList, setDetailStudentList] = useState<string[]>([]);
const [showModal, setShowModal] = useState(false);

// ADD after existing state:
const [settingsOpenCount, setSettingsOpenCount] = useState(0);
const [isDark, setIsDark] = useState(false);  // lifted from SettingsPage (Pitfall 2 fix)
```

**isDark initialization (add to existing useEffect or new useEffect):**
```typescript
// Load dark mode preference on mount — mirrors what SettingsPage currently does internally.
// Source for the store key and applyTheme pattern: src/components/SettingsPage.tsx (SET-01)
useEffect(() => {
  loadSettings().then(settings => {
    const dark = settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    applyTheme(settings.theme ?? 'light');
  });
}, []);
```

**Updated handleOpenSettings (current at lines 35–38):**
```typescript
// CURRENT (lines 35–38):
function handleOpenSettings() {
  setPrevView(view as 'import' | 'klas' | 'detail');
  setView('settings');
}

// UPDATED — add settingsOpenCount increment:
function handleOpenSettings() {
  setPrevView(view as 'import' | 'klas' | 'detail');
  setSettingsOpenCount(c => c + 1);  // forces key remount → re-triggers slide animation
  setView('settings');
}
```

**KlasTabStrip call with isDark prop (current at lines 76–83):**
```typescript
// CURRENT (lines 76–83):
<KlasTabStrip
  klassen={...}
  activeKlasId={klassenState.activeKlasId}
  onSwitch={handleKlasSwitch}
  onCreateKlas={() => setShowModal(true)}
  onSettings={handleOpenSettings}
  isSettingsActive={view === 'settings'}
/>

// ADD isDark prop:
<KlasTabStrip
  klassen={...}
  activeKlasId={klassenState.activeKlasId}
  onSwitch={handleKlasSwitch}
  onCreateKlas={() => setShowModal(true)}
  onSettings={handleOpenSettings}
  isSettingsActive={view === 'settings'}
  isDark={isDark}
/>
```

**Settings view block with slide animation (current at lines 109–114):**
```typescript
// CURRENT (lines 109–114):
{view === 'settings' && (
  <SettingsPage
    onBack={handleBackFromSettings}
    onNavigateToImport={handleNavigateToImportFromSettings}
  />
)}

// UPDATED — wrap in animation div + key prop for remount:
{view === 'settings' && (
  <div className="view-slide-in-right" style={{ overflow: 'hidden' }}>
    <SettingsPage
      key={settingsOpenCount}
      onBack={handleBackFromSettings}
      onNavigateToImport={handleNavigateToImportFromSettings}
      isDark={isDark}
      onToggleDark={setIsDark}
    />
  </div>
)}
```

**Detail view fade transition (D-17 — optional light fade):**
```typescript
// Optional: wrap detail view for enter fade
{view === 'detail' && activeStudentId && (
  <div style={{ animation: `fadeIn var(--transition-fast) ease forwards` }}>
    <DetailWeergave ... />
  </div>
)}
// Add @keyframes fadeIn to index.css: from { opacity: 0; } to { opacity: 1; }
```

---

### `src/components/KlasTabStrip.tsx` (component, request-response — self-extend)

**Analog:** `src/components/KlasTabStrip.tsx` itself — full file is 46 lines, all in context above.

**Current interface (lines 3–10) — add isDark prop:**
```typescript
// CURRENT (lines 3–10):
interface KlasTabStripProps {
  klassen: Array<{ id: string; naam: string }>;
  activeKlasId: string | null;
  onSwitch: (klasId: string) => void;
  onCreateKlas: () => void;
  onSettings: () => void;
  isSettingsActive: boolean;
}

// UPDATED — add isDark:
interface KlasTabStripProps {
  klassen: Array<{ id: string; naam: string }>;
  activeKlasId: string | null;
  onSwitch: (klasId: string) => void;
  onCreateKlas: () => void;
  onSettings: () => void;
  isSettingsActive: boolean;
  isDark: boolean;  // NEW — switches logo variant
}
```

**Current nav JSX (lines 17–44) — add logo before tab buttons:**
```typescript
// CURRENT — nav opens with klas tabs directly (line 18):
<nav id="main-nav">
  {klassen.map(klas => ( ... ))}

// UPDATED — add logo img before tabs:
<nav id="main-nav">
  <img
    src={isDark ? '/logo-dark.svg' : '/logo-light.svg'}
    alt="CIOS Zuidwest logo"
    style={{ height: '36px', width: 'auto', marginRight: '16px' }}
  />
  {klassen.map(klas => ( ... ))}
```

**Note on logo paths:** Vite serves `public/` files at root `/`. Place logo files in `public/logo-light.svg` and `public/logo-dark.svg` OR use `src/assets/` with explicit import:
```typescript
import logoLight from '../assets/logo-light.svg';
import logoDark from '../assets/logo-dark.svg';
// Then: src={isDark ? logoDark : logoLight}
```
The import approach is preferred in this codebase (Vite processes and hashes assets in `src/assets/`).

---

### `tests/spider.test.ts` (test — self-update)

**Analog:** `tests/spider.test.ts` itself — full file is 37 lines, all in context above.

**Add React import and testing-library (lines 1–8):**
```typescript
// ADD at top:
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
// (existing imports unchanged)
import { SpiderChart } from '../utils/spider';
import { DEELGEBIEDEN } from '../utils/schema';
```

**Test 1 — update string assertion to JSX check (line 15–19):**
```typescript
// CURRENT:
test('buildSpiderSVG geeft een string terug', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  expect(typeof svg).toBe('string');
  expect(svg.length).toBeGreaterThan(0);
});

// UPDATED:
test('buildSpiderSVG geeft een JSX element terug', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  expect(React.isValidElement(svg)).toBe(true);
});
```

**Test 2 — update `toContain('<svg')` (lines 21–24):**
```typescript
// CURRENT:
test("output bevat '<svg'", () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  expect(svg).toContain('<svg');
});

// UPDATED:
test("output rendert naar svg element", () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  const html = renderToStaticMarkup(svg);
  expect(html).toContain('<svg');
});
```

**Test 3 — update `toContain('polygon')` (lines 26–30):**
```typescript
// CURRENT:
test('alle excellent scores geeft polygon terug', () => {
  const scores = Object.fromEntries(DEELGEBIEDEN.map((dg: any) => [dg.id, 'excellent']));
  const svg = SpiderChart.buildSpiderSVG(axes, scores, '--color-spider-fill', '--color-spider-stroke');
  expect(svg).toContain('polygon');
});

// UPDATED:
test('alle excellent scores geeft polygon terug', () => {
  const scores = Object.fromEntries(DEELGEBIEDEN.map((dg: any) => [dg.id, 'excellent']));
  const svg = SpiderChart.buildSpiderSVG(axes, scores, '--color-spider-fill', '--color-spider-stroke');
  const html = renderToStaticMarkup(svg);
  expect(html).toContain('polygon');
});
```

**Test 4 — no throw (lines 32–36):** Preserve unchanged — does not assert on return type.

**NEW tests to add (axis labels + hit circles):**
```typescript
test('axis labels worden gerenderd als text elementen', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  const html = renderToStaticMarkup(svg);
  // Each axis should produce a <text> element with the label value
  expect(html).toContain('<text');
  expect(html).toContain(axes[0].label);
});

test('hit circles worden gerenderd voor tooltip interactie', () => {
  const svg = SpiderChart.buildSpiderSVG(axes, {}, '--color-spider-fill', '--color-spider-stroke');
  const html = renderToStaticMarkup(svg);
  expect(html).toContain('spider-hit-circle');
});
```

---

## Shared Patterns

### CSS Custom Property Inheritance

**Source:** `src/index.css` `:root` block (lines 14–108)
**Apply to:** All Phase 19 CSS additions — use variables, never hardcode colors/sizes.

```css
/* Pattern: always reference tokens, never hardcode */
color: var(--text-primary);
background: var(--bg-surface);
border: 1.5px solid var(--border-default);
box-shadow: var(--shadow-sm);
transition: all var(--transition-base);
border-radius: var(--radius-sm);
```

### Dark Mode Extension Pattern

**Source:** `src/index.css` `body.dark` blocks (lines 111–165)
**Apply to:** Every new token that requires a dark variant.

```css
/* Pattern: add to existing body.dark block, never create a new one */
body.dark {
  /* token overrides only — no layout or structural rules */
  --token-name: dark-value;
}
```

### React State for UI Ephemeral State

**Source:** `src/App.tsx` (lines 11–16) — existing `useState` pattern
**Apply to:** `settingsOpenCount`, `isDark` additions to App.tsx; `tooltip` in SpiderChartCard.

```typescript
// Pattern: co-locate state close to its consumer
const [ephemeralState, setEphemeralState] = useState<TypeOrNull>(null);
// For counters used as remount keys:
const [count, setCount] = useState(0);
setCount(c => c + 1);  // functional update avoids stale closure
```

### Component Prop Interface Extension

**Source:** `src/components/KlasTabStrip.tsx` interface (lines 3–10)
**Apply to:** `KlasTabStrip` (`isDark` prop), `SettingsPage` (`isDark` + `onToggleDark` props).

```typescript
// Pattern: extend existing interface with new optional or required props
interface ComponentProps {
  // ... existing props ...
  newProp: Type;  // NEW — descriptive comment explaining purpose
}
```

### Transition Timing Convention

**Source:** `src/index.css` lines 53–55 (transition tokens) + confirmed gaps audit
**Apply to:** All new hover/focus/animation additions in Phase 19.

```css
/* Small interactive elements (icon buttons, toggles, table rows, hit circles): */
transition: property var(--transition-fast);   /* 150ms ease */

/* Cards, tiles, larger surfaces, settings panel: */
transition: property var(--transition-base);   /* 200ms ease */

/* Progress bars, animated widths: */
transition: property var(--transition-slow);   /* 300ms ease */
```

### Existing Hover Rule Pattern (reference for gap fixes)

**Source:** `src/index.css` lines 265–269 (`.nav-tab:hover`) and line 1097 (`.dg-settings-row:hover td`)

```css
/* Element hover pattern used throughout codebase: */
.element:hover {
  background: var(--bg-surface-alt);    /* or accent-light for interactive */
  border-color: var(--border-default);  /* or accent-border for focus-adjacent */
  transition: property var(--transition-fast);
}
```

---

## No Analog Found

All Phase 19 files have close analogs in the codebase (all are self-refactors or self-extensions of existing files). No new files require greenfield patterns from RESEARCH.md alone.

| File | Notes |
|------|-------|
| `src/assets/fonts/` directory | New directory. No special pattern — copy OTF files from `C:\Users\rafae\Desktop\bestanden voor dashboard testing\design\industry font\` to `src/assets/fonts\`. Referenced via `@font-face url('./assets/fonts/...')` in `src/index.css`. |
| `src/assets/logo-light.svg` / `logo-dark.svg` | New static assets. Export from provided design images. Reference via Vite asset import in `KlasTabStrip.tsx`. |

---

## Metadata

**Analog search scope:** `src/components/`, `src/`, `utils/`, `tests/`
**Files scanned:** 7 source files read directly (all primary analogs)
**Key insight:** Phase 19 is entirely self-contained — every modified file is its own best analog. The only design decision with no codebase precedent is the `@font-face` declaration (currently a Google Fonts `@import`) and the CSS `@keyframes` animation (currently no animations exist in the codebase). Both patterns are specified completely in RESEARCH.md and UI-SPEC.md.
**Pattern extraction date:** 2026-05-18
