# Changelog — Mentordashboard CIOS

## [2.3.1] — 2026-05-31

### Reliability
- **R-01** — Prognose-algoritme geverifieerd met live PDF-fixtures; `berekenPrognose()` klopt voor BJ1 en BJ2 trajecten
- **R-01a** — Parser-bug opgelost: `leerjaar` altijd "1" voor BJ2-leerlingen; wordt nu afgeleid uit `periode`
- **R-02** — Inleverstatus per datapunt in de deelgebieden-matrix: statusbadge (groen/oranje/rood/grijs) per rij
- **R-02** — Proximity-enrichment fallback voor BJ2 PDFs waar vakken-matching faalt (multi-kolom PDF-layout)
- **R-02** — Boundary-detectie voorkomt dat een datapunt de status steelt van de volgende opdracht
- **R-02** — Split-status strategie: "Op/Te laat ingeleverd en [feed-forward] / wel beoordeeld" correct herkend
- **R-03** — BPV-uren weergave bevestigd; bestaande weergave volstaat

### Visuele verbeteringen
- **V-01** — Spider chart vergroot: 280px → 380px + schaalfactor bijgewerkt
- **V-02** — SBC/versneld_sbc kleur gewijzigd naar paars (violet); onderscheid met SBL beter zichtbaar
- **V-03** — Fase-onderscheid in datapunten-overzicht via scheidingsrijen bij ≥2 records per periode
- **V-04** — Opdracht-statusbadges kleurgecodeerd in VakkenSection

### QOL
- **Q-02** — Klas-aanmaak wizard: Overslaan-knop op stap 2 (PDF-upload)

### Technisch
- `parsers/pdf-status.ts` — STATUS_STRINGS losgekoppeld van PDF.js vendor; `'Niet beoordeelbaar'` kortere variant toegevoegd
- `parsers/pdf-enrich.ts` — Nieuwe module: enrichment-logica zonder PDF.js dependency (testbaar in Vitest)
- `utils/datapuntStatus.ts` — `buildDpStatusMap` + `lookupDpStatus` voor UI-componenten
- 275 tests groen

---

## [2.0.0] — 2026 (initiële release)

Initiële Tauri v2 desktop app: studentvoortgang, spider chart, deelgebieden-matrix, BPV-uren, prognose, klasoverzicht.
