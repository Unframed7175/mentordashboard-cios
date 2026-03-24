---
phase: 1
slug: pdf-parser
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser testing (geen test runner — browser-only vanilla JS, geen build-stap) |
| **Config file** | None — browser-only, geen package.json |
| **Quick run command** | Open `index.html` via `start.bat`, importeer 1-3 PDFs, controleer console output en UI |
| **Full suite command** | Importeer alle 19 CSD2A-PDFs, verifieer alle 19 leerlingen correct geparsed |
| **Estimated runtime** | ~2 minuten (19 PDFs) |

---

## Sampling Rate

- **After every task commit:** Importeer 1-3 PDFs en verifieer console output / UI display
- **After every plan wave:** Importeer alle 19 PDFs, controleer teller, check foutenoverzicht
- **Before `/gsd:verify-work`:** Alle 19 PDFs geparsed zonder fouten

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| PDF-01 | Drag-and-drop én file picker triggeren import | manual | — | ❌ Wave 0 | ⬜ pending |
| PDF-02 | Naam, leerling-ID, periode correct voor 19 PDFs | manual | — | ❌ Wave 0 | ⬜ pending |
| PDF-03 | Opdracht statuswaarden correct uitgelezen | manual | — | ❌ Wave 0 | ⬜ pending |
| PDF-04 | Feed forward tekst volledig en correct | manual | — | ❌ Wave 0 | ⬜ pending |
| PDF-05 | Alle 19 deelgebied-scores correct voor alle 19 PDFs | manual | — | ❌ Wave 0 | ⬜ pending |
| PDF-06 | Batch import van 19 PDFs tegelijk | manual | — | ❌ Wave 0 | ⬜ pending |
| PDF-07 | Robuust over alle 19 student-PDFs met layout-variaties | manual | — | ❌ Wave 0 | ⬜ pending |
| PDF-08 | Foutmelding bij onherkenbaar PDF-formaat | manual | — | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vendor/pdf.min.mjs` — download van jsDelivr CDN (pdfjs-dist@5.5.207)
- [ ] `vendor/pdf.worker.min.mjs` — download van jsDelivr CDN (pdfjs-dist@5.5.207)
- [ ] `utils/schema.js` — kopieer verbatim van zusterproject (DEELGEBIEDEN, normalizeScore)
- [ ] `parsers/pdf.js` — nieuw bestand (kernleverantie van Phase 1)
- [ ] `index.html` — nieuw bestand met drag-and-drop UI en import-teller

*Geen automated test framework gap — browser-only constraint sluit automated runner uit.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop importeert PDFs | PDF-01 | Browser UI interactie | Sleep 19 PDFs naar dropzone, verifieer teller bereikt 19/19 |
| Overzicht Deelgebieden tabel correct | PDF-05 | Visuele verificatie van complex tabel | Open console, vergelijk V/G/E scores met oorspronkelijke PDF |
| Robuustheid layout-variaties | PDF-07 | Alle 19 PDFs hebben licht verschillende content | Importeer alle 19 PDFs en check dat 0 fouten worden gerapporteerd |
| Foutmelding bij foute PDF | PDF-08 | Vereist fabricage van fout PDF | Sleep een willekeurig ander PDF-bestand in, verifieer foutmelding |
