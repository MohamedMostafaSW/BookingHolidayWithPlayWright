// pages/BasePage.ts
import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Get Locator dynamically (accepts both Locator or string) */
  private getLocator(target: Locator | string): Locator {
    return typeof target === 'string' ? this.page.locator(target) : target;
  }

  /** Click on element */
  async click(element: Locator | string, elementName: string) {
    const el = this.getLocator(element);
    try {
      await el.waitFor({ state: 'visible' });
      await el.click();
      console.log(`✅ Clicked on: ${elementName}`);
    } catch (e) {
      console.error(`❌ Unable to click on: ${elementName}`, e);
      throw e;
    }
  }

  /** Type text into element */
  async type(element: Locator | string, text: string, elementName: string) {
    const el = this.getLocator(element);
    try {
      await el.waitFor({ state: 'visible' });
      await el.fill('');
      await el.fill(text);
      console.log(`✅ Typed '${text}' into: ${elementName}`);
    } catch (e) {
      console.error(`❌ Unable to type into: ${elementName}`, e);
      throw e;
    }
  }

  /** Check if element is displayed */
  async isDisplayed(element: Locator | string, elementName: string) {
    const el = this.getLocator(element);
    try {
      const visible = await el.isVisible();
      console.log(`${elementName} is displayed: ${visible}`);
      return visible;
    } catch {
      console.warn(`${elementName} is not displayed`);
      return false;
    }
  }

  /** Scroll to element */
  async scrollToElement(element: Locator | string, elementName: string) {
    const el = this.getLocator(element);
    try {
      await el.scrollIntoViewIfNeeded();
      console.log(`🟢 Scrolled to: ${elementName}`);
    } catch (e) {
      console.error(`❌ Unable to scroll to: ${elementName}`, e);
      throw e;
    }
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /** Wait for page to fully load */
  async waitForPageLoad() {
    await this.page.waitForLoadState('load');
    console.log('🌍 Page loaded completely');
  }

  /** Custom wait */
  async waitFor(seconds: number) {
    await this.page.waitForTimeout(seconds * 1000);
  }

  /** Format date for UI (optional helper) */
  formatDateForUI(excelDate: string) {
    try {
      const date = new Date(excelDate);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error(`❌ Failed to format date: ${excelDate}`, e);
      return excelDate;
    }
  }
}
