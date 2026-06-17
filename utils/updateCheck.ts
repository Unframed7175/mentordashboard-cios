import { check, type Update } from '@tauri-apps/plugin-updater';

/**
 * Controleert op een nieuwere, geldig gesigneerde release via de Tauri-updater.
 * Geeft null terug bij geen update of bij een fout (bv. geen internet) —
 * faalt altijd stil zodat een mislukte check de opstart van de app niet verstoort.
 */
export async function checkForUpdate(): Promise<Update | null> {
  try {
    return await check();
  } catch {
    return null;
  }
}
