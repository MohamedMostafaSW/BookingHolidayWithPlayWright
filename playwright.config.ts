// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // Global timeout for each test
  timeout: 120_000, // 2 minutes per test
  
  // Timeout for expect() assertions
  expect: {
    timeout: 10_000, // 10 seconds
  },
  
  // Fail the build on CI if test.only is left in the code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['list'], // console
    ['html', { outputFolder: 'reports', open: 'never' }], // HTML report
  ],
  
  use: {
    // Real Chrome browser
    channel: 'chrome',
    headless: false,
    viewport: null, // full screen
    launchOptions: {
      args: [
        '--start-maximized', // full screen
        '--disable-blink-features=AutomationControlled', // avoid detection
      ],
    },
    
    // Action timeout (click, fill, etc.)
    actionTimeout: 15_000,
    
    // Navigation timeout
    navigationTimeout: 30_000,
    
    // Screenshots, video, trace
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: {}, // use main `use` config
    },
  ],
});
