import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{js,ts}'],
    setupFiles: ['./tests/vitest-setup.js'],
    coverage: {
      provider: 'v8',
      include: ['utils/**', 'parsers/**'],
    },
    // Use vmForks pool so Node.js built-ins (Uint8Array, TextEncoder) share the
    // same realm across all modules — avoids jsdom cross-realm instanceof failure
    // when fflate's zipSync checks `val instanceof u8` (u8 = Uint8Array at load time).
    pool: 'vmForks',
  },
})
