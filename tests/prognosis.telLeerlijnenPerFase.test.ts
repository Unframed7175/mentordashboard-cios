// ---------------------------------------------------------------------------
// tests/prognosis.telLeerlijnenPerFase.test.ts — telLeerlijnenPerFase (M42 T6)
//
// D14 (eng-review): bron is student.datapunten (fase-tag uit T2), NIET
// student.deelgebiedScores — dat laatste is een hele-jaar "laatste-score-
// wint"-aggregaat zonder fase-informatie. Deze tests draaien tegen het ECHTE
// live schema (src/config/leerlijn.json — 12 deelgebieden, 2 groepen:
// lesgeven_en_organiseren / professioneel_handelen), niet tegen een mock,
// om te bewijzen dat de groepering dynamisch is en niet de oude hardcoded
// 3-way split (lesgeven/organiseren/prof_handelen) gebruikt.
// ---------------------------------------------------------------------------

import { telLeerlijnenPerFase } from '../utils/prognosis';
import { DEELGEBIEDEN } from '../utils/schema';
import type { Datapunt } from '../utils/datapuntTelling';

function dp(fase: number | null | undefined, scores: Record<string, string | null>): Datapunt {
  const base: any = { vak: 'Test', datapunt: 'Test datapunt', scores };
  if (fase !== undefined) base.fase = fase;
  return base as Datapunt;
}

const AANTAL_LESGEVEN_ORG = DEELGEBIEDEN.filter(dg => dg.group === 'lesgeven_en_organiseren').length;
const AANTAL_PROF_HANDELEN = DEELGEBIEDEN.filter(dg => dg.group === 'professioneel_handelen').length;

describe('telLeerlijnenPerFase', () => {
  it('groepeert dynamisch naar de ECHTE huidige groepen, niet de oude hardcoded 3-way split', () => {
    const result = telLeerlijnenPerFase([], 1);
    const keys = Object.keys(result).sort();
    expect(keys).toEqual(['lesgeven_en_organiseren', 'professioneel_handelen'].sort());
    expect(keys).not.toContain('lesgeven');
    expect(keys).not.toContain('organiseren');
    expect(keys).not.toContain('prof_handelen');
  });

  it('lege datapunten array: elke groep aanwezig met totaal = echte DEELGEBIEDEN-aantal, score-tellers 0, alles onbeoordeeld', () => {
    const result = telLeerlijnenPerFase([], 2);

    expect(result['lesgeven_en_organiseren'].totaal).toBe(AANTAL_LESGEVEN_ORG);
    expect(result['lesgeven_en_organiseren'].voldoendeOfHoger).toBe(0);
    expect(result['lesgeven_en_organiseren'].goedOfHoger).toBe(0);
    expect(result['lesgeven_en_organiseren'].onvoldoende).toBe(0);
    expect(result['lesgeven_en_organiseren'].onbeoordeeld).toBe(AANTAL_LESGEVEN_ORG);

    expect(result['professioneel_handelen'].totaal).toBe(AANTAL_PROF_HANDELEN);
    expect(result['professioneel_handelen'].voldoendeOfHoger).toBe(0);
    expect(result['professioneel_handelen'].goedOfHoger).toBe(0);
    expect(result['professioneel_handelen'].onvoldoende).toBe(0);
    expect(result['professioneel_handelen'].onbeoordeeld).toBe(AANTAL_PROF_HANDELEN);
  });

  it('filtert op fase EN past "latest non-null wins" toe BINNEN de gefilterde fase-subset', () => {
    // O&V (lesgeven_en_organiseren) krijgt scores in fase 1, twee keer in fase 2, en fase 3.
    // Alleen de LAATSTE fase-2 score ('goed') mag meetellen — niet de fase-1 score
    // ('onvoldoende', staat eerder in de array), niet de fase-3 score, en niet de
    // EERSTE fase-2 score ('voldoende') — als dat laatste wel meetelt zou goedOfHoger
    // ten onrechte 0 blijven i.p.v. 1, wat bewijst dat dit een echte "laatste-wint
    // binnen de subset"-test is, niet slechts "er bestaat een fase-2-datapunt".
    const datapunten = [
      dp(1, { 'O&V': 'onvoldoende' }),
      dp(2, { 'O&V': 'voldoende' }),
      dp(2, { 'O&V': 'goed' }),
      dp(3, { 'O&V': 'onvoldoende' }),
    ];

    const result = telLeerlijnenPerFase(datapunten, 2);
    const groep = result['lesgeven_en_organiseren'];

    expect(groep.goedOfHoger).toBe(1);
    expect(groep.voldoendeOfHoger).toBe(1);
    expect(groep.onvoldoende).toBe(0);
    // De overige 6 deelgebieden in deze groep zijn onbeoordeeld.
    expect(groep.onbeoordeeld).toBe(AANTAL_LESGEVEN_ORG - 1);
  });

  it('D4: een datapunt zonder fase-property (pre-Lane-A import) telt mee voor ELKE fase', () => {
    const zonderFase = dp(undefined, { 'S&O': 'voldoende' });

    for (const fase of [1, 2, 3]) {
      const result = telLeerlijnenPerFase([zonderFase], fase);
      expect(result['lesgeven_en_organiseren'].voldoendeOfHoger).toBe(1);
    }
  });

  it('D4: expliciete fase: null (nieuw-geparsed, onherkend) telt ook mee voor ELKE fase', () => {
    const faseNull = dp(null, { 'S&O': 'voldoende' });

    for (const fase of [1, 2, 3]) {
      const result = telLeerlijnenPerFase([faseNull], fase);
      expect(result['lesgeven_en_organiseren'].voldoendeOfHoger).toBe(1);
    }
  });

  it('activeDeelgebiedenIds sluit een deelgebied uit van ALLE groepstellingen, ongeacht fase', () => {
    const alleIdsBehalveOv = DEELGEBIEDEN.filter(dg => dg.id !== 'ov').map(dg => dg.id);
    const datapunten = [dp(1, { 'O&V': 'onvoldoende' })];

    const result = telLeerlijnenPerFase(datapunten, 1, alleIdsBehalveOv);
    const groep = result['lesgeven_en_organiseren'];

    expect(groep.totaal).toBe(AANTAL_LESGEVEN_ORG - 1);
    expect(groep.onvoldoende).toBe(0);
    expect(groep.onbeoordeeld).toBe(AANTAL_LESGEVEN_ORG - 1);
  });

  it('activeDeelgebiedenIds die een HELE groep leegmaakt: die groep blijft aanwezig met totaal 0 i.p.v. te ontbreken of te crashen', () => {
    // Sluit elk deelgebied van 'professioneel_handelen' uit — de groep zelf
    // moet toch in het resultaat staan (met alle tellers op 0), niet
    // ontbreken uit het geretourneerde object en ook niet gooien.
    const idsZonderProfHandelen = DEELGEBIEDEN
      .filter(dg => dg.group !== 'professioneel_handelen')
      .map(dg => dg.id);
    const datapunten = [dp(1, { 'O&V': 'voldoende' })];

    const result = telLeerlijnenPerFase(datapunten, 1, idsZonderProfHandelen);

    expect(result).toHaveProperty('professioneel_handelen');
    const groep = result['professioneel_handelen'];
    expect(groep.totaal).toBe(0);
    expect(groep.voldoendeOfHoger).toBe(0);
    expect(groep.goedOfHoger).toBe(0);
    expect(groep.onvoldoende).toBe(0);
    expect(groep.onbeoordeeld).toBe(0);
  });
});
