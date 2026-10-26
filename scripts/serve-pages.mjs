#!/usr/bin/env node
// Dependency-free static server for the exported site (out/) that behaves like GitHub Pages:
//   - serves the site under its base path (auto-detected from out/index.html, or --base /portfolio)
//   - /dir → 301 /dir/,  /dir/ → dir/index.html,  /page → page.html
//   - anything missing gets out/404.html with status 404
//   - correct MIME types (RSC payloads are .txt → text/plain, as on GitHub Pages)
//
//   npm run preview:pages                      http://localhost:3402/
//   node scripts/serve-pages.mjs --port 3402 --dir out --base /portfolio
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.vcf': 'text/vcard; charset=utf-8',
  '.wasm': 'application/wasm',
};

const normalizeBase = (b) => {
  const s = String(b ?? '').trim().replace(/\/+$/, '');
  return s && !s.startsWith('/') ? `/${s}` : s;
};

/** Base path the export was built with, read from the asset URLs in index.html ("" when none). */
export function detectBasePath(dir) {
  try {
    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    const m = html.match(/(?:src|href)="([^"]*?)\/_next\/static\//);
    if (!m) return '';
    const prefix = m[1].startsWith('http') ? new URL(m[1]).pathname : m[1];
    return normalizeBase(prefix);
  } catch {
    return '';
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}
function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function createPagesServer({ dir = path.join(root, 'out'), base = '', log = false } = {}) {
  const siteDir = path.resolve(dir);
  base = normalizeBase(base);
  const notFoundPage = path.join(siteDir, '404.html');

  function send(req, res, status, file, extraHeaders = {}) {
    const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
    const size = fs.statSync(file).size;
    res.writeHead(status, { 'Content-Type': type, 'Content-Length': size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', ...extraHeaders });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  }
  function notFound(req, res) {
    if (isFile(notFoundPage)) return send(req, res, 404, notFoundPage);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
  function redirect(res, location) {
    res.writeHead(301, { Location: location, 'Cache-Control': 'no-cache' });
    res.end();
  }

  return http.createServer((req, res) => {
    if (log) res.on('finish', () => console.log(`${res.statusCode} ${req.method} ${req.url}`));
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
    let url;
    let pathname;
    try {
      url = new URL(req.url ?? '/', 'http://localhost');
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('400 Bad Request');
    }
    if (pathname.includes('\0')) return notFound(req, res);

    if (base) {
      // GitHub Pages serves a project site only under /<repo>/; locally, "/" jumps there for convenience.
      if (pathname === '/') return redirect(res, `${base}/`);
      if (pathname === base) return redirect(res, `${base}/${url.search}`);
      if (!pathname.startsWith(`${base}/`)) return notFound(req, res);
      pathname = pathname.slice(base.length);
    }

    const target = path.resolve(siteDir, `.${pathname}`);
    if (target !== siteDir && !target.startsWith(siteDir + path.sep)) return notFound(req, res);

    if (pathname.endsWith('/')) {
      const index = path.join(target, 'index.html');
      return isFile(index) ? send(req, res, 200, index) : notFound(req, res);
    }
    if (isFile(target)) return send(req, res, 200, target);
    if (isDir(target)) return redirect(res, `${base}${encodeURI(pathname)}/${url.search}`);
    if (isFile(`${target}.html`)) return send(req, res, 200, `${target}.html`);
    return notFound(req, res);
  });
}

/** Start the server on 127.0.0.1 and ::1 (so "localhost" works either way). Port 0 picks a free port. */
export async function startPagesServer({ dir = path.join(root, 'out'), base, port = 3402, log = false, hosts = ['127.0.0.1', '::1'] } = {}) {
  const resolvedBase = normalizeBase(base ?? detectBasePath(dir));
  const servers = [];
  let actualPort = port;
  for (const host of hosts) {
    const server = createPagesServer({ dir, base: resolvedBase, log });
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(actualPort, host, resolve);
      });
      actualPort = server.address().port;
      servers.push(server);
    } catch (err) {
      if (host === '::1' && servers.length) continue; // no IPv6 loopback on this machine: IPv4 is enough
      for (const s of servers) s.close();
      throw err;
    }
  }
  return {
    port: actualPort,
    base: resolvedBase,
    close: () => Promise.all(servers.map((s) => new Promise((r) => s.close(r)))),
  };
}

// CLI
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
  };
  const dir = path.resolve(opt('dir', path.join(root, 'out')));
  if (!isFile(path.join(dir, 'index.html'))) {
    console.error(`✖ ${path.relative(process.cwd(), dir) || dir}/index.html not found. Run \`npm run build:pages\` first.`);
    process.exit(1);
  }
  const port = Number(opt('port', 3402));
  const base = opt('base', undefined); // default: read from the export itself, so it always matches the build
  try {
    const s = await startPagesServer({ dir, base, port, log: args.includes('--log') });
    console.log(`▶ Serving ${path.relative(root, dir) || dir}/ at http://localhost:${s.port}${s.base}/  (missing paths → 404.html, Ctrl+C to stop)`);
  } catch (err) {
    console.error(err.code === 'EADDRINUSE' ? `✖ Port ${port} is already in use. Try: npm run preview:pages -- --port 3403` : `✖ ${err.message}`);
    process.exit(1);
  }
}
