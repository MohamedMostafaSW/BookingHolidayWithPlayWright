// pages/HotelDetailsPage.ts
import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";

export class HotelDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private dismissBannerButton = this.page.locator("button.js-dismiss-banner");
  private closePopupButton = this.page.locator('button[aria-label*="Close"]');

  /** Handle popups on hotel details page */
  private async handlePopups() {
    try {
      await this.page.waitForTimeout(500);

      if (await this.dismissBannerButton.isVisible().catch(() => false)) {
        await this.dismissBannerButton.click();
        console.log("✅ Dismissed banner");
      }

      if (await this.closePopupButton.isVisible().catch(() => false)) {
        await this.closePopupButton.click();
        console.log("✅ Closed popup");
      }
    } catch (e) {
      console.log("⚠️ No popups to handle");
    }
  }

  /** Get all possible availability button locators */
  private getAvailabilityButtonLocators(): Locator {
    return this.page.locator(
      [
        // Direct text matches (fastest)
        'button:has-text("See availability")',
        'button:has-text("See Availability")',
        'button:has-text("Check availability")',
        'button:has-text("See prices")',
        'a:has-text("See availability")',
        'a:has-text("See Availability")',

        // Data attributes (common on Booking.com)
        '[data-testid*="availability"]',
        '[data-id*="availability"]',

        // Class-based selectors
        'button[class*="availability"]',
        'a[class*="availability"]',

        // Case-insensitive text content
        'button:text-is("SEE AVAILABILITY")',

        // Generic fallback
        'button:has-text("availability")',
        'a:has-text("availability")',
      ].join(", ")
    );
  }

  /** Click 'See Availability' button - ROBUST VERSION */
  async clickSeeAvailability() {
    console.log("🔎 Looking for 'See Availability' button...");

    await this.handlePopups();

    // Wait for initial page load
    try {
      await this.page.waitForLoadState("domcontentloaded", { timeout: 10000 });
    } catch (e) {
      console.log("⚠️ Page load state timeout, continuing anyway");
    }

    // Progressive scrolling to trigger lazy-loaded content
    console.log("📜 Scrolling to load content...");
    await this.page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: "smooth" });
    });
    await this.page.waitForTimeout(800);

    // Get button locators
    const availabilityButtons = this.getAvailabilityButtonLocators();

    // Try to find the button with multiple strategies
    let buttonFound = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!buttonFound && attempts < maxAttempts) {
      attempts++;
      console.log(`🔍 Attempt ${attempts} to find availability button...`);

      try {
        // Check if any button is visible
        const count = await availabilityButtons.count();
        console.log(`   Found ${count} potential button(s)`);

        if (count > 0) {
          // Try to find a visible button
          for (let i = 0; i < Math.min(count, 5); i++) {
            const button = availabilityButtons.nth(i);
            const isVisible = await button.isVisible().catch(() => false);

            if (isVisible) {
              console.log(`✅ Found visible button at index ${i}`);
              await button.scrollIntoViewIfNeeded({ timeout: 3000 });
              await this.page.waitForTimeout(300);

              // Click with retry
              try {
                await this.switchToNewTabAfterClick(async () => {
                  await button.click({ timeout: 5000 });
                });
                console.log(
                  "✅ Successfully clicked availability button and handled new tab"
                );
                console.log("✅ Successfully clicked availability button");
                buttonFound = true;
                return;
              } catch (clickError) {
                console.log(`⚠️ Click failed for button ${i}, trying next...`);
                continue;
              }
            }
          }
        }

        // If not found, scroll more and try again
        if (!buttonFound && attempts < maxAttempts) {
          console.log("📜 Scrolling further...");
          await this.page.evaluate((attempt) => {
            const scrollAmount = 300 + attempt * 400;
            window.scrollTo({ top: scrollAmount, behavior: "smooth" });
          }, attempts);
          await this.page.waitForTimeout(1000);
        }
      } catch (e) {
        console.log(`⚠️ Error in attempt ${attempts}:`, e);
      }
    }

    // If still not found, try XPath as last resort
    if (!buttonFound) {
      console.log("🔍 Trying XPath selector as fallback...");
      const xpathButton = this.page
        .locator(
          `xpath=//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'availability')]`
        )
        .first();

      const xpathVisible = await xpathButton.isVisible().catch(() => false);
      if (xpathVisible) {
        await xpathButton.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(9000);
        await xpathButton.click();
        console.log("✅ Clicked availability button via XPath");
        return;
      }
    }

    // Final failure
    console.log("❌ Could not find availability button after all attempts");
    console.log("🔍 Current URL:", this.page.url());
    throw new Error("❌ Availability button not found after multiple attempts");
  }

  /** Get displayed check-in date */
  async getDisplayedCheckInDate(): Promise<string> {
    const element = this.page
      .locator(`[data-testid='date-display-field-start']`)
      .or(this.page.locator(".check-in span"))
      .or(
        this.page.locator(
          `xpath=//span[@data-testid='date-display-field-start']`
        )
      )
      .first();

    await element.waitFor({ state: "visible", timeout: 5000 });
    const date = (await element.textContent())?.trim() || "";
    console.log("🗓️ Displayed Check-in Date:", date);
    return date;
  }

  /** Get displayed check-out date */
  async getDisplayedCheckOutDate(): Promise<string> {
    const element = this.page
      .locator(`[data-testid='date-display-field-end']`)
      .or(this.page.locator(".check-out span"))
      .or(
        this.page.locator(`xpath=//span[@data-testid='date-display-field-end']`)
      )
      .first();

    await element.waitFor({ state: "visible", timeout: 5000 });
    const date = (await element.textContent())?.trim() || "";
    console.log("🗓️ Displayed Check-out Date:", date);
    return date;
  }

  /** Select a room with availability > 0 and click Reserve */
  async selectRoomAndReserve(preferredRoomIndex: number = 0) {
    console.log("🏨 Starting room selection and reservation process...");

    await this.handlePopups();
    await this.page.waitForTimeout(3000);

    // Scroll to rooms section
    await this.scrollToRoomsSection();
    await this.page.waitForTimeout(1500);

    // Expand room options if needed
    await this.expandRoomOptions();

    // Select room dynamically with availability check
    await this.selectRoom(preferredRoomIndex);

    // Wait a bit for UI updates
    await this.page.waitForTimeout(1000);

    // Click the Reserve button
    await this.clickReserveButton();

    console.log("✅ Room selection and reservation complete");
    await this.page.waitForLoadState("domcontentloaded");
  }

  /** Scroll to rooms section */
  private async scrollToRoomsSection() {
    try {
      await this.page.evaluate(() => {
        window.scrollTo({
          top: document.body.scrollHeight / 2,
          behavior: "smooth",
        });
      });
      await this.page.waitForTimeout(800);
    } catch (e) {
      console.warn("⚠️ Could not scroll to rooms section", e);
    }
  }

  /** Expand room options if needed */
  private async expandRoomOptions() {
    console.log("🔍 Looking for 'Select room' buttons...");

    const selectRoomsButtons = this.page.locator(
      `button:has-text("Select room"), 
       button:has-text("Select rooms"),
       button:has-text("Select Room"),
       button:has-text("See rooms"),
       [data-testid*="select-room"],
       button[class*="select-room"]`
    );

    const count = await selectRoomsButtons.count();
    console.log(`   Found ${count} 'Select room' button(s)`);

    if (count > 0) {
      // Try to click the first visible one
      for (let i = 0; i < Math.min(count, 3); i++) {
        const button = selectRoomsButtons.nth(i);
        const isVisible = await button.isVisible().catch(() => false);

        if (isVisible) {
          await button.scrollIntoViewIfNeeded();
          await this.page.waitForTimeout(300);
          await button.click();
          console.log("✅ Expanded room options");
          await this.page.waitForTimeout(800);
          return;
        }
      }
    } else {
      console.log(
        "ℹ️ No 'Select room' button found (rooms may already be visible)"
      );
    }
  }

  private async selectRoom(preferredIndex: number = 0) {
    try {
      const roomSelectors = this.page.locator(
        `xpath=//select[contains(@name, 'room') or contains(@class, 'room')] `
      );

      const count = await roomSelectors.count();
      console.log(`🔍 Found ${count} room selector(s)`);

      if (count === 0) {
        console.log("⚠️ No room selectors found, using default selection");
        return;
      }

      let selected = false;

      for (let i = 0; i < count; i++) {
        const selector = roomSelectors.nth(i);

        // Only visible elements
        const isVisible = await selector.isVisible().catch(() => false);
        if (!isVisible) continue;

        const tagName = await selector.evaluate((el) =>
          el.tagName.toLowerCase()
        );

        if (tagName === "select") {
          const optionsCount = await selector.locator("option").count();
          if (optionsCount <= 1) continue; // skip unavailable

          if (i === preferredIndex) {
            await selector.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(500);
            await selector.selectOption({ index: 1 }); // pick second option
            console.log(`✅ Selected room from dropdown at index ${i}`);
            selected = true;
            break;
          }
        } else if (tagName === "input") {
          const isDisabled = await selector.isDisabled().catch(() => true);
          if (isDisabled) continue;

          if (tagName === "input") {
            const isDisabled = await selector.isDisabled().catch(() => true);
            if (!isDisabled) {
              await selector.scrollIntoViewIfNeeded();
              await selector.click({ force: true }); // ✅ works even on SVG/hidden elements
              console.log(`✅ Selected radio button room at index ${i}`);
              selected = true;
              break;
            }
          }
        }
      }

      if (!selected) {
        console.log(
          "⚠️ Could not select preferred room, using first available"
        );
        for (let i = 0; i < count; i++) {
          const selector = roomSelectors.nth(i);
          const isVisible = await selector.isVisible().catch(() => false);
          if (!isVisible) continue;

          const tagName = await selector.evaluate((el) =>
            el.tagName.toLowerCase()
          );
          if (tagName === "select") {
            const optionsCount = await selector.locator("option").count();
            if (optionsCount > 1) {
              await selector.scrollIntoViewIfNeeded();
              await selector.selectOption({ index: 1 });
              console.log(`✅ Selected first available dropdown at index ${i}`);
              break;
            }
          } else if (tagName === "input") {
            const isDisabled = await selector.isDisabled().catch(() => true);
            if (!isDisabled) {
              await selector.scrollIntoViewIfNeeded();
              await selector.click();
              console.log(
                `✅ Selected first available radio button at index ${i}`
              );
              break;
            }
          }
        }
      }

      await this.page.waitForTimeout(500);
    } catch (e) {
      console.log("⚠️ Error selecting room, using default", e);
    }
  }

  /** Click "I'll reserve" button */
  private async clickReserveButton() {
    console.log("🔍 Looking for Reserve button...");

    // Wait a bit for room selection to complete
    await this.page.waitForTimeout(1000);

    // Try multiple selectors
    const reserveButtons = this.page.locator(
      `button:has-text("reserve"), 
       button:has-text("Reserve"),
       button:has-text("I'll reserve"),
       button:has-text("I'll Reserve"),
       a:has-text("reserve"),
       a:has-text("Reserve"),
       [data-testid*="reserve"],
       button[name*="reserve"],
       button[class*="reserve"]`
    );

    let count = await reserveButtons.count();
    console.log(
      `   Found ${count} potential reserve button(s) with primary selectors`
    );

    // If not found, try case-insensitive XPath
    if (count === 0) {
      console.log("🔍 Trying XPath selectors for reserve button...");
      const xpathReserveButtons = this.page.locator(
        `xpath=//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reserve')]
         | //a[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'reserve')]
         | //button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "i'll reserve")]`
      );
      count = await xpathReserveButtons.count();
      console.log(`   Found ${count} button(s) via XPath`);

      if (count > 0) {
        // Try each XPath button
        for (let i = 0; i < Math.min(count, 3); i++) {
          const button = xpathReserveButtons.nth(i);
          const isVisible = await button.isVisible().catch(() => false);

          if (isVisible) {
            const text = await button.textContent();
            console.log(`✅ Found visible reserve button: "${text?.trim()}"`);
            await button.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(500);
            await button.click();
            console.log("✅ Clicked Reserve button");
            await this.page.waitForLoadState("domcontentloaded", {
              timeout: 10000,
            });
            return;
          }
        }
      }
    } else {
      // Try each button from primary selectors
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = reserveButtons.nth(i);
        const isVisible = await button.isVisible().catch(() => false);

        if (isVisible) {
          const text = await button.textContent();
          console.log(
            `✅ Found visible reserve button at index ${i}: "${text?.trim()}"`
          );
          await button.scrollIntoViewIfNeeded();
          await this.page.waitForTimeout(500);
          await button.click();
          console.log("✅ Clicked Reserve button");
          await this.page.waitForLoadState("domcontentloaded", {
            timeout: 10000,
          });
          return;
        }
      }
    }

    // If still not found, log page info for debugging
    console.log("❌ Reserve button not found. Current URL:", this.page.url());
    console.log("💡 Possible reasons:");
    console.log("   - Need to select a room type first");
    console.log(
      "   - Button text might be different (e.g., 'Book Now', 'Continue', 'Next')"
    );
    console.log("   - Page might still be loading");

    // Try alternative button texts as last resort
    console.log("🔍 Trying alternative button texts...");
    const alternativeButtons = this.page.locator(
      `button:has-text("Book"), 
       button:has-text("Continue"),
       button:has-text("Next"),
       button:has-text("Proceed"),
       button:has-text("Confirm")`
    );

    const altCount = await alternativeButtons.count();
    if (altCount > 0) {
      console.log(`   Found ${altCount} alternative button(s)`);
      const button = alternativeButtons.first();
      const text = await button.textContent();
      console.log(`⚠️ Using alternative button: "${text?.trim()}"`);
      await button.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(500);
      await button.click();
      await this.page.waitForLoadState("domcontentloaded", { timeout: 10000 });
      return;
    }

    throw new Error("❌ Reserve button not found after trying all selectors");
  }

  /** Verify hotel details page is loaded */
  async isHotelDetailsPageLoaded(): Promise<boolean> {
    try {
      await this.page.waitForLoadState("domcontentloaded", { timeout: 15000 });
      await this.page.waitForTimeout(1000);
      console.log("✅ Hotel details page fully loaded");
      return true;
    } catch (error) {
      console.log("❌ Hotel details page did not load within timeout");
      return false;
    }
  }


}
