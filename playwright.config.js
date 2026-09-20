import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  workers: 1,
  timeout: 45_000,
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome', headless: true, viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
