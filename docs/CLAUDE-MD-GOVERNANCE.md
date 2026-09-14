# CLAUDE.md — Governance & changelog

> Verplaatst uit `CLAUDE.md` §11 (v1.10.0). Dit document hoeft niet elke sessie in context te staan;
> lees het alleen wanneer `CLAUDE.md` zelf wordt aangepast.

CLAUDE.md heeft de hoogste prioriteit in het project, maar heeft zelf ook een eigenaar en updateprocedure.

**Eigenaar:** de projectlead (persoon, niet een framework)  
**Locatie:** altijd in de projectroot, nooit in een submap  
**Bewerkingsrechten:** alleen handmatig door de eigenaar — geen enkel framework schrijft naar dit bestand

---

## Versioning — Semantic Versioning (SemVer)

Dit bestand volgt [Semantic Versioning 2.0.0](https://semver.org): `MAJOR.MINOR.PATCH`

| Type | Wanneer | Voorbeeld |
|---|---|---|
| `MAJOR` | Breaking change — bestaande workflow werkt niet zonder aanpassing | Fase verdwijnt, schrijfrecht wijzigt, DoD-criterium wordt strenger, plugin verwijderd |
| `MINOR` | Nieuwe functionaliteit, backwards compatible | Nieuwe sectie, nieuwe DoD-stap die toevoegt, nieuwe plugin |
| `PATCH` | Bugfix, tekstcorrectie, padkwalificatie, verduidelijking | Typefout, verkeerd commando, ontbrekend pad |

> **Breaking changes vereisen een migratiestap.** Zie "Procedure bij breaking change" hieronder.

---

## Updateprocedure — Conventional Commits

Elke wijziging volgt [Conventional Commits](https://www.conventionalcommits.org):

```
<type>[!]: <beschrijving>

[optionele body]
[optionele footer: BREAKING CHANGE: <uitleg>]
```

| Type | Gebruik voor |
|---|---|
| `feat` | Nieuwe instructie, sectie of plugin-integratie (`MINOR` bump) |
| `fix` | Correctie van fout, verkeerd pad, verkeerd commando (`PATCH` bump) |
| `refactor` | Herstructurering zonder gedragswijziging (`PATCH` bump) |
| `docs` | Verduidelijking, betere formulering, voorbeelden (`PATCH` bump) |
| `breaking` | Wijziging die bestaande workflow breekt (`MAJOR` bump) — voeg `!` toe na type |

**Voorbeelden van geldige commit messages:**
```
fix: npx axe gecorrigeerd naar npx @axe-core/cli
feat: Python CI-workflow toegevoegd naast Node-variant
feat!: schrijfrechten Superpowers op STATE.md gewijzigd

BREAKING CHANGE: Superpowers mag niet meer schrijven naar .gsd/STATE.md.
Bestaande projecten: verwijder eventuele STATE.md-schrijfinstructies
uit actieve Superpowers-configuraties.
```

---

## Git-workflow

1. Maak een branch aan: `docs/claude-md-[type]-[onderwerp]`
   - Voorbeelden: `docs/claude-md-fix-axe-cli`, `docs/claude-md-feat-python-ci`
2. Pas het bestand aan
3. Voeg een entry toe aan de changelog hieronder (format: zie "Changelog-format")
4. Commit met een Conventional Commit message
5. Open een PR — **zonder changelog-entry wordt de PR niet geaccepteerd**
6. Minimaal één review — in een solo-project telt een GStack `/review` zonder blokkerende bevindingen, vastgelegd als PR-comment (zie CLAUDE.md §7)
7. Merge naar `master` via squash-merge

> **Squash-merge** houdt de commit-history van `master` leesbaar: één commit per versie.

---

## Procedure bij breaking change (`MAJOR` bump)

1. Voeg `!` toe aan het commit-type: `feat!:` of `fix!:`
2. Vermeld `BREAKING CHANGE:` in de commit footer met een uitleg
3. Voeg een `> ⚠ BREAKING` blok toe aan de changelog-entry
4. Schrijf een **migration notice** in elk actief project dat dit bestand gebruikt:
   ```
   ## CLAUDE.md breaking change [datum] — v[oud] → v[nieuw]
   Actie vereist: [wat de projectlead moet doen]
   Deadline: [datum of "vóór volgende milestone-start"]
   ```
   Locatie: `.gsd/STATE.md` onder `## Migration notice`
5. Informeer alle teamleden vóór merge

---

## Changelog-format

Gebaseerd op [Keep a Changelog](https://keepachangelog.com). Labels: **Added**, **Changed**, **Fixed**, **Removed**, **Breaking**.

---

## Changelog

### [1.10.0] — 2026-09-14
#### Fixed
- §0a stack-check: GStack-detectie zocht in niet-bestaande `commands/`-map → controleert nu de skill-mappen direct
- §0a stack-check: Claude Mem-detectie zocht `SessionStart` in `.claude/settings.json` → controleert nu de plugin-installatie (Claude Mem is een plugin met eigen hooks)
- §0a versiechecks: GSD/GStack lezen nu hun `VERSION`-bestand (`npx get-shit-done-cc --version` gaf geen versie)
- Branch protection en merge-doel: `main` → `master` (daadwerkelijke default branch)
- §9: niet-bestaande `/gsd`, `/gsd discuss`, `/gsd plan` vervangen door `/gsd-progress`, `/gsd-discuss-phase`, `/gsd-plan-phase`
- UI UX Pro Max script-pad eenduidig: project-kopie `.claude/skills/ui-ux-pro-max/`

#### Added
- Projectsnelreferentie bovenaan: stack, dev/test/typecheck-commando's, default branch, PII-logregel
- Bronregel `.gsd/` vs `.planning/`: `.gsd/` is leidend, `.planning/` is read-only archief

#### Changed
- §7 naamgeving: `chore/`-branches en `chore:`, `ci:`, `perf:`, `refactor:`-commits toegevoegd (in lijn met §12 en de praktijk)
- Claude Mem installatie/update via `/plugin` in plaats van `npx claude-mem install`
- §7 review-eis: in een solo-project telt GStack `/review` (geen blokkerende bevindingen, vastgelegd als PR-comment) als verplichte review; menselijke approval zodra er een tweede collaborator is

#### Removed
- §10 Installatie & verificatie (duplicaat van §0a)
- §11 Governance + changelog verplaatst naar `docs/CLAUDE-MD-GOVERNANCE.md` (niet meer elke sessie in context)

---

### [1.9.0] — 2026-06-11
#### Added
- Sectie 12: project patchnotes — SemVer voor projectsoftware, CHANGELOG.md formaat, koppeling GSD-taken naar patchnote, wat niet wordt opgenomen, handmatige correctieprocedure
- Retro → patchnote keten verplaatst van sectie 11 naar sectie 12 en uitgebreid met gesplitst pad (projectverbetering vs workflow-verbetering)

#### Removed
- Retro → patchnote keten uit sectie 11 (verplaatst naar sectie 12)

---

### [1.8.0] — 2026-06-11
#### Added
- Semantic Versioning (SemVer MAJOR.MINOR.PATCH) als versioning-standaard
- Conventional Commits als commit-message standaard met type-tabel
- Procedure bij breaking change: `!`-suffix, `BREAKING CHANGE:` footer, migration notice in `.gsd/STATE.md`
- Retro → patchnote keten: expliciete stappen van bevinding tot merge
- Keep a Changelog-format: gegroepeerd per Added / Changed / Fixed / Removed / Breaking

#### Changed
- Changelog geherformateerd van platte tabel naar gestructureerde versie-secties
- Branch-naamgeving uitgebreid: `docs/claude-md-[type]-[onderwerp]`
- Merge-strategie vastgelegd als squash-merge

---

### [1.7.0] — 2026-06-06
#### Fixed
- `S01-SUMMARY.md` pad gekwalificeerd in foutherstel Fase 2
- GSD update-commando gecorrigeerd naar `npx get-shit-done-cc@latest` met aparte verificatiestap
- `git pull --rebase` vervangen door `--ff-only` met stash-fallback instructie
- `npx axe` gecorrigeerd naar `npx @axe-core/cli` (correct package)
- Lighthouse output-flags gecorrigeerd: `--output-path` + `node` score-uitlezing

#### Added
- Expliciete versiebeheer-noot: `.gsd/` commit verplicht, nooit in `.gitignore`
- Python CI-workflow (GitHub Actions) naast bestaande Node-variant
- Branch protection op `main` als verplichte conventie vóór eerste `/ship`

---

### [1.6.0] — 2026-06-06
#### Fixed
- `STATE.md` paden in Fase 5 escalatie code-block gekwalificeerd naar `.gsd/`
- Fase 1 UI-check actietekst gecorrigeerd (zei nog "Maak DESIGN.md aan", DoD was al correct)
- Interne reviewcode `zie B6` verwijderd uit Fase 4 DoD
- `STATE.md` in Fase 2 Superpowers-melding en sectie 9 commentaarregel gekwalificeerd
- `M001-LEARNINGS.md` volledig pad toegevoegd op alle vindplaatsen; opgenomen in bestandsoverzicht sectie 7

#### Changed
- A11y-check gesplitst: statische contrast/typografie-check in Fase 3 DoD (geen URL nodig); dynamische `axe wcag2aa`-check verplaatst naar Fase 4 DoD na `/qa`

---

### [1.5.0] — 2026-06-06
#### Fixed
- Alle bestandspaden in sectie 3 gekwalificeerd naar `.gsd/`
- Sessieherstel verwijst nu correct naar stap 2–4 (was 1–3)
- Fase 1 DoD: `DESIGN.md` hoeft niet te bestaan — Fase 3 staat ingepland

#### Added
- Security scan (`npm audit` / `pip-audit`) als verplichte stap vóór `/ship`
- A11y-check (`axe wcag2aa`) aan Fase 3 DoD
- Lighthouse performance-baseline in Fase 4 DoD (aanbevolen, geen harde blokkade)
- Env/secrets-conventie in sectie 7
- CI/CD-integratie als conventie en post-ship stap
- Changelog-validatie als verplichte blokkade vóór `/ship`
- Scope-tabel taak-review (Superpowers) vs slice-review (GStack)
- Scope-tabel GStack design-review vs UI UX Pro Max pre-delivery checks

#### Changed
- Superpowers schrijft niet meer naar `STATE.md` — GSD schrijft handoff na melding van Superpowers
- `S01-SUMMARY.md` eigendom expliciet bij Superpowers; schrijfrechten-tabel uitgebreid
- Claude Mem verantwoordelijkheid gesplitst: motivatie/context vs keuze (DECISIONS.md); cross-project lessen vs projectlessen (LEARNINGS.md)

#### Breaking
- Superpowers heeft geen schrijfrechten meer op `.gsd/STATE.md`
  > ⚠ BREAKING: Verwijder eventuele STATE.md-schrijfinstructies uit actieve Superpowers-configuraties vóór volgende milestone-start.

---

### [1.4.0] — 2026-06-06
#### Fixed
- Dubbele stap 2 verwijderd uit sessieopstart
- `PROJECT.md`-pad genormaliseerd naar `.gsd/PROJECT.md` door het hele document

#### Added
- §0a trigger verbreed: ook actief als `STATE.md` bestaat maar geen `## Stack-check` bevat
- Update-instructies per component (Stap B2) in §0a
- Installatie-fallback bij mislukking beschreven
- Sessieopstart stap 2: actieve-milestone-check bij meerdere milestones
- `ROADMAP.md` aanmaak voorgeschreven in Fase 1
- Fase 0 DoD uitgebreid met `/plan-design-review` als UI betrokken is
- Bestandsconventies uitgebreid met alle GSD-bestanden inclusief `S01-SUMMARY.md`

#### Changed
- "Groot bestand" gedefinieerd als >200 regels of >5 KB
- `/retro`-uitkomsten gerouteerd naar `.gsd/KNOWLEDGE.md` met CLAUDE.md-voorstelpad
- Sectie 10 gemarkeerd als secundaire naslag (§0a is gezaghebbend)
- Uitvoeringsvolgorde fasen verduidelijkt: 0 → 1 → 3 → 2 → 4

---

### [1.3.0] — 2026-06-06
#### Added
- §0a: automatische skill/plugin-check bij eerste gebruik en via `/check-stack`
- Aanwezigheids- én versieverificatie per component (Stap A en Stap C)
- Installatie-instructies inline per component (Stap B)
- Sessieopstart stap 1 bijgewerkt om naar §0a te verwijzen

---

### [1.2.0] — 2026-06-01
#### Added
- Fase 3 als vaste positie in keten (na Fase 1, vóór Fase 2)
- Fase 4 expliciete milestone-afsluiting
- Claude Mem project-scope als verplicht veld
- Sessieopstart stap 5: conflict-verificatie tussen memories en GSD

#### Changed
- `DECISIONS.md` gesplitst in twee secties (`## Architectuur` en `## Spec-verfijning`) met conflictregel
- Contextcheckpoints vervangen vage 40%-grens door concrete gedragsregels
- Sectie 8: afwijkingsdocumentatie verplicht gemaakt
- Sectie 10: zelfvoorzienend gemaakt (`stack-setup.md` verwijzing verwijderd)
- Changelog updateprocedure aangescherpt

---

### [1.1.0] — 2026-01-01
#### Added
- Definition of Done per fase
- Fase 5 foutherstel-escalatiepad
- Objectieve drempelwaarden sectie 8
- Claude Mem API-contract
- Schrijfrechten-tabel sectie 5
- Governance sectie 11

---

### [1.0.0] — 2026-01-01
#### Added
- Initiële versie gegenereerd
