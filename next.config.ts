import type { NextConfig } from "next";

// Two build modes from one config:
//
//   default           `next build` + `next start`: the self-hosted Node server (standalone output, security headers).
//   STATIC_EXPORT=1   GitHub Pages: plain HTML/CSS/JS in out/. Only ever run it through `npm run build:pages`.
//
// Why the export must go through scripts/build-pages.mjs: with output:"export", Next.js 16 always writes its
// intermediate build files to <project>/.next. A custom `distDir` only renames the *export* folder (see
// node_modules/next/dist/export/utils.js, getBuildDistDir). On a machine where `next start` is serving .next/,
// an in-place export build would replace the live build. The script builds an isolated copy in .pages-build/
// instead and moves the finished site to out/.
const isExport = process.env.STATIC_EXPORT === "1";
const isDev = process.env.NODE_ENV !== "production";

if (isExport && process.env.PAGES_ISOLATED_BUILD !== "1") {
  throw new Error(
    "STATIC_EXPORT=1 must be built with `npm run build:pages`. A direct `next build` with output:'export' writes " +
      "its build files into .next/ and would replace the build that `next start` is serving.",
  );
}

/** "/portfolio" for a GitHub Pages project site, "" for a user site or a custom domain. */
const basePath = (() => {
  const raw = (process.env.PAGES_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "").trim().replace(/\/+$/, "");
  return raw && !raw.startsWith("/") ? `/${raw}` : raw;
})();
/** Public URL without a trailing slash, e.g. https://aleemtoor222.github.io/portfolio (set by the Pages workflow). */
const siteUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");

// Everything loads from this origin (next/font self-hosts the fonts). The browser talks to one outside API:
// Web3Forms, for the contact form (fetch, or a plain form post without JavaScript).
// 'unsafe-inline' scripts: Next.js bootstrap scripts without a nonce setup; 'unsafe-eval' only for dev (React Refresh).
// If you turn on GoatCounter (site.goatcounterCode), add https://gc.zgo.at to script-src and
// https://<code>.goatcounter.com to connect-src and img-src.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' https://api.web3forms.com${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  // The contact form's no-JavaScript fallback posts straight to Web3Forms
  "form-action 'self' https://api.web3forms.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const shared: NextConfig = {
  basePath,
  poweredByHeader: false,
  // Inlined at build time; read through src/lib/site.ts (asset()) and src/content/profile.ts (site.url)
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const nextConfig: NextConfig = isExport
  ? {
      ...shared,
      // Static HTML in out/ (index.html, 404.html, _next/…). GitHub Pages has no server, so no headers() here.
      output: "export",
      // /page → /page/index.html, the layout GitHub Pages serves without extra configuration
      trailingSlash: true,
      images: { unoptimized: true },
      // A handful of pages: two build workers are plenty and keep memory use low on small machines
      experimental: { cpus: 2 },
      // `npm run build:pages -- --skip-typecheck` (low-memory machines) skips the in-build type check;
      // run `npx tsc --noEmit` on its own instead. CI always type-checks.
      typescript: { ignoreBuildErrors: process.env.PAGES_SKIP_TYPECHECK === "1" },
    }
  : {
      ...shared,
      // Self-contained server in .next/standalone, ready for a Docker image
      output: "standalone",
      async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
      },
    };

export default nextConfig;
