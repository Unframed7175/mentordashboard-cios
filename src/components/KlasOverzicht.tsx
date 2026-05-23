// ---------------------------------------------------------------------------
// src/components/KlasOverzicht.tsx — klas grid with search, sort, KPI strip
// Reads getActiveStudents() directly per render (refreshKey triggers re-render).
// KPI computed over ALL active students; filter only affects grid display.
// ---------------------------------------------------------------------------

import React, { useState, useMemo } from 'react';
import { getActiveStudents, getAllRecordsForStudent, klassenState, deleteKlas } from '../../utils/klassen';
import { berekenStatus, STATUS_VOLGORDE } from '../utils/status';
import LeerlingTegel from './LeerlingTegel';

interface KlasOverzichtProps {
  refreshKey: number;
  onSelectStudent: (id: string, orderedList: string[]) => void;
  onKlasDeleted: () => void;
}

export default function KlasOverzicht({ refreshKey, onSelectStudent, onKlasDeleted }: KlasOverzichtProps) {
  const [zoekTerm, setZoekTerm] = useState('');
  const [sortKey, setSortKey] = useState<'naam' | 'status' | 'verzuim'>('naam');
  const [sortAsc, setSortAsc] = useState(true);

  // Read singleton directly — refreshKey causes re-render when data changes
  const allStudents = getActiveStudents();

  // WR-04: Wrap status computation in useMemo keyed on refreshKey + student count
  // to avoid recomputing berekenStatus for every render triggered by zoekTerm changes.
  // Using refreshKey (import/switch trigger) + student count as stable cache key;
  // getActiveStudents() returns a new array reference each call so we cannot use
  // the array reference directly as a dependency — that would rebuild every render.
  const statusMap = useMemo(() => {
    const students = getActiveStudents();
    const m = new Map<string, ReturnType<typeof berekenStatus>>();
    for (const s of students) m.set(s.leerlingId, berekenStatus(s));
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, allStudents.length]);

  // Phase 26 (TREND-01..04): compute trend direction per student by comparing
  // the oldest and newest period records via berekenStatus + STATUS_VOLGORDE rank.
  const trendMap = useMemo(() => {
    const students = getActiveStudents();
    const m = new Map<string, 'op' | 'neer' | null>();

    // Named helper — extracted for readability and future standalone extraction
    const computeTrend = (records: any[]): 'op' | 'neer' | null => {
      // Step A — length guard: need at least two records for a comparison
      if (records.length < 2) return null;

      // Step B — distinct-period guard: prevents a student imported twice in the
      // same periode from producing a false two-fase comparison.
      if (records[0].periode === records[records.length - 1].periode) return null;

      // Step C — compute status for oldest (fase 1) and newest (fase 2) record
      const fase1Status = berekenStatus(records[0]);
      const fase2Status = berekenStatus(records[records.length - 1]);

      // Grijs guard (D-09): only compare two real RAG colours (rood/oranje/groen/blauw)
      if (fase1Status.kleur === 'grijs' || fase2Status.kleur === 'grijs') return null;

      const rank1 = STATUS_VOLGORDE[fase1Status.kleur];
      const rank2 = STATUS_VOLGORDE[fase2Status.kleur];

      if (rank2 > rank1) return 'op';
      if (rank2 < rank1) return 'neer';
      return null;
    };

    for (const s of students) {
      const records = getAllRecordsForStudent(s.leerlingId);
      m.set(s.leerlingId, computeTrend(records));
    }

    // refreshKey increments on every import — ensures trendMap recomputes whenever
    // new record data arrives (same invariant as statusMap above)
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, allStudents.length]);

  // KPI computation over ALL students (not filtered subset) — per plan spec
  // Fix: use statusMap values directly rather than re-mapping via allStudents
  // to ensure we count from the same dataset the map was built from.
  const allStatuses = Array.from(statusMap.values());
  const opSchemaCount = allStatuses.filter(st => st.kleur === 'groen' || st.kleur === 'blauw').length;
  const risicoCount   = allStatuses.filter(st => st.kleur === 'rood').length;
  const letOpCount    = allStatuses.filter(st => st.kleur === 'oranje' && st.label === 'Let op').length;
  const verzuimCount  = allStatuses.filter(st => st.kleur === 'oranje' && st.label === 'Verzuim').length;
  const grijsCount    = allStatuses.filter(st => st.kleur === 'grijs').length;

  // pctOpSchema denominator excludes grijs (unscored) students so the percentage
  // reflects only students whose status is actually known (rood/oranje/groen/blauw).
  // Shows "--" when no scored students exist yet.
  const scoredCount = allStudents.length - grijsCount;
  const pctOpSchema = scoredCount > 0 ? Math.round((opSchemaCount / scoredCount) * 100) : null;

  // Filter by zoekTerm (case-insensitive naam match, no debounce)
  let filtered = allStudents;
  if (zoekTerm) {
    const q = zoekTerm.toLowerCase();
    filtered = allStudents.filter(s => s.naam.toLowerCase().includes(q));
  }

  // Sort filtered list
  const sorted = [...filtered].sort((a, b) => {
    const stA = statusMap.get(a.leerlingId)!;
    const stB = statusMap.get(b.leerlingId)!;
    let cmp = 0;
    if (sortKey === 'naam') {
      cmp = a.naam.localeCompare(b.naam, 'nl');
    } else if (sortKey === 'status') {
      cmp = STATUS_VOLGORDE[stA.kleur] - STATUS_VOLGORDE[stB.kleur];
    } else if (sortKey === 'verzuim') {
      const av = a.verzuim ? a.verzuim.ongeoorloofd : 0;
      const bv = b.verzuim ? b.verzuim.ongeoorloofd : 0;
      cmp = bv - av; // descending by default (most ongeoorloofd first)
    }
    return sortAsc ? cmp : -cmp;
  });

  function handleSortClick(key: 'naam' | 'status' | 'verzuim') {
    if (key === sortKey) {
      // Toggle direction
      setSortAsc(prev => !prev);
    } else {
      // New key: set default direction (naam=asc, status/verzuim=desc)
      setSortKey(key);
      setSortAsc(key === 'naam');
    }
  }

  async function handleDelete() {
    const activeKlas = klassenState.activeKlasId
      ? klassenState.klassen[klassenState.activeKlasId]
      : null;
    const klasNaam = activeKlas ? activeKlas.naam : 'deze klas';
    const confirmed = window.confirm(
      `Klas '${klasNaam}' en alle leerlingdata verwijderen? Dit kan niet ongedaan worden gemaakt.`
    );
    if (!confirmed) return;
    if (klassenState.activeKlasId) {
      await deleteKlas(klassenState.activeKlasId);
    }
    onKlasDeleted();
  }

  // Determine empty state
  const showNoImport = allStudents.length === 0 && !zoekTerm;
  const showNoMatch = allStudents.length > 0 && zoekTerm !== '' && sorted.length === 0;

  return (
    <div>
      {/* Toolbar: search + sort */}
      <div className="klas-toolbar">
        <input
          className="klas-zoek"
          type="text"
          placeholder="Zoek op naam..."
          value={zoekTerm}
          onChange={e => setZoekTerm(e.target.value)}
        />
        <div className="sort-group">
          <button
            className={`sort-btn${sortKey === 'naam' ? ' active' : ''}`}
            onClick={() => handleSortClick('naam')}
          >
            Naam
          </button>
          <button
            className={`sort-btn${sortKey === 'status' ? ' active' : ''}`}
            onClick={() => handleSortClick('status')}
          >
            Status
          </button>
          <button
            className={`sort-btn${sortKey === 'verzuim' ? ' active' : ''}`}
            onClick={() => handleSortClick('verzuim')}
          >
            Verzuim
          </button>
        </div>
      </div>

      {/* KPI strip — computed over ALL students */}
      {allStudents.length > 0 && (
        <div id="kpi-strip">
          <div className="kpi-tile">
            <div className="kpi-value">{pctOpSchema !== null ? `${pctOpSchema}%` : '--'}</div>
            <div className="kpi-label">Op schema</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-value">{letOpCount}</div>
            <div className="kpi-label">Let op</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-value">{risicoCount}</div>
            <div className="kpi-label">Risico</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-value">{verzuimCount}</div>
            <div className="kpi-label">Verzuim</div>
          </div>
          {grijsCount > 0 && (
            <div className="kpi-tile">
              <div className="kpi-value">{grijsCount}</div>
              <div className="kpi-label">Onbekend</div>
            </div>
          )}
        </div>
      )}

      {/* Empty state: no students imported */}
      {showNoImport && (
        <div id="klas-leeg">Nog geen leerlingen geïmporteerd.</div>
      )}

      {/* Empty state: search produced no results */}
      {showNoMatch && (
        <div id="klas-leeg">Geen leerlingen gevonden voor &ldquo;{zoekTerm}&rdquo;.</div>
      )}

      {/* Tile grid */}
      {sorted.length > 0 && (
        <div id="klas-grid">
          {sorted.map(s => {
            const status = statusMap.get(s.leerlingId)!;
            return (
              <LeerlingTegel
                key={s.leerlingId}
                student={s}
                status={status}
                trend={trendMap.get(s.leerlingId) ?? null}
                onClick={() => onSelectStudent(s.leerlingId, sorted.map(r => r.leerlingId))}
              />
            );
          })}
        </div>
      )}

      {/* Footer: delete klas */}
      {klassenState.activeKlasId && (
        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <button className="btn btn-ghost" style={{ color: 'var(--status-rood-text)' }} onClick={handleDelete}>
            Klas verwijderen
          </button>
        </div>
      )}
    </div>
  );
}
