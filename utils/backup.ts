// utils/backup.ts — fflate-gebaseerde backup aanmaak en herstel
// TypeScript (Phase 11, Plan 04) — directe TypeScript versie, geen .js tussenversie
//
// T-11-04-01 mitigatie: try-catch omhult de volledige parse en state update;
// ongeldige data geeft success:false terug zonder state te muteren.

import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { invoke } from '@tauri-apps/api/core';
import { klassenState } from './klassen';
import { appState } from './datamodel';

const BACKUP_FILENAME = 'mentordashboard-backup.enc';
const BACKUP_FILENAME_LEGACY = 'mentordashboard-backup.json';

/**
 * Maak een gecomprimeerde backup van de huidige klassenState.
 * Inhoud wordt versleuteld met AES-256-GCM (zelfde sleutel als klassen-store).
 * Retourneert een Uint8Array (ZIP bestand).
 */
export async function buildBackupPayload(): Promise<Uint8Array> {
  const payload = {
    version: 1,
    klassen: klassenState.klassen,
    activeKlasId: klassenState.activeKlasId,
    exportedAt: new Date().toISOString(),
  };
  const jsonString = JSON.stringify(payload);
  const ciphertext = await invoke<string>('encrypt_klassen', { plaintext: jsonString });
  const zipped = zipSync({ [BACKUP_FILENAME]: strToU8(ciphertext) });
  return zipped;
}

/**
 * Herstel klassenState vanuit een ZIP Uint8Array.
 *
 * @param zipData - Uint8Array van een eerder gebouwde backup
 * @param mode - 'overschrijven': vervang alle klassen; 'samenvoegen': voeg samen
 * @returns { success: boolean; message: string }
 */
export async function applyBackupRestore(
  zipData: Uint8Array,
  mode: 'overschrijven' | 'samenvoegen'
): Promise<{ success: boolean; message: string }> {
  try {
    const extracted = unzipSync(zipData);
    const backupEntry = extracted[BACKUP_FILENAME] ?? extracted[BACKUP_FILENAME_LEGACY];
    if (!backupEntry) {
      return { success: false, message: `Backup bestand ontbreekt in ZIP` };
    }
    const raw = strFromU8(backupEntry);
    let jsonString: string;
    try {
      // New format: AES-256-GCM encrypted content
      jsonString = await invoke<string>('decrypt_klassen', { ciphertext: raw });
    } catch {
      // Legacy backup: plaintext JSON — accept for backwards compatibility
      jsonString = raw;
    }
    const payload: { version: number; klassen: Record<string, any>; activeKlasId: string | null } =
      JSON.parse(jsonString);
    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.version !== 'number' ||
      typeof payload.klassen !== 'object' ||
      Array.isArray(payload.klassen)
    ) {
      return { success: false, message: 'Ongeldige backup structuur' };
    }

    if (mode === 'overschrijven') {
      klassenState.klassen = payload.klassen;
      klassenState.activeKlasId = payload.activeKlasId;
    } else {
      // samenvoegen: nieuwe klassen toevoegen, bestaande updaten
      Object.assign(klassenState.klassen, payload.klassen);
      // Also restore activeKlasId from the backup when the backup has one,
      // and that klas is present in the merged state.
      if (payload.activeKlasId && klassenState.klassen[payload.activeKlasId]) {
        klassenState.activeKlasId = payload.activeKlasId;
        // Re-establish the appState.students bridge so addStudent/mergeVerzuim
        // write to the correct array after a merge-restore.
        appState.students = klassenState.klassen[payload.activeKlasId].students;
      }
    }

    return { success: true, message: 'Backup hersteld' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Onbekende fout' };
  }
}
