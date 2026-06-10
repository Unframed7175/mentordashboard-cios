// utils/prognosis.ts — Doorstroomnorm engine
// TypeScript migration from prognosis.js (Plan 03)
//
// Ondersteunde trajecten (geef mee als tweede argument aan berekenPrognose):
//   'bj1'  → Einde Basisjaar 1: doorstroom naar BJ2 of versneld SBC-profieljaar
//   'bj2'  → Einde Basisjaar 2: doorstroom naar Examineringsjaar SBL of Profieljaar SBC
//            (standaard wanneer traject niet opgegeven)
//
// Depends on:
//   utils/schema.ts — DEELGEBIEDEN
//   utils/leerlijnen.ts — getLeerlijnenMapping
//   utils/datamodel.ts — appState (voor berekenAllePrognoses)

import { DEELGEBIEDEN } from './schema';
import { getLeerlijnenMappingSync } from './leerlijnen';
import { appState } from './datamodel';
import { getNormenSync, type Normen } from './normen';

// ---------------------------------------------------------------------------
// Constanten
// ---------------------------------------------------------------------------

// Kerndeelgebieden voor BJ2 → Profieljaar SBC (pagina 4)
// V&A, P&O, C&B en E&B (= 1E&B conform doorstroomnorm engine v1.0) moeten elk ≥V zijn
var KERN_SBC = ['V&A', 'P&O', 'C&B', '1E&B'];

// Note: per-leerlijn minima voor BJ1 → Versneld SBC (lesgeven/organiseren/prof_handelen)
// are now sourced from utils/normen.ts via getNormenSync() (Phase 25 parametrisation).

// ---------------------------------------------------------------------------
// Score helpers
// ---------------------------------------------------------------------------

function isVoldoendeOfHoger(score: string | null): boolean {
  return score === 'voldoende' || score === 'goed' || score === 'excellent';
}

function isGoedOfHoger(score: string | null): boolean {
  return score === 'goed' || score === 'excellent';
}

// Statussen die, ongeacht score, als onvoldoende tellen in de prognose (T06)
const ONVOLDOENDE_INLEVER_STATUSSEN = new Set([
  'niet ingeleverd',
  'te laat ingeleverd en niet beoordeeld',
]);

function isOnvoldoende(score: string | null): boolean {
  // null (niet beoordeeld) telt NIET als onvoldoende
  return score === 'onvoldoende';
}

// ---------------------------------------------------------------------------
// Interne hulpfunctie: tellingen per leerlijn
// ---------------------------------------------------------------------------

function telLeerlijnen(scores: any, activeDeelgebiedenIds?: string[]): any {
  const deelgebieden = activeDeelgebiedenIds ? DEELGEBIEDEN.filter(dg => activeDeelgebiedenIds.includes(dg.id)) : DEELGEBIEDEN;
  var leerlijnen = ['lesgeven', 'organiseren', 'prof_handelen'];
  var telling: Record<string, any> = {};
  const mapping = getLeerlijnenMappingSync();

  for (var i = 0; i < leerlijnen.length; i++) {
    var ll = leerlijnen[i];
    var dgs = deelgebieden.filter(function(dg: any) {
      var dgLeerlijn = mapping[dg.id] || dg.group;
      return dgLeerlijn === ll;
    });
    var res: any = {
      leerlijn: ll,
      totaal: dgs.length,
      voldoendeOfHoger: 0,
      goedOfHoger: 0,
      onvoldoende: 0,
      onbeoordeeld: 0,
    };
    for (var j = 0; j < dgs.length; j++) {
      var score: string | null = scores[dgs[j].label] !== undefined ? scores[dgs[j].label] : null;
      if (score === null) {
        res.onbeoordeeld++;
      } else if (isOnvoldoende(score)) {
        res.onvoldoende++;
      } else if (isVoldoendeOfHoger(score)) {
        res.voldoendeOfHoger++;
        if (isGoedOfHoger(score)) res.goedOfHoger++;
      }
    }
    telling[ll] = res;
  }
  return telling;
}

// ---------------------------------------------------------------------------
// berekenPrognose(student, traject)
//
// @param student   - StudentRecord (student.deelgebiedScores)
// @param traject   - 'bj1' | 'bj2' (standaard: 'bj2')
//
// @returns PrognosisResult
//   label      {string}  - Prognose-label (zie onder per traject)
//   isNegatief {boolean} - BNSA-trigger actief
//   totaalVoldoendeOfHoger {number}
//   totaalOnvoldoende      {number}
//   leerlijnen {LeerlijntTelling[]}
//   gaps       {GapAnalysis}
//   traject    {string}  - Gebruikte trajectcode
//
// Labels per traject:
//   bj1: 'negatief' | 'versneld_sbc' | 'naar_bj2' | 'neutraal'
//   bj2: 'negatief' | 'sbc'          | 'sbl'       | 'neutraal'
// ---------------------------------------------------------------------------
export function berekenPrognose(student: any, traject?: string, activeDeelgebiedenIds?: string[], normen?: Normen): any {
  const n = normen ?? getNormenSync();
  traject = traject || 'bj2';
  var rawScores = student.deelgebiedScores || {};

  // T06: datapunten with 'niet ingeleverd' / 'te laat ingeleverd en niet beoordeeld' status
  // contribute onvoldoende for each deelgebied where no explicit score is present yet.
  var scores: Record<string, string | null> = { ...rawScores };
  for (var dp of (student.datapunten || [])) {
    var dpStatus = ((dp.status as string) || '').toLowerCase().trim();
    if (!ONVOLDOENDE_INLEVER_STATUSSEN.has(dpStatus)) continue;
    for (var [dgLabel, dpScore] of Object.entries(dp.scores || {})) {
      if (scores[dgLabel] === undefined || scores[dgLabel] === null) {
        scores[dgLabel] = 'onvoldoende';
      }
    }
  }

  var leerlijnen = ['lesgeven', 'organiseren', 'prof_handelen'];

  var telling = telLeerlijnen(scores, activeDeelgebiedenIds);

  // Totalen
  var totaalVoldoendeOfHoger = leerlijnen.reduce(function(s: number, ll: string) {
    return s + telling[ll].voldoendeOfHoger;
  }, 0);
  var totaalOnvoldoende = leerlijnen.reduce(function(s: number, ll: string) {
    return s + telling[ll].onvoldoende;
  }, 0);

  // NEGATIEF-trigger — geldt voor alle trajecten (pagina 3, BJ1 kolom; zelfde principe BJ2)
  // >negatiefTotaal onvoldoende totaal OF >negatiefPerLeerlijn onvoldoende binnen één leerlijn
  var isNegatief = (
    totaalOnvoldoende > n.negatiefTotaal ||
    leerlijnen.some(function(ll: string) { return telling[ll].onvoldoende > n.negatiefPerLeerlijn; })
  );

  var label: string;
  var gaps: any;

  // ── BJ1 → BJ2 of Versneld SBC ─────────────────────────────────────────
  if (traject === 'bj1') {
    // Versneld SBC (pagina 3): lesgeven ≥versneldLesgeven G/E + org ≥versneldOrganiseren G/E + prof ≥versneldProfHandelen G/E
    var isVersneldSBC = (
      telling['lesgeven'].goedOfHoger      >= n.versneldLesgeven &&
      telling['organiseren'].goedOfHoger   >= n.versneldOrganiseren &&
      telling['prof_handelen'].goedOfHoger >= n.versneldProfHandelen
    );
    // BJ2 positief (pagina 3): ≥bj1Positief deelgebieden voldoende
    var isBJ2 = totaalVoldoendeOfHoger >= n.bj1Positief;

    if (isNegatief) {
      label = 'negatief';
    } else if (isVersneldSBC) {
      label = 'versneld_sbc';
    } else if (isBJ2) {
      label = 'naar_bj2'; // renamed from 'bj2' to avoid collision with the traject parameter name
    } else {
      label = 'neutraal';
    }

    gaps = {
      // BJ2-norm: hoeveel ≥V nog nodig
      nodigBJ2: Math.max(0, n.bj1Positief - totaalVoldoendeOfHoger),
      // Versneld SBC: per leerlijn hoeveel ≥G nog nodig
      nodigVersneld_lesgeven:      Math.max(0, n.versneldLesgeven      - telling['lesgeven'].goedOfHoger),
      nodigVersneld_organiseren:   Math.max(0, n.versneldOrganiseren   - telling['organiseren'].goedOfHoger),
      nodigVersneld_profHandelen:  Math.max(0, n.versneldProfHandelen  - telling['prof_handelen'].goedOfHoger),
      // Negatief-ruimte
      onvoldoendeRuimte: n.negatiefTotaal - totaalOnvoldoende,
      // Per leerlijn: hoeveel O nog toegestaan
      onvoldoendeRuimtePerLeerlijn: {
        lesgeven:      n.negatiefPerLeerlijn - telling['lesgeven'].onvoldoende,
        organiseren:   n.negatiefPerLeerlijn - telling['organiseren'].onvoldoende,
        prof_handelen: n.negatiefPerLeerlijn - telling['prof_handelen'].onvoldoende,
      },
    };

  // ── BJ2 → SBL of Profieljaar SBC ──────────────────────────────────────
  } else {
    // SBC profieljaar (pagina 4): ≥sbc voldoende + V&A/P&O/C&B/1E&B elk ≥V
    var kernNietVoldaan = KERN_SBC.filter(function(lbl: string) {
      var score: string | null = scores[lbl] !== undefined ? scores[lbl] : null;
      return !isVoldoendeOfHoger(score);
    });
    var isSBC = totaalVoldoendeOfHoger >= n.sbc && kernNietVoldaan.length === 0;

    // SBL standaard (pagina 4): ≥sbl voldoende
    var isSBL = totaalVoldoendeOfHoger >= n.sbl;

    if (isNegatief) {
      label = 'negatief';
    } else if (isSBC) {
      label = 'sbc';
    } else if (isSBL) {
      label = 'sbl';
    } else {
      label = 'neutraal';
    }

    gaps = {
      // SBL: hoeveel ≥V nog nodig
      nodigSBL: Math.max(0, n.sbl - totaalVoldoendeOfHoger),
      // SBC deelgebied-tel: hoeveel ≥V nog nodig voor sbc
      nodigSBC_deelgebieden: Math.max(0, n.sbc - totaalVoldoendeOfHoger),
      // SBC kerndeelgebieden die nog niet ≥V zijn
      nodigSBC_kern: kernNietVoldaan,
      // Negatief-ruimte
      onvoldoendeRuimte: n.negatiefTotaal - totaalOnvoldoende,
      // Per leerlijn: hoeveel O nog toegestaan
      onvoldoendeRuimtePerLeerlijn: {
        lesgeven:      n.negatiefPerLeerlijn - telling['lesgeven'].onvoldoende,
        organiseren:   n.negatiefPerLeerlijn - telling['organiseren'].onvoldoende,
        prof_handelen: n.negatiefPerLeerlijn - telling['prof_handelen'].onvoldoende,
      },
    };
  }

  return {
    label: label,
    isNegatief: isNegatief,
    totaalVoldoendeOfHoger: totaalVoldoendeOfHoger,
    totaalOnvoldoende: totaalOnvoldoende,
    leerlijnen: leerlijnen.map(function(ll: string) { return telling[ll]; }),
    gaps: gaps,
    traject: traject,
  };
}

// ---------------------------------------------------------------------------
// berekenAllePrognoses([traject])
// Berekent prognose voor alle leerlingen in appState.students.
// Schrijft student.prognose op elk object (voor Phase 4 klasoverzicht).
// ---------------------------------------------------------------------------
export function berekenAllePrognoses(traject?: string): any[] {
  var students = appState.students;
  var results: any[] = [];
  for (var i = 0; i < students.length; i++) {
    var prognose = berekenPrognose(students[i], traject);
    students[i].prognose = prognose;
    results.push({ naam: students[i].naam, label: prognose.label });
  }
  return results;
}

// ---------------------------------------------------------------------------
// debugPrognose(nameOrId, [traject])
// Volledige prognose-breakdown per leerling in de browser console.
// Gebruik: debugPrognose('Bosker')
//          debugPrognose('Bosker', 'bj1')
// ---------------------------------------------------------------------------
export function debugPrognose(query: string, traject?: string): void {
  var student = appState.students.find(function(s: any) {
    return s.naam.toLowerCase().includes(query.toLowerCase()) || s.leerlingId === query;
  });
  if (!student) {
    console.warn('debugPrognose: geen leerling gevonden');
    return;
  }

  const n = getNormenSync();
  var p = berekenPrognose(student, traject);
  var isBJ1 = p.traject === 'bj1';

  console.group('Prognose: ' + student.leerlingId + ' [traject: ' + p.traject + '] → ' + p.label.toUpperCase());

  console.group('Samenvatting');
  console.log('Totaal ≥V: ' + p.totaalVoldoendeOfHoger + '/19  |  Totaal O: ' + p.totaalOnvoldoende);

  if (isBJ1) {
    console.log('BJ2-norm  (≥' + n.bj1Positief + ' ≥V): ' + (p.totaalVoldoendeOfHoger >= n.bj1Positief ? '✅' : '❌ nog ' + p.gaps.nodigBJ2 + ' nodig'));
    console.log('Versneld SBC:');
    console.log('  lesgeven ≥' + n.versneldLesgeven + ' G/E:      ' + telling_str(telling_val(p, 'lesgeven', 'goedOfHoger'), n.versneldLesgeven, p.gaps.nodigVersneld_lesgeven));
    console.log('  organiseren ≥' + n.versneldOrganiseren + ' G/E:   ' + telling_str(telling_val(p, 'organiseren', 'goedOfHoger'), n.versneldOrganiseren, p.gaps.nodigVersneld_organiseren));
    console.log('  prof.handelen ≥' + n.versneldProfHandelen + ' G/E: ' + telling_str(telling_val(p, 'prof_handelen', 'goedOfHoger'), n.versneldProfHandelen, p.gaps.nodigVersneld_profHandelen));
  } else {
    console.log('SBL-norm  (≥' + n.sbl + ' ≥V): ' + (p.totaalVoldoendeOfHoger >= n.sbl ? '✅' : '❌ nog ' + p.gaps.nodigSBL + ' nodig'));
    console.log('SBC-norm  (≥' + n.sbc + ' ≥V): ' + (p.totaalVoldoendeOfHoger >= n.sbc ? '✅' : '❌ nog ' + p.gaps.nodigSBC_deelgebieden + ' nodig'));
    if (p.gaps.nodigSBC_kern.length > 0) {
      console.log('SBC kern  (niet ≥V): ' + p.gaps.nodigSBC_kern.join(', '));
    } else {
      console.log('SBC kern: ✅ alle kerndeelgebieden ≥V');
    }
  }

  var ruimte = p.gaps.onvoldoendeRuimte;
  console.log('Negatief-ruimte: ' + (ruimte >= 0 ? ruimte + ' O nog toegestaan' : Math.abs(ruimte) + ' O te veel ⚠️'));
  console.groupEnd();

  console.group('Per leerlijn');
  console.table(p.leerlijnen.map(function(ll: any) {
    var row: any = {
      Leerlijn: ll.leerlijn,
      Totaal: ll.totaal,
      '≥V': ll.voldoendeOfHoger,
      'O': ll.onvoldoende + (ll.onvoldoende > 2 ? ' ⚠️' : ''),
      '?': ll.onbeoordeeld,
    };
    if (isBJ1) row['≥G'] = ll.goedOfHoger;
    return row;
  }));
  console.groupEnd();

  console.groupEnd();
}

// Helpers voor debug output
function telling_val(p: any, leerlijn: string, prop: string): any {
  var ll = p.leerlijnen.find(function(l: any) { return l.leerlijn === leerlijn; });
  return ll ? ll[prop] : 0;
}
function telling_str(huidig: any, norm: number, tekort: number): string {
  return huidig + '/' + norm + (tekort === 0 ? ' ✅' : ' ❌ nog ' + tekort + ' nodig');
}

console.log('[prognosis.ts] Doorstroomnorm engine geladen (BJ1 + BJ2)');
