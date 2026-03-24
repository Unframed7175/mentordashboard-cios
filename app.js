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

  excelChooseBtn.addEventListener('click', () => excelFileInput.click());

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

      // Console summary
      console.group('Excel Import Results');
      console.log(`Bestand: ${file.name}`);
      console.log(`Gekoppeld: ${result.matched}/${verzuimRecords.length}`);
      if (result.unmatched.length > 0) {
        console.warn('Niet gekoppeld:', result.unmatched);
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
  const klasTbody    = document.getElementById('klas-tbody');
  const klasLeeg     = document.getElementById('klas-leeg');
  const wisDataBtn   = document.getElementById('wis-data-btn');

  let sortKey   = 'naam';   // 'naam' | 'status' | 'verzuim'
  let sortAsc   = true;
  let zoekTerm  = '';

  // ── Navigatie ──────────────────────────────────────────────────────────

  function showView(view) {
    if (view === 'klas') {
      importView.style.display = 'none';
      klasView.style.display   = 'block';
      navImport.classList.remove('active');
      navOverzicht.classList.add('active');
      renderKlasoverzicht();
    } else {
      klasView.style.display   = 'none';
      importView.style.display = 'block';
      navOverzicht.classList.remove('active');
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

  // ── Status berekening (gecombineerd prognose + verzuim) ─────────────────
  // rood   = negatief prognose
  // oranje = neutraal prognose OF ongeoorloofd > drempel
  // groen  = sbl (op koers)
  // blauw  = sbc (profieljaar)
  // grijs  = onbekend (geen scores)

  function berekenStatus(student) {
    const p = window.berekenPrognose(student, 'bj2');
    const ongeoorloofd = student.verzuim ? student.verzuim.ongeoorloofd : 0;
    const heeftScores  = p.totaalVoldoendeOfHoger + p.totaalOnvoldoende > 0;

    if (!heeftScores) return { kleur: 'grijs', label: 'Onbekend', prognose: p };
    if (p.label === 'negatief') return { kleur: 'rood',   label: 'Risico',         prognose: p };
    if (p.label === 'neutraal') return { kleur: 'oranje', label: 'Let op',          prognose: p };
    if (ongeoorloofd > VERZUIM_DREMPEL_MIN)
                                return { kleur: 'oranje', label: 'Verzuim',         prognose: p };
    if (p.label === 'sbc')      return { kleur: 'blauw',  label: 'Profieljaar SBC', prognose: p };
    return                             { kleur: 'groen',  label: 'Op koers',        prognose: p };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  const STATUS_VOLGORDE = { rood: 0, oranje: 1, groen: 2, blauw: 3, grijs: 4 };

  function minNaarUren(min) {
    if (!min || min === 0) return '—';
    const u = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${u}u${m}m` : `${u}u`;
  }

  // ── Renderen ───────────────────────────────────────────────────────────

  function renderKlasoverzicht() {
    updateNavCount();

    const students = window.appState.students;
    if (students.length === 0) {
      klasTbody.innerHTML = '';
      klasLeeg.style.display = 'block';
      klasLeeg.textContent = 'Nog geen leerlingen geïmporteerd.';
      return;
    }

    // Bereken status + zoekfilter
    let rijen = students.map(s => ({
      student: s,
      status:  berekenStatus(s),
    }));

    if (zoekTerm) {
      const q = zoekTerm.toLowerCase();
      rijen = rijen.filter(r => r.student.naam.toLowerCase().includes(q));
    }

    // Sorteren
    rijen.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'naam') {
        cmp = a.student.naam.localeCompare(b.student.naam, 'nl');
      } else if (sortKey === 'status') {
        cmp = STATUS_VOLGORDE[a.status.kleur] - STATUS_VOLGORDE[b.status.kleur];
      } else if (sortKey === 'verzuim') {
        const av = a.student.verzuim ? a.student.verzuim.ongeoorloofd : 0;
        const bv = b.student.verzuim ? b.student.verzuim.ongeoorloofd : 0;
        cmp = bv - av; // hoog eerst
      }
      return sortAsc ? cmp : -cmp;
    });

    if (rijen.length === 0) {
      klasTbody.innerHTML = '';
      klasLeeg.style.display = 'block';
      klasLeeg.textContent = `Geen leerlingen gevonden voor "${zoekTerm}".`;
      return;
    }

    klasLeeg.style.display = 'none';

    const totalDG = 19;
    klasTbody.innerHTML = rijen.map(({ student: s, status }) => {
      const p   = status.prognose;
      const pct = Math.round((p.totaalVoldoendeOfHoger / totalDG) * 100);
      const ongeoorloofd = s.verzuim ? s.verzuim.ongeoorloofd : null;
      const totaalVerzuim = s.verzuim ? s.verzuim.totaal : null;

      return `<tr>
        <td class="student-naam">${escapeHtml(s.naam)}</td>
        <td><span class="status-badge status-${status.kleur}">${escapeHtml(status.label)}</span></td>
        <td>
          <div class="score-bar-wrap">
            <div class="score-bar-track">
              <div class="score-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="score-label">${p.totaalVoldoendeOfHoger}/${totalDG}</span>
          </div>
        </td>
        <td>${ongeoorloofd !== null ? minNaarUren(ongeoorloofd) : '<span style="color:#9ca3af">—</span>'}</td>
        <td>${totaalVerzuim !== null ? minNaarUren(totaalVerzuim) : '<span style="color:#9ca3af">—</span>'}</td>
      </tr>`;
    }).join('');
  }

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
      renderKlasoverzicht();
    });
  });

  // ── Zoeken ─────────────────────────────────────────────────────────────

  klasZoek.addEventListener('input', () => {
    zoekTerm = klasZoek.value.trim();
    renderKlasoverzicht();
  });

  // ── Wis alle data ──────────────────────────────────────────────────────

  wisDataBtn.addEventListener('click', () => {
    if (!confirm('Alle geïmporteerde data wissen? Dit kan niet ongedaan worden gemaakt.')) return;
    window.clearState();
    updateNavCount();
    // Reset import UI
    document.getElementById('import-results').style.display = 'none';
    document.getElementById('import-progress').style.display = 'none';
    document.getElementById('excel-import-results').style.display = 'none';
    showView('import');
  });

  // ── Auto-save helper (aangeroepen na elke import) ───────────────────────

  function autoSave() {
    const ok = window.saveState();
    updateNavCount();
    if (ok) console.log('[app.js] State opgeslagen (' + window.appState.students.length + ' leerlingen)');
  }

  // Hook auto-save in na PDF import — patch importPDFs resultaat
  // (wordt aangeroepen aan einde van de bestaande importPDFs functie via event)
  const _origShowImportResults = showImportResults;
  // Expose autoSave zodat importPDFs het kan aanroepen
  window._afterPDFImport = autoSave;

  // ── Startup: laad eerder opgeslagen state ──────────────────────────────

  if (window.loadState && window.loadState()) {
    updateNavCount();
    showView('klas');
  }

  console.log('[app.js] Import UI ready — PDF drag/drop + Excel verzuim import + klasoverzicht');
});
