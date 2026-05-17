// tests/SettingsPage.test.tsx — Vitest coverage for SET-01 + SET-02
// Phase 17 Plan 02 — settings store helpers + SettingsPage component tests
// Must be in tests/ (NOT src/) so vitest.config.ts include pattern discovers it.
// LazyStore mocked as ES6 class (STATE.md mandate — not vi.fn())

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

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
