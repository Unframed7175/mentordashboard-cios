# Phase 16: Auto-class Detection - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

When no students are in the active class, auto-detect the class name from the
first imported PDF's header fields and create the class automatically — so
mentors skip the "create class first" step on fresh installs and empty-class
scenarios.

</domain>

<decisions>
## Implementation Decisions

### Class Name Source (D-01)
- **D-01:** Combine `leerjaar` + `periode` from the PDF header as the auto-detected
  class name. Format: `"{leerjaar} {periode}"`, e.g. `"2024-2025 BJ2 Fase 2 DD"`.
  If either field is empty, use whichever is available; if both are empty, fall back
  to `"Nieuwe klas"`.

### Trigger Condition (D-02)
- **D-02:** Auto-class detection fires whenever the active class has zero students.
  This covers: (a) fresh install with no klassen at all, and (b) a class that was
  created but never had files imported. When zero students, auto-detect and
  auto-create before processing the import batch.

### Multiple Periods in One Drop (D-03)
- **D-03:** All dropped PDFs — regardless of their `periode` value — are imported
  into the single auto-created class. The class name is derived from the **first**
  PDF in the drop. All periods contribute data to this one class. Mentor can
  rename the class afterward.

### User Confirmation (D-04)
- **D-04:** After auto-creation, show a **toast notification** (non-blocking):
  `"Klas aangemaakt: {naam}"`. Import continues immediately. No dialog or
  confirmation step — preserves zero-friction goal.

### Claude's Discretion
- Toast display duration, animation, and placement (top-right or bottom-center)
- Exact deduplication logic when `createKlas` returns `{ error: 'duplicate' }` —
  can reuse the existing class if the name already matches
- Whether to update `ImportPage`'s existing error-state path or intercept earlier
  in the PDF batch loop

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Import Flow
- `src/components/ImportPage.tsx` — current import flow; the `handlePDFs()` function
  is where the `activeKlasId === null` guard lives (line ~40); auto-detect hooks in here
- `utils/klassen.ts` — `createKlas(naam)`, `switchActiveKlas(id)`, `klassenState`;
  `createKlas` is already async and handles duplicates via `{ error: 'duplicate' }`

### PDF Parser
- `parsers/pdf.ts` — `extractHeader()` function returns `{ naam, leerlingId, periode, leerjaar }`;
  `parseSinglePDF()` returns a full result object with these header fields

### Requirements
- `.planning/REQUIREMENTS.md` — ACD-01 is the sole requirement for this phase

### Roadmap
- `.planning/ROADMAP.md` — Phase 16 success criteria (4 criteria)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createKlas(naam: string)` in `utils/klassen.ts` — creates, persists, and activates
  a new class in one call; returns `{ error: 'duplicate' }` on name collision
- `parseSinglePDF(file)` in `parsers/pdf.ts` — already called in `handlePDFs()`;
  result.periode and result.leerjaar are available after parsing the first file
- `klassenState.activeKlasId` and the student list — used to detect "zero students
  in active class" condition without a separate API call

### Established Patterns
- `handlePDFs()` processes files sequentially in a for-loop; auto-detect can parse
  the first file to get header fields, then create the class before the loop runs
- Toast UI doesn't exist yet — will need a minimal implementation (CSS + React state)
  or a brief inline notification in ImportPage's status area

### Integration Points
- `ImportPage.tsx → handlePDFs()`: primary integration point; add the
  "no students → auto-detect → createKlas → then proceed" check at the top
- `KlasTabStrip` will reflect the new class automatically since it reads `klassenState`
  via `refreshKey`

</code_context>

<specifics>
## Specific Ideas

- Class name format: `"{leerjaar} {periode}"` — e.g. `"2024-2025 BJ2 Fase 2 DD"`
- Toast message: `"Klas aangemaakt: {naam}"` in Dutch
- All PDFs from a multi-period drop go into one class named after the first PDF

</specifics>

<deferred>
## Deferred Ideas

- Settings to configure what field is used for class name detection (leerjaar vs
  periode vs custom) — belongs in Phase 18 (Settings Panel Advanced)
- Auto-grouping PDFs by periode into separate classes — too complex for v2.1, future phase

</deferred>

---

*Phase: 16-auto-class-detection*
*Context gathered: 2026-05-17*
