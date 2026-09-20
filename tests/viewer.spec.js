import { test, expect } from '@playwright/test';

async function openViewer(page, hash = '') {
  await page.goto(`/${hash}`);
  await expect(page.locator('#scene')).toHaveAttribute('data-loaded', 'true', { timeout: 30_000 });
  await expect(page.locator('#loading')).toBeHidden();
}

test('real GLB renders and all four camera compositions work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openViewer(page);
  expect(await page.evaluate(() => window.getViewerState().meshCount)).toBeGreaterThan(65);
  for (const name of ['entrance', 'balcony', 'atrium']) {
    await page.locator(`button[data-view=${name}]`).click();
    await expect(page.locator('#scene')).toHaveAttribute('data-view', name);
    await expect(page.locator(`button[data-view=${name}]`)).toHaveAttribute('aria-pressed', 'true');
  }
  await page.locator('#launch-view').click();
  await expect(page.locator('#view-title')).toHaveText('A moment at the centre.');
  await expect(page.locator('#level-label')).toHaveText('1F · LAUNCH BALCONY');
  const state = await page.evaluate(() => window.getViewerState());
  expect(state.position[1]).toBeCloseTo(5.8);
  expect(errors).toEqual([]);
});

test('tickers actually move, pause, and respect reduced motion', async ({ page }) => {
  await openViewer(page);
  const initial = await page.evaluate(() => window.getViewerState().tickerOffset);
  await expect.poll(() => page.evaluate(() => window.getViewerState().tickerOffset)).toBeGreaterThan(initial + .002);
  await page.locator('#ticker').uncheck();
  const paused = await page.evaluate(() => window.getViewerState().tickerOffset);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.getViewerState().tickerOffset)).toBe(paused);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openViewer(page);
  await expect(page.locator('#ticker')).not.toBeChecked();
  expect(await page.evaluate(() => window.getViewerState().tickerPlaying)).toBe(false);
});

test('roof, annotations, daylight and tour controls change the actual state', async ({ page }) => {
  await openViewer(page);
  await page.locator('#roof').uncheck();
  expect(await page.evaluate(() => window.getViewerState().roof)).toBe(false);
  await page.locator('#annotations').uncheck();
  await expect(page.locator('#hotspots')).toBeHidden();
  await page.locator('#daylight').fill('10');
  await expect(page.locator('#daylight-value')).toHaveText('Evening');
  await page.locator('#tour').click();
  await expect(page.locator('#tour')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('button[data-view=balcony]').click();
  await expect(page.locator('#tour')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#scene').focus();
  await page.keyboard.press('2');
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'entrance');
});

test('PNG export, model download and about dialog work', async ({ page }) => {
  await openViewer(page);
  const pendingDownload = page.waitForEvent('download');
  await page.locator('#snapshot').click();
  expect((await pendingDownload).suggestedFilename()).toBe('paternoster-square-atrium.png');
  const response = await page.request.get('/models/paternoster.glb');
  expect(response.ok()).toBeTruthy();
  expect((await response.body()).subarray(0, 4).toString()).toBe('glTF');
  await page.locator('#about-button').click();
  await expect(page.locator('#about-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#about-dialog')).toBeHidden();
});

test('mobile layout fits and deep links open the launch balcony', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openViewer(page, '#launch');
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'launch');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('button[data-view=entrance]').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-view', 'entrance');
  const intro = await page.locator('.intro h1').boundingBox();
  const copy = await page.locator('.intro-copy').boundingBox();
  expect(copy.y).toBeGreaterThanOrEqual(intro.y + intro.height);
  await page.screenshot({ path: '.work/mobile-verified.png', fullPage: true });
});

test('a failed model download offers a usable recovery state', async ({ page }) => {
  await page.route('**/models/paternoster.glb', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('#error')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#retry')).toBeEnabled();
  await expect(page.locator('#tour')).toBeDisabled();
  await page.unroute('**/models/paternoster.glb');
  await page.locator('#retry').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-loaded', 'true', { timeout: 30_000 });
});
