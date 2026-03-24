// parsers/excel.js — Excel verzuim parser
// Reads Dutch school absence Excel exports (.xls/.xlsx) via SheetJS (XLSX global from CDN)
// NOT an ES module — uses window.* globals consistent with schema.js and datamodel.js

/**
 * Parse a Dutch time string in the format "107u24m" to total minutes.
 *
 * @param {string|null|undefined} str - Time string like "107u24m", "0u00m", "2u05m"
 * @returns {number} Total minutes as integer (0 for invalid/empty input)
 */
window.parseVerzuimTime = function(str) {
  if (str === null || str === undefined || str === '') return 0;
  const s = String(str).trim();
  const match = s.match(/^(\d+)u(\d+)m$/);
  if (!match) return 0;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return (hours * 60) + minutes;
};

/**
 * Parse an Excel verzuim file and return structured absence records.
 *
 * Requires the XLSX global (SheetJS) to be loaded before calling this function.
 *
 * @param {File} file - A File object from a file input (must be .xls or .xlsx)
 * @returns {Promise<Array<{
 *   naam: string,
 *   leerlingnummer: string,
 *   aanwezigheid: number,
 *   geoorloofd: number,
 *   ongeoorloofd: number,
 *   totaal: number,
 *   laatsteMelding: string
 * }>>} Array of verzuim records with time values in minutes
 * @throws {Error} If XLSX is not available or the file cannot be parsed
 */
window.parseExcelFile = async function(file) {
  if (typeof XLSX === 'undefined') {
    throw new Error('SheetJS (XLSX) is niet geladen. Voeg de XLSX-bibliotheek toe via een script-tag.');
  }

  const arrayBuffer = await new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload = function(e) { resolve(e.target.result); };
    reader.onerror = function() { reject(new Error('Bestand kon niet worden gelezen: ' + file.name)); };
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

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  let rows;
  try {
    rows = XLSX.utils.sheet_to_json(sheet);
  } catch (err) {
    throw new Error('Werkblad kon niet worden omgezet naar rijen: ' + (err.message || String(err)));
  }

  return rows.map(function(row) {
    return {
      naam: row['Naam'] || row['naam'] || '',
      leerlingnummer: String(row['Leerlingnummer'] || row['leerlingnummer'] || row['Llnr'] || ''),
      aanwezigheid: window.parseVerzuimTime(String(row['Aanwezigheid'] || row['aanwezigheid'] || '')),
      geoorloofd: window.parseVerzuimTime(String(row['Geoorloofd'] || row['geoorloofd'] || row['Geoorloofd verzuim'] || '')),
      ongeoorloofd: window.parseVerzuimTime(String(row['Ongeoorloofd'] || row['ongeoorloofd'] || row['Ongeoorloofd verzuim'] || '')),
      totaal: window.parseVerzuimTime(String(row['Totaal'] || row['totaal'] || row['Totaal verzuim'] || '')),
      laatsteMelding: String(row['Laatste melding'] || row['laatste melding'] || row['Laatst gemeld'] || '')
    };
  });
};

console.log('[excel.js] Excel parser loaded');
