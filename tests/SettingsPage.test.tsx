// tests/SettingsPage.test.tsx — Vitest coverage for SET-01 + SET-02 + SET-03 + SET-04
// Phase 17 Plan 02 — settings store helpers + SettingsPage component tests
// Phase 18 Plan 04 — section 3 deelgebieden table (SET-03 + SET-04)
// Must be in tests/ (NOT src/) so vitest.config.ts include pattern discovers it.
// LazyStore mocked as ES6 class (STATE.md mandate — not vi.fn())

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// ── Module-level mocks for utils/deelgebieden and utils/leerlijnen ────────────
// These are used by section 3 tests to isolate SettingsPage behavior.
const mockDgConfig = [
  { id: 'va', label: 'V&A', active: true },
  { id: 'mm', label: 'M&M', active: true },
];
const mockGetDeelgebiedenConfig = vi.fn().mockResolvedValue(mockDgConfig);
const mockSaveDeelgebiedenConfig = vi.fn().mockResolvedValue(true);
const mockResetDeelgebiedenConfig = vi.fn().mockResolvedValue(undefined);

const mockLeerlijnenMapping: Record<string, string> = { va: 'lesgeven', mm: 'lesgeven' };
const mockGetLeerlijnenMapping = vi.fn().mockResolvedValue(mockLeerlijnenMapping);
const mockSaveLeerlijnenMapping = vi.fn().mockResolvedValue(true);
const mockResetLeerlijnenMapping = vi.fn().mockResolvedValue(undefined);

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

// vi.hoisted() runs before vi.mock() — use it to expose the shared store map
// so the LazyStore mock constructor can reference it without TDZ errors.
const { getStoreMap, setStoreMap } = vi.hoisted(() => {
  let _map = new Map<string, unknown>();
  return {
    getStoreMap: () => _map,
    setStoreMap: (m: Map<string, unknown>) => { _map = m; },
  };
});

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
});

describe('SettingsPage', () => {

  // ── Test 1: SET-01 persistence — toggle adds body.dark and persists { theme: 'dark' } ──
  it('SET-01 persistence: toggling switch adds body.dark and persists { theme: dark }', async () => {
    // Preconditions: empty store, no dark class, matchMedia returns false (light)
    expect(getStoreMap().size).toBe(0);
    document.body.className = '';

    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} />);

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

  // ── Test 2: SET-01 restore — saved 'dark' theme is applied on mount ────────
  it('SET-01 restore: saved theme "dark" is applied on mount and toggle reflects it', async () => {
    // Preload store with dark theme
    getStoreMap().set('settings', { theme: 'dark' });
    document.body.className = '';

    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} />);

    // Await mount effect (loadSettings resolves with { theme: 'dark' })
    await act(async () => { await Promise.resolve(); });

    // body.dark must be applied
    expect(document.body.classList.contains('dark')).toBe(true);

    // Toggle checkbox must reflect dark state
    const checkbox = screen.getByRole('checkbox', { name: 'Donkere modus' });
    expect((checkbox as HTMLInputElement).checked).toBe(true);
  });

  // ── Test 3: SET-01 OS fallback — empty store + matchMedia true → dark, NOT persisted ──
  it('SET-01 OS fallback: empty store + dark OS pref → dark applied but NOT persisted (D-06)', async () => {
    // Override matchMedia to return matches:true (dark OS preference)
    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Ensure store is empty and no dark class
    expect(getStoreMap().size).toBe(0);
    document.body.className = '';

    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} />);

    // Await mount effect
    await act(async () => { await Promise.resolve(); });

    // Dark should be applied (OS preference)
    expect(document.body.classList.contains('dark')).toBe(true);

    // CRITICAL: settings key must NOT be in store — OS preference is not persisted (D-06/Pitfall 4)
    expect(getStoreMap().has('settings')).toBe(false);
  });

  // ── Test 4: Flicker-free initializer — body.dark already set → toggle starts checked ──
  it('flicker-free: body.dark set before mount → checkbox is checked on first paint (no await)', async () => {
    // Simulate main.tsx startup hydration: body.dark is set BEFORE SettingsPage mounts
    document.body.className = 'dark';
    // Preload store so the mount effect does not flip state back
    getStoreMap().set('settings', { theme: 'dark' });

    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} />);

    // IMMEDIATELY (before any await) — toggle must be checked on first paint
    // This is the Codex MEDIUM "Toggle flicker on open" guard:
    // the lazy useState initializer reads document.body.classList.contains('dark')
    // synchronously, so the checkbox is correct without waiting for loadSettings.
    const checkbox = screen.getByRole('checkbox', { name: 'Donkere modus' });
    expect((checkbox as HTMLInputElement).checked).toBe(true);
  });

  // ── Test 5: SET-02 — "Bestanden toevoegen" invokes onNavigateToImport ────────
  it('SET-02: clicking "Bestanden toevoegen" invokes onNavigateToImport', async () => {
    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} />);
    await act(async () => { await Promise.resolve(); });

    const btn = screen.getByRole('button', { name: 'Bestanden toevoegen' });
    fireEvent.click(btn);

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  // ── Test 6: Back button — clicking ← Terug invokes onBack ────────────────────
  it('back button: clicking "← Terug" invokes onBack', async () => {
    const onBack = vi.fn();
    const onImport = vi.fn();

    render(<SettingsPage onBack={onBack} onNavigateToImport={onImport} />);
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
      <SettingsPage onBack={vi.fn()} onNavigateToImport={vi.fn()} />
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

    const herstelBtn = screen.getByRole('button', { name: 'Herstel standaard' });
    await act(async () => { fireEvent.click(herstelBtn); });

    expect(screen.getByText('Alles terugzetten naar standaard?')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Niet herstellen' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Ja, herstel' })).toBeDefined();
  });

  // ── Test S3-07: "Niet herstellen" dismisses confirmation without reset ────────
  it('SET-03: clicking "Niet herstellen" restores the Herstel button without resetting', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const herstelBtn = screen.getByRole('button', { name: 'Herstel standaard' });
    await act(async () => { fireEvent.click(herstelBtn); });

    const cancelBtn = screen.getByRole('button', { name: 'Niet herstellen' });
    await act(async () => { fireEvent.click(cancelBtn); });

    // Confirmation should be gone, Herstel standaard button should be back
    expect(screen.queryByText('Alles terugzetten naar standaard?')).toBeNull();
    expect(screen.getByRole('button', { name: 'Herstel standaard' })).toBeDefined();

    // No reset was called
    expect(mockResetDeelgebiedenConfig).not.toHaveBeenCalled();
    expect(mockResetLeerlijnenMapping).not.toHaveBeenCalled();
  });

  // ── Test S3-08: "Ja, herstel" calls both reset functions ─────────────────────
  it('SET-03: clicking "Ja, herstel" calls resetDeelgebiedenConfig and resetLeerlijnenMapping', async () => {
    renderSettings();
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    const herstelBtn = screen.getByRole('button', { name: 'Herstel standaard' });
    await act(async () => { fireEvent.click(herstelBtn); });

    const confirmBtn = screen.getByRole('button', { name: 'Ja, herstel' });
    await act(async () => {
      fireEvent.click(confirmBtn);
      await new Promise(r => setTimeout(r, 0));
    });

    expect(mockResetDeelgebiedenConfig).toHaveBeenCalledTimes(1);
    expect(mockResetLeerlijnenMapping).toHaveBeenCalledTimes(1);
  });

});
