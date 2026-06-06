import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: '50%',
  reporter: 'html',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
    actionTimeout: 10_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    viewport: { width: 1280, height: 1080 },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { 
      name: 'chromium', 
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json'
      }, 
      dependencies: ['setup'] 
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  }
});
