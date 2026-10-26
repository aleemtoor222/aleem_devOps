import { test as base, expect, type Page } from '@playwright/test';

export { expect };

/**
 * Every spec imports `test` from here. The real Web3Forms key is in the code, so as a safety net every test
 * starts with api.web3forms.com blocked at the browser-context level: nothing can ever reach the real API.
 * Tests that exercise the form install their own mock with mockWeb3Forms() (page routes win over context routes).
 */
export const test = base.extend<{ blockRealSubmissions: void }>({
  blockRealSubmissions: [
    async ({ context }, use) => {
      await context.route('https://api.web3forms.com/**', (route) => route.abort('blockedbyclient'));
      await use();
    },
    { auto: true },
  ],
});

/** Base path of the site under test ("/portfolio" or ""), taken from the baseURL. */
export function basePathOf(baseURL: string | undefined) {
  return new URL(baseURL ?? 'http://localhost:3402/').pathname.replace(/\/+$/, '');
}

/** Open the home page (optionally at a #hash) and wait until React has hydrated the contact form. */
export async function gotoHome(page: Page, hash = '') {
  const response = await page.goto(`./${hash}`);
  await expect(page.locator('#contact form.contact-form')).toHaveAttribute('data-ready', 'true', { timeout: 20_000 });
  return response;
}

/** Collect console errors/warnings and uncaught exceptions. */
export function collectConsole(page: Page) {
  const messages: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') messages.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => messages.push(`[pageerror] ${e.message}`));
  return messages;
}

/** Scroll through the whole page (triggers scroll reveals and observers), then back to the top. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
}

type MockReply = { status?: number; body?: unknown; abort?: boolean; delayMs?: number };

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
};

/** Fake the Web3Forms API. Returns the JSON bodies that were posted (preflights are not counted). */
export async function mockWeb3Forms(page: Page, reply: MockReply) {
  const calls: Record<string, unknown>[] = [];
  await page.route('https://api.web3forms.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    try {
      calls.push(req.postDataJSON() as Record<string, unknown>);
    } catch {
      calls.push({ raw: req.postData() });
    }
    if (reply.delayMs) await new Promise((r) => setTimeout(r, reply.delayMs));
    if (reply.abort) return route.abort('failed');
    return route.fulfill({
      status: reply.status ?? 200,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(reply.body ?? { success: true }),
    });
  });
  return calls;
}
