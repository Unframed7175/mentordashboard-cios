// utils/trajectNormalisatie.ts — Shared tri-state/enum normalizers for traject fields (M42 T8)
//
// Relocated from src/components/TrajectVeldenSection.tsx (normalizeTriState, WVO-traject)
// and src/components/RoosendaalTrajectSection.tsx (normalizeRoosendaalTraject) — both were
// unexported, module-private functions inside UI component files. utils/prognosis.ts (a pure-
// logic engine file, M42 T8's berekenBj1Uitkomst reads student.wvoTraject via
// normalizeTriState per D9) must NOT import from a src/components/*.tsx file — that would
// invert the app's layering (components depend on utils, never the reverse).
//
// Both normalizers were relocated in one pass (not just the WVO one T8 strictly needs):
// T9c will need normalizeRoosendaalTraject for the exact same reason shortly after T8 lands,
// and both are one-liners sharing the same "undefined ≡ null" shape — moving both now means
// T9c's brief doesn't need to touch a file T8 just created for an unrelated one-line addition.
// See task-T8-report.md for this documented judgment call.

/** undefined (never set) is treated identically to null ("nog niet ingevuld"). */
export function normalizeTriState(raw: any): boolean | null {
  return raw === true || raw === false ? raw : null;
}

/** undefined (never set) is treated identically to null ("nog niet gekozen"). */
export function normalizeRoosendaalTraject(raw: any): 'sbl' | 'sbc' | null {
  return raw === 'sbl' || raw === 'sbc' ? raw : null;
}
