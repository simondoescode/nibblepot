import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  // CI uses runner-provided Chrome; local development keeps the standard Playwright browser.
  // No separate CI browser download is needed.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: process.env.CI ? 'chrome' : undefined } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.CI ? 'chrome' : undefined } }],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/nibblepot/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
