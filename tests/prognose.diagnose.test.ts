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

import { describe, it, expect, vi } from 'vitest';

// Legacy regressiefixture (Bos, V.) gebouwd tegen het 19-deelgebieden/3-leerlijnen-
// schema — zie tests/prognosis.test.ts voor de toelichting.
vi.mock('../src/config/leerlijn.json', () => ({
  default: {
    deelgebieden: [
      { id: 'va',   label: 'V&A',  group: 'lesgeven' },
      { id: 'mm',   label: 'M&M',  group: 'lesgeven' },
      { id: 'ins',  label: 'INS',  group: 'lesgeven' },
      { id: 'odw',  label: 'O&DW', group: 'lesgeven' },
      { id: 'cb',   label: 'C&B',  group: 'lesgeven' },
      { id: 'eb1',  label: '1E&B', group: 'lesgeven' },
      { id: 'po',   label: 'P&O',  group: 'organiseren' },
      { id: 'so',   label: 'S&O',  group: 'organiseren' },
      { id: 'org',  label: 'ORG',  group: 'organiseren' },
      { id: 'ib',   label: 'I&B',  group: 'organiseren' },
      { id: 'eb2',  label: '2E&B', group: 'organiseren' },
      { id: 'prco', label: 'PrCo', group: 'prof_handelen' },
      { id: 'vsk',  label: 'VSK',  group: 'prof_handelen' },
      { id: 'lob',  label: 'LOB',  group: 'prof_handelen' },
      { id: 'info', label: 'INFO', group: 'prof_handelen' },
      { id: 'desk', label: 'DESK', group: 'prof_handelen' },
      { id: 'bs',   label: 'BS',   group: 'prof_handelen' },
      { id: 'tow',  label: 'TOW',  group: 'prof_handelen' },
      { id: 'bh',   label: 'BH',   group: 'prof_handelen' },
    ],
  },
}));

import { berekenPrognose } from '../utils/prognosis';
import { detectTraject } from '../src/utils/status';
import { STATUS_STRINGS } from '../parsers/pdf-status';

// ---------------------------------------------------------------------------
// VULL DIT IN — kopieer uit de [fixture-dump] in de console
// ---------------------------------------------------------------------------

const student: any = {
  naam:     'Bos, V. (Viggo)',
  periode:  'BJ2 Fase 3 DD',
  leerjaar: '2',
  deelgebiedScores: {
    'V&A':  'voldoende',
    'M&M':  'voldoende',
    'INS':  'voldoende',
    'O&DW': 'goed',
    'C&B':  'excellent',
    '1E&B': 'voldoende',
    'P&O':  null,
    'S&O':  null,
    'ORG':  'voldoende',
    'I&B':  null,
    '2E&B': null,
    'PrCo': 'voldoende',
    'VSK':  null,
    'LOB':  'goed',
    'INFO': 'voldoende',
    'DESK': 'voldoende',
    'BS':   'voldoende',
    'TOW':  'voldoende',
    'BH':   null,
  },
  verzuim: { geoorloofd: 0, ongeoorloofd: 0 },
};

// VERWACHTE uitkomst — BIJGEWERKT voor M42 T9a (berekenBj2GeneriekPad):
//   traject:  'bj2'  (periode "BJ2 Fase 3 DD" → detectTraject geeft bj2)
//   leerjaar: '2'    — correct afgeleid uit periode (R-01a fix werkt)
//
// De oorspronkelijke handmatige berekening hieronder (VOOR T9a, bewaard voor
// context) rekende met de inmiddels afgeschafte deelgebieden-count-only
// formule (KERN_SBC, SBL≥13/SBC≥15, D13/D17 hebben dat allebei vervangen):
//   totaalV:  13     (lesgeven 6/6 + organiseren 1/5 + prof_handelen 6/8)
//   SBL vereist ≥13 → 13 ≥ 13 → JA; SBC vereist ≥15 → 13 < 15 → NEE
//   → (OUDE motor) label = 'sbl'
//
// De ECHTE, huidige berekenBj2GeneriekPad-criteria (VestigingNormen) vereisen
// behalve een deelgebieden-count ook Nederlands/Rekenen/KD/(SBC: WVO) — geen
// van die velden staat op deze legacy-fixture (geen nederlandsResultaat,
// rekenResultaat, keuzedelen/kdStatus, of Rekenen-domein-datapunten) — dus
// zowel de SBC- als de SBL-criteria falen nu op die ontbrekende velden,
// ongeacht de deelgebieden-count. Nieuwe verwachte uitkomst: 'bespreekgeval'
// (D17: BJ2's nieuwe, eigen fallback-label — geen negatief-tier meer).
// Vestiging ('goes', triviale Roosendaal-levels-eis) toegevoegd aan de
// berekenPrognose-aanroep hieronder — zonder vestiging geeft de nieuwe
// vestiging-null-guard altijd 'normen_onbekend' terug, wat deze diagnose-
// fixture zinloos zou maken.
const verwachtLabel = 'bespreekgeval';

// ---------------------------------------------------------------------------

describe('parser leerjaar-afleiding uit periode', () => {
  // Cumlaude exporteert altijd "Leerjaar 1" in de PDF-header, ook voor BJ2-leerlingen.
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
    // 'goes' vestiging (M42 T9a: bj2 heeft nu een vestiging nodig, anders
    // normen_onbekend via de vestiging-null-guard — zie comment bij verwachtLabel).
    const p = berekenPrognose(student, traject, undefined, undefined, 'goes');

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

describe('parser STATUS_STRINGS — alle Cumlaude-statussen herkend', () => {
  it('bevat alle bekende Cumlaude-statussen', () => {
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
