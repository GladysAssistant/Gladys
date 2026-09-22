/**
 * Captures ../gladys-demo-dashboard.webp and ../gladys-demo-dashboard-fr.webp, the
 * dashboard screenshots the covers are built on. They come from the demo mode of the
 * front, so the house, the devices and the scenes on them are the ones anyone can
 * click through on the public demo: no private instance is ever shown.
 *
 * The demo speaks the language of the browser, hence one capture per locale. The clock
 * is pinned to an early afternoon so the shot is a lively one: solar is producing, and
 * the sun curve sits near its peak.
 *
 * Usage: npm install playwright sharp && npx playwright install chromium
 *        (cd front && npm run start-demo)   # serves the demo on :1445
 *        node .github/images/bmc-cover/capture-demo.mjs
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const locales = [['en', 'en-US'], ['fr', 'fr-FR']];

const browser = await chromium.launch();

for (const [lang, locale] of locales) {
  const suffix = lang === 'en' ? '' : `-${lang}`;
  const output = path.join(here, '..', `gladys-demo-dashboard${suffix}.webp`);

  const viewport = { width: 1440, height: 900 };
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, locale, timezoneId: 'Europe/Paris' });
  await page.clock.setFixedTime(new Date('2026-09-22T14:37:00+02:00'));
  await page.goto('http://localhost:1445/', { waitUntil: 'networkidle' });
  // The dashboard mounts its boxes one after the other, then draws its charts.
  await page.waitForTimeout(7000);

  await sharp(await page.screenshot()).webp({ quality: 88 }).toFile(output);
  await page.close();

  console.log(`Wrote ${output}`);
}

await browser.close();
