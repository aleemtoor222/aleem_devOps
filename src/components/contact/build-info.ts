// Server-only: reads public/build-info.json, which the GitHub Pages workflow writes before building
// ({"sha":"abc1234","date":"2026-10-26"}). Locally the file does not exist and this returns null.
import fs from 'node:fs';
import path from 'node:path';

export type BuildInfo = { sha: string; date: string };

export function readBuildInfo(): BuildInfo | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'build-info.json'), 'utf8')) as Partial<BuildInfo>;
    const sha = typeof raw.sha === 'string' ? raw.sha.trim() : '';
    const date = typeof raw.date === 'string' ? raw.date.trim() : '';
    if (!/^[0-9a-f]{7,40}$/i.test(sha) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return { sha: sha.slice(0, 7).toLowerCase(), date };
  } catch {
    return null;
  }
}
