// ---------------------------------------------------------------------------
// src/components/KlasOverzicht.tsx — klas grid with search, sort, KPI strip
// Reads getActiveStudents() directly per render (refreshKey triggers re-render).
// KPI computed over ALL active students; filter only affects grid display.
// ---------------------------------------------------------------------------

import React, { useState, useMemo } from 'react';
import { getActiveStudents, klassenState, deleteKlas } from '../../utils/klassen';
import { berekenStatus, STATUS_VOLGORDE } from '../utils/status';
import LeerlingTegel from './LeerlingTegel';

interface KlasOverzichtProps {
  refreshKey: number;
  onSelectStudent: (id: string, orderedList: string[]) => void;
  onKlasDeleted: () => void;
}

export default function KlasOverzicht({ refreshKey: _refreshKey, onSelectStudent, onKlasDeleted }: KlasOverzichtProps) {
  const [zoekTerm, setZoekTerm] = useState('');
  const [sortKey, setSortKey] = useState<'naam' | 'status' | 'verzuim'>('naam');
  const [sortAsc, setSortAsc] = useState(true);

  // Read singleton directly — refreshKey causes re-render when data changes
  const allStudents = getActiveStudents();

  // WR-04: Wrap status computation in useMemo keyed on allStudents to avoid
  // recomputing berekenStatus for every render triggered by zoekTerm changes.
  const statusMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof berekenStatus>>();
    for (const s of allStudents) m.set(s.leerlingId, berekenStatus(s));
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStudents]);

  // KPI computation over ALL students (not filtered subset) — per plan spec
  const kpiStatuses = allStudents.map(s => statusMap.get(s.leerlingId)!);
  const opSchemaCount = kpiStatuses.filter(st => st.kleur === 'groen' || st.kleur === 'blauw').length;
  const risicoCount = kpiStatuses.filter(st => st.kleur === 'rood').length;
  const verzuimCount = kpiStatuses.filter(st => st.kleur === 'oranje' && st.label === 'Verzuim').length;
  const pctOpSchema = allStudents.length > 0 ? Math.round((opSchemaCount / allStudents.length) * 100) : 0;

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
            <div className="kpi-value">{pctOpSchema}%</div>
            <div className="kpi-label">Op schema</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-value">{risicoCount}</div>
            <div className="kpi-label">Risico</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-value">{verzuimCount}</div>
            <div className="kpi-label">Verzuim</div>
          </div>
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
