// ---------------------------------------------------------------------------
// src/utils/status.ts — berekenStatus + detectTraject utilities
// Re-implemented from app.js IIFE private functions (lines 1193-1245).
// Every Wave 1 and Wave 2 component depends on berekenStatus() for tile RAG
// colours, sort ordering, and KPI strip calculations.
// ---------------------------------------------------------------------------

import { berekenPrognose } from '../../utils/prognosis';
import { getVerzuimDrempelsSync } from '../../utils/verzuimDrempels';
import { aggregateKdStatus } from '../../utils/keuzedelen';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Sort priority for STATUS_VOLGORDE: lower number = shown first.
 * Consumed by KlasOverzicht and LeerlingTegel for sort ordering.
 */
export const STATUS_VOLGORDE: Record<string, number> = {
  rood:   0,
  oranje: 1,
  groen:  2,
  paars:  3,
  blauw:  4,
  grijs:  5,
};

/**
 * RAG border colours (hex) for each status kleur.
 * Consumed by LeerlingTegel for tile border styling.
 */
export const RAG_BORDER: Record<string, string> = {
  groen:  '#22c55e',
  oranje: '#f97316',
  rood:   '#ef4444',
  grijs:  '#d1d5db',
  blauw:  '#3b82f6',
  paars:  '#7c3aed',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StatusKleur = 'groen' | 'oranje' | 'rood' | 'blauw' | 'paars' | 'grijs';

export interface StatusResult {
  kleur:    StatusKleur;
  label:    string;
  prognose: any;
}

// ---------------------------------------------------------------------------
// detectTraject
// ---------------------------------------------------------------------------

/**
 * Detects BJ1 or BJ2 traject from a student record.
 *
 * Periode is leading; leerjaar is only used as fallback when periode matches
 * nothing. Falls back to 'bj2' with a console.warn on uncertain input.
 *
 * Pattern arrays are identical to app.js lines 1198-1207.
 */
export function detectTraject(student: any): string {
  const periode  = String(student.periode  || '').toLowerCase();
  const leerjaar = String(student.leerjaar || '').trim();

  // BJ1 variants found in real PDF imports (app.js line 1198)
  const bj1Patterns = ['bj1', '1e jaar', 'jaar 1', 'leerjaar 1', 'bj 1', 'klas 1'];
  const matchesBJ1 = bj1Patterns.some((p) => periode.indexOf(p) !== -1);

  // BJ2 variants — explicit match gives certainty (app.js line 1204)
  const bj2Patterns = ['bj2', '2e jaar', 'jaar 2', 'leerjaar 2', 'bj 2', 'klas 2'];
  const matchesBJ2 = bj2Patterns.some((p) => periode.indexOf(p) !== -1);

  // Periode is leading
  if (matchesBJ1) return 'bj1';
  if (matchesBJ2) return 'bj2';

  // Only use leerjaar as fallback when periode matches nothing
  if (leerjaar === '1') return 'bj1';
  if (leerjaar === '2') return 'bj2';

  // Uncertain — log warning and fall back to bj2 (current default)
  console.warn(
    '[detectTraject] Onzeker traject voor student:',
    (student && student.naam) || '(onbekend)',
    '— valt terug op bj2',
  );
  return 'bj2';
}

// ---------------------------------------------------------------------------
// berekenStatus
// ---------------------------------------------------------------------------

/**
 * Calculates the RAG status for a student.
 *
 * Return chain is identical to app.js lines 1228-1238:
 *   1. No scores → grijs / Onbekend
 *   2. negatief prognose → rood / Risico
 *   3. neutraal prognose → oranje / Let op
 *   4. ongeoorloofd > 600 min → oranje / Verzuim
 *   5. sbc → paars / Profieljaar SBC
 *   6. sbl → groen / Op koers
 *   7. versneld_sbc → paars / Versneld SBC
 *   8. naar_bj2 → groen / Op koers BJ2
 *   9. fallback → groen / Op koers
 *
 * @param student  Student record (from klassenState)
 * @param traject  Optional traject override; if not provided, detectTraject() is used
 */
export function berekenStatus(student: any, traject?: string, thresholds?: { geoorloofd: number; ongeoorloofd: number }): StatusResult {
  const effectiveTraject = traject ?? detectTraject(student);
  const p = berekenPrognose(student, effectiveTraject);
  const ongeoorloofd = student.verzuim?.ongeoorloofd ?? 0;
  const geoorloofd   = student.verzuim?.geoorloofd ?? 0;
  const heeftScores  = p.totaalVoldoendeOfHoger + p.totaalOnvoldoende > 0;
  const resolvedThresholds = thresholds ?? getVerzuimDrempelsSync();
  const keuzedelen = Array.isArray(student.keuzedelen) ? student.keuzedelen : [];
  const kdStatus = keuzedelen.length > 0
    ? aggregateKdStatus(keuzedelen)
    : (student.kdStatus ?? null);

  if (!heeftScores)                return { kleur: 'grijs',  label: 'Onbekend',        prognose: p };
  if (p.label === 'negatief')      return { kleur: 'rood',   label: 'Risico',          prognose: p };
  if (p.label === 'neutraal')      return { kleur: 'oranje', label: 'Let op',          prognose: p };
  if (ongeoorloofd > resolvedThresholds.ongeoorloofd || geoorloofd > resolvedThresholds.geoorloofd)
                                   return { kleur: 'oranje', label: 'Verzuim',         prognose: p };
  // BJ2 outcomes
  if (p.label === 'sbc') {
    if (kdStatus === 'niet_behaald' || kdStatus === 'haalbaar')
      return { kleur: 'oranje', label: 'Let op — KD',      prognose: p };
    return                     { kleur: 'paars',  label: 'Profieljaar SBC', prognose: p };
  }
  if (p.label === 'sbl')
    return                     { kleur: 'groen',  label: 'Op koers',        prognose: p };
  // BJ1 outcomes
  if (p.label === 'versneld_sbc') {
    if (kdStatus === 'niet_behaald' || kdStatus === 'haalbaar')
      return { kleur: 'oranje', label: 'Let op — KD',      prognose: p };
    return                     { kleur: 'paars',  label: 'Versneld SBC',    prognose: p };
  }
  if (p.label === 'naar_bj2') {
    if (kdStatus === 'niet_behaald')
      return { kleur: 'oranje', label: 'Let op — KD',      prognose: p };
    return                     { kleur: 'groen',  label: 'Op koers BJ2',    prognose: p };
  }
  return                                  { kleur: 'groen',  label: 'Op koers',        prognose: p };
}
