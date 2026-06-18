# M40-LEARNINGS.md — Auto-update-systeem

> Geschreven retroactief (2026-06-18) — deze milestone had geen GSD-milestone-map; uitvoering liep
> volledig via Superpowers (design + plan in `docs/superpowers/specs/` en `docs/superpowers/plans/`).

## Wat niet werkte

1. **Geen milestone-map → STATE.md/ROADMAP.md droogden 3 milestones achterstand op.** Omdat M39
   (prognose-verdieping) en M40 (dit) buiten de GSD-milestone-structuur om zijn uitgevoerd, is er nooit
   een handoff naar STATE.md geschreven totdat een latere sessie het expliciet moest reconstrueren uit
   `git log` en `CHANGELOG.md`. Volgende keer: ook bij een Superpowers-only-uitvoering minstens een
   handoff-regel in STATE.md schrijven zodra het werk klaar is, ook zonder volledige milestone-map.

2. **ROADMAP.md claimde een milestone-nummer (M39) vóór er werk onder viel, en het daadwerkelijke werk
   claimde hetzelfde nummer opnieuw zonder de ROADMAP terug te lezen.** Resultaat: twee verschillende
   dingen heetten "M39" in verschillende bronnen (ROADMAP.md vs. commit-messages). Volgende keer:
   milestone-nummers pas vastleggen in ROADMAP.md op het moment dat de milestone-map wordt aangemaakt,
   niet eerder als placeholder.

3. **`ci.yml` triggerde op een branch ("main") die niet bestaat in deze repo.** Dit is maanden onopgemerkt
   gebleven omdat niemand controleerde of de workflow ooit daadwerkelijk een run produceerde — alleen of
   het bestand "klaar" leek. Volgende keer: na het schrijven/wijzigen van een GitHub Actions-workflow,
   één keer handmatig verifiëren dat hij ook echt triggert (`gh run list`), niet alleen de YAML-syntax.

4. **Branch protection met "1 reviewer verplicht" is onuitvoerbaar op een solo-maintainer-repo** — GitHub
   staat geen self-approval toe, dus de eis blokkeert elke merge zonder een tweede account. Dit hoorde
   in Fase 0 besloten te zijn (CLAUDE.md §7 vereist branch protection "vóór eerste /ship"), niet pas
   ontdekt te worden tijdens het daadwerkelijk instellen ervan.

## Wat wel werkte

- De 8-angle parallelle code-review (3 correctheid + 3 cleanup + altitude + conventions) op de volledige
  feature-diff vond 4 reële, onafhankelijk-bevestigde correctheidsbugs die een enkele lineaire review
  waarschijnlijk had gemist (met name de `checkForUpdate()`-foutverzwelging, bevestigd door 4 van de 8
  hoeken onafhankelijk van elkaar).
- De regressietest voor de foutverzwelgingsbug (`SettingsPage — Controleer op updates`) sloot meteen een
  bestaand testdekkingsgat: de handmatige update-check-flow had vóór deze sessie nul tests.

## Voor volgende milestone (M41 — uitrol naar collega's)

- Begin met Fase 0 (`/office-hours`) — er is nog geen ADR, geen scope-besluit.
- Beslis bij die gelegenheid ook: blijft branch protection op 0 verplichte reviewers (huidige realiteit),
  of komt er een tweede maintainer-account?
