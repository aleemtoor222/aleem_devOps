import type { Page } from '@playwright/test';
import { profile } from '../../src/content/profile';
import { collectConsole, expect, gotoHome, scrollThrough, test } from './helpers';

const WIDTHS = [320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920, 2560];

/** Horizontal overflow: the document must not scroll sideways, and no visible element may stick out. */
async function overflowReport(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders: string[] = [];
    for (const el of document.querySelectorAll('header *, main *, footer *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.visibility === 'hidden' || el.closest('dialog:not([open]), [hidden], .sr-only')) continue;
      if (r.right <= vw + 1 && r.left >= -1) continue;
      // fine if an ancestor that fits the viewport clips it (decorative glows, scrollable tab rows…)
      let p = el.parentElement;
      let clipped = false;
      while (p && p !== document.body) {
        if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(p).overflowX)) {
          const pr = p.getBoundingClientRect();
          if (pr.right <= vw + 1 && pr.left >= -1) {
            clipped = true;
            break;
          }
        }
        p = p.parentElement;
      }
      if (!clipped) offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')} [${Math.round(r.left)}, ${Math.round(r.right)}]`);
    }
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: vw, offenders: offenders.slice(0, 10) };
  });
}

test('no horizontal scroll at any width from 320 to 2560 px (home and 404)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'the width sweep runs once, in the desktop project');
  test.setTimeout(180_000);
  await gotoHome(page);
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await scrollThrough(page);
    const r = await overflowReport(page);
    expect.soft(r.scrollWidth, `document scrollWidth at ${width}px`).toBeLessThanOrEqual(r.clientWidth);
    expect.soft(r.offenders, `elements sticking out at ${width}px`).toEqual([]);
  }
  await page.goto('./missing-page-for-layout/');
  for (const width of [320, 375, 1440, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    const r = await overflowReport(page);
    expect.soft(r.scrollWidth, `404 scrollWidth at ${width}px`).toBeLessThanOrEqual(r.clientWidth);
    expect.soft(r.offenders, `404 elements sticking out at ${width}px`).toEqual([]);
  }
});

test('no horizontal scroll on a phone (375 px, touch)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile project only');
  await gotoHome(page);
  await scrollThrough(page);
  const r = await overflowReport(page);
  expect(r.scrollWidth).toBeLessThanOrEqual(r.clientWidth);
  expect(r.offenders).toEqual([]);
});

test('loads and scrolls without console errors or warnings', async ({ page }) => {
  const messages = collectConsole(page);
  await gotoHome(page);
  await page.waitForLoadState('networkidle');
  await scrollThrough(page);
  await page.waitForTimeout(600);
  expect(messages).toEqual([]);
});

test('print: navigation, buttons, terminal and form hidden; name and contact details printed', async ({ page }) => {
  await gotoHome(page);
  await page.emulateMedia({ media: 'print' });
  for (const sel of ['header[data-site-header]', '.fab-stack', '[data-hero-term]', '.tabs', '#contact form', '.footer-nav']) {
    await expect(page.locator(sel).first(), `${sel} should be hidden in print`).toBeHidden();
  }
  const visibleButtons = await page.locator('.btn').evaluateAll((els) => els.filter((e) => e.checkVisibility()).length);
  expect(visibleButtons).toBe(0);

  await expect(page.locator('[data-channel="email"] .contact-value')).toHaveText(profile.email);
  await expect(page.locator('[data-channel="phone"] .contact-value')).toBeVisible();
  await expect(page.locator('footer .footer-copy')).toContainText(profile.name);
  await expect(page.locator('footer .footer-print')).toContainText(profile.email);
});
