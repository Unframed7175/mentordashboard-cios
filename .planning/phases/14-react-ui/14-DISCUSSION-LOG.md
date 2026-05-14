# Phase 14: React UI — Discussion Log

**Date:** 2026-05-14
**Areas discussed:** Deelgebieden matrix, State reactivity, CIOS kleurpallet, Klas management UI, Spider chart port, Notities opslag

---

## Area: Deelgebieden matrix

**Question 1:** Tabel-opzet behouden of anders inrichten?
- Options: Tabel-opzet behouden / Kompaktere weergave / Andere indeling
- **Selected:** Tabel-opzet behouden
- Notes: Datapunten als rijen, deelgebieden als kolommen, horizontaal scrollbaar

**Question 2:** Modus-footer met vote-badges of alleen modus + groei-badge?
- Options: Modus + groei-badge is genoeg / Vote-badges ook behouden
- **Selected:** Modus + groei-badge is genoeg
- Notes: Vote-badges (2×V 1×G) zijn te druk

---

## Area: State reactivity

**Question 1:** Hoe moet React weten wanneer appState.students[] is bijgewerkt?
- Options: Refresh-callback via App.tsx / React context / Zustand store
- **Selected:** Refresh-callback via App.tsx
- Notes: refreshKey counter in App.tsx, onImportComplete() prop op ImportPage

**Question 2:** View-routing aanpak?
- Options: useState in App.tsx / React Router
- **Selected:** useState in App.tsx: 'import' | 'klas' | 'detail'
- Notes: Geen React Router nodig voor Tauri-app met 3 views

---

## Area: CIOS kleurpallet (gebruiker-toegevoegd als free-text)

- **Beslissing:** Bijgewerkt kleurpallet: cyaan `#00a3da` (was `#00AEEF`), navy `#000000` (was `#003057`)
- Notes: Toepassing op alle Phase 14 componenten

---

## Area: Klas management UI

**Question 1:** Tab-strip of sidebar?
- Options: Horizontale tab-strip bovenin / Sidebar met klas-lijst
- **Selected:** Horizontale tab-strip bovenin behouden

**Question 2:** Nieuwe klas aanmaken: modal of inline form?
- Options: Modal behouden / Inline form in de tab-strip
- **Selected:** Modal behouden
- Notes: naam + schooljaar inputs, Annuleren/Aanmaken knoppen

**Question 3:** Alleen aanmaken + verwijderen, of ook hernoemen?
- Options: Alleen aanmaken + verwijderen / Ook hernoemen toevoegen
- **Selected:** Alleen aanmaken + verwijderen
- Notes: Hernoemen is scope creep — kan later

---

## Area: Spider chart port

**Question 1:** Wrap met dangerouslySetInnerHTML, herschrijven als JSX, of charting library?
- Options: Wrap met dangerouslySetInnerHTML / Herschrijf als JSX SVG / Charting library
- **Selected:** Wrap met dangerouslySetInnerHTML
- Notes: spider.ts heeft al XSS-sanitization (sanitizeCssVar), geen herwrite nodig

---

## Area: Notities opslag

**Question 1:** Verplaatsen naar versleutelde store of localStorage behouden?
- Options: Ja — notities op student opslaan via saveKlassen() / Nee — localStorage behouden
- **Selected:** Ja — notities op student.notitie via saveKlassen()
- Notes: AVG-consistent, alles versleuteld

**Question 2:** Per leerlingId of per StudentRecord (periode-specifiek)?
- Options: Per leerlingId op meest recente record / Per StudentRecord
- **Selected:** Per leerlingId op meest recente record
- Notes: Zelfde patroon als actiepunten. Migratie van localStorage nodig bij eerste render.

---

## Deferred Ideas

- Leerlijn-toewijzing herimplementatie — hangt af van scope; deferred als te groot
- Klas hernoemen — expliciet buiten scope gehouden
- Print-to-PDF export — toekomstige fase

---

## Claude's Discretion

- CSS class-namen voor nieuwe componenten
- Debounce-timing op notitie-textarea
- Exact component-splits binnen DetailWeergave
- Leerlijn-toewijzing: implementeer als het past, anders defer
