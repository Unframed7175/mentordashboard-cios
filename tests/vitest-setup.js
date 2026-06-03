// Shim jest.* globals to vi equivalents.
// Required because actiepunten.test.js uses jest.fn()/jest.resetModules()
// and backup.test.js uses jest.fn().
// Does NOT modify test files (D-04).
import { vi } from 'vitest'

globalThis.jest = {
  fn: vi.fn.bind(vi),
  spyOn: vi.spyOn.bind(vi),
  mock: vi.mock.bind(vi),
  resetModules: vi.resetModules.bind(vi),
  clearAllMocks: vi.clearAllMocks.bind(vi),
  resetAllMocks: vi.resetAllMocks.bind(vi),
  restoreAllMocks: vi.restoreAllMocks.bind(vi),
}

// DOMMatrix stub — pdfjs (vendor/pdf.min.mjs) references DOMMatrix at import
// time.  jsdom does not include it; without this shim the test suite crashes
// when any test file imports parsers/pdf.ts (even for pure-function tests that
// never trigger actual PDF rendering).
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

// window.matchMedia stub — jsdom does not provide window.matchMedia.
// SettingsPage reads it during OS-preference fallback; without this stub the
// component would throw in tests.  Default matches:false = "light mode" OS pref.
// Individual tests can override via: window.matchMedia.mockImplementation(...)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
