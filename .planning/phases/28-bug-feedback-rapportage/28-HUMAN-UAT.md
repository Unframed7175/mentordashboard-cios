---
status: partial
phase: 28-bug-feedback-rapportage
source: [28-VERIFICATION.md]
started: 2026-05-27T08:16:00Z
updated: 2026-05-27T08:16:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Modal opens from every view
expected: Click 🐛 from import, klasoverzicht, detailweergave, and settings views — FeedbackModal appears each time with 'Fout melden' heading, textarea, Annuleren and Verstuur buttons
result: [pending]

### 2. Verstuur opens OS email client
expected: Clicking Verstuur opens the OS email client with To: ralvarezstam@cioszuidwest.nl, subject '[Bug] Mentordashboard vX.Y.Z — <platform>', body containing OS, app version, last import line, and console errors section
result: [pending]

### 3. setLastImport appears in email after import
expected: After importing a PDF, clicking Verstuur shows the PDF filename and type in the email body, e.g. 'rapport.pdf (PDF), 2026-05-27 HH:MM'
result: [pending]

### 4. Error path: modal stays open on failure
expected: If openUrl() throws, modal stays open, textarea content is preserved, 'E-mail kon niet worden geopend.' appears inline, Verstuur button is re-enabled
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
