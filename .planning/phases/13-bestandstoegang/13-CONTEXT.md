# Phase 13: Bestandstoegang - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Verbind de bestaande TypeScript parsers (`parsers/pdf.ts`, `parsers/excel.ts`, `utils/backup.ts`) met de Tauri desktop UI via een HTML5 file input + drag-drop interface. De mentor kan PDFs, Excel-bestanden en zip-backups aanleveren; de app verwerkt ze en slaat de resultaten op via de bestaande versleutelde opslag (Phase 12).

**In scope:** HTML `<input type="file">`, HTML5 drag-drop (dragover/drop events), document-level drop guard, universele dropzone die .pdf/.xls/.zip herkent, sequentieel PDF batch-import, foutafhandeling per bestand, backup restore via `applyBackupRestore()` + `saveKlassen()`, minimale `ImportPage` component in `src/components/ImportPage.tsx`.

**Out of scope:** Tauri plugin-dialog of plugin-fs (niet nodig — HTML input geeft File objecten direct), volledige import-UI met stijling (Phase 14), backup aanmaken/exporteren (Phase 14 of later), zip backup aanmaken vanuit de nieuwe app, multiplatform installatie (Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Bestandstoegang methode

- **D-13-01:** Bestandsdialoog via verborgen `<input type="file">` — geen Tauri `plugin-dialog` of `plugin-fs` nodig. HTML input geeft `File` objecten direct aan de parsers die `File` verwachten (`parseSinglePDF(file: File)`, `parseExcelFile(file: File)`).
- **D-13-02:** Drag-drop via HTML5 browser events (`dragover`/`drop` op een div). `event.dataTransfer.files` geeft `FileList` met `File` objecten — zelfde pad als de knop.
- **D-13-03:** Document-level drop guard is VERPLICHT: `preventDefault()` op `document.addEventListener('dragover')` en `document.addEventListener('drop')`. Voorkomt browsernavigatie bij droppen buiten de dropzone (staat in PROJECT.md Key Decisions als bekende fix voor Windows).

### Dropzone gedrag

- **D-13-04:** Één universele dropzone — detecteert bestandstype op extensie (`.pdf` → PDF parser, `.xls` of `.xlsx` → Excel parser, `.zip` → backup restore). Meerdere bestanden in één drop worden allemaal verwerkt.
- **D-13-05:** Input accept-filter: `accept=".pdf,.xls,.xlsx,.zip"`. Bestanden die niet overeenkomen worden overgeslagen met een duidelijke melding.

### Batch PDF import

- **D-13-06:** Sequentieel verwerken — `for...of` loop over de `File[]` array, `await parseSinglePDF(file)` per bestand. Geen `Promise.all()` — pdfjs-dist Worker parallellisme is niet gegarandeerd veilig voor 20 gelijktijdige instanties.
- **D-13-07:** Voortgang via simpele teller: `'Verwerken... 5/18 PDFs'`. React state (`progress: { current, total }`) wordt bijgewerkt na elke succesvolle parse.
- **D-13-08:** Fout per bestand: als één PDF mislukt, wordt hij overgeslagen (`console.warn` + toevoeging aan errors-lijst). De rest van de batch gaat door. Aan het einde: samenvattende melding met aantallen (geslaagd / overgeslagen).
- **D-13-09:** Opslaan NA de volledige batch — één `saveKlassen()` aanroep na de loop. Minder encrypt/write cycles; acceptabel risico (crash halverwege batch = session-data verlies maar disk blijft consistent).

### UI scope

- **D-13-10:** Minimale `ImportPage` component in `src/components/ImportPage.tsx`. App.tsx importeert deze en rendert hem als enige pagina. Dit is wegwerpbare scaffolding — Phase 14 vervangt hem volledig met de echte React UI.
- **D-13-11:** UI bevat: dropzone div, verborgen file input, knop ("Bestanden selecteren"), statustekst (idle / verwerken teller / resultaat samenvatting / foutlijst). Geen CSS-framework, geen CIOS huisstijl — puur functioneel.

### Backup importflow

- **D-13-12:** Herstelmode: `'overschrijven'` als standaard. Geen keuze-dialoog — mentor importeert bewust een backup en verwacht dat de huidige data vervangen wordt.
- **D-13-13:** Restore flow: `applyBackupRestore(zipData, 'overschrijven')` → als `success: true` dan direct `await saveKlassen()` om de herstelde data te versleutelen en op te slaan in plugin-store. Backup-data is daarna volledig gemigreerd naar het nieuwe versleutelde systeem.
- **D-13-14:** Backwards compatible met pre-Phase 12 backups: het zip-formaat (`version: 1`, `klassen` object, `mentordashboard-backup.json`) is ongewijzigd. `applyBackupRestore()` herstelt de data ongeacht of de backup gemaakt is voor of na Phase 12.

### Claude's Discretion

- Exacte React state structuur voor importstatus (`ImportState` interface) — gebruik wat het meest leesbaar is.
- Of `useRef` of `useState` voor de verborgen file input — implementatiekeuze.
- Precieze foutmelding teksten (buiten de al genoemde) — gebruik Nederlandse meldingen consistent met de rest van de app.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/ROADMAP.md` §Phase 13 — IMP-01, IMP-02, IMP-03 requirements en success criteria

### Parsers (te verbinden)
- `parsers/pdf.ts` — exporteert `parseSinglePDF(file: File): Promise<any>`. Signature is de interface naar Phase 13.
- `parsers/excel.ts` — exporteert `parseExcelFile(file: File): Promise<any[]>`. Zelfde patroon.
- `utils/backup.ts` — exporteert `applyBackupRestore(zipData: Uint8Array, mode: 'overschrijven' | 'samenvoegen')`. Haalt `klassenState` direct uit `utils/klassen`.

### Storage (opslaan na import)
- `utils/klassen.ts` — `saveKlassen(): Promise<boolean>`, `loadKlassen(): Promise<boolean>`, `klassenState` in-memory object. Phase 13 roept `saveKlassen()` aan na batch PDF-import en na backup restore.
- `.planning/phases/12-versleutelde-opslag/12-CONTEXT.md` — D-12-08 (async API), D-12-09 (encrypt via Tauri command), D-12-15 (foutafhandeling bij schrijffout).

### Tauri configuratie
- `src-tauri/capabilities/default.json` — huidige permissions (core:default, store:default, secure-storage:default). Geen nieuwe Tauri plugins nodig voor Phase 13.
- `src-tauri/tauri.conf.json` — security.csp moet `blob:` of `unsafe-inline` bevatten als pdfjs worker via Blob URL laadt; check bij implementatie.

### Key Decisions (PROJECT.md)
- `.planning/PROJECT.md` §Key Decisions — "Document-level drop prevention" entry: `preventDefault` op `document dragover/drop` is bevestigde fix voor Windows 'bestandstype niet ondersteund' fout.

### Bestaande React entry
- `src/App.tsx` — huidige Phase 10 placeholder; Phase 13 voegt `<ImportPage />` toe.
- `src/main.tsx` — entry point; toont hoe `loadKlassen()` bij startup moet worden aangeroepen.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parsers/pdf.ts` `parseSinglePDF(file: File)` — direct bruikbaar; neemt een browser File object, retourneert parsed leerlingdata.
- `parsers/excel.ts` `parseExcelFile(file: File)` — zelfde; retourneert array van verzuim-records.
- `utils/backup.ts` `applyBackupRestore(zipData, mode)` — neemt `Uint8Array` (lees via `FileReader.readAsArrayBuffer` of `file.arrayBuffer()`).
- `utils/klassen.ts` `saveKlassen()` / `klassenState` — enige schrijfpad naar versleutelde opslag.

### Established Patterns
- Alle parsers zijn async (`await parseSinglePDF(file)`) — Phase 13 gebruikt `async/await` consistent.
- Foutafhandeling: `try/catch` met `console.warn` + gebruikersvisibele melding in Nederlands (patroon uit Phase 12 `klassen.ts`).
- Vitest tests in `tests/` met vi.mock voor Tauri plugins (patroon uit Phase 12 `storage.test.ts`).

### Integration Points
- `src/App.tsx` importeert `<ImportPage />` uit `src/components/ImportPage.tsx`.
- `ImportPage` importeert `parseSinglePDF` uit `../../parsers/pdf`, `parseExcelFile` uit `../../parsers/excel`, `applyBackupRestore` en `buildBackupPayload` uit `../../utils/backup`, `saveKlassen` en `klassenState` uit `../../utils/klassen`.
- CSP check: pdfjs GlobalWorkerOptions.workerSrc wordt gezet op module import — werkt al in Phase 11; zorg dat de CSP in `tauri.conf.json` dit niet blokkeert.

</code_context>

<specifics>
## Specific Ideas

- Dropzone visuele feedback: `dragover` class op de div (bijv. `border-color` verandert) om te tonen dat droppen mogelijk is — minimal maar functioneel.
- Foutmelding formaat: `'[bestandsnaam]: parseerfout'` per overgeslagen bestand, getoond als lijst onder de samenvatting.
- `applyBackupRestore` leest bytes als `Uint8Array` — gebruik `await file.arrayBuffer()` dan `new Uint8Array(buffer)` voor de conversie van File naar Uint8Array.

</specifics>

<deferred>
## Deferred Ideas

- Backup aanmaken / exporteren als zip — toekomstige fase of Phase 14.
- Voortgangsbalk (animated progress bar) bij batch import — Phase 14 verfijnt de import-UI.
- Samenvoegen-mode voor backup restore — post-v2.0 als de mentor meerdere backup-bronnen wil combineren.
- Aparte knoppen per bestandstype (PDFs / Verzuim / Backup) met verschillende accenten — Phase 14 UI design.
- E2E test met echte PDF en .xls fixtures — de fixtures liggen al in `tests/fixtures/`; Phase 13 kan Vitest unit tests schrijven met vi.mock, integratie test met echte bestanden is Phase 14/15 werk.

</deferred>

---

*Phase: 13-bestandstoegang*
*Context gathered: 2026-05-14*
