// End-to-end smoke run of the citizen flow with a persona, in English or Hindi.
// Usage: npm run build && npm run preview, then:
//   npx tsx scripts/smoke.ts [P2] [en|hi]
// Uses the installed Microsoft Edge (or Chromium if BROWSER=chromium). Saves screenshots to screenshots/_smoke-*.png.
import { chromium, type Page } from '@playwright/test';
import attributes from '../src/data/attributes.json';
import { PERSONAS } from '../src/engine/personas';
import { bucketFor } from '../src/engine/buckets';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const pid = process.argv[2] ?? 'P2';
const lang = (process.argv[3] ?? 'en') as 'en' | 'hi';
const persona = PERSONAS.find((p) => p.id === pid)!;

type A = (typeof attributes)[number] & { options?: { value: unknown; label: { en: string; hi: string } }[] };
const ATTRS = attributes as A[];

const browser = await chromium.launch(process.env.BROWSER === 'chromium' ? {} : { channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors: string[] = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

const shot = async (p: Page, name: string) => {
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `screenshots/_smoke-${lang}-${name}.png`, fullPage: true });
};

await page.goto(BASE + '/');
if (lang === 'hi') await page.getByRole('button', { name: 'हिन्दी' }).click();
await shot(page, '1-onboarding');
await page.locator('#consent').check();
await page.getByRole('button', { name: lang === 'en' ? /For myself/ : /अपने लिए/ }).click();

const asked: string[] = [];
for (let i = 0; i < 40; i++) {
  await page.waitForURL(/\/(check|results)/);
  if (page.url().includes('/results')) break;
  const h = page.locator('#q-title');
  await h.waitFor();
  const text = (await h.textContent())!.trim();
  const attr = ATTRS.find((a) => a.question[lang] === text);
  if (!attr) throw new Error('Unknown question: ' + text);
  asked.push(attr.id);
  if (i === 4) await shot(page, '2-question');
  const v = (persona.answers as Record<string, unknown>)[attr.id];
  if (attr.kind === 'multi') {
    await page.getByRole('button', { name: lang === 'en' ? 'See my schemes' : 'मेरी योजनाएँ देखें' }).click();
  } else if (attr.kind === 'number') {
    if (typeof v === 'number') {
      await page.getByLabel(lang === 'en' ? 'Your answer' : 'आपका जवाब').fill(String(v));
      await page.getByRole('button', { name: lang === 'en' ? 'Continue' : 'आगे बढ़ें', exact: true }).click();
    } else {
      await page.getByRole('button', { name: lang === 'en' ? "I don't know" : 'पता नहीं' }).click();
    }
  } else {
    const want = typeof v === 'number' && attr.kind === 'bucket' ? bucketFor(attr.id, v) : (v ?? null);
    const opt = attr.options!.find((o) => o.value === want)!;
    await page.getByRole('button', { name: opt.label[lang], exact: true }).first().click();
  }
  await page.waitForTimeout(80);
}
console.log(`${pid}: asked ${asked.length}: ${asked.join(', ')}`);
await page.waitForURL(/\/results/);
await page.locator('h1').waitFor();
console.log('results h1:', await page.locator('h1').textContent());
await shot(page, '3-results');

const first = persona.eligible[0]!;
await page.goto(`${BASE}/scheme/${first}`);
await page.locator('h1').waitFor();
await page.locator('input[type=checkbox]').first().check();
await shot(page, '4-detail');
await page.emulateMedia({ media: 'print' });
await shot(page, '4b-detail-print');
await page.emulateMedia({ media: 'screen' });

await page.goto(`${BASE}/saved`);
await page.locator('h1').waitFor();
await shot(page, '5-saved');

console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
