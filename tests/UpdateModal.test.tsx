import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRelaunch = vi.fn();
vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: (...args: unknown[]) => mockRelaunch(...args),
}));

import UpdateModal from '../src/components/UpdateModal';

describe('UpdateModal', () => {
  beforeEach(() => {
    mockRelaunch.mockReset();
  });

  it('toont de versie en de patch notes', () => {
    render(
      <UpdateModal
        version="2.10.3"
        notes={'### Fixed\n- iets opgelost'}
        onDownloadAndInstall={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/2\.10\.3/)).toBeTruthy();
    expect(screen.getByText('iets opgelost')).toBeTruthy();
  });

  it('klikken op "Later" roept onDismiss aan zonder te installeren', () => {
    const onDismiss = vi.fn();
    const onDownloadAndInstall = vi.fn();
    render(
      <UpdateModal
        version="2.10.3"
        notes="- iets"
        onDownloadAndInstall={onDownloadAndInstall}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Later/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDownloadAndInstall).not.toHaveBeenCalled();
  });

  it('klikken op "Update nu" downloadt, installeert en herstart', async () => {
    const onDownloadAndInstall = vi.fn().mockResolvedValue(undefined);
    render(
      <UpdateModal
        version="2.10.3"
        notes="- iets"
        onDownloadAndInstall={onDownloadAndInstall}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Update nu/i }));
    await waitFor(() => expect(mockRelaunch).toHaveBeenCalledTimes(1));
    expect(onDownloadAndInstall).toHaveBeenCalledTimes(1);
  });

  it('toont een foutmelding als downloadAndInstall mislukt, app blijft bruikbaar', async () => {
    const onDownloadAndInstall = vi.fn().mockRejectedValue(new Error('fail'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <UpdateModal
        version="2.10.3"
        notes="- iets"
        onDownloadAndInstall={onDownloadAndInstall}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Update nu/i }));
    expect(await screen.findByText(/mislukt/i)).toBeTruthy();
    expect(mockRelaunch).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('Escape-toets roept onDismiss aan (niet tijdens installeren)', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <UpdateModal
        version="2.10.3"
        notes="- iets"
        onDownloadAndInstall={vi.fn()}
        onDismiss={onDismiss}
      />
    );
    const overlay = container.firstChild as HTMLElement;
    fireEvent.keyDown(overlay, { key: 'Escape', code: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
