# CLAUDE.md — Geïntegreerde stack
# Superpowers · GStack · UI UX Pro Max · GSD · Claude Mem

> Dit bestand heeft de hoogste prioriteit. Alle framework-skills, plugins en subagents
> volgen deze instructies. Bij conflict wint dit bestand altijd.

---

## 0. Sessieopstart — verplichte volgorde

Bij elke nieuwe sessie of na `/compact`, voer dit uit **vóór** je iets anders doet:

1. **Controleer** skills & plugins op aanwezigheid en versie (zie §0a hieronder)
2. **Lees** `.gsd/STATE.md` → bepaal de huidige fase én, bij meerdere milestones, welke actief is (`ACTIEF`) en welke wachten (`WACHT`); werk op uitsluitend de actieve milestone verder
3. **Lees** `.gsd/DECISIONS.md` → herstel architectuurkennis
4. **Lees** `.gsd/KNOWLEDGE.md` → herstel projectregels en patronen
5. **Roep** Claude Mem aan → haal relevante sessieherinneringen op (zie sectie 3)
   - Injecteer **uitsluitend** memories waarvan het `project:`-veld overeenkomt met de naam in `.gsd/PROJECT.md`
   - Bij geen overeenkomst: lege injectie — geen fallback naar memories van een ander project
6. **Controleer** op conflicten tussen geïnjecteerde memories en GSD-bestanden:
   - Lees nogmaals de betreffende GSD-sectie als een memory afwijkt
   - Noteer de afwijking in `.gsd/KNOWLEDGE.md` onder `## Mem-conflict [datum]`
   - Ga daarna pas verder — GSD wint altijd
7. **Meld** aan de gebruiker: huidige fase, openstaande taken, last commit

---

## §0a. Skill & plugin check — verplicht bij eerste gebruik

Voer onderstaande controle uit **vóór stap 2** van de sessieopstart in elk van deze gevallen:
- **Eerste gebruik** — `.gsd/STATE.md` bestaat nog niet
- **Stack nooit geverifieerd** — `.gsd/STATE.md` bestaat maar bevat geen `## Stack-check`
- **Handmatige trigger** — de gebruiker typt `/check-stack`

In alle overige sessies (STATE.md bestaat én bevat een recente Stack-check) sla je §0a over en ga je direct naar stap 2.

### Detectie: eerste gebruik of ontbrekende stack-check
```bash
# Eerste gebruik:
[ ! -f .gsd/STATE.md ] && echo "EERSTE_GEBRUIK"

# Stack nooit geverifieerd (STATE.md bestaat maar heeft geen Stack-check):
[ -f .gsd/STATE.md ] && ! grep -q "Stack-check" .gsd/STATE.md && echo "STACK_NOOIT_GECHECKT"
```

### Stap A — Controleer aanwezigheid van elke skill/plugin

```bash
# ── GSD ──────────────────────────────────────────────────────────────────────
GSD_VERSION=$(npx get-shit-done-cc --version 2>/dev/null)
[ -z "$GSD_VERSION" ] && echo "GSD: ONTBREEKT" || echo "GSD: $GSD_VERSION"

# ── GStack ───────────────────────────────────────────────────────────────────
GSTACK_CMDS=$(ls ~/.claude/skills/gstack/commands/ 2>/dev/null | grep -cE "office-hours|review|ship|qa")
[ "$GSTACK_CMDS" -lt 4 ] && echo "GStack: ONTBREEKT of ONVOLLEDIG" || echo "GStack: aanwezig"

# ── UI UX Pro Max ─────────────────────────────────────────────────────────────
UIPRO=$(ls ~/.claude/skills/ 2>/dev/null | grep -c "ui-ux-pro-max")
[ "$UIPRO" -eq 0 ] && echo "UI UX Pro Max: ONTBREEKT" || echo "UI UX Pro Max: aanwezig"

# ── Claude Mem ────────────────────────────────────────────────────────────────
MEM_HOOK=$(cat .claude/settings.json 2>/dev/null | grep -c "SessionStart")
[ "$MEM_HOOK" -eq 0 ] && echo "Claude Mem: ONTBREEKT of hook niet geconfigureerd" || echo "Claude Mem: geconfigureerd"
```

> **Superpowers** kan niet via de terminal worden geverifieerd — dat is een in-sessie plugin.
> Controleer met `/plugin list | grep superpowers` in een actieve Claude Code sessie.

### Stap B — Installeer ontbrekende componenten

Voer alleen de blokken uit voor componenten die in stap A als ONTBREEKT zijn gemeld:

```bash
# GSD (ontbreekt)
npx get-shit-done-cc

# GStack (ontbreekt of onvolledig)
git clone --single-branch --depth 1 \
  https://github.com/garrytan/gstack.git \
  ~/.claude/skills/gstack

# UI UX Pro Max (ontbreekt)
npm install -g uipro-cli
uipro init --ai claude

# Claude Mem (ontbreekt)
npx claude-mem install
```

> **Superpowers (ontbreekt):** typ in de actieve Claude Code sessie:
> `/plugin install superpowers@claude-plugins-official`

**Als een installatie faalt:**
- Schrijf de fout in `.gsd/STATE.md` onder `## Stack-fout [datum]: [componentnaam]`
- Werk tijdelijk verder zonder die component — gebruik de bypass-regels uit sectie 8
- Vraag de gebruiker aan het einde van de sessie om de installatie handmatig te controleren
- Start pas een nieuwe milestone nadat de ontbrekende component is hersteld

### Stap B2 — Werk verouderde componenten bij

Voer alleen de blokken uit voor componenten die in stap A als VEROUDERD zijn gemeld:

```bash
# GSD bijwerken (gebruik @latest om daadwerkelijk te updaten)
npx get-shit-done-cc@latest
npx get-shit-done-cc --version   # bevestig versie na update

# GStack bijwerken
git -C ~/.claude/skills/gstack pull --ff-only
# Bij fout "Not possible to fast-forward" (lokale wijzigingen aanwezig):
#   git -C ~/.claude/skills/gstack stash
#   git -C ~/.claude/skills/gstack pull --ff-only
#   git -C ~/.claude/skills/gstack stash pop
# Bij aanhoudende conflicten: fresh clone (zie sectie 10 stap 2)

# UI UX Pro Max bijwerken
npm update -g uipro-cli
uipro init --ai claude           # herinitialiseer na update

# Claude Mem bijwerken
npx claude-mem install           # overschrijft de bestaande installatie
```

> **Superpowers bijwerken:** typ in de actieve Claude Code sessie:
> `/plugin update superpowers`

### Stap C — Versieverificatie (up-to-date check)

Na installatie of bij een bestaand project: controleer of de aanwezige versies voldoen aan de minimumvereisten uit de footer van dit bestand (`Superpowers v5+`, `GStack v1.26+`, `UI UX Pro Max v2.5+`, `GSD v1.40+`, `Claude Mem v12+`).

```bash
# GSD — versie ophalen
npx get-shit-done-cc --version
# Verwacht: 1.40 of hoger

# GStack — laatste commit datum (als versienummer ontbreekt)
git -C ~/.claude/skills/gstack log -1 --format="%ci"
# Bij verouderde output (> 30 dagen oud): voer stap 2 uit sectie 10 opnieuw uit

# UI UX Pro Max — versie ophalen
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py --version 2>/dev/null \
  || uipro --version 2>/dev/null
# Verwacht: 2.5 of hoger

# Claude Mem — versie ophalen
npx claude-mem --version 2>/dev/null
# Verwacht: 12 of hoger
```

### Uitkomst rapporteren

Meld de uitkomst aan de gebruiker in dit formaat vóór je verdergaat met de sessieopstart:

```
Stack-status:
  GSD          v1.4x  ✓ / ✗ ontbreekt / ✗ verouderd (gevonden: vX.Y)
  GStack             ✓ / ✗ ontbreekt / ✗ verouderd
  Superpowers        ✓ bevestig via /plugin list / ✗ controleer handmatig
  UI UX Pro Max v2.x ✓ / ✗ ontbreekt / ✗ verouderd (gevonden: vX.Y)
  Claude Mem   v12.x ✓ / ✗ ontbreekt / ✗ verouderd (gevonden: vX.Y)
```

Als alle componenten aanwezig en up-to-date zijn: ga direct verder naar stap 2 van sectie 0.
Als er componenten ontbreken of verouderd zijn: **pauzeer de sessieopstart** en herstel eerst de stack voordat je verdergaat. Schrijf een melding in `.gsd/STATE.md` onder `## Stack-check [datum]`.

---

Als `.gsd/STATE.md` niet bestaat → bevind je je in **Fase 0: Ontdekking**.
Maak de `.gsd/` map aan en start met GStack `/office-hours`.

**Als de SessionStart hook faalt of Claude Mem niet reageert:**
→ Log een waarschuwing in `.gsd/STATE.md` onder `## Mem-fout [datum]`  
→ Ga verder zonder geheugeninjectie — gebruik alleen GSD-bestanden als context  
→ Vraag de gebruiker aan het einde van de sessie om de hook te controleren via sectie 10

---

## 1. De vijf lagen — wie doet wat

```
┌─────────────────────────────────────────────────────────┐
│  LAAG 1  GStack          Beslissing & rolverdeling      │
│  LAAG 2  GSD             Context & spec stabiliteit     │
│  LAAG 3  Superpowers     Executie & TDD                 │
│  LAAG 4  UI UX Pro Max   Design intelligence            │
│  LAAG 5  Claude Mem      Persistente memory             │
└─────────────────────────────────────────────────────────┘
```

**Gouden regel:** elke laag heeft zijn eigen fase.
Geen twee frameworks spawnen tegelijkertijd subagents.

---

## 2. Faserouter — welk framework neemt de leiding

> **Noot over nummering:** de fases zijn genummerd naar eigenaar en prioriteit, niet naar uitvoeringsvolgorde. De uitvoeringsvolgorde is: **Fase 0 → Fase 1 → Fase 3 → Fase 2 → Fase 4**. Fase 5 is altijd beschikbaar als foutherstelpad.

### Fase 0 · Ontdekking
**Eigenaar:** GStack  
**Trigger:** nieuw project, nieuwe feature, onduidelijke richting  
**Actie:**
- Start met `/office-hours` — CEO-modus, daag de aannames uit
- Voer daarna `/plan-ceo-review` uit voor product-scope validatie
- Voer `/plan-eng-review` uit voor architectuurvalidatie
- Voer `/plan-design-review` uit als UI betrokken is

**GSD:** alleen lezen, nog geen subagents  
**Superpowers:** uitgeschakeld — geen brainstorm-gates starten  
**UI UX Pro Max:** uitgeschakeld  
**Blokkeer code:** geen regel code totdat fase 0 is afgesloten met `.gsd/DECISIONS.md`

**✓ Definition of Done — Fase 0 is klaar als:**
- `.gsd/DECISIONS.md` bestaat en minimaal één architectuurkeuze bevat onder `## Architectuur`
- `/plan-eng-review` is afgerond en akkoord gegeven
- Als er UI betrokken is: `/plan-design-review` is afgerond en akkoord gegeven
- Handoff-bericht is geschreven in `.gsd/STATE.md` (zie sectie 5)

---

### Fase 1 · Spec & context
**Eigenaar:** GSD  
**Trigger:** `.gsd/DECISIONS.md` bestaat en Fase 0 DoD is afgevinkt  
**Actie:**
- GSD schrijft `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, `.gsd/DECISIONS.md`
- GSD maakt milestone-map aan: `.gsd/milestones/M001-*/`
- GSD schrijft `.gsd/STATE.md` na elke voltooide milestone
- GSD maakt `.gsd/ROADMAP.md` aan bij de eerste milestone en voegt elke nieuwe milestone toe als rij: `| M001 | [naam] | [status] | [verwachte datum] |`

**UI-check (verplicht aan het einde van Fase 1):**  
Bevat `S01-PLAN.md` een UI-taak? Dan geldt:
- Plan **Fase 3 in als verplicht tussenstation vóór Fase 2** — `.gsd/DESIGN.md` wordt aangemaakt in Fase 3, niet hier
- Fase 3 is geen optionele trigger maar een harde voorwaarde voor Fase 2-start

**Superpowers:** uitgeschakeld — wacht op voltooide spec  
**GStack:** advisory — mag reviewen maar start geen `/plan-*` opnieuw  
**Claude Mem:** slaat de spec-beslissingen op als geheugen voor volgende sessies

**Conflictregel GSD ↔ Superpowers:**  
GSD beheert welke taken klaar zijn voor executie. Zodra een milestone-slice gereed
is in `S01-PLAN.md`, geeft GSD het stokje over aan Superpowers.
GSD spawnt **geen eigen executie-subagents** zodra Superpowers actief is.

**✓ Definition of Done — Fase 1 is klaar als:**
- `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md` bestaan en zijn ingevuld
- Minimaal één milestone-map `.gsd/milestones/M001-*/` bestaat
- `S01-PLAN.md` bestaat in die milestone-map met concrete taken
- UI-check is uitgevoerd: als er UI-taken zijn, staat **Fase 3 ingepland als verplicht tussenstation vóór Fase 2** — `.gsd/DESIGN.md` hoeft hier nog niet te bestaan, maar wordt aangemaakt in Fase 3
- Handoff-bericht is geschreven in `.gsd/STATE.md`

---

### Fase 3 · Design & UI
**Eigenaar:** UI UX Pro Max  
**Trigger:** `S01-PLAN.md` bevat een UI-taak én Fase 1 DoD is afgevinkt — **vóór** Fase 2 start  
**Actie:**
- Genereer eerst het design system:
  ```bash
  python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
    "[productnaam en context]" --design-system -p "[Projectnaam]"
  ```
- Het output-design system wordt opgeslagen als `.gsd/DESIGN.md`
- GStack `/plan-design-review` valideert het design system vóór implementatie

> **Positie in de keten:** Fase 1 → **Fase 3** → Fase 2. Fase 3 is geen zwevende trigger
> maar een verplicht checkpoint als er UI in het plan zit.

**Stack:** geef altijd de stack mee (Next.js, React, etc.) of laat het defaulten naar HTML + Tailwind  
**Anti-patterns:** UI UX Pro Max voert automatisch pre-delivery checks uit — respecteer de bevindingen  
**GStack design ↔ UI UX Pro Max:**  
GStack maakt systeem-niveau design (typografie, kleurpalet, merkidentiteit → `.gsd/DESIGN.md`).
UI UX Pro Max werkt op component-niveau (implementatie, stijlkeuzes per scherm).

> **Scope-afbakening (voorkomt dubbel werk):**
>
> | Check | Eigenaar | Scope | Blokkerend |
> |---|---|---|---|
> | `/plan-design-review` | GStack | Systeem-niveau: typografie, kleurpalet, merkidentiteit, consistentie met `.gsd/DECISIONS.md` | Ja — vóór implementatie |
> | Pre-delivery checks | UI UX Pro Max | Component-niveau: implementatiecorrectheid, stijlkeuzes per scherm, anti-patterns, a11y | Ja — vóór handoff naar Fase 2 |
>
> Bij conflict: GStack wint op merkidentiteit en systeem-niveau; UI UX Pro Max wint op component-implementatie. Beide checks zijn verplicht en sequentieel: GStack eerst, UI UX Pro Max daarna.

**✓ Definition of Done — Fase 3 is klaar als:**
- `.gsd/DESIGN.md` bestaat en is gevuld door het search-script
- `/plan-design-review` is afgerond en akkoord gegeven door GStack
- Pre-delivery checks van UI UX Pro Max geven geen blokkerende bevindingen
- **Statische a11y-check geslaagd** op het design system (nog geen draaiende app vereist):
  - Kleurcontrast alle tekst/achtergrond combinaties ≥ 4.5:1 (WCAG AA normaal) of ≥ 3:1 (WCAG AA groot)
  - Typografie-groottes ≥ 16px voor bodytekst
  - Controleer met `npx color-contrast-checker` of manueel via [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker)
  - Bij afwijking: herstel in `.gsd/DESIGN.md` vóór handoff naar Fase 2
- Handoff-bericht is geschreven in `.gsd/STATE.md`

---

### Fase 2 · Executie
**Eigenaar:** Superpowers  
**Trigger:** `S01-PLAN.md` bestaat, Fase 1 DoD is afgevinkt én — als er UI-taken zijn — Fase 3 DoD is afgevinkt  
**Actie:**
- Superpowers leest `S01-PLAN.md` en verifieert dat het bestand compleet is vóór start
- Volgorde: **RED** (schrijf falende test) → **GREEN** (minimale code) → **REFACTOR**
- Superpowers mag hier subagents spawnen via `subagent-driven-development`
- Elke subagent krijgt een verse context — max één slice per subagent
- Na elke taak: `verification-before-completion` + `requesting-code-review`

> **Scope-afbakening reviews (voorkomt dubbel werk):**
> 
> | Review | Eigenaar | Wanneer | Scope |
> |---|---|---|---|
> | `requesting-code-review` | Superpowers | Na elke taak | Taak-niveau: test slaagt, geen regressies, implementatie correct |
> | `/review` | GStack | Na voltooide slice | Slice-niveau: architectuur, naamgeving, patronen, DECISIONS.md-conformiteit |
> 
> Bij conflicterende bevindingen: GStack wint op architectuurniveau, Superpowers wint op implementatieniveau. Beide reviews zijn verplicht — ze vervangen elkaar niet.

**GSD tijdens executie:**  
- **Leest** `S01-SUMMARY.md` om voortgang te bewaken en `.gsd/STATE.md` bij te werken
- **Schrijft niet** naar `S01-SUMMARY.md` — dat is Superpowers-eigendom
- Start **geen** eigen orchestrators of parallelle waves
- Bewaakt contextgebruik — zie sectie 6 voor checkpoints

**Superpowers tijdens executie:**
- Schrijft taakresultaten naar `S01-SUMMARY.md` na elke voltooide taak (locatie: `.gsd/milestones/M001-*/S01-SUMMARY.md`)
- Meldt voltooiing van een slice aan GSD zodat GSD `.gsd/STATE.md` kan bijwerken

**Superpowers interactieve gates:**  
Als Superpowers een Q&A-gate opent (brainstorm-vraag), beantwoord dan direct.
GSD onderbreekt deze flow niet. Wacht tot de gate gesloten is.

**GStack tijdens executie:**  
- `/review` mag na voltooide slice — maar pas nadat Superpowers klaar is
- Geen nieuwe planning-skills tijdens actieve executie

**✓ Definition of Done — Fase 2 is klaar als:**
- Alle taken in `S01-PLAN.md` zijn afgevinkt in `S01-SUMMARY.md`
- Alle tests slagen (`npm test` / equivalent geeft geen rode output)
- `verification-before-completion` is uitgevoerd en akkoord
- Handoff-bericht is geschreven in `.gsd/STATE.md` door **GSD** (Superpowers meldt voltooiing aan GSD, GSD schrijft het handoff-bericht — Superpowers heeft geen schrijfrechten op STATE.md)

**⚠ Foutherstel Fase 2 — als een subagent of taak mislukt:**
1. Schrijf de fout naar `.gsd/milestones/M001-*/S01-SUMMARY.md` onder `## Fout [datum]: [taaknaam]`
2. Bepaal oorzaak: is het een scope-probleem (→ terug naar GSD, Fase 1) of een implementatieprobleem (→ nieuwe subagent, zelfde slice)?
3. Start **nooit** een nieuwe subagent zonder de fout eerst gedocumenteerd te hebben
4. Bij meer dan twee mislukte pogingen op dezelfde taak: pauzeer en vraag de gebruiker om input

---

### Fase 4 · Review & ship
**Eigenaar:** GStack  
**Trigger:** Fase 2 DoD afgevinkt en tests groen  
**Actie:**
- `/review` — code review door Staff Engineer persona
- `/qa` — browser-test via Playwright (persistent Chromium process)
- **Security scan** — verplicht vóór `/ship`:
  ```bash
  # Node-projecten:
  npm audit --audit-level=high
  # Python-projecten:
  pip-audit
  ```
  Bij hoge of kritieke kwetsbaarheden: blokkeer `/ship`, terug naar Fase 2 voor fix. Schrijf bevinding in `.gsd/STATE.md` onder `## Security-blokkade [datum]`.
- **Changelog-validatie** — verplicht vóór `/ship`: controleer of de CHANGELOG-entry het formaat `[versie] — [datum] — [beschrijving]` heeft en niet leeg is. Als de entry ontbreekt of leeg is: blokkeer `/ship` tot de entry is aangevuld.
- `/ship` — merge, CHANGELOG, VERSION bump, PR aanmaken
- `/retro` — wekelijkse terugblik op patronen en verbeterpunten; uitkomsten worden geschreven naar `.gsd/KNOWLEDGE.md` onder `## Retro [datum]` en, als een structurele aanpassing van de workflow nodig is, als voorstel voor een nieuwe CLAUDE.md-versie aangeboden aan de projectlead
- `/document-release` — update README, ARCHITECTURE, CONTRIBUTING
- **CI-verificatie** — controleer na PR-aanmaak of de CI-pipeline groen is:
  - Als `/ci-setup` beschikbaar is in de geïnstalleerde GStack-versie: voer het uit
  - Anders: noteer in `.gsd/STATE.md` onder `## CI-status [datum]` of de pipeline slaagt
  - Minimumvereiste (zie sectie 7): repo heeft een CI-check op `npm test` of equivalent bij elke PR

**Superpowers:** uitgeschakeld na `/ship`  
**GSD:** schrijft `.gsd/milestones/M001-*/M001-LEARNINGS.md` na voltooide milestone

**✓ Definition of Done — Fase 4 is klaar als:**
- `/review` geeft geen blokkerende opmerkingen
- `/qa` geeft geen falende browser-tests
- **Dynamische a11y-check geslaagd** op de gebouwde applicatie (vereist draaiende URL):
  ```bash
  npx @axe-core/cli [url] --tags wcag2aa
  ```
  Bij blokkerende bevindingen (contrast, ARIA, focus-volgorde): terug naar Fase 2 voor fix. Blokkerende bevindingen zijn geen optie — ze blokkeren `/ship`.
- Security scan geeft geen hoge of kritieke kwetsbaarheden
- **Performance-baseline gemeten** (aanbevolen, geen harde blokkade):
  ```bash
  npx lighthouse [url] \
    --only-categories=performance \
    --output=json \
    --output-path=./lighthouse-report.json \
    --chrome-flags="--headless"
  # Score uitlezen:
  node -e "const r=require('./lighthouse-report.json'); \
    console.log('Score:', r.categories.performance.score * 100)"
  ```
  Score ≥ 80: doorgaan. Score < 80: vastleggen als technische schuld in `.gsd/milestones/M001-*/M001-LEARNINGS.md` en opnemen in volgende milestone — geen blokkade voor huidige `/ship`.
- PR is aangemaakt en CHANGELOG is bijgewerkt (entry niet leeg en in het formaat `[versie] — [datum] — [beschrijving]`)
- `.gsd/milestones/M001-*/M001-LEARNINGS.md` is geschreven door GSD
- Schrijf in `.gsd/STATE.md` onder `## Milestone afgerond [datum]`: versienummer en naam van de milestone
- Zet de milestone-status in `.gsd/STATE.md` op `DONE`
- Start daarna pas een nieuwe milestone — terug naar Fase 0 voor de volgende feature

---

### Fase 5 · Foutherstel (altijd beschikbaar)
**Eigenaar:** GStack (coördineert), GSD (documenteert)  
**Trigger:** vastgelopen fase, crashende subagent, ontbrekend bestand, meer dan twee mislukte pogingen

**Escalatiepad:**
```
Probleem gedetecteerd
  ↓
Schrijf naar .gsd/STATE.md: ## Blokkade [datum]: [omschrijving]
  ↓
Bepaal terugkeerzone:
  • Ontbrekende spec of gewijzigde scope  → terug naar Fase 1
  • Implementatiefout, tests falen        → terug naar Fase 2 (nieuwe subagent)
  • Design klopt niet                     → terug naar Fase 3
  • Review blokkeert                      → terug naar Fase 2 (fix)
  ↓
Schrijf handoff in .gsd/STATE.md met reden van terugkeer
  ↓
Informeer gebruiker vóór herstart
```

**Parallelle features (meerdere features tegelijk in development):**
- Elke feature krijgt een eigen milestone-map: `M001-feature-a/`, `M002-feature-b/`
- Slechts één milestone is tegelijk actief in Fase 2 — de rest staat op `WACHT`
- Volgorde wordt bepaald in `.gsd/STATE.md` onder `## Prioriteitsvolgorde`
- GStack `/office-hours` bepaalt bij conflict welke feature prioriteit krijgt

**Wanneer handmatige interventie vereist is:**
- Meer dan twee foutherstelcycli op dezelfde taak
- `.gsd/STATE.md` ontbreekt en kan niet worden hersteld
- Tegenstrijdige instructies tussen `.gsd/DECISIONS.md` en een subagent-uitkomst

---

## 3. Memory — Claude Mem integratie

Claude Mem draait als **achtergrondhook** tijdens alle fases en injecteert context bij sessiestart.

### Geheugenformaat
Elke memory heeft de volgende structuur:
```
type:       [beslissing | patroon | bug | workaround | les]
fase:       [0 | 1 | 2 | 3 | 4]
project:    [exacte naam uit .gsd/PROJECT.md — verplicht veld]
onderwerp:  [korte omschrijving, max 10 woorden]
inhoud:     [de feitelijke herinnering, max 3 zinnen]
datum:      [YYYY-MM-DD]
```

> Het `project:`-veld is verplicht. Een memory zonder dit veld wordt niet opgeslagen
> en niet geïnjecteerd.

### Injectiemaximum
- De SessionStart hook injecteert maximaal **800 tokens** aan memories
- Selectiecriterium: alleen memories waarvan `project:` overeenkomt met de naam in `.gsd/PROJECT.md`
- Volgorde: meest recente memories van het huidige project eerst, daarna op type `beslissing`
- Bij meer dan 800 tokens: oudste memories worden weggelaten, niet afgekapt
- Bij geen overeenkomst: lege injectie — geen fallback naar memories van andere projecten

### Conflictresolutie tussen Claude Mem en GSD
Als een Claude Mem memory tegenstrijdig is met een GSD-bestand:
→ Lees de betreffende GSD-sectie nogmaals en noteer de afwijking expliciet  
→ Het GSD-bestand wint altijd — GSD bevat de laatste bekrachtigde staat  
→ Schrijf de tegenstrijdigheid als notitie in `.gsd/KNOWLEDGE.md` onder `## Mem-conflict [datum]` voor review

### Wat Claude Mem vastlegt
- **Context en motivatie** van architectuurbeslissingen uit fase 0: waarom is een keuze gemaakt, welke alternatieven zijn afgewezen en waarom. *Niet* de keuze zelf — die staat in `.gsd/DECISIONS.md`.
- TDD-keuzes en testpatronen uit fase 2
- Design-keuzes en afgewezen alternatieven uit fase 3
- Bugs, workarounds en overdraagbare lessen (generiek toepasbaar buiten dit project — zie onderscheid met `.gsd/milestones/M001-*/M001-LEARNINGS.md` hieronder)

> **Onderscheid Claude Mem ↔ DECISIONS.md:**  
> `.gsd/DECISIONS.md` legt vast **wat** is besloten (de keuze zelf).  
> Claude Mem legt vast **waarom** (motivatie, context, afgewezen alternatieven).  
> Ze zijn complementair. Als een Claude Mem memory een andere keuze suggereert dan DECISIONS.md: dat is altijd een Mem-conflict — DECISIONS.md wint.

> **Onderscheid Claude Mem type `les` ↔ `M001-LEARNINGS.md`:**  
> `.gsd/milestones/M001-*/M001-LEARNINGS.md` (GSD) = projectgebonden lessen: wat werkte niet, wat moet anders in de volgende milestone. Scope: dit project, deze milestone.  
> Claude Mem type `les` = overdraagbare patronen: wat is generiek toepasbaar op andere projecten. Scope: cross-project.  
> Claude Mem slaat dus alleen op wat de grens van dit project overstijgt.

### Wat GSD vastlegt (aparte verantwoordelijkheid)
- Projectspec en requirements → `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`
- Architectuurkeuzen → `.gsd/DECISIONS.md` (append-only)
- Projectregels → `.gsd/KNOWLEDGE.md`
- Voortgang → `.gsd/STATE.md`, `.gsd/ROADMAP.md`

### Overlap vermijden
GSD slaat op **wat te bouwen** (spec, plan, staat).  
Claude Mem slaat op **wat gedaan en geleerd is** (beslissingen, patronen, context).  
Ze schrijven naar verschillende locaties en conflicteren niet.

### Sessieherstel
Bij sessiestart:
1. Lees GSD-bestanden (STATE.md, DECISIONS.md, KNOWLEDGE.md) — stap 2–4 van sectie 0
2. Claude Mem injecteert relevante herinneringen (alleen huidig project uit `.gsd/PROJECT.md` — zie injectiemaximum)
3. Controleer op conflicten: lees betreffende GSD-sectie opnieuw bij afwijking, noteer in `.gsd/KNOWLEDGE.md`
4. GSD wint altijd bij conflict
5. Als de hook faalt: zie fallback in sectie 0

---

## 4. Subagent-conflictregel (kritiek)

```
REGEL: Nooit twee frameworks tegelijkertijd subagents laten spawnen.

Superpowers subagents: ALLEEN actief tijdens Fase 2 (executie)
GSD orchestrators:     ALLEEN actief tijdens Fase 1 (spec)
GStack subagents:      GEEN — GStack gebruikt slash commands, geen subagents
UI UX Pro Max:         GEEN subagents — activeert inline als skill
Claude Mem:            GEEN subagents — hooks, geen agents
```

Als Superpowers een interactieve Q&A-gate opent terwijl GSD actief is:
→ Pauzeer GSD. Beantwoord de gate. Hervat GSD daarna.

Als GSD een nieuwe orchestrator wil starten terwijl Superpowers een subagent runt:
→ Wacht tot de Superpowers-taak + review voltooid zijn. Dan pas GSD verder.

---

## 5. Communicatie tussen frameworks

De frameworks communiceren via bestanden, niet via directe aanroepen.

### Schrijfrechten per framework

| Bestand / map | Schrijft | Leest | Mag niet schrijven |
|---|---|---|---|
| `.gsd/DECISIONS.md ## Architectuur` | GStack (fase 0) | Superpowers, Claude Mem, GSD | UI UX Pro Max |
| `.gsd/DECISIONS.md ## Spec-verfijning` | GSD (fase 1+) | Superpowers, Claude Mem, GStack | UI UX Pro Max |
| `.gsd/milestones/*/S01-PLAN.md` | GSD | Superpowers | GStack, UI UX Pro Max |
| `.gsd/milestones/*/S01-SUMMARY.md` | Superpowers | GSD | GStack, UI UX Pro Max |
| `docs/superpowers/specs/` | Superpowers | GSD | Overige frameworks |
| `.gsd/DESIGN.md` | UI UX Pro Max | GStack | GSD, Superpowers |
| `~/.claude-mem/` | Claude Mem | Claude Mem (injectie) | Alle andere frameworks |
| `.gsd/STATE.md` | GSD, GStack (handoff) | Alle frameworks | Superpowers (alleen-lezen) |
| `.gsd/KNOWLEDGE.md` | GSD | Alle frameworks | Superpowers |

**Conflictregel DECISIONS.md:** GStack schrijft uitsluitend naar `## Architectuur`, GSD schrijft
uitsluitend naar `## Spec-verfijning`. Bij inhoudelijk conflict in dezelfde sectie: GStack wint
in Fase 0, GSD wint in Fase 1 en later. Noteer conflicten altijd in `.gsd/KNOWLEDGE.md`.

Elk framework schrijft uitsluitend naar zijn eigen sectie/kolom. Race conditions zijn niet mogelijk
zolang slechts één framework per fase actief is (zie sectie 4).

### Bestandsoverdracht

```
GStack beslissingen    →  .gsd/DECISIONS.md ## Architectuur   (GSD leest dit)
GSD spec-verfijning    →  .gsd/DECISIONS.md ## Spec-verfijning
GSD slice-plan         →  .gsd/milestones/*/                  (Superpowers leest dit)
Superpowers spec       →  docs/superpowers/specs/             (GSD bewaart context)
UI UX Pro Max output   →  .gsd/DESIGN.md                      (GStack reviewt dit)
Claude Mem memories    →  ~/.claude-mem/                       (SessionStart injectie)
```

Na elke fase-overgang: schrijf een kort handoff-bericht in `.gsd/STATE.md`:
```
## Handoff [datum]
Van: [Framework A] — Fase [X]
Naar: [Framework B] — Fase [Y]
Status: [wat is klaar]
Openstaand: [wat de volgende fase moet weten]
DoD afgevinkt: [ja / nee — welke punten ontbreken]
```

---

## 6. Token- en contextbudget

```
Orchestrator (GSD hoofdsessie):   vaste checkpoints (zie hieronder)
Superpowers subagent per taak:    vers contextvenster, max 1 slice
GStack slash commands:            laden on-demand, geen permanente overhead
UI UX Pro Max skill:              laadt bij UI-keywords, daarna weer weg
Claude Mem SessionStart injectie: max 800 tokens, alleen huidig project
```

### Contextcheckpoints — wanneer STATE.md bijwerken en /compact overwegen

Voer een contextcheckpoint uit op elk van deze momenten:

1. **Na elke voltooide milestone-slice** — altijd, zonder uitzondering
2. **Na het inladen van meer dan 2 grote bestanden in één sessie** — groot = meer dan 200 regels of meer dan 5 KB
3. **Na 12 uitwisselingen in dezelfde sessie**
4. **Na het spawnen van 3 of meer Superpowers-subagents**

Bij een checkpoint:
1. Laat GSD `.gsd/STATE.md` bijwerken met huidige voortgang
2. Overweeg `/compact` — verplicht bij checkpoint 3 of 4
3. De SessionStart hook herstelt GSD-state en Claude Mem context automatisch na `/compact`
4. Als `/compact` niet beschikbaar is: start een nieuwe sessie — `.gsd/STATE.md` garandeert continuïteit

> De "40%-contextgrens" uit eerdere versies is vervangen door deze concrete checkpoints.
> Een tokenteller is niet beschikbaar — stuur op gedrag, niet op percentages.

---

## 7. Projectconventies

### Code
- Tests schrijven **vóór** implementatiecode (Superpowers TDD-wet)
- Geen code die niet direct een falende test laat slagen
- Commits: atomair, één doel per commit (GSD commit-discipline)

### Bestanden
```
.gsd/                          GSD state en spec (niet handmatig aanpassen)
.gsd/STATE.md                  Huidige fase, actieve milestone, handoffs
.gsd/DECISIONS.md              Architectuur- en spec-keuzen (append-only)
.gsd/KNOWLEDGE.md              Projectregels, patronen, retro-notities
.gsd/ROADMAP.md                Milestone-overzicht met status en datum
.gsd/DESIGN.md                 Design system (gegenereerd door UI UX Pro Max)
.gsd/milestones/M001-*/        Milestone-map met S01-PLAN.md, S01-SUMMARY.md en M001-LEARNINGS.md
docs/superpowers/              Superpowers specs en plannen
.claude/skills/                Geïnstalleerde skills (Superpowers, UI UX Pro Max)
CLAUDE.md                      Dit bestand — hoogste prioriteit
```

> **Versiebeheer:** `.gsd/` wordt **volledig gecommit** en bijgehouden in de repo — het is projectgeheugen, geen build-output. Voeg `.gsd/` nooit toe aan `.gitignore`. `.env` en `node_modules/` wél.

### Naamgeving
- Branches: `feature/[naam]`, `fix/[naam]`, `design/[naam]`
- Commits: `feat:`, `fix:`, `test:`, `design:`, `docs:`
- GSD milestones: `M001-[naam]`, slices: `S01`, taken: `T01`

### CI/CD
- Elke repo die wordt geshipt heeft minimaal één CI-check: `npm test` of equivalent bij elke PR
- Aanbevolen minimale GitHub Actions workflow voor **Node-projecten** (`.github/workflows/ci.yml`):
  ```yaml
  on: [pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - run: npm ci && npm test
  ```
- Aanbevolen minimale GitHub Actions workflow voor **Python-projecten** (`.github/workflows/ci.yml`):
  ```yaml
  on: [pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with:
            python-version: '3.12'
        - run: pip install -r requirements.txt && pytest
  ```
- Superpowers genereert de passende workflow in Fase 2 op basis van de projectstack, tenzij expliciet uitgesloten in `.gsd/DECISIONS.md`
- **Branch protection op `main` (verplicht vóór eerste `/ship`):** minimaal 1 reviewer vereist + CI moet groen zijn vóór merge. Zonder branch protection kan de volledige Fase 4 gate worden omzeild door direct naar `main` te pushen.
- `.env.example` is **verplicht** in de repo; GSD maakt dit aan in Fase 1 bij elke nieuwe dependency die een secret vereist
- `.env` staat altijd in `.gitignore` — Superpowers-subagents mogen `.env` nooit committen
- Secrets worden **nooit hardcoded**; Superpowers krijgt bij elke subagent-instructie expliciet mee: gebruik altijd `process.env.VAR` of equivalent
- Bij een nieuwe dependency die een secret vereist: GSD voegt de variabele toe aan `.env.example` vóór Superpowers de implementatie start
- Ontbrekende `.env`-variabelen bij start van Fase 2: blokkade — los op vóór executie

---

## 8. Wanneer welk framework te negeren

Gebruik onderstaande **objectieve drempelwaarden** — niet het gevoel van "dit is klein".

| Situatie | Objectief criterium | Negeer |
|---|---|---|
| Kleine bugfix | ≤2 bestanden geraakt, geen nieuwe tests nodig, fix past in één commit | Superpowers brainstorm-gates, GSD fase-overhead |
| Snel prototype / spike | Wegwerpcode, wordt niet gemerged, geen tests vereist | GStack planning-reviews, GSD milestone-structuur |
| Pure UI-taak zonder logica | Geen functies, geen state, alleen markup/stijl | Superpowers TDD (geen testbare logica) |
| Architectuurwijziging | Raakt ≥3 bestanden of introduceert een nieuwe dependency | Sla fase 0 **nooit** over — altijd GStack eerst |
| Korte sessie | Doel is uitgeschreven in één zin, geen afhankelijkheden van andere taken | Claude Mem sessie-injectie is optioneel |

**Verplicht bij toepassing van deze tabel:**  
Schrijf vóór je begint één zin in `.gsd/STATE.md` die uitlegt waarom dit geval in de tabel past:
```
## Afwijking [datum]: [situatie uit tabel]
Reden: [één zin]
```
Zo is de afwijking gedocumenteerd en zichtbaar bij de retrospective.

**Bij twijfel of een situatie in de tabel past: sla deze tabel over en start in Fase 0.**  
Het kost 5 minuten en voorkomt uren herstelwerk.

---

## 9. Snelreferentie — commando's per fase

```bash
# FASE 0 — Beslissing (GStack)
/office-hours           Idee challengen, CEO-modus
/plan-ceo-review        Product scope valideren
/plan-eng-review        Architectuur vergrendelen
/plan-design-review     Design richting bepalen

# FASE 1 — Spec (GSD)
npx get-shit-done-cc    GSD initialiseren
/gsd                    Status bekijken
/gsd discuss            Fase bespreken
/gsd plan               Milestone plannen

# FASE 3 — Design (UI UX Pro Max) — vóór Fase 2 als er UI-taken zijn
python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
  "[context]" --design-system -p "[naam]"

# FASE 2 — Executie (Superpowers)
# (automatisch — Superpowers activeert op basis van GSD-plan)
# Handmatig starten indien nodig:
# "use superpowers:subagent-driven-development"

# FASE 4 — Review & ship (GStack)
/review                 Code review
/qa                     Browser QA
/ship                   Releasen
/retro                  Terugblik
/document-release       Docs bijwerken

# FASE 5 — Foutherstel
# Geen commando — volg het escalatiepad in sectie 2 (Fase 5)
# Schrijf altijd eerst naar .gsd/STATE.md vóór je iets herstart
```

---

## 10. Installatie & verificatie

> **Primaire referentie voor installatie en verificatie is §0a** — die sectie is de gezaghebbende bron en wordt automatisch uitgevoerd. Sectie 10 dient als handmatige naslag bij problemen of bij installatie buiten een Claude Code sessie om.

Voer onderstaande stappen uit bij eerste gebruik. Deze sectie is zelfvoorzienend —
er is geen externe `docs/stack-setup.md` nodig.

### Stap 1 — GSD installeren
```bash
cd [projectmap]
npx get-shit-done-cc
# Verwachte output: GSD geïnitialiseerd, .gsd/ map aangemaakt
```

### Stap 2 — GStack installeren
```bash
git clone --single-branch --depth 1 \
  https://github.com/garrytan/gstack.git \
  ~/.claude/skills/gstack
```

### Stap 3 — Superpowers installeren
Typ dit in een actieve Claude Code sessie:
```
/plugin install superpowers@claude-plugins-official
```

### Stap 4 — UI UX Pro Max installeren
```bash
npm install -g uipro-cli
uipro init --ai claude
# Python 3 vereist: python3 --version
# Windows zonder Python: winget install Python.Python.3.12
```

### Stap 5 — Claude Mem installeren
```bash
npx claude-mem install
# Gebruik altijd npx install — niet npm install -g
# npx registreert de SessionStart hook automatisch
```

### Verificatie — controleer of alles aanwezig is
```bash
# GSD
npx get-shit-done-cc --version

# GStack
ls ~/.claude/skills/gstack/commands/ | grep -E "office-hours|review|ship|qa"

# Superpowers
# Typ in Claude Code sessie:
/plugin list | grep superpowers

# UI UX Pro Max
ls ~/.claude/skills/ | grep ui-ux-pro-max
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py --help

# Claude Mem — controleer SessionStart hook
cat .claude/settings.json | grep SessionStart
# Verwachte output: "SessionStart": "claude-mem inject"
# Bij lege output: voer stap 5 opnieuw uit
```

---

## 11. Governance van dit bestand

CLAUDE.md heeft de hoogste prioriteit in het project, maar heeft zelf ook een eigenaar en updateprocedure.

**Eigenaar:** de projectlead (persoon, niet een framework)  
**Locatie:** altijd in de projectroot, nooit in een submap  
**Bewerkingsrechten:** alleen handmatig door de eigenaar — geen enkel framework schrijft naar dit bestand

### Updateprocedure
1. Maak een branch aan: `docs/claude-md-[onderwerp]`
2. Pas het bestand aan
3. Noteer de wijziging in de changelog hieronder — **dit is een harde voorwaarde voor merge**
4. Laat reviewen door minimaal één ander teamlid
5. Merge naar main

> Een PR zonder changelogenrij wordt niet geaccepteerd.

### Changelog

| Datum | Versie | Auteur | Wijziging |
|---|---|---|---|
| 2026-01-01 | 1.0 | — | Initiële versie gegenereerd |
| 2026-01-01 | 1.1 | — | DoD per fase, Fase 5 foutherstel, objectieve drempelwaarden sectie 8, Claude Mem API-contract, schrijfrechten sectie 5, governance sectie 11 |
| 2026-06-01 | 1.2 | — | Fase 3 vaste positie in keten (na Fase 1, vóór Fase 2); Fase 4 expliciete milestone-afsluiting; Claude Mem project-scope verplicht veld; DECISIONS.md gesplitst in twee secties met conflictregel; contextcheckpoints vervangen vage 40%-grens; sessieopstart stap 5 conflict-verificatie toegevoegd; sectie 8 afwijkingsdocumentatie verplicht; sectie 10 zelfvoorzienend gemaakt (stack-setup.md verwijzing verwijderd); changelog updateprocedure aangescherpt |
| 2026-06-06 | 1.3 | — | §0a toegevoegd: automatische skill/plugin-check bij eerste gebruik en via `/check-stack`; aanwezigheids- én versieverificatie per component; installatie-instructies inline; sessieopstart stap 1 bijgewerkt |
| 2026-06-06 | 1.4 | — | 13 blinde vlekken gedicht: dubbele stap 2 verwijderd; §0a trigger verbreed (ook bij ontbrekende Stack-check-log); update-instructies per component toegevoegd (stap B2); installatie-fallback bij mislukking beschreven; sessieopstart stap 2 actieve-milestone-check; ROADMAP.md aanmaak voorgeschreven in Fase 1; Fase 0 DoD uitgebreid met /plan-design-review bij UI; "groot bestand" gedefinieerd (200r/5KB); /retro-uitkomsten naar KNOWLEDGE.md gerouteerd met CLAUDE.md-voorstelpad; sectie 10 als secundaire naslag gemarkeerd; uitvoeringsvolgorde fasen verduidelijkt; bestandsconventies uitgebreid met alle GSD-bestanden incl. S01-SUMMARY.md; PROJECT.md-pad genormaliseerd naar .gsd/PROJECT.md |
| 2026-06-06 | 1.5 | — | F1: alle bestandspaden in sectie 3 gekwalificeerd naar .gsd/; F2: Superpowers schrijft niet naar STATE.md — GSD schrijft handoff na melding van Superpowers; F3: Fase 1 DoD zegt niet meer dat DESIGN.md al bestaat — Fase 3 staat ingepland; F4: S01-SUMMARY.md eigendom van Superpowers vastgelegd, schrijfrechten-tabel uitgebreid; F5: sessieherstel verwijst nu correct naar stap 2–4; O1: scope-tabel taak-review vs slice-review toegevoegd; O2: scope-tabel GStack design-review vs UI UX Pro Max pre-delivery checks toegevoegd; O3+O4: Claude Mem verantwoordelijkheid gesplitst — motivatie/context vs keuze (DECISIONS.md), cross-project lessen vs projectlessen (LEARNINGS.md); B1: security scan (npm audit/pip-audit) als verplichte stap vóór /ship; B2: a11y-check (axe wcag2aa) toegevoegd aan Fase 3 DoD; B3: Lighthouse performance-baseline in Fase 4 DoD (aanbevolen, geen harde blokkade); B4: env/secrets-conventie toegevoegd aan sectie 7; B5: CI/CD-integratie als conventie en post-ship stap; B6: changelog-validatie als verplichte blokkade vóór /ship |
| 2026-06-06 | 1.6 | — | R1: STATE.md paden in Fase 5 code-block gekwalificeerd; R2: Fase 1 UI-check actietekst gecorrigeerd (was nog oude formulering, DoD was al correct); R3: interne reviewcode "zie B6" verwijderd uit Fase 4 DoD; I1: STATE.md in Fase 2 Superpowers-melding en sectie 9 commentaarregel gekwalificeerd; I2: M001-LEARNINGS.md volledig pad toegevoegd op alle vindplaatsen en opgenomen in bestandsoverzicht sectie 7; L1: a11y-check gesplitst — statische contrast/typografie-check in Fase 3 DoD (geen URL nodig), dynamische axe wcag2aa-check verplaatst naar Fase 4 DoD na /qa |
| 2026-06-06 | 1.7 | — | DevOps/AI-engineer review: E1: S01-SUMMARY.md pad gekwalificeerd in foutherstel Fase 2; O1: GSD update-commando gecorrigeerd naar npx @latest + aparte verificatiestap; O2: git pull --rebase vervangen door --ff-only met stash-fallback instructie; O3: npx axe gecorrigeerd naar npx @axe-core/cli (correct package); O4: Lighthouse output-flags gecorrigeerd met --output-path en node score-uitlezing; B1: expliciete versiebeheer-noot toegevoegd (.gsd/ commit verplicht, nooit gitignore); B2: Python CI-workflow toegevoegd naast Node-variant; B3: branch protection op main als verplichte conventie vóór eerste /ship |

---

*Versie: 1.7 — gegenereerd op basis van Superpowers v5+, GStack v1.26+,
UI UX Pro Max v2.5+, GSD v1.40+, Claude Mem v12+*
