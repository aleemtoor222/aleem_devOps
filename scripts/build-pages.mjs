#!/usr/bin/env node
// Static export for GitHub Pages, built from an isolated copy of the project.
//
//   npm run build:pages                                   site for http://localhost/ (no base path)
//   $env:PAGES_BASE_PATH="/portfolio"; npm run build:pages  site for https://<user>.github.io/portfolio/
//
// Why a copy: with output:"export", Next.js 16 always writes its intermediate build files to <project>/.next
// (a custom distDir only renames the export folder; see node_modules/next/dist/export/utils.js). On this machine
// .next/ is the build the live `next start` server is serving, so an in-place export would replace it.
// This script copies the sources to .pages-build/, builds there, moves the finished site to out/ and deletes the
// copy. It also checks that .next/BUILD_ID is untouched and fails loudly if it ever changes.
//
// Env: PAGES_BASE_PATH (e.g. /portfolio), SITE_URL (e.g. https://aleemtoor222.github.io/portfolio).
// Flag: --skip-typecheck  skips Next's in-build type check to save memory on small machines
//       (then run `npx tsc --noEmit` on its own). CI never uses it.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stage = path.join(root, '.pages-build');
const outDir = path.join(root, 'out');
const liveBuildId = path.join(root, '.next', 'BUILD_ID');

// What the build needs. Tests, scripts, docs and node_modules stay where they are (modules resolve from the parent).
// Never copy package-lock.json: Turbopack treats the folder holding the lockfile as the workspace root, and the
// root must contain node_modules (it stays the project folder this way).
const COPY =['src', 'public', 'next.config.ts', 'tsconfig.json', 'package.json', 'next-env.d.ts', 'postcss.config.mjs', '.env', '.env.production'];

const rm = (p) => fs.rmSync(p, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Move a folder. Windows can briefly lock freshly written files (indexer, antivirus), so retry, then copy. */
async function moveDir(from, to) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (err) {
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) throw err;
      await sleep(250 * (attempt + 1));
    }
  }
  fs.cpSync(from, to, { recursive: true });
}
const stamp = () => (fs.existsSync(liveBuildId) ? fs.statSync(liveBuildId).mtimeMs : null);

function dirStats(dir) {
  let files = 0;
  let bytes = 0;
  const byExt = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    const size = fs.statSync(path.join(entry.parentPath, entry.name)).size;
    const ext = path.extname(entry.name) || '(none)';
    files += 1;
    bytes += size;
    byExt[ext] = (byExt[ext] ?? 0) + size;
  }
  return { files, bytes, byExt };
}
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

function run(cmd, args, options) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...options });
    const forward = (signal) => child.kill(signal);
    process.on('SIGINT', forward);
    process.on('SIGTERM', forward);
    child.on('exit', (code, signal) => {
      process.off('SIGINT', forward);
      process.off('SIGTERM', forward);
      resolve(signal ? 1 : (code ?? 1));
    });
  });
}

const basePath = process.env.PAGES_BASE_PATH ?? '';
const siteUrl = process.env.SITE_URL ?? '';
const skipTypecheck = process.argv.includes('--skip-typecheck');
console.log(
  `▶ Static export  base path: ${basePath || '(none)'}  site URL: ${siteUrl || '(not set)'}${skipTypecheck ? '  (type check skipped)' : ''}`,
);

const before = stamp();
const started = Date.now();
rm(stage);
fs.mkdirSync(stage, { recursive: true });
for (const name of COPY) {
  const from = path.join(root, name);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(stage, name), { recursive: true });
}

let status = 1;
try {
  status = await run(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], {
    cwd: stage, // Tailwind scans its sources relative to the working directory
    env: {
      ...process.env,
      STATIC_EXPORT: '1',
      PAGES_ISOLATED_BUILD: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      ...(skipTypecheck ? { PAGES_SKIP_TYPECHECK: '1' } : {}),
    },
  });
  if (status === 0) {
    const exported = path.join(stage, 'out');
    if (!fs.existsSync(path.join(exported, 'index.html'))) throw new Error('The build finished but .pages-build/out/index.html is missing.');
    rm(outDir);
    await moveDir(exported, outDir);
  }
} catch (err) {
  console.error(`✖ ${err.message}`);
  status = 1;
} finally {
  rm(stage);
}

const after = stamp();
if (before !== after) {
  console.error('✖ .next/BUILD_ID changed during the export build. The live server build was touched: rebuild it with `npm run build`.');
  process.exit(1);
}
if (status !== 0) {
  console.error('✖ Static export failed (see the Next.js output above).');
  process.exit(status);
}

const { files, bytes, byExt } = dirStats(outDir);
const top = Object.entries(byExt)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([ext, size]) => `${ext} ${kb(size)}`)
  .join(', ');
console.log(`✔ out/ ready in ${((Date.now() - started) / 1000).toFixed(1)}s: ${files} files, ${kb(bytes)} (${top})`);
console.log(`  .next/ untouched${before === null ? ' (no server build present)' : ''}. Preview: npm run preview:pages`);
