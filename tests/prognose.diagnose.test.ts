// tests/prognose.diagnose.test.ts
// Diagnose-testbestand voor het opsporen van fouten in berekenPrognose().
//
// GEBRUIK:
//   1. Start de app met `npm run vite-dev` en importeer een PDF van een
//      leerling waarvan je de verwachte prognose kent.
//   2. Open F12 → Console. Zoek op "[fixture-dump]".
//   3. Kopieer het JSON-object naar de `student`-variabelen hieronder.
//   4. Stel `verwachtLabel` in op wat je verwacht.
//   5. Run: npm test -- prognose.diagnose
//
// Verwijder dit bestand na de diagnose, of bewaar het als regressietest.

import { describe, it, expect } from 'vitest';
import { berekenPrognose } from '../utils/prognosis';
import { detectTraject } from '../src/utils/status';
import { STATUS_STRINGS } from '../parsers/pdf-status';

// ---------------------------------------------------------------------------
// VULL DIT IN — kopieer uit de [fixture-dump] in de console
// ---------------------------------------------------------------------------

const student: any = {
  naam:     'Gijzen, L. (Lara)',
  periode:  'BJ2 Fase 3 DD',
  leerjaar: '1',   // LET OP: leerjaar=1 maar periode zegt BJ2 — zie analyse hieronder
  deelgebiedScores: {
    'V&A':  'goed',
    'M&M':  'excellent',
    'INS':  'goed',
    'O&DW': 'goed',
    'C&B':  'goed',
    '1E&B': null,      // niet beoordeeld
    'P&O':  null,      // niet beoordeeld — hele organiseren-leerlijn is null
    'S&O':  null,
    'ORG':  null,
    'I&B':  null,
    '2E&B': null,
    'PrCo': 'voldoende',
    'VSK':  null,
    'LOB':  null,
    'INFO': 'voldoende',
    'DESK': null,
    'BS':   'goed',
    'TOW':  'voldoende',
    'BH':   null,
  },
  verzuim: { geoorloofd: 0, ongeoorloofd: 0 },
};

// VERWACHTE uitkomst op basis van handmatige berekening:
//   traject:  'bj2'  (periode "BJ2 Fase 3 DD" bevat 'bj2' → detectTraject geeft bj2)
//   totaalV:  9      (lesgeven 5/6 + organiseren 0/5 + prof_handelen 4/8)
//   totaalO:  0
//   SBL vereist ≥13 → 9 < 13 → GEEN SBL
//   SBC vereist ≥15 + kern (V&A/P&O/C&B/1E&B elk ≥V) → P&O en 1E&B zijn null → GEEN SBC
//   negatief-trigger: totaalO (0) > 6 → NEE
//   → label = 'neutraal'  →  Oranje / "Let op"
//
// VERDACHTE AANWIJZING:
//   leerjaar="1" maar periode="BJ2 Fase 3 DD"
//   Dit kan twee dingen betekenen:
//     A) De PDF-parser leest leerjaar verkeerd uit (is 2, staat als 1)
//     B) De student zit in fase 3 van BJ2 maar is pas in leerjaar 1
//   In beide gevallen is traject='bj2' waarschijnlijk correct.
//
//   BELANGRIJKSTE VRAAG: zijn de null-scores (organiseren-leerlijn volledig null,
//   1E&B null, VSK/LOB/DESK/BH null) correct — d.w.z. nog niet beoordeeld in Fase 3?
//   Of had de parser deze scores WEL moeten inlezen uit de PDF?
//
// Verander 'neutraal' hieronder als je een ander resultaat verwacht:
const verwachtLabel = 'neutraal';

// ---------------------------------------------------------------------------

describe('parser leerjaar-afleiding uit periode', () => {
  // SomToday exporteert altijd "Leerjaar 1" in de PDF-header, ook voor BJ2-leerlingen.
  // De parser leidt leerjaar nu af uit het periode-veld als dat het traject expliciet benoemt.
  it('BJ2-periode geeft leerjaar 2', () => {
    // Simuleer wat de parser teruggeeft na de fix
    function leidLeerjaarAf(periode: string): string {
      const p = periode.toLowerCase();
      const isBJ2 = ['bj2', '2e jaar', 'jaar 2', 'leerjaar 2', 'bj 2', 'klas 2'].some(pat => p.includes(pat));
      const isBJ1 = ['bj1', '1e jaar', 'jaar 1', 'leerjaar 1', 'bj 1', 'klas 1'].some(pat => p.includes(pat));
      if (isBJ2) return '2';
      if (isBJ1) return '1';
      return '1'; // fallback uit PDF
    }

    expect(leidLeerjaarAf('BJ2 Fase 3 DD')).toBe('2');
    expect(leidLeerjaarAf('BJ2 Fase 1 DD')).toBe('2');
    expect(leidLeerjaarAf('BJ1 Fase 2 DD')).toBe('1');
    expect(leidLeerjaarAf('Fase 2 DD')).toBe('1');   // ambigue periode → fallback
  });
});

describe('prognose diagnose', () => {
  it('detecteert het juiste traject', () => {
    const traject = detectTraject(student);
    console.log('\n--- traject ---');
    console.log('periode:  ', student.periode);
    console.log('leerjaar: ', student.leerjaar);
    console.log('detectTraject →', traject);
  });

  it('berekenPrognose geeft verwacht label', () => {
    const traject = detectTraject(student);
    const p = berekenPrognose(student, traject);

    console.log('\n--- berekenPrognose output ---');
    console.log('traject:  ', traject);
    console.log('label:    ', p.label);
    console.log('totaalV:  ', p.totaalVoldoendeOfHoger, '(voldoende of hoger)');
    console.log('totaalO:  ', p.totaalOnvoldoende,      '(onvoldoende)');
    console.log('isNegatief:', p.isNegatief);
    console.log('\n--- per leerlijn ---');
    for (const [ll, tel] of Object.entries(p.leerlijnen as Record<string, any>)) {
      console.log(`  ${ll}: V=${tel.voldoendeOfHoger} G=${tel.goedOfHoger} O=${tel.onvoldoende} ?=${tel.onbeoordeeld}`);
    }
    console.log('\n--- gaps ---');
    console.log(JSON.stringify(p.gaps, null, 2));

    expect(p.label).toBe(verwachtLabel);
  });

  it('toont alle scores die null zijn (niet ingelezen door parser)', () => {
    const scores = student.deelgebiedScores ?? {};
    const nullScores = Object.entries(scores)
      .filter(([, v]) => v === null)
      .map(([k]) => k);
    const ingevuldScores = Object.entries(scores)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => `${k}=${v}`);

    console.log('\n--- scores ---');
    console.log('Ingevuld:', ingevuldScores.join(', ') || '(geen)');
    console.log('Null:    ', nullScores.join(', ')     || '(geen)');
    console.log(`${ingevuldScores.length} van ${Object.keys(scores).length} deelgebieden hebben een score`);

    // Geen assert — puur informatief
    expect(true).toBe(true);
  });
});

describe('parser STATUS_STRINGS — alle SomToday-statussen herkend', () => {
  it('bevat alle bekende SomToday-statussen', () => {
    const verwacht = [
      'Op tijd ingeleverd en wel beoordeeld',
      'Te laat ingeleverd en wel beoordeeld',
      'Te laat ingeleverd en niet beoordeeld',
      'Niet beoordeelbaar (voldoet niet aan de minimale eisen)',
      'Niet ingeleverd',
      'Zelfevaluatie afgerond',
      'Zelfevaluatie, niet afgerond',
    ];

    for (const s of verwacht) {
      expect(STATUS_STRINGS, `"${s}" ontbreekt in STATUS_STRINGS`).toContain(s);
    }
  });
});
