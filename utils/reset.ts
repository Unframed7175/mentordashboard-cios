// utils/reset.ts — fabrieksreset (M36, ADR-13 + ADR-13a)
//
// Volgorde bindend: store.clear() + store.save() → localStorage.clear() → reload.
// Muteert GEEN in-memory state (klassenState/appState): geheugen legen vóór een
// mogelijk falende save creëert een dataverlies-pad (lege state zou bij de
// volgende saveKlassen() gepersisteerd worden). Het faalpad laat daarom
// geheugen én schijf intact: geen localStorage.clear, geen reload.
//
// De keychain-sleutel (nl.cios.mentordashboard.key) blijft bewust staan —
// anders is de pre-reset back-up onleesbaar (ADR-13).

import { LazyStore } from '@tauri-apps/plugin-store';

// Zelfde fysieke store als alle andere modules ('store.json', één bestand)
const store = new LazyStore('store.json', { defaults: {}, autoSave: false });

/**
 * Wis alle gegevens van deze machine en herstart de app in de onboarding-wizard.
 *
 * @param reloadFn - injecteerbare reload; default echte page reload
 * @returns success: false als het wissen van de store mislukt — in dat geval is
 *          er niets gewist (schijf intact, localStorage intact, geen reload)
 */
export async function factoryReset(
  reloadFn: () => void = () => window.location.reload()
): Promise<{ success: boolean; message: string }> {
  try {
    await store.clear();
    await store.save(); // VERPLICHT: clear() is alleen in-memory
  } catch (err: any) {
    return {
      success: false,
      message: `Wissen mislukt: ${err?.message || 'onbekende fout'} — er is niets gewijzigd`,
    };
  }
  localStorage.clear(); // legacy keys uit de pre-plugin-store periode
  reloadFn(); // app start opnieuw in de onboarding-wizard
  return { success: true, message: 'Alle gegevens gewist' };
}
