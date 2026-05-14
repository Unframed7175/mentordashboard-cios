# Phase 13: Bestandstoegang - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 13-bestandstoegang
**Areas discussed:** Bestandstoegang methode, UI scope, Meerdere PDFs tegelijk, Backup importflow

---

## Bestandstoegang methode — File dialog

| Option | Description | Selected |
|--------|-------------|----------|
| HTML input | Verborgen `<input type="file">` — werkt in Tauri WebView, geeft File objecten direct | ✓ |
| Tauri native dialog | `@tauri-apps/plugin-dialog` + `@tauri-apps/plugin-fs` — native OS dialoog, vereist bytes→File conversie | |
| Beide | Tauri dialog primair, HTML input fallback | |

**User's choice:** HTML input  
**Notes:** Parsers verwachten File objecten — HTML input geeft die direct zonder extra plugins.

---

## Bestandstoegang methode — Drag-drop

| Option | Description | Selected |
|--------|-------------|----------|
| HTML5 browser events | `dragover`/`drop` op div, `event.dataTransfer.files` geeft FileList | ✓ |
| Tauri native file-drop | `tauri://file-drop` event geeft file paths (niet File objecten) | |
| Geen drag-drop in Phase 13 | Alleen knop in Phase 13 | |

**User's choice:** HTML5 browser events  
**Notes:** Consistent met de file input keuze — beide methoden leveren File objecten aan dezelfde handler.

---

## Bestandstoegang methode — Dropzone

| Option | Description | Selected |
|--------|-------------|----------|
| Één universele dropzone | Detecteert type op extensie (.pdf/.xls/.zip), stuurt naar juiste parser | ✓ |
| Aparte knoppen per type | Drie knoppen met eigen accept-filter | |
| Jij beslist | Planner kiest | |

**User's choice:** Één universele dropzone

---

## Bestandstoegang methode — Document-level drop guard

| Option | Description | Selected |
|--------|-------------|----------|
| Ja — altijd | `preventDefault` op `document dragover/drop` — bekende fix per PROJECT.md | ✓ |
| Nee — Phase 14 doet dit | Uitstellen | |

**User's choice:** Ja — altijd  
**Notes:** Staat expliciet in PROJECT.md Key Decisions als bevestigde fix voor Windows drag-drop fout.

---

## UI scope — Wat ziet de gebruiker

| Option | Description | Selected |
|--------|-------------|----------|
| Minimale testpagina | Dropzone + knop + statusregel. Bewijst plumbing. Phase 14 vervangt. | ✓ |
| Functionele import UI | Volledige component met voortgangsbalk, bestandslijst, foutmeldingen | |
| Headless — geen UI | Alleen functies, verificatie via tests | |

**User's choice:** Minimale testpagina

---

## UI scope — Phase 14 relatie

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 14 vervangt hem | Wegwerpbare scaffolding — Phase 14 bouwt echte component opnieuw | ✓ |
| Phase 14 breidt uit | Phase 13 levert basis, Phase 14 voegt stijl/integratie toe | |

**User's choice:** Phase 14 vervangt hem

---

## UI scope — Bestandslocatie component

| Option | Description | Selected |
|--------|-------------|----------|
| Aparte component | `src/components/ImportPage.tsx` — App.tsx importeert hem | ✓ |
| Direct in App.tsx | Alles in App.tsx | |

**User's choice:** Aparte component

---

## Meerdere PDFs — Verwerking

| Option | Description | Selected |
|--------|-------------|----------|
| Sequentieel — één voor één | `for...of` + `await parseSinglePDF(file)` | ✓ |
| Parallel — Promise.all() | Sneller, maar pdfjs Worker parallellisme risicovol | |
| Jij beslist | Planner kiest | |

**User's choice:** Sequentieel  
**Notes:** pdfjs-dist heeft geen garanties over parallelle Worker instanties.

---

## Meerdere PDFs — Voortgang

| Option | Description | Selected |
|--------|-------------|----------|
| Simpele teller | `'Verwerken... 5/18 PDFs'` via React state | ✓ |
| Progressbalk | Animated progress bar | |
| Geen voortgang | Knop disabled, pas na afloop melding | |

**User's choice:** Simpele teller

---

## Meerdere PDFs — Foutafhandeling

| Option | Description | Selected |
|--------|-------------|----------|
| Overslaan en doorgaan | Log per bestand, doorgaan met rest, samenvatting achteraf | ✓ |
| Stoppen bij eerste fout | Hele batch annuleren | |
| Jij beslist | Planner kiest | |

**User's choice:** Overslaan en doorgaan

---

## Meerdere PDFs — Save timing

| Option | Description | Selected |
|--------|-------------|----------|
| Na alle PDFs | Één `saveKlassen()` na de volledige batch | ✓ |
| Na elke PDF | `saveKlassen()` na elke parse — crashsafe maar langzamer | |
| Na elke 5 PDFs | Tussenoplossing | |

**User's choice:** Na alle PDFs

---

## Backup importflow — Herstelmode

| Option | Description | Selected |
|--------|-------------|----------|
| Overschrijven | Vervang alle klassen met backup-data | ✓ |
| Samenvoegen | Voeg samen met bestaande klassen | |
| Mentor kiest | Dialoog per import | |

**User's choice:** Overschrijven (standaard, geen keuze-dialoog)

---

## Backup importflow — saveKlassen() na restore

| Option | Description | Selected |
|--------|-------------|----------|
| Ja — direct saveKlassen() | `applyBackupRestore()` → `saveKlassen()` om te versleutelen | ✓ |
| Nee — app herstart | Reload triggeren, loadKlassen() bij startup | |
| Jij beslist | Planner kiest | |

**User's choice:** Ja — direct saveKlassen() aanroepen

---

## Backup importflow — Backwards compatibility

| Option | Description | Selected |
|--------|-------------|----------|
| Ja — backwards compatible | Formaat (version:1, klassen object) is ongewijzigd — werkt automatisch | ✓ |
| Nee — alleen nieuwe backups | Oude backups afwijzen | |
| Jij beslist | Planner kiest | |

**User's choice:** Ja — backwards compatible  
**Notes:** `utils/backup.ts` gebruikt hetzelfde formaat; applyBackupRestore() werkt zonder wijzigingen.

---

## Claude's Discretion

- Exacte React state structuur voor importstatus (`ImportState` interface)
- `useRef` vs `useState` voor de verborgen file input
- Precieze foutmelding teksten (buiten de al genoemde)

## Deferred Ideas

- Backup aanmaken / exporteren als zip — toekomstige fase
- Voortgangsbalk (animated) — Phase 14
- Samenvoegen-mode voor backup restore — post-v2.0
- Aparte knoppen per bestandstype met stijl — Phase 14 UI design
- E2E integratie tests met echte PDF en .xls bestanden — Phase 14/15
