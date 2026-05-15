import React from 'react';
import { StatusResult, detectTraject } from '../utils/status';

interface DoortstroomPrognoseSectionProps {
  student: any;
  status: StatusResult;
}

type GapType = 'danger' | 'warn' | 'ok' | 'info';

interface GapItem {
  label: string;
  type: GapType;
}

/**
 * Compute gap items from the prognose object.
 * Mirrors app.js buildDetailPrognose() lines 1598-1645.
 */
function computeGapItems(p: any): GapItem[] {
  const items: GapItem[] = [];

  if (p.isNegatief) {
    items.push({
      label: `Negatief advies: ${p.totaalOnvoldoende} onvoldoende(s) — max. 6 totaal, max. 2 per leerlijn`,
      type: 'danger',
    });
  } else {
    const ruimte = p.gaps.onvoldoendeRuimte;
    if (ruimte <= 1) {
      items.push({
        label: `Opgelet: nog maar ${ruimte} onvoldoende(s) toegestaan (${p.totaalOnvoldoende}/6 O)`,
        type: 'warn',
      });
    }
    const perLeerlijn: Record<string, number> = p.gaps.onvoldoendeRuimtePerLeerlijn || {};
    const leerlijnenLabel: Record<string, string> = {
      lesgeven: 'Lesgeven',
      organiseren: 'Organiseren',
      prof_handelen: 'Professioneel handelen',
    };
    for (const [ll, r] of Object.entries(perLeerlijn)) {
      if ((r as number) <= 0) {
        items.push({
          label: `${leerlijnenLabel[ll] || ll}: max. 2 O per leerlijn bereikt`,
          type: 'warn',
        });
      }
    }
  }

  if (p.traject === 'bj2') {
    const { nodigSBL, nodigSBC_deelgebieden, nodigSBC_kern } = p.gaps;
    items.push(
      nodigSBL === 0
        ? { label: `SBL-norm gehaald (${p.totaalVoldoendeOfHoger}/19 ≥V, norm ≥13)`, type: 'ok' }
        : { label: `Nog ${nodigSBL} deelgebied(en) ≥V nodig voor SBL (nu ${p.totaalVoldoendeOfHoger}/19)`, type: 'warn' }
    );
    if (nodigSBC_deelgebieden === 0 && nodigSBC_kern.length === 0) {
      items.push({ label: 'SBC-norm gehaald (≥15 ≥V + alle kerndeelgebieden)', type: 'ok' });
    } else {
      if (nodigSBC_deelgebieden > 0) {
        items.push({
          label: `SBC: nog ${nodigSBC_deelgebieden} deelgebied(en) ≥V nodig (nu ${p.totaalVoldoendeOfHoger}/19, norm ≥15)`,
          type: 'info',
        });
      }
      if (nodigSBC_kern.length > 0) {
        items.push({
          label: `SBC kerndeelgebieden nog niet ≥V: ${nodigSBC_kern.join(', ')}`,
          type: 'info',
        });
      }
    }
  } else {
    // bj1
    const { nodigBJ2, nodigVersneld_lesgeven: nvL, nodigVersneld_organiseren: nvO, nodigVersneld_profHandelen: nvP } = p.gaps;
    items.push(
      nodigBJ2 === 0
        ? { label: `BJ2-norm gehaald (${p.totaalVoldoendeOfHoger}/19 ≥V, norm ≥13)`, type: 'ok' }
        : { label: `Nog ${nodigBJ2} deelgebied(en) ≥V nodig voor doorstroom BJ2`, type: 'warn' }
    );
    if (nvL === 0 && nvO === 0 && nvP === 0) {
      items.push({ label: 'Versneld SBC-norm gehaald', type: 'ok' });
    } else {
      const tekort = [
        nvL > 0 && `lesgeven nog ${nvL} ≥G`,
        nvO > 0 && `org. nog ${nvO} ≥G`,
        nvP > 0 && `prof.handelen nog ${nvP} ≥G`,
      ].filter(Boolean);
      items.push({ label: `Versneld SBC: ${tekort.join(' · ')}`, type: 'info' });
    }
  }

  return items;
}

export default function DoortstroomPrognoseSection({ student, status }: DoortstroomPrognoseSectionProps) {
  // Use pre-computed prognose from status — do NOT call berekenPrognose again
  const p = status.prognose;
  const trajectLabel = detectTraject(student) === 'bj1' ? 'BJ1' : 'BJ2';
  const gapItems = computeGapItems(p);

  return (
    <div className="detail-section">
      <p className="detail-section-title">Doorstroomprognose</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <span className={`status-badge status-${status.kleur}`}>{status.label}</span>
        <span className="traject-tag">Traject: {trajectLabel}</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {p.totaalVoldoendeOfHoger}/19 ≥V &nbsp;·&nbsp; {p.totaalOnvoldoende} onvoldoende
        </span>
      </div>
      <div className="gap-items">
        {gapItems.map((item, idx) => (
          <div key={idx} className={`gap-item gap-${item.type}`}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
