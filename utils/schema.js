// Domain constants: actual school deelgebieden (BJ2) + score normalization
// All exported as globals (no ES modules — file:// compat)

const SCORE_LEVELS = ['onvoldoende', 'voldoende', 'goed', 'excellent'];

// 19 deelgebieden matching the school's Excel template abbreviations
const DEELGEBIEDEN = [
  { id: 'va',   label: 'V&A',  group: 'Vakbekwaamheid' },
  { id: 'mm',   label: 'M&M',  group: 'Vakbekwaamheid' },
  { id: 'ins',  label: 'INS',  group: 'Vakbekwaamheid' },
  { id: 'odw',  label: 'O&DW', group: 'Vakbekwaamheid' },
  { id: 'cb',   label: 'C&B',  group: 'Samenwerking' },
  { id: 'eb1',  label: '1E&B', group: 'Samenwerking' },
  { id: 'po',   label: 'P&O',  group: 'Samenwerking' },
  { id: 'so',   label: 'S&O',  group: 'Samenwerking' },
  { id: 'org',  label: 'ORG',  group: 'Organisatie' },
  { id: 'ib',   label: 'I&B',  group: 'Organisatie' },
  { id: 'eb2',  label: '2E&B', group: 'Organisatie' },
  { id: 'prco', label: 'PrCo', group: 'Communicatie' },
  { id: 'vsk',  label: 'VSK',  group: 'Communicatie' },
  { id: 'lob',  label: 'LOB',  group: 'Loopbaan' },
  { id: 'info', label: 'INFO', group: 'Overig' },
  { id: 'desk', label: 'DESK', group: 'Overig' },
  { id: 'bs',   label: 'BS',   group: 'Overig' },
  { id: 'tow',  label: 'TOW',  group: 'Overig' },
  { id: 'bh',   label: 'BH',   group: 'Overig' },
];

/**
 * Map column headers to deelgebied IDs by exact abbreviation match (case-insensitive).
 */
function detectColumnMapping(headers) {
  const result = {};
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
function normalizeScore(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const u = String(raw).trim().toUpperCase();
  if (u === 'O' || u === 'ONV' || u === 'ONVOLDOENDE') return 'onvoldoende';
  if (u === 'V' || u === 'VOLD' || u === 'VOLDOENDE')  return 'voldoende';
  if (u === 'G' || u === 'GOED')                        return 'goed';
  if (u === 'E' || u === 'EXC' || u === 'EXCELLENT')   return 'excellent';
  return null;
}

window.SCORE_LEVELS        = SCORE_LEVELS;
window.DEELGEBIEDEN        = DEELGEBIEDEN;
window.detectColumnMapping = detectColumnMapping;
window.normalizeScore      = normalizeScore;
