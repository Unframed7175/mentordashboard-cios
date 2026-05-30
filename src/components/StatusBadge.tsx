import React from 'react';

type StatusKleur = 'groen' | 'oranje' | 'rood' | 'grijs';

interface StatusConfig {
  label: string;
  kleur: StatusKleur;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  'op tijd ingeleverd en wel beoordeeld':                       { label: 'Op tijd ✓',             kleur: 'groen'  },
  'te laat ingeleverd en wel beoordeeld':                       { label: 'Te laat ✓',              kleur: 'oranje' },
  'te laat ingeleverd en niet beoordeeld':                      { label: 'Te laat — niet beoord.', kleur: 'rood'   },
  'niet beoordeelbaar (voldoet niet aan de minimale eisen)':    { label: 'Niet beoordeelbaar',     kleur: 'rood'   },
  'niet ingeleverd':                                            { label: 'Niet ingeleverd',        kleur: 'rood'   },
  'zelfevaluatie afgerond':                                     { label: 'Zelfevaluatie ✓',        kleur: 'groen'  },
  'zelfevaluatie, niet afgerond':                               { label: 'Zelfevaluatie ✗',        kleur: 'oranje' },
  'beoordeeld':                                                 { label: 'Beoordeeld',             kleur: 'groen'  },
};

const BADGE_STYLE: Record<StatusKleur, React.CSSProperties> = {
  groen:  { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  oranje: { background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' },
  rood:   { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
  grijs:  { background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' },
};

export default function StatusBadge({ status }: { status: string }) {
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
