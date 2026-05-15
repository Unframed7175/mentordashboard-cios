import React from 'react';

interface LeerlijnenSectionProps {
  prognose: any;
}

const LEERLIJN_LABEL: Record<string, string> = {
  lesgeven: 'Lesgeven',
  organiseren: 'Organiseren',
  prof_handelen: 'Prof. handelen',
};

export default function LeerlijnenSection({ prognose }: LeerlijnenSectionProps) {
  const leerlijnen: any[] = prognose?.leerlijnen ?? [];

  return (
    <div className="detail-section">
      <p className="detail-section-title">Per leerlijn</p>
      <div className="leerlijn-rows">
        {leerlijnen.map((ll: any) => {
          // WR-09: Apply ?? 0 fallbacks to prevent rendering "undefined" or NaN when
          // berekenPrognose returns leerlijn objects with missing fields.
          const voldoendeOfHoger = ll.voldoendeOfHoger ?? 0;
          const onvoldoende = ll.onvoldoende ?? 0;
          const onbeoordeeld = ll.onbeoordeeld ?? 0;
          const totaal = ll.totaal ?? 0;
          const pct = totaal > 0 ? Math.round((voldoendeOfHoger / totaal) * 100) : 0;
          const onvoldoendeStyle: React.CSSProperties =
            onvoldoende > 2
              ? { color: 'var(--status-rood-text)', fontWeight: 700 }
              : {};

          return (
            <div key={ll.leerlijn} className="leerlijn-row">
              <span className="leerlijn-naam">
                {LEERLIJN_LABEL[ll.leerlijn] || ll.leerlijn} ({totaal})
              </span>
              <span className="leerlijn-stat">
                {voldoendeOfHoger}/{totaal} &ge;V
              </span>
              <span className="leerlijn-stat" style={onvoldoendeStyle}>
                {onvoldoende} O
              </span>
              <span className="leerlijn-stat" style={{ color: 'var(--text-faint)' }}>
                {onbeoordeeld} ?
              </span>
              <div className="leerlijn-bar-track">
                <div className="leerlijn-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
