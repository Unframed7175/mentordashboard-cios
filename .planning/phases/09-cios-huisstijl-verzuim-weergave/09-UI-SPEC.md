---
phase: 09
phase_name: CIOS Huisstijl & Verzuim Weergave
status: draft
created: 2026-04-24
design_system: none (vanilla CSS variables)
framework: vanilla HTML/CSS/JS
---

# UI-SPEC: Phase 9 — CIOS Huisstijl & Verzuim Weergave

## Scope

Pure visual redesign. No new components, no layout changes, no new functionality.
Changes are limited to:
1. CSS variable values in `:root` and `body.dark` blocks in `index.html`
2. One JS text change in `buildMiniVerzuimBar()` in `app.js`

---

## 1. Design System

| Field | Value | Source |
|-------|-------|--------|
| Tool | None — vanilla CSS variables | CONTEXT.md D-07 |
| Component library | None | Additional context |
| Token file | `index.html` `:root { }` block | Codebase scan |
| Dark mode file | `index.html` `body.dark { }` block | Codebase scan |

No shadcn. No Tailwind. No external design system. All tokens are CSS custom properties defined inline in `index.html`.

---

## 2. Color Contract

### 2.1 Accent Color — CIOS Cyaan

Replace all `--accent-blue*` token **values**. Token names are preserved (no HTML class changes).

| Token | Old Value | New Value | Notes |
|-------|-----------|-----------|-------|
| `--accent-blue` | `#3b82f6` | `#00AEEF` | CIOS cyaan — primary accent (Source: CONTEXT.md D-01, REQUIREMENTS.md DES-01) |
| `--accent-blue-hover` | `#2563eb` | `#009AD6` | ~10% darkened cyaan for hover states |
| `--accent-blue-light` | `#eff6ff` | `#E6F7FD` | ~8% cyaan tint on white — used for import-zone bg, sort-btn active bg, info panels |
| `--accent-blue-border` | `#bfdbfe` | `#80D7F7` | ~50% cyaan tint — used for borders in focused inputs, info panels |

These four tokens propagate automatically to all usages:
- `.btn-primary` background and hover
- Import zone `border-color` and `background` (drag-active state)
- `#progress-bar-fill` background
- `#klas-zoek:focus` border
- `.sort-btn.active` background and border
- `.leerlijn-bar-fill` background
- Score bar fill
- Detail view focus ring (`outline`)
- Backup password prompt border

### 2.2 Header Color — CIOS Navy

| Token | Old Value | New Value | Notes |
|-------|-----------|-----------|-------|
| `--bg-header` | `#1a1a2e` | `#003057` | CIOS navy — applies to site header/nav bar (Source: CONTEXT.md D-02) |

Applied to: `#site-header` via `background: var(--bg-header)`.

### 2.3 Dark Mode Tokens

Dark mode (`body.dark`) receives identical accent and header updates. All other dark mode surface/text/border tokens remain unchanged.

| Token | Dark Mode Value | Notes |
|-------|----------------|-------|
| `--accent-blue` | `#00AEEF` | Same as light — cyaan reads well on dark surfaces (Source: CONTEXT.md D-03) |
| `--accent-blue-hover` | `#009AD6` | Same as light |
| `--accent-blue-light` | `#0A2C3D` | Dark-mode tint: deep navy-cyaan at low opacity, replaces `#172554` logic |
| `--accent-blue-border` | `#005F8A` | Mid-dark cyaan border |
| `--bg-header` | `#003057` | Same navy as light mode (Source: CONTEXT.md D-03) |

Note: Dark mode currently has no `--accent-blue*` tokens declared (it inherits from `:root`). If they exist implicitly via inheritance, adding explicit overrides ensures correct dark-mode theming.

### 2.4 60/30/10 Color Distribution

This phase does not restructure layout. The existing color distribution is maintained:
- 60% dominant: `--bg-page` (`#f5f5f7` light / `#0f172a` dark) — unchanged
- 30% secondary: `--bg-surface`, `--bg-surface-alt` — unchanged
- 10% accent: `#00AEEF` — buttons, active tabs, focus rings, progress bars, links

### 2.5 Spider Chart Stroke Colors

`--spider-prof-handelen-stroke: #22b8c8` (light) / `#67e8f9` (dark) — **leave unchanged**.

Rationale: Spider chart colors are semantic domain identifiers (Lesgeven = green, Organiseren = yellow, Professioneel Handelen = teal). Changing prof-handelen to `#00AEEF` would create ambiguity between "accent interactive" and "competency domain" semantics. The teal `#22b8c8` is distinct enough from `#00AEEF` to avoid confusion.

### 2.6 Verzuim Bar Colors

3-part verzuim bar segment colors (aanwezig / geoorloofd / ongeoorloofd) are **unchanged** (Source: CONTEXT.md D-06, REQUIREMENTS.md VRZ-02).

---

## 3. Typography

### 3.1 Font Stack

**Unchanged.** System font stack remains:
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```
No external fonts loaded. No font-face declarations added. (Source: CONTEXT.md D-04)

### 3.2 Font Sizes

Existing sizes are preserved. This phase introduces no new size tokens.

| Usage | Size | Already in codebase |
|-------|------|---------------------|
| Body / default | `16px` (1rem) | Yes — `body { font-size: 16px }` |
| Small / muted labels | `0.75rem` (12px) | Yes — verzuim text, result badges |
| Secondary text | `0.85rem–0.9rem` | Yes — import hints, progress labels |
| Headings | inherits 1rem+ | Yes |

### 3.3 Font Weights

This phase applies `font-weight: 700` more consistently to headings where it is not yet set.

| Weight | Usage | Source |
|--------|-------|--------|
| `400` | Body text, muted labels | Default |
| `600` | Table headers, card subheadings, sort button active | Existing |
| `700` | `h1`, `h2`, section headers, site header h1 | Expand from existing pattern (Source: CONTEXT.md D-04) |

Target elements for `font-weight: 700` audit during implementation:
- `#site-header h1` — already 700 (confirmed via line 96)
- All `h2` elements within section panels
- Card/tegel primary name labels where only `font-weight: 600` is set

### 3.4 Line Heights

| Context | Line Height |
|---------|-------------|
| Body | `1.5` (existing — `body { line-height: 1.5 }`) |
| Headings | Default browser (tight) — unchanged |

---

## 4. Spacing

This phase introduces **no spacing changes**. Existing 8-point scale is preserved:
4px, 8px, 12px, 16px, 24px, 32px, 48px — all via existing CSS.

---

## 5. Copywriting Contract

### 5.1 Verzuim Text in Klasoverzicht Tegel

| State | Old Copy | New Copy | Source |
|-------|----------|----------|--------|
| Student has verzuim data | `"Xu ongeoorloofd"` | `"87% aanwezig"` (dynamic) | REQUIREMENTS.md VRZ-01, CONTEXT.md D-05 |
| Student has no verzuim data | *(empty div — no change)* | *(empty div — no change)* | CONTEXT.md D-05 |

**Implementation contract:**

In `buildMiniVerzuimBar()` (app.js lines 1256–1272):

- Remove: `ongeoorloofdTekst` variable and its conditional display logic
- Replace with: `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px;">${pA}% aanwezig</div>`
- The `pA` variable is already computed at line 1261 — reuse as-is
- Text color: `var(--text-muted)` — neutral, not conditional on threshold (Source: CONTEXT.md D-05)
- Font size: `0.75rem` — unchanged from current `ongeoorloofdTekst` (Source: CONTEXT.md D-05)
- Position: same `margin-top: 3px` below the bar

Note: The `VERZUIM_DREMPEL_MIN` threshold (line 1039) and its use elsewhere in the codebase remain untouched. Only `buildMiniVerzuimBar()` changes.

### 5.2 Empty State

No changes to empty state copy in this phase. Existing import-zone messaging unchanged.

### 5.3 Error States

No changes to error copy in this phase.

### 5.4 Destructive Actions

No destructive actions introduced in this phase.

---

## 6. Interactive States

No new interactive patterns. Existing patterns gain the CIOS cyaan color automatically through token propagation:

| Element | State | Before | After |
|---------|-------|--------|-------|
| `.btn-primary` | Default | `#3b82f6` bg | `#00AEEF` bg |
| `.btn-primary` | Hover | `#2563eb` bg | `#009AD6` bg |
| Import zone | Drag-active | `#eff6ff` bg, `#3b82f6` border | `#E6F7FD` bg, `#00AEEF` border |
| `#klas-zoek` | Focus | `#3b82f6` border | `#00AEEF` border |
| `.sort-btn` | Active | `#eff6ff` bg, `#3b82f6` border | `#E6F7FD` bg, `#00AEEF` border |
| Active tab | Selected | `#3b82f6` indicator | `#00AEEF` indicator |
| Focus ring | Keyboard nav | `2px solid #3b82f6` | `2px solid #00AEEF` |

---

## 7. Component Inventory

No new components. No removed components. Changes are token-only (CSS values) plus one JS string replacement.

| Component | Change Type | Detail |
|-----------|-------------|--------|
| CSS `:root` block | Token value update | 4 accent tokens + 1 header token |
| CSS `body.dark` block | Token value addition/update | 5 tokens (accent variants + header) |
| `buildMiniVerzuimBar()` | JS string change | Replace `ongeoorloofdTekst` with `${pA}% aanwezig` using `--text-muted` |

---

## 8. Accessibility

- Contrast check required: `#00AEEF` on white (`#ffffff`) — WCAG AA requires 4.5:1 for normal text, 3:1 for large text/UI components. `#00AEEF` on white yields approximately 2.4:1 — **insufficient for text**. Use `#00AEEF` only for UI components (buttons, borders, progress bars) where 3:1 applies, not as a text color.
- Button text on `#00AEEF` background: white (`#fff`) — contrast is approximately 2.4:1, marginal. The existing pattern (white text on accent button) is retained per decisions. If auditor flags this, the recommendation is to darken the button background to `#0090CC` for AA compliance on button text.
- The `${pA}% aanwezig` text uses `--text-muted` (`#6b7280`) on white bg — contrast is approximately 4.6:1, passes AA for normal text.

---

## 9. Registry

Not applicable. No package registry, no shadcn, no third-party component blocks.

---

## 10. Implementation Checklist for Executor

- [ ] In `index.html` `:root` block: set `--accent-blue: #00AEEF`
- [ ] In `index.html` `:root` block: set `--accent-blue-hover: #009AD6`
- [ ] In `index.html` `:root` block: set `--accent-blue-light: #E6F7FD`
- [ ] In `index.html` `:root` block: set `--accent-blue-border: #80D7F7`
- [ ] In `index.html` `:root` block: set `--bg-header: #003057`
- [ ] In `index.html` `body.dark` block: add/set `--accent-blue: #00AEEF`
- [ ] In `index.html` `body.dark` block: add/set `--accent-blue-hover: #009AD6`
- [ ] In `index.html` `body.dark` block: add/set `--accent-blue-light: #0A2C3D`
- [ ] In `index.html` `body.dark` block: add/set `--accent-blue-border: #005F8A`
- [ ] In `index.html` `body.dark` block: add/set `--bg-header: #003057`
- [ ] In `app.js` `buildMiniVerzuimBar()`: replace `ongeoorloofdTekst` variable and its conditional with `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px;">${pA}% aanwezig</div>`
- [ ] Audit `h2` and section header elements — apply `font-weight: 700` where not already set
- [ ] Verify: spider chart stroke colors (`#22b8c8`, `#67e8f9`) are NOT modified
- [ ] Verify: verzuim bar segment colors (aanwezig/geoorloofd/ongeoorloofd) are NOT modified
- [ ] Verify: `VERZUIM_DREMPEL_MIN` and threshold logic outside `buildMiniVerzuimBar()` are NOT modified

---

## Pre-Population Sources

| Source | Decisions Used |
|--------|---------------|
| CONTEXT.md | 8 (D-01 through D-08) |
| REQUIREMENTS.md | 6 (VRZ-01, VRZ-02, DES-01–DES-04) |
| Codebase scan (index.html) | All existing token names and values |
| Codebase scan (app.js) | buildMiniVerzuimBar() exact logic, pA variable |
| User input this session | 0 (all decisions pre-answered) |
| Researcher defaults | Derived hover/light/border values from #00AEEF; spider color decision |
