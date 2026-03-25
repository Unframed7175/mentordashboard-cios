// utils/prognosis.js — Doorstroomnorm engine
// Bron: "Doorstroomnormeringen 25-26", CIOS Zuidwest-NL
//
// Ondersteunde trajecten (geef mee als tweede argument aan berekenPrognose):
//   'bj1'  → Einde Basisjaar 1: doorstroom naar BJ2 of versneld SBC-profieljaar
//   'bj2'  → Einde Basisjaar 2: doorstroom naar Examineringsjaar SBL of Profieljaar SBC
//            (standaard wanneer traject niet opgegeven)
//
// Wat NIET automatisch bepaald kan worden (geen data in PDFs):
//   Taalniveau (2F/3F), Rekenen (MBO3/MBO4), Keuzedeel, BPV/POK-uren, Levels (Roosendaal)
//   Basiskerntaken B1K1/B1K2 (profieljaar SBC → examinering)
//   Deze worden als 'onbekend' teruggegeven in het resultaat.
//
// Depends on (loaded before this script):
//   utils/schema.js — window.DEELGEBIEDEN

(function() {

  // ---------------------------------------------------------------------------
  // Constanten
  // ---------------------------------------------------------------------------

  // Kerndeelgebieden voor BJ2 → Profieljaar SBC (pagina 4)
  // V&A, P&O, C&B en E&B (= 1E&B conform doorstroomnorm engine v1.0) moeten elk ≥V zijn
  var KERN_SBC = ['V&A', 'P&O', 'C&B', '1E&B'];

  // Per-leerlijn minima voor BJ1 → Versneld SBC (pagina 3)
  // Lesgeven ≥4 G/E, Organiseren ≥3 G/E, Prof. handelen ≥5 G/E
  var VERSNELD_BJ1 = {
    lesgeven:      4,
    organiseren:   3,
    prof_handelen: 5,
  };

  // ---------------------------------------------------------------------------
  // Score helpers
  // ---------------------------------------------------------------------------

  function isVoldoendeOfHoger(score) {
    return score === 'voldoende' || score === 'goed' || score === 'excellent';
  }

  function isGoedOfHoger(score) {
    return score === 'goed' || score === 'excellent';
  }

  function isOnvoldoende(score) {
    // null (niet beoordeeld) telt NIET als onvoldoende
    return score === 'onvoldoende';
  }

  // ---------------------------------------------------------------------------
  // Interne hulpfunctie: tellingen per leerlijn
  // ---------------------------------------------------------------------------

  function telLeerlijnen(scores) {
    var deelgebieden = window.DEELGEBIEDEN;
    var leerlijnen = ['lesgeven', 'organiseren', 'prof_handelen'];
    var telling = {};

    for (var i = 0; i < leerlijnen.length; i++) {
      var ll = leerlijnen[i];
      var mapping = window.getLeerlijnenMapping ? window.getLeerlijnenMapping() : {};
      var dgs = deelgebieden.filter(function(dg) {
        var dgLeerlijn = mapping[dg.id] || dg.group;
        return dgLeerlijn === ll;
      });
      var res = {
        leerlijn: ll,
        totaal: dgs.length,
        voldoendeOfHoger: 0,
        goedOfHoger: 0,
        onvoldoende: 0,
        onbeoordeeld: 0,
      };
      for (var j = 0; j < dgs.length; j++) {
        var score = scores[dgs[j].label] !== undefined ? scores[dgs[j].label] : null;
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
  // window.berekenPrognose(student, traject)
  //
  // @param {Object} student   - StudentRecord (student.deelgebiedScores)
  // @param {string} [traject] - 'bj1' | 'bj2' (standaard: 'bj2')
  //
  // @returns {PrognosisResult}
  //   label      {string}  - Prognose-label (zie onder per traject)
  //   isNegatief {boolean} - BNSA-trigger actief
  //   totaalVoldoendeOfHoger {number}
  //   totaalOnvoldoende      {number}
  //   leerlijnen {LeerlijntTelling[]}
  //   gaps       {GapAnalysis}
  //   traject    {string}  - Gebruikte trajectcode
  //
  // Labels per traject:
  //   bj1: 'negatief' | 'versneld_sbc' | 'bj2' | 'neutraal'
  //   bj2: 'negatief' | 'sbc'          | 'sbl' | 'neutraal'
  // ---------------------------------------------------------------------------
  window.berekenPrognose = function(student, traject) {
    traject = traject || 'bj2';
    var scores = student.deelgebiedScores || {};
    var leerlijnen = ['lesgeven', 'organiseren', 'prof_handelen'];

    var telling = telLeerlijnen(scores);

    // Totalen
    var totaalVoldoendeOfHoger = leerlijnen.reduce(function(s, ll) {
      return s + telling[ll].voldoendeOfHoger;
    }, 0);
    var totaalOnvoldoende = leerlijnen.reduce(function(s, ll) {
      return s + telling[ll].onvoldoende;
    }, 0);

    // NEGATIEF-trigger — geldt voor alle trajecten (pagina 3, BJ1 kolom; zelfde principe BJ2)
    // >6 onvoldoende totaal OF >2 onvoldoende binnen één leerlijn
    var isNegatief = (
      totaalOnvoldoende > 6 ||
      leerlijnen.some(function(ll) { return telling[ll].onvoldoende > 2; })
    );

    var label, gaps;

    // ── BJ1 → BJ2 of Versneld SBC ─────────────────────────────────────────
    if (traject === 'bj1') {
      // Versneld SBC (pagina 3): lesgeven ≥4 G/E + org ≥3 G/E + prof ≥5 G/E
      var isVersneldSBC = (
        telling['lesgeven'].goedOfHoger      >= VERSNELD_BJ1.lesgeven &&
        telling['organiseren'].goedOfHoger   >= VERSNELD_BJ1.organiseren &&
        telling['prof_handelen'].goedOfHoger >= VERSNELD_BJ1.prof_handelen
      );
      // BJ2 positief (pagina 3): ≥13 deelgebieden voldoende
      var isBJ2 = totaalVoldoendeOfHoger >= 13;

      if (isNegatief) {
        label = 'negatief';
      } else if (isVersneldSBC) {
        label = 'versneld_sbc';
      } else if (isBJ2) {
        label = 'bj2';
      } else {
        label = 'neutraal';
      }

      gaps = {
        // BJ2-norm: hoeveel ≥V nog nodig
        nodigBJ2: Math.max(0, 13 - totaalVoldoendeOfHoger),
        // Versneld SBC: per leerlijn hoeveel ≥G nog nodig
        nodigVersneld_lesgeven:      Math.max(0, VERSNELD_BJ1.lesgeven      - telling['lesgeven'].goedOfHoger),
        nodigVersneld_organiseren:   Math.max(0, VERSNELD_BJ1.organiseren   - telling['organiseren'].goedOfHoger),
        nodigVersneld_profHandelen:  Math.max(0, VERSNELD_BJ1.prof_handelen - telling['prof_handelen'].goedOfHoger),
        // Negatief-ruimte
        onvoldoendeRuimte: 6 - totaalOnvoldoende,
        // Per leerlijn: hoeveel O nog toegestaan
        onvoldoendeRuimtePerLeerlijn: {
          lesgeven:      2 - telling['lesgeven'].onvoldoende,
          organiseren:   2 - telling['organiseren'].onvoldoende,
          prof_handelen: 2 - telling['prof_handelen'].onvoldoende,
        },
      };

    // ── BJ2 → SBL of Profieljaar SBC ──────────────────────────────────────
    } else {
      // SBC profieljaar (pagina 4): ≥15 voldoende + V&A/P&O/C&B/1E&B elk ≥V
      var kernNietVoldaan = KERN_SBC.filter(function(lbl) {
        var score = scores[lbl] !== undefined ? scores[lbl] : null;
        return !isVoldoendeOfHoger(score);
      });
      var isSBC = totaalVoldoendeOfHoger >= 15 && kernNietVoldaan.length === 0;

      // SBL standaard (pagina 4): ≥13 voldoende
      var isSBL = totaalVoldoendeOfHoger >= 13;

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
        nodigSBL: Math.max(0, 13 - totaalVoldoendeOfHoger),
        // SBC deelgebied-tel: hoeveel ≥V nog nodig voor 15
        nodigSBC_deelgebieden: Math.max(0, 15 - totaalVoldoendeOfHoger),
        // SBC kerndeelgebieden die nog niet ≥V zijn
        nodigSBC_kern: kernNietVoldaan,
        // Negatief-ruimte
        onvoldoendeRuimte: 6 - totaalOnvoldoende,
        // Per leerlijn: hoeveel O nog toegestaan
        onvoldoendeRuimtePerLeerlijn: {
          lesgeven:      2 - telling['lesgeven'].onvoldoende,
          organiseren:   2 - telling['organiseren'].onvoldoende,
          prof_handelen: 2 - telling['prof_handelen'].onvoldoende,
        },
      };
    }

    return {
      label: label,
      isNegatief: isNegatief,
      totaalVoldoendeOfHoger: totaalVoldoendeOfHoger,
      totaalOnvoldoende: totaalOnvoldoende,
      leerlijnen: leerlijnen.map(function(ll) { return telling[ll]; }),
      gaps: gaps,
      traject: traject,
    };
  };

  // ---------------------------------------------------------------------------
  // window.berekenAllePrognoses([traject])
  // Berekent prognose voor alle leerlingen in appState.students.
  // Schrijft student.prognose op elk object (voor Phase 4 klasoverzicht).
  // ---------------------------------------------------------------------------
  window.berekenAllePrognoses = function(traject) {
    var students = window.appState.students;
    var results = [];
    for (var i = 0; i < students.length; i++) {
      var prognose = window.berekenPrognose(students[i], traject);
      students[i].prognose = prognose;
      results.push({ naam: students[i].naam, label: prognose.label });
    }
    return results;
  };

  // ---------------------------------------------------------------------------
  // window.debugPrognose(nameOrId, [traject])
  // Volledige prognose-breakdown per leerling in de browser console.
  // Gebruik: window.debugPrognose('Bosker')
  //          window.debugPrognose('Bosker', 'bj1')
  // ---------------------------------------------------------------------------
  window.debugPrognose = function(query, traject) {
    var student = window.appState.students.find(function(s) {
      return s.naam.toLowerCase().includes(query.toLowerCase()) || s.leerlingId === query;
    });
    if (!student) {
      console.warn('debugPrognose: geen leerling gevonden voor "' + query + '"');
      return;
    }

    var p = window.berekenPrognose(student, traject);
    var isBJ1 = p.traject === 'bj1';

    console.group('Prognose: ' + student.naam + ' [traject: ' + p.traject + '] → ' + p.label.toUpperCase());

    console.group('Samenvatting');
    console.log('Totaal ≥V: ' + p.totaalVoldoendeOfHoger + '/19  |  Totaal O: ' + p.totaalOnvoldoende);

    if (isBJ1) {
      console.log('BJ2-norm  (≥13 ≥V): ' + (p.totaalVoldoendeOfHoger >= 13 ? '✅' : '❌ nog ' + p.gaps.nodigBJ2 + ' nodig'));
      console.log('Versneld SBC:');
      console.log('  lesgeven ≥4 G/E:      ' + telling_str(telling_val(p, 'lesgeven', 'goedOfHoger'), 4, p.gaps.nodigVersneld_lesgeven));
      console.log('  organiseren ≥3 G/E:   ' + telling_str(telling_val(p, 'organiseren', 'goedOfHoger'), 3, p.gaps.nodigVersneld_organiseren));
      console.log('  prof.handelen ≥5 G/E: ' + telling_str(telling_val(p, 'prof_handelen', 'goedOfHoger'), 5, p.gaps.nodigVersneld_profHandelen));
    } else {
      console.log('SBL-norm  (≥13 ≥V): ' + (p.totaalVoldoendeOfHoger >= 13 ? '✅' : '❌ nog ' + p.gaps.nodigSBL + ' nodig'));
      console.log('SBC-norm  (≥15 ≥V): ' + (p.totaalVoldoendeOfHoger >= 15 ? '✅' : '❌ nog ' + p.gaps.nodigSBC_deelgebieden + ' nodig'));
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
    console.table(p.leerlijnen.map(function(ll) {
      var row = {
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
  };

  // Helpers voor debug output
  function telling_val(p, leerlijn, prop) {
    var ll = p.leerlijnen.find(function(l) { return l.leerlijn === leerlijn; });
    return ll ? ll[prop] : 0;
  }
  function telling_str(huidig, norm, tekort) {
    return huidig + '/' + norm + (tekort === 0 ? ' ✅' : ' ❌ nog ' + tekort + ' nodig');
  }

  console.log('[prognosis.js] Doorstroomnorm engine geladen (BJ1 + BJ2)');

})();
