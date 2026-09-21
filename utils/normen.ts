// utils/normen.ts — Doorstroomnorm drempelwaarden persistence (Phase 25, NORM-06/07)
// Provides: loadNormen, getNormenSync, saveNormen, resetNormen,
//           Normen, DEFAULT_NORMEN
//
// Depends on:
//   @tauri-apps/plugin-store — LazyStore
//
// Follows the LazyStore + object-shape pattern from utils/verzuimDrempels.ts (Phase 18).
// Config stored as plain object (not JSON-stringified) under key 'doorstroom_normen' in store.json.
// Validation uses Number.isFinite() + per-field min/max range enforcement (T-25-03, T-25-08).

import { LazyStore } from '@tauri-apps/plugin-store';
import type { Vestiging } from './klassen';

const store = new LazyStore('store.json', { defaults: {}, autoSave: false });
const STORE_KEY = 'doorstroom_normen';
let _cache: Normen | null = null; // null = unloaded

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Normen {
  sbl: number;                       // default 13; min=1, max=19
  sbc: number;                       // default 15; min=1, max=19
  negatiefTotaal: number;            // default 6;  min=1, max=19
  negatiefPerLeerlijn: number;       // default 2;  min=1, max=6
  bj1Positief: number;               // default 13; min=1, max=19
  versneldLesgeven: number;          // default 4;  min=1, max=6
  versneldOrganiseren: number;       // default 3;  min=1, max=6
  versneldProfHandelen: number;      // default 5;  min=1, max=6
  negatiefOnbeoordeeldBJ1: number;   // default 4;  min=0, max=50
}

export const DEFAULT_NORMEN: Normen = {
  sbl: 13,
  sbc: 15,
  negatiefTotaal: 6,
  negatiefPerLeerlijn: 2,
  bj1Positief: 13,
  versneldLesgeven: 4,
  versneldOrganiseren: 3,
  versneldProfHandelen: 5,
  negatiefOnbeoordeeldBJ1: 4,
};

// ── getNormenSync() ────────────────────────────────────────────────────────────

/**
 * Synchronous cache accessor.
 * Returns cached normen if present, otherwise DEFAULT_NORMEN.
 * Use in berekenPrognose() and other sync call sites instead of the async version.
 * Pre-warm by calling loadNormen() at app startup.
 */
export function getNormenSync(): Normen {
  return _cache ?? DEFAULT_NORMEN;
}

// ── loadNormen() ───────────────────────────────────────────────────────────────

/**
 * Returns current doorstroomnorm drempelwaarden.
 * Reads from plugin-store; validates all 8 fields with Number.isFinite() AND per-field
 * min/max range enforcement. Falls back to DEFAULT_NORMEN on any validation failure.
 * Result is cached until save.
 */
export async function loadNormen(): Promise<Normen> {
  if (_cache !== null) return _cache;
  try {
    const raw = await store.get<Normen>(STORE_KEY);
    if (raw) {
      // Per-field validation helper: Number.isFinite(undefined) === false handles missing
      // fields from older store schemas, so schema evolution (new fields added later) is safe.
      const isValid = (v: unknown, min: number, max: number): v is number =>
        Number.isFinite(v as number) && (v as number) >= min && (v as number) <= max;

      // Per-field clamping: each invalid field falls back to its DEFAULT_NORMEN value
      // individually, so one bad field does not reset all normen to defaults (T-25-03, T-25-08).
      const validated: Normen = {
        // Number.isFinite(undefined) === false — safe for missing fields from older schemas
        sbl:                 isValid(raw.sbl, 1, 19)                 ? raw.sbl                 : DEFAULT_NORMEN.sbl,
        // Number.isFinite(undefined) === false — safe for missing fields from older schemas
        sbc:                 isValid(raw.sbc, 1, 19)                 ? raw.sbc                 : DEFAULT_NORMEN.sbc,
        // Number.isFinite(undefined) === false — safe for missing fields from older schemas
        negatiefTotaal:      isValid(raw.negatiefTotaal, 1, 19)      ? raw.negatiefTotaal      : DEFAULT_NORMEN.negatiefTotaal,
        // Number.isFinite(undefined) === false — safe for missing fields from older schemas
        negatiefPerLeerlijn: isValid(raw.negatiefPerLeerlijn, 1, 6)  ? raw.negatiefPerLeerlijn : DEFAULT_NORMEN.negatiefPerLeerlijn,
        // Number.isFinite(undefined) === false — safe for missing fields from older schemas
        bj1Positief:         isValid(raw.bj1Positief, 1, 19)         ? raw.bj1Positief         : DEFAULT_NORMEN.bj1Positief,
        // Number.isFinite(undefined) === false — safe for missing fields from older schemas
        versneldLesgeven:    isValid(raw.versneldLesgeven, 1, 6)     ? raw.versneldLesgeven    : DEFAULT_NORMEN.versneldLesgeven,
        // Number.isFinite(undefined) === false — safe for missing fields from older schemas
        versneldOrganiseren: isValid(raw.versneldOrganiseren, 1, 6)  ? raw.versneldOrganiseren : DEFAULT_NORMEN.versneldOrganiseren,
        // Number.isFinite(undefined) === false — safe for missing fields from older schemas
        versneldProfHandelen:    isValid(raw.versneldProfHandelen, 1, 6)     ? raw.versneldProfHandelen    : DEFAULT_NORMEN.versneldProfHandelen,
        negatiefOnbeoordeeldBJ1: isValid(raw.negatiefOnbeoordeeldBJ1, 0, 50) ? raw.negatiefOnbeoordeeldBJ1 : DEFAULT_NORMEN.negatiefOnbeoordeeldBJ1,
      };
      _cache = validated;
      return _cache;
    }
  } catch (e: any) {
    console.warn('[normen.ts] read error:', e);
  }
  _cache = { ...DEFAULT_NORMEN };
  return _cache;
}

// ── saveNormen() ───────────────────────────────────────────────────────────────

/**
 * Persists normen to plugin-store.
 * CRITICAL: updates _cache FIRST (instant-apply, pitfall 5), then persists async.
 * CRITICAL: store.set() + store.save() must both be awaited (Phase 12 pitfall).
 * Returns true on success, false on error. Failure is logged via console.error (T-25-07).
 */
export async function saveNormen(normen: Normen): Promise<boolean> {
  _cache = normen; // instant-apply: update cache before async write (pitfall 5)
  try {
    await store.set(STORE_KEY, normen); // pass object directly (settings.ts pattern, no JSON.stringify)
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.error('[normen.ts] saveNormen failed — settings not persisted');
    return false;
  }
}

// ── resetNormen() ──────────────────────────────────────────────────────────────

/**
 * Resets normen to DEFAULT_NORMEN and persists the reset.
 * Returns DEFAULT_NORMEN after persisting.
 */
export async function resetNormen(): Promise<Normen> {
  await saveNormen({ ...DEFAULT_NORMEN });
  return DEFAULT_NORMEN;
}

// ── VestigingNormen — per-vestiging doorstroomnorm profiel (M42 T7) ────────────
// Additive, parallel companion to Normen above. Does NOT replace or touch
// Normen/DEFAULT_NORMEN/getNormenSync/loadNormen/saveNormen/resetNormen —
// those stay on the old 19-deelgebieden schema, unchanged, this milestone.
// Values transcribed verbatim from "26-27 Doorstroomnormeringen N3N4.pdf"
// (pages 3-4) by the controller — see task-T7-brief.md for provenance.
//
// Stored under a NEW store key (doorstroom_normen_per_vestiging), as a single
// Record<Vestiging, VestigingNormen> — all three vestigingen share one key,
// not three separate keys. saveNormenVoorVestiging() does a read-modify-write
// so saving one vestiging never clobbers the other two.

const VESTIGING_STORE_KEY = 'doorstroom_normen_per_vestiging';
let _vestigingCache: Partial<Record<Vestiging, VestigingNormen>> = {}; // per-vestiging slot, empty = unloaded

export interface VestigingNormen {
  // BJ1 — positief studieadvies naar basisjaar 2 ("naar_bj2")
  bj1NaarBj2DeelgebiedenVoldoendeMin: number;        // aantal deelgebieden dat 'voldoende of hoger' moet zijn
  bj1NaarBj2ProfHoudingBvbMin: number;               // aantal (van de 4) Betekenisvol-Bewegen-beoordelingen 'voldoende of hoger'
  bj1NaarBj2RekenDomeinenMin: number;                // aantal eindtoets-domeinen Rekenen afgerond
  bj1NaarBj2RoosendaalLevelsMin: number;             // 0 = geen eis (Goes/Dordrecht); Roosendaal: zie default hieronder

  // BJ1 — positief studieadvies, versneld traject SBC ("versneld_sbc")
  bj1VersneldSbcLesgevenOrganiserenGoedMin: number;  // aantal deelgebieden leerlijn 'lesgeven_en_organiseren' met 'goed of hoger', fase 2
  bj1VersneldSbcProfHandelenGoedMin: number;         // aantal deelgebieden leerlijn 'professioneel_handelen' met 'goed of hoger', fase 2
  bj1VersneldSbcProfHoudingBvbMin: number;           // aantal (van de 4) Betekenisvol-Bewegen-beoordelingen 'voldoende of hoger'
  bj1VersneldSbcRekenDomeinenMin: number;            // aantal eindtoets-domeinen Rekenen afgerond
  bj1VersneldSbcRoosendaalLevelsMin: number;         // 0 = geen eis; Roosendaal: zie default

  // BJ1 — negatief bindend studieadvies
  bj1NegatiefDeelgebiedenOnvoldoendeMin: number;     // >= dit aantal 'onvoldoende'-deelgebieden -> negatief
  bj1NegatiefOnbeoordeeldMax: number;                // > dit aantal onbeoordeelde datapunten in fase 2 -> negatief

  // BJ2 generiek pad (T9a) — doorstroom naar Examineringsjaar SBL
  bj2SblDeelgebiedenVoldoendeMin: number;
  bj2SblRekenDomeinenMin: number;
  bj2SblRoosendaalLevelsMin: number;                 // 0 = geen eis; Roosendaal: "alle levels 2 behaald" -> zie default

  // BJ2 generiek pad (T9a) — doorstroom naar profieljaar SBC
  bj2SbcDeelgebiedenVoldoendeMin: number;
  bj2SbcRekenDomeinenMin: number;
  bj2SbcRoosendaalLevelsMin: number;                 // 0 = geen eis; Roosendaal: "alle levels 3 behaald" -> zie default

  // BJ2 — Roosendaal-eigen vroegtijdige SBL-keuzeproces (T9c), AFWIJKEND van
  // bj2Sbl* hierboven: eigen, kleinere eisenset, fase 3 i.p.v. fase 2/heel-jaar
  bj2RoosendaalSblKeuzeDeelgebiedenVoldoendeMin: number;
  bj2RoosendaalSblKeuzeRekenDomeinenMin: number;
  bj2RoosendaalSblKeuzeLevelsMin: number;
}

const DEFAULT_VESTIGING_NORMEN_SHARED = {
  bj1NaarBj2DeelgebiedenVoldoendeMin: 9,
  bj1NaarBj2ProfHoudingBvbMin: 3,
  bj1NaarBj2RekenDomeinenMin: 3,
  bj1VersneldSbcLesgevenOrganiserenGoedMin: 5,
  bj1VersneldSbcProfHandelenGoedMin: 3,
  bj1VersneldSbcProfHoudingBvbMin: 3,
  bj1VersneldSbcRekenDomeinenMin: 3,
  bj1NegatiefDeelgebiedenOnvoldoendeMin: 4,
  bj1NegatiefOnbeoordeeldMax: 4,
  bj2SblDeelgebiedenVoldoendeMin: 7,
  bj2SblRekenDomeinenMin: 5,
  bj2SbcDeelgebiedenVoldoendeMin: 10,
  bj2SbcRekenDomeinenMin: 5,
  bj2RoosendaalSblKeuzeDeelgebiedenVoldoendeMin: 7,
  bj2RoosendaalSblKeuzeRekenDomeinenMin: 5,
} as const;

export const DEFAULT_VESTIGING_NORMEN: Record<Vestiging, VestigingNormen> = {
  roosendaal: {
    ...DEFAULT_VESTIGING_NORMEN_SHARED,
    bj1NaarBj2RoosendaalLevelsMin: 4,
    bj1VersneldSbcRoosendaalLevelsMin: 8,
    bj2SblRoosendaalLevelsMin: 2,
    bj2SbcRoosendaalLevelsMin: 3,
    bj2RoosendaalSblKeuzeLevelsMin: 2,
  },
  goes: {
    ...DEFAULT_VESTIGING_NORMEN_SHARED,
    bj1NaarBj2RoosendaalLevelsMin: 0,
    bj1VersneldSbcRoosendaalLevelsMin: 0,
    bj2SblRoosendaalLevelsMin: 0,
    bj2SbcRoosendaalLevelsMin: 0,
    bj2RoosendaalSblKeuzeLevelsMin: 0,
  },
  dordrecht: {
    ...DEFAULT_VESTIGING_NORMEN_SHARED,
    bj1NaarBj2RoosendaalLevelsMin: 0,
    bj1VersneldSbcRoosendaalLevelsMin: 0,
    bj2SblRoosendaalLevelsMin: 0,
    bj2SbcRoosendaalLevelsMin: 0,
    bj2RoosendaalSblKeuzeLevelsMin: 0,
  },
};

// ── getNormenVoorVestigingSync(vestiging) ───────────────────────────────────────

/**
 * Synchronous cache accessor for one vestiging's profiel.
 * Returns the cached profiel if present, otherwise DEFAULT_VESTIGING_NORMEN[vestiging].
 * Mirrors getNormenSync() above — use in sync call sites; pre-warm with
 * loadNormenVoorVestiging() (not wired at startup yet, that's Lane D/T11's concern).
 */
export function getNormenVoorVestigingSync(vestiging: Vestiging): VestigingNormen {
  return _vestigingCache[vestiging] ?? DEFAULT_VESTIGING_NORMEN[vestiging];
}

// ── loadNormenVoorVestiging(vestiging) ──────────────────────────────────────────

const VESTIGING_NORMEN_FIELDS = Object.keys(DEFAULT_VESTIGING_NORMEN_SHARED).concat([
  'bj1NaarBj2RoosendaalLevelsMin',
  'bj1VersneldSbcRoosendaalLevelsMin',
  'bj2SblRoosendaalLevelsMin',
  'bj2SbcRoosendaalLevelsMin',
  'bj2RoosendaalSblKeuzeLevelsMin',
]) as (keyof VestigingNormen)[];

/**
 * Returns the current VestigingNormen profiel for one vestiging.
 * Reads the FULL Record<Vestiging, VestigingNormen> from the plugin-store under
 * VESTIGING_STORE_KEY (all three vestigingen live under one store key), picks
 * out the requested vestiging's entry, and validates every field with
 * Number.isFinite() (open-ended counts, no min/max range — unlike the old
 * Normen schema's bounded 1-19 deelgebieden-index). Falls back per-field to
 * DEFAULT_VESTIGING_NORMEN[vestiging] so one bad field doesn't reset the whole
 * profiel (same philosophy as loadNormen above). Result is cached per-vestiging.
 */
export async function loadNormenVoorVestiging(vestiging: Vestiging): Promise<VestigingNormen> {
  if (_vestigingCache[vestiging] !== undefined) return _vestigingCache[vestiging]!;

  const defaults = DEFAULT_VESTIGING_NORMEN[vestiging];
  try {
    const raw = await store.get<Record<Vestiging, VestigingNormen>>(VESTIGING_STORE_KEY);
    const rawProfiel = raw?.[vestiging];
    if (rawProfiel) {
      const isValid = (v: unknown): v is number => Number.isFinite(v as number) && (v as number) >= 0;

      const validated = { ...defaults };
      const rawRecord = rawProfiel as unknown as Record<string, unknown>;
      for (const field of VESTIGING_NORMEN_FIELDS) {
        const value = rawRecord[field];
        if (isValid(value)) {
          (validated as Record<string, number>)[field] = value;
        }
      }
      _vestigingCache[vestiging] = validated;
      return validated;
    }
  } catch (e: any) {
    console.warn('[normen.ts] loadNormenVoorVestiging read error:', e);
  }
  _vestigingCache[vestiging] = { ...defaults };
  return _vestigingCache[vestiging]!;
}

// ── saveNormenVoorVestiging(vestiging, normen) ──────────────────────────────────

/**
 * Persists one vestiging's VestigingNormen profiel to plugin-store.
 * CRITICAL: updates _vestigingCache FIRST (instant-apply, pitfall 5), then
 * persists async via a read-modify-write of the FULL Record<Vestiging,
 * VestigingNormen> under VESTIGING_STORE_KEY — the other two vestigingen's
 * stored profiles are read from the store and carried through unchanged, so
 * saving one vestiging never clobbers its siblings.
 * CRITICAL: store.set() + store.save() must both be awaited (Phase 12 pitfall).
 * Returns true on success, false on error.
 */
export async function saveNormenVoorVestiging(vestiging: Vestiging, normen: VestigingNormen): Promise<boolean> {
  _vestigingCache[vestiging] = normen; // instant-apply: update cache before async write (pitfall 5)
  try {
    const existing = (await store.get<Record<Vestiging, VestigingNormen>>(VESTIGING_STORE_KEY)) ?? ({} as Record<Vestiging, VestigingNormen>);
    const updated: Record<Vestiging, VestigingNormen> = { ...existing, [vestiging]: normen };
    await store.set(VESTIGING_STORE_KEY, updated);
    await store.save(); // VERPLICHT: set() is alleen in-memory
    return true;
  } catch (e: any) {
    console.error('[normen.ts] saveNormenVoorVestiging failed — settings not persisted');
    return false;
  }
}

// ── resetNormenVoorVestiging(vestiging) ─────────────────────────────────────────

/**
 * Resets one vestiging's profiel to DEFAULT_VESTIGING_NORMEN[vestiging] and
 * persists the reset (other vestigingen untouched, see saveNormenVoorVestiging).
 * Returns the default profiel after persisting.
 */
export async function resetNormenVoorVestiging(vestiging: Vestiging): Promise<VestigingNormen> {
  const defaults = { ...DEFAULT_VESTIGING_NORMEN[vestiging] };
  await saveNormenVoorVestiging(vestiging, defaults);
  return defaults;
}

console.log('[normen.ts] Doorstroomnorm drempelwaarden persistence geladen');
