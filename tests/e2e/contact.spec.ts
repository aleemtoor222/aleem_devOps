import fs from 'node:fs';
import type { Page } from '@playwright/test';
import { profile, WEB3FORMS_ACCESS_KEY } from '../../src/content/profile';
import { expect, gotoHome, mockWeb3Forms, test } from './helpers';

const contactForm = (page: Page) => page.locator('#contact form.contact-form');

async function fillValid(page: Page, message = 'Hello Aleem, we would like to talk about a platform role.') {
  const f = contactForm(page);
  await f.getByRole('textbox', { name: 'Name', exact: true }).fill('Ada Recruiter');
  await f.getByRole('textbox', { name: 'Email', exact: true }).fill('ada@example.com');
  await f.getByRole('textbox', { name: 'Subject (optional)' }).fill('Platform role');
  await f.getByRole('textbox', { name: 'Message', exact: true }).fill(message);
}

test.describe('contact form', () => {
  test('validates inline (blur, then live) and focuses the first invalid field', async ({ page }) => {
    const calls = await mockWeb3Forms(page, { body: { success: true } });
    await gotoHome(page, '#contact');
    const f = contactForm(page);
    const name = f.getByRole('textbox', { name: 'Name', exact: true });
    const email = f.getByRole('textbox', { name: 'Email', exact: true });
    const message = f.getByRole('textbox', { name: 'Message', exact: true });

    // No error while typing in a fresh field; it appears once the field is left
    await email.fill('not-an-email');
    await expect(email).not.toHaveAttribute('aria-invalid');
    await email.blur();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription(/valid email address/);
    // ...and then updates live
    await email.fill('ada@example.com');
    await expect(email).not.toHaveAttribute('aria-invalid');

    await f.getByRole('button', { name: 'Send message' }).click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription('Please enter your name.');
    await expect(message).toHaveAttribute('aria-invalid', 'true');
    await expect(f.locator('#contact-message-error')).toHaveText('Please write a message.');

    await message.fill('too short');
    await expect(f.locator('#contact-message-error')).toHaveText(/at least 10 characters/);
    await expect(f.locator('#contact-message-count')).toContainText('9 / 2000');
    await message.fill('Long enough message now.');
    await expect(message).not.toHaveAttribute('aria-invalid');
    await expect(f.locator('#contact-message-count')).toContainText('24 / 2000');
    await expect(message).toHaveAttribute('maxlength', '2000');
    expect(calls).toHaveLength(0);
  });

  test('sends: spinner while sending, then check mark, toast and a reset form', async ({ page }) => {
    const calls = await mockWeb3Forms(page, { body: { success: true, message: 'Email sent successfully!' }, delayMs: 800 });
    await gotoHome(page, '#contact');
    const f = contactForm(page);
    await fillValid(page);
    await f.getByRole('button', { name: 'Send message' }).click();

    const sending = f.getByRole('button', { name: 'Sending…' });
    await expect(sending).toHaveAttribute('aria-disabled', 'true');
    await expect(sending.locator('.spinner')).toBeVisible();

    const result = f.locator('.form-result[data-kind="success"]');
    await expect(result).toBeVisible();
    await expect(result).toContainText('Message sent');
    await expect(f.locator('.form-check')).toBeVisible();
    // the tick is drawn (stroke-dashoffset animates to 0)
    await expect.poll(() => f.locator('.form-check-tick').evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset))).toBe(0);
    await expect(page.locator('.toast-region')).toContainText('Message sent');

    for (const label of ['Name', 'Email', 'Message']) await expect(f.getByRole('textbox', { name: label, exact: true })).toHaveValue('');
    await expect(f.getByRole('textbox', { name: 'Subject (optional)' })).toHaveValue('');
    await expect(f.getByRole('button', { name: 'Send message' })).not.toHaveAttribute('aria-disabled');

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      access_key: WEB3FORMS_ACCESS_KEY,
      name: 'Ada Recruiter',
      email: 'ada@example.com',
      subject: 'Platform role',
      message: 'Hello Aleem, we would like to talk about a platform role.',
      from_name: 'Portfolio contact',
      botcheck: false,
    });
  });

  test('HTTP 500 shows the error with mailto and WhatsApp fallbacks (text kept)', async ({ page }) => {
    await mockWeb3Forms(page, { status: 500, body: { success: false, message: 'Server error' } });
    await gotoHome(page, '#contact');
    const f = contactForm(page);
    await fillValid(page, 'Line one of the message\nLine two');
    await f.getByRole('button', { name: 'Send message' }).click();

    const result = f.locator('.form-result[data-kind="error"]');
    await expect(result).toBeVisible();
    await expect(result).toContainText('Message not sent');

    const mail = result.getByRole('link', { name: 'Email me directly' });
    const href = (await mail.getAttribute('href')) ?? '';
    expect(href.startsWith(`mailto:${profile.email}?`)).toBe(true);
    const params = new URLSearchParams(href.slice(href.indexOf('?')));
    expect(params.get('subject')).toBe('Platform role');
    expect(params.get('body')).toContain('Line one of the message\r\nLine two');
    expect(params.get('body')).toContain('Ada Recruiter <ada@example.com>');
    expect(href).not.toContain(' '); // percent-encoded

    const wa = result.getByRole('link', { name: 'Message on WhatsApp (opens in a new tab)' });
    await expect(wa).toHaveAttribute('href', profile.whatsapp);
    await expect(wa).toHaveAttribute('target', '_blank');
    await expect(wa).toHaveAttribute('rel', /noopener/);

    await expect(f.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Ada Recruiter');
    await expect(f.locator('.form-status')).toHaveAttribute('aria-live', 'polite');
  });

  test('a network failure and {success:false} end in the same error state', async ({ page }) => {
    let calls = await mockWeb3Forms(page, { abort: true });
    await gotoHome(page, '#contact');
    const f = contactForm(page);
    await fillValid(page);
    await f.getByRole('button', { name: 'Send message' }).click();
    await expect(f.locator('.form-result[data-kind="error"]')).toBeVisible();
    expect(calls).toHaveLength(1);

    await page.unroute('https://api.web3forms.com/**');
    calls = await mockWeb3Forms(page, { status: 200, body: { success: false, message: 'Invalid access key' } });
    await f.getByRole('button', { name: 'Send message' }).click();
    await expect(f.getByRole('button', { name: 'Send message' })).not.toHaveAttribute('aria-disabled');
    await expect(f.locator('.form-result[data-kind="error"]')).toBeVisible();
    await expect(f.locator('.form-result[data-kind="success"]')).toHaveCount(0);
    expect(calls).toHaveLength(1);
  });

  test('honeypot: a ticked botcheck box fakes success and sends nothing', async ({ page }) => {
    const calls = await mockWeb3Forms(page, { body: { success: true } });
    await gotoHome(page, '#contact');
    const f = contactForm(page);
    const box = f.locator('input[name="botcheck"]');
    await expect(box).toHaveAttribute('type', 'checkbox');
    await expect(box).toHaveAttribute('tabindex', '-1');
    await expect(f.locator('.hp-field')).toHaveAttribute('aria-hidden', 'true');
    expect(await box.isChecked()).toBe(false);

    await fillValid(page);
    await box.evaluate((el: HTMLInputElement) => {
      el.checked = true; // what a form-filling bot does
    });
    await f.getByRole('button', { name: 'Send message' }).click();
    await expect(f.locator('.form-result[data-kind="success"]')).toBeVisible();
    expect(calls).toHaveLength(0);
  });
});

test.describe('contact channels', () => {
  test('cards link to email, phone, WhatsApp, GitHub and LinkedIn', async ({ page }) => {
    await gotoHome(page, '#contact');
    const list = page.locator('#contact .contact-channels');
    await expect(list.locator('li')).toHaveCount(5);

    const email = list.locator('[data-channel="email"] a');
    await expect(email).toHaveAttribute('href', `mailto:${profile.email}`);
    await expect(email).toHaveAccessibleName(new RegExp(`^Email\\s*${profile.email.replace(/[.]/g, '\\.')}$`));
    const phone = list.locator('[data-channel="phone"] a');
    await expect(phone).toHaveAttribute('href', 'tel:+923140145490');
    await expect(phone).toContainText('+92 314 0145490');
    for (const [id, href] of [
      ['whatsapp', profile.whatsapp],
      ['github', profile.github],
      ['linkedin', profile.linkedin],
    ] as const) {
      const a = list.locator(`[data-channel="${id}"] a`);
      await expect(a).toHaveAttribute('href', href);
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(a).toHaveAccessibleName(/\(opens in a new tab\)$/);
    }
    // Long values wrap instead of overflowing
    const overflow = await list.evaluate((ul) => ul.scrollWidth - ul.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('copy buttons copy the email and phone number and confirm it', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseURL!).origin });
    await gotoHome(page, '#contact');
    const copyEmail = page.getByRole('button', { name: 'Copy email address' });
    await expect(copyEmail).toHaveAttribute('data-tip', 'Copy email address');
    await copyEmail.click();
    await expect(page.locator('.toast-region')).toContainText('Email copied');
    await expect(copyEmail).toHaveAttribute('data-copied', 'true');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(profile.email);

    await page.getByRole('button', { name: 'Copy phone number' }).click();
    await expect(page.locator('.toast-region')).toContainText('Phone number copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(profile.phone.display);
  });

  test('"Save contact" downloads a vCard 3.0 file with CRLF line endings', async ({ page }) => {
    await gotoHome(page, '#contact');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Save contact/ }).click()]);
    expect(download.suggestedFilename()).toBe('muhammad-aleem.vcf');
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).not.toMatch(/[^\r]\n/);
    const lines = text.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCARD');
    expect(lines.at(-1)).toBe('');
    expect(lines.at(-2)).toBe('END:VCARD');
    expect(lines).toEqual(
      expect.arrayContaining([
        'VERSION:3.0',
        'N:Aleem;Muhammad;;;',
        'FN:Muhammad Aleem',
        'TITLE:DevOps Engineer',
        `TEL;TYPE=CELL:${profile.phone.e164}`,
        `EMAIL;TYPE=INTERNET:${profile.email}`,
        'ADR;TYPE=WORK:;;;Lahore;;;Pakistan',
        `URL:${profile.github}`,
        `URL:${profile.linkedin}`,
      ]),
    );
    for (const l of lines) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });

  test('vCard text values escape commas, semicolons and backslashes', async () => {
    const { vcardEscape } = await import('../../src/components/contact/vcard');
    expect(vcardEscape('Lahore, Punjab; PK \\ HQ')).toBe('Lahore\\, Punjab\\; PK \\\\ HQ');
    expect(vcardEscape('line 1\nline 2')).toBe('line 1\\nline 2');
  });
});
