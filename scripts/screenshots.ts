// Figure 10 screenshots (390×844 @2x) + offline and console checks.
// Usage: npm run build && npm run preview   (in another terminal)
//        npx tsx scripts/screenshots.ts
// Uses installed Microsoft Edge; set BROWSER=chromium to use Playwright's Chromium.
import { chromium } from '@playwright/test';
import { PERSONAS } from '../src/engine/personas';
import { bucketFor } from '../src/engine/buckets';
import type { Answers } from '../src/engine/types';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const browser = await chromium.launch(process.env.BROWSER === 'chromium' ? {} : { channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors: string[] = [];
page.on('console', (m) => m.type() === 'error' && errors.push(`${page.url()}: ${m.text()}`));
page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));

const shot = async (name: string) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `screenshots/${name}.png` });
  console.log('saved screenshots/' + name + '.png');
};
const seed = (answers: Answers, extra: object = {}) =>
  page.evaluate(
    ([a, x]) => sessionStorage.setItem('sc.session', JSON.stringify({ state: { consent: true, mode: 'self', voice: false, answers: a, history: Object.keys(a as object), needs: [], docs: {}, trace: [], familyMembers: null, presenter: false, ...(x as object) }, version: 1 })),
    [answers, extra] as const,
  );

const p2: Answers = { ...PERSONAS.find((p) => p.id === 'P2')!.answers, already_receiving: [] };
p2.annual_family_income = bucketFor('annual_family_income', p2.annual_family_income as number);

await page.goto(BASE + '/');
await shot('1-onboarding');

await seed({ state: 'MP', age: 32, gender: 'female', area: 'rural' });
await page.goto(BASE + '/check');
await page.locator('#q-title').waitFor();
await shot('2-questionnaire');

await seed(p2);
await page.goto(BASE + '/results');
await page.locator('h1').waitFor();
await shot('3-results');

await page.goto(BASE + '/scheme/pm-jay');
await page.locator('h1').waitFor();
await shot('4-scheme-detail');

await page.goto(BASE + '/ask');
await page.getByLabel('Type your question').fill('What documents do I need for PM Kisan?');
await page.getByRole('button', { name: 'Send' }).click();
await page.getByText('Source · pmkisan.gov.in').waitFor();
await shot('5-ask');
await page.getByLabel('Type your question').fill('Who won the cricket match?');
await page.getByRole('button', { name: 'Send' }).click();
await page.getByText("I don't have an official answer").waitFor();
console.log('ask: answer + no-answer ok');

await page.goto(BASE + '/sahayak');
await page.getByRole('button', { name: 'Add demo families' }).click();
await page.getByRole('link', { name: /Family 4/ }).waitFor();
await shot('6-sahayak');

// Airplane mode: service worker must serve the app shell and data.
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.evaluate(() => navigator.serviceWorker.ready);
await ctx.setOffline(true);
await page.goto(BASE + '/sahayak');
await page.getByRole('link', { name: /Family 4/ }).waitFor({ timeout: 10000 });
await page.getByText('You are offline').waitFor();
console.log('sahayak offline: ok');
await page.goto(BASE + '/scheme/pm-kisan');
await page.locator('h1').waitFor();
console.log('scheme detail offline: ok');
await ctx.setOffline(false);

const desk = await ctx.newPage();
await desk.setViewportSize({ width: 1280, height: 800 });
desk.on('pageerror', (e) => errors.push(`lab: ${e.message}`));
await desk.goto(BASE + '/lab');
await desk.getByRole('button', { name: 'Run persona tests' }).click();
console.log('lab:', await desk.getByText(/passed$/).textContent());
await desk.getByRole('button', { name: 'Run benchmark' }).click();
await desk.getByText(/ms per profile/).waitFor({ timeout: 60000 });
console.log('lab:', (await desk.getByText(/ms per profile/).textContent())?.replace('in this browser on this device', ''));
await desk.goto(BASE + '/admin/schemes');
await desk.locator('table').waitFor();
console.log('admin rows flagged:', await desk.locator('td.bg-amber-tint').count());
await desk.goto(BASE + '/results?presenter=1');
await desk.getByLabel('Load persona').selectOption('P8');
await desk.getByText('Engine trace').waitFor();
console.log('presenter: ok');

console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
