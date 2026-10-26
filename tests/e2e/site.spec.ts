// Whole-page behaviour (header, hero terminal, pipeline, work, stack, experience, palette, floating actions).
import type { Page } from '@playwright/test';
import { profile, projects } from '../../src/content/profile';
import { expect, gotoHome, test } from './helpers';

const desktopOnly = (name: string) => test.skip(name !== 'desktop', 'desktop layout');
const mobileOnly = (name: string) => test.skip(name !== 'mobile', 'mobile layout');
const topOf = (page: Page, id: string) => page.evaluate((i) => document.getElementById(i)!.getBoundingClientRect().top, id);

test('the page has every section', async ({ page }) => {
  await gotoHome(page);
  for (const id of ['top', 'ship', 'work', 'stack', 'experience', 'contact']) await expect(page.locator(`section#${id}`)).toBeAttached();
  await expect(page.locator('main h1')).toHaveCount(1);
});

test.describe('header', () => {
  test('nav links and scroll-spy (aria-current)', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await gotoHome(page);
    const nav = page.getByRole('navigation', { name: 'Main' });
    for (const name of ['01. Work', '02. Stack', '03. Experience', '04. Contact']) await expect(nav.getByRole('link', { name })).toBeVisible();
    await page.locator('#stack').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(nav.getByRole('link', { name: '02. Stack' })).toHaveAttribute('aria-current', 'true');
    await expect(nav.getByRole('link', { name: '01. Work' })).not.toHaveAttribute('aria-current', 'true');
  });

  test('theme toggle flips data-theme, stores it, and applies it before paint on reload', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await gotoHome(page);
    const html = page.locator('html');
    const before = (await html.getAttribute('data-theme')) ?? 'dark';
    const after = before === 'dark' ? 'light' : 'dark';
    await page.getByRole('button', { name: 'Toggle light and dark theme' }).click();
    await expect(html).toHaveAttribute('data-theme', after);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(after);
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => ((window as unknown as { __t: string | null }).__t = document.documentElement.getAttribute('data-theme')), { once: true });
    });
    await page.reload();
    expect(await page.evaluate(() => (window as unknown as { __t: string | null }).__t)).toBe(after);
  });

  test('mobile menu: opens with scroll lock; closes on Esc, button, backdrop and link', async ({ page }, testInfo) => {
    mobileOnly(testInfo.project.name);
    await gotoHome(page);
    const open = page.getByRole('button', { name: 'Open menu' });
    const menu = page.locator('dialog#mobile-menu');
    const overflow = () => page.evaluate(() => getComputedStyle(document.documentElement).overflowY);

    await expect(open).toHaveAttribute('aria-expanded', 'false');
    await open.click();
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    expect(await overflow()).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(open).toHaveAttribute('aria-expanded', 'false');

    await open.click();
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(menu).toBeHidden();

    await open.click();
    await expect(menu).toBeVisible();
    // a point inside the dialog/backdrop but outside the panel
    const spot = await page.evaluate(() => {
      const panel = document.querySelector('#mobile-menu .menu-panel')!.getBoundingClientRect();
      const candidates = [
        [8, window.innerHeight - 8],
        [window.innerWidth - 8, window.innerHeight - 8],
        [8, 8],
        [window.innerWidth / 2, window.innerHeight - 4],
      ];
      return candidates.find(([x, y]) => x < panel.left || x > panel.right || y < panel.top || y > panel.bottom) ?? null;
    });
    test.skip(!spot, 'menu panel covers the whole screen: no empty area to click');
    await page.mouse.click(spot![0], spot![1]);
    await expect(menu).toBeHidden();
    expect(await overflow()).not.toBe('hidden');

    await open.click();
    await menu.getByRole('link', { name: '02. Stack' }).click();
    await expect(menu).toBeHidden();
    // lands just below the sticky header: one scroll offset (header height + 8px ≈ 72px), not two
    await expect.poll(() => topOf(page, 'stack'), { timeout: 10_000 }).toBeLessThan(110);
    expect(await topOf(page, 'stack')).toBeGreaterThanOrEqual(40);
  });
});

test.describe('command palette', () => {
  test('Ctrl+K opens it; arrows move the selection; Esc closes', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await gotoHome(page);
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('dialog.palette')).toBeVisible();
    const box = dialog.getByRole('combobox', { name: 'Search sections, case studies and actions' });
    await expect(box).toBeFocused();
    const options = dialog.getByRole('option');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(options.first()).not.toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowUp');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Open command palette' }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('"copy email" + Enter shows the toast; "helm" opens the EKS case study', async ({ page, context, baseURL }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseURL!).origin });
    await gotoHome(page);
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    const box = dialog.getByRole('combobox', { name: 'Search sections, case studies and actions' });

    await page.keyboard.press('Control+k');
    await box.fill('copy email');
    await page.keyboard.press('Enter');
    await expect(page.locator('.toast-region[role="status"]')).toContainText('Email copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(profile.email);

    await page.keyboard.press('Control+k');
    await box.fill('helm');
    await expect(dialog.getByRole('option').first()).toContainText(projects[0].title);
    await page.keyboard.press('Enter');
    await expect(page.locator('dialog.case-modal')).toBeVisible();
    await expect(page.locator('#case-title')).toContainText(projects[0].title);
  });
});

test.describe('hero terminal', () => {
  test('commands, history, completion, clear, theme and sudo hire-me', async ({ page }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await gotoHome(page);
    const input = page.locator('#term-input');
    await expect(input).toHaveAccessibleName(/Terminal command/);
    await expect(input).toBeEditable({ timeout: 20_000 });
    const log = page.getByRole('log', { name: 'Terminal output' });
    const run = async (cmd: string) => {
      await input.fill(cmd);
      await input.press('Enter');
    };

    await run('help');
    await expect(log).toContainText('available commands');
    for (const cmd of ['whoami', 'skills', 'projects', 'contact', 'theme', 'clear']) await expect(log).toContainText(cmd);
    await run('whoami');
    await expect(log).toContainText('Muhammad Aleem · DevOps Engineer');
    await run('foo');
    await expect(log).toContainText('command not found: foo — try help');
    await input.press('ArrowUp');
    await expect(input).toHaveValue('foo');
    await input.fill('he');
    await input.press('Tab');
    await expect(input).toHaveValue('help');
    await run('clear');
    await expect(log).toHaveText('');

    const html = page.locator('html');
    const theme = (await html.getAttribute('data-theme')) ?? 'dark';
    await run('theme');
    await expect(html).toHaveAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');

    await run('sudo hire-me');
    await expect(log).toContainText('access granted');
    await expect(page.locator('#contact form input[name="name"]')).toBeFocused({ timeout: 4_000 });
    await expect.poll(() => topOf(page, 'contact')).toBeLessThan(200);
  });

  test('quick command chips', async ({ page }) => {
    await gotoHome(page);
    const chips = page.getByRole('group', { name: 'Quick terminal commands' });
    await expect(chips.getByRole('button')).toHaveText(['help', 'whoami', 'skills', 'projects', 'contact', 'sudo hire-me']);
  });

  test('reduced motion shows the whole intro at once, without a typing cursor', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const term = page.locator('[data-hero-term]');
    await expect(term).toContainText('11+ servers scraped');
    await expect(term.locator('.cursor')).toHaveCount(0);
  });
});

test('pipeline: each stage button reveals its tools', async ({ page }) => {
  await gotoHome(page);
  const ship = page.locator('section#ship');
  await expect(ship.locator('button[aria-controls^="stage-"]')).toHaveCount(6);
  for (const id of ['commit', 'build', 'test', 'scan', 'deploy', 'monitor']) await expect(ship.locator(`button[aria-controls="stage-${id}"]`)).toHaveCount(1);
  const build = ship.locator('button[aria-controls="stage-build"]');
  await build.scrollIntoViewIfNeeded();
  await build.click();
  await expect(build).toHaveAttribute('aria-expanded', 'true');
  const panel = page.locator('#stage-build');
  await expect(panel).toBeVisible();
  for (const tool of ['Jenkins', 'GitHub Actions', 'GitLab CI/CD', 'Docker & Docker Compose']) await expect(panel.getByText(tool, { exact: true })).toBeVisible();
});

test.describe('work', () => {
  test('filter tabs, keyboard and project count', async ({ page }) => {
    await gotoHome(page);
    const work = page.locator('section#work');
    const tabs = work.getByRole('tablist', { name: 'Filter projects by area' });
    await expect(tabs.getByRole('tab')).toHaveText(['All', 'Orchestration', 'CI/CD', 'Observability', 'Security', 'Networking']);
    const count = work.locator('.work-count');
    await expect(count).toHaveText('7 of 7 projects');
    await tabs.getByRole('tab', { name: 'Networking' }).click();
    await expect(work.locator('#work-grid .project-card')).toHaveCount(1);
    await expect(count).toHaveText('1 of 7 projects');
    await tabs.getByRole('tab', { name: 'All' }).click();
    await expect(count).toHaveText('7 of 7 projects');
    await tabs.getByRole('tab', { name: 'All' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.getByRole('tab', { name: 'Orchestration' })).toHaveAttribute('aria-selected', 'true');
  });

  test('case study dialog: sections, Esc closes and returns focus', async ({ page }) => {
    await gotoHome(page);
    const button = page.locator('section#work').getByRole('button', { name: /Case study/ }).first();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const dialog = page.locator('dialog.case-modal');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-labelledby', 'case-title');
    const arch = dialog.getByRole('region', { name: 'Architecture' });
    await expect(arch).toBeVisible();
    // horizontal and vertical diagrams exist; CSS shows the one that fits (hidden ones leave the a11y tree)
    await expect(arch.getByRole('img', { name: /^Architecture:/ })).toBeVisible();
    await expect(dialog.getByRole('region', { name: 'What I did' })).toBeVisible();
    await expect(dialog.getByRole('region', { name: 'Links' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('deep link opens the case study on load; closing removes the hash', async ({ page }) => {
    await page.goto('./#eks-full-stack-monitoring');
    const dialog = page.locator('dialog.case-modal');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#case-title')).toContainText(projects[0].title);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
  });

  test('on a phone the case study is a full-height bottom sheet', async ({ page }, testInfo) => {
    mobileOnly(testInfo.project.name);
    await gotoHome(page);
    const button = page.locator('section#work').getByRole('button', { name: /Case study/ }).first();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const dialog = page.locator('dialog.case-modal');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(600); // let the slide-up finish
    const box = (await dialog.boundingBox())!;
    const vh = page.viewportSize()!.height;
    expect(box.y + box.height).toBeGreaterThanOrEqual(vh - 2);
    expect(box.height).toBeGreaterThanOrEqual(vh - 48);
  });
});

test('stack: seven cards; a skill chip filters Work and the filter clears', async ({ page }) => {
  await gotoHome(page);
  const stack = page.locator('section#stack');
  await expect(stack.locator('article.card')).toHaveCount(7);
  const chip = stack.getByRole('button', { name: 'Prometheus: show the 3 projects that use it' });
  await chip.scrollIntoViewIfNeeded();
  await chip.click();
  const work = page.locator('section#work');
  await expect(work.locator('.work-count')).toContainText('3 projects using Prometheus');
  await expect
    .poll(() => page.evaluate(() => { const r = document.getElementById('work')!.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }), { timeout: 10_000 })
    .toBe(true);
  await work.getByRole('button', { name: 'Clear the Prometheus filter' }).click();
  await expect(work.locator('.work-count')).toHaveText('7 of 7 projects');
});

test('experience: three commits, the newest marked (HEAD -> main)', async ({ page }) => {
  await gotoHome(page);
  const commits = page.locator('section#experience li.commit');
  await expect(commits).toHaveCount(3);
  await expect(commits.first()).toContainText('(HEAD -> main)');
});

test('floating actions: WhatsApp visible at load, hidden over contact; back-to-top after the hero', async ({ page }, testInfo) => {
  mobileOnly(testInfo.project.name);
  await gotoHome(page);
  const wa = page.locator('.fab-stack .fab-wa');
  const top = page.locator('.fab-stack .fab-top');
  await expect(wa).toBeVisible();
  await expect(wa).toHaveAttribute('aria-label', 'Chat on WhatsApp (opens in a new tab)');
  await expect(wa).not.toHaveAttribute('inert');
  await expect(top).toHaveAttribute('inert');

  await page.evaluate(() => window.scrollTo({ top: Math.round(window.innerHeight * 1.6), behavior: 'instant' }));
  await expect(top).not.toHaveAttribute('inert');

  await page.locator('#contact').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(wa).toHaveAttribute('inert');
  await expect(top).toHaveAttribute('inert');
});
