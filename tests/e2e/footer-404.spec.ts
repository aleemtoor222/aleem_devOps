import fs from 'node:fs';
import path from 'node:path';
import { sections } from '../../src/content/derive';
import { profile } from '../../src/content/profile';
import { basePathOf, collectConsole, expect, gotoHome, test } from './helpers';

test.describe('footer', () => {
  test('section links, icon links, current year and build line', async ({ page, baseURL }) => {
    const base = basePathOf(baseURL);
    await gotoHome(page);
    const footer = page.locator('footer.site-footer');

    const nav = footer.getByRole('navigation', { name: 'Footer' });
    await expect(nav.getByRole('link')).toHaveCount(sections.length);
    for (const s of sections) await expect(nav.getByRole('link', { name: s.label, exact: true })).toHaveAttribute('href', `${base}/#${s.id}`);

    const icons = [
      { name: 'Email', href: `mailto:${profile.email}`, external: false },
      { name: 'WhatsApp (opens in a new tab)', href: profile.whatsapp, external: true },
      { name: 'GitHub (opens in a new tab)', href: profile.github, external: true },
      { name: 'LinkedIn (opens in a new tab)', href: profile.linkedin, external: true },
    ];
    for (const icon of icons) {
      const a = footer.getByRole('link', { name: icon.name, exact: true });
      await expect(a).toHaveAttribute('href', icon.href);
      await expect(a).toHaveAttribute('data-tip', icon.name.replace(' (opens in a new tab)', ''));
      if (icon.external) {
        await expect(a).toHaveAttribute('target', '_blank');
        await expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      }
      const box = await a.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    const year = String(new Date().getFullYear());
    await expect(footer.locator('#footer-year')).toHaveText(year);
    await expect(footer).toContainText(`© ${year} ${profile.name}`);
    await expect(footer.getByText('~/aleem.dev')).toBeVisible();

    // public/build-info.json only exists in the GitHub Actions deploy build
    const info = path.join(process.cwd(), 'public', 'build-info.json');
    if (fs.existsSync(info)) {
      const { sha } = JSON.parse(fs.readFileSync(info, 'utf8'));
      await expect(footer.locator('.footer-build')).toContainText(`build ${String(sha).slice(0, 7)}`);
    } else {
      await expect(footer.locator('.footer-build')).toHaveCount(0);
    }
  });

  test('"Back to top" returns to the top of the page', async ({ page, baseURL }) => {
    const base = basePathOf(baseURL);
    await gotoHome(page);
    const top = page.locator('footer.site-footer').getByRole('link', { name: 'Back to top' });
    await expect(top).toHaveAttribute('href', `${base}/#top`);
    await top.scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await top.click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBeLessThan(5);
  });
});

test.describe('404 page', () => {
  test('is served for unknown paths under the base path, styled, and links home', async ({ page, baseURL }) => {
    const base = basePathOf(baseURL);
    const console = collectConsole(page);
    const failed: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400 && !r.url().includes('/no-such-page/')) failed.push(`${r.status()} ${r.url()}`);
    });

    const res = await page.goto('./no-such-page/deeper/');
    expect(res?.status()).toBe(404);
    await expect(page).toHaveTitle(/404/);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByText('404: route not found')).toBeVisible();
    await expect(page.locator('#nf-path')).toHaveText('/no-such-page/deeper/');
    // the stylesheet and fonts under /_next loaded (base path applied to asset URLs)
    await expect.poll(() => page.locator('.nf-term').evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');

    const home = page.getByRole('link', { name: /cd ~/ });
    await expect(home).toHaveAttribute('href', new RegExp(`^${base}/?$`));
    await home.click();
    await expect(page).toHaveURL(new RegExp(`${base}/?(#.*)?$`));
    await expect(page.locator('#contact')).toBeAttached();

    expect(failed).toEqual([]);
    // the 404 status of the page itself is expected; nothing else may complain
    expect(console.filter((m) => !/status of 404/.test(m))).toEqual([]);
  });
});
