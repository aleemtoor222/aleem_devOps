#!/usr/bin/env node
// Broken-link check for the exported site: serves out/ locally (same rules as GitHub Pages, see serve-pages.mjs)
// and crawls it with linkinator. Internal links only: pages, scripts, styles, fonts (inside CSS), images, the CV
// and in-page #fragments. External sites (GitHub, LinkedIn, WhatsApp…) and mailto:/tel: links are skipped, so
// the check never fails because a third party is slow or rate-limits CI.
//
//   npm run check:links                  (after npm run build:pages)
//   npm run check:links -- --verbose     also list every URL that was checked
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LinkChecker } from 'linkinator';
import { startPagesServer } from './serve-pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'out');
if (!fs.existsSync(path.join(dir, 'index.html'))) {
  console.error('✖ out/index.html not found. Run `npm run build:pages` first.');
  process.exit(1);
}

const server = await startPagesServer({ dir, port: 0, hosts: ['127.0.0.1'] });
const origin = `http://127.0.0.1:${server.port}`;
const start = [`${origin}${server.base}/`, `${origin}${server.base}/404.html`];
console.log(`▶ Checking internal links from ${start.map((u) => u.slice(origin.length)).join(' and ')} (base path: ${server.base || 'none'})`);

let exitCode = 1;
try {
  const checker = new LinkChecker();
  const result = await checker.check({
    path: start,
    recurse: true,
    checkCss: true,
    checkFragments: true,
    concurrency: 16,
    timeout: 20_000,
    linksToSkip: async (link) => !link.startsWith(origin),
  });
  const checked = result.links.filter((l) => l.state !== 'SKIPPED');
  const broken = result.links.filter((l) => l.state === 'BROKEN');
  const skipped = result.links.length - checked.length;
  if (process.argv.includes('--verbose')) {
    for (const l of checked) console.log(`  ${l.state === 'OK' ? 'ok ' : '✖  '} [${l.status ?? '-'}] ${l.url.replace(origin, '')}`);
  }
  for (const l of broken) {
    const where = l.parent ? `  (linked from ${l.parent.replace(origin, '')})` : '';
    console.error(`✖ [${l.status ?? 'ERR'}] ${l.url.replace(origin, '')}${where}`);
  }
  console.log(`${broken.length ? '✖' : '✔'} ${checked.length} internal links checked, ${broken.length} broken, ${skipped} external/mailto/tel skipped`);
  exitCode = broken.length ? 1 : 0;
} catch (err) {
  console.error(`✖ Link check crashed: ${err.message}`);
} finally {
  await server.close();
}
process.exit(exitCode);
