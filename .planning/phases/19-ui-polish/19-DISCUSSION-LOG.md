# Phase 19: UI Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 19-ui-polish
**Areas discussed:** Corporate Identity, Spider tooltip & labels, Responsive audit scope, Hover completeness, Settings page animation

---

## Corporate Identity

### Visual direction

| Option | Description | Selected |
|--------|-------------|----------|
| More modern & polished | Rounded corners, better spacing, refined typography | |
| Stronger CIOS brand presence | Cyan/navy more prominent, header logo or brand bar | |
| Cleaner layout / less cluttered | Better visual hierarchy, whitespace, less information density | |
| All of the above | Modern + branded + clean — the whole package | ✓ |

**User's choice:** All of the above — modern, stronger brand presence, and cleaner layout.

### Reference design style

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn/ui style | Neutral gray base, excellent light+dark mode | |
| Keep CIOS colors, just refine | Stay with cyan/navy, clean up spacing and consistency | |
| Material Design / Google-like | Elevation shadows, contained buttons, structured data | ✓ |
| No reference — up to Claude | Claude picks based on CIOS brand colors | |

**User's choice:** Material Design / Google-like.

### Material Design elements

| Option | Description | Selected |
|--------|-------------|----------|
| Elevation / card shadows | Cards feel raised from the page | ✓ |
| Color on nav & header | Top bar in CIOS cyan or navy | ✓ |
| Filled / tonal buttons | Primary actions as filled colored buttons | |
| Ripple / ink animations | Click ripple effect on interactive elements | |

**User's choice:** Elevation + colored nav/header. Ripple and filled buttons are out of scope.

### Nav/header color

**User's response:** "I have an example image — ask for it when you need it."
**Notes:** Implementer must request the reference image before designing the nav header.

### Card elevation tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Increase existing shadow values | Update --shadow-sm / --shadow-md to Material elevation 1/2 | |
| Add Material elevation scale (dp1-dp4) | New set of shadow tokens | |
| You decide | Pick whichever is most consistent | ✓ |

**User's choice:** Claude decides.

### Brand colors

| Option | Description | Selected |
|--------|-------------|----------|
| Those are correct, keep them | Phase 9 #00AEEF + #003057 are official | |
| I have the exact brand file — share at implementation | Will provide brand guide / color codes | ✓ |
| The colors need updating | Phase 9 colors aren't quite right | |

**User's choice:** Has exact brand file — will share at implementation.

### Logo

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — I'll provide them at implementation | Has logo files ready | |
| Only one version — Claude should adapt for dark mode | One file, dark variant to be derived | |
| No logo files yet — use text only | No assets available | |

**User's response:** "I do have 2 separate logos, but maybe they need some adjusting."
**Notes:** User has light and dark logo files; may need minor adjustments. Ask for them at implementation.

### Typography

**User's response (free text):** Full CIOS Industry spec:
- Page title: Industry Light, font size varies, line spacing 37
- Sub header: Industry Regular, font size 12, line spacing 14
- Intro text: Industry Regular, font size 12, line spacing 16
- Flat text: Industry Regular, font size 9, line spacing 14

### Font loading strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle Industry as a web font | Include font files in the app — requires licensed copy | |
| Use CSS font-family fallback stack | Mac gets real Industry, Windows falls back to Arial | |
| Use Inter as a free substitute | Similar metrics to Industry, free | |
| I'll provide the font files | Has licensed Industry files to include in Tauri bundle | ✓ |

**User's choice:** Will provide licensed font files for Tauri bundle.

---

## Spider Tooltip & Labels

### Tooltip approach

| Option | Description | Selected |
|--------|-------------|----------|
| Refactor to React SVG elements | Convert buildSpiderSVG to JSX — enables onMouseEnter per axis point | ✓ |
| SVG `<title>` elements (browser native) | No custom styling, zero complexity | |
| React overlay on top of SVG | Keep string SVG, position React divs at axis coordinates | |

**User's choice:** Refactor to React SVG elements.

### Axis labels placement

| Option | Description | Selected |
|--------|-------------|----------|
| Short labels at each axis endpoint | 2-4 char abbreviations at outer ring, always visible | |
| Full name only in the tooltip | No static labels, hover to see name | |
| Short label + full name in tooltip | Abbreviated label always visible, full name + score on hover | ✓ |

**User's choice:** Short label always visible + full name + score in tooltip.

### Tooltip content

| Option | Description | Selected |
|--------|-------------|----------|
| Full deelgebied name + score text | e.g. "Vakkennis & Attitude: Goed" | ✓ |
| Score + color indicator | Score text + colored dot matching RAG status | |
| You decide | Claude picks most useful info | |

**User's choice:** Full deelgebied name + score text.

---

## Responsive Audit Scope

### What breaks at 1024px

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher should audit | User doesn't know what breaks | ✓ |
| I know what breaks — let me specify | Can specify which components need fixing | |
| Everything — just make it all work | Full implied audit | |

**User's choice:** Researcher audits all views at 1024px.

### Stacking behavior at narrow widths

| Option | Description | Selected |
|--------|-------------|----------|
| Single column stacking (simpler) | All multi-column collapses to 1 column | |
| Proportional resize (keep multi-column) | Components shrink proportionally | |
| You decide per component | Claude picks best approach per component type | ✓ |

**User's choice:** Claude decides per component.

---

## Hover Completeness

### Scope of hover audit

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — audit all new components | Check every Phase 16–18 component for missing hover/focus | ✓ |
| Only interactive elements | Only clickable things (buttons, links, toggles) | |
| The existing ones are enough | POL-04 just means existing tiles/tabs are consistent | |

**User's choice:** Full audit of all Phase 16–18 components.

### Transition timing for new elements

| Option | Description | Selected |
|--------|-------------|----------|
| Match exactly — 200ms ease everywhere | Strict consistency, simple rule | |
| 150ms for small elements, 200ms for large | --transition-fast for small, --transition-base for large | |
| You decide | Claude picks per element size and type | ✓ |

**User's choice:** Claude decides.

---

## Settings Page Animation

### Animation type

| Option | Description | Selected |
|--------|-------------|----------|
| Slide in from the right | Material pattern for detail/side panel, 200ms ease | ✓ |
| Fade in | Simple non-directional fade | |
| No animation needed | Instant view switch | |

**User's choice:** Slide in from the right.

### Other view transitions

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — all view transitions should animate | Every view switch gets directional slide | |
| Only the settings panel | Other view switches stay instant | |
| You decide | Claude picks which transitions benefit | ✓ |

**User's choice:** Claude decides which other transitions get animation.

---

## Claude's Discretion

- Card shadow values (update `--shadow-sm`/`--shadow-md` vs. new Material elevation token scale)
- Nav header color (user has reference image — ask for it)
- Font size mapping for "varies" page title and pt→px conversion for all type sizes
- Transition timing per element type (follow D-15 guideline from CONTEXT.md)
- Which view transitions beyond settings get directional animation
- CSS class names for new tooltip/label components in spider chart

## Deferred Ideas

None — discussion stayed within phase scope.
