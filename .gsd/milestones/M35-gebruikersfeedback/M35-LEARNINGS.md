# M35 — Learnings (gebruikersfeedback milestone 1)

> Afgerond: 2026-06-10 · versie 2.6.0

## Wat goed werkte
- **Feedback → taken-tabel → kleine commits**: 6 feedbackpunten in 2 feature-commits + 2 review-fix-commits; elke taak raakte ≤3 bestanden.
- **State lifting voor T03** was de juiste keuze: filter/sort in App.tsx houdt KlasOverzicht stateless en het gedrag overleeft view-wisselingen zonder persistentie-laag.
- **Blok-extractie voor T04**: SBL/SBC/negatief-blokken als const JSX-elementen maakt herordening triviaal en voorkomt dubbele berekening.
- **QA in kale browser werkt voor deze Tauri-app**: Vite module graph dynamic import (`await import('/utils/klassen.ts')`) geeft directe toegang tot de module-singleton om testdata te injecteren — geen Tauri-shell nodig voor UI-verificatie.

## Wat anders moet
- **Testmocks waren incompleet na de security-milestone**: de AES-encryptie (7 juni) introduceerde `invoke()` uit `@tauri-apps/api/core`, maar alleen `@tauri-apps/plugin-store` was gemockt — 4 tests faalden stil sindsdien. Les: bij elke nieuwe Tauri-IPC dependency direct de bijbehorende vi.mock toevoegen in alle testbestanden die het pad raken.
- **CHANGELOG liep 3 releases achter** (2.4.x, 2.5.0, 2.5.1 ontbraken). De changelog-validatie uit CLAUDE.md Fase 4 ving dit; backfill gedaan bij 2.6.0. Les: changelog-entry schrijven bij de versie-bump-commit, niet erna.
- **Pre-existing TS-errors blijven liggen**: theme-type 'system' ontbreekt in type-unie (App.tsx:41, SettingsPage.tsx:148) en JSX-namespace in utils/spider.tsx. Opnemen in volgende milestone.

## Technische schuld (meegenomen naar volgende milestone)
- [ ] Theme type-unie uitbreiden met 'system' (2 TS2367-errors)
- [ ] `JSX.Element` → `React.JSX.Element` in utils/spider.tsx + tests/spider.test.ts (TS2503/TS2345)
- [ ] debugPrognose zoekt nog op naam (invoer is oké, maar overweeg leerlingId-only lookup)
