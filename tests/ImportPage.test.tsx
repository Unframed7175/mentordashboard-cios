// tests/ImportPage.test.tsx — M36 T2: reload alléén na v2-overschrijven-restore
// v1- en samenvoegen-restores houden bestaande UX (onImportComplete → view 'klas').

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const { mockApplyBackupRestore, mockSaveKlassen, mockSwitchActiveKlas, mockKlassenState } =
  vi.hoisted(() => ({
    mockApplyBackupRestore: vi.fn(),
    mockSaveKlassen: vi.fn().mockResolvedValue(true),
    mockSwitchActiveKlas: vi.fn().mockResolvedValue(undefined),
    mockKlassenState: { klassen: {} as Record<string, unknown>, activeKlasId: null as string | null, onboardingCompleted: true },
  }));

vi.mock('../utils/backup', () => ({
  applyBackupRestore: mockApplyBackupRestore,
}));

vi.mock('../utils/klassen', () => ({
  klassenState: mockKlassenState,
  saveKlassen: mockSaveKlassen,
  switchActiveKlas: mockSwitchActiveKlas,
  createKlas: vi.fn(),
}));

vi.mock('../parsers/pdf', () => ({ parseSinglePDF: vi.fn() }));
vi.mock('../parsers/excel', () => ({ parseExcelFile: vi.fn() }));
vi.mock('../utils/bpv', () => ({
  parseBpvExcel: vi.fn(),
  saveBpvData: vi.fn(),
  getBpvData: vi.fn(),
}));
vi.mock('../utils/feedback', () => ({ setLastImport: vi.fn() }));
vi.mock('../utils/zipPdfs', () => ({ extractPdfsFromZip: vi.fn().mockResolvedValue([]) }));
vi.mock('../utils/datamodel', () => ({ addStudent: vi.fn(), mergeVerzuim: vi.fn() }));

import ImportPage from '../src/components/ImportPage';

function makeBackupZipFile(): File {
  // PK magic bytes zodat checkMagicBytes(file, 'zip') slaagt
  return new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00])], 'backup.zip', {
    type: 'application/zip',
  });
}

async function uploadBackup(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).not.toBeNull();
  fireEvent.change(input, { target: { files: [makeBackupZipFile()] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockKlassenState.klassen = {};
  mockKlassenState.activeKlasId = null;
});

describe('ImportPage backup-restore reload-gedrag (M36 T2)', () => {
  it('v2-overschrijven-restore (reloadRequired) triggert reload en slaat onImportComplete over', async () => {
    mockApplyBackupRestore.mockResolvedValue({
      success: true,
      message: 'Backup hersteld',
      reloadRequired: true,
    });
    const onImportComplete = vi.fn();
    const reloadFn = vi.fn();

    const { container } = render(
      <ImportPage onImportComplete={onImportComplete} reloadFn={reloadFn} />
    );
    await uploadBackup(container);

    await waitFor(() => expect(reloadFn).toHaveBeenCalledTimes(1));
    expect(onImportComplete).not.toHaveBeenCalled();
  });

  it('restore zonder reloadRequired (v1/samenvoegen) houdt bestaande UX: onImportComplete, géén reload', async () => {
    mockApplyBackupRestore.mockResolvedValue({
      success: true,
      message: 'Backup hersteld',
    });
    const onImportComplete = vi.fn();
    const reloadFn = vi.fn();

    const { container } = render(
      <ImportPage onImportComplete={onImportComplete} reloadFn={reloadFn} />
    );
    await uploadBackup(container);

    await waitFor(() => expect(onImportComplete).toHaveBeenCalledTimes(1));
    expect(reloadFn).not.toHaveBeenCalled();
  });

  it('mislukte restore triggert géén reload en géén onImportComplete', async () => {
    mockApplyBackupRestore.mockResolvedValue({
      success: false,
      message: 'Ongeldige backup structuur',
    });
    const onImportComplete = vi.fn();
    const reloadFn = vi.fn();

    const { container } = render(
      <ImportPage onImportComplete={onImportComplete} reloadFn={reloadFn} />
    );
    await uploadBackup(container);

    await waitFor(() => expect(mockApplyBackupRestore).toHaveBeenCalled());
    expect(reloadFn).not.toHaveBeenCalled();
    expect(onImportComplete).not.toHaveBeenCalled();
  });
});
