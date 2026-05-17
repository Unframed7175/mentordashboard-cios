/* utils/settings.ts — App settings store helpers (Phase 17)
 * Persists UI preferences (theme) under a separate 'settings' key in plugin-store.
 * Uses the same store.json file as utils/klassen.ts (D-07, Assumption A3).
 * Follows the LazyStore pattern from utils/klassen.ts (Phase 12).
 */

import { LazyStore } from '@tauri-apps/plugin-store';

// Same store file as klassen.ts — different key per D-07 / Assumption A3
const store = new LazyStore('store.json', { defaults: {}, autoSave: false });

// ── Types ─────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light';

// ── loadSettings() ────────────────────────────────────────────────────────────

/**
 * Load persisted app settings from plugin-store.
 * Returns null if no settings have been saved yet (first launch).
 */
export async function loadSettings(): Promise<{ theme: Theme } | null> {
  const raw = await store.get<{ theme: Theme }>('settings');
  return raw ?? null;
}

// ── saveSettings() ────────────────────────────────────────────────────────────

/**
 * Persist app settings to plugin-store.
 * CRITICAL: store.save() must follow store.set() — set() is in-memory only (Pitfall 1).
 */
export async function saveSettings(settings: { theme: Theme }): Promise<void> {
  await store.set('settings', settings);
  await store.save(); // REQUIRED: flushes in-memory mutation to disk
}

// ── applyTheme() ──────────────────────────────────────────────────────────────

/**
 * Apply a theme by toggling the `dark` class on document.body.
 * body.dark overrides CSS custom properties per Pattern 3 in RESEARCH.md.
 */
export function applyTheme(theme: Theme): void {
  document.body.classList.toggle('dark', theme === 'dark');
}
