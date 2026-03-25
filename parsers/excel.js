// parsers/excel.js — Excel verzuim parser
// Reads Dutch school absence Excel exports (.xls/.xlsx) via SheetJS (XLSX global from CDN)
// Tested against SomToday / ParnasSys "Totaaloverzicht Verzuim" export format.
// NOT an ES module — uses window.* globals consistent with schema.js and datamodel.js

/**
 * Parse a Dutch time string in the format "107u24m" to total minutes.
 * Also handles plain integers and "HH:MM" strings.
 */
window.parseVerzuimTime = function(str) {
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
};

/**
 * Debug helper: dump all raw rows from an Excel file to the console.
 * Usage: await window.debugExcelBestand(document.getElementById('excel-file-input').files[0])
 */
window.debugExcelBestand = async function(file) {
  if (typeof XLSX === 'undefined') { console.error('XLSX niet geladen'); return; }
  const ab = await new Promise(function(res, rej) {
    const r = new FileReader();
    r.onload = function(e) { res(e.target.result); };
    r.onerror = function() { rej(new Error('Leesfout')); };
    r.readAsArrayBuffer(file);
  });
  const wb = XLSX.read(new Uint8Array(ab), { type: 'array' });
  console.group('=== debugExcelBestand: ' + file.name + ' ===');
  console.log('Werkbladen:', wb.SheetNames);
  wb.SheetNames.forEach(function(name) {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.group('Werkblad: "' + name + '" (' + rows.length + ' rijen)');
    rows.slice(0, 10).forEach(function(r, i) { console.log('Rij ' + i + ':', r); });
    console.groupEnd();
  });
  console.groupEnd();
};

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
window.parseExcelFile = async function(file) {
  if (typeof XLSX === 'undefined') {
    throw new Error('SheetJS (XLSX) is niet geladen.');
  }

  const arrayBuffer = await new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload  = function(e) { resolve(e.target.result); };
    reader.onerror = function()  { reject(new Error('Bestand kon niet worden gelezen: ' + file.name)); };
    reader.readAsArrayBuffer(file);
  });

  let workbook;
  try {
    workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  } catch (err) {
    throw new Error('Excel-bestand kon niet worden verwerkt: ' + (err.message || String(err)));
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Het Excel-bestand bevat geen werkbladen.');
  }

  // ── Stap 1: Kies het juiste werkblad ─────────────────────────────────────
  // Prefereer een werkblad met "verzuim" of "overzicht" in de naam.
  // Fallback: het werkblad met de meeste rijen.
  var sheetName = workbook.SheetNames[0];
  var bestScore = -1;

  workbook.SheetNames.forEach(function(name) {
    var ln = name.toLowerCase();
    var score = 0;
    if (ln.indexOf('verzuim') !== -1)   score += 3;
    if (ln.indexOf('overzicht') !== -1) score += 2;
    if (ln.indexOf('totaal') !== -1)    score += 1;
    if (ln.indexOf('leerling') !== -1)  score += 1;
    if (score > bestScore) {
      bestScore = score;
      sheetName = name;
    }
  });

  console.log('[excel.js] Werkblad gekozen:', sheetName, '(uit:', workbook.SheetNames.join(', ') + ')');
  const sheet = workbook.Sheets[sheetName];

  // ── Stap 2: Alle rijen als ruwe arrays ────────────────────────────────────
  let rawRows;
  try {
    rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  } catch (err) {
    throw new Error('Werkblad kon niet worden gelezen: ' + (err.message || String(err)));
  }

  if (rawRows.length === 0) throw new Error('Het werkblad bevat geen rijen.');

  // Debug: eerste 10 rijen altijd loggen
  console.group('[excel.js] RAW rijen: ' + sheetName);
  rawRows.slice(0, 10).forEach(function(r, i) { console.log('Rij ' + i + ':', r); });
  console.groupEnd();

  // ── Stap 3: Header-rij detectie ───────────────────────────────────────────
  var HEADER_KEYS = [
    'naam', 'achternaam', 'studentnummer', 'leerlingnummer',
    'aanwezigheid', 'geoorloofd', 'ongeoorloofd', 'verzuim', 'totaal',
  ];

  var headerRowIdx = 0;
  var headerScore  = 0;

  for (var ri = 0; ri < Math.min(rawRows.length, 20); ri++) {
    var row = rawRows[ri];
    var rowLower = row.map(function(c) { return String(c || '').toLowerCase().trim(); });
    var score = 0;
    rowLower.forEach(function(c) {
      HEADER_KEYS.forEach(function(k) { if (c.indexOf(k) !== -1) score++; });
    });
    if (score > headerScore) { headerScore = score; headerRowIdx = ri; }
  }

  var headers  = rawRows[headerRowIdx].map(function(h) { return String(h || '').trim(); });
  var dataRows = rawRows.slice(headerRowIdx + 1);

  console.log('[excel.js] Header-rij (index ' + headerRowIdx + '):', headers);
  console.log('[excel.js] Datarijen:', dataRows.length);

  // ── Stap 4: Kolom-zoeker ──────────────────────────────────────────────────
  // Retourneert de waarde van de eerste kandidaat die een niet-lege cel heeft.
  // Matching: exact (case-insensitief) of "bevat" de zoekterm.
  function kolom(rowObj, kandidaten) {
    var rowKeys = Object.keys(rowObj);
    for (var k = 0; k < kandidaten.length; k++) {
      var needle = kandidaten[k].toLowerCase().trim();
      for (var j = 0; j < rowKeys.length; j++) {
        var hdr = rowKeys[j].toLowerCase().trim();
        if (hdr === needle || hdr.indexOf(needle) !== -1) {
          var val = rowObj[rowKeys[j]];
          if (val !== undefined && val !== null && val !== '') return val;
        }
      }
    }
    return '';
  }

  // ── Stap 5: Records bouwen ────────────────────────────────────────────────
  var records = [];

  for (var di = 0; di < dataRows.length; di++) {
    var rawRow = dataRows[di];
    if (!rawRow.some(function(c) { return c !== '' && c !== null && c !== undefined; })) continue;

    // Bouw header → waarde object
    var rowObj = {};
    for (var hi = 0; hi < headers.length; hi++) {
      if (headers[hi]) rowObj[headers[hi]] = rawRow[hi] !== undefined ? rawRow[hi] : '';
    }

    // ── Naam: probeer SomToday-formaat (aparte kolommen) OF enkelvoudige Naam ──
    var achternaam  = String(kolom(rowObj, ['Achternaam']) || '').trim();
    var voorvoegsels = String(kolom(rowObj, ['Voorvoegsels', 'Tussenvoegsel']) || '').trim();
    var roepnaam    = String(kolom(rowObj, ['Roepnaam', 'Voornaam', 'Naam']) || '').trim();
    var naamEnkel   = String(kolom(rowObj, ['Naam', 'Leerlingnaam', 'Student', 'Deelnemer']) || '').trim();

    var naam;
    if (achternaam) {
      // SomToday-formaat: bouw "Achternaam, Roepnaam" of "Voorvoegsels Achternaam"
      var volledigeAchternaam = voorvoegsels ? voorvoegsels + ' ' + achternaam : achternaam;
      naam = roepnaam ? achternaam + ', ' + roepnaam : volledigeAchternaam;
    } else if (naamEnkel) {
      naam = naamEnkel;
    } else {
      continue; // rij zonder naam overslaan
    }

    // ── Leerlingnummer: strip trailing .0 van float-opslag ────────────────
    var llnrRaw = String(kolom(rowObj, [
      'Studentnummer', 'Leerlingnummer', 'Llnr', 'LLnr',
      'Nummer', 'Leerling nr', 'Leerling ID', 'Deelnemer nr',
    ]) || '').trim();
    // "248109.0" → "248109"
    var llnrMatch = llnrRaw.match(/^(\d+)(?:[.,]0+)?$/);
    var leerlingnummer = llnrMatch ? llnrMatch[1] : llnrRaw;

    records.push({
      naam:           naam,
      leerlingnummer: leerlingnummer,
      aanwezigheid:   window.parseVerzuimTime(kolom(rowObj, [
        'Aanwezigheid', 'Aanwezig', 'Aanwezig (uren)',
      ])),
      geoorloofd:     window.parseVerzuimTime(kolom(rowObj, [
        'Geoorloofde afwezigheid', 'Geoorloofd', 'Geoorloofd verzuim', 'Geoorloofd (uren)',
      ])),
      ongeoorloofd:   window.parseVerzuimTime(kolom(rowObj, [
        'Ongeoorloofde afwezigheid', 'Ongeoorloofd', 'Ongeoorloofd verzuim', 'Ongeoorloofd (uren)',
      ])),
      totaal:         window.parseVerzuimTime(kolom(rowObj, [
        'Totale afwezigheid', 'Totaal', 'Totaal verzuim', 'Totaal (uren)',
      ])),
      laatsteMelding: String(kolom(rowObj, [
        'Laatste verzuimmelding', 'Laatste melding', 'Laatst gemeld', 'Datum',
      ]) || ''),
    });
  }

  console.log('[excel.js] Records geparsed:', records.length);
  if (records.length > 0) console.log('[excel.js] Voorbeeld record:', records[0]);

  return records;
};

console.log('[excel.js] Excel parser loaded');
