// utils/backup.ts — fflate-gebaseerde backup aanmaak en herstel
// TypeScript (Phase 11, Plan 04) — directe TypeScript versie, geen .js tussenversie
//
// T-11-04-01 mitigatie: try-catch omhult de volledige parse en state update;
// ongeldige data geeft success:false terug zonder state te muteren.

import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { invoke } from '@tauri-apps/api/core';
import { LazyStore } from '@tauri-apps/plugin-store';
import { klassenState } from './klassen';
import { appState } from './datamodel';

const BACKUP_FILENAME = 'mentordashboard-backup.enc';
const BACKUP_FILENAME_LEGACY = 'mentordashboard-backup.json';

// Zelfde fysieke store als alle andere modules ('store.json', één bestand)
const store = new LazyStore('store.json', { defaults: {}, autoSave: false });

// Keys die nooit uit een (mogelijk gemanipuleerd) backup-bestand mogen worden
// overgenomen: ze kunnen via Object.assign / index-toewijzing de prototype-chain
// van het doelobject vergiftigen (prototype pollution). JSON.parse levert deze als
// gewone own-keys op, dus Object.entries bevat ze — daarom expliciet filteren.
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Own enumerable entries van een object, met prototype-pollution keys eruit gefilterd. */
function safeEntries<T>(obj: Record<string, T>): [string, T][] {
  return Object.entries(obj).filter(([key]) => !FORBIDDEN_KEYS.has(key));
}

/**
 * Maak een gecomprimeerde backup (payload v2): klassenState plaintext zoals v1,
 * plus een generieke snapshot van álle store-keys via store.entries() (ADR-13a).
 * Inhoud wordt versleuteld met AES-256-GCM (zelfde sleutel als klassen-store).
 * Retourneert een Uint8Array (ZIP bestand).
 */
export async function buildBackupPayload(): Promise<Uint8Array> {
  const payload = {
    version: 2,
    klassen: klassenState.klassen,
    activeKlasId: klassenState.activeKlasId,
    store: Object.fromEntries(await store.entries()),
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
 * Store-keys uit een v2-payload worden alléén teruggezet bij 'overschrijven';
 * 'samenvoegen' behoudt de huidige instellingen (ADR-13a). Na een geslaagde
 * v2-overschrijven-restore is een reload vereist (reloadRequired: true) zodat
 * alle modules hun store-cache opnieuw laden.
 *
 * @param zipData - Uint8Array van een eerder gebouwde backup
 * @param mode - 'overschrijven': vervang alle klassen; 'samenvoegen': voeg samen
 * @returns { success: boolean; message: string; reloadRequired?: boolean }
 */
export async function applyBackupRestore(
  zipData: Uint8Array,
  mode: 'overschrijven' | 'samenvoegen'
): Promise<{ success: boolean; message: string; reloadRequired?: boolean }> {
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
    const payload: {
      version: number;
      klassen: Record<string, any>;
      activeKlasId: string | null;
      store?: Record<string, unknown>;
    } = JSON.parse(jsonString);
    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.version !== 'number' ||
      typeof payload.klassen !== 'object' ||
      Array.isArray(payload.klassen)
    ) {
      return { success: false, message: 'Ongeldige backup structuur' };
    }

    let reloadRequired = false;

    if (mode === 'overschrijven') {
      // Object.fromEntries(safeEntries(...)) bouwt een schoon object zonder
      // prototype-pollution keys uit het backup-bestand.
      klassenState.klassen = Object.fromEntries(safeEntries(payload.klassen));
      klassenState.activeKlasId = payload.activeKlasId;
      // v2: vervang de volledige store door de snapshot (overschrijven = clean replace)
      if (payload.version >= 2 && payload.store && typeof payload.store === 'object') {
        await store.clear(); // verwijder stale keys die niet in de snapshot zitten
        for (const [key, value] of safeEntries(payload.store)) {
          await store.set(key, value);
        }
        await store.save(); // VERPLICHT: clear/set zijn alleen in-memory
        reloadRequired = true;
      }
    } else {
      // samenvoegen: nieuwe klassen toevoegen, bestaande updaten.
      // Per-key toewijzing met gefilterde keys i.p.v. Object.assign, zodat een
      // gemanipuleerd backup-bestand de prototype-chain niet kan vergiftigen.
      for (const [klasId, klas] of safeEntries(payload.klassen)) {
        klassenState.klassen[klasId] = klas;
      }
      // Also restore activeKlasId from the backup when the backup has one,
      // and that klas is present in the merged state.
      if (payload.activeKlasId && klassenState.klassen[payload.activeKlasId]) {
        klassenState.activeKlasId = payload.activeKlasId;
        // Re-establish the appState.students bridge so addStudent/mergeVerzuim
        // write to the correct array after a merge-restore.
        appState.students = klassenState.klassen[payload.activeKlasId].students;
      }
    }

    return { success: true, message: 'Backup hersteld', reloadRequired };
  } catch (err: any) {
    return { success: false, message: err.message || 'Onbekende fout' };
  }
}
