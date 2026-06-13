import { chromium } from 'playwright';

const TAURI_MOCK = `
window.__TAURI__ = {
  core: { invoke: async () => null },
  app: { getVersion: async () => '2.7.0' },
  event: { listen: async () => () => {}, emit: async () => {} },
};`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript({ content: TAURI_MOCK });
const page = await ctx.newPage();
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(500);

// Doorloop wizard
const input = page.locator('input[type="text"]').first();
if (await input.count() > 0) { await input.fill('QA-klas'); await page.waitForTimeout(200); }
const aanmaken = page.getByRole('button', { name: /klas aanmaken/i });
if (await aanmaken.count() > 0 && !(await aanmaken.getAttribute('disabled'))) {
  await aanmaken.click(); await page.waitForTimeout(800);
}
const volgende = page.getByRole('button', { name: /volgende/i });
if (await volgende.count() > 0) { await volgende.click({ force: true }); await page.waitForTimeout(500); }
const afbreken = page.getByRole('button', { name: /afbreken/i });
if (await afbreken.count() > 0) { await afbreken.click({ force: true }); await page.waitForTimeout(800); }

// Settings pagina
await page.getByRole('button', { name: /instellingen/i }).first().click({ force: true });
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/qa-settings-final.png', fullPage: true });
console.log('Settings screenshot: /tmp/qa-settings-final.png');

// Open dialoog
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.getByRole('button', { name: /alle gegevens wissen/i }).click({ force: true });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/qa-dialog.png' });
console.log('Dialog screenshot: /tmp/qa-dialog.png');

await browser.close();
