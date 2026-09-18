// ---------------------------------------------------------------------------
// datapuntTelling.test.ts — telDatapuntenMetPatroon + 3 specialisaties (M42 T4/T5/T6b)
//
// Investigation findings baked into these fixtures (see task-T4T5T6b-report.md):
//  - vak 'Betekenisvol Bewegen' (exact, no suffix) contains exactly 4 datapunten
//    named 'BVB Professionele houding 1..4', scored on deelgebied-column 'PrHo'
//    (confirmed via real PDF export + src/config/leerlijn.json label field).
//  - 'Rekenen -eindtoets domein N' datapunten carry an 'F<n> ' fase-prefix in
//    real data (e.g. 'F2 Rekenen ‐eindtoets domein 1') and use a non-ASCII
//    hyphen before 'eindtoets' — the brief's /Rekenen.*eindtoets domein/i regex
//    tolerates both.
//  - 'Level N <activiteit>' is the only real word order found in source PDFs;
//    the reverse ('<activiteit> level N') is a defensive case per the brief's
//    explicit design instruction, not something found in real data — a plain
//    /\blevel\s*N\b/i test covers both since 'level' always immediately
//    precedes the digit in both variants.
// ---------------------------------------------------------------------------

import {
  telDatapuntenMetPatroon,
  telBetekenisvolBewegenProfHouding,
  telRekenDomeinen,
  alleLevelsBehaald,
  telLevelsAfgerond,
} from '../utils/datapuntTelling';

// ── telDatapuntenMetPatroon (shared helper) ────────────────────────────────

describe('telDatapuntenMetPatroon', () => {
  it('lege datapunten array geeft { totaal: 0, voldoet: 0 }', () => {
    expect(telDatapuntenMetPatroon([], () => true, () => true)).toEqual({ totaal: 0, voldoet: 0 });
  });

  it('alle matchen en alle voldoen', () => {
    const dp = [{ vak: 'X', datapunt: 'a', scores: {} }, { vak: 'X', datapunt: 'b', scores: {} }];
    expect(telDatapuntenMetPatroon(dp, () => true, () => true)).toEqual({ totaal: 2, voldoet: 2 });
  });

  it('sommige matchen, sommige daarvan voldoen', () => {
    const dp = [
      { vak: 'X', datapunt: 'a', scores: {} },
      { vak: 'Y', datapunt: 'b', scores: {} },
      { vak: 'X', datapunt: 'c', scores: {} },
    ];
    const result = telDatapuntenMetPatroon(
      dp,
      d => d.vak === 'X',
      d => d.datapunt === 'a',
    );
    expect(result).toEqual({ totaal: 2, voldoet: 1 });
  });

  it('niets matcht', () => {
    const dp = [{ vak: 'X', datapunt: 'a', scores: {} }];
    expect(telDatapuntenMetPatroon(dp, () => false, () => true)).toEqual({ totaal: 0, voldoet: 0 });
  });
});

// ── telBetekenisvolBewegenProfHouding ───────────────────────────────────────

describe('telBetekenisvolBewegenProfHouding', () => {
  function bvb(n: number, prho: string | null) {
    return { vak: 'Betekenisvol Bewegen', datapunt: `BVB Professionele houding ${n}`, scores: { PrHo: prho } };
  }

  it('telt alleen Betekenisvol Bewegen-rijen, negeert andere vakken', () => {
    const datapunten = [
      bvb(1, 'goed'),
      bvb(2, 'voldoende'),
      bvb(3, 'onvoldoende'),
      bvb(4, null),
      { vak: 'Rekenen', datapunt: 'F2 Rekenen ‐eindtoets domein 1', scores: { PrHo: 'goed' } }, // must NOT count
      { vak: 'Betekenisvol Bewegen (Praktijk)', datapunt: '‐ P&O Voetbal 1', scores: {} }, // must NOT count — different vak (sportvakken-opdrachttabel, see investigation)
    ];
    const result = telBetekenisvolBewegenProfHouding(datapunten);
    expect(result.totaal).toBe(4);
    expect(result.voldoet).toBe(2); // goed + voldoende
  });

  it('leeg datapunten array geeft { totaal: 0, voldoet: 0 }', () => {
    expect(telBetekenisvolBewegenProfHouding([])).toEqual({ totaal: 0, voldoet: 0 });
  });

  it('alle 4 voldoende of hoger', () => {
    const datapunten = [bvb(1, 'voldoende'), bvb(2, 'goed'), bvb(3, 'excellent'), bvb(4, 'goed')];
    expect(telBetekenisvolBewegenProfHouding(datapunten)).toEqual({ totaal: 4, voldoet: 4 });
  });
});

// ── telRekenDomeinen ─────────────────────────────────────────────────────────

describe('telRekenDomeinen', () => {
  function domein(n: number, status: string) {
    return { vak: 'Rekenen', datapunt: `F2 Rekenen ‐eindtoets domein ${n}`, scores: {}, status };
  }

  it('0 domeinen afgerond', () => {
    const student = { datapunten: [domein(1, ''), domein(2, ''), domein(3, '')], rekenResultaat: null };
    expect(telRekenDomeinen(student).domeinenAfgerond).toBe(0);
  });

  it('1 domein afgerond (positieve inleverstatus)', () => {
    const student = {
      datapunten: [
        domein(1, 'Op tijd ingeleverd en wel beoordeeld'),
        domein(2, 'niet ingeleverd'),
        domein(3, ''),
      ],
      rekenResultaat: null,
    };
    expect(telRekenDomeinen(student).domeinenAfgerond).toBe(1);
  });

  it('2 domeinen afgerond', () => {
    const student = {
      datapunten: [
        domein(1, 'Op tijd ingeleverd en wel beoordeeld'),
        domein(2, 'Te laat ingeleverd en wel beoordeeld'),
        domein(3, 'niet ingeleverd'),
      ],
      rekenResultaat: null,
    };
    expect(telRekenDomeinen(student).domeinenAfgerond).toBe(2);
  });

  it('3 domeinen afgerond', () => {
    const student = {
      datapunten: [
        domein(1, 'Op tijd ingeleverd en wel beoordeeld'),
        domein(2, 'Op tijd ingeleverd en wel beoordeeld'),
        domein(3, 'Zelfevaluatie afgerond'),
      ],
      rekenResultaat: null,
    };
    expect(telRekenDomeinen(student).domeinenAfgerond).toBe(3);
  });

  it('negeert niet-domein Rekenen-datapunten (bv. Instaptoetsen)', () => {
    const student = {
      datapunten: [
        { vak: 'Rekenen', datapunt: 'F1 Instaptoetsen', scores: {}, status: 'Op tijd ingeleverd en wel beoordeeld' },
        domein(1, 'Op tijd ingeleverd en wel beoordeeld'),
      ],
      rekenResultaat: null,
    };
    expect(telRekenDomeinen(student).domeinenAfgerond).toBe(1);
  });

  it.each([
    ['3f', 'goed'],
    ['2f', 'voldoende'],
    ['1f', 'onvoldoende'],
    [null, null],
    ['', null],
  ])('niveau voor rekenResultaat=%s is %s', (raw, expected) => {
    const student = { datapunten: [], rekenResultaat: raw };
    expect(telRekenDomeinen(student).niveau).toBe(expected);
  });
});

// ── alleLevelsBehaald ────────────────────────────────────────────────────────

describe('alleLevelsBehaald', () => {
  function level(label: string, status: string) {
    return { vak: 'Extern praktijkleren', datapunt: label, scores: {}, status };
  }

  it('geen matchende Level-N datapunten → false (niet vacuously true)', () => {
    const datapunten = [level('Level 3 lesgeven', 'Op tijd ingeleverd en wel beoordeeld')];
    expect(alleLevelsBehaald(datapunten, 1)).toBe(false);
  });

  it('lege datapunten array → false', () => {
    expect(alleLevelsBehaald([], 1)).toBe(false);
  });

  it('alle gevonden Level 2-datapunten afgerond → true', () => {
    const datapunten = [
      level('Level 2 lesgeven', 'Op tijd ingeleverd en wel beoordeeld'),
      level('Level 2 organiseren', 'Zelfevaluatie afgerond'),
      level('Level 1 lesgeven', 'niet ingeleverd'), // different level, irrelevant
    ];
    expect(alleLevelsBehaald(datapunten, 2)).toBe(true);
  });

  it('één van de gevonden Level 2-datapunten niet afgerond → false', () => {
    const datapunten = [
      level('Level 2 lesgeven', 'Op tijd ingeleverd en wel beoordeeld'),
      level('Level 2 organiseren', 'niet ingeleverd'),
    ];
    expect(alleLevelsBehaald(datapunten, 2)).toBe(false);
  });

  it('woordvolgorde: "Level 2 lesgeven" en "Organiseren level 2" tellen allebei mee voor level 2', () => {
    const datapunten = [
      level('Level 2 lesgeven', 'Op tijd ingeleverd en wel beoordeeld'),
      level('Organiseren level 2', 'Zelfevaluatie afgerond'),
    ];
    const result = alleLevelsBehaald(datapunten, 2);
    expect(result).toBe(true);
  });

  it('digit-boundary: "Level 1" matcht niet per ongeluk "Level 10"', () => {
    const datapunten = [level('Level 10 lesgeven', 'Op tijd ingeleverd en wel beoordeeld')];
    // Only a 'Level 10' datapunt exists — level 1 must find zero matches → false.
    expect(alleLevelsBehaald(datapunten, 1)).toBe(false);
  });
});

// ── telLevelsAfgerond (M42 T8 — ADR-17c Roosendaal-levels-COUNT) ───────────────
// Anders dan alleLevelsBehaald (één specifiek level-nummer, all-or-nothing),
// telt dit ELK level-nummer mee in één COUNT — precies wat de Roosendaal-
// "minimaal N levels afgerond"-eis nodig heeft (task-T8-brief.md).

describe('telLevelsAfgerond', () => {
  function level(label: string, status: string) {
    return { vak: 'Extern praktijkleren', datapunt: label, scores: {}, status };
  }

  it('lege datapunten array → 0', () => {
    expect(telLevelsAfgerond([])).toBe(0);
  });

  it('telt afgeronde Level-N datapunten over VERSCHILLENDE level-nummers heen', () => {
    const datapunten = [
      level('Level 1 lesgeven', 'Op tijd ingeleverd en wel beoordeeld'),
      level('Level 2 lesgeven', 'Zelfevaluatie afgerond'),
      level('Organiseren level 3', 'Op tijd ingeleverd en wel beoordeeld'),
    ];
    expect(telLevelsAfgerond(datapunten)).toBe(3);
  });

  it('niet-afgeronde Level-N datapunten tellen niet mee', () => {
    const datapunten = [
      level('Level 1 lesgeven', 'niet ingeleverd'),
      level('Level 2 lesgeven', ''),
      level('Level 3 lesgeven', 'Op tijd ingeleverd en wel beoordeeld'),
    ];
    expect(telLevelsAfgerond(datapunten)).toBe(1);
  });

  it('negeert niet-Level datapunten', () => {
    const datapunten = [
      { vak: 'Rekenen', datapunt: 'F2 Rekenen ‐eindtoets domein 1', scores: {}, status: 'Op tijd ingeleverd en wel beoordeeld' },
      level('Level 1 lesgeven', 'Op tijd ingeleverd en wel beoordeeld'),
    ];
    expect(telLevelsAfgerond(datapunten)).toBe(1);
  });

  it('digit-boundary: "Level 1" en "Level 10" tellen allebei apart mee (geen dubbele match/uitsluiting)', () => {
    const datapunten = [
      level('Level 1 lesgeven', 'Op tijd ingeleverd en wel beoordeeld'),
      level('Level 10 lesgeven', 'Op tijd ingeleverd en wel beoordeeld'),
    ];
    expect(telLevelsAfgerond(datapunten)).toBe(2);
  });
});
