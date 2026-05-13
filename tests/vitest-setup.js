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
