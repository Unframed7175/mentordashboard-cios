import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { loadKlassen } from "../utils/klassen";
import { loadSettings, applyTheme } from "../utils/settings";

(async () => {
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

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
})();
