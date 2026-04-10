// app.js — Import flow wiring for Mentordashboard CIOS
// Plan 01-04: Batch import, live counter, error display
//
// Depends on (loaded before this script):
//   utils/schema.js   — window.DEELGEBIEDEN, window.normalizeScore
//   utils/datamodel.js — window.appState, window.addStudent
//   parsers/pdf.js    — window.parseSinglePDF (assigned at module end)
//
// Loaded as type="module" (listed after parsers/pdf.js in index.html).
// ES module scripts are implicitly deferred — DOM is always ready when this
// executes. The DOMContentLoaded guard is kept for explicitness; it fires
// before module scripts execute in the HTML spec, so it's safe either way.

// Prevent the browser from navigating away when a PDF is accidentally dropped
// outside the designated drop zone (would show "bestandstype wordt niet ondersteund").
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop',     (e) => e.preventDefault());

document.addEventListener('DOMContentLoaded', () => {

  // ---------------------------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------------------------

  const dropZone    = document.getElementById('import-zone');
  const fileInput   = document.getElementById('file-input');
  const chooseBtn   = document.getElementById('choose-btn');
  const progressEl  = document.getElementById('import-progress');
  const progressLbl = document.getElementById('progress-label');
  const progressBar = document.getElementById('progress-bar-fill');
  const resultsEl   = document.getElementById('import-results');
  const successBadge = document.getElementById('result-success');
  const errorBadge   = document.getElementById('result-errors');
  const errorList    = document.getElementById('error-list');
  const detailView   = document.getElementById('detail-view');

  // Leerlijn-toewijzing UI (NORM-01)
  const ltSection  = document.getElementById('leerlijn-toewijzing');
  const ltTbody    = document.getElementById('lt-tbody');
  const ltResetBtn = document.getElementById('lt-reset-btn');
  const ltStatus   = document.getElementById('lt-status');

  // Phase 6 — Multi-class UI DOM references
  const klasTabs        = document.getElementById('klas-tabs');
  const klasGrid        = document.getElementById('klas-grid');
  const nieuweKlasModal      = document.getElementById('nieuwe-klas-modal');
  const nieuweKlasNaam       = document.getElementById('nieuwe-klas-naam');
  const nieuweKlasSchooljaar = document.getElementById('nieuwe-klas-schooljaar');
  const nieuweKlasError      = document.getElementById('nieuwe-klas-error');
  const modalAnnuleren       = document.getElementById('modal-annuleren');
  const modalAanmaken        = document.getElementById('modal-aanmaken');
  const klassenLeeg     = document.getElementById('klassen-leeg');
  const klassenLeegBtn  = document.getElementById('klassen-leeg-btn');

  // ---------------------------------------------------------------------------
  // Phase 8 — Dark mode toggle (UI-01)
  // ---------------------------------------------------------------------------

  // -- Dark mode toggle (Phase 08, UI-01) --
  var themeCheckbox = document.getElementById('theme-toggle-checkbox');
  if (themeCheckbox) {
    themeCheckbox.checked = document.body.classList.contains('dark');
    themeCheckbox.addEventListener('change', function() {
      var isDark = themeCheckbox.checked;
      document.body.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // ---------------------------------------------------------------------------
  // Phase 6 — Class tab strip, modal, empty-state helpers
  // ---------------------------------------------------------------------------

  function renderKlasTabStrip() {
    klasTabs.innerHTML = '';
    var klassen = Object.values(window.klassenState.klassen);

    for (var i = 0; i < klassen.length; i++) {
      var klas = klassen[i];
      var btn = document.createElement('button');
      btn.className = 'nav-tab' + (klas.id === window.klassenState.activeKlasId ? ' active' : '');
      btn.textContent = klas.naam;
      // Toetsplan badge in klas tab (Phase 5 — FASE-01)
      var tp = klas.toetsplan;
      if (tp && tp.length > 0) {
        var faseCount = [];
        tp.forEach(function(dp) { if (faseCount.indexOf(dp.fase) === -1) faseCount.push(dp.fase); });
        var badge = document.createElement('span');
        badge.className = 'toetsplan-badge';
        badge.textContent = 'Toetsplan: ' + faseCount.length + ' fases';
        btn.appendChild(badge);
      }
      (function(k) {
        btn.addEventListener('click', function() {
          window.switchActiveKlas(k.id);
          renderKlasTabStrip();
          updateNavCount();
          if (ltSection) {
            ltSection.style.display = window.appState.students.length > 0 ? 'block' : 'none';
          }
          if (window.appState.students.length > 0) {
            showView('klas');
          } else {
            showView('import');
          }
          renderToetsplanZone();
        });
      })(klas);
      klasTabs.appendChild(btn);
    }

    // "+" button to create new class
    var plusBtn = document.createElement('button');
    plusBtn.className = 'nav-tab';
    plusBtn.textContent = '+';
    plusBtn.style.color = '#3b82f6';
    plusBtn.title = 'Nieuwe klas aanmaken';
    plusBtn.addEventListener('click', openNieuweKlasModal);
    klasTabs.appendChild(plusBtn);

    if (klassen.length === 0) {
      klasTabs.style.display = 'none';
    } else {
      klasTabs.style.display = 'flex';
    }
    // Refresh toetsplan zone to reflect active klas state (Phase 5)
    renderToetsplanZone();
  }

  function openNieuweKlasModal() {
    nieuweKlasModal.style.display = 'flex';
    nieuweKlasNaam.value = '';
    nieuweKlasSchooljaar.value = '';
    nieuweKlasError.textContent = '';
    nieuweKlasNaam.focus();
  }

  function closeNieuweKlasModal() {
    nieuweKlasModal.style.display = 'none';
    nieuweKlasNaam.value = '';
    nieuweKlasSchooljaar.value = '';
    nieuweKlasError.textContent = '';
  }

  function handleCreateKlas() {
    var naam = nieuweKlasNaam.value.trim();
    if (!naam) {
      nieuweKlasError.textContent = 'Voer een klasnaam in.';
      nieuweKlasNaam.focus();
      return;
    }
    var schooljaar = nieuweKlasSchooljaar.value || null;
    var result = window.createKlas(naam, schooljaar);
    if (result && result.error === 'duplicate') {
      nieuweKlasError.textContent = "Er bestaat al een klas met de naam '" + naam + "'.";
      nieuweKlasNaam.focus();
      return;
    }
    closeNieuweKlasModal();
    renderKlasTabStrip();
    updateNavCount();
    if (klassenLeeg) klassenLeeg.style.display = 'none';
    if (ltSection) { ltSection.style.display = 'block'; renderLeerlijntoewijzing(); }
    klasTabs.style.display = 'flex';
    var mainNav = document.getElementById('main-nav');
    if (mainNav) mainNav.style.display = 'flex';
    showView('import');
  }

  modalAnnuleren.addEventListener('click', closeNieuweKlasModal);
  modalAanmaken.addEventListener('click', handleCreateKlas);

  nieuweKlasNaam.addEventListener('keydown', function(e) {
    if (e.key === 'Enter')  handleCreateKlas();
    if (e.key === 'Escape') closeNieuweKlasModal();
  });

  // Close modal when clicking the backdrop (not the inner card)
  nieuweKlasModal.addEventListener('click', function(e) {
    if (e.target === nieuweKlasModal) closeNieuweKlasModal();
  });

  function showEmptyKlassenState() {
    var importView  = document.getElementById('import-view');
    var klasView    = document.getElementById('klasoverzicht-view');
    var dView       = document.getElementById('detail-view');
    if (importView)  importView.style.display  = 'none';
    if (klasView)    klasView.style.display    = 'none';
    if (dView)       dView.style.display       = 'none';
    // D-14: hide only Klasoverzicht tab, NOT the entire nav (Import tab stays visible)
    var navOverzicht = document.getElementById('nav-overzicht');
    if (navOverzicht) navOverzicht.style.display = 'none';
    if (klassenLeeg) klassenLeeg.style.display = 'block';
    renderKlasTabStrip(); // will hide klasTabs since no klassen
  }

  function hideEmptyKlassenState() {
    if (klassenLeeg) klassenLeeg.style.display = 'none';
    var mainNav = document.getElementById('main-nav');
    if (mainNav) mainNav.style.display = 'flex';
    // D-14: restore Klasoverzicht tab visibility
    var navOverzicht = document.getElementById('nav-overzicht');
    if (navOverzicht) navOverzicht.style.display = '';
  }

  klassenLeegBtn.addEventListener('click', openNieuweKlasModal);

  // ---------------------------------------------------------------------------
  // Task 01-04-01 — Drag-and-drop + file picker handlers
  // ---------------------------------------------------------------------------

  // Drag-and-drop event handlers
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    // Only remove if leaving the drop zone itself (not a child element)
    if (!dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  });

  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const allFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = allFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    const nonPdfCount = allFiles.length - pdfFiles.length;

    if (allFiles.length === 0) {
      showError('Geen bestanden ontvangen. Sleep .pdf bestanden naar dit veld.');
      return;
    }

    if (pdfFiles.length === 0) {
      showError('Alleen PDF-bestanden worden geaccepteerd. Sleep .pdf bestanden naar dit veld.');
      return;
    }

    // Inform about rejected non-PDF files, then proceed with PDFs (per PDF-08 + D-05)
    if (nonPdfCount > 0) {
      showError(`${nonPdfCount} bestand(en) overgeslagen — alleen PDF-bestanden worden geaccepteerd.`);
    }

    await importPDFs(pdfFiles);
  });

  // File picker handler (per D-01)
  chooseBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const pdfFiles = Array.from(fileInput.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length > 0) {
      await importPDFs(pdfFiles);
    }
    fileInput.value = ''; // reset for re-import of same files
  });

  // Make the drop zone itself also clickable (not just the button)
  dropZone.addEventListener('click', (e) => {
    // Only trigger if click is directly on zone background (not on the button,
    // which already handles its own click)
    if (e.target === dropZone || e.target.classList.contains('drop-text') || e.target.classList.contains('drop-hint') || e.target.classList.contains('drop-icon')) {
      fileInput.click();
    }
  });

  // ---------------------------------------------------------------------------
  // Sequential batch import (per D-02, D-04, D-05, D-07)
  // ---------------------------------------------------------------------------

  async function importPDFs(files) {
    // Guard: parseSinglePDF must be available (loaded by module script)
    if (typeof window.parseSinglePDF !== 'function') {
      showError('PDF-parser niet geladen. Ververs de pagina en probeer opnieuw.');
      return;
    }

    window.appState.importing = true;
    setImportingState(true);

    const results = { students: [], errors: [], warnings: [] }; // warnings: PARSE-01
    const total = files.length;

    showImportProgress(0, total); // "Verwerkt: 0/N PDFs"

    // Process PDFs SEQUENTIALLY (not Promise.all — avoids Web Worker memory overload)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const student = await window.parseSinglePDF(file);
        // filename is set by parseSinglePDF already, but ensure it's present
        if (!student.filename) student.filename = file.name;
        results.students.push(student);
        window.addStudent(student); // add to global appState (per D-07)
        // PARSE-01: collect data-loss warnings from parser
        if (student.warnings && student.warnings.length > 0) {
          results.warnings.push({ naam: student.naam || file.name, items: student.warnings });
        }
      } catch (err) {
        // Per D-06: filename + specific reason
        results.errors.push({ filename: file.name, reason: err.message || String(err) });
        console.warn(`[app.js] Import mislukt: ${file.name} — ${err.message}`);
      }

      // Per D-04: update counter after EACH file (success or failure)
      showImportProgress(i + 1, total);
    }

    window.appState.lastImportErrors = results.errors;
    window.appState.importing = false;
    setImportingState(false);

    // Per D-08: show overview of successes + failures
    showImportResults(results);

    // Task 01-04-02: console debug output
    logImportResults(results);

    // Phase 04: auto-save + show "Naar klasoverzicht" button
    if (typeof window._afterPDFImport === 'function') window._afterPDFImport();
    showNaarKlasBtn();
  }

  // ---------------------------------------------------------------------------
  // UI state helpers
  // ---------------------------------------------------------------------------

  /**
   * Show/hide the progress section and update counter + bar.
   * Called with processed=0 before the loop begins.
   *
   * @param {number} processed - Files completed so far
   * @param {number} total - Total files in this batch
   */
  function showImportProgress(processed, total) {
    progressEl.style.display = 'block';
    progressLbl.textContent = `Verwerkt: ${processed}/${total} PDFs`;
    const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
    progressBar.style.width = `${pct}%`;
  }

  /**
   * Show the results panel after import completes (per D-08).
   * Replaces the progress bar with a summary; adds "Importeer meer" button.
   *
   * @param {{ students: StudentRecord[], errors: Array<{filename, reason}> }} results
   */
  function showImportResults(results) {
    const successCount = results.students.length;
    const errorCount   = results.errors.length;

    // Update success badge
    successBadge.textContent = `${successCount} leerling${successCount !== 1 ? 'en' : ''} succesvol geimporteerd`;

    // Update error badge
    if (errorCount > 0) {
      errorBadge.style.display = 'inline-flex';
      errorBadge.textContent = `${errorCount} bestand${errorCount !== 1 ? 'en' : ''} mislukt`;
    } else {
      errorBadge.style.display = 'none';
    }

    // Build error list (per D-06)
    errorList.innerHTML = '';
    for (const err of results.errors) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${escapeHtml(err.filename)}</strong>: ${escapeHtml(err.reason)}`;
      errorList.appendChild(li);
    }

    // Append student name list for quick verification (per plan spec)
    if (results.students.length > 0) {
      const studentSection = document.createElement('div');
      studentSection.className = 'student-name-list';
      studentSection.style.cssText = 'margin-top:0.75rem;';

      const heading = document.createElement('p');
      heading.style.cssText = 'font-size:0.875rem;font-weight:400;color:var(--text-secondary);margin-bottom:0.4rem;';
      heading.textContent = `Geimporteerde leerlingen (${results.students.length}):`;
      studentSection.appendChild(heading);

      const nameList = document.createElement('ul');
      nameList.style.cssText = 'list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:0.35rem;';

      for (const student of results.students) {
        const tag = document.createElement('li');
        tag.style.cssText = 'padding:0.2rem 0.5rem;background:var(--border-light);border-radius:4px;font-size:0.8rem;color:var(--text-secondary);';
        tag.textContent = student.naam || student.filename;
        nameList.appendChild(tag);
      }

      studentSection.appendChild(nameList);
      errorList.parentNode.insertBefore(studentSection, errorList.nextSibling);
    }

    // Phase 08 — PDF parse warnings (PARSE-01, D-09)
    var existingWarnings = resultsEl.querySelector('.parse-warnings');
    if (existingWarnings) existingWarnings.remove();

    if (results.warnings && results.warnings.length > 0) {
      var warnSection = document.createElement('div');
      warnSection.className = 'parse-warnings';

      var warnHeading = document.createElement('h4');
      warnHeading.textContent = 'Waarschuwingen';
      warnSection.appendChild(warnHeading);

      var warnList = document.createElement('ul');
      warnList.style.cssText = 'padding:0;margin:0;';
      for (var w = 0; w < results.warnings.length; w++) {
        var entry = results.warnings[w];
        for (var j = 0; j < entry.items.length; j++) {
          var li = document.createElement('li');
          li.innerHTML = '<strong>' + escapeHtml(entry.naam) + '</strong>: ' + escapeHtml(entry.items[j]);
          warnList.appendChild(li);
        }
      }
      warnSection.appendChild(warnList);

      // Insert after student-name-list (or after errorList if student section absent)
      var insertAfter = resultsEl.querySelector('.student-name-list') || errorList;
      if (insertAfter && insertAfter.parentNode) {
        insertAfter.parentNode.insertBefore(warnSection, insertAfter.nextSibling);
      } else {
        resultsEl.appendChild(warnSection);
      }
    }

    // "Importeer meer bestanden" button (resets the drop zone for additional imports)
    const existingBtn = document.getElementById('import-more-btn');
    if (existingBtn) existingBtn.remove();

    const moreBtn = document.createElement('button');
    moreBtn.id = 'import-more-btn';
    moreBtn.className = 'btn btn-primary';
    moreBtn.style.cssText = 'margin-top:1rem;';
    moreBtn.textContent = 'Importeer meer bestanden';
    moreBtn.addEventListener('click', () => {
      fileInput.click();
    });

    resultsEl.appendChild(moreBtn);

    // Show the results section
    resultsEl.style.display = 'block';
  }

  /**
   * Display a temporary error banner at the top of the import zone.
   *
   * @param {string} message
   */
  function showError(message) {
    // Remove any existing error banner first
    const existing = document.getElementById('import-error-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'import-error-banner';
    banner.style.cssText = [
      'background:#fee2e2',
      'color:#991b1b',
      'border:1px solid #fca5a5',
      'border-radius:6px',
      'padding:0.6rem 0.875rem',
      'font-size:0.875rem',
      'margin-bottom:0.75rem',
      'text-align:left',
    ].join(';');
    banner.textContent = message;

    // Insert before drop zone
    dropZone.parentNode.insertBefore(banner, dropZone);

    // Auto-dismiss after 6 seconds
    setTimeout(() => banner.remove(), 6000);
  }

  /**
   * Enable or disable the drop zone and button during import.
   *
   * @param {boolean} importing
   */
  function setImportingState(importing) {
    if (importing) {
      dropZone.style.opacity = '0.6';
      dropZone.style.pointerEvents = 'none';
      chooseBtn.disabled = true;
    } else {
      dropZone.style.opacity = '';
      dropZone.style.pointerEvents = '';
      chooseBtn.disabled = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Task 01-04-02 — Console debug output and helpers
  // ---------------------------------------------------------------------------

  /**
   * Log import results summary to browser console.
   * Called automatically after each importPDFs() run.
   */
  function logImportResults(results) {
    console.group('Import Results');
    console.log(`Succesvol: ${results.students.length} leerlingen`);
    for (const student of results.students) {
      const scores = student.deelgebiedScores || {};
      const scoreCount = Object.values(scores).filter(v => v !== null).length;
      console.log(`  ${student.naam} (${student.leerlingId}) — ${scoreCount}/19 deelgebieden beoordeeld`);
    }
    if (results.errors.length > 0) {
      console.warn(`Fouten: ${results.errors.length}`);
      for (const err of results.errors) {
        console.warn(`  ${err.filename}: ${err.reason}`);
      }
    }
    console.groupEnd();
  }

  /**
   * debugStudent(nameOrId) — Full breakdown of a student record in the console.
   * Accessible as window.debugStudent('Bosker') or window.debugStudent('12345').
   *
   * @param {string} query - Partial name or full leerlingId
   */
  window.debugStudent = function(query) {
    const student = window.appState.students.find(s =>
      s.naam.toLowerCase().includes(query.toLowerCase()) ||
      s.leerlingId === query
    );
    if (!student) {
      console.warn(`debugStudent: geen leerling gevonden voor "${query}"`);
      return;
    }

    console.group(`Student: ${student.naam}`);
    console.log('Leerling ID:', student.leerlingId);
    console.log('Periode:', student.periode);
    console.log('Leerjaar:', student.leerjaar);
    console.log('Bestand:', student.filename);

    console.group('Vakken');
    for (const vak of student.vakken) {
      console.group(vak.naam);
      for (const op of vak.opdrachten) {
        console.log(`${op.naam} — Status: ${op.status || '(leeg)'}`);
        if (op.feedForward) console.log(`  Feed Forward: ${op.feedForward}`);
      }
      console.groupEnd();
    }
    console.groupEnd();

    console.group('Deelgebied Scores');
    console.table(
      window.DEELGEBIEDEN.map(dg => ({
        Deelgebied: dg.label,
        Groep: dg.group,
        Score: student.deelgebiedScores[dg.label] || '—',
      }))
    );
    console.groupEnd();

    console.log('Datapunten:', student.datapunten.length);
    console.groupEnd();
  };

  /**
   * validateImport() — Validation summary of all imported students.
   * Run in browser console after importing to check for parse issues.
   */
  window.validateImport = function() {
    const students = window.appState.students;
    console.group('Import Validation');
    console.log(`Totaal leerlingen: ${students.length}`);

    let issues = 0;
    for (const s of students) {
      const problems = [];
      if (!s.naam)       problems.push('Naam ontbreekt');
      if (!s.leerlingId) problems.push('Leerling ID ontbreekt');
      if (!s.periode)    problems.push('Periode ontbreekt');
      if (!s.vakken || s.vakken.length === 0) problems.push('Geen vakken gevonden');

      const scores  = s.deelgebiedScores || {};
      const scored  = Object.values(scores).filter(v => v !== null).length;
      if (scored === 0) problems.push('Geen deelgebied-scores');
      else if (scored < 5) problems.push(`Slechts ${scored}/19 deelgebieden beoordeeld`);

      if (problems.length > 0) {
        console.warn(`${s.naam}: ${problems.join(', ')}`);
        issues++;
      }
    }

    if (issues === 0) {
      console.log('Alle leerlingen correct geparsed!');
    } else {
      console.warn(`${issues} leerling(en) met problemen`);
    }
    console.groupEnd();
  };

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------------------------------------------------------------------------
  // Excel verzuim import (Phase 02)
  // ---------------------------------------------------------------------------

  const excelFileInput = document.getElementById('excel-file-input');
  const excelChooseBtn = document.getElementById('excel-choose-btn');
  const excelResults   = document.getElementById('excel-import-results');
  const excelResultTxt = document.getElementById('excel-result-text');
  const excelUnmatched = document.getElementById('excel-unmatched-list');

  // Guard: if SheetJS CDN failed to load, disable button with Dutch error
  if (typeof window.XLSX === 'undefined') {
    excelChooseBtn.disabled = true;
    excelChooseBtn.textContent = 'SheetJS niet geladen. Ververs de pagina.';
  } else {
    excelChooseBtn.addEventListener('click', () => excelFileInput.click());
  }

  excelFileInput.addEventListener('change', async () => {
    const file = excelFileInput.files[0];
    if (!file) return;

    // Guard: parseExcelFile must be available
    if (typeof window.parseExcelFile !== 'function') {
      showError('Excel-parser niet geladen. Ververs de pagina en probeer opnieuw.');
      return;
    }

    // Guard: students must be imported first
    if (window.appState.students.length === 0) {
      showError('Importeer eerst voortgang-PDFs voordat je verzuimdata importeert.');
      return;
    }

    try {
      excelChooseBtn.disabled = true;
      excelChooseBtn.textContent = 'Bezig met importeren...';

      const verzuimRecords = await window.parseExcelFile(file);
      const result = window.mergeVerzuim(verzuimRecords);

      // Show results
      excelResultTxt.textContent = `${result.matched} van ${verzuimRecords.length} leerlingen gekoppeld aan voortgangdata.`;

      excelUnmatched.innerHTML = '';
      if (result.unmatched.length > 0) {
        for (const name of result.unmatched) {
          const li = document.createElement('li');
          li.textContent = `Niet gekoppeld: ${name}`;
          excelUnmatched.appendChild(li);
        }
      }

      excelResults.style.display = 'block';

      // Phase 04: auto-save after verzuim merge
      if (typeof window._afterPDFImport === 'function') window._afterPDFImport();

      // Sla records op voor debugVerzuimKoppeling()
      window._lastVerzuimRecords = verzuimRecords;

      // Console summary
      console.group('Excel Import Results');
      console.log(`Bestand: ${file.name}`);
      console.log(`Gekoppeld: ${result.matched}/${verzuimRecords.length}`);
      if (result.unmatched.length > 0) {
        console.warn('Niet gekoppeld:', result.unmatched);
        console.warn('Tip: voer window.debugVerzuimKoppeling() uit in de console voor een vergelijkingstabel.');
        // Toon Excel-namen vs PDF-namen voor directe diagnose
        console.log('Excel namen:', verzuimRecords.map(r => r.naam + (r.leerlingnummer ? ' [' + r.leerlingnummer + ']' : '')));
        console.log('PDF namen: ', window.appState.students.map(s => s.naam + ' [' + s.leerlingId + ']'));
      }
      // Debug: show verzuim data for first matched student
      const firstWithVerzuim = window.appState.students.find(s => s.verzuim);
      if (firstWithVerzuim) {
        console.log('Voorbeeld verzuim:', firstWithVerzuim.naam, firstWithVerzuim.verzuim);
      }
      console.groupEnd();

    } catch (err) {
      showError(`Excel-import mislukt: ${err.message}`);
      console.error('[app.js] Excel import error:', err);
    } finally {
      excelChooseBtn.disabled = false;
      excelChooseBtn.textContent = 'Kies Excel-bestand';
      excelFileInput.value = ''; // reset for re-import
    }
  });

  // ---------------------------------------------------------------------------
  // Toetsplan import (Phase 5 — FASE-01/FASE-02)
  // ---------------------------------------------------------------------------

  const toetsplanZone      = document.getElementById('toetsplan-zone');
  const toetsplanChooseBtn = document.getElementById('toetsplan-choose-btn');
  const toetsplanInput     = document.getElementById('toetsplan-input');
  const toetsplanStatus    = document.getElementById('toetsplan-status');

  // Stage import refs (Phase 6 — STAGE-01)
  const stageZone      = document.getElementById('stage-zone');
  const stageChooseBtn = document.getElementById('stage-choose-btn');
  const stageFileInput = document.getElementById('stage-file-input');
  const stageResults   = document.getElementById('stage-import-results');

  function getActiveKlas() {
    if (!window.klassenState.activeKlasId) return null;
    return window.klassenState.klassen[window.klassenState.activeKlasId] || null;
  }

  function renderToetsplanZone() {
    if (!toetsplanZone || !toetsplanStatus) return;
    var klas = getActiveKlas();
    if (!klas) return;
    var tp = klas.toetsplan;
    if (tp && tp.length > 0) {
      // Already-loaded state
      var fases = [];
      tp.forEach(function(dp) { if (fases.indexOf(dp.fase) === -1) fases.push(dp.fase); });
      toetsplanZone.style.display = 'none';
      toetsplanStatus.style.display = 'block';
      toetsplanStatus.innerHTML =
        '<div class="toetsplan-status-success">'
        + '<strong>Toetsplan geladen</strong> &#8212; ' + tp.length + ' datapunten over ' + fases.length + ' fases'
        + '<br><button class="btn-danger-sm" id="toetsplan-vervangen-btn" style="margin-top:0.5rem;">Vervangen</button>'
        + '</div>';
      // Wire double-click confirm on Vervangen
      var vervBtn = document.getElementById('toetsplan-vervangen-btn');
      var confirmState = false;
      vervBtn.addEventListener('click', function() {
        if (!confirmState) {
          confirmState = true;
          vervBtn.textContent = 'Bevestig wissen';
          vervBtn.style.background = '#fecaca';
          setTimeout(function() {
            confirmState = false;
            vervBtn.textContent = 'Vervangen';
            vervBtn.style.background = '';
          }, 3000);
        } else {
          klas.toetsplan = null;
          window.saveKlassen();
          renderToetsplanZone();
          renderKlasTabStrip();
        }
      });
    } else {
      // Idle state
      toetsplanZone.style.display = '';
      toetsplanStatus.style.display = 'none';
    }

    // Schooljaar selector — always visible when a klas is active
    var sjSection = document.getElementById('klas-schooljaar-section');
    if (sjSection) {
      var cur = klas.schooljaar || '';
      var sjOpts = [
        { value: '',    label: 'Auto (detecteer per leerling)' },
        { value: 'bj1', label: 'BJ1 — Basisjaar 1' },
        { value: 'bj2', label: 'BJ2 — Basisjaar 2' },
        { value: 'pj',  label: 'PJ — Praktijkjaar' },
        { value: 'exj', label: 'ExJ — Examenjaar' },
      ];
      var optHTML = sjOpts.map(function(o) {
        return '<option value="' + o.value + '"' + (o.value === cur ? ' selected' : '') + '>' + escapeHtml(o.label) + '</option>';
      }).join('');
      sjSection.style.display = '';
      sjSection.innerHTML = '<label style="font-size:0.875rem;color:#374151;font-weight:500;display:flex;align-items:center;gap:0.5rem;">'
        + 'Schooljaar type klas'
        + '<select id="klas-schooljaar-select" style="padding:0.25rem 0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.875rem;">'
        + optHTML + '</select>'
        + '<span style="font-size:0.8rem;color:#9ca3af;">— bepaalt welke toetsplan-fases zichtbaar zijn per leerling</span>'
        + '</label>';
      var sjSelect = document.getElementById('klas-schooljaar-select');
      (function(k) {
        sjSelect.addEventListener('change', function() {
          k.schooljaar = this.value || null;
          window.saveKlassen();
        });
      })(klas);
    }
  }

  async function handleToetsplanImport(file) {
    if (!file) return;
    if (!/\.xlsx?$/i.test(file.name)) {
      toetsplanStatus.style.display = 'block';
      toetsplanStatus.innerHTML = '<div class="toetsplan-status-error">Alleen Excel-bestanden (.xlsx) worden ondersteund.</div>';
      return;
    }
    var klas = getActiveKlas();
    if (!klas) {
      toetsplanStatus.style.display = 'block';
      toetsplanStatus.innerHTML = '<div class="toetsplan-status-error">Selecteer eerst een klas.</div>';
      return;
    }
    if (typeof window.parseToetsplanFile !== 'function') {
      toetsplanStatus.style.display = 'block';
      toetsplanStatus.innerHTML = '<div class="toetsplan-status-error">Toetsplan-parser niet geladen. Ververs de pagina.</div>';
      return;
    }
    // Parsing state
    toetsplanChooseBtn.disabled = true;
    toetsplanChooseBtn.textContent = 'Toetsplan wordt ingelezen\u2026';
    toetsplanStatus.style.display = 'none';
    try {
      var result = await window.parseToetsplanFile(file);
      klas.toetsplan = result;
      window.saveKlassen();
      renderToetsplanZone();
      renderKlasTabStrip();
    } catch (err) {
      toetsplanStatus.style.display = 'block';
      toetsplanStatus.innerHTML = '<div class="toetsplan-status-error">' + escapeHtml(err.message || 'Het toetsplan kon niet worden ingelezen.') + '</div>';
    } finally {
      toetsplanChooseBtn.disabled = false;
      toetsplanChooseBtn.textContent = 'Kies Excel-bestand';
      toetsplanInput.value = '';
    }
  }

  // Event wiring — toetsplan choose button
  if (typeof window.XLSX === 'undefined') {
    toetsplanChooseBtn.disabled = true;
    toetsplanChooseBtn.textContent = 'SheetJS niet geladen. Ververs de pagina.';
  } else {
    toetsplanChooseBtn.addEventListener('click', function() { toetsplanInput.click(); });
  }
  toetsplanInput.addEventListener('change', function() { handleToetsplanImport(toetsplanInput.files[0]); });

  // Drag-and-drop on toetsplan zone
  toetsplanZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    toetsplanZone.classList.add('drag-over');
  });
  toetsplanZone.addEventListener('dragleave', function() {
    toetsplanZone.classList.remove('drag-over');
  });
  toetsplanZone.addEventListener('drop', function(e) {
    e.preventDefault();
    toetsplanZone.classList.remove('drag-over');
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleToetsplanImport(file);
  });

  // ── Stage import (Phase 6 — STAGE-01) ─────────────────────────────────────
  async function handleStageImport(file) {
    if (!file) return;
    if (!/\.xlsx?$/i.test(file.name)) {
      stageResults.style.display = 'block';
      stageResults.innerHTML = '<div class="badge badge-error">Alleen Excel-bestanden (.xlsx) worden ondersteund.</div>';
      return;
    }
    const klas = getActiveKlas();
    if (!klas) {
      stageResults.style.display = 'block';
      stageResults.innerHTML = '<div class="badge badge-error">Selecteer eerst een klas.</div>';
      return;
    }
    if (typeof window.parseStageFile !== 'function') {
      stageResults.style.display = 'block';
      stageResults.innerHTML = '<div class="badge badge-error">Stage-parser niet geladen. Ververs de pagina.</div>';
      return;
    }
    stageChooseBtn.disabled = true;
    stageChooseBtn.textContent = 'Stage-Excel wordt ingelezen\u2026';
    stageResults.style.display = 'none';
    try {
      const records = await window.parseStageFile(file);
      const students = window.getActiveStudents();
      const stageData = {};
      const matched = [];
      const unmatched = [];

      records.forEach(function(rec) {
        // Match by studentnummer first, then by name
        let student = null;
        if (rec.studentnummer) {
          student = students.find(s => s.leerlingId === rec.studentnummer);
        }
        if (!student && rec.naam) {
          const normNaam = rec.naam.trim().toLowerCase();
          student = students.find(s => (s.naam || '').trim().toLowerCase() === normNaam);
        }
        if (student) {
          stageData[student.leerlingId] = {
            organisatie: rec.organisatie,
            startdatum: rec.startdatum,
            einddatum: rec.einddatum,
            urenIngeleverd: rec.urenIngeleverd,
            urenGoedgekeurd: rec.urenGoedgekeurd
          };
          matched.push(student.leerlingId);
        } else {
          unmatched.push(rec.studentnummer || rec.naam || '(onbekend)');
        }
      });

      klas.stageData = stageData;
      window.saveKlassen();

      // Show results
      let html = '<div class="badge badge-success">' + matched.length + ' van ' + records.length + ' leerlingen gevonden en bijgewerkt.</div>';
      if (unmatched.length > 0) {
        html += '<div style="margin-top:0.5rem;padding:0.75rem 1rem;background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;font-size:0.875rem;">';
        html += '<strong>Niet gevonden in deze klas:</strong><ul style="margin:0.25rem 0 0 1.25rem;padding:0;">';
        unmatched.forEach(function(name) {
          html += '<li>' + escapeHtml(name) + '</li>';
        });
        html += '</ul></div>';
      }
      stageResults.style.display = 'block';
      stageResults.innerHTML = html;
    } catch (err) {
      stageResults.style.display = 'block';
      stageResults.innerHTML = '<div class="badge badge-error">' + escapeHtml(err.message || 'Bestand kon niet worden gelezen. Controleer of het een geldig .xlsx-bestand is.') + '</div>';
    } finally {
      stageChooseBtn.disabled = false;
      stageChooseBtn.textContent = 'Importeer stage-Excel';
      stageFileInput.value = '';
    }
  }

  // Stage import event wiring
  if (typeof window.XLSX === 'undefined') {
    stageChooseBtn.disabled = true;
    stageChooseBtn.textContent = 'SheetJS niet geladen. Ververs de pagina.';
  } else {
    stageChooseBtn.addEventListener('click', function() { stageFileInput.click(); });
  }
  stageFileInput.addEventListener('change', function() { handleStageImport(stageFileInput.files[0]); });

  // Drag-and-drop on stage zone
  stageZone.addEventListener('dragover', function(e) { e.preventDefault(); stageZone.classList.add('drag-over'); });
  stageZone.addEventListener('dragleave', function() { stageZone.classList.remove('drag-over'); });
  stageZone.addEventListener('drop', function(e) {
    e.preventDefault();
    stageZone.classList.remove('drag-over');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleStageImport(file);
  });

  // ---------------------------------------------------------------------------
  // Phase 7 — Backup & Restore (EXP-01)
  // Note: buildBackupPayload and applyBackupRestore are in utils/backup.js
  // ---------------------------------------------------------------------------

  // DOM refs (aligned with index.html element IDs per plan 07-02)
  const backupExportBtn      = document.getElementById('backup-export-btn');
  const backupPasswordInput  = document.getElementById('backup-password');
  const backupExportStatus   = document.getElementById('backup-export-status');
  const backupZone           = document.getElementById('backup-zone');
  const backupChooseBtn      = document.getElementById('backup-choose-btn');
  const backupFileInput      = document.getElementById('backup-file-input');
  const backupImportResults  = document.getElementById('backup-import-results');
  const backupResults        = document.getElementById('backup-results');
  const backupPasswordPrompt = document.getElementById('backup-password-prompt');
  const backupImportPwInput  = document.getElementById('backup-import-password');
  const backupImportPwBtn    = document.getElementById('backup-import-password-btn');
  const backupRestoreChoice  = document.getElementById('backup-restore-choice');
  const backupOverwriteBtn   = document.getElementById('backup-overwrite-btn');
  const backupMergeBtn       = document.getElementById('backup-merge-btn');

  // Pending restore state (used across async steps and UI button handlers)
  let _pendingRestoreFile    = null;
  let _pendingBackupPayload  = null;

  // ── handleBackupExport() — zip export met optioneel wachtwoord ───────────
  async function handleBackupExport() {
    var statusEl = backupExportStatus;
    if (!window.zip) {
      if (statusEl) { statusEl.style.display = 'block'; statusEl.style.color = '#dc2626'; statusEl.textContent = 'ZIP-bibliotheek niet geladen. Ververs de pagina.'; }
      return;
    }
    var password = backupPasswordInput ? backupPasswordInput.value.trim() : '';
    if (backupExportBtn) { backupExportBtn.disabled = true; backupExportBtn.textContent = 'Backup maken\u2026'; }
    if (statusEl) { statusEl.style.display = 'block'; statusEl.style.color = '#6b7280'; statusEl.textContent = 'Backup maken...'; }
    try {
      var payload  = window.buildBackupPayload();
      var jsonStr  = JSON.stringify(payload, null, 2);
      var zipOpts  = password ? { password: password, encryptionStrength: 3 } : {};
      var blobWriter = new window.zip.BlobWriter('application/zip');
      var writer     = new window.zip.ZipWriter(blobWriter, zipOpts);
      await writer.add('mentordashboard-backup.json', new window.zip.TextReader(jsonStr));
      await writer.close();
      var zipBlob = await blobWriter.getData();
      var date    = new Date().toISOString().slice(0, 10);
      var fname   = 'mentordashboard-backup-' + date + '.zip';
      var url     = URL.createObjectURL(zipBlob);
      var a       = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (statusEl) {
        statusEl.style.color = '#059669';
        statusEl.textContent = 'Backup gedownload: ' + fname + (password ? ' (beveiligd)' : '');
      }
      if (backupPasswordInput) backupPasswordInput.value = '';
    } catch (err) {
      if (statusEl) { statusEl.style.color = '#dc2626'; statusEl.textContent = 'Fout bij exporteren: ' + (err.message || String(err)); }
      console.error('[backup] Export error:', err);
    } finally {
      if (backupExportBtn) { backupExportBtn.disabled = false; backupExportBtn.textContent = 'Exporteer backup'; }
    }
  }

  // ── handleBackupImport(file, password) — zip restore ────────────────────
  async function handleBackupImport(file, password) {
    var resultsEl = backupImportResults || backupResults;
    if (!window.zip) {
      showBackupImportResult('error', 'ZIP-bibliotheek niet geladen. Ververs de pagina.');
      return;
    }
    if (!file) return;
    if (!/\.zip$/i.test(file.name)) {
      showBackupImportResult('error', 'Alleen .zip backup-bestanden worden ondersteund.');
      return;
    }
    try {
      showBackupImportResult('info', 'Backup lezen...');
      var blobReader = new window.zip.BlobReader(file);
      var reader     = new window.zip.ZipReader(blobReader);
      var entries    = await reader.getEntries();
      var jsonEntry  = entries.find(function(e) { return e.filename === 'mentordashboard-backup.json'; });
      if (!jsonEntry) {
        await reader.close();
        showBackupImportResult('error', 'Ongeldig backup-bestand: mentordashboard-backup.json niet gevonden in zip.');
        return;
      }
      var jsonStr;
      try {
        var readerOpts = password ? { password: password } : {};
        jsonStr = await jsonEntry.getData(new window.zip.TextWriter(), readerOpts);
      } catch (err) {
        await reader.close();
        // Detect encrypted entry (zip.js throws with ERR_ENCRYPTED or string match)
        var msg = err.message || '';
        if (msg === window.zip.ERR_ENCRYPTED || msg.indexOf('ncrypt') !== -1) {
          _pendingRestoreFile = file;
          if (backupPasswordPrompt) backupPasswordPrompt.style.display = 'block';
          showBackupImportResult('warn', 'Deze backup is beveiligd met een wachtwoord.');
          return;
        }
        if (msg === window.zip.ERR_INVALID_PASSWORD || msg.indexOf('password') !== -1 || msg.indexOf('wachtwoord') !== -1) {
          showBackupImportResult('error', 'Verkeerd wachtwoord. Probeer opnieuw.');
          if (backupPasswordPrompt) backupPasswordPrompt.style.display = 'block';
          return;
        }
        throw err;
      }
      await reader.close();
      var payload = JSON.parse(jsonStr);
      if (!payload || typeof payload.version !== 'number') {
        showBackupImportResult('error', 'Ongeldig backup-formaat: geen version veld gevonden.');
        return;
      }

      _pendingBackupPayload = payload;
      if (backupPasswordPrompt) backupPasswordPrompt.style.display = 'none';

      // Show overschrijven/samenvoegen choice if data exists; otherwise direct restore
      var heeftData = Object.keys(window.klassenState.klassen).length > 0;
      if (heeftData) {
        if (backupRestoreChoice) backupRestoreChoice.style.display = 'block';
        showBackupImportResult('info', 'Backup gelezen. Kies hieronder hoe je wilt herstellen.');
      } else {
        _finishRestore('overschrijven');
      }
    } catch (err) {
      showBackupImportResult('error', 'Fout bij importeren: ' + (err.message || String(err)));
      console.error('[backup] Import error:', err);
    } finally {
      if (backupFileInput) backupFileInput.value = '';
    }
  }

  // ── _finishRestore(mode) — applies backup and refreshes UI ───────────────
  function _finishRestore(mode) {
    if (backupRestoreChoice) backupRestoreChoice.style.display = 'none';
    try {
      var result = window.applyBackupRestore(_pendingBackupPayload, mode);
      _pendingBackupPayload = null;
      _pendingRestoreFile   = null;
      if (mode === 'samenvoegen' && result) {
        showBackupImportResult('success', 'Samenvoegen gelukt: ' + result.toegevoegd + ' klas(sen) toegevoegd, ' + result.overgeslagen + ' overgeslagen.');
        renderKlasTabStrip();
        updateNavCount();
      } else {
        showBackupImportResult('success', 'Backup hersteld. Pagina wordt herladen...');
        setTimeout(function() { location.reload(); }, 1200);
      }
    } catch (err) {
      showBackupImportResult('error', 'Fout bij herstellen: ' + (err.message || String(err)));
      console.error('[backup] Restore error:', err);
    }
  }

  function showBackupImportResult(type, text) {
    var el = backupImportResults || backupResults;
    if (!el) return;
    el.style.display = 'block';
    var colorMap = { success: '#059669', error: '#dc2626', warn: '#d97706', info: '#6b7280' };
    el.style.color = colorMap[type] || '#374151';
    el.textContent = text;
  }

  function showBackupResult(html) {
    if (backupResults) {
      backupResults.style.display = 'block';
      backupResults.innerHTML = html;
    }
  }

  // ── Backup event wiring ───────────────────────────────────────────────────
  if (backupExportBtn) {
    backupExportBtn.addEventListener('click', handleBackupExport);
  }
  if (backupChooseBtn && backupFileInput) {
    backupChooseBtn.addEventListener('click', function() { backupFileInput.click(); });
    backupFileInput.addEventListener('change', function() {
      var file = backupFileInput.files[0];
      if (file) {
        if (backupPasswordPrompt) backupPasswordPrompt.style.display = 'none';
        if (backupRestoreChoice) backupRestoreChoice.style.display = 'none';
        handleBackupImport(file, null);
      }
    });
  }
  if (backupImportPwBtn && backupImportPwInput) {
    backupImportPwBtn.addEventListener('click', function() {
      var pwd = backupImportPwInput.value.trim();
      if (!pwd) return;
      if (_pendingRestoreFile) handleBackupImport(_pendingRestoreFile, pwd);
    });
  }
  if (backupOverwriteBtn) backupOverwriteBtn.addEventListener('click', function() { _finishRestore('overschrijven'); });
  if (backupMergeBtn)     backupMergeBtn.addEventListener('click',     function() { _finishRestore('samenvoegen'); });

  // Drag-and-drop on backup zone
  if (backupZone) {
    backupZone.addEventListener('dragover',  function(e) { e.preventDefault(); backupZone.classList.add('drag-over'); });
    backupZone.addEventListener('dragleave', function()  { backupZone.classList.remove('drag-over'); });
    backupZone.addEventListener('drop', function(e) {
      e.preventDefault();
      backupZone.classList.remove('drag-over');
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        if (backupPasswordPrompt) backupPasswordPrompt.style.display = 'none';
        if (backupRestoreChoice)  backupRestoreChoice.style.display  = 'none';
        handleBackupImport(file, null);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Phase 04 helpers (referenced from Phase 01/02 code above)
  // ---------------------------------------------------------------------------

  function showNaarKlasBtn() {
    const existing = document.getElementById('naar-klas-btn');
    if (existing) return; // al aanwezig
    const btn = document.createElement('button');
    btn.id = 'naar-klas-btn';
    btn.className = 'btn btn-primary';
    btn.style.cssText = 'margin-top:1.25rem;';
    btn.textContent = 'Naar klasoverzicht →';
    btn.addEventListener('click', () => showView('klas'));
    document.getElementById('import-results').appendChild(btn);
  }

  // ---------------------------------------------------------------------------
  // Phase 04 — Klasoverzicht: navigatie, rendering, sortering, zoeken
  // ---------------------------------------------------------------------------

  const VERZUIM_DREMPEL_MIN = 600; // 10 uur ongeoorloofd = oranje/warning

  const navImport    = document.getElementById('nav-import');
  const navOverzicht = document.getElementById('nav-overzicht');
  const navCount     = document.getElementById('nav-student-count');
  const importView   = document.getElementById('import-view');
  const klasView     = document.getElementById('klasoverzicht-view');
  const klasZoek     = document.getElementById('klas-zoek');
  // klasTbody (#klas-tbody) removed — replaced by #klas-grid in Phase 6 Plan 01
  const klasLeeg     = document.getElementById('klas-leeg');
  const wisDataBtn   = document.getElementById('wis-data-btn');

  let sortKey   = 'naam';   // 'naam' | 'status' | 'verzuim'
  let sortAsc   = true;
  let zoekTerm  = '';

  // ── Navigatie ──────────────────────────────────────────────────────────

  function showView(view) {
    hideEmptyKlassenState(); // Phase 6: ensure main-nav visible whenever a view is shown
    importView.style.display = 'none';
    klasView.style.display   = 'none';
    detailView.style.display = 'none';
    navImport.classList.remove('active');
    navOverzicht.classList.remove('active');

    if (view === 'detail') {
      detailView.style.display = 'block';
      navOverzicht.classList.add('active');
    } else if (view === 'klas') {
      klasView.style.display   = 'block';
      navOverzicht.classList.add('active');
      renderKlasGrid();
    } else {
      importView.style.display = 'block';
      navImport.classList.add('active');
    }
  }

  navImport.addEventListener('click', () => showView('import'));
  navOverzicht.addEventListener('click', () => {
    // D-14: guard — if no classes exist, fall back to empty state
    if (Object.keys(window.klassenState.klassen).length === 0) {
      showEmptyKlassenState();
      return;
    }
    showView('klas');
  });

  function updateNavCount() {
    const n = window.appState.students.length;
    navCount.textContent    = n;
    navCount.style.display  = n > 0 ? 'inline-block' : 'none';
  }

  // ── Leerlijn-toewijzing UI (NORM-01) ──────────────────────────────────

  function renderLeerlijntoewijzing() {
    if (!ltTbody) return;
    var mapping = window.getLeerlijnenMapping();
    var deelgebieden = window.DEELGEBIEDEN;
    var leerlijnen = ['lesgeven', 'organiseren', 'prof_handelen'];
    var labels = { lesgeven: 'Lesgeven', organiseren: 'Organiseren', prof_handelen: 'Professioneel handelen' };

    ltTbody.innerHTML = '';
    for (var i = 0; i < deelgebieden.length; i++) {
      var dg = deelgebieden[i];
      var current = mapping[dg.id] || dg.group;
      var isChanged = current !== dg.group;
      var tr = document.createElement('tr');
      if (isChanged) tr.classList.add('lt-changed');

      var tdLabel = document.createElement('td');
      tdLabel.textContent = dg.label;
      tr.appendChild(tdLabel);

      var tdSelect = document.createElement('td');
      var sel = document.createElement('select');
      sel.dataset.dgId = dg.id;
      for (var j = 0; j < leerlijnen.length; j++) {
        var opt = document.createElement('option');
        opt.value = leerlijnen[j];
        opt.textContent = labels[leerlijnen[j]];
        if (leerlijnen[j] === current) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener('change', onLeerlijnenChange);
      tdSelect.appendChild(sel);
      tr.appendChild(tdSelect);
      ltTbody.appendChild(tr);
    }
  }

  function onLeerlijnenChange() {
    // Collect all current select values into a mapping object
    var selects = ltTbody.querySelectorAll('select');
    var mapping = {};
    selects.forEach(function(sel) {
      mapping[sel.dataset.dgId] = sel.value;
    });
    window.saveLeerlijnenMapping(mapping);

    // Highlight changed rows
    var deelgebieden = window.DEELGEBIEDEN;
    var rows = ltTbody.querySelectorAll('tr');
    rows.forEach(function(tr, idx) {
      var dg = deelgebieden[idx];
      if (mapping[dg.id] !== dg.group) {
        tr.classList.add('lt-changed');
      } else {
        tr.classList.remove('lt-changed');
      }
    });

    // Re-calculate prognoses and re-render klasoverzicht if students loaded
    if (window.appState.students.length > 0) {
      renderKlasGrid();
    }
    ltStatus.textContent = 'Opgeslagen';
    setTimeout(function() { ltStatus.textContent = ''; }, 2000);
  }

  if (ltResetBtn) {
    ltResetBtn.addEventListener('click', function() {
      window.resetLeerlijnenMapping();
      renderLeerlijntoewijzing();
      if (window.appState.students.length > 0) {
        renderKlasGrid();
      }
      ltStatus.textContent = 'Standaard hersteld';
      setTimeout(function() { ltStatus.textContent = ''; }, 2000);
    });
  }

  // ── Status berekening (gecombineerd prognose + verzuim) ─────────────────
  // rood   = negatief prognose
  // oranje = neutraal prognose OF ongeoorloofd > drempel
  // groen  = sbl (op koers)
  // blauw  = sbc (profieljaar)
  // grijs  = onbekend (geen scores)

  // ── Normset selector ───────────────────────────────────────────────────
  const normsetSelect = document.getElementById('normset-select');
  let activeTraject = localStorage.getItem('activeTraject') || 'auto';
  normsetSelect.value = activeTraject;

  normsetSelect.addEventListener('change', function() {
    activeTraject = normsetSelect.value;
    localStorage.setItem('activeTraject', activeTraject);
    renderKlasGrid();
    if (detailStudentId) showDetail(detailStudentId);
  });

  // Detecteer traject op basis van periode/leerjaar veld uit de PDF
  function detectTraject(student) {
    const periode  = String(student.periode  || '').toLowerCase();
    const leerjaar = String(student.leerjaar || '').trim();

    // BJ1-varianten die in echte PDF-imports voorkomen (per D-05, Phase 9)
    const bj1Patterns = ['bj1', '1e jaar', 'jaar 1', 'leerjaar 1', 'bj 1', 'klas 1'];
    const matchesBJ1 = bj1Patterns.some(function(p) {
      return periode.indexOf(p) !== -1;
    });

    // BJ2-varianten — expliciet matchen geeft zekerheid (anders onzeker)
    const bj2Patterns = ['bj2', '2e jaar', 'jaar 2', 'leerjaar 2', 'bj 2', 'klas 2'];
    const matchesBJ2 = bj2Patterns.some(function(p) {
      return periode.indexOf(p) !== -1;
    });

    // Periode is leidend — 'Leerjaar' in CIOS PDF ≠ schooljaar (BJ2-leerlingen hebben Leerjaar 1)
    if (matchesBJ1) return 'bj1';
    if (matchesBJ2) return 'bj2';

    // Alleen leerjaar als fallback wanneer periode niets herkent
    if (leerjaar === '1') return 'bj1';
    if (leerjaar === '2') return 'bj2';

    // Onzeker — log waarschuwing en val terug op bj2 (huidige default)
    console.warn('[detectTraject] Onzeker traject voor student:', (student && student.naam) || '(onbekend)', '— valt terug op bj2');
    return 'bj2';
  }

  function berekenStatus(student) {
    const traject = activeTraject === 'auto' ? detectTraject(student) : activeTraject;
    const p = window.berekenPrognose(student, traject);
    const ongeoorloofd = student.verzuim ? student.verzuim.ongeoorloofd : 0;
    const heeftScores  = p.totaalVoldoendeOfHoger + p.totaalOnvoldoende > 0;

    if (!heeftScores) return { kleur: 'grijs', label: 'Onbekend', prognose: p };
    if (p.label === 'negatief')     return { kleur: 'rood',   label: 'Risico',         prognose: p };
    if (p.label === 'neutraal')     return { kleur: 'oranje', label: 'Let op',          prognose: p };
    if (ongeoorloofd > VERZUIM_DREMPEL_MIN)
                                    return { kleur: 'oranje', label: 'Verzuim',         prognose: p };
    // BJ2 uitkomsten
    if (p.label === 'sbc')          return { kleur: 'blauw',  label: 'Profieljaar SBC', prognose: p };
    if (p.label === 'sbl')          return { kleur: 'groen',  label: 'Op koers',        prognose: p };
    // BJ1 uitkomsten
    if (p.label === 'versneld_sbc') return { kleur: 'blauw',  label: 'Versneld SBC',    prognose: p };
    if (p.label === 'bj2')          return { kleur: 'groen',  label: 'Op koers BJ2',    prognose: p };
    return                                 { kleur: 'groen',  label: 'Op koers',        prognose: p };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  const STATUS_VOLGORDE = { rood: 0, oranje: 1, groen: 2, blauw: 3, grijs: 4 };
  const RAG_BORDER = { groen: '#22c55e', oranje: '#f97316', rood: '#ef4444', grijs: '#d1d5db', blauw: '#3b82f6' };

  function minNaarUren(min) {
    if (!min || min === 0) return '—';
    const u = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${u}u${m}m` : `${u}u`;
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  function buildMiniVerzuimBar(student) {
    if (!student.verzuim) return `<span style="color:var(--text-faint);font-size:0.8rem;">—</span>`;
    const v      = student.verzuim;
    const totaal = (v.aanwezigheid || 0) + (v.geoorloofd || 0) + (v.ongeoorloofd || 0);
    if (!totaal) return `<span style="color:var(--text-faint);font-size:0.8rem;">—</span>`;
    const pA = Math.round((v.aanwezigheid || 0) / totaal * 100);
    const pG = Math.round((v.geoorloofd   || 0) / totaal * 100);
    const pO = 100 - pA - pG;
    const kleurTekst = v.ongeoorloofd > 600 ? '#991b1b' : '#6b7280';
    const ongeoorloofdTekst = v.ongeoorloofd > 0
      ? `<div style="font-size:0.75rem;color:${kleurTekst};margin-top:3px;">${minNaarUren(v.ongeoorloofd)} ongeoorloofd</div>`
      : '';
    return `<div class="mini-verzuim-bar">
      <div class="mvb-seg mvb-aanwezig"     style="width:${pA}%"></div>
      <div class="mvb-seg mvb-geoorloofd"   style="width:${pG}%"></div>
      <div class="mvb-seg mvb-ongeoorloofd" style="width:${pO}%"></div>
    </div>${ongeoorloofdTekst}`;
  }

  // ── Renderen ───────────────────────────────────────────────────────────

  // -- KPI strip (Phase 08, KPI-01, D-05 through D-08) --
  function renderKpiStrip() {
    var strip = document.getElementById('kpi-strip');
    if (!strip) return;

    var students = window.getActiveStudents();
    if (students.length === 0) {
      strip.innerHTML = '';
      return;
    }

    var statuses = students.map(function(s) { return berekenStatus(s); });

    // KPI 1: % op schema (groen + blauw) — per D-06
    var opSchema = statuses.filter(function(st) {
      return st.kleur === 'groen' || st.kleur === 'blauw';
    }).length;
    var pctOpSchema = Math.round(opSchema / students.length * 100);

    // KPI 2: aantal risicoleerlingen (rood) — per D-06
    var aantalRisico = statuses.filter(function(st) {
      return st.kleur === 'rood';
    }).length;

    // KPI 3: gem. ongeoorloofd verzuim (in uren, 1 decimal) — per D-06
    var metVerzuim = students.filter(function(s) { return s.verzuim && s.verzuim.ongeoorloofd > 0; });
    var gemVerzuim = null;
    if (metVerzuim.length > 0) {
      var totaalMinuten = metVerzuim.reduce(function(sum, s) { return sum + (s.verzuim.ongeoorloofd || 0); }, 0);
      gemVerzuim = (totaalMinuten / metVerzuim.length / 60).toFixed(1);
    }

    // KPI 4: gem. deelgebieden beoordeeld — per D-06
    var totaalDp = students.reduce(function(sum, s) {
      if (!s.deelgebiedScores) return sum;
      return sum + Object.values(s.deelgebiedScores).filter(function(v) { return v !== null && v !== undefined; }).length;
    }, 0);
    var gemDp = (totaalDp / students.length).toFixed(1);
    // If no student has any scores, show dash
    if (totaalDp === 0) gemDp = null;

    // Build tile HTML — per D-08: null values show "\u2014" (em-dash)
    strip.innerHTML =
      buildKpiTile(pctOpSchema !== null && students.length > 0 ? pctOpSchema + '%' : '\u2014', 'Op schema') +
      buildKpiTile(aantalRisico !== null && students.length > 0 ? String(aantalRisico) : '\u2014', 'Risicoleerlingen') +
      buildKpiTile(gemVerzuim !== null ? gemVerzuim + 'u' : '\u2014', 'Gem. ongeoorl. verzuim') +
      buildKpiTile(gemDp !== null ? gemDp + ' dp' : '\u2014', 'Gem. dp beoordeeld');
  }

  function buildKpiTile(value, label) {
    return '<div class="kpi-tile">' +
      '<div class="kpi-value">' + value + '</div>' +
      '<div class="kpi-label">' + label + '</div>' +
      '</div>';
  }

  function renderKlasGrid() {
    renderKpiStrip(); // Phase 08 — KPI tiles (MUST be before early-return guard)
    updateNavCount();

    const students = window.getActiveStudents();
    if (students.length === 0) {
      klasGrid.innerHTML = '';
      klasLeeg.style.display = 'block';
      klasLeeg.textContent = 'Nog geen leerlingen geimporteerd.';
      return;
    }

    // Calculate status + search filter
    let rijen = students.map(s => ({ student: s, status: berekenStatus(s) }));

    if (zoekTerm) {
      const q = zoekTerm.toLowerCase();
      rijen = rijen.filter(r => r.student.naam.toLowerCase().includes(q));
    }

    // Sort
    rijen.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'naam') {
        cmp = a.student.naam.localeCompare(b.student.naam, 'nl');
      } else if (sortKey === 'status') {
        cmp = STATUS_VOLGORDE[a.status.kleur] - STATUS_VOLGORDE[b.status.kleur];
      } else if (sortKey === 'verzuim') {
        const av = a.student.verzuim ? a.student.verzuim.ongeoorloofd : 0;
        const bv = b.student.verzuim ? b.student.verzuim.ongeoorloofd : 0;
        cmp = bv - av;
      }
      return sortAsc ? cmp : -cmp;
    });

    if (rijen.length === 0) {
      klasGrid.innerHTML = '';
      klasLeeg.style.display = 'block';
      klasLeeg.textContent = 'Geen leerlingen gevonden voor "' + zoekTerm + '".';
      return;
    }

    klasLeeg.style.display = 'none';

    // Track ordered list for prev/next in detail view
    detailStudentList = rijen.map(r => r.student.leerlingId);

    // Build tiles
    klasGrid.innerHTML = rijen.map(({ student: s, status }) => {
      const borderColor = RAG_BORDER[status.kleur] || RAG_BORDER.grijs;
      const miniBar = buildMiniVerzuimBar(s);

      return '<div class="klas-tile" data-id="' + escapeHtml(s.leerlingId) + '" tabindex="0"'
        + ' style="border-left-color: ' + borderColor + ';">'
        + '<div class="klas-tile-naam">' + escapeHtml(s.naam) + '</div>'
        + '<span class="status-badge status-' + status.kleur + '">' + escapeHtml(status.label) + '</span>'
        + '<div>' + miniBar + '</div>'
        + '</div>';
    }).join('');
  }

  // Tile click → detail view (event delegation)
  klasGrid.addEventListener('click', (e) => {
    const tile = e.target.closest('.klas-tile[data-id]');
    if (tile) showDetail(tile.dataset.id);
  });

  // Keyboard support for tile navigation
  klasGrid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const tile = e.target.closest('.klas-tile[data-id]');
      if (tile) showDetail(tile.dataset.id);
    }
  });

  // ── Sorteerknoppen ─────────────────────────────────────────────────────

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.sort;
      if (sortKey === key) {
        sortAsc = !sortAsc;
      } else {
        sortKey = key;
        sortAsc = key === 'naam'; // naam: A→Z standaard; status/verzuim: laagste/hoogste eerst
      }
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderKlasGrid();
    });
  });

  // ── Rij-klik → detailweergave ──────────────────────────────────────────
  // NOTE: klasTbody (#klas-tbody) removed in Phase 6 Plan 01 — replaced by #klas-grid tile grid.
  // Tile click handler will be added in Plan 03.

  // ── Zoeken ─────────────────────────────────────────────────────────────

  klasZoek.addEventListener('input', () => {
    zoekTerm = klasZoek.value.trim();
    renderKlasGrid();
  });

  // ── Wis alle data ──────────────────────────────────────────────────────

  wisDataBtn.addEventListener('click', () => {
    var activeKlas = window.klassenState.klassen[window.klassenState.activeKlasId];
    var klasNaam = activeKlas ? activeKlas.naam : 'deze klas';
    if (!confirm("Klas '" + klasNaam + "' en alle leerlingdata verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
    window.deleteKlas(window.klassenState.activeKlasId);
    detailStudentId   = null;
    detailStudentList = [];
    updateNavCount();
    renderKlasTabStrip();
    // Reset import UI
    document.getElementById('import-results').style.display = 'none';
    document.getElementById('import-progress').style.display = 'none';
    document.getElementById('excel-import-results').style.display = 'none';
    if (ltSection) ltSection.style.display = 'none';
    // If no classes remain, show empty state
    if (Object.keys(window.klassenState.klassen).length === 0) {
      showEmptyKlassenState();
    } else {
      showView('klas');
    }
  });

  // ── Auto-save helper (aangeroepen na elke import) ───────────────────────

  function autoSave() {
    window.saveKlassen();    // Phase 6: authoritative save
    window.saveState();      // Backward compat — harmless redundancy
    updateNavCount();
    console.log('[app.js] State opgeslagen (' + window.appState.students.length + ' leerlingen)');
    // Show leerlijn-toewijzing section when students are loaded (NORM-01)
    if (ltSection && window.appState.students.length > 0) {
      ltSection.style.display = 'block';
      renderLeerlijntoewijzing();
    }
  }

  // Hook auto-save in na PDF import — patch importPDFs resultaat
  // (wordt aangeroepen aan einde van de bestaande importPDFs functie via event)
  const _origShowImportResults = showImportResults;
  // Expose autoSave zodat importPDFs het kan aanroepen
  window._afterPDFImport = autoSave;

  // ---------------------------------------------------------------------------
  // Phase 05 — Detailweergave per leerling
  // ---------------------------------------------------------------------------

  const NOTITIES_KEY = 'mentordashboard_notities';
  let detailStudentId   = null;
  let detailStudentList = []; // leerlingIds in current klas sort order

  const LEERLIJN_LABEL = {
    lesgeven:      'Lesgeven',
    organiseren:   'Organiseren',
    prof_handelen: 'Prof. handelen',
  };

  const SCORE_CHIP_MAP = {
    onvoldoende: { css: 'score-o', kort: 'O' },
    voldoende:   { css: 'score-v', kort: 'V' },
    goed:        { css: 'score-g', kort: 'G' },
    excellent:   { css: 'score-e', kort: 'E' },
  };

  function loadNotities() {
    try { return JSON.parse(localStorage.getItem(NOTITIES_KEY) || '{}'); } catch(e) { return {}; }
  }

  function saveNotitie(id, text) {
    const n = loadNotities();
    if (text.trim()) n[id] = text; else delete n[id];
    try { localStorage.setItem(NOTITIES_KEY, JSON.stringify(n)); } catch(e) {}
  }

  function getNotitie(id) {
    return loadNotities()[id] || '';
  }

  function showDetail(leerlingId) {
    // Get the most recent record for this leerlingId (D-07: prognose uses most-recent)
    var allRecords = window.appState.students.filter(function(s) { return s.leerlingId === leerlingId; });
    if (allRecords.length === 0) return;
    allRecords.sort(function(a, b) { return (b.periode || '').localeCompare(a.periode || ''); });
    var student = allRecords[0]; // most recent
    // Pitfall 4 mitigation: if most-recent record lacks verzuim, inherit from any record that has it
    if (!student.verzuim) {
      for (var i = 1; i < allRecords.length; i++) {
        if (allRecords[i].verzuim) { student = Object.assign({}, student, { verzuim: allRecords[i].verzuim }); break; }
      }
    }
    detailStudentId = leerlingId;
    // If not in current list (direct call), build from deduplicated active students
    if (!detailStudentList.includes(leerlingId)) {
      detailStudentList = window.getActiveStudents().map(function(s) { return s.leerlingId; });
    }
    detailView.innerHTML = buildDetailHTML(student);
    showView('detail');
    wireDetailEvents();
  }

  // ---------------------------------------------------------------------------
  // Phase 05-03 — Toetsplan tijdlijn utility functions
  // ---------------------------------------------------------------------------

  function normDatapunt(s) {
    return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function findPDFScoresForDatapunt(datapuntId, studentDatapunten) {
    var norm = normDatapunt(datapuntId);
    for (var i = 0; i < studentDatapunten.length; i++) {
      var dpNorm = normDatapunt(studentDatapunten[i].datapunt);
      if (dpNorm === norm || dpNorm.startsWith(norm + ' ') || dpNorm.startsWith(norm + ':')) {
        return studentDatapunten[i].scores || {};
      }
    }
    return null;
  }

  // Debug helper: call window.debugToetsplanKoppeling() in the console to inspect matching
  window.debugToetsplanKoppeling = function(leerlingId) {
    var toetsplan = getActiveToetsplan();
    if (!toetsplan) { console.log('Geen toetsplan geladen.'); return; }
    var student = window.appState.students.find(function(s) { return s.leerlingId === leerlingId; });
    if (!student) { console.log('Student niet gevonden:', leerlingId); return; }
    var allRecords = window.getAllRecordsForStudent(leerlingId);
    var studentDP = [];
    allRecords.forEach(function(rec) { (rec.datapunten || []).forEach(function(dp) { studentDP.push(dp); }); });
    console.group('Toetsplan koppeling voor ' + (student.naam || leerlingId));
    console.log('Toetsplan datapunten (' + toetsplan.length + '):', toetsplan.slice(0, 5).map(function(d) { return d.datapunt; }));
    console.log('Student PDF datapunten (' + studentDP.length + '):', studentDP.slice(0, 5).map(function(d) { return d.datapunt; }));
    var matched = 0;
    toetsplan.forEach(function(tp) {
      var found = findPDFScoresForDatapunt(tp.datapunt, studentDP);
      if (found) matched++;
    });
    console.log('Overeenkomsten: ' + matched + '/' + toetsplan.length);
    if (matched === 0 && studentDP.length > 0) {
      console.warn('Geen overeenkomsten gevonden. Vergelijk toetsplan codes met PDF codes:');
      console.log('  Toetsplan voorbeeld:', toetsplan[0] && toetsplan[0].datapunt);
      console.log('  PDF voorbeeld:', studentDP[0] && studentDP[0].datapunt);
    }
    console.groupEnd();
  };

  function getActiveToetsplan() {
    if (!window.klassenState.activeKlasId) return null;
    var klas = window.klassenState.klassen[window.klassenState.activeKlasId];
    return (klas && klas.toetsplan && klas.toetsplan.length > 0) ? klas.toetsplan : null;
  }

  // Detect a student's school-year prefix from their periode field.
  // Returns lowercase prefix like 'bj1', 'bj2', 'pj', 'exj', or null (= show all).
  function detectJaarPrefix(student) {
    var p = String(student.periode || '').toLowerCase();
    if (p.indexOf('bj1') !== -1) return 'bj1';
    if (p.indexOf('bj2') !== -1) return 'bj2';
    if (p.indexOf('exj') !== -1 || p.indexOf('ex-j') !== -1) return 'exj';
    if (p.indexOf('pj') !== -1) return 'pj';
    return null;
  }

  // Filter toetsplan fases to only those matching the student's school year.
  // Klas-level schooljaar setting takes precedence over per-student auto-detection.
  function filterFasesForStudent(faseOrder, student) {
    var activeKlas = getActiveKlas();
    var jaar = (activeKlas && activeKlas.schooljaar) ? activeKlas.schooljaar : detectJaarPrefix(student);
    if (!jaar) return faseOrder; // unknown year — show all
    return faseOrder.filter(function(fase) {
      return fase.toLowerCase().indexOf(jaar) !== -1;
    });
  }

  function buildDetailTijdlijn(student) {
    var toetsplan = getActiveToetsplan();
    if (!toetsplan) return ''; // hidden when no toetsplan

    // Aggregate best deelgebied score across all PDF imports for this student
    // Key: dg.id → best score string (e.g. "voldoende")
    var allRecords = window.getAllRecordsForStudent(student.leerlingId);
    var dgBestScore = {};  // { dgId: scoreString }
    allRecords.forEach(function(rec) {
      var recScores = rec.deelgebiedScores || {};
      window.DEELGEBIEDEN.forEach(function(dg) {
        var score = recScores[dg.label] || null;
        if (!score) return;
        var rank = window.SCORE_LEVELS.indexOf(score);
        var curRank = dgBestScore[dg.id] ? window.SCORE_LEVELS.indexOf(dgBestScore[dg.id]) : -1;
        if (rank > curRank) dgBestScore[dg.id] = score;
      });
    });
    var hasAnyPDFData = Object.keys(dgBestScore).length > 0;

    var GROEPEN = [
      { key: 'lesgeven',      label: 'Lesgeven',      color: '#1e40af' },
      { key: 'organiseren',   label: 'Organiseren',   color: '#166534' },
      { key: 'prof_handelen', label: 'Prof. handelen', color: '#6b21a8' },
    ];

    // Group toetsplan datapunten by fase, then filter to student's school year
    var faseOrder = [];
    var faseMap = {};
    toetsplan.forEach(function(dp) {
      if (!faseMap[dp.fase]) { faseMap[dp.fase] = []; faseOrder.push(dp.fase); }
      faseMap[dp.fase].push(dp);
    });
    faseOrder = filterFasesForStudent(faseOrder, student);
    if (faseOrder.length === 0) return ''; // no matching fases for this student's year

    var LABEL_W   = 160;
    var BAR_H     = 24;
    var ROW_GAP   = 10;
    var GROUP_GAP = 24;
    var BAR_R     = 6;
    var NM_W      = 52;
    var barAreaW  = 400;
    var svgW      = LABEL_W + barAreaW + NM_W;

    var parts = [];
    var totalHeight = 0;

    GROEPEN.forEach(function(grp) {
      var dgIds = window.DEELGEBIEDEN.filter(function(d) { return d.group === grp.key; });
      var dgTotal = dgIds.length;

      // Group title row
      parts.push('<text x="0" y="' + (totalHeight + 14) + '" font-size="13" font-weight="700" fill="' + grp.color + '">' + escapeHtml(grp.label) + ' (' + dgTotal + ')</text>');
      totalHeight += 22;

      faseOrder.forEach(function(fase) {
        var dpInFase = faseMap[fase];
        // Count deelgebieden in this fase that this student has scored >= voldoende
        // A deelgebied "counts" if it appears in at least one datapunt in this fase
        var faseDeelgebieden = {};
        dpInFase.forEach(function(dp) {
          dp.deelgebieden.forEach(function(dgId) { faseDeelgebieden[dgId] = true; });
        });
        var faseDGIds = dgIds.filter(function(dg) { return faseDeelgebieden[dg.id]; });
        var faseDGTotal = faseDGIds.length;
        var countV = 0;
        faseDGIds.forEach(function(dg) {
          var score = dgBestScore[dg.id];
          if (score && window.SCORE_LEVELS.indexOf(score) >= 1) countV++;
        });
        // Fall back to all DGs in group if fase has no deelgebied data
        if (faseDGTotal === 0) { faseDGTotal = dgTotal; }

        var y = totalHeight;
        // Phase label (truncate long names)
        var faseLabel = fase.length > 18 ? fase.slice(0, 16) + '\u2026' : fase;
        parts.push('<text x="' + (LABEL_W - 8) + '" y="' + (y + BAR_H - 6) + '" font-size="12" fill="#374151" text-anchor="end">' + escapeHtml(faseLabel) + '</text>');

        // Bar track
        parts.push('<rect x="' + LABEL_W + '" y="' + y + '" width="' + barAreaW + '" height="' + BAR_H + '" rx="' + BAR_R + '" fill="#e5e7eb"/>');

        // Bar fill (proportional to faseDGTotal)
        if (faseDGTotal > 0 && countV > 0) {
          var fillW = Math.round((countV / faseDGTotal) * barAreaW);
          parts.push('<rect x="' + LABEL_W + '" y="' + y + '" width="' + fillW + '" height="' + BAR_H + '" rx="' + BAR_R + '" fill="#22c55e">'
            + '<title>' + escapeHtml(fase) + ': ' + countV + '/' + faseDGTotal + ' \u2265 Voldoende</title></rect>');
          if (fillW > 40) {
            var pct = Math.round((countV / faseDGTotal) * 100);
            parts.push('<text x="' + (LABEL_W + fillW / 2) + '" y="' + (y + BAR_H - 6) + '" font-size="11" fill="#fff" text-anchor="middle" font-weight="600">' + pct + '%</text>');
          }
        }

        // N/M label to the right
        var labelX = LABEL_W + barAreaW + 6;
        parts.push('<text x="' + labelX + '" y="' + (y + BAR_H - 6) + '" font-size="12" fill="#6b7280">' + countV + '/' + faseDGTotal + '</text>');

        totalHeight += BAR_H + ROW_GAP;
      });

      totalHeight += GROUP_GAP - ROW_GAP;
    });

    var noScoreMsg = !hasAnyPDFData
      ? '<p style="color:#9ca3af;font-size:0.85rem;margin-top:0.5rem;">Nog geen PDF\'s ge\u00efmporteerd voor deze leerling. Scores worden getoond na import.</p>'
      : '';

    return '<div class="detail-section">'
      + '<div class="detail-section-title">Leerlijnontwikkeling</div>'
      + '<div style="overflow-x:auto;">'
      + '<svg viewBox="0 0 ' + svgW + ' ' + totalHeight + '" width="100%" height="' + totalHeight + '" style="display:block;min-width:300px;max-width:700px;">'
      + parts.join('')
      + '</svg>'
      + '</div>'
      + noScoreMsg
      + '</div>';
  }

  function buildDetailSpiderweb(student) {
    if (!window.SpiderChart || typeof window.SpiderChart.buildSpiderSVG !== 'function') {
      if (!buildDetailSpiderweb._warned) {
        console.warn('SpiderChart module not loaded — spiderweb section skipped');
        buildDetailSpiderweb._warned = true;
      }
      return '';
    }
    var scores = (student && student.deelgebiedScores) || {};
    var GROEPEN = [
      { key: 'lesgeven',      label: 'Lesgeven',       fillVar: 'var(--spider-lesgeven)',      strokeVar: 'var(--spider-lesgeven-stroke)' },
      { key: 'organiseren',   label: 'Organiseren',    fillVar: 'var(--spider-organiseren)',   strokeVar: 'var(--spider-organiseren-stroke)' },
      { key: 'prof_handelen', label: 'Prof. handelen', fillVar: 'var(--spider-prof-handelen)', strokeVar: 'var(--spider-prof-handelen-stroke)' },
    ];
    var cards = GROEPEN.map(function (grp) {
      var axes = (window.DEELGEBIEDEN || [])
        .filter(function (dg) { return dg.group === grp.key; })
        .map(function (dg) { return { label: dg.label, scoreKey: dg.label }; }); // dg.label — NOT dg.id (per D-05)
      var hasScores = axes.some(function (ax) { return !!scores[ax.scoreKey]; });
      var inner = hasScores
        ? window.SpiderChart.buildSpiderSVG(axes, scores, grp.fillVar, grp.strokeVar)
        : '<div class="spider-empty">Geen scores beschikbaar</div>';
      return '<div class="spider-card">' + inner
        + '<div class="spider-leerlijn-title">' + escapeHtml(grp.label) + '</div></div>';
    }).join('');
    return '<div class="detail-section">'
      + '<div class="detail-section-title">Spiderweb overzicht</div>'
      + '<div class="spider-charts-row">' + cards + '</div>'
      + '</div>';
  }

  function buildDetailHTML(student) {
    const status = berekenStatus(student);
    const p      = status.prognose;
    const idx    = detailStudentList.indexOf(student.leerlingId);
    const prevId = idx > 0 ? detailStudentList[idx - 1] : null;
    const nextId = idx < detailStudentList.length - 1 ? detailStudentList[idx + 1] : null;
    return buildDetailHeader(student, prevId, nextId)
      + buildDetailPrognose(status, p, student)
      + buildDetailAanvullend(student)
      + buildDetailStage(student)
      + buildDetailTijdlijn(student)
      + buildDetailDeelgebiedenTijdlijn(student, getActiveToetsplan() || [])
      + buildDetailFeedback(student)
      + buildDetailLeerlijnen(p)
      + buildDetailSpiderweb(student)
      + buildDetailDeelgebieden(student)
      + buildDetailVerzuim(student)
      + buildDetailVakken(student)
      + buildDetailNotities(student.leerlingId);
  }

  function buildDetailHeader(student, prevId, nextId) {
    const meta = [student.periode, student.leerjaar].filter(Boolean).map(escapeHtml).join(' · ');
    return `<div class="detail-header">
      <button class="detail-nav-btn" id="detail-back">← Terug</button>
      <div class="detail-student-info">
        <span class="detail-student-naam">${escapeHtml(student.naam)}</span>
        ${meta ? `<span class="detail-student-meta">${meta}</span>` : ''}
      </div>
      <div class="detail-nav-arrows">
        <button class="detail-nav-btn" id="detail-prev"${prevId ? ` data-id="${escapeHtml(prevId)}"` : ' disabled'}>‹ Vorige</button>
        <button class="detail-nav-btn" id="detail-next"${nextId ? ` data-id="${escapeHtml(nextId)}"` : ' disabled'}>Volgende ›</button>
      </div>
    </div>`;
  }

  function buildDetailPrognose(status, p, student) {
    const trajectLabel = student ? (detectTraject(student) === 'bj1' ? 'BJ1' : 'BJ2') : (p.traject === 'bj1' ? 'BJ1' : 'BJ2');
    const items = [];

    if (p.isNegatief) {
      items.push(`<div class="gap-item gap-danger">Negatief advies: ${p.totaalOnvoldoende} onvoldoende(s) — max. 6 totaal, max. 2 per leerlijn</div>`);
    } else {
      const ruimte = p.gaps.onvoldoendeRuimte;
      if (ruimte <= 1) {
        items.push(`<div class="gap-item gap-warn">Opgelet: nog maar ${ruimte} onvoldoende(s) toegestaan (${p.totaalOnvoldoende}/6 O)</div>`);
      }
      for (const [ll, r] of Object.entries(p.gaps.onvoldoendeRuimtePerLeerlijn || {})) {
        if (r <= 0) items.push(`<div class="gap-item gap-warn">${escapeHtml(LEERLIJN_LABEL[ll] || ll)}: max. 2 O per leerlijn bereikt</div>`);
      }
    }

    if (p.traject === 'bj2') {
      const { nodigSBL, nodigSBC_deelgebieden, nodigSBC_kern } = p.gaps;
      items.push(nodigSBL === 0
        ? `<div class="gap-item gap-ok">SBL-norm gehaald (${p.totaalVoldoendeOfHoger}/19 ≥V, norm ≥13)</div>`
        : `<div class="gap-item gap-warn">Nog ${nodigSBL} deelgebied(en) ≥V nodig voor SBL (nu ${p.totaalVoldoendeOfHoger}/19)</div>`);
      if (nodigSBC_deelgebieden === 0 && nodigSBC_kern.length === 0) {
        items.push(`<div class="gap-item gap-ok">SBC-norm gehaald (≥15 ≥V + alle kerndeelgebieden)</div>`);
      } else {
        if (nodigSBC_deelgebieden > 0) items.push(`<div class="gap-item gap-info">SBC: nog ${nodigSBC_deelgebieden} deelgebied(en) ≥V nodig (nu ${p.totaalVoldoendeOfHoger}/19, norm ≥15)</div>`);
        if (nodigSBC_kern.length > 0) items.push(`<div class="gap-item gap-info">SBC kerndeelgebieden nog niet ≥V: ${escapeHtml(nodigSBC_kern.join(', '))}</div>`);
      }
    } else {
      const { nodigBJ2, nodigVersneld_lesgeven: nvL, nodigVersneld_organiseren: nvO, nodigVersneld_profHandelen: nvP } = p.gaps;
      items.push(nodigBJ2 === 0
        ? `<div class="gap-item gap-ok">BJ2-norm gehaald (${p.totaalVoldoendeOfHoger}/19 ≥V, norm ≥13)</div>`
        : `<div class="gap-item gap-warn">Nog ${nodigBJ2} deelgebied(en) ≥V nodig voor doorstroom BJ2</div>`);
      if (nvL === 0 && nvO === 0 && nvP === 0) {
        items.push(`<div class="gap-item gap-ok">Versneld SBC-norm gehaald</div>`);
      } else {
        const tekort = [nvL > 0 && `lesgeven nog ${nvL} ≥G`, nvO > 0 && `org. nog ${nvO} ≥G`, nvP > 0 && `prof.handelen nog ${nvP} ≥G`].filter(Boolean);
        items.push(`<div class="gap-item gap-info">Versneld SBC: ${escapeHtml(tekort.join(' · '))}</div>`);
      }
    }

    return `<div class="detail-section">
      <div class="detail-section-title">Doorstroomprognose</div>
      <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.75rem;">
        <span class="status-badge status-${status.kleur}">${escapeHtml(status.label)}</span>
        <span class="traject-tag">Traject: ${trajectLabel}</span>
        <span style="font-size:0.875rem;color:var(--text-muted);">${p.totaalVoldoendeOfHoger}/19 ≥V &nbsp;·&nbsp; ${p.totaalOnvoldoende} onvoldoende</span>
      </div>
      <div class="gap-items">${items.join('')}</div>
    </div>`;
  }

  function buildDetailLeerlijnen(p) {
    const rows = p.leerlijnen.map(ll => {
      const naam  = escapeHtml(LEERLIJN_LABEL[ll.leerlijn] || ll.leerlijn);
      const pct   = ll.totaal > 0 ? Math.round((ll.voldoendeOfHoger / ll.totaal) * 100) : 0;
      const oStyle = ll.onvoldoende > 2 ? ' style="color:var(--status-rood-text);font-weight:700;"' : '';
      return `<div class="leerlijn-row">
        <span class="leerlijn-naam">${naam} (${ll.totaal})</span>
        <span class="leerlijn-stat"><strong>${ll.voldoendeOfHoger}</strong>/${ll.totaal} ≥V</span>
        <span class="leerlijn-stat"${oStyle}>${ll.onvoldoende} O</span>
        <span class="leerlijn-stat" style="color:var(--text-faint);">${ll.onbeoordeeld} ?</span>
        <div class="leerlijn-bar-track"><div class="leerlijn-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
    return `<div class="detail-section">
      <div class="detail-section-title">Per leerlijn</div>
      <div class="leerlijn-rows">${rows}</div>
    </div>`;
  }

  function buildDetailDeelgebieden(student) {
    const scores     = student.deelgebiedScores || {};
    const datapunten = student.datapunten       || [];
    const allDG      = window.DEELGEBIEDEN;

    const GROEPEN = [
      { key: 'lesgeven',      label: 'Lesgeven',      cls: 'groep-lesgeven'     },
      { key: 'organiseren',   label: 'Organiseren',   cls: 'groep-organiseren'  },
      { key: 'prof_handelen', label: 'Prof. handelen', cls: 'groep-profhandelen' },
    ];

    const groepDG = {};
    for (const g of GROEPEN) groepDG[g.key] = allDG.filter(dg => dg.group === g.key);

    function dmChip(score) {
      if (!score) return `<span class="dm-chip score-none">—</span>`;
      const c = SCORE_CHIP_MAP[score];
      return c ? `<span class="dm-chip ${c.css}">${c.kort}</span>` : `<span class="dm-chip score-none">?</span>`;
    }

    function scoreRank(score) {
      return score ? window.SCORE_LEVELS.indexOf(score) : -1;
    }

    function growthBadge(score1, score2) {
      // score1 = Fase 1, score2 = Fase 2
      if (score1 === null || score1 === undefined) return ''; // no basis for comparison
      var r1 = scoreRank(score1);
      var r2 = scoreRank(score2);
      if (r2 < 0) return ''; // score2 is null — no badge
      if (r2 > r1) return '<span class="growth-up" aria-label="gestegen">\u2191</span>';
      if (r2 < r1) return '<span class="growth-down" aria-label="gedaald">\u2193</span>';
      return '<span class="growth-same" aria-label="gelijk">=</span>';
    }

    const groepCols = GROEPEN.map(g =>
      `<th colspan="${groepDG[g.key].length}" class="${g.cls}">${g.label}</th>`
    ).join('');

    const dgCols = GROEPEN.flatMap(g =>
      groepDG[g.key].map(dg => `<th>${escapeHtml(dg.label)}</th>`)
    ).join('');

    // --- Phase 11 D2: Merge toetsplan + PDF datapunten, sort chronologically ---
    var toetsplan = getActiveToetsplan() || [];

    // Filter toetsplan to student's school year (BJ1/BJ2/PJ/ExJ)
    var studentFasesD2 = filterFasesForStudent(
      toetsplan.reduce(function(acc, tp) {
        if (acc.indexOf(tp.fase) === -1) acc.push(tp.fase); return acc;
      }, []),
      student
    );
    var toetsplanFiltered = studentFasesD2.length > 0
      ? toetsplan.filter(function(tp) { return studentFasesD2.indexOf(tp.fase) !== -1; })
      : toetsplan;

    // Build deadline map: normKey → earliest deadline (filtered)
    var deadlineMap = {};
    toetsplanFiltered.forEach(function(tp) {
      var key = normDatapunt(tp.datapunt);
      if (!deadlineMap[key]) deadlineMap[key] = tp.deadline;
    });

    // Build student scores map: normKey → student dp object
    var studentDpMap = {};
    datapunten.forEach(function(dp) {
      studentDpMap[normDatapunt(dp.datapunt)] = dp;
    });

    // Build merged rows: walk filtered toetsplan in deadline order, dedupe by normKey
    var seenKeys = {};
    var mergedRows = [];
    // Sort toetsplan entries by deadline first so we process earliest per datapunt first
    var sortedTp = toetsplanFiltered.slice().sort(function(a, b) {
      if (a.deadline < b.deadline) return -1;
      if (a.deadline > b.deadline) return 1;
      return 0;
    });
    sortedTp.forEach(function(tp) {
      var key = normDatapunt(tp.datapunt);
      if (seenKeys[key]) return;
      seenKeys[key] = true;
      var studentDp = studentDpMap[key];
      mergedRows.push({
        datapunt: tp.datapunt,
        vak: studentDp ? studentDp.vak : null,
        scores: studentDp ? (studentDp.scores || {}) : {},
        deadline: tp.deadline,
        fromToetsplan: true,
      });
    });

    // Append student datapunten not in toetsplan (unmatched PDF rows)
    datapunten.forEach(function(dp) {
      var key = normDatapunt(dp.datapunt);
      if (!seenKeys[key]) {
        mergedRows.push({
          datapunt: dp.datapunt,
          vak: dp.vak,
          scores: dp.scores || {},
          deadline: null,
          fromToetsplan: false,
        });
      }
    });

    const dataRows = mergedRows.length === 0
      ? `<tr><td class="cell-naam" colspan="${allDG.length + 2}" style="color:#9ca3af;padding:0.75rem 1rem;font-size:0.85rem;">Geen datapunten gevonden</td></tr>`
      : mergedRows.map(dp => {
          const cells = GROEPEN.flatMap(g =>
            groepDG[g.key].map(dg => `<td>${dmChip(dp.scores[dg.label] || null)}</td>`)
          ).join('');
          const deadlineCell = `<td style="font-size:0.78rem;color:#6b7280;white-space:nowrap;padding:0.25rem 0.5rem;">${dp.deadline ? escapeHtml(dp.deadline) : '—'}</td>`;
          return `<tr>
            <td class="cell-naam">
              ${dp.vak ? `<span class="cell-vak">${escapeHtml(dp.vak)}</span>` : ''}
              <span class="cell-dp">${escapeHtml(dp.datapunt)}</span>
            </td>${deadlineCell}${cells}
          </tr>`;
        }).join('');

    // Multi-period tfoot (D-06, D-09, D-12)
    var allRecords = window.getAllRecordsForStudent(student.leerlingId);
    // allRecords is sorted oldest-first by periode
    var hasTwoPeriods = allRecords.length >= 2
      && allRecords[0].periode !== allRecords[allRecords.length - 1].periode;

    var tfootHTML = '';
    if (hasTwoPeriods) {
      var oldest = allRecords[0];
      var newest = allRecords[allRecords.length - 1];
      var scores1 = oldest.deelgebiedScores || {};
      var scores2 = newest.deelgebiedScores || {};

      // Fase 1 row (oldest)
      var fase1Cells = GROEPEN.flatMap(g =>
        groepDG[g.key].map(dg => '<td>' + dmChip(scores1[dg.label] || null) + '</td>')
      ).join('');
      // Fase 2 row (newest) with growth badges
      var fase2Cells = GROEPEN.flatMap(g =>
        groepDG[g.key].map(dg => {
          var s1 = scores1[dg.label] || null;
          var s2 = scores2[dg.label] || null;
          return '<td>' + dmChip(s2) + growthBadge(s1, s2) + '</td>';
        })
      ).join('');

      tfootHTML = '<tfoot>'
        + '<tr><td class="cell-naam"><strong>' + escapeHtml(oldest.periode || 'Periode 1') + '</strong></td><td></td>' + fase1Cells + '</tr>'
        + '<tr><td class="cell-naam"><strong>' + escapeHtml(newest.periode || 'Periode 2') + '</strong></td><td></td>' + fase2Cells + '</tr>'
        + '</tfoot>';
    } else {
      // Single period — existing behavior (D-12)
      var footerCells = GROEPEN.flatMap(g =>
        groepDG[g.key].map(dg => '<td>' + dmChip(scores[dg.label] || null) + '</td>')
      ).join('');
      tfootHTML = '<tfoot>'
        + '<tr><td class="cell-naam"><strong>Eindoordeel</strong></td><td></td>' + footerCells + '</tr>'
        + '</tfoot>';
    }

    return '<div class="detail-section">'
      + '<div class="detail-section-title">Beoordelingen per datapunt \u00d7 deelgebied</div>'
      + '<div class="dg-matrix-wrap">'
      + '<table class="dg-matrix">'
      + '<thead>'
      + '<tr><th class="col-naam" rowspan="2">Datapunt</th><th rowspan="2" style="font-size:0.78rem;color:#6b7280;white-space:nowrap;padding:0.25rem 0.5rem;">Deadline</th>' + groepCols + '</tr>'
      + '<tr>' + dgCols + '</tr>'
      + '</thead>'
      + '<tbody>' + dataRows + '</tbody>'
      + tfootHTML
      + '</table>'
      + '</div>'
      + '</div>';
  }

  // Phase 05-03: deelgebied matrix with chronological datapunt columns + score dots
  function buildDetailDeelgebiedenTijdlijn(student, toetsplan) {
    var allDG = window.DEELGEBIEDEN;
    var GROEPEN = [
      { key: 'lesgeven',      label: 'Lesgeven',      cls: 'groep-lesgeven',     color: '#1e40af' },
      { key: 'organiseren',   label: 'Organiseren',   cls: 'groep-organiseren',  color: '#166534' },
      { key: 'prof_handelen', label: 'Prof. handelen', cls: 'groep-profhandelen', color: '#6b21a8' },
    ];

    // Columns = PDF import periods, sorted oldest → newest
    var allRecords = window.getAllRecordsForStudent(student.leerlingId);
    if (allRecords.length === 0) return '';

    // De-duplicate by periode (keep latest record per periode)
    var periodeMap = {};
    allRecords.forEach(function(rec) {
      var p = rec.periode || 'Onbekend';
      periodeMap[p] = rec; // later imports overwrite earlier ones
    });
    // --- Phase 11 D3: Sort periodes by earliest toetsplan deadline (chronological) ---
    function normPeriode(p) {
      return p.replace(/\s+DD\s*$/i, '').trim();
    }
    var faseMinDeadline = {};
    toetsplan.forEach(function(tp) {
      var faseKey = tp.fase.trim();
      if (!faseMinDeadline[faseKey] || tp.deadline < faseMinDeadline[faseKey]) {
        faseMinDeadline[faseKey] = tp.deadline;
      }
    });
    var periodes = Object.keys(periodeMap).sort(function(a, b) {
      var da = faseMinDeadline[normPeriode(a)] || null;
      var db = faseMinDeadline[normPeriode(b)] || null;
      if (da && db) return da < db ? -1 : da > db ? 1 : 0;
      if (da) return -1;
      if (db) return 1;
      return 0;
    });
    var colCount = periodes.length;

    // Determine which deelgebieden the toetsplan uses for this student's year
    var studentFases = filterFasesForStudent(
      toetsplan.reduce(function(acc, dp) {
        if (acc.indexOf(dp.fase) === -1) acc.push(dp.fase); return acc;
      }, []),
      student
    );
    var toetsplanDGs = {};
    toetsplan.forEach(function(dp) {
      if (studentFases.length === 0 || studentFases.indexOf(dp.fase) !== -1) {
        dp.deelgebieden.forEach(function(id) { toetsplanDGs[id] = true; });
      }
    });
    var hasToetsplanFilter = Object.keys(toetsplanDGs).length > 0;

    var CHIP = {
      onvoldoende: { bg: '#fee2e2', color: '#991b1b', label: 'O' },
      voldoende:   { bg: '#d1fae5', color: '#065f46', label: 'V' },
      goed:        { bg: '#dbeafe', color: '#1e40af', label: 'G' },
      excellent:   { bg: '#ede9fe', color: '#5b21b6', label: 'E' },
    };

    // Column headers
    var colHeaders = '<th class="cell-naam" style="min-width:56px;"></th>'
      + periodes.map(function(p) {
          var label = p.length > 16 ? p.slice(0, 14) + '\u2026' : p;
          return '<th style="text-align:center;font-size:11px;font-weight:600;color:#374151;'
            + 'padding:6px 4px;min-width:52px;border-bottom:2px solid #e5e7eb;">'
            + escapeHtml(label) + '</th>';
        }).join('');

    var html = '<div class="detail-section">'
      + '<div class="detail-section-title">Scores per deelgebied per periode</div>'
      + '<div style="overflow-x:auto;">'
      + '<table style="border-collapse:collapse;width:100%;font-size:13px;">'
      + '<thead><tr>' + colHeaders + '</tr></thead><tbody>';

    GROEPEN.forEach(function(grp) {
      var dgIds = allDG.filter(function(d) {
        if (!hasToetsplanFilter) return d.group === grp.key;
        return d.group === grp.key && toetsplanDGs[d.id];
      });
      if (dgIds.length === 0) return;

      // Group header
      html += '<tr><td colspan="' + (colCount + 1) + '" style="padding:6px 8px 2px;'
        + 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;'
        + 'color:' + grp.color + ';border-top:1px solid #e5e7eb;">'
        + escapeHtml(grp.label) + '</td></tr>';

      dgIds.forEach(function(dg) {
        html += '<tr>';
        html += '<td style="padding:3px 8px;font-size:13px;color:#374151;white-space:nowrap;'
          + 'border-right:1px solid #e5e7eb;">' + escapeHtml(dg.label) + '</td>';

        periodes.forEach(function(p) {
          var rec = periodeMap[p];
          var scores = rec.deelgebiedScores || {};
          var score = scores[dg.label] || null;
          if (score && CHIP[score]) {
            var c = CHIP[score];
            html += '<td style="text-align:center;padding:3px 4px;">'
              + '<span style="display:inline-block;padding:1px 7px;border-radius:999px;'
              + 'background:' + c.bg + ';color:' + c.color + ';font-weight:700;font-size:12px;">'
              + c.label + '</span></td>';
          } else {
            html += '<td style="text-align:center;padding:3px 4px;color:#d1d5db;font-size:11px;">&mdash;</td>';
          }
        });

        html += '</tr>';
      });
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  // ── Feedback per deelgebied (Phase 6 — FB-01) ───────────────────────────────

  function buildDetailFeedback(student) {
    var toetsplan = getActiveToetsplan();

    // No toetsplan: show guidance
    if (!toetsplan || toetsplan.length === 0) {
      return '<div class="detail-section">'
        + '<div class="detail-section-title">Feedback per deelgebied</div>'
        + '<p style="font-size:0.875rem;color:#9ca3af;">Import eerst een toetsplan om feedback per deelgebied te koppelen.</p>'
        + '</div>';
    }

    // Build feedbackMap: { deelgebiedId: [{datapunt, deadline, feedForward}] }
    var feedbackMap = {};
    window.DEELGEBIEDEN.forEach(function(dg) { feedbackMap[dg.id] = []; });

    toetsplan.forEach(function(tp) {
      var normTP = normDatapunt(tp.datapunt);
      var ff = '';
      (student.vakken || []).forEach(function(vak) {
        (vak.opdrachten || []).forEach(function(op) {
          if (normDatapunt(op.naam) === normTP) {
            ff = op.feedForward || '';
          }
        });
      });
      (tp.deelgebieden || []).forEach(function(dgId) {
        if (feedbackMap[dgId]) {
          feedbackMap[dgId].push({
            datapunt: tp.datapunt,
            deadline: tp.deadline || '',
            feedForward: ff
          });
        }
      });
    });

    // Sort each deelgebied's entries by deadline
    Object.keys(feedbackMap).forEach(function(dgId) {
      feedbackMap[dgId].sort(function(a, b) {
        return (a.deadline || '').localeCompare(b.deadline || '');
      });
    });

    // Render
    var body = '';
    window.DEELGEBIEDEN.forEach(function(dg) {
      var items = feedbackMap[dg.id];
      body += '<div style="margin-bottom:1rem;">';
      body += '<div style="font-size:0.875rem;font-weight:600;color:#374151;margin-bottom:0.25rem;">' + escapeHtml(dg.label) + '</div>';
      if (items.length === 0) {
        body += '<span style="color:#9ca3af;font-size:0.875rem;">\u2014 geen feedback beschikbaar</span>';
      } else {
        items.forEach(function(item) {
          var dpText = escapeHtml(item.datapunt);
          var dlText = item.deadline ? escapeHtml(item.deadline) : '';
          var ffText = item.feedForward
            ? '<span style="font-style:italic;font-size:0.78rem;color:#374151;">' + escapeHtml(item.feedForward) + '</span>'
            : '<span style="color:#9ca3af;">\u2014</span>';
          body += '<div style="font-size:0.875rem;margin-bottom:0.25rem;padding-left:0.5rem;">'
            + dpText + (dlText ? ' <span style="color:#6b7280;">' + dlText + '</span>' : '')
            + ' \u2014 ' + ffText
            + '</div>';
        });
      }
      body += '</div>';
    });

    return '<div class="detail-section">'
      + '<div class="feedback-header" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">'
      + '<div class="detail-section-title" style="margin-bottom:0;">Feedback per deelgebied</div>'
      + '<span class="vak-chevron" aria-label="Feedback uitklappen" style="font-size:0.7rem;color:#9ca3af;transition:transform 0.15s;">\u25BC</span>'
      + '</div>'
      + '<div class="feedback-body" style="display:none;margin-top:1rem;">'
      + body
      + '</div>'
      + '</div>';
  }

  function buildDetailAanvullend(student) {
    const taal    = student.taalniveau  || '';
    const rekenen = student.rekenniveau || '';

    const taalOpts = ['2F', '3F'].map(v =>
      `<option value="${v}"${taal === v ? ' selected' : ''}>${v}</option>`).join('');
    const rekenOpts = ['MBO 3', 'MBO 4'].map(v =>
      `<option value="${v}"${rekenen === v ? ' selected' : ''}>${escapeHtml(v)}</option>`).join('');

    return `<div class="detail-section">
      <div class="detail-section-title">Aanvullende gegevens</div>
      <div class="aanvullend-grid">
        <div class="aanvullend-veld">
          <label for="aanv-taal">Taalniveau</label>
          <select id="aanv-taal" data-aanv-field="taalniveau">
            <option value="">— niet ingevuld —</option>
            ${taalOpts}
          </select>
        </div>
        <div class="aanvullend-veld">
          <label for="aanv-rekenen">Rekenniveau</label>
          <select id="aanv-rekenen" data-aanv-field="rekenniveau">
            <option value="">— niet ingevuld —</option>
            ${rekenOpts}
          </select>
        </div>
      </div>
      <p class="aanvullend-hint" id="aanvullend-hint"></p>
    </div>`;
  }

  // ── Stage section (Phase 6 — STAGE-02) ──────────────────────────────────────

  function formatDutchDate(iso) {
    if (!iso) return '\u2014';
    var p = String(iso).split('-');
    return p.length === 3 ? (p[2] + '-' + p[1] + '-' + p[0]) : iso;
  }

  function buildDetailStage(student) {
    const klas = getActiveKlas();
    const sd = klas && klas.stageData && klas.stageData[student.leerlingId];
    if (!sd) {
      return '<div class="detail-section">'
        + '<div class="detail-section-title">Stage</div>'
        + '<p style="font-size:0.875rem;color:#9ca3af;">Geen stage-data \u2014 importeer de stage-Excel via het Import-tabblad.</p>'
        + '</div>';
    }
    const periode = formatDutchDate(sd.startdatum) + ' t/m ' + formatDutchDate(sd.einddatum);
    const uren = (sd.urenGoedgekeurd != null ? sd.urenGoedgekeurd : '\u2014')
      + ' / ' + (sd.urenIngeleverd != null ? sd.urenIngeleverd : '\u2014')
      + ' uren goedgekeurd';
    return '<div class="detail-section">'
      + '<div class="detail-section-title">Stage</div>'
      + '<div class="stats-grid" style="grid-template-columns:1fr 1fr;">'
      + '<div class="stat-card"><div class="stat-label">Organisatie</div><div class="stat-value" style="font-size:1rem;">' + escapeHtml(sd.organisatie || '\u2014') + '</div></div>'
      + '<div class="stat-card"><div class="stat-label">Periode</div><div class="stat-value" style="font-size:1rem;">' + escapeHtml(periode) + '</div></div>'
      + '<div class="stat-card" style="grid-column:span 2;"><div class="stat-label">Stage-uren</div><div class="stat-value" style="font-size:1rem;">' + escapeHtml(uren) + '</div></div>'
      + '</div>'
      + '</div>';
  }

  function buildDetailVerzuim(student) {
    if (!student.verzuim) {
      return `<div class="detail-section">
        <div class="detail-section-title">Verzuim</div>
        <p style="font-size:0.9rem;color:#9ca3af;">Geen verzuimdata — importeer de Excel verzuimexport om dit te zien.</p>
      </div>`;
    }
    const v = student.verzuim;

    // Totale geplande tijd = aanwezigheid + geoorloofd + ongeoorloofd
    const totaalTijd = (v.aanwezigheid || 0) + (v.geoorloofd || 0) + (v.ongeoorloofd || 0);

    // Percentages (0 wanneer er geen data is)
    function pct(deel) {
      if (!totaalTijd) return 0;
      return Math.round((deel / totaalTijd) * 100);
    }

    const pAanwezig     = pct(v.aanwezigheid  || 0);
    const pGeoorloofd   = pct(v.geoorloofd    || 0);
    const pOngeoorloofd = pct(v.ongeoorloofd  || 0);

    // Label in segment alleen tonen als het segment breed genoeg is (≥ 8%)
    function segLabel(p) {
      return p >= 8 ? `<span class="vb-label">${p}%</span>` : '';
    }

    const bar = `<div class="verzuim-bar">
      <div class="vb-seg vb-aanwezig"     style="width:${pAanwezig}%"    >${segLabel(pAanwezig)}</div>
      <div class="vb-seg vb-geoorloofd"   style="width:${pGeoorloofd}%"  >${segLabel(pGeoorloofd)}</div>
      <div class="vb-seg vb-ongeoorloofd" style="width:${pOngeoorloofd}%">${segLabel(pOngeoorloofd)}</div>
    </div>`;

    const legend = `<div class="verzuim-legend">
      <div class="vl-item">
        <span class="vl-dot vl-dot-aanwezig"></span>
        <span class="vl-titel">Aanwezig</span>
        <span class="vl-tijd">${minNaarUren(v.aanwezigheid)}</span>
        <span class="vl-pct">${pAanwezig}%</span>
      </div>
      <div class="vl-item">
        <span class="vl-dot vl-dot-geoorloofd"></span>
        <span class="vl-titel">Geoorloofd afwezig</span>
        <span class="vl-tijd">${minNaarUren(v.geoorloofd)}</span>
        <span class="vl-pct">${pGeoorloofd}%</span>
      </div>
      <div class="vl-item">
        <span class="vl-dot vl-dot-ongeoorloofd"></span>
        <span class="vl-titel">Ongeoorloofd afwezig</span>
        <span class="vl-tijd" style="${v.ongeoorloofd > 600 ? 'color:#991b1b;' : ''}">${minNaarUren(v.ongeoorloofd)}</span>
        <span class="vl-pct">${pOngeoorloofd}%</span>
      </div>
    </div>`;

    const melding = v.laatsteMelding
      ? `<p class="verzuim-melding">Laatste verzuimmelding: <strong>${escapeHtml(v.laatsteMelding)}</strong></p>`
      : '';

    return `<div class="detail-section">
      <div class="detail-section-title">Verzuim</div>
      ${bar}
      ${legend}
      ${melding}
    </div>`;
  }

  function buildDetailVakken(student) {
    if (!student.vakken || student.vakken.length === 0) {
      return `<div class="detail-section">
        <div class="detail-section-title">Voortgang per vak</div>
        <p style="font-size:0.9rem;color:#9ca3af;">Geen vakdata beschikbaar.</p>
      </div>`;
    }
    const vakCards = student.vakken.map(vak => {
      const opdrachten = (vak.opdrachten || []).map(op => {
        const st = op.status ? `<div class="opdracht-status">${escapeHtml(op.status)}</div>` : '';
        const ff = op.feedForward ? `<div class="opdracht-ff">${escapeHtml(op.feedForward)}</div>` : '';
        return `<div class="opdracht-row"><div class="opdracht-naam">${escapeHtml(op.naam)}</div>${st}${ff}</div>`;
      }).join('');
      return `<div class="vak-card">
        <div class="vak-header"><span>${escapeHtml(vak.naam)}</span><span class="vak-chevron">▼</span></div>
        <div class="vak-body">${opdrachten}</div>
      </div>`;
    }).join('');
    return `<div class="detail-section">
      <div class="detail-section-title">Voortgang per vak</div>
      <div class="vak-list">${vakCards}</div>
    </div>`;
  }

  function buildDetailNotities(leerlingId) {
    const notitie = escapeHtml(getNotitie(leerlingId));
    return `<div class="detail-section" style="margin-bottom:2rem;">
      <div class="detail-section-title">Notities mentorgesprek</div>
      <textarea id="notitie-textarea" placeholder="Schrijf hier notities voor dit mentorgesprek...">${notitie}</textarea>
      <p class="notitie-hint" id="notitie-hint"></p>
    </div>`;
  }

  function wireDetailEvents() {
    const backBtn = document.getElementById('detail-back');
    if (backBtn) backBtn.addEventListener('click', () => showView('klas'));

    const prevBtn = document.getElementById('detail-prev');
    const nextBtn = document.getElementById('detail-next');
    if (prevBtn && !prevBtn.disabled) prevBtn.addEventListener('click', () => showDetail(prevBtn.dataset.id));
    if (nextBtn && !nextBtn.disabled) nextBtn.addEventListener('click', () => showDetail(nextBtn.dataset.id));

    // Vak accordion toggle
    detailView.querySelectorAll('.vak-header').forEach(h => {
      h.addEventListener('click', () => h.closest('.vak-card').classList.toggle('open'));
    });

    // Feedback sectie toggle (Phase 6 — FB-01)
    detailView.querySelectorAll('.feedback-header').forEach(function(h) {
      h.addEventListener('click', function() {
        var body = h.nextElementSibling;
        var isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : '';
        var chevron = h.querySelector('.vak-chevron');
        if (chevron) {
          chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
          chevron.setAttribute('aria-label', isOpen ? 'Feedback uitklappen' : 'Feedback inklappen');
        }
      });
    });

    // Aanvullende gegevens: taal / rekenen / BPV-uren
    detailView.querySelectorAll('[data-aanv-field]').forEach(el => {
      el.addEventListener('change', () => {
        const student = window.appState.students.find(s => s.leerlingId === detailStudentId);
        if (!student) return;
        const field = el.dataset.aanvField;
        let val = el.value || null;
        student[field] = val;
        window.saveState();
        window.saveKlassen(); // Phase 6: keep klassen storage in sync
        const hint = document.getElementById('aanvullend-hint');
        if (hint) {
          hint.textContent = 'Opgeslagen ✓';
          setTimeout(() => { hint.textContent = ''; }, 2000);
        }
      });
    });

    // Notities auto-save (debounced 600 ms)
    const textarea = document.getElementById('notitie-textarea');
    const hint     = document.getElementById('notitie-hint');
    if (textarea && detailStudentId) {
      let timer = null;
      textarea.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          saveNotitie(detailStudentId, textarea.value);
          if (hint) {
            hint.textContent = 'Opgeslagen';
            hint.classList.add('saved');
            setTimeout(() => { hint.classList.remove('saved'); hint.textContent = ''; }, 2000);
          }
        }, 600);
      });
    }
  }

  // ── Startup: laad eerder opgeslagen state ──────────────────────────────

  if (window.loadKlassen && window.loadKlassen()) {
    renderKlasTabStrip();
    updateNavCount();
    if (ltSection && window.appState.students.length > 0) {
      ltSection.style.display = 'block';
      renderLeerlijntoewijzing();
    }
    showView(window.appState.students.length > 0 ? 'klas' : 'import');
    renderToetsplanZone(); // Phase 5: reflect toetsplan state for active klas
  } else {
    showEmptyKlassenState();
  }

  console.log('[app.js] Import UI ready — PDF drag/drop + Excel verzuim import + klasoverzicht');

  // Pre-flight: if parseSinglePDF is still missing after 3 s, the module failed to load.
  setTimeout(() => {
    if (typeof window.parseSinglePDF !== 'function') {
      console.error('[app.js] FOUT: parsers/pdf.js module niet geladen. Controleer de browser-console op module-laadfouten.');
      showError('PDF-parser kon niet worden geladen. Open de browser-console (F12) en zoek naar rode fouten. Ververs de pagina en probeer opnieuw.');
    } else {
      console.log('[app.js] parseSinglePDF geladen ✓');
    }
  }, 3000);
});
