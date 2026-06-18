import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCheck = vi.fn();
vi.mock('@tauri-apps/plugin-updater', () => ({
  check: (...args: unknown[]) => mockCheck(...args),
}));

import { checkForUpdate } from '../utils/updateCheck';

describe('checkForUpdate', () => {
  beforeEach(() => {
    mockCheck.mockReset();
  });

  it('geeft null terug als er geen update beschikbaar is', async () => {
    mockCheck.mockResolvedValueOnce(null);
    expect(await checkForUpdate()).toBeNull();
  });

  it('geeft het update-object terug als er een update beschikbaar is', async () => {
    const fakeUpdate = {
      version: '2.10.3',
      body: '### Fixed\n- iets opgelost',
      downloadAndInstall: vi.fn(),
    };
    mockCheck.mockResolvedValueOnce(fakeUpdate);
    expect(await checkForUpdate()).toBe(fakeUpdate);
  });

  it('gooit de fout door bij een mislukte check (bv. geen internet)', async () => {
    mockCheck.mockRejectedValueOnce(new Error('network error'));
    await expect(checkForUpdate()).rejects.toThrow('network error');
  });
});
