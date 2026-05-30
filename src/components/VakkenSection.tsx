import React, { useState } from 'react';
import StatusBadge from './StatusBadge';

interface VakkenSectionProps {
  student: any;
}

export default function VakkenSection({ student }: VakkenSectionProps) {
  const [openVakken, setOpenVakken] = useState<Set<string>>(new Set());

  function toggleVak(naam: string) {
    setOpenVakken(prev => {
      const next = new Set(prev);
      if (next.has(naam)) {
        next.delete(naam);
      } else {
        next.add(naam);
      }
      return next;
    });
  }

  if (!student.vakken || student.vakken.length === 0) {
    return (
      <div className="detail-section">
        <p className="detail-section-title">Voortgang per vak</p>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Geen vakdata beschikbaar.</p>
      </div>
    );
  }

  return (
    <div className="detail-section">
      <p className="detail-section-title">Voortgang per vak</p>
      <div className="vak-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {student.vakken.map((vak: any) => {
          const isOpen = openVakken.has(vak.naam);
          return (
            <div
              key={vak.naam}
              className={`vak-card${isOpen ? ' open' : ''}`}
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                className="vak-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  userSelect: 'none',
                }}
                onClick={() => toggleVak(vak.naam)}
              >
                <span>{vak.naam}</span>
                <span
                  className="vak-chevron"
                  style={{
                    fontSize: '0.7rem',
                    transition: 'transform 0.15s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                  }}
                >
                  ▼
                </span>
              </div>
              {isOpen && (
                <div
                  className="vak-body"
                  style={{ padding: '0.5rem 1rem 0.75rem', borderTop: '1px solid var(--border-light)' }}
                >
                  {(vak.opdrachten || []).length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)' }}>Geen opdrachten beschikbaar.</p>
                  ) : (
                    (vak.opdrachten || []).map((op: any, opIdx: number) => (
                      <div
                        key={opIdx}
                        className="opdracht-row"
                        style={{
                          padding: '0.4rem 0',
                          borderBottom: '1px solid var(--border-light)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <div className="opdracht-naam" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {op.naam}
                        </div>
                        {op.status && <StatusBadge status={op.status} />}
                        {op.feedForward && (
                          <div
                            className="opdracht-ff"
                            style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.1rem', fontSize: '0.82rem' }}
                          >
                            {op.feedForward}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
