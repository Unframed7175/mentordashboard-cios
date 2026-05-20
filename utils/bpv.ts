// utils/bpv.ts — BPV config + data persistence (Phase 18, SET-06)
// Provides: getBpvConfig, getBpvConfigSync, saveBpvConfig,
//           getBpvData, saveBpvData, berekenBpvPct, parseBpvExcel,
//           BpvConfig, BpvStudentRecord, BpvData, DEFAULT_BPV_CONFIG
//
// Depends on:
//   @tauri-apps/plugin-store — LazyStore
//
// Two store keys:
//   'bpv_config' — plain object (same as settings.ts pattern)
//   'bpv_data'   — JSON-stringified object (data may be large, same as leerlijnen.ts pattern)
//
// Phase 18 Plan 02 — Wave 1 implementation

import * as XLSX from 'xlsx';
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';
const _cptableWithUtils = Object.assign({}, (cpexcel as any).cptable, { utils: (cpexcel as any).utils });
XLSX.set_cptable(_cptableWithUtils);

import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const CONFIG_KEY = 'bpv_config';
const DATA_KEY = 'bpv_data';
let _configCache: BpvConfig | null = null; // null = unloaded
let _dataCache: BpvData | null = null;     // null = unloaded

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BpvConfig {
  verwachteUren: number; // default 200 (D-14 per UI-SPEC)
}

export interface BpvPlaatsing {
  locatie: string;
  ingeleverdUren: number;
  goedgekeurdeUren: number;
}

export interface BpvStudentRecord {
  gerealiseerdeUren: number; // sum of goedgekeurdeUren across all plaatsingen
  plaatsen: BpvPlaatsing[];
}

export type BpvData = Record<string, BpvStudentRecord>; // keyed by leerlingId

export const DEFAULT_BPV_CONFIG: BpvConfig = {
  verwachteUren: 200,
};

// ── getBpvConfig() ─────────────────────────────────────────────────────────────

/**
 * Returns current BPV config (expected hours).
 * Reads from plugin-store; falls back to DEFAULT_BPV_CONFIG.
 * Result is cached until save.
 */
export async function getBpvConfig(): Promise<BpvConfig> {
  if (_configCache !== null) return _configCache;
  try {
    const raw = await store.get<BpvConfig>(CONFIG_KEY);
    if (raw && typeof raw.verwachteUren === 'number') {
      _configCache = raw;
      return _configCache;
    }
  } catch (e: any) {
    console.warn('[bpv.ts] config read error:', e);
  }
  _configCache = { ...DEFAULT_BPV_CONFIG };
  return _configCache;
}

// ── getBpvConfigSync() ────────────────────────────────────────────────────────

/**
 * Synchronous cache accessor for BPV config.
 * Returns cached config if present, otherwise DEFAULT_BPV_CONFIG.
 * Pre-warm by calling getBpvConfig() at app startup.
 */
export function getBpvConfigSync(): BpvConfig {
  return _configCache ?? DEFAULT_BPV_CONFIG;
}

// ── saveBpvConfig() ───────────────────────────────────────────────────────────

/**
 * Persists BPV config to plugin-store.
 * CRITICAL: updates _configCache FIRST (instant-apply, pitfall 5), then persists async.
 * CRITICAL: store.set() + store.save() must both be awaited (Phase 12 pitfall).
 * Returns true on success, false on error.
 */
export async function saveBpvConfig(c: BpvConfig): Promise<boolean> {
  _configCache = c; // instant-apply: update cache before async write (pitfall 5)
  try {
    await store.set(CONFIG_KEY, c); // pass object directly (settings.ts pattern)
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.warn('[bpv.ts] config write error:', e);
    return false;
  }
}

// ── getBpvData() ──────────────────────────────────────────────────────────────

/**
 * Returns current BPV data (per-student actual hours).
 * Reads from plugin-store; falls back to {} (empty record).
 * Result is cached until save.
 */
export async function getBpvData(): Promise<BpvData> {
  if (_dataCache !== null) return _dataCache;
  try {
    const raw = await store.get<string>(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        _dataCache = parsed as BpvData;
        return _dataCache;
      }
    }
  } catch (e: any) {
    console.warn('[bpv.ts] data read error:', e);
  }
  _dataCache = {};
  return _dataCache;
}

// ── saveBpvData() ─────────────────────────────────────────────────────────────

/**
 * Persists BPV data to plugin-store as JSON string (data may be large).
 * CRITICAL: updates _dataCache FIRST (instant-apply, pitfall 5), then persists async.
 * CRITICAL: store.set() + store.save() must both be awaited (Phase 12 pitfall).
 * Returns true on success, false on error.
 */
export async function saveBpvData(d: BpvData): Promise<boolean> {
  _dataCache = d; // instant-apply: update cache before async write (pitfall 5)
  try {
    await store.set(DATA_KEY, JSON.stringify(d));
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.warn('[bpv.ts] data write error:', e);
    return false;
  }
}

// ── berekenBpvPct() ───────────────────────────────────────────────────────────

/**
 * Calculate BPV completion percentage.
 * Caps at 100, rounds to nearest integer.
 * Returns 0 if verwacht is 0 or negative (division guard).
 */
export function berekenBpvPct(gerealiseerd: number, verwacht: number): number {
  if (!verwacht || verwacht <= 0) return 0;
  return Math.min(100, Math.round((gerealiseerd / verwacht) * 100));
}

// ── parseBpvExcel() ───────────────────────────────────────────────────────────

function _bpvKolom(rowObj: Record<string, any>, kandidaten: string[]): any {
  const rowKeys = Object.keys(rowObj);
  for (const kandidaat of kandidaten) {
    const needle = kandidaat.toLowerCase().trim();
    for (const key of rowKeys) {
      const hdr = key.toLowerCase().trim();
      if (hdr === needle || hdr.includes(needle)) {
        const val = rowObj[key];
        if (val !== undefined && val !== null && val !== '') return val;
      }
    }
  }
  return '';
}

export function parseBpvExcel(buffer: ArrayBuffer): BpvData {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  const isXlsx = bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04;
  const isXls  = bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
  if (!isXlsx && !isXls) {
    throw new Error('Onbekend BPV-bestandsformaat');
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
  } catch {
    return {};
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) return {};

  // BPV-specific sheet scorer — separate from verzuim scorer
  // Real file: "Logboek voortgang" (only sheet, defaults to SheetNames[0])
  let sheetName = workbook.SheetNames[0];
  let bestScore = 0;
  workbook.SheetNames.forEach((name: string) => {
    const ln = name.toLowerCase();
    let score = 0;
    if (ln.includes('bpv'))      score += 4;
    if (ln.includes('stage'))    score += 3;
    if (ln.includes('uren'))     score += 2;
    if (ln.includes('praktijk')) score += 2;
    if (score > bestScore) { bestScore = score; sheetName = name; }
  });

  const sheet = workbook.Sheets[sheetName];
  let rawRows: any[][];
  try {
    rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  } catch {
    return {};
  }
  if (rawRows.length === 0) return {};

  // Header row detection
  const BPV_HEADER_KEYS = ['naam', 'leerling', 'student', 'deelnemer', 'cursist', 'uren', 'gerealiseerd', 'bpv', 'stage'];
  let headerRowIdx = 0;
  let headerScore  = 0;
  for (let ri = 0; ri < Math.min(rawRows.length, 20); ri++) {
    const rowLower = rawRows[ri].map((c: any) => String(c || '').toLowerCase().trim());
    let score = 0;
    rowLower.forEach((c: string) => {
      BPV_HEADER_KEYS.forEach((k: string) => { if (c.includes(k)) score++; });
    });
    if (score > headerScore) { headerScore = score; headerRowIdx = ri; }
  }

  const headers  = rawRows[headerRowIdx].map((h: any) => String(h || '').trim());
  const dataRows = rawRows.slice(headerRowIdx + 1);

  const result: BpvData = {};

  for (const rawRow of dataRows) {
    if (!rawRow.some((c: any) => c !== '' && c !== null && c !== undefined)) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((h, i) => { if (h) rowObj[h] = rawRow[i] !== undefined ? rawRow[i] : ''; });

    // Real file columns: "Student" (name), "Studentnummer" (ID)
    const naam = String(
      _bpvKolom(rowObj, ['Student', 'Naam', 'Leerlingnaam', 'Deelnemer', 'Cursist', 'Studentnaam', 'Deelnemersnaam']) || ''
    ).trim();
    if (!naam) continue;

    const llnrRaw = String(
      _bpvKolom(rowObj, ['Studentnummer', 'Leerlingnummer', 'Llnr', 'Deelnemer nr', 'Deelnemersnummer', 'Nummer']) || ''
    ).trim();
    const llnrMatch = llnrRaw.match(/^(\d+)(?:[.,]0+)?$/);
    const leerlingId = llnrMatch ? llnrMatch[1] : naam;

    // Location / organisation name for this placement
    const locatie = String(
      _bpvKolom(rowObj, [
        'Leerbedrijf', 'Organisatie', 'Bedrijf', 'Stagebedrijf', 'Stageplek',
        'Locatie', 'Naam organisatie', 'Instelling', 'Adres', 'Organisation', 'Company',
      ]) || ''
    ).trim();

    // Submitted hours (ingeleverd) — hours the student logged, not yet fully approved
    const ingeleverdRaw = _bpvKolom(rowObj, [
      'Stage-uren ingeleverd', 'Uren ingeleverd', 'Ingediende uren',
      'Ingeleverd', 'Totaal uren', 'Totaal',
    ]);
    const ingeleverdUren = ingeleverdRaw !== '' ? (parseFloat(String(ingeleverdRaw)) || 0) : 0;

    // Approved hours (goedgekeurd) — hours formally signed off
    const goedgekeurdRaw = _bpvKolom(rowObj, [
      'Stage-uren goedgekeurd', 'Goedgekeurde uren', 'Goedgekeurd',
      'Gerealiseerde uren', 'Gerealiseerd', 'BPV uren', 'Stage uren',
      'Uren gerealiseerd', 'Behaalde uren', 'Uren',
    ]);
    const goedgekeurdeUren = goedgekeurdRaw !== '' ? (parseFloat(String(goedgekeurdRaw)) || 0) : 0;

    // Accumulate per student: push placement + update running total
    const existing = result[leerlingId] ?? { gerealiseerdeUren: 0, plaatsen: [] };
    existing.plaatsen.push({ locatie: locatie || '—', ingeleverdUren, goedgekeurdeUren });
    existing.gerealiseerdeUren += goedgekeurdeUren;
    result[leerlingId] = existing;
  }

  return result;
}

// ── debugBpvExcel() ────────────────────────────────────────────────────────────

export function debugBpvExcel(buffer: ArrayBuffer): void {
  try {
    const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    console.group('=== debugBpvExcel ===');
    console.log('Werkbladen:', wb.SheetNames);
    wb.SheetNames.forEach((name: string) => {
      const ws = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
      console.group('Werkblad: "' + name + '" (' + rows.length + ' rijen)');
      rows.slice(0, 5).forEach((r, i) => console.log('Rij ' + i + ':', r));
      console.groupEnd();
    });
    console.groupEnd();
  } catch (e) {
    console.warn('[debugBpvExcel] parse error:', e);
  }
}

console.log('[bpv.ts] BPV config + data persistence geladen');
