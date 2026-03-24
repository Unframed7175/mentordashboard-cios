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

  console.log('[app.js] Import UI ready — drag PDFs or click "Kies bestanden"');
});
