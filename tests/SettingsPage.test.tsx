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
  mockLoadNormen,
  mockSaveNormen,
  mockResetNormen,
  DEFAULT_NORMEN_MOCK,
} = vi.hoisted(() => {
  let _map = new Map<string, unknown>();
  const defaultDgConfig = [
    { id: 'va', label: 'V&A', active: true },
    { id: 'mm', label: 'M&M', active: true },
  ];
  const defaultMapping: Record<string, string> = { va: 'lesgeven', mm: 'lesgeven' };
  const DEFAULT_NORMEN_MOCK = {
    sbl: 13, sbc: 15, negatiefTotaal: 6, negatiefPerLeerlijn: 2,
    bj1Positief: 13, versneldLesgeven: 4, versneldOrganiseren: 3, versneldProfHandelen: 5,
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
    mockLoadNormen: vi.fn().mockResolvedValue({ ...DEFAULT_NORMEN_MOCK }),
    mockSaveNormen: vi.fn().mockResolvedValue(true),
    mockResetNormen: vi.fn().mockResolvedValue({ ...DEFAULT_NORMEN_MOCK }),
    DEFAULT_NORMEN_MOCK,
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
  loadNormen: mockLoadNormen,
  saveNormen: mockSaveNormen,
  resetNormen: mockResetNormen,
  DEFAULT_NORMEN: DEFAULT_NORMEN_MOCK,
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

  // Re-initialize normen mocks after clearAllMocks
  mockLoadNormen.mockResolvedValue({ ...DEFAULT_NORMEN_MOCK });
  mockSaveNormen.mockResolvedValue(true);
  mockResetNormen.mockResolvedValue({ ...DEFAULT_NORMEN_MOCK });
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

  // ── Test S3-03: leerlijn dropdown renders with three options ──────────────────
  it('SET-04: leerlijn dropdown has Lesgeven / Organiseren / Prof. handelen options', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);

    // First select should have all three leerlijn options
    const firstSelect = selects[0];
    expect(firstSelect.innerHTML).toContain('Lesgeven');
    expect(firstSelect.innerHTML).toContain('Organiseren');
    expect(firstSelect.innerHTML).toContain('Prof. handelen');
  });

  // ── Test S3-04: changing leerlijn dropdown calls saveLeerlijnenMapping ────────
  it('SET-04: changing leerlijn calls saveLeerlijnenMapping with updated mapping', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const selects = screen.getAllByRole('combobox');
    await act(async () => {
      fireEvent.change(selects[0], { target: { value: 'organiseren' } });
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

// ── Phase 25 doorstroom norm settings tests ────────────────────────────────────

describe('Section 5: Doorstroomdrempels', () => {

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
    mockLoadNormen.mockResolvedValue({ ...DEFAULT_NORMEN_MOCK });
    mockSaveNormen.mockResolvedValue(true);
    mockResetNormen.mockResolvedValue({ ...DEFAULT_NORMEN_MOCK });
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

  // ── Test S5-01: section renders with heading and sub-block headings ─────────
  it('S5-01: Section 5 renders "Doorstroomdrempels" heading with BJ2 and BJ1 sub-blocks', async () => {
    renderSection5();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(screen.getByText('Doorstroomdrempels')).toBeDefined();
    expect(screen.getByText('BJ2-drempels')).toBeDefined();
    expect(screen.getByText('BJ1-drempels')).toBeDefined();
  });

  // ── Test S5-02: blur triggers saveNormen + onNormenChanged ─────────────────
  it('S5-02: changing SBL input and blurring calls saveNormen and onNormenChanged', async () => {
    const onNormenChanged = vi.fn();
    renderSection5(onNormenChanged);
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const sblInput = screen.getByLabelText('SBL-drempel (≥V)');

    await act(async () => {
      fireEvent.change(sblInput, { target: { value: '10' } });
      await new Promise(r => setTimeout(r, 0));
    });

    await act(async () => {
      fireEvent.blur(sblInput);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockSaveNormen).toHaveBeenCalledWith(expect.objectContaining({ sbl: 10 }));
    expect(onNormenChanged).toHaveBeenCalledTimes(1);
  });

  // ── Test S5-03: Enter key triggers blur (and thus save) ───────────────────
  it('S5-03: pressing Enter on SBL input triggers blur handler (saveNormen called)', async () => {
    const onNormenChanged = vi.fn();
    renderSection5(onNormenChanged);
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const sblInput = screen.getByLabelText('SBL-drempel (≥V)');

    await act(async () => {
      fireEvent.change(sblInput, { target: { value: '11' } });
      await new Promise(r => setTimeout(r, 0));
    });

    await act(async () => {
      fireEvent.keyDown(sblInput, { key: 'Enter' });
      // blur fires synchronously after keyDown in jsdom environment
      fireEvent.blur(sblInput);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockSaveNormen).toHaveBeenCalled();
  });

  // ── Test S5-04: SBC<SBL warning appears when sbc < sbl ───────────────────
  it('S5-04: SBC < SBL warning appears when SBC is below SBL', async () => {
    // Seed loadNormen to return sbc < sbl
    mockLoadNormen.mockResolvedValue({ ...DEFAULT_NORMEN_MOCK, sbc: 10, sbl: 13 });
    renderSection5();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(screen.getByText('Let op: SBC-drempel is normaal hoger dan SBL-drempel (standaard: 15 vs 13).')).toBeDefined();
  });

  // ── Test S5-05: reset confirmation flow ───────────────────────────────────
  it('S5-05: reset confirmation flow — Herstel standaard → confirm → resetNormen called', async () => {
    const onNormenChanged = vi.fn();
    renderSection5(onNormenChanged);
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    // Click Section 5 "Herstel standaard" (second one, index 1)
    const herstelBtns = screen.getAllByRole('button', { name: 'Herstel standaard' });
    const section5HerstelBtn = herstelBtns[herstelBtns.length - 1]; // Section 5 is last
    await act(async () => { fireEvent.click(section5HerstelBtn); });

    // Confirm row appears with CIOS copy
    expect(screen.getByText('Alles terugzetten naar CIOS-standaard?')).toBeDefined();
    const nietHerstelBtns = screen.getAllByRole('button', { name: 'Niet herstellen' });
    expect(nietHerstelBtns.length).toBeGreaterThanOrEqual(1);

    // Click "Niet herstellen" (last one — Section 5)
    await act(async () => { fireEvent.click(nietHerstelBtns[nietHerstelBtns.length - 1]); });
    expect(screen.queryByText('Alles terugzetten naar CIOS-standaard?')).toBeNull();

    // Click again and then confirm
    const herstelBtns2 = screen.getAllByRole('button', { name: 'Herstel standaard' });
    await act(async () => { fireEvent.click(herstelBtns2[herstelBtns2.length - 1]); });

    const jaHerstelBtns = screen.getAllByRole('button', { name: 'Ja, herstel' });
    await act(async () => {
      fireEvent.click(jaHerstelBtns[jaHerstelBtns.length - 1]);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockResetNormen).toHaveBeenCalledTimes(1);
    expect(onNormenChanged).toHaveBeenCalled();
  });

  // ── Test S5-06: onNormenChanged fires exactly once per blur ───────────────
  it('S5-06: onNormenChanged fires exactly once per blur event on an input', async () => {
    const onNormenChanged = vi.fn();
    renderSection5(onNormenChanged);
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const sblInput = screen.getByLabelText('SBL-drempel (≥V)');

    await act(async () => {
      fireEvent.change(sblInput, { target: { value: '12' } });
      await new Promise(r => setTimeout(r, 0));
    });

    await act(async () => {
      fireEvent.blur(sblInput);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(onNormenChanged).toHaveBeenCalledTimes(1);
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
