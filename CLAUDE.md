# CLAUDE.md — Geïntegreerde stack
# Superpowers · GStack · UI UX Pro Max · GSD · Claude Mem

> Dit bestand en `docs/workflow/STACK.md` vormen samen de projectinstructies met de hoogste prioriteit.
> Alle framework-skills, plugins en subagents volgen ze. Bij conflict tussen beide wint dit bestand.
> Hier staan de kernregels die altijd gelden; STACK.md bevat de volledige procedures per fase.

## Project — snelreferentie

- **Stack:** Tauri 2 (Rust, `src-tauri/`) + React 19 + Vite + TypeScript; tests met Vitest + jsdom
- **Commando's:** `npm run dev` (Tauri-app) · `npm run vite-dev` (alleen frontend) · `npm test` / `npm run test:watch` · `npm run typecheck` (+ `npm run typecheck-migrated`) · `npm run build`
- **Default branch:** `master` (niet `main`)
- **Milestone-mappen:** `.gsd/milestones/M<nr>-<naam>/` (bv. `M36-fabrieksreset/`); `M001-*`-paden in STACK.md betekenen "de actieve milestone"; `M001`/`M002` in voorbeelden zijn alleen nummeringsvoorbeelden. Nummer = ROADMAP-nummer (map `M037-…` hoort bij ROADMAP `M37`)
- **Secrets:** geen runtime-env in de app; signing- en deploy-secrets (`TAURI_SIGNING_PRIVATE_KEY`, `LANDING_PAGE_PAT`) staan uitsluitend in GitHub Actions secrets
- **Architectuur, datamodel, testpatronen, valkuilen:** `.gsd/KNOWLEDGE.md` (wordt bij sessiestart gelezen)
- **Privacy:** log nooit leerlingnamen of andere persoonsgegevens naar de console — gebruik `leerlingId`

### Bron van waarheid: `.gsd/` vs `.planning/`
- `.gsd/` is de **enige** bron voor state, beslissingen en plannen.
- `.planning/` is een **read-only archief** van eerdere GSD-tooling (t/m v2.4). Niet bijwerken, niet als actuele state lezen.
- GSD-skills (`/gsd-*`) schrijven standaard naar `.planning/`: neem de uitkomst (beslissingen, plan, status) over in de juiste `.gsd/`-bestanden vóór de fase als afgerond geldt.

---

## Sessieopstart — verplichte volgorde

Bij elke nieuwe sessie of na `/compact`, **vóór** al het andere:

1. **Stack-check** alleen als `.gsd/STATE.md` ontbreekt, geen `## Stack-check` bevat, of de gebruiker `/check-stack` typt → volg STACK.md §0a en schrijf de uitkomst altijd weg in STATE.md
2. **Lees** `.gsd/STATE.md` → huidige fase en actieve milestone (`ACTIEF`); werk uitsluitend aan die milestone
3. **Lees** `.gsd/DECISIONS.md` en `.gsd/KNOWLEDGE.md`
4. **Claude Mem-observaties** zijn een hint: wijkt een memory af van een GSD-bestand, dan wint GSD — noteer de afwijking in `.gsd/KNOWLEDGE.md` onder `## Mem-conflict [datum]`
5. **Meld** aan de gebruiker: huidige fase, openstaande taken, laatste commit

`.gsd/STATE.md` bestaat niet → Fase 0: maak `.gsd/` aan en start GStack `/office-hours`.

---

## Faserouter

Uitvoeringsvolgorde: **0 → 1 → 3 (alleen bij UI-taken) → 2 → 4**. Fase 5 (foutherstel) is altijd beschikbaar.

| Fase | Eigenaar | Start als | Belangrijkste eisen (geheugensteun, niet volledig) | Volledige DoD |
|---|---|---|---|---|
| 0 · Ontdekking | GStack | Nieuwe feature of onduidelijke richting | `DECISIONS.md ## Architectuur` gevuld; `/plan-eng-review` (+ `/plan-design-review` bij UI) akkoord | STACK.md §2 |
| 1 · Spec | GSD | Fase 0 DoD afgevinkt | `PROJECT.md`, `REQUIREMENTS.md`, milestone-map met `S01-PLAN.md`; UI-check gedaan | STACK.md §2 |
| 3 · Design | UI UX Pro Max | `S01-PLAN.md` bevat UI-taak | `.gsd/DESIGN.md` gegenereerd; `/plan-design-review` akkoord; pre-delivery checks zonder blokkers; contrast ≥ 4.5:1 (≥ 3:1 grote tekst); body ≥ 16px | STACK.md §2 |
| 2 · Executie | Superpowers | Plan compleet (+ Fase 3 bij UI) | Alle taken in `S01-SUMMARY.md`; `npm test` groen; verification-before-completion | STACK.md §2 |
| 4 · Review & ship | GStack | Fase 2 DoD + tests groen | `/review` + `/qa` zonder blokkers; `npm audit --audit-level=high` schoon (anders `## Security-blokkade` in STATE.md); axe wcag2aa schoon; CHANGELOG-entry; CI groen; LEARNINGS geschreven; milestone op `DONE` | STACK.md §2, §12 |
| 5 · Foutherstel | GStack + GSD | Vastgelopen fase of >2 mislukte pogingen | Blokkade in STATE.md, terugkeerzone bepaald, gebruiker geïnformeerd | STACK.md §2 |

**Een fase is pas klaar als álle DoD-punten van die fase in STACK.md §2 zijn afgevinkt** — de tabel hierboven vervangt die lijst niet.
Na elke fase-overgang: handoff-bericht in `.gsd/STATE.md` (format: STACK.md §5).

---

## Kernregels — gelden altijd

- **Geen code vóór Fase 0 is afgesloten** met `.gsd/DECISIONS.md`
- **TDD:** eerst een falende test, dan minimale code, dan refactor
- **Subagents:** nooit twee frameworks tegelijk. Superpowers alleen in Fase 2, GSD-orchestrators alleen in Fase 1; diverse GStack-skills (o.a. `/ship`, `/autoplan`, `/review`, `/plan-*`) starten eigen subagents — niet draaien terwijl Superpowers-subagents actief zijn
- **Schrijfrechten:** `S01-PLAN.md` = GSD · `S01-SUMMARY.md` = Superpowers · `DESIGN.md` = UI UX Pro Max · `STATE.md` = GSD/GStack (Superpowers alleen-lezen) · `DECISIONS.md` append-only (volledige tabel: STACK.md §5)
- **Commits:** atomair, altijd met prefix `feat:` `fix:` `perf:` `refactor:` `test:` `design:` `docs:` `chore:` `ci:` — zonder prefix blokkeert `/ship`
- **Branches:** `feature/` `fix/` `design/` `chore/` `docs/` + naam
- **Merge naar `master`:** alleen via PR met groene `test`-check. Solo-project: `/review` zonder blokkerende bevindingen als PR-comment telt als review
- **CHANGELOG-entry:** `## [versie] — [datum] — [beschrijving]`, niet leeg; MAJOR-bump alleen na bevestiging projectlead
- **Secrets:** nooit hardcoden of committen
- **Instructiebestanden:** geen enkel framework schrijft naar `CLAUDE.md` of `docs/workflow/STACK.md` — alleen de projectlead, via `docs/CLAUDE-MD-GOVERNANCE.md`
- **Afwijken van het proces** mag alleen volgens de tabel in STACK.md §8, en altijd eerst gedocumenteerd in STATE.md onder `## Afwijking [datum]`. Bij twijfel: start in Fase 0
- **Foutherstel:** documenteer een fout vóór je een nieuwe poging start; na twee mislukte pogingen op dezelfde taak: pauzeer en vraag de gebruiker

---

## Wanneer lees je wat in `docs/workflow/STACK.md`

| Situatie | Lees |
|---|---|
| Stack-check nodig (zie sessieopstart stap 1) | §0a |
| Een fase starten of afronden | §2 (die fase, inclusief volledige DoD) |
| Claude Mem gedraagt zich onverwacht of conflicteert met GSD | §3 |
| Subagents inzetten | §4 |
| Schrijven naar `.gsd/`-bestanden, handoff schrijven | §5 |
| Contextcheckpoint / `/compact` overwegen | §6 |
| CI, branch protection, secrets, bestandsstructuur | §7 |
| Een fase of framework overslaan | §8 |
| Welk commando hoort bij welke fase | §9 |
| Versie bepalen, CHANGELOG schrijven, `/retro`-uitkomsten verwerken | §12 |
| CLAUDE.md of STACK.md zelf aanpassen | `docs/CLAUDE-MD-GOVERNANCE.md` |

---

*Versie: 2.0.0 — gegenereerd op basis van Superpowers v5+, GStack v1.26+,
UI UX Pro Max (npm-latest), GSD v1.40+, Claude Mem v12+*
