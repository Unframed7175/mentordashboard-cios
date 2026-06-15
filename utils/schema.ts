// Domain constants: actual school deelgebieden (BJ2) + score normalization
// All exported as named ES module exports (TypeScript migration from schema.js)

import leerlijn from '../src/config/leerlijn.json';

export const SCORE_LEVELS = ['onvoldoende', 'voldoende', 'goed', 'excellent'] as const;
export type ScoreLevel = typeof SCORE_LEVELS[number];

export interface Deelgebied {
  id: string;
  label: string;
  group: 'lesgeven' | 'organiseren' | 'prof_handelen';
}

// Loaded from src/config/leerlijn.json — edit that file to update the schema without code changes
export const DEELGEBIEDEN: Deelgebied[] = leerlijn.deelgebieden as Deelgebied[];

/**
 * Map column headers to deelgebied IDs by exact abbreviation match (case-insensitive).
 */
export function detectColumnMapping(headers: string[]): Record<string, { mappedTo: string | null; confidence: string }> {
  const result: Record<string, { mappedTo: string | null; confidence: string }> = {};
  for (const dg of DEELGEBIEDEN) {
    const match = headers.find(h => String(h).trim().toUpperCase() === dg.label.toUpperCase());
    result[dg.id] = { mappedTo: match ?? null, confidence: match ? 'auto' : 'manual' };
  }
  return result;
}

/**
 * Normalize a raw score cell value to one of the four canonical levels.
 * Handles single letters (O/V/G/E) and full Dutch words.
 */
export function normalizeScore(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const u = String(raw).trim().toUpperCase();
  if (u === 'O' || u === 'ONV' || u === 'ONVOLDOENDE') return 'onvoldoende';
  if (u === 'V' || u === 'VOLD' || u === 'VOLDOENDE')  return 'voldoende';
  if (u === 'G' || u === 'GOED')                        return 'goed';
  if (u === 'E' || u === 'EXC' || u === 'EXCELLENT')   return 'excellent';
  return null;
}

/**
 * Normalize a Rekenen or Nederlands result to a canonical pass/fail status.
 * MBO-3 national norm: 2F = voldoende, below 2F = onvoldoende, 3F = goed.
 * Returns 'goed' | 'voldoende' | 'onvoldoende' | null
 */
export function normalizeRekenScore(raw: unknown): 'goed' | 'voldoende' | 'onvoldoende' | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const u = String(raw).trim().toLowerCase();
  if (u === '3f' || u === 'goed' || u === 'g')                          return 'goed';
  if (u === '2f' || u === 'voldoende' || u === 'v')                     return 'voldoende';
  if (u === '1f' || u === 'onvoldoende' || u === 'o' || u === 'onv')    return 'onvoldoende';
  // Numeric grade (999.9): ≥5.5 → voldoende, <5.5 → onvoldoende
  const n = typeof raw === 'number' ? raw : parseFloat(u);
  if (!isNaN(n)) return n >= 5.5 ? 'voldoende' : 'onvoldoende';
  return null;
}

/**
 * Berekent het Nederlands-eindcijfer op basis van 4 onderdelen.
 * Formule: (lezen + spreken + gesprekvoeren + schrijven) / 2
 * Geeft null terug als een of meer onderdelen ontbreken.
 */
export function berekenNederlandsEindcijfer(
  nlLezen: string | null | undefined,
  nlSpreken: string | null | undefined,
  nlGesprekvoeren: string | null | undefined,
  nlSchrijven: string | null | undefined,
): number | null {
  const lezen = parseFloat(nlLezen ?? '');
  const spreken = parseFloat(nlSpreken ?? '');
  const gesprekvoeren = parseFloat(nlGesprekvoeren ?? '');
  const schrijven = parseFloat(nlSchrijven ?? '');
  if (isNaN(lezen) || isNaN(spreken) || isNaN(gesprekvoeren) || isNaN(schrijven)) return null;
  return (lezen + spreken + gesprekvoeren + schrijven) / 2;
}
