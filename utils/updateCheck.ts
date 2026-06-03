import { getVersion } from '@tauri-apps/api/app';

const REPO = 'Unframed7175/mentordashboard-cios';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

function parseSemver(v: string): [number, number, number] {
  const clean = v.replace(/^v/, '');
  const parts = clean.split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function isNewer(latest: string, current: string): boolean {
  const [lMaj, lMin, lPat] = parseSemver(latest);
  const [cMaj, cMin, cPat] = parseSemver(current);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}

export interface UpdateInfo {
  version: string;
  url: string;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const current = await getVersion();
    const res = await fetch(API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const tag: string = data.tag_name ?? '';
    if (!tag || !isNewer(tag, current)) return null;
    return {
      version: tag.replace(/^v/, ''),
      url: `https://github.com/${REPO}/releases/tag/${tag}`,
    };
  } catch {
    return null;
  }
}
