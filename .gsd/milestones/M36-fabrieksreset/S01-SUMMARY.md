# M36 — S01-SUMMARY

> Geschreven door Superpowers (Fase 2). GSD leest dit voor STATE.md-updates.

## Voortgang

| ID | Taak | Status | Commit |
|---|---|---|---|
| T1 | Backup-payload v2 (store-snapshot, restore-semantiek, reloadRequired) | ✅ | `feat(M36-T1)` |
| T2 | Reload alléén na v2-overschrijven-restore (ImportPage, injecteerbare reloadFn) | ✅ | `feat(M36-T2)` |
| T3 | `factoryReset()` in `utils/reset.ts` (bindende volgorde, intact faalpad) | ✅ | `feat(M36-T3)` |
| T4 | Gevarenzone-sectie + wisdialoog SettingsPage | ✅ | `feat(M36-T4)` 11015f4 |
| DT1 | Dialoog-states conform states-tabel | ✅ | `feat(M36-T4)` 11015f4 |
| DT2 | A11y wisdialoog (dialog-rol, focus trap, Enter-gedrag, contrast) | ✅ | `feat(M36-T4)` 11015f4 |
| T5 | Dode `clearState()` verwijderen | ✅ | `refactor(M36-T5)` cdfbad0 |
| T6 | Handmatige QA-checklist op echte Tauri-build | ⬜ Fase 4 | |
| DT3 | Dark-mode verificatie wisdialoog (handmatige QA) | ⬜ Fase 4 | |

## Taakdetails

### T1 — Backup-payload v2 ✅
- `buildBackupPayload()`: version 2; `klassen`/`activeKlasId` plaintext zoals v1; generieke `store`-snapshot via `store.entries()`.
- `applyBackupRestore()`: store-keys alléén terug bij 'overschrijven' (+`store.save()`); 'samenvoegen' raakt store-keys niet aan; resultaat bevat `reloadRequired: true` ná v2-overschrijven-restore.
- Tests (8, allen groen): CRITICAL v1-regressietest (v1-payload zonder store-veld herstelt), v2-overschrijven zet store-keys terug, samenvoegen behoudt store-keys, bestaande round-trip/foutpad-tests.

### T2 — Reload-gedrag ImportPage ✅
- Nieuwe prop `reloadFn?: () => void` (default `window.location.reload`) — injecteerbaar voor tests.
- `reloadRequired` → reload, `onImportComplete` vervalt op dat pad; v1/samenvoegen-restore houdt bestaande UX; faalpad triggert niets.
- 3 componenttests groen (`tests/ImportPage.test.tsx`).

### T3 — factoryReset() ✅
- `utils/reset.ts`: `store.clear()` → `store.save()` → `localStorage.clear()` → injecteerbare reload. Geen in-memory mutaties (ADR-13a besluit 1).
- Faalpad: save-fout ⇒ `success: false`, localStorage en geheugen intact, geen reload.
- 3 tests groen: volgorde-assert, geen-mutatie-assert, faalpad-assert (`tests/reset.test.ts`).

## Testsuite

388 passed | 5 skipped na T4/DT1/DT2/T5 (was 372 na T3 — +16 nieuwe tests).
