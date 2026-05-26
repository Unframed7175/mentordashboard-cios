# Phase 27: Klasbeheer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 27-klasbeheer
**Areas discussed:** Delete affordance, Rename trigger, Rename edit UX, Existing delete button

---

## Delete affordance

| Option | Description | Selected |
|--------|-------------|----------|
| × icon on tab hover | Small × appears inside tab on hover — only for empty classes | ✓ |
| Always-visible icon on empty tabs | Trash/× always shown next to class name for empty classes | |
| Only in KlasOverzicht | Keep delete in class overview only, no tab change | |

**User's choice:** × icon on tab hover (recommended)
**Notes:** None beyond selecting the recommended option.

---

### Delete confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| window.confirm dialog | Same pattern as existing KlasOverzicht delete | ✓ |
| Inline confirmation in tab | Tab shows "Zeker? Ja / Nee" buttons inline | |

**User's choice:** window.confirm (recommended)

---

## Rename trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Double-click on tab | Double-clicking tab text triggers rename mode | ✓ |
| Pencil icon on hover | ✏️ icon appears on hover next to class name | |
| Both: double-click + pencil icon | Both triggers available | |

**User's choice:** Double-click on the tab (recommended)

---

## Rename edit UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline input in tab | Tab transforms to text input with current name | ✓ |
| Small modal/popover | Dialog appears like class creation modal | |

**User's choice:** Inline input in the tab (recommended)

### Save behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Enter saves, Escape cancels, blur saves | Clicking away saves | ✓ |
| Enter saves, Escape cancels, blur cancels | Clicking away cancels | |

**User's choice:** Enter saves, Escape cancels, blur saves (recommended)

### Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Non-empty trim only | Require ≥1 non-whitespace character | ✓ |
| Non-empty + unique | Also block duplicate class names | |

**User's choice:** Non-empty trim only (recommended)

---

## Existing delete button

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it — tab × is the only delete path | Non-empty classes cannot be deleted via UI | ✓ |
| Keep it for non-empty classes | Tab × for empty, KlasOverzicht for non-empty | |
| Keep it as-is (no change) | Phase 27 only adds tab × on top | |

**User's choice:** Remove it (recommended) — single delete path going forward.

---

## Claude's Discretion

None — user selected an explicit option for every question.

## Deferred Ideas

- **Spider chart size + doorstroomprognose display in detail view** — mentioned before area selection. Deferred to Phase 29 (UI Streamlining & Bugfixes).
