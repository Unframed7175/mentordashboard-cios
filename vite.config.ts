import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Required for Tauri: use relative base path so assets resolve in production
  // Without './', absolute paths (/assets/...) 404 in the packaged Tauri app (Pitfall 5)
  base: './',

  // Tauri dev server settings
  server: {
    port: 1420,
    strictPort: true,   // fail explicitly if port is taken, not silently shift (Pitfall 6)
    host: 'localhost',  // Tauri expects localhost, not 0.0.0.0
    hmr: true,
  },

  // Phase 10 only — no xlsx or pdfjs-dist needed yet
  // Add optimizeDeps when adding those libraries in Phase 11
});
