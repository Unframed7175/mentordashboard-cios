---
status: resolved
slug: kpi-strip-not-working
trigger: "KPI statistics (Op schema / Risico / Verzuim count) in KlasOverzicht tile overview show wrong values or zero"
created: 2026-05-17T00:00:00Z
updated: 2026-05-17T00:00:00Z
---

## Symptoms

- **Expected:** KPI strip shows correct counts: Op schema (groen+blauw students), Risico (rood), Verzuim (oranje+Verzuim label), % op schema
- **Actual:** Statistics are not working / showing wrong values
- **Reproduction:** Import student PDFs, view KlasOverzicht, check KPI numbers at top

## Current Focus

hypothesis: RESOLVED
next_action: n/a
test: n/a
expecting: n/a

## Evidence

- timestamp: 2026-05-17T00:00:00Z
  what: Traced berekenStatus() return chain — grijs returned when heeftScores=false (totaalVoldoendeOfHoger + totaalOnvoldoende === 0)
  file: src/utils/status.ts:119-121
  conclusion: Students with all-null deelgebiedScores → grijs; also students with only null scores

- timestamp: 2026-05-17T00:00:00Z
  what: KPI formula used allStudents.length as denominator for pctOpSchema
  file: src/components/KlasOverzicht.tsx:40 (old)
  conclusion: grijs students pulled pctOpSchema toward 0% even when opSchemaCount was valid

- timestamp: 2026-05-17T00:00:00Z
  what: useMemo dependency [allStudents] — getActiveStudents() returns new array reference every call
  file: src/components/KlasOverzicht.tsx:28-33 (old)
  conclusion: useMemo never memoized; rebuilt statusMap on every keystroke in zoekTerm

- timestamp: 2026-05-17T00:00:00Z
  what: "Let op" (oranje/neutraal) students counted in no KPI category
  file: src/components/KlasOverzicht.tsx:37-39 (old)
  conclusion: Mid-year students with 8-12 voldoendes showed 0%/0/0 making KPI appear broken

## Eliminated

- CSS hiding the KPI strip: No, strip renders correctly with allStudents.length > 0 guard
- statusMap.get() returning undefined: No, map built from same allStudents array
- leerlingId undefined crash: No, parseSinglePDF sets leerlingId: header.leerlingId || ''
- Race condition after import: No, addStudent() mutates klassenState synchronously

## Resolution

root_cause: Three bugs: (1) pctOpSchema divided by all students including grijs — shows 0% when students have no/few scores; (2) useMemo dependency [allStudents] always unstable (new array ref per call); (3) "Let op" (oranje/neutraal) students appeared in none of the 3 KPI tiles making the strip look empty for typical mid-year classes
fix: (1) pctOpSchema now divides by scoredCount (allStudents.length - grijsCount) and shows "--" when no scored students exist; (2) useMemo now depends on [refreshKey, allStudents.length] — stable deps that only change on import/switch; (3) Added "Let op" KPI tile and conditional "Onbekend" tile; all KPI counts now computed from statusMap.values() directly
verification: tsc --noEmit passes (only pre-existing error in DoortstroomPrognoseSection.tsx unrelated); all 8 status.test.ts tests pass
files_changed: src/components/KlasOverzicht.tsx
