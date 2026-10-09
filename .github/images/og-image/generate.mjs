/**
 * Renders og-image.html into ../gladys-og-image.png, the 1280x640 image
 * uploaded as the repository social preview (GitHub → Settings → General →
 * Social preview). GitHub caps that upload at 1 MB, hence the 1x render.
 *
 * Usage: npx playwright@1 install chromium && node .github/images/og-image/generate.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, 'og-image.html');
const output = path.join(here, '..', 'gladys-og-image.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await page.goto(`file://${source}`);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: output });
await browser.close();

console.log(`Wrote ${output}`);
