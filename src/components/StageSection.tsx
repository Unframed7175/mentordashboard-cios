import React from 'react';
import { klassenState } from '../../utils/klassen';

interface StageSectionProps {
  student: any;
}

function formatDutchDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const parts = String(iso).split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return iso;
}

export default function StageSection({ student }: StageSectionProps) {
  const klas = klassenState.activeKlasId ? klassenState.klassen[klassenState.activeKlasId] : null;
  const sd = klas?.stageData?.[student.leerlingId];

  if (!sd) {
    return (
      <div className="detail-section">
        <p className="detail-section-title">Stage</p>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          Geen stage-data — importeer de stage-Excel via het Import-tabblad.
        </p>
      </div>
    );
  }

  const periode = formatDutchDate(sd.startdatum) + ' t/m ' + formatDutchDate(sd.einddatum);
  const uren = `${sd.urenGoedgekeurd ?? '—'} / ${sd.urenIngeleverd ?? '—'} uren goedgekeurd`;

  return (
    <div className="detail-section">
      <p className="detail-section-title">Stage</p>
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="stat-card">
          <div className="stat-label">Organisatie</div>
          <div className="stat-value" style={{ fontSize: '1rem' }}>{sd.organisatie || '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Periode</div>
          <div className="stat-value" style={{ fontSize: '1rem' }}>{periode}</div>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-label">Stage-uren</div>
          <div className="stat-value" style={{ fontSize: '1rem' }}>{uren}</div>
        </div>
      </div>
    </div>
  );
}
