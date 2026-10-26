// End-to-end tests against the static export (npm run build:pages → npm run preview:pages).
// Uses the Microsoft Edge that is already installed (channel 'msedge'): Playwright never downloads browsers here.
//
//   npm run test:e2e                                                   site at http://localhost:3402/
//   $env:E2E_BASE_URL="http://localhost:3402/portfolio/"; npm run test:e2e   export built with a base path
import fs from 'node:fs';
import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3402/';
const usesPreview = new URL(baseURL).port === '3402';

// Screenshots, traces and downloads stay on D: on the author's machine (C: is nearly full); elsewhere ./test-results
const qaDir = 'D:/kubeSecOps-qa-work/portfolio-v2/agent';
const outputDir = process.env.E2E_OUTPUT_DIR || (process.platform === 'win32' && fs.existsSync(qaDir) ? `${qaDir}/test-results` : 'test-results');

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir,
  fullyParallel: false,
  workers: 1, // one browser at a time: easy on memory
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [['list']],
  use: {
    baseURL,
    channel: 'msedge',
    headless: true,
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    acceptDownloads: true,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
  // Starts the static preview if nothing is listening on 3402 yet (reuses a running one)
  webServer: usesPreview
    ? { command: 'node scripts/serve-pages.mjs --port 3402', url: 'http://localhost:3402/', reuseExistingServer: true, timeout: 30_000 }
    : undefined,
});
