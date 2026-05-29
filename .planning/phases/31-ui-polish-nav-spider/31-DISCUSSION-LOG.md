# Phase 31: UI Polish — Nav & Spider - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 31-ui-polish-nav-spider
**Areas discussed:** Nav-stripe height, Spider card sizing, FeedbackActiepunten position

---

## Nav-stripe height

| Option | Description | Selected |
|--------|-------------|----------|
| Grow to fill nav height | `height: 100%` — stripe fills the full 104px nav. More prominent triangle. Avoids hardcoding a second value. | ✓ |
| Stay at current size (52px) | Stripe stays a small corner accent while nav gets taller. | |

**User's choice:** Grow to fill nav height (`height: 100%`)
**Notes:** No additional nav-stripe questions — moved directly to next area.

---

## Spider card sizing

### Card width
| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 280px each | Each of 3 cards is exactly 280px. Side by side on normal desktop, wraps on narrow windows (already supported). | ✓ |
| Fluid — fill available width | Cards grow to fill space with `flex: 1, min-width: 280px`. Better on large monitors, more CSS work. | |

**User's choice:** Fixed 280px each

### SVG scaling
| Option | Description | Selected |
|--------|-------------|----------|
| Responsive via viewBox | SVG fills card container via `viewBox` + `width="100%"`. Required by UI-05 requirement text. | ✓ |
| Fixed pixel SVG | SVG stays at fixed internal size; card may have whitespace. | |

**User's choice:** Responsive via viewBox

---

## FeedbackActiepunten position

| Option | Description | Selected |
|--------|-------------|----------|
| Absolute bottom — after BpvProgressSection | Pure JSX reorder, no logic change. Matches UI-06 exactly. | ✓ |
| After VerzuimSection, before BpvProgressSection | One position up from absolute last. | |

**User's choice:** Absolute bottom — after BpvProgressSection

---

## Claude's Discretion

None — all decisions were made explicitly by the user.

## Deferred Ideas

- **Mac file upload bug** — User noted that file upload does not work on the Mac version. Out of scope for this UI polish phase. Should be a dedicated bug-fix phase after reproduction and diagnosis.
