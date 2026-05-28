import React from 'react';
import { getAllRecordsForStudent, klassenState } from '../../utils/klassen';
import { berekenStatus } from '../utils/status';
import DoortstroomPrognoseSection from './DoortstroomPrognoseSection';
import FeedbackActiepuntenSection from './FeedbackActiepuntenSection';
import SpiderChartCard from './SpiderChartCard';
import DeelgebiedenMatrix from './DeelgebiedenMatrix';
import VerzuimSection from './VerzuimSection';
import BpvProgressSection from './BpvProgressSection';
import RekenenNederlandsSection from './RekenenNederlandsSection';

interface DetailWeergaveProps {
  leerlingId: string;
  prevId: string | null;
  nextId: string | null;
  onNavigate: (id: string) => void;
  onBack: () => void;
}

export default function DetailWeergave({ leerlingId, prevId, nextId, onNavigate, onBack }: DetailWeergaveProps) {
  // getAllRecordsForStudent returns oldest-first; most-recent is last
  const records = getAllRecordsForStudent(leerlingId);
  if (records.length === 0) {
    return <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Leerling niet gevonden</p>;
  }

  // Most-recent record (app.js lines 1515-1521 pattern)
  const idx = records.length - 1;
  // CR-03: Pitfall 4 mitigation — inherit verzuim from an older record if most-recent lacks it.
  // Mutate the array element in-place so all child components receive the real reference that
  // saveKlassen() will serialize. Creating a spread-merged copy (the old pattern) caused
  // taalniveau/rekenniveau/notitie edits by AanvullendSection and NotitiesTextarea to land on
  // a disconnected object and be silently discarded on the next reload.
  if (!records[idx].verzuim) {
    for (let i = idx - 1; i >= 0; i--) {
      if (records[i].verzuim) {
        records[idx].verzuim = { ...records[i].verzuim };
        break;
      }
    }
  }
  const student = records[idx]; // original array reference — not a copy

  const status = berekenStatus(student);
  const meta = [student.periode, student.leerjaar].filter(Boolean).join(' · ');
  const klas = klassenState.activeKlasId ? klassenState.klassen[klassenState.activeKlasId] : null;

  // Aggregate deelgebiedScores across ALL periods: latest non-null wins.
  // Most-recent record alone only covers one period — when 2+ PDFs are imported,
  // the spider chart would otherwise show zeroes for deelgebieden only scored in older periods.
  const aggregatedScores: Record<string, string | null> = {};
  for (const rec of records) {
    for (const [label, score] of Object.entries(rec.deelgebiedScores || {})) {
      if (score !== null) aggregatedScores[label] = score as string;
    }
  }

  return (
    <div className="print-target view-fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Print-only header — hidden in browser, visible in print (EXP-02) */}
      <div className="print-header">
        <h2 style={{ margin: 0 }}>{student.naam}</h2>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Klas: {klas?.naam ?? '—'} &nbsp;|&nbsp; Datum: {new Date().toLocaleDateString('nl-NL')} &nbsp;|&nbsp; {meta || 'Geen periode'}
        </p>
      </div>

      {/* Detail header */}
      <div
        className="detail-header no-print"
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}
      >
        <button
          className="detail-nav-btn"
          onClick={onBack}
          style={{ cursor: 'pointer' }}
        >
          ← Terug
        </button>
        <div className="detail-student-info" style={{ flex: 1 }}>
          <div
            className="detail-student-naam"
            style={{ fontSize: '1.2rem', fontWeight: 700 }}
          >
            {student.naam}
          </div>
          {meta && (
            <span
              className="detail-student-meta"
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              {meta}
            </span>
          )}
        </div>
        <div className="detail-nav-arrows" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="detail-nav-btn"
            disabled={!prevId}
            onClick={() => prevId && onNavigate(prevId)}
            style={{ cursor: prevId ? 'pointer' : 'default', opacity: prevId ? 1 : 0.38 }}
          >
            ‹ Vorige
          </button>
          <button
            className="detail-nav-btn"
            disabled={!nextId}
            onClick={() => nextId && onNavigate(nextId)}
            style={{ cursor: nextId ? 'pointer' : 'default', opacity: nextId ? 1 : 0.38 }}
          >
            Volgende ›
          </button>
        </div>
        <button
          className="detail-nav-btn no-print"
          onClick={() => window.print()}
          style={{ cursor: 'pointer' }}
        >
          Afdrukken
        </button>
      </div>

      {/* Section 1: DoortstroomPrognoseSection */}
      <DoortstroomPrognoseSection student={student} status={status} />

      {/* Section 2: RekenenNederlandsSection — RNL-01..03 */}
      <RekenenNederlandsSection student={student} />

      {/* Section 4: FeedbackActiepuntenSection */}
      <FeedbackActiepuntenSection leerlingId={leerlingId} />

      {/* Section 5: SpiderChartCard row */}
      <div className="detail-section">
        <p className="detail-section-title">Spiderweb overzicht</p>
        <div className="spider-charts-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-start' }}>
          <SpiderChartCard
            group="lesgeven"
            scores={aggregatedScores}
            fillVar="--spider-lesgeven"
            strokeVar="--spider-lesgeven-stroke"
            title="Lesgeven"
          />
          <SpiderChartCard
            group="organiseren"
            scores={aggregatedScores}
            fillVar="--spider-organiseren"
            strokeVar="--spider-organiseren-stroke"
            title="Organiseren"
          />
          <SpiderChartCard
            group="prof_handelen"
            scores={aggregatedScores}
            fillVar="--spider-prof-handelen"
            strokeVar="--spider-prof-handelen-stroke"
            title="Prof. handelen"
          />
        </div>
      </div>

      {/* Section 7: DeelgebiedenMatrix */}
      <DeelgebiedenMatrix student={student} leerlingId={leerlingId} />

      {/* Section 8: VerzuimSection */}
      <VerzuimSection student={student} />

      {/* Section 8: BpvProgressSection */}
      <BpvProgressSection leerlingId={leerlingId} />
    </div>
  );
}
