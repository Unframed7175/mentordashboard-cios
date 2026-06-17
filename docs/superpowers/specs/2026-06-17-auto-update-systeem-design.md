# Design: Auto-update systeem

**Datum:** 2026-06-17
**Status:** Goedgekeurd, klaar voor implementatieplan

## Probleem

Mentordashboard CIOS heeft sinds Phase 37 een basale update-check: `utils/updateCheck.ts` polt de
GitHub releases-API bij elke opstart en toont, als er een nieuwere tag bestaat, een dismissible
banner (`UpdateBanner.tsx`) met een link naar de releasepagina. De mentor moet vervolgens zelf de
installer downloaden en handmatig (opnieuw) installeren.

Daarnaast wordt de landingspagina (apart repo `ciosmentorendashboard`) nu handmatig bijgewerkt bij
elke release — een proces dat net is gedocumenteerd in `.gsd/KNOWLEDGE.md` als checklist, maar dat
zonder herinnering kan worden overgeslagen.

## Doel

1. Bij het opstarten van de app wordt automatisch gecontroleerd op een nieuwere versie.
2. Is er een update, dan opent één los schermpje met de patch notes van die versie en een
   "Update nu"-knop. De mentor kan ook op "Later" klikken en gewoon doorwerken.
3. Klikt de mentor op "Update nu", dan downloadt, verifieert en installeert de app de update
   zelf, en herstart automatisch — geen handmatige installer-stappen meer.
4. Bij het publiceren van een nieuwe release wordt de landingspagina (apart repo) automatisch
   bijgewerkt: versie-badge, downloadlinks, en een nieuwe "wat is er nieuw"-kaart.

## Niet-doelen (bewust uitgesloten)

- Apple-notarisatie / Developer ID-signing voor macOS — ad-hoc signing blijft, net als nu.
- Cumulatieve patch notes over meerdere overgeslagen versies — alleen de nieuwste versie wordt
  getoond, ook als de mentor meerdere releases heeft gemist.
- Achtergronddownload vóór de klik op "Update nu" — pas downloaden op aanvraag.
- Verplichte update (geen "moet eerst updaten"-modus) — altijd wegklikbaar via "Later".
- Wijzigingen aan het versiebump-/tag-proces zelf (`/ship`-achtige flow) — dit ontwerp raakt alleen
  wat er na de tag-push automatisch gebeurt.

## Architectuur — dataflow

```
1. Versiebump → git tag vX.Y.Z → push (ongewijzigd t.o.v. nu)
                              ↓
2. release.yml (bestaand, uitgebreid):
   - bouwt app voor macOS (arm64+x64) en Windows (ongewijzigd)
   - signeert update-artefacten met de Tauri-updater-sleutel (NIEUW)
   - leest de nieuwste CHANGELOG.md-sectie → releaseBody (NIEUW)
   - publiceert GitHub Release met .dmg/.exe + .sig-bestanden + latest.json (NIEUW: laatste 2)
                              ↓
3. update-landing-page.yml (NIEUW, trigger: release.published):
   - checkt ciosmentorendashboard-repo uit (PAT-secret)
   - draait scripts/update-landing-page.mjs (versie + CHANGELOG-sectie als input)
   - commit + push naar ciosmentorendashboard/main
                              ↓
4. Mentor start de app op (willekeurig moment):
   - tauri-plugin-updater roept latest.json op GitHub aan
   - nieuwere, geldig gesigneerde versie? → UpdateModal (patch notes + Update nu/Later)
   - "Update nu" → download + handtekeningverificatie + installeer → relaunch
```

De CHANGELOG.md-sectie van de nieuwste release is de **enige bron** voor patch notes — wordt
herbruikt voor zowel de GitHub release body (→ in-app modal) als de update-kaart op de
landingspagina. Voorkomt dat patch notes op twee plekken los bijgehouden moeten worden.

## Component A — in-app updater (Rust + configuratie)

**Nieuwe dependencies** (`src-tauri/Cargo.toml`):
- `tauri-plugin-updater = "2"`
- `tauri-plugin-process = "2"` (voor `relaunch()`)

**Eenmalige sleutelgeneratie** (lokaal, niet herhaald per release):
```
npx tauri signer generate -w ~/.tauri/mentordashboard-updater.key
```
Publieke sleutel → gecommit in `tauri.conf.json` (niet geheim). Private sleutel + wachtwoord →
GitHub-secrets `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` in de hoofdrepo,
nooit gecommit.

**`tauri.conf.json`:**
```json
{
  "bundle": { "createUpdaterArtifacts": true },
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/Unframed7175/mentordashboard-cios/releases/latest/download/latest.json"
      ],
      "pubkey": "<gegenereerde publieke sleutel>"
    }
  }
}
```

**`src-tauri/src/lib.rs`:** twee plugin-registraties toegevoegd aan de bestaande `.plugin(...)`-keten:
```rust
.plugin(tauri_plugin_updater::Builder::new().build())
.plugin(tauri_plugin_process::init())
```
Geen nieuwe Rust-commands — de check/download/install-flow loopt via de plugin's JS-API.

## Component B — frontend: update-modal en patch notes

**`utils/updateCheck.ts`** (zelfde bestand, nieuwe implementatie — vervangt de GitHub-API-polling):
```ts
import { check } from '@tauri-apps/plugin-updater';

export async function checkForUpdate() {
  try {
    return await check(); // null, of { version, body, downloadAndInstall(), ... }
  } catch {
    return null; // stil falen bij netwerkproblemen, zoals nu
  }
}
```

**`UpdateModal.tsx`** (nieuw, vervangt `UpdateBanner.tsx`):
- Titel "Nieuwe versie beschikbaar: v{version}"
- Patch notes (`update.body`) weergegeven via een kleine, dependency-vrije mini-formatter die
  alleen de patronen herkent die in `CHANGELOG.md` voorkomen: `### Koppen`, `- bullets`, `**vet**`.
  Geen losse markdown-library — scope blijft beperkt tot wat er werkelijk in de changelog staat.
- "Update nu" → `update.downloadAndInstall()` met voortgangsindicatie → bij succes `relaunch()`
- "Later" → sluit modal, geen verdere actie; volgende opstart wordt opnieuw gecheckt
- Downloadfout → foutmelding in de modal + "Later"/"Probeer opnieuw"; app blijft bruikbaar

**`App.tsx`:** zelfde `useEffect`-plek bij opstarten, roept `checkForUpdate()` aan, toont
`UpdateModal` i.p.v. `UpdateBanner`.

**`SettingsPage.tsx`:** bestaande "Controleer op updates"-knop blijft, gebruikt dezelfde
`checkForUpdate()`; bij gevonden update opent dezelfde `UpdateModal` (geen losse implementatie).

## Component C — release-workflow wijzigingen

**`.github/workflows/release.yml`:**
- `tauri-action`-stap krijgt `TAURI_SIGNING_PRIVATE_KEY` en `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
  als env vars → signeert automatisch elk platform-artefact en publiceert `latest.json`.
- Nieuwe stap vóór de build: knipt de nieuwste `## [versie] — ...`-sectie uit `CHANGELOG.md` (tot
  de volgende `## [`-regel) via `scripts/extract-changelog-entry.mjs` (nieuw, herbruikt door
  Component D) en gebruikt die tekst als `releaseBody` i.p.v. de huidige statische string.

## Component D — automatische website-update

**Nieuwe workflow:** `.github/workflows/update-landing-page.yml`
- Trigger: `on: release: types: [published]` (na Component C, zodra assets al bestaan)
- Stappen:
  1. Checkout `ciosmentorendashboard` met PAT-secret (`LANDING_PAGE_PAT`, door projecteigenaar
     eenmalig aangemaakt met schrijfrechten op alleen die repo)
  2. Draait `scripts/update-landing-page.mjs` (nieuw, hoofdrepo) met versie + CHANGELOG-sectie
     als input — werkt de 6 bekende plekken bij in `index.html`: nav-versiebadge, 3 downloadlinks,
     footer-versie, nieuwe `update-card` (met verschuiving van het "Nieuwste versie"-label)
  3. Commit + push naar `ciosmentorendashboard/main`
- Faalt zichtbaar in de Actions-tab bij problemen (bv. verlopen PAT) — geen silent failure.

`.gsd/KNOWLEDGE.md`'s sectie "Releaseproces — landingspagina altijd meenemen" wordt na
implementatie bijgewerkt: van handmatige checklist naar "dit gebeurt automatisch, zo controleer je
het".

## Foutafhandeling

| Situatie | Gedrag |
|---|---|
| Geen internet bij opstarten | `check()` faalt stil, geen modal (huidig gedrag) |
| Download mislukt na "Update nu" | Foutmelding in de modal, app blijft bruikbaar, geen crash |
| Handtekeningverificatie faalt | Plugin weigert installatie, fout wordt getoond — kernvoordeel van de officiële plugin t.o.v. een zelfgebouwde downloader |
| Website-workflow faalt (bv. verlopen PAT) | Workflow faalt zichtbaar in GitHub Actions, geen silent failure |
| `update-landing-page.mjs` vindt een verwachte tekst niet meer in `index.html` (bv. door een handmatige wijziging tussendoor) | Script gooit een expliciete fout en stopt zonder te committen — nooit "best effort" doorgaan met een mogelijk verkeerde plek bijwerken. Workflow faalt zichtbaar, projecteigenaar werkt de pagina dan eenmalig handmatig bij (checklist in `.gsd/KNOWLEDGE.md` blijft als fallback bestaan) |

## Teststrategie

- `utils/updateCheck.ts`: mockt `@tauri-apps/plugin-updater`'s `check()` voor drie paden (geen
  update / update beschikbaar / foutpad)
- `UpdateModal.test.tsx` (nieuw): render met patch notes, "Update nu" roept `downloadAndInstall`
  aan, "Later" sluit de modal zonder verdere actie
- `tests/SettingsPage.gevarenzone.test.tsx`: bestaande mock van `../utils/updateCheck` aangepast
  aan de nieuwe API-vorm
- Mini-formatter (CHANGELOG-tekst → JSX): unit tests met echte CHANGELOG-fragmenten als input
- `scripts/update-landing-page.mjs`: unit test op een kopie van `index.html`, controleert dat alle
  6 plekken correct zijn bijgewerkt (zelfde aanpak als de handmatige `grep`-verificatie bij v2.10.2)

## Geraakte/nieuwe bestanden

| Bestand | Wijziging |
|---|---|
| `src-tauri/Cargo.toml` | +2 dependencies |
| `src-tauri/src/lib.rs` | +2 plugin-registraties |
| `src-tauri/tauri.conf.json` | + `bundle.createUpdaterArtifacts`, + `plugins.updater` |
| `utils/updateCheck.ts` | Herschreven (plugin i.p.v. raw GitHub API) |
| `src/components/UpdateModal.tsx` | Nieuw (vervangt `UpdateBanner.tsx`) |
| `src/components/UpdateBanner.tsx` | Verwijderd |
| `src/App.tsx` | Banner → Modal |
| `src/components/SettingsPage.tsx` | Hergebruikt nieuwe `checkForUpdate()` + modal |
| `.github/workflows/release.yml` | + signing secrets, + CHANGELOG → releaseBody stap |
| `.github/workflows/update-landing-page.yml` | Nieuw |
| `scripts/extract-changelog-entry.mjs` | Nieuw |
| `scripts/update-landing-page.mjs` | Nieuw |
| `tests/SettingsPage.gevarenzone.test.tsx` | Mock aangepast |
| `.gsd/KNOWLEDGE.md` | Releaseproces-sectie bijgewerkt na implementatie |

## Eenmalige handmatige stappen (buiten Claude's bereik)

1. Projecteigenaar maakt een fine-grained GitHub PAT aan met alleen schrijfrechten op
   `ciosmentorendashboard`, slaat 'm op als secret `LANDING_PAGE_PAT` in de hoofdrepo.
2. Sleutelpaar-generatie (`tauri signer generate`) kan door Claude lokaal worden uitgevoerd; de
   private sleutel + wachtwoord moeten door de projecteigenaar als GitHub-secrets worden
   opgeslagen (Claude heeft geen toegang om secrets op GitHub aan te maken).
