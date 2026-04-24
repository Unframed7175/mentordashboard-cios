# Phase 9: CIOS Huisstijl & Verzuim Weergave - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 9 levert een volledig visuele redesign van het dashboard naar CIOS Zuidwest huisstijl: CSS-variabelen worden herschreven naar het cyaan/navy kleurpallet, typografie wordt gebold, en de klasoverzicht-tegels tonen aanwezigheidspercentage in plaats van uren ongeoorloofd. Geen nieuwe functionaliteit — puur visuele upgrade.

</domain>

<decisions>
## Implementation Decisions

### Kleurpallet

- **D-01:** Primaire accentkleur wordt CIOS cyaan `#00AEEF` — vervangt huidig `--accent-blue: #3b82f6` en alle varianten (`--accent-blue-hover`, `--accent-blue-light`, `--accent-blue-border`). Claude leidt hover/light/border varianten af van `#00AEEF`.
- **D-02:** Header/navigatiebalk kleur wordt `#003057` (CIOS donker navy) — vervangt huidig `--bg-header: #1a1a2e` in zowel light als dark mode.
- **D-03:** Dark mode krijgt dezelfde `#003057` headerkleur als light mode. Dark mode page-achtergrond en surfaces blijven ongewijzigd (eigen donkere tint). Cyaan accenten (`#00AEEF`) gelden ook in dark mode.

### Typografie

- **D-04:** System font stack blijft ongewijzigd (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`). Geen externe font-laadtijd. "Bold" uitstraling wordt bereikt door `font-weight: 700` consequent toe te passen op koppen (h1, h2, section headers) waar dit nog niet het geval is.

### Verzuim Weergave in Tegels

- **D-05:** `buildMiniVerzuimBar()` vervangt de tekst onder de balk: i.p.v. `"${minNaarUren(v.ongeoorloofd)} ongeoorloofd"` toont de tegel `"${pA}% aanwezig"`. Zelfde positie (onder de 3-delige verzuimbalk), zelfde font-size (`0.75rem`). Kleur van de tekst: neutraal (`--text-muted`) ongeacht drempelwaarde — het percentage is informatief, niet een waarschuwing.
- **D-06:** De 3-delige verzuimbalk (aanwezig / geoorloofd / ongeoorloofd) en haar kleuren blijven volledig ongewijzigd (VRZ-02).

### CSS Variabelen Aanpak

- **D-07:** Alle `--accent-blue*` CSS-variabelen worden hernoemd/herschreven naar CIOS kleurtokens. Bestaande namen kunnen blijven maar waarden worden vervangen — geen breekwijzigingen in class-namen of HTML-structuur.
- **D-08:** Dark mode CSS (`.dark { ... }`) in `index.html` wordt ook bijgewerkt: `--accent-blue` → `#00AEEF` variant, `--bg-header` → `#003057` (zelfde waarde als light mode). Overige dark mode tokens ongewijzigd.

### Claude's Discretion

- Exacte hover/light/border afgeleiden van `#00AEEF` (bijv. `--accent-blue-hover`, `--accent-blue-light`, `--accent-blue-border`) — Claude berekent passende varianten.
- Of spider-chart stroke-kleuren (`--spider-prof-handelen-stroke: #22b8c8`) worden afgestemd op `#00AEEF` — Claude beoordeelt visuele consistentie.
- Exacte `font-weight` toe te passen per element-type — Claude past toe waar het visueel impact heeft.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §v1.2 — VRZ-01, VRZ-02, DES-01–DES-04 (exacte requirement-tekst)

### Bestaande Code
- `index.html` — CSS variabelen (`:root { }` en `body.dark { }`) en font-stack definitie
- `app.js` functies:
  - `buildMiniVerzuimBar()` — regel 1256–1272: te wijzigen voor percentage weergave
  - `VERZUIM_DREMPEL_MIN` — regel 1039: drempel voor verzuim-waarschuwing (referentie, niet wijzigen)

### Geen externe specs
Geen ADRs of externe design-docs. Alle decisions volledig vastgelegd in dit bestand.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- CSS variabelen systeem (`--accent-blue`, `--bg-header`, etc.) — volledig token-gebaseerd, wijzigen van waarden in `:root` propageert door de hele app automatisch
- `buildMiniVerzuimBar(student)` in `app.js` — de enige functie die de tekst onder de verzuimbalk genereert; kleine wijziging volstaat

### Established Patterns
- Light + dark mode via `body.dark` CSS override — beide moeten worden bijgewerkt
- `font-weight: 700` al gebruikt op `#site-header h1` — patroon uitbreiden naar andere koppen

### Integration Points
- `--accent-blue` wordt gebruikt in: `.btn-primary`, `.tab-btn.active`, import-zone borders, detail-view links — allemaal automatisch bijgewerkt via CSS-variabele aanpassing
- Geen JavaScript hoeft te weten van de kleurwijzigingen (puur CSS, behalve `buildMiniVerzuimBar` voor de tekst)

</code_context>

<specifics>
## Specific Ideas

- CIOS cyaan `#00AEEF` is de exacte accentkleur (uit DES-01 requirement)
- CIOS navy `#003057` is de exacte headerkleur (gekozen door mentor in discussie)
- Percentage tekst: `"87% aanwezig"` formaat (uit VRZ-01 requirement)
- Font: system stack blijft, boldness via `font-weight: 700` op koppen

</specifics>

<deferred>
## Deferred Ideas

Geen ideeën kwamen op buiten de phase scope. Discussie bleef binnen de visuele redesign-grens.

</deferred>

---

*Phase: 09-cios-huisstijl-verzuim-weergave*
*Context gathered: 2026-04-24*
