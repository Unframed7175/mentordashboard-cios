# Phase 18: Settings Panel Advanced - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 18-settings-panel-advanced
**Areas discussed:** Deelgebieden config layout, Prognose bij inactieve deelgebieden, Verzuim drempel scope, BPV-uren locatie

---

## Deelgebieden config layout

### Q1: How should 19 deelgebieden be presented in Settings?

| Option | Description | Selected |
|--------|-------------|----------|
| Combined table (recommended) | One scrollable table: each row = one deelgebied. Columns: Naam (editable) \| Leerlijn (dropdown) \| Actief (toggle). SET-03 and SET-04 in one place. | ✓ |
| Two separate sections | Section A: rename + active toggle (SET-03). Section B: leerlijn dropdown (SET-04). More scrolling, but focused. | |
| You decide | Claude picks the best UX | |

**User's choice:** Combined table (recommended)

### Q2: How should a name be edited?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline text input (recommended) | Text input directly in the table row. Updates on blur/Enter. | ✓ |
| Click-to-edit (pencil icon) | Label shows as text; pencil icon turns it into an input. | |
| You decide | Claude picks based on patterns | |

**User's choice:** Inline text input (recommended)

### Q3: Should there be a reset button?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — reset button in the section | "Herstel standaard" below the table resets all customizations. | ✓ |
| No — no reset needed | Mentor can undo manually. | |

**User's choice:** Yes — reset button

### Q4: What happens to historical data when a deelgebied is disabled?

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve data, hide in UI (recommended) | Scores stay in store; matrix/spiderweb/prognose exclude the deelgebied. Reactivating restores scores. | ✓ |
| Soft-delete with warning | Same, but show a warning tooltip. | |

**User's choice:** Preserve data, hide in UI (recommended)

---

## Prognose bij inactieve deelgebieden

### Q1: Should the ≥13 voldoende norm adjust when deelgebieden are disabled?

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed norm (keep ≥13 out of all active) | Norm stays '≥13 voldoende', counts only from active deelgebieden. | ✓ |
| Proportional scaling | Threshold scales: if 17 active, threshold = round(13/19 × 17) = 12. | |
| Fixed absolute norm (always 13 of 19) | Always requires 13 of full 19, inactive count as onvoldoende. | |

**User's choice:** Fixed norm (count active only)

### Q2: Should SBC leerlijn thresholds (4/3/5) also recalculate for active deelgebieden?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — exclude inactive from leerlijn count (recommended) | SBC thresholds apply only to active deelgebieden per leerlijn. | ✓ |
| No — leerlijn norms stay fixed | Thresholds stay at 4/3/5; inactive excluded from pool only. | |

**User's choice:** Yes — consistent with main norm decision

### Q3: Should the negatief norm (>6 onvoldoende, >2 per leerlijn) also filter inactive deelgebieden?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — same rule, only active count (recommended) | Consistent: inactive deelgebieden don't contribute to negatief score. | ✓ |
| No — negatief norm stays fixed | All 19 always count for negatief check. | |

**User's choice:** Yes — same rule, only active deelgebieden count

---

## Verzuim drempel scope

### Q1: Should SET-05 also add a new geoorloofd threshold?

| Option | Description | Selected |
|--------|-------------|----------|
| Both: configurable ongeoorloofd + new geoorloofd threshold | Two separate thresholds, both affect tile status. | ✓ |
| Only make existing ongeoorloofd threshold configurable | Just let mentor change the 600-min constant. No geoorloofd. | |
| You decide | Claude picks based on usefulness. | |

**User's choice:** Both — full SET-05 as specified

### Q2: How should thresholds be entered?

| Option | Description | Selected |
|--------|-------------|----------|
| Number inputs in hours (recommended) | Two number inputs in hours; app converts to minutes internally. Defaults: 15u geoorloofd, 10u ongeoorloofd. | ✓ |
| Number inputs in hours + minutes | Hours + minutes fields separately. More precise but more complex. | |

**User's choice:** Number inputs in hours (recommended)

---

## BPV-uren locatie

### Q1: Where should BPV-uren progress appear?

| Option | Description | Selected |
|--------|-------------|----------|
| DetailWeergave only (per student) | New section in student detail view. Similar to VerzuimSection. | ✓ |
| KlasOverzicht tile + DetailWeergave | Small BPV indicator on class tiles + detail section. | |
| DetailWeergave only, but only if BPV hours are in PDF | Show only when data is available. | |

**User's choice:** DetailWeergave only

### Q2: Where do BPV hours come from?

**User's response (free text):** "the bpv uren have a separate excel file"

**Notes:** BPV hours are not in the student PDFs — they come from a separate Excel file. This means the feature requires a new import flow.

### Q3: What should Phase 18 do for SET-06?

| Option | Description | Selected |
|--------|-------------|----------|
| Settings only: configure expected total BPV-uren | Config input only; import deferred. | |
| Full feature: settings config + BPV Excel import | Both the expected-uren setting AND a new BPV Excel import flow. | ✓ |
| Defer BPV entirely to Phase 19+ | Skip SET-06; placeholder stays. | |

**User's choice:** Full feature — settings config + BPV Excel import + progress in DetailWeergave

### Q4: What format is the BPV Excel?

**User's response (free text):** "i will hand the excel file, ask for it when you start with the parser"

**Notes:** Format is unknown at planning time. The researcher/implementer must ask the user to provide a sample BPV Excel file when building the parser. Do not guess the format.

---

## Claude's Discretion

- Exact table CSS for 19-row deelgebieden table (reuse `.ap-row` / `.dg-matrix` vs new classes)
- Whether to debounce inline naam input or apply on blur only
- BPV section header text and progress bar styling in DetailWeergave
- Default expected BPV-uren value (propose in planning)

## Deferred Ideas

None — discussion stayed within phase scope.
