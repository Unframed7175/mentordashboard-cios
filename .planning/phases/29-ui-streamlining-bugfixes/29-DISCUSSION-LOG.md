# Phase 29: UI Streamlining & Bugfixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 29-ui-streamlining-bugfixes
**Areas discussed:** Doorstroomnorm criteria display, Nav stripe fix, BPV states, Tile cleanup, View transitions, Detail view cleanup (spider size, removed sections)

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Nav stripe fix | FIX-01: pseudo-element not rendering in Tauri WebView2 | ✓ |
| BPV states | FIX-02: no loading state, same text for loading and empty | ✓ |
| Tile cleanup direction | UI-02: tiles feel busy | ✓ |
| Transition scope | UI-04: what gets transitions | ✓ |
| Doorstroomnorm criteria display | Custom: full criteria breakdown with RAG per row | ✓ (user added via Other) |

---

## Doorstroomnorm Criteria Display

| Option | Description | Selected |
|--------|-------------|----------|
| Per eis één rij | Each requirement on its own line across all trajectories | |
| Per traject een blok | SBL block, SBC block, Negatief block — each with its criteria | ✓ |

**Follow-up — BJ1 trajectories:**

| Option | Description | Selected |
|--------|-------------|----------|
| BJ2 + SBC naast elkaar | Show both trajectory blocks simultaneously | ✓ |
| Alleen meest relevante traject | App picks the most achievable one | |

**Follow-up — Placement:**

| Option | Description | Selected |
|--------|-------------|----------|
| Vervangt de huidige sectie | Full replacement of DoortstroomPrognoseSection | ✓ |
| Aparte nieuwe sectie | Keep current summary, add expandable detail block below | |

**Follow-up — Criterion row status:**

| Option | Description | Selected |
|--------|-------------|----------|
| Score vs drempel + rood/groen | Binary: met = green, not met = red | |
| Score vs drempel + rood/oranje/groen | 3-state: green, orange (1-2 away), red | ✓ |

**Scope decision:**

| Option | Description | Selected |
|--------|-------------|----------|
| Toevoegen aan Phase 29 | Expand Phase 29 to include this as a new requirement | ✓ |
| Aparte fase plannen | Note as deferred, new phase after Phase 30 | |

**Notes:** User explicitly wants to see all doorstroom criteria at a glance — not just the end conclusion. The per-traject block format with score/threshold on each row gives the mentor immediate insight into where a student stands on each specific norm. 3-state coloring (green/orange/red) provides more nuance than binary pass/fail — orange signals "close to the threshold" which is useful during a mentorgesprek.

---

## Nav Stripe Fix (FIX-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Echt DOM-element | Replace ::after with `<div aria-hidden>` — reliable in WebView2 | ✓ |
| Andere CSS benadering | Keep ::after but change gradient direction or use clip-path | |
| Verwijderen | Remove stripe entirely | |

**Notes:** DOM elements are unambiguously reliable in Tauri WebView2. The pseudo-element gradient was always a fragile approach for Chromium-based WebViews.

---

## BPV States (FIX-02)

**Loading state:**

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton loader | Gray placeholder bars | |
| Korte tekst 'Laden...' | Simple "BPV-data laden…" text | ✓ |

**Empty state:**

| Option | Description | Selected |
|--------|-------------|----------|
| Huidige tekst, beter geformuleerd | Clearer action instruction, same location | ✓ |
| Leeg-state met link/knop | Text + clickable link to import screen | |

**Notes:** Simple text for loading matches the app's other async sections — no skeletons elsewhere. Improved empty-state wording gives the mentor a clearer next action without the overhead of a clickable link.

---

## Tile Cleanup (UI-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Minder info zichtbaar | Score/absence as smaller/secondary text | |
| Meer witruimte | More padding/gap — same elements, more breathing room | ✓ |
| Beide: witruimte + secondary styling | Both approaches combined | |

**Notes:** User wants all info to remain equally visible — just more space around it. No de-emphasis of secondary data.

---

## View Transitions (UI-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Tab-navigatie | Active tab indicator animation on click | ✓ |
| Klasoverzicht ↔ Detailweergave | Fade-in on view mount | ✓ |
| Settings openen/sluiten | Slide-in panel animation | ✓ |

**Notes:** All three selected — comprehensive 150–200ms transition coverage across all major view switches.

---

## Detail View Cleanup

**Spider size:**

| Option | Description | Selected |
|--------|-------------|----------|
| Groter | Increase diameter from ~220px to ~320px | |
| Smaller / compacter | Reduce chart size | |
| Full-width kaart | Charts fill full detail view width | ✓ |

**LeerlijnenSection:**

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, volledig verwijderen | Remove from DetailWeergave (component file kept) | ✓ |
| Verbergen achter toggle | Collapsed by default, expandable | |

**NotitiesTextarea:**

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, volledig verwijderen | Remove from DetailWeergave (data stays in store) | ✓ |
| Alleen verbergen in UI | Don't render but keep data layer | |

**VakkenSection ("voortgang per vak met mijn voortgang en feedback"):**

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, volledig verwijderen | Remove from DetailWeergave (feed forward data stays in store) | ✓ |
| Verbergen achter toggle | Collapsed by default | |

**Notes:** User wants a significantly leaner detail view. The doorstroomnorm block + spider chart give enough info for a mentorgesprek. The per-vak breakdown and freeform notes are not needed during the conversation itself.

---

## Claude's Discretion

- **UI-01 (Typography consistency):** Mechanical audit — scan for inconsistent font-sizes, line-heights, padding across views and normalize. No user preference needed.
- **UI-03 (Dark mode):** Audit for hardcoded hex colors (confirmed at least `#9ca3af` in BpvProgressSection line 38). Replace with CSS variables. Verify all views in dark mode.
- **Doorstroomnorm block visual design:** Left color-bar approach for block headers, criterion row format, and responsive column layout are at Claude's discretion based on the decisions captured.

## Deferred Ideas

- FeedbackActiepuntenSection visibility toggle — stays in Phase 29 but could be a collapse candidate in a future phase
- DeelgebiedenMatrix collapse-by-default — not discussed, potentially noisy after other sections removed
- VakkenSection toggle restore — feed forward data stays in store, could come back as an opt-in toggle in a later phase
