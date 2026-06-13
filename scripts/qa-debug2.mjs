import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Capture console errors
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text().slice(0, 120)); });
page.on('pageerror', e => console.log('PAGE ERR:', e.message.slice(0, 120)));

await page.goto('http://localhost:1420/', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(500);

// Stap door wizard
const klasInput = page.locator('input[type="text"]').first();
if (await klasInput.count() > 0) {
  await klasInput.fill('QA-klas');
  await page.waitForTimeout(200);
  const btn = page.getByRole('button', { name: /klas aanmaken/i });
  if (await btn.count() > 0 && !(await btn.getAttribute('disabled'))) {
    await btn.click();
    await page.waitForTimeout(800);
  }
}
const overslaan = page.getByRole('button', { name: /overslaan/i });
if (await overslaan.count() > 0) { await overslaan.click(); await page.waitForTimeout(500); }

// Klik naar Instellingen
await page.locator('[title="Instellingen openen"]').first().click({ force: true });
await page.waitForTimeout(1500);

await page.screenshot({ path: '/tmp/qa-settings.png', fullPage: true });
console.log('Screenshot: /tmp/qa-settings.png');

// Dump tekst op pagina
const bodyText = await page.$eval('body', el => el.innerText?.slice(0, 600));
console.log('\nPagina tekst:\n', bodyText);

// Dump knoppen
const btns = await page.$$eval('button', bs => bs.map(b => b.textContent?.trim().slice(0,40)));
console.log('\nKnoppen:', btns);

await browser.close();
