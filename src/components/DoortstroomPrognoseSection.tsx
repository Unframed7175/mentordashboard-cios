import React, { useState } from 'react';
import { StatusResult, detectTraject } from '../utils/status';
import { getNormenSync } from '../utils/normen';

interface DoortstroomPrognoseSectionProps {
  student: any;
  status: StatusResult;
}

type GapType = 'danger' | 'warn' | 'ok' | 'info';

interface GapItem {
  label: string;
  type: GapType;
}

const LEERLIJN_LABEL: Record<string, string> = {
  lesgeven: 'Lesgeven',
  organiseren: 'Organiseren',
  prof_handelen: 'Professioneel handelen',
};

/** Shared warnings: negatief advies + onvoldoende ruimte per leerlijn. */
function computeAlgemeneItems(p: any): GapItem[] {
  const n = getNormenSync();
  const items: GapItem[] = [];
  if (p.isNegatief) {
    items.push({
      label: `Negatief advies: ${p.totaalOnvoldoende} onvoldoende(s) — max. ${n.negatiefTotaal} totaal, max. ${n.negatiefPerLeerlijn} per leerlijn`,
      type: 'danger',
    });
  } else {
    const ruimte = p.gaps.onvoldoendeRuimte;
    if (ruimte <= 1) {
      items.push({
        label: `Opgelet: nog maar ${ruimte} onvoldoende(s) toegestaan (${p.totaalOnvoldoende}/${n.negatiefTotaal} O)`,
        type: 'warn',
      });
    }
    for (const [ll, r] of Object.entries(p.gaps.onvoldoendeRuimtePerLeerlijn || {})) {
      if ((r as number) <= 0) {
        items.push({ label: `${LEERLIJN_LABEL[ll] || ll}: max. ${n.negatiefPerLeerlijn} O per leerlijn bereikt`, type: 'warn' });
      }
    }
  }
  return items;
}

/** SBL-focused criteria for BJ2 students. */
function computeSBLItems(p: any): GapItem[] {
  const n = getNormenSync();
  if (p.traject !== 'bj2') return [];
  const { nodigSBL } = p.gaps;
  return [
    nodigSBL === 0
      ? { label: `SBL-norm gehaald (${p.totaalVoldoendeOfHoger}/19 ≥V, norm ≥${n.sbl})`, type: 'ok' as GapType }
      : { label: `Nog ${nodigSBL} deelgebied(en) ≥V nodig voor SBL (nu ${p.totaalVoldoendeOfHoger}/19, norm ≥${n.sbl})`, type: 'warn' as GapType },
  ];
}

/** SBC-focused criteria for BJ2 students. */
function computeSBCItems(p: any): GapItem[] {
  const n = getNormenSync();
  if (p.traject !== 'bj2') return [];
  const { nodigSBC_deelgebieden, nodigSBC_kern } = p.gaps;
  const items: GapItem[] = [];
  if (nodigSBC_deelgebieden === 0 && nodigSBC_kern.length === 0) {
    items.push({ label: `SBC-norm gehaald (≥${n.sbc} ≥V + alle kerndeelgebieden)`, type: 'ok' });
  } else {
    if (nodigSBC_deelgebieden > 0) {
      items.push({
        label: `SBC: nog ${nodigSBC_deelgebieden} deelgebied(en) ≥V nodig (nu ${p.totaalVoldoendeOfHoger}/19, norm ≥${n.sbc})`,
        type: 'info',
      });
    }
    if (nodigSBC_kern.length > 0) {
      items.push({ label: `SBC kerndeelgebieden nog niet ≥V: ${nodigSBC_kern.join(', ')}`, type: 'info' });
    }
  }
  return items;
}

/** BJ1 criteria (no SBC/SBL toggle — shows BJ2 doorstroom + versneld SBC). */
function computeBJ1Items(p: any): GapItem[] {
  const n = getNormenSync();
  const { nodigBJ2, nodigVersneld_lesgeven: nvL, nodigVersneld_organiseren: nvO, nodigVersneld_profHandelen: nvP } = p.gaps;
  const items: GapItem[] = [];
  items.push(
    nodigBJ2 === 0
      ? { label: `BJ2-norm gehaald (${p.totaalVoldoendeOfHoger}/19 ≥V, norm ≥${n.bj1Positief})`, type: 'ok' }
      : { label: `Nog ${nodigBJ2} deelgebied(en) ≥V nodig voor doorstroom BJ2`, type: 'warn' }
  );
  if (nvL === 0 && nvO === 0 && nvP === 0) {
    items.push({ label: 'Versneld SBC-norm gehaald', type: 'ok' });
  } else {
    const tekort = [
      nvL > 0 && `Lesgeven nog ${nvL} ≥G`,
      nvO > 0 && `Organiseren nog ${nvO} ≥G`,
      nvP > 0 && `Prof. handelen nog ${nvP} ≥G`,
    ].filter(Boolean);
    items.push({ label: `Versneld SBC: ${tekort.join(' · ')}`, type: 'info' });
  }
  return items;
}

export default function DoortstroomPrognoseSection({ student, status }: DoortstroomPrognoseSectionProps) {
  const [normView, setNormView] = useState<'sbl' | 'sbc'>('sbl');

  // Use pre-computed prognose from status — do NOT call berekenPrognose again
  const p = status.prognose;
  const traject = detectTraject(student);
  const trajectLabel = traject === 'bj1' ? 'BJ1' : 'BJ2';

  // Build gap items based on traject and selected norm view
  const algemeen = computeAlgemeneItems(p);
  let normItems: GapItem[];
  if (traject === 'bj1') {
    normItems = computeBJ1Items(p);
  } else {
    normItems = normView === 'sbl' ? computeSBLItems(p) : computeSBCItems(p);
  }
  const gapItems = [...algemeen, ...normItems];

  return (
    <div className="detail-section">
      <p className="detail-section-title">Doorstroomprognose</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <span className={`status-badge status-${status.kleur}`}>{status.label}</span>
        <span className="traject-tag">Traject: {trajectLabel}</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {p.totaalVoldoendeOfHoger}/19 ≥V &nbsp;·&nbsp; {p.totaalOnvoldoende} onvoldoende
        </span>
        {/* SBL / SBC toggle — only shown for BJ2 students */}
        {traject === 'bj2' && (
          <div className="norm-toggle" style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
            <button
              className={`norm-btn${normView === 'sbl' ? ' active' : ''}`}
              onClick={() => setNormView('sbl')}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: normView === 'sbl' ? 'var(--accent)' : 'transparent',
                color: normView === 'sbl' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              SBL
            </button>
            <button
              className={`norm-btn${normView === 'sbc' ? ' active' : ''}`}
              onClick={() => setNormView('sbc')}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: normView === 'sbc' ? 'var(--accent)' : 'transparent',
                color: normView === 'sbc' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              SBC
            </button>
          </div>
        )}
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
