// tests/SettingsPage.test.tsx — Vitest coverage for SET-01 + SET-02 + SET-03 + SET-04
// Phase 17 Plan 02 — settings store helpers + SettingsPage component tests
// Phase 18 Plan 04 — section 3 deelgebieden table (SET-03 + SET-04)
// Must be in tests/ (NOT src/) so vitest.config.ts include pattern discovers it.
// LazyStore mocked as ES6 class (STATE.md mandate — not vi.fn())

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// vi.hoisted() runs before vi.mock() — use it to expose shared state without TDZ errors.
// This provides both the LazyStore map AND the section 3 utility mocks.
const {
  getStoreMap,
  setStoreMap,
  mockGetDeelgebiedenConfig,
  mockSaveDeelgebiedenConfig,
  mockResetDeelgebiedenConfig,
  mockGetLeerlijnenMapping,
  mockSaveLeerlijnenMapping,
  mockResetLeerlijnenMapping,
  mockLoadNormenVoorVestiging,
  mockSaveNormenVoorVestiging,
  mockResetNormenVoorVestiging,
  DEFAULT_VESTIGING_NORMEN_MOCK,
} = vi.hoisted(() => {
  let _map = new Map<string, unknown>();
  const defaultDgConfig = [
    { id: 'va', label: 'V&A', active: true },
    { id: 'mm', label: 'M&M', active: true },
  ];
  const defaultMapping: Record<string, string> = { va: 'lesgeven', mm: 'lesgeven' };

  // M42 T11 — per-vestiging normen mock, mirrors utils/normen.ts's real
  // DEFAULT_VESTIGING_NORMEN shape (Roosendaal-only "levels" fields are 0 for Goes/Dordrecht).
  type VestigingKey = 'roosendaal' | 'goes' | 'dordrecht';
  const vestigingNormenShared = {
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
  };
  const DEFAULT_VESTIGING_NORMEN_MOCK: Record<VestigingKey, Record<string, number>> = {
    roosendaal: {
      ...vestigingNormenShared,
      bj1NaarBj2RoosendaalLevelsMin: 4,
      bj1VersneldSbcRoosendaalLevelsMin: 8,
      bj2SblRoosendaalLevelsMin: 2,
      bj2SbcRoosendaalLevelsMin: 3,
      bj2RoosendaalSblKeuzeLevelsMin: 2,
    },
    goes: {
      ...vestigingNormenShared,
      bj1NaarBj2RoosendaalLevelsMin: 0,
      bj1VersneldSbcRoosendaalLevelsMin: 0,
      bj2SblRoosendaalLevelsMin: 0,
      bj2SbcRoosendaalLevelsMin: 0,
      bj2RoosendaalSblKeuzeLevelsMin: 0,
    },
    dordrecht: {
      ...vestigingNormenShared,
      bj1NaarBj2RoosendaalLevelsMin: 0,
      bj1VersneldSbcRoosendaalLevelsMin: 0,
      bj2SblRoosendaalLevelsMin: 0,
      bj2SbcRoosendaalLevelsMin: 0,
      bj2RoosendaalSblKeuzeLevelsMin: 0,
    },
  };

  return {
    getStoreMap: () => _map,
    setStoreMap: (m: Map<string, unknown>) => { _map = m; },
    mockGetDeelgebiedenConfig: vi.fn().mockResolvedValue(defaultDgConfig),
    mockSaveDeelgebiedenConfig: vi.fn().mockResolvedValue(true),
    mockResetDeelgebiedenConfig: vi.fn().mockResolvedValue(undefined),
    mockGetLeerlijnenMapping: vi.fn().mockResolvedValue(defaultMapping),
    mockSaveLeerlijnenMapping: vi.fn().mockResolvedValue(true),
    mockResetLeerlijnenMapping: vi.fn().mockResolvedValue(undefined),
    mockLoadNormenVoorVestiging: vi.fn((vestiging: VestigingKey) =>
      Promise.resolve({ ...DEFAULT_VESTIGING_NORMEN_MOCK[vestiging] })
    ),
    mockSaveNormenVoorVestiging: vi.fn().mockResolvedValue(true),
    mockResetNormenVoorVestiging: vi.fn((vestiging: VestigingKey) =>
      Promise.resolve({ ...DEFAULT_VESTIGING_NORMEN_MOCK[vestiging] })
    ),
    DEFAULT_VESTIGING_NORMEN_MOCK,
  };
});

// ── Module mocks for utils/deelgebieden and utils/leerlijnen ──────────────────
vi.mock('../utils/deelgebieden', () => ({
  getDeelgebiedenConfig: mockGetDeelgebiedenConfig,
  saveDeelgebiedenConfig: mockSaveDeelgebiedenConfig,
  resetDeelgebiedenConfig: mockResetDeelgebiedenConfig,
}));

vi.mock('../utils/leerlijnen', () => ({
  getLeerlijnenMapping: mockGetLeerlijnenMapping,
  saveLeerlijnenMapping: mockSaveLeerlijnenMapping,
  resetLeerlijnenMapping: mockResetLeerlijnenMapping,
}));

vi.mock('../utils/normen', () => ({
  loadNormenVoorVestiging: mockLoadNormenVoorVestiging,
  saveNormenVoorVestiging: mockSaveNormenVoorVestiging,
  resetNormenVoorVestiging: mockResetNormenVoorVestiging,
  DEFAULT_VESTIGING_NORMEN: DEFAULT_VESTIGING_NORMEN_MOCK,
}));

const mockCheckForUpdate = vi.fn();
vi.mock('../utils/updateCheck', () => ({
  checkForUpdate: (...args: unknown[]) => mockCheckForUpdate(...args),
}));

vi.mock('@tauri-apps/plugin-store', () => {
  // ES6 class mock — required for `new LazyStore()` constructor call (STATE.md line 64)
  class LazyStore {
    async get<T>(key: string): Promise<T | null> {
      return (getStoreMap().get(key) as T) ?? null;
    }
    async set(key: string, value: unknown): Promise<void> {
      getStoreMap().set(key, value);
    }
    async save(): Promise<void> {
      // intentionally empty — disk flush is a no-op in tests
    }
    async delete(key: string): Promise<void> {
      getStoreMap().delete(key);
    }
  }
  return { LazyStore };
});

// Import AFTER mocks are hoisted
import SettingsPage from '../src/components/SettingsPage';

// ── beforeEach: reset state between tests ─────────────────────────────────────
beforeEach(() => {
  // Replace the shared store map with a fresh empty map
  setStoreMap(new Map<string, unknown>());

  // Reset body class
  document.body.className = '';

  // Reset matchMedia stub to default matches:false (light mode)
  if (typeof window.matchMedia === 'function' && 'mockImplementation' in window.matchMedia) {
    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  vi.clearAllMocks();

  // Re-initialize vestiging-normen mocks after clearAllMocks
  mockLoadNormenVoorVestiging.mockImplementation((vestiging: 'roosendaal' | 'goes' | 'dordrecht') =>
    Promise.resolve({ ...DEFAULT_VESTIGING_NORMEN_MOCK[vestiging] })
  );
  mockSaveNormenVoorVestiging.mockResolvedValue(true);
  mockResetNormenVoorVestiging.mockImplementation((vestiging: 'roosendaal' | 'goes' | 'dordrecht') =>
    Promise.resolve({ ...DEFAULT_VESTIGING_NORMEN_MOCK[vestiging] })
  );
});

describe('SettingsPage', () => {

  // ── Test 1: SET-01 persistence — toggle adds body.dark and persists { theme: 'dark' } ──
  it('SET-01 persistence: toggling switch adds body.dark and persists { theme: dark }', async () => {
    // Preconditions: empty store, no dark class, matchMedia returns false (light)
    expect(getStoreMap().size).toBe(0);
    document.body.className = '';

    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} isDark={false} onToggleDark={vi.fn()} onNormenChanged={() => {}} />);

    // Allow mount useEffect to resolve (loadSettings → empty store → OS fallback)
    await act(async () => { await Promise.resolve(); });

    // Initially: body.dark is absent (matchMedia returns false = light mode)
    expect(document.body.classList.contains('dark')).toBe(false);

    // Fire the toggle checkbox
    const checkbox = screen.getByRole('checkbox', { name: 'Donkere modus' });
    await act(async () => {
      fireEvent.click(checkbox);
      await Promise.resolve();
    });

    // body.dark must be added immediately
    expect(document.body.classList.contains('dark')).toBe(true);

    // Store must contain settings key with { theme: 'dark' }
    const stored = getStoreMap().get('settings') as { theme: string } | undefined;
    expect(stored).toBeDefined();
    expect(stored?.theme).toBe('dark');
  });

  // ── Test 2: SET-01 prop-driven dark — isDark=true prop → checkbox checked (App.tsx owns state) ──
  it('SET-01 prop-driven dark: isDark=true prop → toggle checkbox is checked', async () => {
    // Phase 19: dark mode state is now owned by App.tsx and passed as isDark prop.
    // SettingsPage is a controlled child — it reads isDark from props, not internal state.
    document.body.className = 'dark'; // App.tsx would have applied this via applyTheme on mount

    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} isDark={true} onToggleDark={vi.fn()} onNormenChanged={() => {}} />);

    // Toggle must reflect prop immediately (no async needed — prop-driven)
    const checkbox = screen.getByRole('checkbox', { name: 'Donkere modus' });
    expect((checkbox as HTMLInputElement).checked).toBe(true);
  });

  // ── Test 3: SET-01 prop-driven light — isDark=false prop → checkbox unchecked ──
  it('SET-01 prop-driven light: isDark=false prop → toggle checkbox is unchecked', async () => {
    // Phase 19: dark mode state is now owned by App.tsx and passed as isDark prop.
    document.body.className = '';

    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} isDark={false} onToggleDark={vi.fn()} onNormenChanged={() => {}} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Donkere modus' });
    expect((checkbox as HTMLInputElement).checked).toBe(false);
  });

  // ── Test 4: SET-01 toggle calls onToggleDark + applyTheme + saveSettings ──────
  it('SET-01 toggle: clicking switch calls onToggleDark, saves theme, updates body.dark', async () => {
    // Phase 19: toggling dark mode in SettingsPage calls onToggleDark(true) to notify App.tsx,
    // and also persists via saveSettings + applies via applyTheme.
    document.body.className = '';

    const onBack = vi.fn();
    const onImport = vi.fn();
    const onToggleDark = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} isDark={false} onToggleDark={onToggleDark} onNormenChanged={() => {}} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Donkere modus' });
    await act(async () => {
      fireEvent.click(checkbox);
      await Promise.resolve();
    });

    // body.dark must be added immediately (applyTheme called)
    expect(document.body.classList.contains('dark')).toBe(true);

    // Store must contain settings key with { theme: 'dark' }
    const stored = getStoreMap().get('settings') as { theme: string } | undefined;
    expect(stored).toBeDefined();
    expect(stored?.theme).toBe('dark');

    // App.tsx must be notified via onToggleDark
    expect(onToggleDark).toHaveBeenCalledTimes(1);
    expect(onToggleDark).toHaveBeenCalledWith(true);
  });

  // ── Test 5: SET-02 — "Bestanden toevoegen" invokes onNavigateToImport ────────
  it('SET-02: clicking "Bestanden toevoegen" invokes onNavigateToImport', async () => {
    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} isDark={false} onToggleDark={vi.fn()} onNormenChanged={() => {}} />);
    await act(async () => { await Promise.resolve(); });

    const btn = screen.getByRole('button', { name: 'Bestanden toevoegen' });
    fireEvent.click(btn);

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  // ── Test 6: Back button — clicking ← Terug invokes onBack ────────────────────
  it('back button: clicking "← Terug" invokes onBack', async () => {
    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} isDark={false} onToggleDark={vi.fn()} onNormenChanged={() => {}} />);
    await act(async () => { await Promise.resolve(); });

    const btn = screen.getByRole('button', { name: '← Terug' });
    fireEvent.click(btn);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

});

// ── Section 3: Deelgebieden & Leerlijnen (Phase 18, SET-03 + SET-04) ─────────

describe('SettingsPage section 3 — Deelgebieden & Leerlijnen (Phase 18)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-initialize mock return values after clearAllMocks wipes them
    mockGetDeelgebiedenConfig.mockResolvedValue([
      { id: 'va', label: 'V&A', active: true },
      { id: 'mm', label: 'M&M', active: true },
    ]);
    mockGetLeerlijnenMapping.mockResolvedValue({ va: 'lesgeven', mm: 'lesgeven' });
    mockSaveDeelgebiedenConfig.mockResolvedValue(true);
    mockSaveLeerlijnenMapping.mockResolvedValue(true);
    mockResetDeelgebiedenConfig.mockResolvedValue(undefined);
    mockResetLeerlijnenMapping.mockResolvedValue(undefined);
    setStoreMap(new Map<string, unknown>());
    document.body.className = '';
  });

  function renderSettings() {
    return render(
      <SettingsPage onBack={vi.fn()} onNavigateToImport={vi.fn()} isDark={false} onToggleDark={vi.fn()} onNormenChanged={() => {}} />
    );
  }

  // ── Test S3-01: table renders with dg rows loaded from getDeelgebiedenConfig ──
  it('SET-03: section 3 renders deelgebieden table with rows from getDeelgebiedenConfig', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    // Section heading present
    expect(screen.getByText('Deelgebieden & Leerlijnen')).toBeDefined();

    // Column headers
    expect(screen.getByText('Naam')).toBeDefined();
    expect(screen.getByText('Leerlijn')).toBeDefined();
    expect(screen.getByText('Actief')).toBeDefined();

    // Rows rendered — V&A and M&M inputs present
    const inputs = screen.getAllByRole('textbox');
    const naamInputs = inputs.filter(el => (el as HTMLInputElement).value.match(/V&A|M&M/));
    expect(naamInputs.length).toBeGreaterThanOrEqual(1);
  });

  // ── Test S3-02: placeholder "Komt in een volgende versie" is GONE ────────────
  it('SET-03: placeholder text is removed from section 3 after implementation', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    // The placeholder should NOT appear in section 3
    // (section 4 may still have it — this test verifies section 3 is implemented)
    const placeholders = screen.queryAllByText('Komt in een volgende versie.');
    // At most 1 (section 4) — section 3 must not show it
    expect(placeholders.length).toBeLessThanOrEqual(1);
  });

  // ── Test S3-03: leerlijn dropdown renders with both options ───────────────────
  it('SET-04: leerlijn dropdown has Lesgeven en organiseren / Professioneel handelen options', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);

    // First select should have both leerlijn options
    const firstSelect = selects[0];
    expect(firstSelect.innerHTML).toContain('Lesgeven en organiseren');
    expect(firstSelect.innerHTML).toContain('Professioneel handelen');
  });

  // ── Test S3-04: changing leerlijn dropdown calls saveLeerlijnenMapping ────────
  it('SET-04: changing leerlijn calls saveLeerlijnenMapping with updated mapping', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const selects = screen.getAllByRole('combobox');
    await act(async () => {
      fireEvent.change(selects[0], { target: { value: 'professioneel_handelen' } });
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockSaveLeerlijnenMapping).toHaveBeenCalled();
  });

  // ── Test S3-05: Actief toggle calls saveDeelgebiedenConfig on change ──────────
  it('SET-03: toggling Actief checkbox calls saveDeelgebiedenConfig', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is dark mode; skip it — find the aktief toggles (aria-label contains "actief")
    const actievCheckboxes = checkboxes.filter(el =>
      el.getAttribute('aria-label')?.toLowerCase().includes('actief')
    );
    expect(actievCheckboxes.length).toBeGreaterThanOrEqual(1);

    await act(async () => {
      fireEvent.click(actievCheckboxes[0]);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockSaveDeelgebiedenConfig).toHaveBeenCalled();
  });

  // ── Test S3-06: Herstel standaard button shows inline confirmation ────────────
  it('SET-03: clicking "Herstel standaard" shows inline confirmation (no modal)', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    // Section 5 also has a "Herstel standaard" button — target Section 3's button (first one)
    const herstelBtns = screen.getAllByRole('button', { name: 'Herstel standaard' });
    const herstelBtn = herstelBtns[0]; // Section 3 reset button
    await act(async () => { fireEvent.click(herstelBtn); });

    expect(screen.getByText('Alles terugzetten naar standaard?')).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Niet herstellen' })[0]).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Ja, herstel' })[0]).toBeDefined();
  });

  // ── Test S3-07: "Niet herstellen" dismisses confirmation without reset ────────
  it('SET-03: clicking "Niet herstellen" restores the Herstel button without resetting', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    // Section 5 also has a "Herstel standaard" button — target Section 3's button (first one)
    const herstelBtns = screen.getAllByRole('button', { name: 'Herstel standaard' });
    const herstelBtn = herstelBtns[0]; // Section 3 reset button
    await act(async () => { fireEvent.click(herstelBtn); });

    const cancelBtns = screen.getAllByRole('button', { name: 'Niet herstellen' });
    const cancelBtn = cancelBtns[0]; // Section 3 cancel button
    await act(async () => { fireEvent.click(cancelBtn); });

    // Section 3 confirmation should be gone
    expect(screen.queryByText('Alles terugzetten naar standaard?')).toBeNull();
    // Section 3 "Herstel standaard" button should be back (2 buttons total again)
    expect(screen.getAllByRole('button', { name: 'Herstel standaard' }).length).toBeGreaterThanOrEqual(1);

    // No reset was called
    expect(mockResetDeelgebiedenConfig).not.toHaveBeenCalled();
    expect(mockResetLeerlijnenMapping).not.toHaveBeenCalled();
  });

  // ── Test S3-08: "Ja, herstel" calls both reset functions ─────────────────────
  it('SET-03: clicking "Ja, herstel" calls resetDeelgebiedenConfig and resetLeerlijnenMapping', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    // Section 5 also has a "Herstel standaard" button — target Section 3's button (first one)
    const herstelBtns = screen.getAllByRole('button', { name: 'Herstel standaard' });
    const herstelBtn = herstelBtns[0]; // Section 3 reset button
    await act(async () => { fireEvent.click(herstelBtn); });

    const confirmBtns = screen.getAllByRole('button', { name: 'Ja, herstel' });
    const confirmBtn = confirmBtns[0]; // Section 3 confirm button
    await act(async () => {
      fireEvent.click(confirmBtn);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockResetDeelgebiedenConfig).toHaveBeenCalledTimes(1);
    expect(mockResetLeerlijnenMapping).toHaveBeenCalledTimes(1);
  });

});

// ── M42 T11 — per-vestiging doorstroomdrempels (VestigingNormen, T7-T10) tests ──

describe('Section 5: Doorstroomdrempels (per-vestiging, M42 T11)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    setStoreMap(new Map<string, unknown>());
    document.body.className = '';
    // Re-initialize all mocks after clearAllMocks
    mockGetDeelgebiedenConfig.mockResolvedValue([
      { id: 'va', label: 'V&A', active: true },
      { id: 'mm', label: 'M&M', active: true },
    ]);
    mockGetLeerlijnenMapping.mockResolvedValue({ va: 'lesgeven', mm: 'lesgeven' });
    mockSaveDeelgebiedenConfig.mockResolvedValue(true);
    mockSaveLeerlijnenMapping.mockResolvedValue(true);
    mockResetDeelgebiedenConfig.mockResolvedValue(undefined);
    mockResetLeerlijnenMapping.mockResolvedValue(undefined);
    mockLoadNormenVoorVestiging.mockImplementation((vestiging: 'roosendaal' | 'goes' | 'dordrecht') =>
      Promise.resolve({ ...DEFAULT_VESTIGING_NORMEN_MOCK[vestiging] })
    );
    mockSaveNormenVoorVestiging.mockResolvedValue(true);
    mockResetNormenVoorVestiging.mockImplementation((vestiging: 'roosendaal' | 'goes' | 'dordrecht') =>
      Promise.resolve({ ...DEFAULT_VESTIGING_NORMEN_MOCK[vestiging] })
    );
  });

  function renderSection5(onNormenChanged = vi.fn()) {
    return render(
      <SettingsPage
        onBack={vi.fn()}
        onNavigateToImport={vi.fn()}
        isDark={false}
        onToggleDark={vi.fn()}
        onNormenChanged={onNormenChanged}
      />
    );
  }

  // ── Test S5-01: section renders with heading, vestiging selector and sub-block headings ──
  it('S5-01: Section 5 renders "Doorstroomdrempels" heading with vestiging selector and sub-blocks', async () => {
    renderSection5();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(screen.getByText('Doorstroomdrempels')).toBeDefined();
    expect(screen.getByLabelText('Vestiging (drempelwaarden)')).toBeDefined();
    expect(screen.getByText('BJ1 — naar basisjaar 2')).toBeDefined();
    expect(screen.getByText('BJ1 — versneld SBC-traject')).toBeDefined();
    expect(screen.getByText('BJ1 — negatief bindend studieadvies')).toBeDefined();
    expect(screen.getByText('BJ2 generiek — SBL')).toBeDefined();
    expect(screen.getByText('BJ2 generiek — SBC')).toBeDefined();
    expect(screen.getByText('Alleen Roosendaal — level-eisen')).toBeDefined();
  });

  // ── Test S5-02: switching vestiging selector loads that vestiging's real values ──
  it('S5-02: switching the vestiging selector calls loadNormenVoorVestiging and shows that vestiging\'s values', async () => {
    mockLoadNormenVoorVestiging.mockImplementation((vestiging: 'roosendaal' | 'goes' | 'dordrecht') => {
      const base = DEFAULT_VESTIGING_NORMEN_MOCK[vestiging];
      const distinguisher = vestiging === 'roosendaal' ? 7 : vestiging === 'goes' ? 11 : 13;
      return Promise.resolve({ ...base, bj2SblDeelgebiedenVoldoendeMin: distinguisher });
    });
    renderSection5();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(mockLoadNormenVoorVestiging).toHaveBeenCalledWith('roosendaal');
    const sblInput = screen.getByLabelText('BJ2 SBL: deelgebieden ≥V (min.)') as HTMLInputElement;
    expect(sblInput.value).toBe('7');

    const select = screen.getByLabelText('Vestiging (drempelwaarden)');
    await act(async () => {
      fireEvent.change(select, { target: { value: 'goes' } });
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockLoadNormenVoorVestiging).toHaveBeenCalledWith('goes');
    const sblInputAfter = screen.getByLabelText('BJ2 SBL: deelgebieden ≥V (min.)') as HTMLInputElement;
    expect(sblInputAfter.value).toBe('11');
  });

  // ── Test S5-03: blur triggers saveNormenVoorVestiging with correct vestiging + onNormenChanged ──
  it('S5-03: editing a field and blurring calls saveNormenVoorVestiging with the selected vestiging and updated profile', async () => {
    const onNormenChanged = vi.fn();
    renderSection5(onNormenChanged);
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const input = screen.getByLabelText('Negatief: onbeoordeelde datapunten fase 2 (max.)');

    await act(async () => {
      fireEvent.change(input, { target: { value: '10' } });
      await new Promise(r => setTimeout(r, 0));
    });

    await act(async () => {
      fireEvent.blur(input);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockSaveNormenVoorVestiging).toHaveBeenCalledWith(
      'roosendaal',
      expect.objectContaining({ bj1NegatiefOnbeoordeeldMax: 10 })
    );
    expect(onNormenChanged).toHaveBeenCalledTimes(1);
  });

  // ── Test S5-04: Enter key triggers blur (and thus save) ───────────────────
  it('S5-04: pressing Enter on a field triggers blur handler (saveNormenVoorVestiging called)', async () => {
    renderSection5();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const input = screen.getByLabelText('Negatief: onbeoordeelde datapunten fase 2 (max.)');

    await act(async () => {
      fireEvent.change(input, { target: { value: '11' } });
      await new Promise(r => setTimeout(r, 0));
    });

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
      // blur fires synchronously after keyDown in jsdom environment
      fireEvent.blur(input);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockSaveNormenVoorVestiging).toHaveBeenCalled();
  });

  // ── Test S5-05: reset flow scoped to selected vestiging only ──────────────
  it('S5-05: reset confirmation flow — Herstel standaard voor Roosendaal → confirm → resetNormenVoorVestiging(\'roosendaal\') only', async () => {
    const onNormenChanged = vi.fn();
    renderSection5(onNormenChanged);
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const herstelBtn = screen.getByRole('button', { name: 'Herstel standaard voor Roosendaal' });
    await act(async () => { fireEvent.click(herstelBtn); });

    expect(screen.getByText('Doorstroomdrempels voor Roosendaal terugzetten naar standaard?')).toBeDefined();
    const nietHerstelBtn = screen.getByRole('button', { name: 'Niet herstellen' });

    await act(async () => { fireEvent.click(nietHerstelBtn); });
    expect(screen.queryByText('Doorstroomdrempels voor Roosendaal terugzetten naar standaard?')).toBeNull();
    expect(mockResetNormenVoorVestiging).not.toHaveBeenCalled();

    // Click again and confirm
    const herstelBtn2 = screen.getByRole('button', { name: 'Herstel standaard voor Roosendaal' });
    await act(async () => { fireEvent.click(herstelBtn2); });
    const jaHerstelBtn = screen.getByRole('button', { name: 'Ja, herstel' });
    await act(async () => {
      fireEvent.click(jaHerstelBtn);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockResetNormenVoorVestiging).toHaveBeenCalledTimes(1);
    expect(mockResetNormenVoorVestiging).toHaveBeenCalledWith('roosendaal');
    expect(onNormenChanged).toHaveBeenCalled();
  });

  // ── Test S5-06: Roosendaal-only fields not rendered when Goes/Dordrecht selected ──
  it('S5-06: Roosendaal-only level fields are not rendered when Goes is selected, and an N.v.t. note shows instead', async () => {
    renderSection5();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    // Present for the default vestiging (Roosendaal)
    expect(screen.getByLabelText('BJ1→BJ2: levels behaald (min., Roosendaal)')).toBeDefined();

    const select = screen.getByLabelText('Vestiging (drempelwaarden)');
    await act(async () => {
      fireEvent.change(select, { target: { value: 'goes' } });
      await new Promise(r => setTimeout(r, 0));
    });

    expect(screen.queryByLabelText('BJ1→BJ2: levels behaald (min., Roosendaal)')).toBeNull();
    expect(screen.queryByLabelText('Versneld SBC: levels behaald (min., Roosendaal)')).toBeNull();
    expect(screen.queryByLabelText('BJ2 SBL: levels behaald (min., Roosendaal)')).toBeNull();
    expect(screen.queryByLabelText('BJ2 SBC: levels behaald (min., Roosendaal)')).toBeNull();
    expect(screen.queryByLabelText('SBL-keuze: deelgebieden ≥V (min., Roosendaal)')).toBeNull();
    expect(screen.queryByLabelText('SBL-keuze: rekendomeinen afgerond (min., Roosendaal)')).toBeNull();
    expect(screen.queryByLabelText('SBL-keuze: levels behaald (min., Roosendaal)')).toBeNull();
    expect(screen.getByText('N.v.t. voor deze vestiging — level-eisen gelden alleen voor Roosendaal.')).toBeDefined();

    // Also confirm the reset button now correctly labels Goes, not Roosendaal
    expect(screen.getByRole('button', { name: 'Herstel standaard voor Goes' })).toBeDefined();
  });

  // ── Test S5-07: value typed below 0 clamps to 0 on blur ───────────────────
  it('S5-07: typing a negative value into a field clamps to 0 on blur', async () => {
    renderSection5();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const input = screen.getByLabelText('Negatief: onbeoordeelde datapunten fase 2 (max.)') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: '-5' } });
      await new Promise(r => setTimeout(r, 0));
    });

    await act(async () => {
      fireEvent.blur(input);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(input.value).toBe('0');
    expect(mockSaveNormenVoorVestiging).toHaveBeenCalledWith(
      'roosendaal',
      expect.objectContaining({ bj1NegatiefOnbeoordeeldMax: 0 })
    );
  });

});

// ── Section 6: Controleer op updates (handmatige update-check) ──────────────

describe('SettingsPage — Controleer op updates', () => {
  beforeEach(() => {
    mockCheckForUpdate.mockReset();
  });

  function renderSettings() {
    return render(
      <SettingsPage onBack={vi.fn()} onNavigateToImport={vi.fn()} isDark={false} onToggleDark={vi.fn()} onNormenChanged={() => {}} />
    );
  }

  it('toont "Je hebt de nieuwste versie" als er geen update is', async () => {
    mockCheckForUpdate.mockResolvedValueOnce(null);
    renderSettings();
    await act(async () => { await Promise.resolve(); });

    fireEvent.click(screen.getByRole('button', { name: /Controleer op updates/i }));
    expect(await screen.findByText(/Je hebt de nieuwste versie/i)).toBeTruthy();
  });

  it('opent UpdateModal als er een update beschikbaar is', async () => {
    mockCheckForUpdate.mockResolvedValueOnce({
      version: '9.9.9',
      body: '### Fixed\n- iets',
      downloadAndInstall: vi.fn(),
    });
    renderSettings();
    await act(async () => { await Promise.resolve(); });

    fireEvent.click(screen.getByRole('button', { name: /Controleer op updates/i }));
    expect(await screen.findByText(/9\.9\.9/)).toBeTruthy();
  });

  it('toont "Update-check mislukt" als checkForUpdate een fout gooit (regressietest)', async () => {
    // Regressietest voor de bug waarbij checkForUpdate() alle fouten verzwolg en
    // null teruggaf — daardoor toonde een mislukte check ten onrechte "up to date".
    mockCheckForUpdate.mockRejectedValueOnce(new Error('network error'));
    renderSettings();
    await act(async () => { await Promise.resolve(); });

    fireEvent.click(screen.getByRole('button', { name: /Controleer op updates/i }));
    expect(await screen.findByText(/Update-check mislukt/i)).toBeTruthy();
    expect(screen.queryByText(/Je hebt de nieuwste versie/i)).toBeNull();
  });
});
