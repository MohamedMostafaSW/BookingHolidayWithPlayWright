import { Page, expect } from '@playwright/test';
import { BasePage } from './basePage';

export class BookingHomePage extends BasePage {
  
  constructor(page: Page) {
    super(page);
  }

  // -------------------------------
  // Locators
  // -------------------------------
  private searchDestinationField = this.page.locator('input[name="ss"], input[placeholder="Where are you going?"]');
  private datePickerContainer = this.page.locator('button[data-testid="searchbox-dates-container"]');
  private searchButton = this.page.locator('button[type="submit"]:has-text("Search")');
  private dismissSignInButton = this.page.locator('button[aria-label="Dismiss sign-in info."]');
  private closePopupButton = this.page.locator('button[aria-label="Close"]');
  private nextMonthButton = this.page.locator('button[aria-label="Next month"]');

  // -------------------------------
  // Methods
  // -------------------------------

  /** Navigate to Booking.com */
  async navigateToBooking() {
    console.log('🌐 Navigating to Booking.com...');
    await this.page.goto('https://www.booking.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // CRITICAL: Handle cookie consent FIRST
    await this.handleCookieConsent();
    
    // Then handle other popups
    await this.handlePopups();
    
    console.log('✅ Navigation complete');
  }

  /** Handle cookie consent banner - ADD THIS METHOD */
  private async handleCookieConsent() {
    console.log('🍪 Handling cookie consent...');
    
    try {
      await this.page.waitForTimeout(1500);
      
      // Try multiple cookie accept button selectors
      const cookieSelectors = [
        'button:has-text("Accept")',
        'button#onetrust-accept-btn-handler',
        'button[id*="accept-cookies"]',
        'button[id*="onetrust-accept"]',
        '[aria-label*="Accept cookies"]'
      ];

      for (const selector of cookieSelectors) {
        try {
          const button = this.page.locator(selector).first();
          const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            await button.click();
            console.log('✅ Cookie consent accepted');
            await this.page.waitForTimeout(1000);
            return;
          }
        } catch (e) {
          continue;
        }
      }
      
      console.log('ℹ️ No cookie banner found');
    } catch (e) {
      console.log('⚠️ Error handling cookies, continuing...');
    }
  }

  /** Handle popups when the page loads */
  private async handlePopups() {
    console.log('🔍 Checking for popups...');
    await this.page.waitForTimeout(4000);

    if (await this.dismissSignInButton.isVisible().catch(() => false)) {
      await this.dismissSignInButton.click();
      console.log('✅ Dismissed sign-in popup');
    }

    if (await this.closePopupButton.isVisible().catch(() => false)) {
      await this.closePopupButton.click();
      console.log('✅ Closed popup');
    }
  }

  /** Verify home page is loaded - IMPROVED VERSION */
  async isHomePageLoaded(): Promise<boolean> {
    console.log('🔍 Verifying home page is loaded...');
    
    try {
      // Wait for page to be stable
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      
      // Try to find destination field with multiple attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`   Attempt ${attempt}/3 to find destination field...`);
        
        try {
          await this.page.waitForSelector(
            'input[name="ss"], input[placeholder*="Where are you going"], input[data-component="search/destination/input-placeholder"]',
            {
              state: 'visible',
              timeout: 5000
            }
          );
          console.log('✅ Home page loaded - destination field found');
          return true;
        } catch (e) {
          if (attempt < 3) {
            console.log('   Not found, waiting and retrying...');
            await this.page.waitForTimeout(2000);
          }
        }
      }
      
      // Failed after 3 attempts
      console.error('❌ Home page did not load — destination field not found after 3 attempts');
      console.log('🔍 Current URL:', this.page.url());
      
      // Take debug screenshot
      await this.page.screenshot({ 
        path: 'debug-homepage-failed.png', 
        fullPage: true 
      }).catch(() => {});
      
      return false;
      
    } catch (error) {
      console.error('❌ Error checking if home page loaded:', error);
      return false;
    }
  }

  /** Enter destination in the search field */
  async enterDestination(destination: string) {
    console.log(`📍 Entering destination: ${destination}`);
    await this.searchDestinationField.click();
    await this.page.waitForTimeout(2000);
    await this.searchDestinationField.fill(destination);
    console.log(`✅ Entered destination: ${destination}`);
    await this.page.waitForTimeout(2500);
  }

/** Select check-in and check-out dates */
async selectDates(checkIn: string, checkOut: string) {
  console.log(`📅 Selecting dates: ${checkIn} to ${checkOut}`);
  await this.selectDateByValue(checkIn, 'Check-in Date');
  await this.selectDateByValue(checkOut, 'Check-out Date');

  console.log('✅ Dates selected');
}

/** Find and select date dynamically in calendar */
private async selectDateByValue(date: string, dateName: string) {
  const dateLocator = this.page.locator(`span[data-date='${date}']`);
  let safetyCounter = 0;

  // Wait until the date becomes visible in the calendar
  while (!(await dateLocator.isVisible().catch(() => false)) && safetyCounter < 12) {
    safetyCounter++;
    console.log(`   ➡️ Navigating to next month to find ${dateName}: ${date}`);
    
    // Use force click to bypass overlays
    await this.nextMonthButton.click({ force: true });
  }

  if (await dateLocator.isVisible()) {
    await dateLocator.scrollIntoViewIfNeeded();
    await dateLocator.click({ force: true });
    console.log(`✅ Selected ${dateName}: ${date}`);
  } else {
    throw new Error(`❌ Could not find ${dateName}: ${date}`);
  }
}


  /** Click Search button */
  async clickSearch() {
    console.log('🔍 Clicking search button...');
    await this.searchButton.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(5000);
    await this.searchButton.click();
    console.log('✅ Search button clicked');
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await this.page.waitForTimeout(4000);
    console.log('✅ Search results loaded');
  }

  /** Perform full search */
  async searchHotel(destination: string, checkIn: string, checkOut: string) {
    await this.enterDestination(destination);
    
    // Wait for autocomplete and potentially select
    await this.page.waitForTimeout(5000);
    
    // Try to select from dropdown or just press Enter
    try {
      const autocomplete = this.page.locator(`li:has-text("${destination}")`).first();
      if (await autocomplete.isVisible({ timeout: 4000 }).catch(() => false)) {
        await autocomplete.click();
        console.log('✅ Selected destination from dropdown');
      }
    } catch (e) {
      console.log('ℹ️ No autocomplete dropdown');
    }
    
    await this.selectDates(checkIn, checkOut);
    await this.clickSearch();
  }
}