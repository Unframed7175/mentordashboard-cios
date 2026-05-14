// parsers/excel.ts — Excel verzuim parser
// Reads Dutch school absence Excel exports (.xls/.xlsx) via SheetJS (XLSX npm import)
// Tested against SomToday / ParnasSys "Totaaloverzicht Verzuim" export format.

import * as XLSX from 'xlsx';
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';

// Registreer cpexcel bij module load voor correcte Nederlandse tekens (cp1252)
XLSX.set_cptable((cpexcel as any).cptable);

/**
 * Parse a Dutch time string in the format "107u24m" to total minutes.
 * Also handles plain integers and "HH:MM" strings.
 */
export function parseVerzuimTime(str: unknown): number {
  if (str === null || str === undefined || str === '') return 0;
  if (typeof str === 'number') return Math.round(str);
  const s = String(str).trim();
  if (!s) return 0;
  const m1 = s.match(/^(\d+)u(\d+)m$/i);
  if (m1) return parseInt(m1[1], 10) * 60 + parseInt(m1[2], 10);
  const m2 = s.match(/^(\d+):(\d+)/);
  if (m2) return parseInt(m2[1], 10) * 60 + parseInt(m2[2], 10);
  const n = parseInt(s, 10);
  if (!isNaN(n)) return n;
  return 0;
}

/**
 * Debug helper: dump all raw rows from an Excel file to the console.
 * Usage: await debugExcelBestand(file)
 */
export async function debugExcelBestand(file: File): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  console.group('=== debugExcelBestand: ' + file.name + ' ===');
  console.log('Werkbladen:', wb.SheetNames);
  wb.SheetNames.forEach(function(name: string) {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.group('Werkblad: "' + name + '" (' + rows.length + ' rijen)');
    rows.slice(0, 10).forEach(function(r: any, i: number) { console.log('Rij ' + i + ':', r); });
    console.groupEnd();
  });
  console.groupEnd();
}

/**
 * Parse an Excel verzuim file and return structured absence records.
 *
 * Supports SomToday "Totaaloverzicht Verzuim" export with columns:
 *   Studentnummer, Roepnaam, Voorvoegsels, Achternaam, Aanwezigheid,
 *   Geoorloofde afwezigheid, Ongeoorloofde afwezigheid, Totale afwezigheid,
 *   Laatste verzuimmelding
 *
 * Also supports simpler exports with: Naam/Leerlingnummer/Aanwezigheid/...
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  const arrayBuffer = await file.arrayBuffer();

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  } catch (err: any) {
    throw new Error('Excel-bestand kon niet worden verwerkt: ' + (err.message || String(err)));
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Het Excel-bestand bevat geen werkbladen.');
  }

  // ── Stap 1: Kies het juiste werkblad ─────────────────────────────────────
  // Prefereer een werkblad met "verzuim" of "overzicht" in de naam.
  // Fallback: het werkblad met de meeste rijen.
  let sheetName = workbook.SheetNames[0];
  let bestScore = -1;

  workbook.SheetNames.forEach(function(name: string) {
    const ln = name.toLowerCase();
    let score = 0;
    if (ln.indexOf('verzuim') !== -1)   score += 3;
    if (ln.indexOf('overzicht') !== -1) score += 2;
    if (ln.indexOf('totaal') !== -1)    score += 1;
    if (ln.indexOf('leerling') !== -1)  score += 1;
    if (score > bestScore) {
      bestScore = score;
      sheetName = name;
    }
  });

  console.log('[excel.ts] Werkblad gekozen:', sheetName, '(uit:', workbook.SheetNames.join(', ') + ')');
  const sheet = workbook.Sheets[sheetName];

  // ── Stap 2: Alle rijen als ruwe arrays ────────────────────────────────────
  let rawRows: any[][];
  try {
    rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  } catch (err: any) {
    throw new Error('Werkblad kon niet worden gelezen: ' + (err.message || String(err)));
  }

  if (rawRows.length === 0) throw new Error('Het werkblad bevat geen rijen.');

  // Debug: eerste 10 rijen altijd loggen
  console.group('[excel.ts] RAW rijen: ' + sheetName);
  rawRows.slice(0, 10).forEach(function(r: any, i: number) { console.log('Rij ' + i + ':', r); });
  console.groupEnd();

  // ── Stap 3: Header-rij detectie ───────────────────────────────────────────
  const HEADER_KEYS = [
    'naam', 'achternaam', 'studentnummer', 'leerlingnummer',
    'aanwezigheid', 'geoorloofd', 'ongeoorloofd', 'verzuim', 'totaal',
  ];

  let headerRowIdx = 0;
  let headerScore  = 0;

  for (let ri = 0; ri < Math.min(rawRows.length, 20); ri++) {
    const row = rawRows[ri];
    const rowLower = row.map(function(c: any) { return String(c || '').toLowerCase().trim(); });
    let score = 0;
    rowLower.forEach(function(c: string) {
      HEADER_KEYS.forEach(function(k: string) { if (c.indexOf(k) !== -1) score++; });
    });
    if (score > headerScore) { headerScore = score; headerRowIdx = ri; }
  }

  const headers  = rawRows[headerRowIdx].map(function(h: any) { return String(h || '').trim(); });
  const dataRows = rawRows.slice(headerRowIdx + 1);

  console.log('[excel.ts] Header-rij (index ' + headerRowIdx + '):', headers);
  console.log('[excel.ts] Datarijen:', dataRows.length);

  // ── Stap 4: Kolom-zoeker ──────────────────────────────────────────────────
  // Retourneert de waarde van de eerste kandidaat die een niet-lege cel heeft.
  // Matching: exact (case-insensitief) of "bevat" de zoekterm.
  function kolom(rowObj: Record<string, any>, kandidaten: string[]): any {
    const rowKeys = Object.keys(rowObj);
    for (let k = 0; k < kandidaten.length; k++) {
      const needle = kandidaten[k].toLowerCase().trim();
      for (let j = 0; j < rowKeys.length; j++) {
        const hdr = rowKeys[j].toLowerCase().trim();
        if (hdr === needle || hdr.indexOf(needle) !== -1) {
          const val = rowObj[rowKeys[j]];
          if (val !== undefined && val !== null && val !== '') return val;
        }
      }
    }
    return '';
  }

  // ── Stap 5: Records bouwen ────────────────────────────────────────────────
  const records: any[] = [];

  for (let di = 0; di < dataRows.length; di++) {
    const rawRow = dataRows[di];
    if (!rawRow.some(function(c: any) { return c !== '' && c !== null && c !== undefined; })) continue;

    // Bouw header → waarde object
    const rowObj: Record<string, any> = {};
    for (let hi = 0; hi < headers.length; hi++) {
      if (headers[hi]) rowObj[headers[hi]] = rawRow[hi] !== undefined ? rawRow[hi] : '';
    }

    // ── Naam: probeer SomToday-formaat (aparte kolommen) OF enkelvoudige Naam ──
    const achternaam   = String(kolom(rowObj, ['Achternaam']) || '').trim();
    const voorvoegsels = String(kolom(rowObj, ['Voorvoegsels', 'Tussenvoegsel']) || '').trim();
    const roepnaam     = String(kolom(rowObj, ['Roepnaam', 'Voornaam', 'Naam']) || '').trim();
    const naamEnkel    = String(kolom(rowObj, ['Naam', 'Leerlingnaam', 'Student', 'Deelnemer']) || '').trim();

    let naam: string;
    if (achternaam) {
      // SomToday-formaat: bouw "Achternaam, Roepnaam" of "Voorvoegsels Achternaam"
      const volledigeAchternaam = voorvoegsels ? voorvoegsels + ' ' + achternaam : achternaam;
      naam = roepnaam ? achternaam + ', ' + roepnaam : volledigeAchternaam;
    } else if (naamEnkel) {
      naam = naamEnkel;
    } else {
      continue; // rij zonder naam overslaan
    }

    // ── Leerlingnummer: strip trailing .0 van float-opslag ────────────────
    const llnrRaw = String(kolom(rowObj, [
      'Studentnummer', 'Leerlingnummer', 'Llnr', 'LLnr',
      'Nummer', 'Leerling nr', 'Leerling ID', 'Deelnemer nr',
    ]) || '').trim();
    // "248109.0" → "248109"
    const llnrMatch = llnrRaw.match(/^(\d+)(?:[.,]0+)?$/);
    const leerlingnummer = llnrMatch ? llnrMatch[1] : llnrRaw;

    records.push({
      naam:           naam,
      leerlingnummer: leerlingnummer,
      aanwezigheid:   parseVerzuimTime(kolom(rowObj, [
        'Aanwezigheid', 'Aanwezig', 'Aanwezig (uren)',
      ])),
      geoorloofd:     parseVerzuimTime(kolom(rowObj, [
        'Geoorloofde afwezigheid', 'Geoorloofd', 'Geoorloofd verzuim', 'Geoorloofd (uren)',
      ])),
      ongeoorloofd:   parseVerzuimTime(kolom(rowObj, [
        'Ongeoorloofde afwezigheid', 'Ongeoorloofd', 'Ongeoorloofd verzuim', 'Ongeoorloofd (uren)',
      ])),
      totaal:         parseVerzuimTime(kolom(rowObj, [
        'Totale afwezigheid', 'Totaal', 'Totaal verzuim', 'Totaal (uren)',
      ])),
      laatsteMelding: String(kolom(rowObj, [
        'Laatste verzuimmelding', 'Laatste melding', 'Laatst gemeld', 'Datum',
      ]) || ''),
    });
  }

  console.log('[excel.ts] Records geparsed:', records.length);
  if (records.length > 0) console.log('[excel.ts] Voorbeeld record:', records[0]);

  return records;
}

console.log('[excel.ts] Excel parser loaded');
