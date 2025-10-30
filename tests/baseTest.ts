// tests/baseTest.ts
import { test as base, Page, BrowserContext } from '@playwright/test';

type TestFixtures = {
  page: Page;
  context: BrowserContext;
};

export const test = base.extend<TestFixtures>({
  context: async ({ browser }, use) => {
    // Set up context (like browser options)
    const context = await browser.newContext({
      recordVideo: { dir: 'videos/' },
      viewport: { width: 1920, height: 1080 },
    });
    await use(context);
    await context.close();
  },

  page: async ({ context }, use) => {
    // Create new page for each test
    const page = await context.newPage();
    await page.goto('https://www.booking.com');
    await use(page);
  },
});

export { expect } from '@playwright/test';
