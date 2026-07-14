import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  retries: 0,
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:4173/metal-fx/',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', testIgnore: /visual\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'chromium-visual',
      testMatch: /(^|[/\\])visual\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 1,
        viewport: { width: 880, height: 160 }
      }
    },
    {
      name: 'chromium-material-lab-visual',
      testMatch: /material-lab-visual\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1, viewport: { width: 960, height: 720 } }
    },
    {
      name: 'firefox',
      testIgnore: /visual\.spec\.ts/,
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
    { name: 'webkit', testIgnore: /visual\.spec\.ts/, use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command:
      'npm run build:demo && vite preview --config vite.config.demo.ts --base=/metal-fx/ --host 127.0.0.1 --port 4173',
    reuseExistingServer: !process.env.CI,
    url: 'http://127.0.0.1:4173/metal-fx/'
  }
});
