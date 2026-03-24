// Domain constants: actual school deelgebieden (BJ2) + score normalization
// All exported as globals (no ES modules — file:// compat)

const SCORE_LEVELS = ['onvoldoende', 'voldoende', 'goed', 'excellent'];

// 19 deelgebieden — B02 definitieve leerlijn mapping (B02_definitief.xlsx v1.0)
// group = leerlijn: 'lesgeven' | 'organiseren' | 'prof_handelen'
const DEELGEBIEDEN = [
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
