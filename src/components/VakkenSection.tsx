import React, { useState } from 'react';

interface VakkenSectionProps {
  student: any;
}

type StatusKleur = 'groen' | 'oranje' | 'rood' | 'grijs';

interface StatusConfig {
  label: string;
  kleur: StatusKleur;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  'op tijd ingeleverd en wel beoordeeld':                       { label: 'Op tijd ✓',          kleur: 'groen'  },
  'te laat ingeleverd en wel beoordeeld':                       { label: 'Te laat ✓',           kleur: 'oranje' },
  'te laat ingeleverd en niet beoordeeld':                      { label: 'Te laat — niet beoord.', kleur: 'rood' },
  'niet beoordeelbaar (voldoet niet aan de minimale eisen)':    { label: 'Niet beoordeelbaar',  kleur: 'rood'   },
  'niet ingeleverd':                                            { label: 'Niet ingeleverd',     kleur: 'rood'   },
  'zelfevaluatie afgerond':                                     { label: 'Zelfevaluatie ✓',     kleur: 'groen'  },
  'zelfevaluatie, niet afgerond':                               { label: 'Zelfevaluatie ✗',     kleur: 'oranje' },
  'beoordeeld':                                                 { label: 'Beoordeeld',          kleur: 'groen'  },
};

const BADGE_STYLE: Record<StatusKleur, React.CSSProperties> = {
  groen:  { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  oranje: { background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' },
  rood:   { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
  grijs:  { background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status.toLowerCase().trim()] ?? { label: status, kleur: 'grijs' as StatusKleur };
  return (
    <span style={{
      ...BADGE_STYLE[config.kleur],
      display: 'inline-block',
      fontSize: '0.75rem',
      fontWeight: 600,
      padding: '0.1rem 0.5rem',
      borderRadius: '999px',
      marginTop: '0.2rem',
    }}>
      {config.label}
    </span>
  );
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
