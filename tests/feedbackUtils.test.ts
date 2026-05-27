// Phase 28 Plan 01 — RED: utils/feedback.ts does not exist yet. All tests must fail.
// Tests covering: ring buffer, setLastImport, buildMailtoUrl, timestamp prefix,
// multi-arg serialization (Error.stack, JSON objects), body truncation at 1500 chars,
// unhandledrejection wiring (tested via pushConsoleError contract).

import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.hoisted() runs before vi.mock() — avoids TDZ errors
const { getMockVersion, getMockPlatform, getMockOsVersion } = vi.hoisted(() => {
  return {
    getMockVersion: () => '1.0.0',
    getMockPlatform: () => 'mock-platform',
    getMockOsVersion: () => 'mock-os-version',
  };
});

vi.mock('@tauri-apps/api/app', () => ({
  getVersion: vi.fn(() => Promise.resolve(getMockVersion())),
}));

vi.mock('@tauri-apps/plugin-os', () => ({
  platform: vi.fn(() => Promise.resolve(getMockPlatform())),
  version: vi.fn(() => Promise.resolve(getMockOsVersion())),
}));

// ── beforeEach: reset module state between tests ─────────────────────────────
import {
  resetFeedbackState,
  pushConsoleError,
  setLastImport,
  buildMailtoUrl,
} from '../utils/feedback';

beforeEach(() => {
  resetFeedbackState();
});

// Helper to decode mailto: URL and extract subject and body
function decodeMailto(url: string): { subject: string; body: string } {
  const questionIdx = url.indexOf('?');
  const params = new URLSearchParams(url.slice(questionIdx + 1));
  return {
    subject: decodeURIComponent(params.get('subject') ?? ''),
    body: decodeURIComponent(params.get('body') ?? ''),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('feedback utils (Phase 28)', () => {

  it('buildMailtoUrl includes recipient', async () => {
    const url = await buildMailtoUrl('');
    expect(url.startsWith('mailto:ralvarezstam@cioszuidwest.nl?')).toBe(true);
  });

  it('buildMailtoUrl encodes subject with version and OS', async () => {
    const url = await buildMailtoUrl('');
    const { subject } = decodeMailto(url);
    expect(subject).toBe('[Bug] Mentordashboard v1.0.0 — mock-platform');
  });

  it('buildMailtoUrl body includes description when provided', async () => {
    const url = await buildMailtoUrl('Crash bij importeren');
    const { body } = decodeMailto(url);
    expect(body).toContain('Crash bij importeren');
  });

  it('buildMailtoUrl body includes OS section', async () => {
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).toContain('OS: mock-platform mock-os-version');
  });

  it('buildMailtoUrl body includes app version', async () => {
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).toContain('App-versie: 1.0.0');
  });

  it('buildMailtoUrl body — no import — shows fallback', async () => {
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).toContain('Geen importactie geregistreerd');
  });

  it('setLastImport then buildMailtoUrl — shows filename', async () => {
    setLastImport({ filename: 'test.pdf', type: 'PDF' });
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).toContain('test.pdf (PDF)');
  });

  it('buildMailtoUrl body — empty ring buffer — shows fallback', async () => {
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).toContain('Geen console errors geregistreerd');
  });

  it('pushConsoleError then buildMailtoUrl — includes error', async () => {
    pushConsoleError(['ERR: boom']);
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).toContain('ERR: boom');
  });

  it('ring buffer caps at 10 entries', async () => {
    // Push 12 entries — entries 01 and 02 should be evicted (zero-padded to avoid substring collision)
    for (let i = 1; i <= 12; i++) {
      pushConsoleError([`entry-${String(i).padStart(2, '0')}`]);
    }
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).not.toContain('entry-01');
    expect(body).not.toContain('entry-02');
    expect(body).toContain('entry-12');
  });

  it('pushConsoleError truncates at 200 chars per entry', async () => {
    // The 300-char string as single arg should be truncated to at most 200 chars
    // (excluding the timestamp prefix)
    const longString = 'x'.repeat(300);
    pushConsoleError([longString]);
    // We verify via the module — but since we can't access errorBuffer directly,
    // we verify via the body that not all 300 chars appear in the stored entry
    // The entry itself (after timestamp) should be at most 200 chars
    // We test this indirectly: the total stored entry must not exceed 200 + timestamp length
    // For direct verification, we need to check what's stored. We'll verify via buildMailtoUrl:
    // The body should contain 'x' repeated at most 200 times consecutively
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    // Find the longest run of 'x' in the body
    const match = body.match(/x+/);
    const longestRun = match ? match[0].length : 0;
    expect(longestRun).toBeLessThanOrEqual(200);
  });

  it('ring buffer entries include timestamp prefix', async () => {
    pushConsoleError(['hello']);
    // We need to verify the stored entry has a timestamp prefix
    // We check indirectly via buildMailtoUrl
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    // The entry should match a timestamp pattern [HH:MM:SS] hello
    expect(body).toMatch(/\[\d{2}:\d{2}:\d{2}\] hello/);
  });

  it('pushConsoleError with Error object uses .stack', async () => {
    const err = new Error('fail');
    err.stack = 'Error: fail\n  at test:1:1';
    pushConsoleError([err]);
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).toContain('Error: fail');
  });

  it('pushConsoleError with multiple args joins them', async () => {
    const err = new Error('boom');
    err.stack = 'Error: boom\n  at test:1:1';
    pushConsoleError(['label:', err]);
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).toContain('label:');
    expect(body).toContain('Error: boom');
  });

  it('pushConsoleError with plain object JSON-stringifies it', async () => {
    pushConsoleError([{ code: 42 }]);
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    // Should contain JSON-stringified object with code:42
    expect(body.includes('"code":42') || body.includes('{"code":42}')).toBe(true);
  });

  it('buildMailtoUrl body truncates at 1500 chars', async () => {
    // Push 10 entries of 200 'x' chars each — total error content ~2000 chars plus metadata
    for (let i = 0; i < 10; i++) {
      pushConsoleError(['x'.repeat(200)]);
    }
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).toContain('[ingekort wegens e-mail limiet]');
  });

  it('buildMailtoUrl body under 1500 chars — no truncation marker', async () => {
    // Empty ring buffer, no import — body should be well under 1500 chars
    const url = await buildMailtoUrl('');
    const { body } = decodeMailto(url);
    expect(body).not.toContain('[ingekort wegens e-mail limiet]');
  });

});
