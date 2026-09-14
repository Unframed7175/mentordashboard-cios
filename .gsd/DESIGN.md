# DESIGN.md — Mentordashboard CIOS

> Gegenereerd 2026-09-14 in Fase 3 van M41 (UI UX Pro Max, `search.py --design-system`), gecombineerd met de
> bestaande tokens in `src/index.css`. Eigenaar: UI UX Pro Max (component-niveau) · review: GStack
> `/plan-design-review` (systeem-niveau, merkidentiteit). Sluit TODO T-2026-06-12-02.
>
> **Geldt voor:** de desktop-app (`src/`) én de landingspagina (`Unframed7175/ciosmentorendashboard`).
> **Bron van waarheid voor tokens:** `src/index.css` §1. Dit document beschrijft de regels en de gewenste
> waarden; wijkt `index.css` af van een ✏️-token hieronder, dan is dat een openstaande fix.

---

## 1. Productcontext

| | |
|---|---|
| Product | Offline desktop-app (Tauri 2 + React) die Cumlaude-exports omzet in voortgang, verzuim en doorstroomprognose |
| Gebruiker | MBO-mentor bij CIOS Zuid-West; lage technische zelfverzekerdheid; Windows (primair) en macOS |
| Kerngevoel | **Rustig, betrouwbaar, zakelijk.** Het gaat over leerlingen en persoonsgegevens: geen speelsheid, geen marketing-glans |
| Dichtheid | Dashboard: hoge informatiedichtheid (matrices, chips, tabellen). Landingspagina + Help: lopende tekst, ruim |

## 2. Stijl

**Soft UI + Bento-grid, licht standaard, dark mode als keuze** (`body.dark`, JS-gestuurd).

- Kaarten op een lichte pagina met subtiele schaduw (`--shadow-xs`…`--shadow-lg`) en afronding (`--radius-sm` 8 → `--radius-xl` 20)
- Glas alleen voor navigatie en overlays (`--glass-*`), nooit onder lopende tekst
- Achtergrond: twee zachte radiale accentgloeden op `--bg-page` — decoratief, nooit achter data

## 3. Kleur

### 3.1 Merk

| Token | Licht | Donker | Gebruik |
|---|---|---|---|
| `--accent` | `#009FE3` | `#009FE3` | CIOS-blauw. **Merkkleur: decoratie, iconen, focusring, randen, grote koppen (≥ 24px)** |
| ✏️ `--accent-strong` (nieuw) | `#0077AA` | `#0077AA` | **Alle knoppen met witte tekst, in licht én donker** (4.98:1); tekstlinks in licht. Tekstlinks in donker mogen `--accent` houden (5.90:1 op surface) |
| ✏️ `--accent-strong-hover` (nieuw) | `#006F9F` | `#006F9F` | Hover van primaire knop in beide modi (5.56:1). `--accent-hover` #007DBF haalt met wit maar 4.48:1 → niet voor knoptekst |
| `--accent-hover` | `#007DBF` | `#007DBF` | Hover van decoratieve accentelementen |
| `--accent-light` / `--accent-text` | `#E0F5FD` / `#00547A` | `#003B57` / `#7DD4F5` | Accent-chips en geselecteerde staat |
| `--accent-border` | `#99D9F4` | `#005F8E` | Randen van accentvlakken |

### 3.2 Neutraal

| Token | Licht | Donker | Regel |
|---|---|---|---|
| `--bg-page` | `#F1F5F9` | `#0B0F1A` | Pagina |
| `--bg-surface` / `--bg-surface-alt` | `#FFFFFF` / `#F8FAFC` | `#131929` / `#1A2235` | Kaarten |
| `--text-primary` | `#0F172A` | `#F1F5F9` | Koppen, data, lopende tekst |
| `--text-secondary` | `#475569` | `#94A3B8` | Toelichting, labels |
| ✏️ `--text-muted` | `#617187` (was `#64748B`) | `#7A8AA0` (was `#64748B`) | Metadata. Na fix ≥ 4.5:1 op page, surface en surface-alt; **niet** op accent-vlakken (gebruik daar `--accent-text`; `#617187` op `--accent-light` = 4.42:1) |
| ✏️ `--text-faint` | `#7C8EA8` (was `#94A3B8`) | `#5B6D86` (was `#475569`) | **Alleen** placeholders, uitgeschakelde staat, decoratieve iconen — nooit informatie die je moet lezen |
| `--border-default` / `--border-light` | `#E2E8F0` / `#F1F5F9` | `#1E293B` / `#0F172A` | Scheidingen |

### 3.3 Status (betekenisdragend)

Status wordt **nooit alleen met kleur** getoond: altijd tekstlabel of icoon erbij.

| Status | Licht tekst/achtergrond | Donker tekst/achtergrond | Betekenis |
|---|---|---|---|
| groen | `#15803D` / `#DCFCE7` | `#86EFAC` / `#14532D` | op koers |
| oranje | `#B45309` / `#FEF3C7` (chip `#92400E` / `#FDE68A`) | `#FCD34D` / `#451A03` | aandacht / twijfel |
| rood | `#991B1B` / `#FEE2E2` | `#FCA5A5` / `#450A0A` | risico |
| blauw | `#1D4ED8` / `#DBEAFE` | `#93C5FD` / `#1E3A5F` | informatief |
| paars | `#5B21B6` / `#EDE9FE` | `#C4B5FD` / `#2E1065` | bijzonder |
| grijs | `#475569` / `#F1F5F9` | `#94A3B8` / `#1E293B` | geen data |

RAG-stippen (`--rag-*`) en spider-kleuren (`--spider-*`) zijn grafische elementen (≥ 3:1 volstaat) en krijgen altijd een legenda.

## 4. Typografie

| | |
|---|---|
| Lettertype | **Industry** (gebundeld OTF: Book 400, Demi 600, Bold 700) — geen Google Fonts, werkt offline. Licentie dekt app-distributie én web (bevestigd door projectlead 2026-09-14; bestandsnaam `IndustryTest-*` is alleen de naam) |
| Fallback | `system-ui, -apple-system, "Segoe UI", sans-serif` |
| Basis | `1rem` = 16px, regelhoogte 1.5 |
| Lopende tekst (Help, landingspagina, gidsen, dialogen) | **≥ 16px**, regellengte ≤ 75 tekens |
| Dashboard-data (matrices, tabellen, chips) | ≥ 14px (`0.875rem`); `0.75rem` (12px) alleen voor badges/metadata met `--text-secondary` of donkerder |
| Kleiner dan 12px | ✏️ Niet meer gebruiken — `0.6875rem`/`0.7rem` komen nu 10× voor in `index.css` |
| Getallen | `font-variant-numeric: tabular-nums` in tabellen en tellers |
| Koppen | Demi 600; paginatitel `1.5rem` |

## 5. Ruimte, vorm, beweging

- Afronding: `--radius-sm` 8 (knoppen, inputs) · `--radius-md` 12 (chips-groepen) · `--radius-lg` 16 (kaarten) · `--radius-xl` 20 (dialogen) · `--radius-pill` (chips)
- Overgangen: `--transition-fast` 150ms (hover) · `--transition-base` 200ms (openen) · `--transition-slow` 300ms (paneel) — alleen `transform`/`opacity`/kleur, geen layout-verschuiving
- `prefers-reduced-motion: reduce` → overgangen uit, geen radiale gloed-animatie
- Z-index-schaal: 10 (sticky), 20 (dropdown), 30 (nav), 50 (dialoog), 60 (toast)

## 6. Interactie & toegankelijkheid (blokkerend)

- Klikdoelen ≥ 44×44px op de landingspagina en in dialogen; ≥ 32px hoogte voor compacte dashboardknoppen met ≥ 8px tussenruimte
- Zichtbare focusring op alles wat focus krijgt: `2px solid var(--border-focus)` + `2px` offset; nooit `outline: none` zonder vervanging
- `cursor: pointer` op alles wat klikbaar is; hover geeft kleur/schaduw-feedback, geen schaal die layout verschuift
- Iconen: inline SVG in Lucide-stijl (1.5–2px stroke, `24×24` viewBox), geen extra icon-dependency; **geen emoji als UI-icoon** — ✏️ de 🐛-knop in de navigatiebalk is een bekende afwijking
- Alle afbeeldingen/screenshots met beschrijvende `alt`; decoratief = `alt=""`
- Knoppen die async werk starten: uitgeschakeld + laadstatus tijdens het werk
- Foutmeldingen naast het probleem, in gewone taal, met wat de gebruiker nu kan doen

## 7. Landingspagina (M41)

**Besluit plan-design-review 5B (2026-09-14): de landingspagina gaat over op dít design system** (tokens §3, typografie §4, vorm §5). De huidige eigen set in `ciosmentorendashboard/index.html` (`--blauw`, `--zwart`, `--radius: 4px`, Barlow/Barlow Condensed via Google Fonts, zwarte hero met diagonale clip-path, hoofdletterkoppen) vervalt. Gevolgen:
- Lettertype: Industry self-hosted (`@font-face`, WOFF2) in het landingspagina-repo — **geen Google Fonts**; licentie dekt webgebruik (besluit 7A).
- Hero licht (`--bg-page` + één accentgloed, geen zwart vlak), koppen in zinsletters (Demi 600), geen uppercase-kopstijl.
- Mobiele hero: `--text-primary` op `--bg-page` (geen blauw-op-blauw meer; huidige `.hero h1 span` op `#009FE3` en `rgba(255,255,255,.55)` op blauw vervallen).
- Contrastcheck §9 geldt daarmee ook voor de landingspagina; D5 verifieert met axe op de live URL.

Paginastructuur (afgeleid van het script-patroon "platform-specific CTAs / real screenshots", aangepast op ADR-14; detail-IA in S01-PLAN):

1. **Hero:** wat het is + "werkt offline, gegevens blijven op je computer" + één primaire actie: *Kies je computer*
2. **Kies je computer:** drie grote knoppen in gewone taal — *Windows* · *Mac met Apple chip* · *Mac met Intel chip* (≥ 44px, `--accent-strong`); hulpregel hoe je ziet welke Mac je hebt
3. **Stap voor stap (alleen het gekozen OS):** genummerde stappen met echte screenshots; **geruststellingsblok vóór elke waarschuwingsstap** (blauw informatief vlak, geen rood/oranje — het is geen fout)
4. **Wat kun je ermee** (bento, max. 4 kaarten)
5. **Wat is er nieuw** (automatisch bijgewerkt door `scripts/update-landing-page.mjs` — ankers niet wijzigen)
6. **Footer:** versie + "Gegevens worden nooit gedeeld"

Niet doen: sterrenbeoordelingen, QR-codes, app-store-badges, carrousels, video als enige uitleg.

## 8. Script-aanbevelingen die bewust zijn afgewezen

| Aanbeveling (`search.py`) | Waarom afgewezen |
|---|---|
| Claymorphism (dikke randen, speels, "toy-like") | Past niet bij persoonsgegevens en professioneel gebruik |
| Lora + Raleway / Fira Code + Fira Sans | Merk gebruikt Industry; Google Fonts breekt de offline-belofte |
| Cyaan/groen-palet (#0891B2) of donkerblauw (#1E40AF) | CIOS-blauw `#009FE3` is merkidentiteit (GStack wint op merk) |
| "Avoid dark modes" / "Avoid light mode default" | Tegenstrijdig; app ondersteunt beide, licht is standaard |
| App Store-/Horizontal-Scroll-landingspatronen | Collega's willen installeren, niet overtuigd worden; zie §7 |

## 9. Statische a11y-check (Fase 3 DoD) — 2026-09-14

WCAG 2.1 contrast, berekend op de tokens in `src/index.css`.

| Combinatie | Nu | Na ✏️-fix |
|---|---|---|
| Licht: wit op `--accent` (primaire knop) | **2.97:1 ✗** | wit op `--accent-strong` 4.98:1 ✓ |
| Licht: `--accent` als tekst/link op wit | **2.97:1 ✗** | `--accent-strong` 4.98:1 ✓ |
| Licht: `--text-muted` op `--bg-page` | **4.34:1 ✗** | `#617187` 4.54:1 ✓ |
| Licht: `--text-faint` op wit | **2.56:1 ✗** | `#7C8EA8` 3.34:1 — alleen niet-essentieel ✓ |
| Donker: `--text-muted` op `--bg-surface` | **3.68:1 ✗** | `#7A8AA0` 4.98:1 ✓ |
| Donker: `--text-faint` op `--bg-surface` | **2.31:1 ✗** | `#5B6D86` 3.32:1 — alleen niet-essentieel ✓ |
| Licht + donker: `--text-primary`, `--text-secondary`, `--accent-text` op hun achtergronden | 6.8–17.9:1 ✓ | — |
| Licht + donker: alle status-tekst op status-achtergrond | 4.51–10.39:1 ✓ | — |
| Donker: `--accent` als tekst op `--bg-surface` | 5.90:1 ✓ | — |
| Bodytekst ≥ 16px | Basis 16px ✓ (Help-tekst erft 16px); `.detail-section-title` 11px ✗, 10× < 12px in `index.css` ✗ | Regel §4; fix in taak DT-A11Y |

**Conclusie:** het design system zelf voldoet na de ✏️-tokens. De implementatie in `index.css` loopt achter →
opgenomen als taak in `S01-PLAN.md` (Fase 2), zodat de app-knoppen die collega's als eerste zien (onboarding, import) AA halen.

## 10. Pre-delivery checklist (per scherm/component)

- [ ] Geen emoji als icoon; inline SVG in één stijl
- [ ] `cursor: pointer` + hover-feedback zonder layout-verschuiving
- [ ] Zichtbare focus; tabvolgorde = visuele volgorde
- [ ] Tekst ≥ 4.5:1 (≥ 3:1 vanaf 24px of 19px bold) in licht én donker
- [ ] Status nooit alleen met kleur
- [ ] Lopende tekst ≥ 16px; niets < 12px
- [ ] Alt-tekst op alle betekenisvolle afbeeldingen
- [ ] `prefers-reduced-motion` gerespecteerd
- [ ] Landingspagina: responsive op 375 / 768 / 1024 / 1440px, geen horizontale scroll
