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
  },
})
