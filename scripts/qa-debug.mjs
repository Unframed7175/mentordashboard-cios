// Debug script: screenshot + DOM dump van de startpagina
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:1420/', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(1000);

await page.screenshot({ path: '/tmp/qa-screenshot.png', fullPage: true });
console.log('Screenshot: /tmp/qa-screenshot.png');

// Dump alle knoppen
const buttons = await page.$$eval('button', btns =>
  btns.map(b => ({ text: b.textContent?.trim().slice(0, 60), aria: b.getAttribute('aria-label'), title: b.getAttribute('title'), disabled: b.disabled }))
);
console.log('\nKnoppen op pagina:');
buttons.forEach(b => console.log(' -', JSON.stringify(b)));

// Dump alle tekst in wizard
const wizardText = await page.$$eval('.onboarding-overlay, .wizard, [class*="onboard"]', els =>
  els.map(e => e.textContent?.trim().slice(0, 200))
);
console.log('\nWizard tekst:', wizardText);

await browser.close();
