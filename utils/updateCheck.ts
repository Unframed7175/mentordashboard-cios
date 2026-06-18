import { check, type Update } from '@tauri-apps/plugin-updater';

/**
 * Controleert op een nieuwere, geldig gesigneerde release via de Tauri-updater.
 * Geeft het Update-object terug, of null als er geen update beschikbaar is.
 * Gooit door bij een mislukte check (bv. geen internet, ongeldige signature) —
 * callers die de check stil moeten laten falen (zoals de opstart-check) vangen dit zelf af.
 */
export async function checkForUpdate(): Promise<Update | null> {
  return await check();
}
