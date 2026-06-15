# Changelog — Mentordashboard CIOS

## [2.9.0] — 2026-06-15 — Leerlijn-configuratie losgekoppeld van code (M38)

### Added
- **`src/config/leerlijn.json`** — de 19 deelgebieden zijn verplaatst naar een bewerkbaar JSON-bestand. Jaarlijkse schemawijzigingen (nieuwe deelgebieden, hernoemde labels, gewijzigde groepsindeling) vereisen geen TypeScript-aanpassing meer — alleen `leerlijn.json` bewerken en opnieuw bouwen.

## [2.8.0] — 2026-06-15 — Open-world schema-parser (M37)

### Added
- **Automatische kolomdetectie** — de PDF-parser behandelt de PDF als bron van waarheid. Onbekende kolomlabels worden voortaan gedetecteerd in plaats van stilzwijgend genegeerd.
- **Drift-banner** — na het importeren van een PDF met onbekende kolommen verschijnt een waarschuwingsbanner met de gevonden kolomnamen (maximaal 3 getoond + teller). De banner sluit je handmatig.

### Changed
- **Kolomherkenning via paginabreedte** — `isHeaderRow()` gebruikt nu een positieheuristiek (≥5 items die ≥50% van de paginabreedte beslaan) in plaats van label-matching. Robuust bij jaarlijkse schemawijzigingen.
- **Vak-kopregels via fontgrootte** — vakoverschriften worden herkend via een dynamische fontgrootte-drempel in plaats van een vaste `VAK_HEADINGS`-lijst.

### Fixed
- **Chip donkere modus** — de kolomlabel-chips in de drift-banner gebruiken nu CSS custom properties voor correcte kleuren in de donkere modus; lange kolomnamen worden afgekapt met een ellipsis.

## [2.7.0] — 2026-06-13 — Fabrieksreset (M36)

### Added
- **Gevarenzone in Instellingen** — nieuw paneel onderaan de instellingenpagina met een knop "Alle gegevens wissen". Vereist bevestiging door "WISSEN" te typen; optioneel een back-up maken vóór het wissen.
- **Fabrieksreset** (`utils/reset.ts`) — wist de volledige LazyStore, localStorage en herlaadt de app. Back-up en annuleren zijn altijd mogelijk vóór bevestiging.
- **Backup-payload v2** — back-upbestand bevat nu naast klassen ook een generieke snapshot van alle app-instellingen (`store.json`). V1-back-ups blijven volledig ondersteund.

### Changed
- **Back-up herstellen (overschrijven)** — bij een v2-back-up worden nu álle instellingen teruggezet en wordt de app automatisch herladen. Stale sleutels die niet in de snapshot staan worden verwijderd (clean replace, was eerder additief).

## [2.6.1] — 2026-06-11 — Verzuim-signaal verfijnd

- Verzuim boven drempel toont nu een klein uitroepteken rechtsboven op de leerlingtegel in plaats van een oranje ring — rustiger beeld, zelfde signaal (met tooltip en screenreader-label "Verzuim boven drempel")

## [2.6.0] — 2026-06-10 — Eerste gebruikersfeedback verwerkt (M35)

### UX & visueel
- **F1/T03** — Filter- en sorteerstaat blijft behouden bij navigatie naar leerlingdetail en terug
- **F2/T02** — Kleurcodering herzien: SBC en Versneld SBC nu blauw (was paars); labels vereenvoudigd ("Op koers" → "SBL", "Profieljaar SBC" → "SBC", "Let op" → "Twijfelgeval", "Op koers BJ2" → "Naar BJ2")
- **F2/T02** — Verzuim boven drempel toont een oranje ring om de leerlingtegel in plaats van een kleur-override
- **F5/T01** — Gelijke tegel-hoogtes in het klasoverzicht (align-items: stretch)
- **F6/T04** — Uitkomst-badge bovenaan de doorstroomprognose; de actuele prognose-route wordt altijd als eerste blok getoond

### Prognose-logica
- **F3/T05** — Verzuim als apart signaalblok in de doorstroomprognose (aandachtssignaal, geen formeel doorstroomcriterium)
- **F4/T06** — Datapunten met status "Niet ingeleverd" of "Te laat ingeleverd en niet beoordeeld" tellen als onvoldoende in de prognoseberekening

### Privacy
- Leerlingnaam vervangen door leerlingId in debugPrognose console-output (laatste PII-logging-locatie opgeruimd)

## [2.5.1] — 2026-06-08 — Security hardening

- Security-audit (OWASP Top 10 + MITRE ATT&CK): 11 bevindingen gefixed, waaronder AES-256-GCM encryptie voor BPV-data en backups, semver-validatie in de update-checker, magic-byte validatie en bestandslimieten op uploads
- PII verwijderd uit console-logs (mergeVerzuim, verzuim-warnings, debugPrognose zoekquery)
- GitHub Actions gepind op commit SHAs; Rust toolchain-configuratie gefixt

## [2.5.0] — 2026-06-06 — Auto-update & branding

- Auto-update notificatie via GitHub API met versievergelijking
- App-icoon vervangen door CIOS Zuidwest NL logo (RGBA, transparante hoeken)
- Cross-platform prognose fix geverifieerd op Windows (24 unit tests kolomtoewijzing)
- Backup exporteren + versie/update-check in instellingen

## [2.4.0 – 2.4.3] — 2026-06 — macOS-compatibiliteit & import-QOL

- PDF.js worker fix voor WKWebView (CSP + URL); ReadableStream polyfill voor macOS
- Zip-upload ondersteuning voor PDF-bestanden
- Helpteksten bijgewerkt: Cumlaude/Osiris/Onstage exportstappen per bron correct benoemd

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
