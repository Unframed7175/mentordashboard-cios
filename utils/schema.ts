// Domain constants: actual school deelgebieden (BJ2) + score normalization
// All exported as named ES module exports (TypeScript migration from schema.js)

export const SCORE_LEVELS = ['onvoldoende', 'voldoende', 'goed', 'excellent'] as const;
export type ScoreLevel = typeof SCORE_LEVELS[number];

export interface Deelgebied {
  id: string;
  label: string;
  group: 'lesgeven' | 'organiseren' | 'prof_handelen';
}

// 19 deelgebieden — B02 definitieve leerlijn mapping (B02_definitief.xlsx v1.0)
// group = leerlijn: 'lesgeven' | 'organiseren' | 'prof_handelen'
export const DEELGEBIEDEN: Deelgebied[] = [
  { id: 'va',   label: 'V&A',  group: 'lesgeven' },     // Voorbereiden en afstemmen
  { id: 'mm',   label: 'M&M',  group: 'lesgeven' },     // Materialen en middelen inzetten
  { id: 'ins',  label: 'INS',  group: 'lesgeven' },     // Presenteren en instrueren
  { id: 'odw',  label: 'O&DW', group: 'lesgeven' },     // Organiseren en didactische werkvormen
  { id: 'cb',   label: 'C&B',  group: 'lesgeven' },     // Coachen en begeleiden
  { id: 'eb1',  label: '1E&B', group: 'lesgeven' },     // Evalueren en bijstellen
  { id: 'po',   label: 'P&O',  group: 'organiseren' },  // Plannen en organiseren
  { id: 'so',   label: 'S&O',  group: 'organiseren' },  // Samenwerken en overleggen
  { id: 'org',  label: 'ORG',  group: 'organiseren' },  // Plan uitvoeren en bewaken
  { id: 'ib',   label: 'I&B',  group: 'organiseren' },  // Begeleiden en instrueren
  { id: 'eb2',  label: '2E&B', group: 'organiseren' },  // Evalueren en bijstellen
  { id: 'prco', label: 'PrCo', group: 'prof_handelen' }, // Professioneel communiceren
  { id: 'vsk',  label: 'VSK',  group: 'prof_handelen' }, // Veilig sportklimaat
  { id: 'lob',  label: 'LOB',  group: 'prof_handelen' }, // Loopbaanontwikkeling
  { id: 'info', label: 'INFO', group: 'prof_handelen' }, // Informatievaardigheden
  { id: 'desk', label: 'DESK', group: 'prof_handelen' }, // Deskundigheid en professionaliteit
  { id: 'bs',   label: 'BS',   group: 'prof_handelen' }, // Burgerschapsvaardigheden
  { id: 'tow',  label: 'TOW',  group: 'prof_handelen' }, // Trends en ontwikkelingen volgen
  { id: 'bh',   label: 'BH',   group: 'prof_handelen' }, // BeroepsHouding
];

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
