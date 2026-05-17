# Phase 17: Settings Panel Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 17-settings-panel-foundation
**Areas discussed:** Settings page layout, Dark mode toggle UX, Add-files flow, Settings page visual design, Settings icon style

---

## Settings Page Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Full-page view (4th route state) | Replaces current view — consistent with existing routing | ✓ |
| Slide-in drawer / panel | Overlays current view, no existing pattern | |
| Modal overlay | Centred modal like KlasModal but larger | |

**User's choice:** Full-page view (4th route state)
**Notes:** Consistent with existing import/klas/detail routing pattern in App.tsx.

---

## Settings Page Sections

| Option | Description | Selected |
|--------|-------------|----------|
| Dark mode + Add files only | Minimal — exactly the 2 requirements | |
| Dark mode + Add files + Phase 18 placeholders | Visible but disabled section headers for Phase 18 content | ✓ |
| You decide | Claude picks | |

**User's choice:** Include Phase 18 placeholder sections
**Notes:** Placeholder cards show "Komt in een volgende versie" — Phase 18 replaces them.

---

## Settings Icon Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Far-right edge of nav bar | Standard convention, pinned right, separate from class tabs | ✓ |
| After + New class button | Next to existing action buttons | |
| You decide | Claude picks | |

**User's choice:** Far-right edge of the nav bar

---

## Dark Mode — OS vs User Toggle

| Option | Description | Selected |
|--------|-------------|----------|
| User toggle overrides OS — start from OS default | Reads OS on first launch, saves explicit choice thereafter | ✓ |
| User toggle only — always start light | Simple but ignores OS preference | |
| Always follow OS until toggled | Most complex | |

**User's choice:** Start from OS default, user choice overrides and is persisted

---

## Dark Mode — Persistence Location

| Option | Description | Selected |
|--------|-------------|----------|
| Separate 'settings' key in plugin-store | Keeps class data and preferences isolated | ✓ |
| Same store key as class data | Simpler but mixes concerns | |
| localStorage | Unreliable in Tauri production (Phase 12 research) | |

**User's choice:** Separate 'settings' key in plugin-store

---

## Dark Mode — Toggle Control

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle switch (on/off) with label | CSS toggle, no library, label "Donkere modus" | ✓ |
| Light / Dark / System three-way selector | More options, more UI complexity | |
| You decide | Claude picks | |

**User's choice:** Toggle switch with label

---

## Add-Files Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate to ImportPage | Button in settings navigates to existing ImportPage view | ✓ |
| Inline dropzone inside settings | Embedded dropzone, duplicates logic | |
| Tauri file dialog only | OS file picker, no drag-drop in settings | |

**User's choice:** Navigate to existing ImportPage

---

## After Import — Landing View

| Option | Description | Selected |
|--------|-------------|----------|
| Back to klas overview | Same as existing handleImportComplete | ✓ |
| Back to settings page | Requires extra routing state | |
| You decide | Claude picks | |

**User's choice:** Back to klas overview

---

## Settings Page Visual Design

| Option | Description | Selected |
|--------|-------------|----------|
| Cards per section | Uses existing .detail-section CSS pattern | ✓ |
| Simple list with dividers | More compact, new pattern | |
| You decide | Claude picks | |

**User's choice:** Cards per section (reuses existing CSS)

---

## Back Button

| Option | Description | Selected |
|--------|-------------|----------|
| Back button in page header | ← Terug, same pattern as DetailWeergave | ✓ |
| Nav bar toggle only | Settings icon closes settings | |
| You decide | Claude picks | |

**User's choice:** Back button in page header

---

## Settings Icon Style

| Option | Description | Selected |
|--------|-------------|----------|
| ⚙ Gear icon — Unicode or inline SVG | Universal settings convention, no library | ✓ |
| Sliders icon (SVG) | Modern, requires SVG | |
| Text button: 'Instellingen' | Accessible but takes horizontal space | |

**User's choice:** Gear icon (Unicode ⚙ or inline SVG)

---

## Claude's Discretion

- Exact gear icon implementation (Unicode vs inline SVG)
- CSS class names for settings page components
- Whether `prevView` is stored as state or inferred from a navigation stack
- Dark mode apply timing (instant on toggle — user confirmed this implicitly by not selecting "confirm step")

## Deferred Ideas

- Other UI / frontend changes from Phase 16 UAT → Phase 19 (UI Polish)
- Three-way light/dark/system selector → Phase 19 if desired
- Settings page slide-in animation → Phase 19
