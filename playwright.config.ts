import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.forbid-software': false,
            'webgl.force-enabled': true
          }
        }
      }
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'npm run build:demo && vite preview --config vite.config.demo.ts --host 127.0.0.1 --port 4173',
    reuseExistingServer: !process.env.CI,
    url: 'http://127.0.0.1:4173'
  }
});
