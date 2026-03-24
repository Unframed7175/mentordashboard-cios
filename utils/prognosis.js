// utils/prognosis.js — Doorstroomnorm engine (Phase 03)
// Berekent doorstroomprognose per leerling op basis van officiële CIOS-normen BJ2 → BJ2/SBL/SBC
//
// Depends on (loaded before this script):
//   utils/schema.js — window.DEELGEBIEDEN, window.normalizeScore
//
// NORMS (BJ2 Fase 2 DD):
//   Positief (BJ2):   ≥13 deelgebieden met score V, G of E
//   Versneld (SBC):   lesgeven ≥4 G/E  AND  organiseren ≥3 G/E  AND  prof_handelen ≥5 G/E
//   Negatief:         >6 onvoldoende totaal  OR  >2 onvoldoende binnen één leerlijn
//   Neutraal:         geen van bovenstaande condities van toepassing
//
// Score hierarchy (laag → hoog): null < onvoldoende < voldoende < goed < excellent
// "Voldoende of hoger" = score ∈ { voldoende, goed, excellent }
// "Goed of hoger"      = score ∈ { goed, excellent }
// "Onvoldoende"        = score === 'onvoldoende'

(function() {

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns true if the score counts as "voldoende of hoger" (≥V).
   * @param {string|null} score
   */
  function isVoldoendeOfHoger(score) {
    return score === 'voldoende' || score === 'goed' || score === 'excellent';
  }

  /**
   * Returns true if the score counts as "goed of hoger" (≥G).
   * @param {string|null} score
   */
  function isGoedOfHoger(score) {
    return score === 'goed' || score === 'excellent';
  }

  /**
   * Returns true if the score is explicitly onvoldoende.
   * null (not yet assessed) does NOT count as onvoldoende.
   * @param {string|null} score
   */
  function isOnvoldoende(score) {
    return score === 'onvoldoende';
  }

  // ---------------------------------------------------------------------------
  // Main export: window.berekenPrognose(student)
  // ---------------------------------------------------------------------------

  /**
   * Bereken de doorstroomprognose voor één leerling.
   *
   * @param {Object} student - StudentRecord from appState
   * @param {Object<string, string|null>} student.deelgebiedScores - { 'V&A': 'goed', ... }
   * @returns {PrognosisResult}
   *
   * @typedef {Object} LeerlijntTelling
   * @property {string} leerlijn       - 'lesgeven' | 'organiseren' | 'prof_handelen'
   * @property {number} totaal         - Total deelgebieden in this leerlijn
   * @property {number} voldoendeOfHoger - Count with score ≥ V
   * @property {number} goedOfHoger    - Count with score ≥ G
   * @property {number} onvoldoende    - Count with score = O
   * @property {number} onbeoordeeld   - Count with score = null
   *
   * @typedef {Object} GapAnalysis
   * @property {number} nodigPositief  - Extra ≥V needed for Positief norm (0 if already met)
   * @property {number} nodigVersneld_lesgeven    - Extra ≥G needed in lesgeven for Versneld
   * @property {number} nodigVersneld_organiseren - Extra ≥G needed in organiseren for Versneld
   * @property {number} nodigVersneld_profHandelen - Extra ≥G needed in prof_handelen for Versneld
   *
   * @typedef {Object} PrognosisResult
   * @property {'positief'|'versneld'|'negatief'|'neutraal'} label
   * @property {boolean} isPositief
   * @property {boolean} isVersneld
   * @property {boolean} isNegatief
   * @property {number} totaalVoldoendeOfHoger - Total ≥V across all deelgebieden
   * @property {number} totaalOnvoldoende      - Total O across all deelgebieden
   * @property {LeerlijntTelling[]} leerlijnen  - Per-leerlijn breakdown
   * @property {GapAnalysis} gaps
   */
  window.berekenPrognose = function(student) {
    const scores = student.deelgebiedScores || {};
    const deelgebieden = window.DEELGEBIEDEN;

    // --- Step 1: Per-leerlijn tallies ---
    const leerlijnen = ['lesgeven', 'organiseren', 'prof_handelen'];
    const telling = {};

    for (const ll of leerlijnen) {
      const dgs = deelgebieden.filter(function(dg) { return dg.group === ll; });
      const result = {
        leerlijn: ll,
        totaal: dgs.length,
        voldoendeOfHoger: 0,
        goedOfHoger: 0,
        onvoldoende: 0,
        onbeoordeeld: 0,
      };
      for (const dg of dgs) {
        const score = scores[dg.label] ?? null;
        if (score === null) {
          result.onbeoordeeld++;
        } else if (isOnvoldoende(score)) {
          result.onvoldoende++;
        } else if (isVoldoendeOfHoger(score)) {
          result.voldoendeOfHoger++;
          if (isGoedOfHoger(score)) result.goedOfHoger++;
        }
      }
      telling[ll] = result;
    }

    // --- Step 2: Totals across all deelgebieden ---
    const totaalVoldoendeOfHoger = leerlijnen.reduce(function(sum, ll) {
      return sum + telling[ll].voldoendeOfHoger;
    }, 0);
    const totaalOnvoldoende = leerlijnen.reduce(function(sum, ll) {
      return sum + telling[ll].onvoldoende;
    }, 0);

    // --- Step 3: Apply norms ---

    // Negatief: >6 onvoldoende totaal OR >2 onvoldoende binnen één leerlijn
    const isNegatief = (
      totaalOnvoldoende > 6 ||
      leerlijnen.some(function(ll) { return telling[ll].onvoldoende > 2; })
    );

    // Versneld (SBC): lesgeven ≥4 G/E  AND  organiseren ≥3 G/E  AND  prof_handelen ≥5 G/E
    const isVersneld = (
      telling['lesgeven'].goedOfHoger >= 4 &&
      telling['organiseren'].goedOfHoger >= 3 &&
      telling['prof_handelen'].goedOfHoger >= 5
    );

    // Positief (BJ2): ≥13 deelgebieden voldoende of hoger
    const isPositief = totaalVoldoendeOfHoger >= 13;

    // Label priority: negatief > versneld > positief > neutraal
    let label;
    if (isNegatief) {
      label = 'negatief';
    } else if (isVersneld) {
      label = 'versneld';
    } else if (isPositief) {
      label = 'positief';
    } else {
      label = 'neutraal';
    }

    // --- Step 4: Gap analysis ---
    const gaps = {
      // Positief: need ≥13 ≥V total
      nodigPositief: Math.max(0, 13 - totaalVoldoendeOfHoger),
      // Versneld per leerlijn
      nodigVersneld_lesgeven:      Math.max(0, 4 - telling['lesgeven'].goedOfHoger),
      nodigVersneld_organiseren:   Math.max(0, 3 - telling['organiseren'].goedOfHoger),
      nodigVersneld_profHandelen:  Math.max(0, 5 - telling['prof_handelen'].goedOfHoger),
    };

    return {
      label: label,
      isPositief: isPositief,
      isVersneld: isVersneld,
      isNegatief: isNegatief,
      totaalVoldoendeOfHoger: totaalVoldoendeOfHoger,
      totaalOnvoldoende: totaalOnvoldoende,
      leerlijnen: leerlijnen.map(function(ll) { return telling[ll]; }),
      gaps: gaps,
    };
  };

  /**
   * Bereken prognoses voor alle studenten in window.appState.students.
   * Stores result in student.prognose for downstream use (Phase 4 klasoverzicht).
   *
   * @returns {Array<{naam: string, prognose: PrognosisResult}>} Summary array
   */
  window.berekenAllePrognoses = function() {
    const students = window.appState.students;
    const results = [];
    for (const student of students) {
      const prognose = window.berekenPrognose(student);
      student.prognose = prognose; // attach to student record
      results.push({ naam: student.naam, prognose: prognose });
    }
    return results;
  };

  /**
   * debugPrognose(nameOrId) — Toon volledige prognose breakdown in de console.
   * Gebruik: window.debugPrognose('Bosker') of window.debugPrognose('12345')
   *
   * @param {string} query - Partial name or full leerlingId
   */
  window.debugPrognose = function(query) {
    const student = window.appState.students.find(function(s) {
      return s.naam.toLowerCase().includes(query.toLowerCase()) || s.leerlingId === query;
    });
    if (!student) {
      console.warn('debugPrognose: geen leerling gevonden voor "' + query + '"');
      return;
    }

    const p = window.berekenPrognose(student);

    console.group('Prognose: ' + student.naam + ' → ' + p.label.toUpperCase());
    console.log('Totaal ≥V:', p.totaalVoldoendeOfHoger, '/ 19 (norm: ≥13 voor Positief)');
    console.log('Totaal O:', p.totaalOnvoldoende, '(norm: ≤6 voor niet-Negatief)');

    console.group('Per leerlijn');
    console.table(p.leerlijnen.map(function(ll) {
      return {
        Leerlijn: ll.leerlijn,
        Totaal: ll.totaal,
        '≥V': ll.voldoendeOfHoger,
        '≥G': ll.goedOfHoger,
        'O': ll.onvoldoende,
        '?': ll.onbeoordeeld,
      };
    }));
    console.groupEnd();

    console.group('Gap-analyse');
    console.log('Nog nodig voor Positief: ' + p.gaps.nodigPositief + ' × ≥V');
    console.log('Nog nodig voor Versneld:');
    console.log('  lesgeven:      ' + p.gaps.nodigVersneld_lesgeven + ' × ≥G (huidig: ' + p.leerlijnen.find(function(l){return l.leerlijn==='lesgeven';}).goedOfHoger + '/4)');
    console.log('  organiseren:   ' + p.gaps.nodigVersneld_organiseren + ' × ≥G (huidig: ' + p.leerlijnen.find(function(l){return l.leerlijn==='organiseren';}).goedOfHoger + '/3)');
    console.log('  prof_handelen: ' + p.gaps.nodigVersneld_profHandelen + ' × ≥G (huidig: ' + p.leerlijnen.find(function(l){return l.leerlijn==='prof_handelen';}).goedOfHoger + '/5)');
    console.groupEnd();

    console.log('isPositief:', p.isPositief, '| isVersneld:', p.isVersneld, '| isNegatief:', p.isNegatief);
    console.groupEnd();
  };

  console.log('[prognosis.js] Doorstroomnorm engine geladen');

})();
