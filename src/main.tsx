import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { getBpvConfig, getBpvData } from "../utils/bpv";
import { getDeelgebiedenConfig } from "../utils/deelgebieden";
import { loadKlassen } from "../utils/klassen";
import { getLeerlijnenMapping } from "../utils/leerlijnen";
import { loadSettings, applyTheme } from "../utils/settings";
import { loadVerzuimDrempels } from "../utils/verzuimDrempels";
import { loadNormen } from "../utils/normen";
import { pushConsoleError, initSystemInfo } from "../utils/feedback";

// Phase 28: Install ring buffer hooks BEFORE async IIFE so errors during init are captured.

// HMR guard — prevent double-wrapping console.error in dev mode
if (!(console.error as unknown as Record<string, boolean>).__gsd_patched) {
  const _origConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    pushConsoleError(args);
    _origConsoleError.apply(console, args);
  };
  (console.error as unknown as Record<string, boolean>).__gsd_patched = true;
}

// Capture uncaught exceptions (safer than window.onerror — does not clobber existing handlers)
window.addEventListener('error', (event) => {
  pushConsoleError([event.message ?? 'Unknown error']);
});

// Capture unhandled promise rejections (window.onerror misses these)
window.addEventListener('unhandledrejection', (event) => {
  pushConsoleError([event.reason instanceof Error ? event.reason : String(event.reason ?? 'Unhandled rejection')]);
});

(async () => {
  // Pre-cache OS/version info for FeedbackModal — ignore failure, buildMailtoUrl falls back to live call
  await initSystemInfo().catch(() => { /* ignore — buildMailtoUrl falls back to live call */ });

  try {
    await loadKlassen();
  } catch (err) {
    console.error('[main.tsx] loadKlassen mislukt:', err);
  }

  try {
    const saved = await loadSettings();
    if (saved?.theme) {
      applyTheme(saved.theme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  } catch (err) {
    console.error('[main.tsx] thema hydratie mislukt:', err);
    // Fall back to OS preference so the app still renders with a sensible theme
    // even if the plugin-store cannot be read. Wrap this fallback in its own
    // try/catch because matchMedia could in principle also fail under exotic
    // runtime conditions — but if it does, swallow silently and let the app
    // start in light mode.
    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    } catch {
      // Light mode (the default) — no further action needed.
    }
  }

  // Phase 18: pre-warm sync caches (D-15, D-16, D-17) before React mounts so sync accessors are populated
  try {
    await Promise.all([
      getDeelgebiedenConfig(),
      loadVerzuimDrempels(),
      getBpvConfig(),
      getBpvData(),
      getLeerlijnenMapping(),
      loadNormen(), // Phase 25 — pre-warm doorstroom normen sync cache
    ]);
  } catch (err) {
    console.warn('[main.tsx] Phase 18 cache pre-warm mislukt:', err);
    // Each module has its own fallback — app still renders with defaults
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
})();
