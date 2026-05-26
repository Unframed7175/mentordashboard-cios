# Phase 28: Bug/Feedback Rapportage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 28-bug-feedback-rapportage
**Areas discussed:** Button placement & label, Description input flow, Console error ring buffer, Last import action definition

---

## Button placement & label

| Option | Description | Selected |
|--------|-------------|----------|
| KlasTabStrip nav bar | Next to ⚙ — always visible, consistent with existing nav pattern | ✓ |
| Floating button (bottom-right) | Fixed overlay, more prominent but adds visual weight | |
| Inside settings panel only | Not reachable from every view — violates FEED-01 | |

**User's choice:** KlasTabStrip nav bar

| Option | Description | Selected |
|--------|-------------|----------|
| 🐛 bug emoji | Universally understood as bug report | ✓ |
| ✉ envelope icon | Suggests email, less explicit | |
| "Feedback" text | Clear but takes more space | |

**User's choice:** 🐛 emoji character (not SVG — same zero-cost approach as ⚙ and × in the nav)

| Option | Description | Selected |
|--------|-------------|----------|
| title attribute tooltip "Fout melden" | Same pattern as settings gear button | ✓ |
| No tooltip | Minimal | |

**User's choice:** `title="Fout melden"` tooltip

---

## Description input flow

| Option | Description | Selected |
|--------|-------------|----------|
| Small modal with textarea first | Compact modal: textarea + Verstuur + Annuleren → builds mailto | ✓ |
| mailto: opens immediately | Body has placeholder text; tester types in email client | |
| Expand panel below nav bar | Slide-down panel with textarea | |

**User's choice:** Modal with textarea

| Option | Description | Selected |
|--------|-------------|----------|
| "Verstuur" + "Annuleren" | Verstuur opens mailto, Annuleren closes modal | ✓ |
| Just "Verstuur" | No cancel path | |

**User's choice:** Both buttons

| Option | Description | Selected |
|--------|-------------|----------|
| Optional — always enabled | Lower friction; technical info is valuable alone | ✓ |
| Required — must not be empty | Ensures context always present | |

**User's choice:** Description optional

| Option | Description | Selected |
|--------|-------------|----------|
| "[Bug] Mentordashboard v{version} — {OS}" | Auto-generated, editable in email client | ✓ |
| Empty — tester fills in | Per FEED-05 spirit | |
| "Foutmelding Mentordashboard" | Fixed, simple | |

**User's choice:** Auto-generated subject with version + OS

---

## Console error ring buffer

| Option | Description | Selected |
|--------|-------------|----------|
| Last 10 errors | Per STATE.md design note | ✓ |
| Last 5 errors | More concise | |
| Last 20 errors | More context | |

**User's choice:** 10 entries

| Option | Description | Selected |
|--------|-------------|----------|
| "Geen console errors geregistreerd" | Explicit — developer knows capture worked | ✓ |
| Omit section entirely | Cleaner but ambiguous | |

**User's choice:** Show explicit message when empty

| Option | Description | Selected |
|--------|-------------|----------|
| main.tsx — top of file | Catches errors from earliest moment | ✓ |
| App.tsx useEffect | Slightly later, misses initial load errors | |

**User's choice:** main.tsx, before ReactDOM.createRoot

| Option | Description | Selected |
|--------|-------------|----------|
| Both console.error + window.onerror | Per STATE.md; catches all unhandled exceptions | ✓ |
| console.error only | Simpler but misses uncaught errors | |

**User's choice:** Both capture hooks

---

## Last import action definition

| Option | Description | Selected |
|--------|-------------|----------|
| Last single file: filename + type | Simple, clear, easy to track | ✓ |
| Last session's imports: full list | More context, more complex | |
| Just type, no filename | Privacy-conscious | |

**User's choice:** Single file — filename + type (PDF/Excel/zip) + timestamp

| Option | Description | Selected |
|--------|-------------|----------|
| utils/feedback.ts module-level variable | Clean separation; setLastImport() setter | ✓ |
| App.tsx state | Simpler but bloats App.tsx | |
| klassenState singleton | Mixes concerns | |

**User's choice:** utils/feedback.ts

| Option | Description | Selected |
|--------|-------------|----------|
| rafaelalvarez1010@gmail.com | Registered email from project context | |
| Other (user typed) | ralvarezstam@cioszuidwest.nl | ✓ |

**User's choice:** `ralvarezstam@cioszuidwest.nl`

---

## Claude's Discretion

None — all significant decisions were made by the user.

## Deferred Ideas

None — discussion stayed within phase scope.
