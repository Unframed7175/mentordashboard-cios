/* utils/feedback.ts — Ring buffer, last import tracking, and mailto: URL builder (Phase 28)
 * Pure TypeScript module — no React imports, no side effects at module load time.
 * Exports: DEVELOPER_EMAIL, pushConsoleError, resetFeedbackState, setLastImport,
 *          getSystemInfo, initSystemInfo, buildMailtoUrl
 */

import { getVersion } from '@tauri-apps/api/app';
import { platform, version } from '@tauri-apps/plugin-os';

// ── Constants ─────────────────────────────────────────────────────────────────

export const DEVELOPER_EMAIL = 'ralvarezstam@cioszuidwest.nl';

// ── Module-level state ────────────────────────────────────────────────────────

const errorBuffer: string[] = [];

let lastImport: { filename: string; type: 'PDF' | 'Excel' | 'zip'; timestamp: string } | null = null;

let systemInfoCache: { platform: string; osVersion: string; appVersion: string } | null = null;

// ── Internal serializer ───────────────────────────────────────────────────────

function serializeArgs(args: unknown[]): string {
  const parts: string[] = args.map((arg) => {
    if (arg instanceof Error) {
      return arg.stack ?? String(arg);
    }
    if (typeof arg === 'object' && arg !== null) {
      return JSON.stringify(arg);
    }
    return String(arg);
  });
  const joined = parts.join(' ');
  // Truncate to 200 characters
  return joined.length > 200 ? joined.slice(0, 200) : joined;
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Push console error args into the ring buffer (max 10 entries).
 * Each entry is timestamped and the serialized content is capped at 200 chars.
 */
export function pushConsoleError(args: unknown[]): void {
  const content = serializeArgs(args);
  const timestamp = new Date().toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const entry = `[${timestamp}] ${content}`;
  errorBuffer.push(entry);
  if (errorBuffer.length > 10) {
    errorBuffer.shift();
  }
}

/**
 * Reset all module state — for tests only.
 */
export function resetFeedbackState(): void {
  errorBuffer.length = 0;
  lastImport = null;
  systemInfoCache = null;
}

/**
 * Record the last import action for inclusion in the feedback email.
 */
export function setLastImport(info: { filename: string; type: 'PDF' | 'Excel' | 'zip' }): void {
  lastImport = {
    filename: info.filename,
    type: info.type,
    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
}

/**
 * Fetch OS and app version info from Tauri APIs.
 */
export async function getSystemInfo(): Promise<{ platform: string; osVersion: string; appVersion: string }> {
  const [platformStr, osVersionStr, appVersionStr] = await Promise.all([
    platform(),
    version(),
    getVersion(),
  ]);
  return {
    platform: platformStr,
    osVersion: osVersionStr,
    appVersion: appVersionStr,
  };
}

/**
 * Pre-cache system info at startup so buildMailtoUrl is synchronous for the user.
 */
export async function initSystemInfo(): Promise<void> {
  systemInfoCache = await getSystemInfo();
}

// Maximum encoded body length (in URL-encoded chars). Keeps the full mailto: URL
// well within Windows ShellExecute's ~2048-char practical limit.
const MAX_ENCODED_BODY = 1800;

// Truncation marker appended when content is cut to fit the budget.
const TRUNCATION_MARKER = '...\n[ingekort wegens e-mail limiet]';

/**
 * Build a mailto: URL with all available feedback data.
 * Body is capped so that encodeURIComponent(body).length <= MAX_ENCODED_BODY.
 */
export async function buildMailtoUrl(description: string): Promise<string> {
  const info = systemInfoCache ?? (await getSystemInfo());

  const subject = `[Bug] Mentordashboard v${info.appVersion} — ${info.platform}`;

  const importLine = lastImport
    ? `${lastImport.filename} (${lastImport.type}), ${lastImport.timestamp}`
    : 'Geen importactie geregistreerd';

  function assembleBody(errors: string[], truncated: boolean): string {
    const descSection = `Beschrijving:\n${description.trim()}\n\n`;
    const techSection =
      `--- Technische info ---\n` +
      `OS: ${info.platform} ${info.osVersion}\n` +
      `App-versie: ${info.appVersion}\n` +
      `Laatste import: ${importLine}`;

    const errorsSection =
      `\n\n--- Console errors (laatste 10) ---\n` +
      (errors.length > 0 ? errors.join('\n') : 'Geen console errors geregistreerd');

    const truncationMarker = truncated ? '\n[ingekort wegens e-mail limiet]' : '';

    return descSection + techSection + errorsSection + truncationMarker;
  }

  // First attempt: full body — check encoded length, not raw length
  let body = assembleBody([...errorBuffer], false);

  if (encodeURIComponent(body).length <= MAX_ENCODED_BODY) {
    return `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  // Body over budget — try truncated errors (max 5 entries, 100 chars each)
  const truncatedErrors = errorBuffer.slice(-5).map((entry) => {
    // Preserve timestamp prefix, truncate content after it
    const bracketEnd = entry.indexOf('] ');
    if (bracketEnd !== -1) {
      const prefix = entry.slice(0, bracketEnd + 2);
      const content = entry.slice(bracketEnd + 2);
      return prefix + (content.length > 100 ? content.slice(0, 100) : content);
    }
    return entry.length > 100 ? entry.slice(0, 100) : entry;
  });

  body = assembleBody(truncatedErrors, true);

  // Hard truncate: iteratively slice until encoded length fits within budget
  if (encodeURIComponent(body).length > MAX_ENCODED_BODY) {
    let safe = body.slice(0, body.length - TRUNCATION_MARKER.length) + TRUNCATION_MARKER;
    while (encodeURIComponent(safe).length > MAX_ENCODED_BODY) {
      // Reduce by 50 raw chars per iteration — fast convergence
      safe = safe.slice(0, safe.length - TRUNCATION_MARKER.length - 50) + TRUNCATION_MARKER;
    }
    body = safe;
  }

  return `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
