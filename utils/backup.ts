// utils/backup.ts — fflate-gebaseerde backup aanmaak en herstel
// TypeScript (Phase 11, Plan 04) — directe TypeScript versie, geen .js tussenversie
//
// T-11-04-01 mitigatie: try-catch omhult de volledige parse en state update;
// ongeldige data geeft success:false terug zonder state te muteren.

import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { klassenState } from './klassen';

const BACKUP_FILENAME = 'mentordashboard-backup.json';

/**
 * Maak een gecomprimeerde backup van de huidige klassenState.
 * Retourneert een Uint8Array (ZIP bestand).
 */
export function buildBackupPayload(): Uint8Array {
  const payload = {
    version: 1,
    klassen: klassenState.klassen,
    activeKlasId: klassenState.activeKlasId,
    exportedAt: new Date().toISOString(),
  };
  const jsonString = JSON.stringify(payload);
  const zipped = zipSync({ [BACKUP_FILENAME]: strToU8(jsonString) });
  return zipped;
}

/**
 * Herstel klassenState vanuit een ZIP Uint8Array.
 *
 * @param zipData - Uint8Array van een eerder gebouwde backup
 * @param mode - 'overschrijven': vervang alle klassen; 'samenvoegen': voeg samen
 * @returns { success: boolean; message: string }
 */
export function applyBackupRestore(
  zipData: Uint8Array,
  mode: 'overschrijven' | 'samenvoegen'
): { success: boolean; message: string } {
  try {
    const extracted = unzipSync(zipData);
    const jsonString = strFromU8(extracted[BACKUP_FILENAME]);
    const payload: { version: number; klassen: Record<string, any>; activeKlasId: string | null } =
      JSON.parse(jsonString);

    if (mode === 'overschrijven') {
      klassenState.klassen = payload.klassen;
      klassenState.activeKlasId = payload.activeKlasId;
    } else {
      // samenvoegen: nieuwe klassen toevoegen, bestaande updaten
      Object.assign(klassenState.klassen, payload.klassen);
    }

    return { success: true, message: 'Backup hersteld' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Onbekende fout' };
  }
}
