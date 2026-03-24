// utils/prognosis.js — Doorstroomnorm engine (Phase 03)
// Berekent doorstroomprognose per leerling op basis van officiële CIOS-normen
// Bron: "Doorstroomnormeringen 25-26", CIOS Zuidwest-NL
//
// Toepasbaar op: BJ2 Fase 2/3 (Dordrecht, Goes, Roosendaal)
// Doorstroom vanuit BJ2 naar:
//   → Examineringsjaar SBL  (standaard route)
//   → Profieljaar SBC       (versneld/hoog-presteerders route)
//   → Negatief BNSA-signaal (te veel onvoldoendes)
//
// Depends on (loaded before this script):
//   utils/schema.js — window.DEELGEBIEDEN, window.normalizeScore

(function() {

  // ---------------------------------------------------------------------------
  // Kerndeelgebieden voor SBC profieljaar (pagina 4 doorstroomnormering BJ2)
  // V&A, P&O, C&B en E&B moeten elk minimaal V (voldoende) zijn
  // "E&B" = 1E&B (Evalueren en bijstellen lesgeven), conform old engine N07
  // ---------------------------------------------------------------------------
  var KERN_DEELGEBIEDEN_SBC = ['V&A', 'P&O', 'C&B', '1E&B'];

  // ---------------------------------------------------------------------------
  // Score helpers
  // ---------------------------------------------------------------------------

  function isVoldoendeOfHoger(score) {
    return score === 'voldoende' || score === 'goed' || score === 'excellent';
  }

  function isOnvoldoende(score) {
    // null (niet beoordeeld) telt NIET als onvoldoende
    return score === 'onvoldoende';
  }

  // ---------------------------------------------------------------------------
  // window.berekenPrognose(student) — Hoofdfunctie
  //
  // @param {Object} student - StudentRecord met student.deelgebiedScores
  // @returns {PrognosisResult}
  //
  // @typedef {Object} LeerlijntTelling
  // @property {string} leerlijn        - 'lesgeven' | 'organiseren' | 'prof_handelen'
  // @property {number} totaal          - Aantal deelgebieden in deze leerlijn
  // @property {number} voldoendeOfHoger - Score ≥ V
  // @property {number} onvoldoende     - Score = O (null telt niet mee)
  // @property {number} onbeoordeeld    - Nog niet beoordeeld (null)
  //
  // @typedef {Object} GapAnalysis
  // @property {number} nodigSBL              - Nog ≥V nodig voor SBL-norm (≥13)
  // @property {number} nodigSBC_deelgebieden - Nog ≥V nodig voor SBC deelgebied-tel (≥15)
  // @property {string[]} nodigSBC_kern       - Kerndeelgebieden die nog niet ≥V zijn (voor SBC)
  // @property {number} onvoldoendeRuimte     - Nog toegestane onvoldoendes (6 - huidig), negatief = overschreden
  //
  // @typedef {Object} PrognosisResult
  // @property {'sbc'|'sbl'|'negatief'|'neutraal'} label
  // @property {boolean} isSBC
  // @property {boolean} isSBL
  // @property {boolean} isNegatief
  // @property {number} totaalVoldoendeOfHoger
  // @property {number} totaalOnvoldoende
  // @property {LeerlijntTelling[]} leerlijnen
  // @property {GapAnalysis} gaps
  // ---------------------------------------------------------------------------
  window.berekenPrognose = function(student) {
    var scores = student.deelgebiedScores || {};
    var deelgebieden = window.DEELGEBIEDEN;
    var leerlijnen = ['lesgeven', 'organiseren', 'prof_handelen'];

    // --- Stap 1: Per-leerlijn tellingen ---
    var telling = {};
    for (var i = 0; i < leerlijnen.length; i++) {
      var ll = leerlijnen[i];
      var dgs = deelgebieden.filter(function(dg) { return dg.group === ll; });
      var res = {
        leerlijn: ll,
        totaal: dgs.length,
        voldoendeOfHoger: 0,
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
        }
      }
      telling[ll] = res;
    }

    // --- Stap 2: Totalen over alle 19 deelgebieden ---
    var totaalVoldoendeOfHoger = leerlijnen.reduce(function(sum, ll) {
      return sum + telling[ll].voldoendeOfHoger;
    }, 0);
    var totaalOnvoldoende = leerlijnen.reduce(function(sum, ll) {
      return sum + telling[ll].onvoldoende;
    }, 0);

    // --- Stap 3: Kerndeelgebieden SBC controleren ---
    // V&A, P&O, C&B en 1E&B moeten elk minimaal V hebben
    var kernNietVoldaan = KERN_DEELGEBIEDEN_SBC.filter(function(label) {
      var score = scores[label] !== undefined ? scores[label] : null;
      return !isVoldoendeOfHoger(score);
    });

    // --- Stap 4: Normen toepassen (prioriteit: negatief > sbc > sbl > neutraal) ---

    // NEGATIEF: >6 onvoldoende totaal OF >2 onvoldoende binnen één leerlijn
    var isNegatief = (
      totaalOnvoldoende > 6 ||
      leerlijnen.some(function(ll) { return telling[ll].onvoldoende > 2; })
    );

    // SBC (profieljaar): ≥15 deelgebieden voldoende + kerndeelgebieden V&A/P&O/C&B/1E&B elk ≥V
    var isSBC = (
      totaalVoldoendeOfHoger >= 15 &&
      kernNietVoldaan.length === 0
    );

    // SBL (standaard): ≥13 deelgebieden voldoende
    var isSBL = totaalVoldoendeOfHoger >= 13;

    // Label (prioriteit: negatief wint altijd)
    var label;
    if (isNegatief) {
      label = 'negatief';
    } else if (isSBC) {
      label = 'sbc';
    } else if (isSBL) {
      label = 'sbl';
    } else {
      label = 'neutraal';
    }

    // --- Stap 5: Gap-analyse ---
    var gaps = {
      // SBL: hoeveel ≥V nog nodig om 13 te bereiken
      nodigSBL: Math.max(0, 13 - totaalVoldoendeOfHoger),
      // SBC deelgebied-tel: hoeveel ≥V nog nodig om 15 te bereiken
      nodigSBC_deelgebieden: Math.max(0, 15 - totaalVoldoendeOfHoger),
      // SBC kerndeelgebieden: welke moeten nog minimaal V halen
      nodigSBC_kern: kernNietVoldaan,
      // Negatief risico: hoeveel onvoldoendes nog toegestaan (negatief = al over de grens)
      onvoldoendeRuimte: 6 - totaalOnvoldoende,
    };

    return {
      label: label,
      isSBC: isSBC,
      isSBL: isSBL,
      isNegatief: isNegatief,
      totaalVoldoendeOfHoger: totaalVoldoendeOfHoger,
      totaalOnvoldoende: totaalOnvoldoende,
      leerlijnen: leerlijnen.map(function(ll) { return telling[ll]; }),
      gaps: gaps,
    };
  };

  // ---------------------------------------------------------------------------
  // window.berekenAllePrognoses() — Batch voor alle leerlingen in appState
  // Schrijft student.prognose op elk student-object (voor Phase 4 klasoverzicht)
  // ---------------------------------------------------------------------------
  window.berekenAllePrognoses = function() {
    var students = window.appState.students;
    var results = [];
    for (var i = 0; i < students.length; i++) {
      var prognose = window.berekenPrognose(students[i]);
      students[i].prognose = prognose;
      results.push({ naam: students[i].naam, prognose: prognose });
    }
    return results;
  };

  // ---------------------------------------------------------------------------
  // window.debugPrognose(nameOrId) — Console breakdown voor één leerling
  // Gebruik: window.debugPrognose('Bosker') of window.debugPrognose('12345')
  // ---------------------------------------------------------------------------
  window.debugPrognose = function(query) {
    var student = window.appState.students.find(function(s) {
      return s.naam.toLowerCase().includes(query.toLowerCase()) || s.leerlingId === query;
    });
    if (!student) {
      console.warn('debugPrognose: geen leerling gevonden voor "' + query + '"');
      return;
    }

    var p = window.berekenPrognose(student);

    console.group('Prognose: ' + student.naam + ' → ' + p.label.toUpperCase());

    console.group('Doorstroomnorm BJ2 (25-26)');
    console.log('Totaal ≥V: ' + p.totaalVoldoendeOfHoger + '/19');
    console.log('  → SBL-norm:  ≥13  ' + (p.isSBL  ? '✅ (' + p.gaps.nodigSBL  + ' tekort)' : '❌ (nog ' + p.gaps.nodigSBL  + ' nodig)'));
    console.log('  → SBC-norm:  ≥15 + kerndeelgebieden  ' + (p.isSBC ? '✅' : '❌ (nog ' + p.gaps.nodigSBC_deelgebieden + ' DG nodig)'));
    if (!p.isSBC && p.gaps.nodigSBC_kern.length > 0) {
      console.log('     Kerndeelgebieden niet ≥V: ' + p.gaps.nodigSBC_kern.join(', '));
    }
    console.log('Totaal O: ' + p.totaalOnvoldoende + '  (grens: >6 = negatief)  ' + (p.isNegatief ? '🔴' : '🟢'));
    console.groupEnd();

    console.group('Per leerlijn');
    console.table(p.leerlijnen.map(function(ll) {
      var overschreden = ll.onvoldoende > 2 ? ' ⚠️' : '';
      return {
        Leerlijn: ll.leerlijn,
        Totaal: ll.totaal,
        '≥V': ll.voldoendeOfHoger,
        'O': ll.onvoldoende + overschreden,
        '?': ll.onbeoordeeld,
      };
    }));
    console.groupEnd();

    console.log('Onvoldoende-ruimte: ' + p.gaps.onvoldoendeRuimte +
      (p.gaps.onvoldoendeRuimte < 0 ? ' ⚠️ overschreden!' : ' resterende O toegestaan'));
    console.groupEnd();
  };

  console.log('[prognosis.js] Doorstroomnorm engine geladen (BJ2 → SBL / SBC)');

})();
