## Features Research — v2.4

**Domain:** Tauri 2 desktop app — Dutch MBO mentor dashboard (CIOS Zuidwest-NL)
**Researched:** 2026-05-28
**Milestone:** v2.4 — BPV column matchers, keuzedelen, R&N on tiles, non-empty class deletion, UI polish
**Confidence:** HIGH for deletion UX (well-established desktop patterns), MEDIUM for keuzedelen UX (no direct comparator — similar to checklist-per-record patterns in school tools), HIGH for R&N tile badge (follows existing score-telling pattern already in the codebase)

---

## Context: Existing Codebase Constraints

These are facts from reading the source — not assumptions:

- `LeerlingTegel.tsx` receives `student: StudentProps` (naam, leerlingId, verzuim) and `status: StatusResult`. It does NOT receive the full `StudentRecord` — any new badge data must either be passed as a new prop or computed inside `KlasOverzicht` (which builds the status/trend maps).
- `DetailWeergave.tsx` section order: DoortstroomPrognoseSection → RekenenNederlandsSection → FeedbackActiepuntenSection → SpiderChartCard row → DeelgebiedenMatrix → VerzuimSection → BpvProgressSection. The `FeedbackActiepuntenSection` is currently third from top; requirement is to move it to after `BpvProgressSection`.
- `FeedbackActiepuntenSection` follows the inline-edit-list pattern (add/edit/remove rows, each row has subject + date + status badge). Keuzedelen will be a simpler variant of this pattern with only name + checkbox.
- `StudentRecord` in `datamodel.ts` has `rekenResultaat` and `nederlandsResultaat` as `string | null` (`'3F' | '2F' | '1F' | null`). `normalizeRekenScore()` converts these to `'goed' | 'voldoende' | 'onvoldoende' | null`. This is what the tile badge will use.
- `deleteKlas()` in `utils/klassen.ts` already performs the deletion and switches to remaining class. Only the guard in `App.tsx` line 156 (`canDelete: students.length === 0`) and the `canDelete` prop on `KlasTabStrip` need to change.
- `handleDeleteKlas` in `App.tsx` already uses `window.confirm()` for the empty-class case. For non-empty classes this must be upgraded to a proper confirmation modal with a checkbox.
- `KlasTabStrip.tsx` logo: `height: '36px'` → requirement is 2x = `72px`. Nav banner height is currently set by CSS `#main-nav`.
- `SpiderChartCard` SVG size is currently unknown — need to find and double it.

---

## Feature 1: BPV Real Column Matchers

### What It Is

The `parseBpvExcel()` function in `utils/bpv.ts` returns stubs (gerealiseerdeUren always 0). The real SomToday BPV Excel export has been received; the task is to identify the actual column name for "gerealiseerde uren" and write a real matcher.

### Table Stakes

| Requirement | Complexity | Notes |
|-------------|------------|-------|
| Identify exact column name(s) from real file | LOW | Read the file headers once; hardcode the match candidates |
| Fuzzy match: case-insensitive, trimmed, includes-based | LOW | Same `findCol()` pattern already used in the verzuim parser |
| Join on studentnummer (primary) or naam (fallback) | LOW | `normalizeNaam()` pattern already exists in `utils/datamodel.ts` |
| Graceful fallback to 0 when column absent | LOW | Already the behavior; just fix the "always 0" path |
| Debug logging of unrecognized columns | LOW | `console.log` on import; helps future column drift detection |

### Out of Scope

- Discovering new columns (organisatie, startdatum) in the same pass — only gerealiseerdeUren is the blocker. Other BPV fields can wait for a separate phase if the real file shows them.
- Making the column mapping configurable in Settings — not needed; column names are fixed per SomToday version.

### UX Pattern

No new UX. This is a parser fix. `BpvProgressSection` already shows the progress bar; it just starts showing real numbers instead of 0/0.

---

## Feature 2: Keuzedelen Tracking

### What It Is

Per leerling: een vrije lijst van keuzedelen (naam als vrije tekst + on-track vinkje). Mentoren voegen handmatig toe, bewerken en verwijderen. Vergelijkbaar met hoe `FeedbackActiepuntenSection` werkt maar veel eenvoudiger.

### Dutch MBO Context

Keuzedelen zijn verplichte extra vakken in het MBO-curriculum (Wet educatie en beroepsonderwijs art. 7.2.2). Een student moet een bepaald aantal keuzedelen afronden naast het basisdeel. De mentor wil per leerling bijhouden welke keuzedelen zijn ingepland en of ze op schema liggen. Er is geen standaard digitaal systeem voor op dit schaalniveau — mentoren houden dit bij in notitieboekjes of Excel. Deze app vult die leemte.

### Table Stakes

| Requirement | Why Expected | Complexity | Notes |
|-------------|--------------|------------|-------|
| Vrije tekst naam per keuzedeel | Keuzedelen variëren per student en instelling | LOW | `<input type="text" maxLength={100}>` |
| On-track checkbox (ja/nee) | Core tracking boolean — is de leerling op schema? | LOW | `<input type="checkbox">` with label "Op schema" |
| Meerdere keuzedelen per leerling | Een student heeft typisch 1–4 keuzedelen | LOW | Array, same as actiepunten |
| Toevoegen + verwijderen | Minimale CRUD | LOW | + knop + × per rij |
| Bewerken van naam (inline edit) | Tikfouten corrigeren | LOW | Click-to-edit on the name field |
| Persist via saveKlassen() | Must survive app restart | LOW | Same save pattern as actiepunten |
| Toon in DetailWeergave als aparte sectie | Mentor ziet alle data voor het gesprek | LOW | New `KeuzedelenSection.tsx` |

### Data Model

New field on `StudentRecord`:

```typescript
interface Keuzedeel {
  id: string;           // crypto.randomUUID() or Date.now fallback
  naam: string;         // vrije tekst, max 100 chars
  onTrack: boolean;     // op schema ja/nee
}

// On StudentRecord:
keuzedelen?: Keuzedeel[];
```

Storage: same as actiepunten — stored on the most-recent record per leerlingId, persisted via `saveKlassen()`. Because keuzedelen are student-level (not period-level), writes must update ALL records for the student (same `for (const rec of matching)` pattern as `RekenenNederlandsSection`).

### UX Pattern: Inline Checklist

The closest existing pattern in this app is `FeedbackActiepuntenSection`. Keuzedelen is simpler: no date field, no status dropdown — just a name and a checkbox.

Recommended interaction model (derived from analyzing `FeedbackActiepuntenSection`):

```
┌─ Keuzedelen ──────────────────────────────────────────┐
│  [x] Sport & Bewegen Basis                    [×]     │
│  [ ] Sportcoach niveau 2                      [×]     │
│  [ ] Schoolsport                              [×]     │
│                                                       │
│  [+ Keuzedeel toevoegen]                              │
└───────────────────────────────────────────────────────┘
```

On "+ Keuzedeel toevoegen": shows an inline text input + checkbox + "Opslaan" button (same form pattern as actiepunten). The name input auto-focuses. Pressing Enter saves. Pressing Escape cancels.

Toggling the checkbox saves immediately (no separate save button) — this follows the `RekenenNederlandsSection` pattern where select changes auto-save. The checkbox toggle is a single-field change; immediate save is the correct UX for boolean toggles in this app.

The delete (×) button deletes immediately after a brief confirmation — or no confirmation at all, since a keuzedeel can be re-added trivially. Per the existing actiepunten pattern: immediate delete (no confirm), consistent with how lightweight the data is.

### Differentiators (optional, not blocking)

| Feature | Value | Complexity |
|---------|-------|------------|
| Count badge on section header ("3 keuzedelen, 2 op schema") | Quick scan for mentor | LOW |
| Show keuzedelen count in DetailWeergave breadcrumb (not on tile — already crowded) | Quick reference | LOW |

### Anti-Features (do NOT build)

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Keuzedelen badge op klasoverzicht-tegel | Tegel is al vol (naam, status, score-telling, verzuimbalk); R&N badge is al een nieuwe toevoeging — keuzedelen op de tegel is overkill |
| Koppeling met keuzedelen-catalogus | Er is geen standaard MBO keuzedelencatalogus die we kunnen koppelen; vrije tekst is de juiste keuze |
| Verplicht aantal keuzedelen instellen + voortgangsbalk | Doorstroomnorm voor keuzedelen is schoolspecifiek en niet in scope — dit is tracking, niet normering |
| Status dropdown (open/lopend/afgerond) | Checkbox is voldoende; meer statussen zijn overkill voor een bullet-level tracking tool |

### Placement in DetailWeergave

Na `RekenenNederlandsSection`, vóór `FeedbackActiepuntenSection`. Rationale: keuzedelen zijn curriculumdata (net als R&N), niet een actiepunt vanuit het gesprek. De logische volgorde is: prognose → R&N → keuzedelen → feedback actiepunten → spider → matrix → verzuim → BPV.

---

## Feature 3: R&N Status on Klasoverzicht Tiles

### What It Is

Toon een compacte Rekenen/Nederlands badge op de `LeerlingTegel` in het klasoverzicht. Geeft de mentor direct inzicht in wie problemen heeft met R&N zonder de detailweergave te openen.

### Data Available

`getActiveStudents()` returns a deduplicated student array. Each student has `rekenResultaat` and `nederlandsResultaat` as `string | null`. `normalizeRekenScore()` maps these to `'goed' | 'voldoende' | 'onvoldoende' | null`.

`null` = niet ingevuld. Badge is only meaningful when at least one field is non-null.

### Table Stakes

| Requirement | Why Expected | Complexity | Notes |
|-------------|--------------|------------|-------|
| Badge tonen wanneer R en/of N onvoldoende | Mentoren willen problemen direct zien | LOW | Rode badge, compact |
| Badge verbergen wanneer beide null | Geen data = geen verwarring | LOW | Conditional render |
| Badge verbergen wanneer beide voldoende/goed | Tegel is al druk; groen = goed nieuws = geen actie vereist | LOW | Only show on problematic status |
| Tegel behoudt bestaande structuur | naam, status-badge, score-telling, verzuimbalk moeten intact blijven | LOW | Add badge between score-telling and miniBar |

### Recommended Badge Design

```
[R!]  — rekenen onvoldoende (rode achtergrond)
[N!]  — nederlands onvoldoende (rode achtergrond)
[R! N!] — beide onvoldoende
```

Compact tekst, 0.7rem, rood/oranje afhankelijk van ernst. Geen badge bij voldoende/goed — de tegel is al druk.

Alternative: show only when `onvoldoende` (never show voldoende/goed on tile) — this keeps tiles clean. The detail view shows the full status. This is the right default.

### Passing R&N Data to the Tile

Two options:

**Option A — Pass as prop:** `KlasOverzicht` already reads student data and builds `statusMap` + `trendMap`. Add a `rnMap: Map<string, {reken: string|null, nl: string|null}>` in the same `useMemo`. Pass to `LeerlingTegel` as `rnStatus` prop. `LeerlingTegel` renders the badge.

**Option B — Pass full student:** `LeerlingTegel` already receives `student: StudentProps` — extend `StudentProps` to include `rekenResultaat` and `nederlandsResultaat`. No extra map needed.

Recommendation: **Option B** — extend `StudentProps` inline (the component already has a note "intentionally kept inline per IN-01 review guidance"). This avoids a new map and keeps the badge logic inside the component where the rendering lives.

### Out of Scope

- R&N on the KPI strip — the strip already has Op schema / Let op / Risico / Verzuim / Onbekend. Adding R&N counts there requires design decisions that are out of scope for v2.4.
- Sortable by R&N status in the klasoverzicht toolbar — not requested.

---

## Feature 4: Non-Empty Class Deletion

### What It Is

Currently `canDelete` is `students.length === 0` — the × button only appears on empty classes. The requirement is to allow deletion of any class with a safety checkbox confirmation.

### Destructive Deletion UX Patterns in Desktop Apps

Standard patterns across desktop and professional web apps (Notion, VS Code, GitHub, Figma, macOS):

**Level 1 — Single confirmation dialog (window.confirm):**
Used for: reversible or low-stakes operations. The current empty-class deletion already uses this. Not appropriate for non-empty classes because data loss is irreversible.

**Level 2 — Modal with checkbox:**
Used for: irreversible operations with significant data loss (GitHub repo deletion, VS Code workspace deletion). The modal:
- Names what will be deleted (class name + student count)
- Explains consequences explicitly ("alle leerlingdata wordt permanent verwijderd")
- Requires a checkbox: "Ik begrijp dat dit niet ongedaan kan worden gemaakt"
- The delete button is DISABLED until checkbox is checked
- Delete button is styled destructively (red background)
- Cancel is the prominent default / first tab stop

**Level 3 — Type the name to confirm:**
Used for: catastrophic operations (GitHub org deletion, database drop). Overkill for a single class with ~19 students — skip this.

**Recommendation for KLS-DEL:** Level 2 modal with checkbox. This is the correct pattern for irreversible data loss in a single-user desktop app.

### Table Stakes

| Requirement | Why Expected | Complexity | Notes |
|-------------|--------------|------------|-------|
| × button visible on ALL classes (not just empty) | Core requirement | LOW | Remove `canDelete` guard or change to always true |
| Confirmation modal (not window.confirm) | Irreversible operation requires explicit acknowledgment | MEDIUM | New modal component or inline in App.tsx |
| Show class name + student count in modal | User must know exactly what they're deleting | LOW | `klas.naam` + `klas.students.length` |
| Checkbox "Ik begrijp dat dit permanent is" | Industry standard for irreversible deletion | LOW | Disable button until checked |
| Delete button disabled until checkbox checked | Prevents accidental click | LOW | Controlled state in modal |
| Delete button styled red / destructive | Visual signal of danger | LOW | `btn-danger` class or inline style |
| Cancel as the default action / first tab stop | Keyboard users should not accidentally delete | LOW | `autoFocus` on cancel button |
| Navigation after deletion: switch to remaining class | Already handled by `deleteKlas()` | — | No change needed |
| If only one class: after delete, show empty state / import | Already handled by `deleteKlas()` | — | No change needed |

### Modal Content (Dutch, matching app language)

```
Klas "CSD2A" verwijderen

Deze klas heeft 19 leerlingen. Alle leerlingdata, importhistorie en
actiepunten worden permanent verwijderd. Dit kan niet ongedaan worden
gemaakt.

[ ] Ik begrijp dat alle data van klas "CSD2A" permanent wordt verwijderd.

[Annuleren]   [Klas verwijderen]  ← disabled until checkbox
```

### Implementation

The existing `KlasModal.tsx` provides the modal scaffold (overlay + centered card + form). A new `DeleteKlasModal.tsx` follows the same structure. `App.tsx` manages the open/close state, as it already does for `KlasModal` and `FeedbackModal`.

The `canDelete` prop on `KlasTabStrip` becomes always `true` (or is renamed and its logic changed). The × click now opens the confirm modal instead of calling `handleDeleteKlas` directly.

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| window.confirm() for non-empty class | Native dialogs can't be styled; no checkbox support; inconsistent with rest of app |
| "Type the class name" confirmation | Overkill for ~19 students; Level 2 is sufficient |
| Soft delete / undo | AES-256 encrypted store has no undo mechanism; introducing one is a major architecture change |
| Disabling × on active class | User may want to delete the active class; the UI should allow it (deleteKlas already handles switching) |

---

## Feature 5: UI Polish — Spiderweb Bigger + FeedbackActiepunten to Bottom

### What It Is

Two layout changes in `DetailWeergave`:

1. `SpiderChartCard` SVG larger (exact target size to be determined from current SVG dimensions)
2. `FeedbackActiepuntenSection` moved from position 3 (after R&N) to position last (after BPV)

### Table Stakes: Spider Bigger

| Requirement | Complexity | Notes |
|-------------|------------|-------|
| Increase SVG viewBox / width and height | LOW | Find current size in SpiderChartCard.tsx; multiply by ~1.5–2x |
| Ensure three spiders still fit in a row on 1280px | LOW | Check flex layout in `spider-charts-row` |
| Responsive: on smaller screens, stack vertically | LOW | `flexWrap: 'wrap'` already exists in the layout |

### Table Stakes: FeedbackActiepunten to Bottom

| Requirement | Complexity | Notes |
|-------------|------------|-------|
| Move `<FeedbackActiepuntenSection>` to after `<BpvProgressSection>` | LOW | One-line move in DetailWeergave.tsx |
| New section order: Prognose → R&N → Keuzedelen → Spider → Matrix → Verzuim → BPV → Feedback | LOW | Follows logical flow: data first, mentor actions last |
| Print CSS: feedback still appears on print (no print-hidden class on it) | LOW | No change needed — section has no print-specific classes |

Rationale for moving feedback to bottom: mentor actiepunten are action items that result FROM reviewing the data above. Placing them at the bottom reinforces the workflow: read all data → make notes → assign action items. Currently the section appears before the spider/matrix which breaks this flow.

---

## Feature 6: UI Polish — Nav Banner 2x Bigger

### What It Is

Top nav bar (`#main-nav`) and logo (`<img height='36px'>`) scaled up to 2x.

### Table Stakes

| Requirement | Complexity | Notes |
|-------------|------------|-------|
| Logo height: 36px → 72px | LOW | Single inline style change in `KlasTabStrip.tsx` |
| `#main-nav` height adjusts automatically | LOW | Nav uses flex; content height drives container height |
| Tab strip and icon buttons remain vertically centered | LOW | `alignItems: 'center'` already on nav flex container |
| Logo still shows correct src (light/dark variant) | LOW | No change to src logic |
| Print: nav is already hidden (`no-print` class implied by existing CSS) | LOW | Verify `#main-nav` has `display: none` in `@media print` |

### Out of Scope

- Changing the nav layout (tab positions, button order) — just size change
- Adding branding text next to logo — not requested

---

## Feature Dependency Map

```
BPV column matchers (Feature 1)
  — standalone, no dependencies

Keuzedelen (Feature 2)
  — requires: data model extension on StudentRecord
  — no dependency on other v2.4 features

R&N tile badge (Feature 3)
  — requires: extend StudentProps in LeerlingTegel (trivial)
  — data already exists: rekenResultaat/nederlandsResultaat on StudentRecord

Non-empty class deletion (Feature 4)
  — requires: new DeleteKlasModal component
  — App.tsx changes: canDelete logic + modal state

UI: Spider bigger (Feature 5a)
  — standalone, read SpiderChartCard.tsx for current dimensions

UI: FeedbackActiepunten to bottom (Feature 5b)
  — standalone, one-line move in DetailWeergave.tsx

UI: Nav banner 2x (Feature 6)
  — standalone, one inline style change in KlasTabStrip.tsx
```

**No hard dependencies between v2.4 features.** All six can be built in parallel or sequentially in any order.

**Recommended build order (lowest risk first):**
1. UI changes (5a, 5b, 6) — pure layout, zero data risk, quick validation
2. R&N tile badge (3) — read-only display of existing data, no data model change
3. BPV column matchers (1) — parser fix, well-understood impact
4. Keuzedelen (2) — new data model field + new component, highest complexity
5. Non-empty class deletion (4) — destructive operation, test thoroughly last

---

## MVP for v2.4

**All six features are in scope and achievable.** None require architectural changes. Complexity is LOW to MEDIUM across the board.

**Highest risk items:**
- Keuzedelen data model: the `for (const rec of matching)` write pattern must be used (same as RekenenNederlandsSection) to avoid the disconnected-object pitfall documented in DetailWeergave.tsx line 33–44.
- Non-empty class deletion: the confirmation modal must genuinely disable the destructive action until the checkbox is checked — do not allow Enter-key bypass.
- BPV column matchers: depends on the actual column names in the received SomToday file. If the column is not what is expected, the fallback to 0 must still work silently (no error thrown to the user).

**Deferred (not in v2.4):**
- Keuzedelen badge on klasoverzicht tegel (tiles are already information-dense)
- R&N on the KPI strip
- Soft delete / undo for class deletion
