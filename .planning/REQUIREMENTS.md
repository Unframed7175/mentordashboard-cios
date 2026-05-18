# Requirements — Mentordashboard CIOS

**Core Value:** Mentor heeft in <2 minuten voortgang + verzuim + doorstroomprognose per leerling paraat voor mentorgesprek.

---

## Milestone v2.1 — Settings, Polish & Auto-class Detection (Active)

### Settings Panel (SET)

- [ ] **SET-01**: Mentor kan schakelen tussen light en dark mode via een settings-icoon; de voorkeur wordt persistent opgeslagen en hersteld bij herstart
- [ ] **SET-02**: Mentor kan vanuit de settings-pagina nieuwe PDFs en/of een verzuim-Excel toevoegen aan een bestaande klas, zonder de klas opnieuw aan te maken
- [x] **SET-03**: Mentor kan in de settings de 19 deelgebieden hernoemen of individueel inactief zetten (inactieve deelgebieden worden verborgen in matrix en prognose)
- [x] **SET-04**: Mentor kan in de settings de leerlijn-toewijzing aanpassen — welk deelgebied valt onder lesgeven / organiseren / professioneel handelen
- [x] **SET-05**: Mentor kan aparte drempelwaarden instellen voor verzuim-signalering: apart voor geoorloofd en ongeoorloofd verzuim (bijv. "waarschuw bij >10u geoorloofd of >4u ongeoorloofd")
- [x] **SET-06**: Mentor kan het verwachte aantal BPV-uren per periode configureren (gebruikt voor voortgangsindicatie)

### Auto-class Detection (ACD)

- [ ] **ACD-01**: Wanneer geen klas bestaat en de mentor bestanden importeert, detecteert de app automatisch de klas-naam uit de PDF-header en maakt de klas aan zonder extra handmatige stap

### UI Polish (POL)

- [ ] **POL-01**: Dark mode volledig geïmplementeerd — alle componenten consistent gestyled met dark theme CSS-variabelen
- [ ] **POL-02**: Spiderweb chart heeft leesbare as-labels en toont hover-tooltips met deelgebied-naam en score
- [ ] **POL-03**: Tile grid en detailweergave schalen correct op kleinere vensterbreedtes (≥1024px) zonder horizontale scroll
- [ ] **POL-04**: Hover-effecten en transitions zijn consistent — KPI tiles, student-tegels en nav-tabs animeren subtiel (150–200ms ease)

---

## Milestone v2.0 — Stack Modernisering (Validated — 2026-05-16)

- ✓ TypeScript + React + Vite — professionele codebase — Phases 10–11
- ✓ Tauri desktop wrapper — cross-platform .exe/.dmg — Phases 10, 15
- ✓ AES-256 versleutelde lokale opslag — AVG-compliant — Phase 12
- ✓ Per-leerling verwijderfunctie — Artikel 17 AVG — Phase 12
- ✓ React componentenstructuur — herbruikbare componenten — Phase 14

## Milestone v1.2 — Dashboard Redesign (Validated — 2026-04-24)

- ✓ Aanwezigheidspercentage in klasoverzicht-tegels — Phase 9
- ✓ Algeheel UI redesign in CIOS Zuidwest huisstijl — Phase 9

## Milestone v1.1 — Klasbeheer & Export (Validated — 2026-04-23)

- ✓ Meerdere klassen beheren in één dashboard (tabbladen) — Phase 6
- ✓ Vergelijking tussen periodes (fase 1 vs fase 2) in detailweergave — Phase 7
- ✓ Codebase hersteld naar schone staat — Phase 8

## Milestone v1.0 — MVP (Validated — 2026-03-25)

- ✓ Voortgang PDF per leerling betrouwbaar inlezen
- ✓ Verzuim Excel (.xls) inlezen: geoorloofd, ongeoorloofd, totaal
- ✓ Doorstroomnorm calculatie (BJ2/SBC/Negatief)
- ✓ Klasoverzicht: RAG status per leerling
- ✓ Detailweergave per leerling: voortgang + verzuim + prognose
- ✓ Leerlijn-mapping: deelgebieden → leerlijnen configureerbaar

---

## Future (post-v2.1)

- Rekenen en Nederlands voortgang apart bijhouden met eigen norm
- Print-to-PDF export voor mentorgesprekverslag (EXP-01–04)
- Multi-mentor support

## Out of Scope

- API-koppeling met schoolsystemen (bewust bestandsimport)
- Authenticatie / login (lokale tool voor één mentor)
- Mobiele app (gebruik via laptop/desktop)
- Automatische PDF-download vanuit SomToday
- Toetsplan-configuratie (complexiteit vs. waarde niet in balans voor v2.1)
- Word/docx export (browser print-to-PDF voldoet)

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| SET-01 | Phase 17 | Active |
| SET-02 | Phase 17 | Active |
| SET-03 | Phase 18 | Active |
| SET-04 | Phase 18 | Active |
| SET-05 | Phase 18 | Active |
| SET-06 | Phase 18 | Active |
| ACD-01 | Phase 16 | Active |
| POL-01 | Phase 17 | Active |
| POL-02 | Phase 19 | Active |
| POL-03 | Phase 19 | Active |
| POL-04 | Phase 19 | Active |
