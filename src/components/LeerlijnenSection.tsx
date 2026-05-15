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
          const pct = ll.totaal > 0 ? Math.round((ll.voldoendeOfHoger / ll.totaal) * 100) : 0;
          const onvoldoendeStyle: React.CSSProperties =
            ll.onvoldoende > 2
              ? { color: 'var(--status-rood-text)', fontWeight: 700 }
              : {};

          return (
            <div key={ll.leerlijn} className="leerlijn-row">
              <span className="leerlijn-naam">
                {LEERLIJN_LABEL[ll.leerlijn] || ll.leerlijn} ({ll.totaal})
              </span>
              <span className="leerlijn-stat">
                {ll.voldoendeOfHoger}/{ll.totaal} &ge;V
              </span>
              <span className="leerlijn-stat" style={onvoldoendeStyle}>
                {ll.onvoldoende} O
              </span>
              <span className="leerlijn-stat" style={{ color: 'var(--text-faint)' }}>
                {ll.onbeoordeeld} ?
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
