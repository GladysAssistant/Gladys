/**
 * Renders bmc-cover.html into ../gladys-bmc-cover.png and ../gladys-bmc-cover-fr.png,
 * the 1600x400 cover images uploaded to the Buy Me a Coffee page
 * (buymeacoffee.com/gladysassistant -> Edit page -> Cover image). Buy Me a Coffee
 * also serves the cover as the og:image of that page.
 *
 * The page is laid out in CSS pixels but rendered at 2x and downsampled
 * (`scale: 'css'`), so the text stays crisp at the exact 1600x400 upload size.
 *
 * Usage: npm install playwright && npx playwright install chromium
 *        node .github/images/bmc-cover/generate.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, 'bmc-cover.html');

const browser = await chromium.launch();

for (const lang of ['en', 'fr']) {
  const suffix = lang === 'en' ? '' : `-${lang}`;
  const output = path.join(here, '..', `gladys-bmc-cover${suffix}.png`);

  const page = await browser.newPage({ viewport: { width: 1600, height: 400 }, deviceScaleFactor: 2 });
  await page.goto(`file://${source}?lang=${lang}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: output, scale: 'css' });
  await page.close();

  console.log(`Wrote ${output}`);
}

await browser.close();
