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
  const nieuweKlasModal = document.getElementById('nieuwe-klas-modal');
  const nieuweKlasNaam  = document.getElementById('nieuwe-klas-naam');
  const nieuweKlasError = document.getElementById('nieuwe-klas-error');
  const modalAnnuleren  = document.getElementById('modal-annuleren');
  const modalAanmaken   = document.getElementById('modal-aanmaken');
  const klassenLeeg     = document.getElementById('klassen-leeg');
  const klassenLeegBtn  = document.getElementById('klassen-leeg-btn');

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
  }

  function openNieuweKlasModal() {
    nieuweKlasModal.style.display = 'flex';
    nieuweKlasNaam.value = '';
    nieuweKlasError.textContent = '';
    nieuweKlasNaam.focus();
  }

  function closeNieuweKlasModal() {
    nieuweKlasModal.style.display = 'none';
    nieuweKlasNaam.value = '';
    nieuweKlasError.textContent = '';
  }

  function handleCreateKlas() {
    var naam = nieuweKlasNaam.value.trim();
    if (!naam) {
      nieuweKlasError.textContent = 'Voer een klasnaam in.';
      nieuweKlasNaam.focus();
      return;
    }
    var result = window.createKlas(naam);
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
    var mainNav     = document.getElementById('main-nav');
    if (importView)  importView.style.display  = 'none';
    if (klasView)    klasView.style.display    = 'none';
    if (dView)       dView.style.display       = 'none';
    if (mainNav)     mainNav.style.display     = 'none';
    if (klassenLeeg) klassenLeeg.style.display = 'block';
    renderKlasTabStrip(); // will hide klasTabs since no klassen
  }

  function hideEmptyKlassenState() {
    if (klassenLeeg) klassenLeeg.style.display = 'none';
    var mainNav = document.getElementById('main-nav');
    if (mainNav) mainNav.style.display = 'flex';
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

    const results = { students: [], errors: [] };
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
      heading.style.cssText = 'font-size:0.875rem;font-weight:500;color:#374151;margin-bottom:0.4rem;';
      heading.textContent = `Geimporteerde leerlingen (${results.students.length}):`;
      studentSection.appendChild(heading);

      const nameList = document.createElement('ul');
      nameList.style.cssText = 'list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:0.35rem;';

      for (const student of results.students) {
        const tag = document.createElement('li');
        tag.style.cssText = 'padding:0.2rem 0.5rem;background:#f3f4f6;border-radius:4px;font-size:0.8rem;color:#374151;';
        tag.textContent = student.naam || student.filename;
        nameList.appendChild(tag);
      }

      studentSection.appendChild(nameList);
      errorList.parentNode.insertBefore(studentSection, errorList.nextSibling);
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
  navOverzicht.addEventListener('click', () => showView('klas'));

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

  // Detecteer traject op basis van periode/leerjaar veld uit de PDF
  function detectTraject(student) {
    const periode  = String(student.periode  || '').toLowerCase();
    const leerjaar = String(student.leerjaar || '').trim();
    if (periode.indexOf('bj1') !== -1 || leerjaar === '1') return 'bj1';
    return 'bj2';
  }

  function berekenStatus(student) {
    const traject = detectTraject(student);
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
    if (!student.verzuim) return `<span style="color:#9ca3af;font-size:0.8rem;">—</span>`;
    const v      = student.verzuim;
    const totaal = (v.aanwezigheid || 0) + (v.geoorloofd || 0) + (v.ongeoorloofd || 0);
    if (!totaal) return `<span style="color:#9ca3af;font-size:0.8rem;">—</span>`;
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

  function renderKlasGrid() {
    updateNavCount();

    const students = window.appState.students;
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
    const student = window.appState.students.find(s => s.leerlingId === leerlingId);
    if (!student) return;
    detailStudentId = leerlingId;
    // If not in current list (direct call), build from all students
    if (!detailStudentList.includes(leerlingId)) {
      detailStudentList = window.appState.students.map(s => s.leerlingId);
    }
    detailView.innerHTML = buildDetailHTML(student);
    showView('detail');
    wireDetailEvents();
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
      + buildDetailLeerlijnen(p)
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
        <span style="font-size:0.875rem;color:#6b7280;">${p.totaalVoldoendeOfHoger}/19 ≥V &nbsp;·&nbsp; ${p.totaalOnvoldoende} onvoldoende</span>
      </div>
      <div class="gap-items">${items.join('')}</div>
    </div>`;
  }

  function buildDetailLeerlijnen(p) {
    const rows = p.leerlijnen.map(ll => {
      const naam  = escapeHtml(LEERLIJN_LABEL[ll.leerlijn] || ll.leerlijn);
      const pct   = ll.totaal > 0 ? Math.round((ll.voldoendeOfHoger / ll.totaal) * 100) : 0;
      const oStyle = ll.onvoldoende > 2 ? ' style="color:#991b1b;font-weight:700;"' : '';
      return `<div class="leerlijn-row">
        <span class="leerlijn-naam">${naam} (${ll.totaal})</span>
        <span class="leerlijn-stat"><strong>${ll.voldoendeOfHoger}</strong>/${ll.totaal} ≥V</span>
        <span class="leerlijn-stat"${oStyle}>${ll.onvoldoende} O</span>
        <span class="leerlijn-stat" style="color:#9ca3af;">${ll.onbeoordeeld} ?</span>
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

    const groepCols = GROEPEN.map(g =>
      `<th colspan="${groepDG[g.key].length}" class="${g.cls}">${g.label}</th>`
    ).join('');

    const dgCols = GROEPEN.flatMap(g =>
      groepDG[g.key].map(dg => `<th>${escapeHtml(dg.label)}</th>`)
    ).join('');

    const dataRows = datapunten.length === 0
      ? `<tr><td class="cell-naam" colspan="${allDG.length + 1}" style="color:#9ca3af;padding:0.75rem 1rem;font-size:0.85rem;">Geen datapunten in dit PDF</td></tr>`
      : datapunten.map(dp => {
          const cells = GROEPEN.flatMap(g =>
            groepDG[g.key].map(dg => `<td>${dmChip(dp.scores[dg.label] || null)}</td>`)
          ).join('');
          return `<tr>
            <td class="cell-naam">
              ${dp.vak ? `<span class="cell-vak">${escapeHtml(dp.vak)}</span>` : ''}
              <span class="cell-dp">${escapeHtml(dp.datapunt)}</span>
            </td>${cells}
          </tr>`;
        }).join('');

    const footerCells = GROEPEN.flatMap(g =>
      groepDG[g.key].map(dg => `<td>${dmChip(scores[dg.label] || null)}</td>`)
    ).join('');

    return `<div class="detail-section">
      <div class="detail-section-title">Beoordelingen per datapunt × deelgebied</div>
      <div class="dg-matrix-wrap">
        <table class="dg-matrix">
          <thead>
            <tr><th class="col-naam" rowspan="2">Datapunt</th>${groepCols}</tr>
            <tr>${dgCols}</tr>
          </thead>
          <tbody>${dataRows}</tbody>
          <tfoot>
            <tr><td class="cell-naam"><strong>Eindoordeel</strong></td>${footerCells}</tr>
          </tfoot>
        </table>
      </div>
    </div>`;
  }

  function buildDetailAanvullend(student) {
    const taal    = student.taalniveau  || '';
    const rekenen = student.rekenniveau || '';
    const bpv     = (student.bpvUren !== undefined && student.bpvUren !== null) ? student.bpvUren : '';

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
        <div class="aanvullend-veld">
          <label for="aanv-bpv">BPV-uren</label>
          <input type="number" id="aanv-bpv" data-aanv-field="bpvUren"
                 min="0" step="1" value="${escapeHtml(String(bpv))}" placeholder="bijv. 300">
        </div>
      </div>
      <p class="aanvullend-hint" id="aanvullend-hint"></p>
    </div>`;
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

    // Aanvullende gegevens: taal / rekenen / BPV-uren
    detailView.querySelectorAll('[data-aanv-field]').forEach(el => {
      el.addEventListener('change', () => {
        const student = window.appState.students.find(s => s.leerlingId === detailStudentId);
        if (!student) return;
        const field = el.dataset.aanvField;
        let val = el.value;
        if (el.type === 'number') val = val ? parseInt(val, 10) : null;
        else val = val || null;
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
