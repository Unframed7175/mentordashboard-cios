// tests/normenVoorVestiging.test.ts — RED test scaffold for M42 T7
// Per-vestiging doorstroomnorm profiles (Roosendaal / Goes / Dordrecht).
// New, additive companion to utils/normen.ts's existing (unchanged) Normen pattern.
// Plugin-store mock follows the vi.hoisted + LazyStore ES6 class pattern
// from tests/normen.test.ts, extended with async delete() for parity.

import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.hoisted() runs before vi.mock() — exposes shared store map without TDZ errors
const { getStoreMap, setStoreMap } = vi.hoisted(() => {
  let _map = new Map<string, unknown>();
  return {
    getStoreMap: () => _map,
    setStoreMap: (m: Map<string, unknown>) => { _map = m; },
  };
});

vi.mock('@tauri-apps/plugin-store', () => {
  class LazyStore {
    async get<T>(key: string): Promise<T | null> {
      return (getStoreMap().get(key) as T) ?? null;
    }
    async set(key: string, value: unknown): Promise<void> {
      getStoreMap().set(key, value);
    }
    async save(): Promise<void> {}
    async delete(key: string): Promise<void> {
      getStoreMap().delete(key);
    }
  }
  return { LazyStore };
});

// ── beforeEach: clear store map and invalidate module cache ──────────────────
beforeEach(() => {
  setStoreMap(new Map<string, unknown>());
  vi.resetModules();
});

const STORE_KEY = 'doorstroom_normen_per_vestiging';

describe('normenVoorVestiging utility (M42 T7)', () => {

  it('getNormenVoorVestigingSync returns correct DEFAULT_VESTIGING_NORMEN entry per vestiging on cold cache', async () => {
    const { getNormenVoorVestigingSync, DEFAULT_VESTIGING_NORMEN } = await import('../utils/normen');

    const roosendaal = getNormenVoorVestigingSync('roosendaal');
    const goes = getNormenVoorVestigingSync('goes');
    const dordrecht = getNormenVoorVestigingSync('dordrecht');

    expect(roosendaal).toEqual(DEFAULT_VESTIGING_NORMEN.roosendaal);
    expect(goes).toEqual(DEFAULT_VESTIGING_NORMEN.goes);
    expect(dordrecht).toEqual(DEFAULT_VESTIGING_NORMEN.dordrecht);

    // Roosendaal-only fields must be non-zero for roosendaal...
    expect(roosendaal.bj1NaarBj2RoosendaalLevelsMin).toBe(4);
    expect(roosendaal.bj1VersneldSbcRoosendaalLevelsMin).toBe(8);
    expect(roosendaal.bj2SblRoosendaalLevelsMin).toBe(2);
    expect(roosendaal.bj2SbcRoosendaalLevelsMin).toBe(3);
    expect(roosendaal.bj2RoosendaalSblKeuzeLevelsMin).toBe(2);

    // ...and exactly 0 (geen eis) for goes and dordrecht
    for (const profiel of [goes, dordrecht]) {
      expect(profiel.bj1NaarBj2RoosendaalLevelsMin).toBe(0);
      expect(profiel.bj1VersneldSbcRoosendaalLevelsMin).toBe(0);
      expect(profiel.bj2SblRoosendaalLevelsMin).toBe(0);
      expect(profiel.bj2SbcRoosendaalLevelsMin).toBe(0);
      expect(profiel.bj2RoosendaalSblKeuzeLevelsMin).toBe(0);
    }

    // Shared defaults (identical across all 3)
    for (const profiel of [roosendaal, goes, dordrecht]) {
      expect(profiel.bj1NaarBj2DeelgebiedenVoldoendeMin).toBe(9);
      expect(profiel.bj1NaarBj2ProfHoudingBvbMin).toBe(3);
      expect(profiel.bj1NaarBj2RekenDomeinenMin).toBe(3);
      expect(profiel.bj1VersneldSbcLesgevenOrganiserenGoedMin).toBe(5);
      expect(profiel.bj1VersneldSbcProfHandelenGoedMin).toBe(3);
      expect(profiel.bj1VersneldSbcProfHoudingBvbMin).toBe(3);
      expect(profiel.bj1VersneldSbcRekenDomeinenMin).toBe(3);
      expect(profiel.bj1NegatiefDeelgebiedenOnvoldoendeMin).toBe(4);
      expect(profiel.bj1NegatiefOnbeoordeeldMax).toBe(4);
      expect(profiel.bj2SblDeelgebiedenVoldoendeMin).toBe(7);
      expect(profiel.bj2SblRekenDomeinenMin).toBe(5);
      expect(profiel.bj2SbcDeelgebiedenVoldoendeMin).toBe(10);
      expect(profiel.bj2SbcRekenDomeinenMin).toBe(5);
      expect(profiel.bj2RoosendaalSblKeuzeDeelgebiedenVoldoendeMin).toBe(7);
      expect(profiel.bj2RoosendaalSblKeuzeRekenDomeinenMin).toBe(5);
    }
  });

  it('loadNormenVoorVestiging round-trip: saving one vestiging leaves the others unaffected', async () => {
    const { loadNormenVoorVestiging, saveNormenVoorVestiging, DEFAULT_VESTIGING_NORMEN } = await import('../utils/normen');

    // Seed siblings with CUSTOM (non-default) values first, so a read-modify-write
    // regression that clobbers the whole store record on save is actually caught below.
    const roosendaalCustom = { ...DEFAULT_VESTIGING_NORMEN.roosendaal, bj1NaarBj2DeelgebiedenVoldoendeMin: 99 };
    const dordrechtCustom = { ...DEFAULT_VESTIGING_NORMEN.dordrecht, bj1NaarBj2DeelgebiedenVoldoendeMin: 99 };
    await saveNormenVoorVestiging('roosendaal', roosendaalCustom);
    await saveNormenVoorVestiging('dordrecht', dordrechtCustom);

    const gewijzigd = { ...DEFAULT_VESTIGING_NORMEN.goes, bj1NaarBj2DeelgebiedenVoldoendeMin: 11 };
    await saveNormenVoorVestiging('goes', gewijzigd);

    // Invalidate module cache but retain store map
    vi.resetModules();
    const { loadNormenVoorVestiging: load2 } = await import('../utils/normen');

    const goesResult = await load2('goes');
    expect(goesResult.bj1NaarBj2DeelgebiedenVoldoendeMin).toBe(11);

    // Sibling vestigingen must retain their earlier CUSTOM values, not fall back to
    // defaults — a clobbering read-modify-write bug would wipe them to defaults here,
    // which is indistinguishable from "untouched" if the siblings were never seeded.
    const roosendaalResult = await load2('roosendaal');
    const dordrechtResult = await load2('dordrecht');
    expect(roosendaalResult).toEqual(roosendaalCustom);
    expect(dordrechtResult).toEqual(dordrechtCustom);
    expect(roosendaalResult.bj1NaarBj2DeelgebiedenVoldoendeMin).toBe(99);
    expect(dordrechtResult.bj1NaarBj2DeelgebiedenVoldoendeMin).toBe(99);
  });

  it('loadNormenVoorVestiging falls back per-field to defaults on invalid values, keeping other valid fields', async () => {
    const { loadNormenVoorVestiging, DEFAULT_VESTIGING_NORMEN } = await import('../utils/normen');

    // Seed the store directly with a partially-invalid stored profile for 'dordrecht'
    getStoreMap().set(STORE_KEY, {
      dordrecht: {
        ...DEFAULT_VESTIGING_NORMEN.dordrecht,
        bj1NaarBj2DeelgebiedenVoldoendeMin: NaN, // invalid -> should fall back to default
        bj1NaarBj2RekenDomeinenMin: -1, // invalid (negative) -> should fall back to default
        bj2SblDeelgebiedenVoldoendeMin: 8, // valid, distinct from default (7) -> should be kept
      },
    });

    const result = await loadNormenVoorVestiging('dordrecht');

    expect(result.bj1NaarBj2DeelgebiedenVoldoendeMin).toBe(DEFAULT_VESTIGING_NORMEN.dordrecht.bj1NaarBj2DeelgebiedenVoldoendeMin);
    expect(result.bj1NaarBj2RekenDomeinenMin).toBe(DEFAULT_VESTIGING_NORMEN.dordrecht.bj1NaarBj2RekenDomeinenMin);
    expect(result.bj2SblDeelgebiedenVoldoendeMin).toBe(8);
  });

  it('saveNormenVoorVestiging persists via store.set()+store.save() under doorstroom_normen_per_vestiging', async () => {
    const setSpy = vi.fn();
    const saveSpy = vi.fn();

    vi.resetModules();
    vi.doMock('@tauri-apps/plugin-store', () => {
      class LazyStore {
        async get<T>(key: string): Promise<T | null> {
          return (getStoreMap().get(key) as T) ?? null;
        }
        async set(key: string, value: unknown): Promise<void> {
          setSpy(key, value);
          getStoreMap().set(key, value);
        }
        async save(): Promise<void> {
          saveSpy();
        }
        async delete(key: string): Promise<void> {
          getStoreMap().delete(key);
        }
      }
      return { LazyStore };
    });

    const { saveNormenVoorVestiging, DEFAULT_VESTIGING_NORMEN } = await import('../utils/normen');

    await saveNormenVoorVestiging('roosendaal', { ...DEFAULT_VESTIGING_NORMEN.roosendaal });

    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy.mock.calls[0][0]).toBe(STORE_KEY);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('resetNormenVoorVestiging resets only the given vestiging to defaults', async () => {
    const { saveNormenVoorVestiging, resetNormenVoorVestiging, getNormenVoorVestigingSync, DEFAULT_VESTIGING_NORMEN } = await import('../utils/normen');

    await saveNormenVoorVestiging('dordrecht', { ...DEFAULT_VESTIGING_NORMEN.dordrecht, bj2SbcRekenDomeinenMin: 9 });
    await saveNormenVoorVestiging('goes', { ...DEFAULT_VESTIGING_NORMEN.goes, bj2SbcRekenDomeinenMin: 9 });

    const returned = await resetNormenVoorVestiging('dordrecht');
    const synced = getNormenVoorVestigingSync('dordrecht');
    const goesStillModified = getNormenVoorVestigingSync('goes');

    expect(returned).toEqual(DEFAULT_VESTIGING_NORMEN.dordrecht);
    expect(synced).toEqual(DEFAULT_VESTIGING_NORMEN.dordrecht);
    expect(goesStillModified.bj2SbcRekenDomeinenMin).toBe(9);
  });

  // M42 review-fix (red-team finding): two overlapping saves for the SAME vestiging
  // (e.g. an admin tabbing through several fields, each onBlur firing its own async
  // save) must not let an earlier call's slow read-modify-write complete AFTER a
  // later call's, because the earlier call's write payload was captured before the
  // later edit happened and would silently regress it. Proves the fix by stalling
  // the FIRST save's store.get() and firing the SECOND save concurrently (not
  // awaited) — with serialization, the second call's own get() must not even START
  // until the first call's entire read-modify-write has finished, so it always ends
  // up reading the store WITH the first save's change already applied.
  it('two overlapping saves for the same vestiging serialize instead of racing — the later edit is never lost', async () => {
    let releaseFirstGet: (() => void) | null = null;
    const firstGetGate = new Promise<void>((resolve) => { releaseFirstGet = resolve; });
    const getCallOrder: number[] = [];
    let getCallCount = 0;

    vi.resetModules();
    vi.doMock('@tauri-apps/plugin-store', () => {
      class LazyStore {
        async get<T>(key: string): Promise<T | null> {
          const callNum = ++getCallCount;
          getCallOrder.push(callNum);
          if (callNum === 1) {
            // Stall the FIRST save's read — if the queue is broken (calls run
            // concurrently instead of FIFO), the SECOND save's get()/set()/save()
            // would complete while this is still pending.
            await firstGetGate;
          }
          return (getStoreMap().get(key) as T) ?? null;
        }
        async set(key: string, value: unknown): Promise<void> {
          getStoreMap().set(key, value);
        }
        async save(): Promise<void> {}
        async delete(key: string): Promise<void> {
          getStoreMap().delete(key);
        }
      }
      return { LazyStore };
    });

    const { saveNormenVoorVestiging, DEFAULT_VESTIGING_NORMEN } = await import('../utils/normen');

    // Save A: only fieldA changed (captured before B's edit happened, exactly like
    // a real onBlur handler's closure over React state at the moment it fired).
    const afterA = { ...DEFAULT_VESTIGING_NORMEN.roosendaal, bj1NaarBj2DeelgebiedenVoldoendeMin: 11 };
    const saveAPromise = saveNormenVoorVestiging('roosendaal', afterA);

    // Fire save B immediately after, WITHOUT awaiting A — this is the overlap.
    // B's payload is a superset including A's change, exactly as the real
    // component always sends (each save reads current React state, which
    // already reflects every prior edit in the session).
    const afterB = { ...afterA, bj2SblDeelgebiedenVoldoendeMin: 12 };
    const saveBPromise = saveNormenVoorVestiging('roosendaal', afterB);

    // Give B every opportunity to run ahead of A if the queue were broken.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    // B's get() must NOT have run yet — it should still be queued behind A's
    // stalled read. This is the actual serialization proof, not just the final
    // stored value (which a lucky ordering could get right by accident).
    expect(getCallCount).toBe(1);

    releaseFirstGet!();
    await Promise.all([saveAPromise, saveBPromise]);

    expect(getCallOrder).toEqual([1, 2]); // strictly FIFO, never interleaved
    const stored = getStoreMap().get(STORE_KEY) as Record<string, any>;
    expect(stored.roosendaal.bj1NaarBj2DeelgebiedenVoldoendeMin).toBe(11);
    expect(stored.roosendaal.bj2SblDeelgebiedenVoldoendeMin).toBe(12);
  });

});

describe('old Normen (doorstroom_normen) unaffected by new per-vestiging store key', () => {
  it('the old doorstroom_normen key stays independent of doorstroom_normen_per_vestiging', async () => {
    const { loadNormen, saveNormenVoorVestiging, DEFAULT_NORMEN, DEFAULT_VESTIGING_NORMEN } = await import('../utils/normen');

    await saveNormenVoorVestiging('roosendaal', { ...DEFAULT_VESTIGING_NORMEN.roosendaal, bj1NaarBj2DeelgebiedenVoldoendeMin: 99 });

    const oldNormen = await loadNormen();
    expect(oldNormen).toEqual(DEFAULT_NORMEN);
    expect(getStoreMap().has('doorstroom_normen')).toBe(false);
    expect(getStoreMap().has(STORE_KEY)).toBe(true);
  });
});
