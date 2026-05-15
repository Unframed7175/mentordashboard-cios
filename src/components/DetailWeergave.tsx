import React from 'react';
import { getAllRecordsForStudent } from '../../utils/klassen';
import { berekenStatus } from '../utils/status';
import DoortstroomPrognoseSection from './DoortstroomPrognoseSection';
import VerzuimSection from './VerzuimSection';
import VakkenSection from './VakkenSection';

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
  let student = records[records.length - 1];

  // Pitfall 4 mitigation: inherit verzuim from any other record if most-recent lacks it
  if (!student.verzuim) {
    for (let i = records.length - 2; i >= 0; i--) {
      if (records[i].verzuim) {
        student = Object.assign({}, student, { verzuim: records[i].verzuim });
        break;
      }
    }
  }

  const status = berekenStatus(student);
  const meta = [student.periode, student.leerjaar].filter(Boolean).join(' · ');

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Detail header */}
      <div
        className="detail-header"
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
      </div>

      {/* Section 1: DoortstroomPrognoseSection */}
      <DoortstroomPrognoseSection student={student} status={status} />

      {/* Section 2: AanvullendSection — stub (not in Plan 04 scope) */}
      <div className="detail-section">
        <p className="detail-section-title">Aanvullende gegevens</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>Komt in Plan 05</p>
      </div>

      {/* Section 3: StageSection — stub (not in Plan 04 scope) */}
      <div className="detail-section">
        <p className="detail-section-title">Stage</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>Komt in Plan 05</p>
      </div>

      {/* Section 4: FeedbackActiepuntenSection — stub (Plan 05) */}
      <div className="detail-section">
        <p className="detail-section-title">Feedback &amp; actiepunten</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>Beschikbaar na Plan 05</p>
      </div>

      {/* Section 5: LeerlijnenSection — stub (not in Plan 04 scope) */}
      <div className="detail-section">
        <p className="detail-section-title">Per leerlijn</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>Komt in Plan 05</p>
      </div>

      {/* Section 6: SpiderChartCard row — stub (Plan 05) */}
      <div className="detail-section">
        <p className="detail-section-title">Spiderweb overzicht</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>Beschikbaar na Plan 05</p>
      </div>

      {/* Section 7: DeelgebiedenMatrix — stub (Plan 05) */}
      <div className="detail-section">
        <p className="detail-section-title">Beoordelingen per datapunt × deelgebied</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>Beschikbaar na Plan 05</p>
      </div>

      {/* Section 8: VerzuimSection */}
      <VerzuimSection student={student} />

      {/* Section 9: VakkenSection */}
      <VakkenSection student={student} />

      {/* Section 10: NotitiesTextarea — stub (Plan 05) */}
      <div className="detail-section">
        <p className="detail-section-title">Notities mentorgesprek</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>Beschikbaar na Plan 05</p>
      </div>
    </div>
  );
}
