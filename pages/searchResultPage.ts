import { BasePage } from "./basePage";

export class SearchResultsPage extends BasePage {
  constructor(page) {
    super(page);
  }

  private dismissButton =
    "//button[contains(@aria-label, 'Dismiss') or contains(@class, 'dismiss')]";
  private closePopupButton =
    "//button[contains(@aria-label, 'Close') or contains(@class, 'close')]";
  private hotelCards =
    "//div[@data-testid='property-card'] | //div[contains(@class, 'property-card')] | //div[contains(@data-testid, 'property')]";
  private nextPageButton =
    "//button[@aria-label='Next page' or contains(@aria-label, 'Next')] | //a[contains(@class, 'pagination-next')]";

  async handlePopups() {
    const popups = this.page.locator(
      "//button[contains(@aria-label, 'Close') or contains(@class, 'close')]"
    );
    const count = await popups.count();

    if (count > 0) {
      console.log(`Found ${count} popup(s). Closing visible ones...`);
      for (let i = 0; i < count; i++) {
        const button = popups.nth(i);
        if (await button.isVisible()) {
          const label = await button.getAttribute("aria-label");
          console.log(`✅ Closed popup: ${label}`);
          await button.click({ force: true });
          await this.page.waitForTimeout(500);
        }
      }
    } else {
      console.log("No popups found ✅");
    }
  }

  async selectHotel(hotelName: string) {
    await this.handlePopups();
    console.log(`Searching for hotel: ${hotelName}`);

    for (let page = 1; page <= 30; page++) {
      console.log(`🔎 Searching on page: ${page}`);

      const newPage = await this.searchHotel(hotelName);
      if (newPage) {
        console.log(`✅ Hotel found and new tab opened`);
        return newPage;
      }

      const hasNext = await this.goToNextPage();
      if (!hasNext) break;
    }

    throw new Error(`❌ Hotel not found: ${hotelName}`);
  }

  private async searchHotel(hotelName: string): Promise<any> {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await this.waitFor(1);

    const cards = this.page.locator(this.hotelCards);
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = await card.textContent();
      if (text?.toLowerCase().includes(hotelName.toLowerCase())) {
        console.log(`🏨 Found match: ${hotelName}`);
        const hotelLink = card.locator("xpath=.//a[@data-testid='title-link']");

        const newPage = await this.switchToNewTabAfterClick(async () => {
          await hotelLink.click({ force: true });
        });

        console.log("✅ Switched to hotel details tab successfully");
        return newPage; // Return the opened tab
      }
    }
  }

  async goToNextPage(): Promise<boolean> {
    const nextButton = this.page.locator(this.nextPageButton);

    if (!(await nextButton.isVisible())) {
      console.log("🚫 No next page button found");
      return false;
    }

    const isDisabled =
      (await nextButton.getAttribute("disabled")) !== null ||
      (await nextButton.getAttribute("aria-disabled")) === "true";

    if (isDisabled) {
      console.log("⛔ Next page button is disabled — last page reached");
      return false;
    }

    await this.scrollToBottom();
    await nextButton.click({ force: true });
    await this.waitForPageLoad();
    await this.handlePopups();

    console.log("➡️ Moved to next page");
    return true;
  }

  async isSearchResultsPageLoaded(): Promise<boolean> {
    await this.handlePopups();
    const url = this.page.url();

    if (url.includes("searchresults") || url.includes("search")) {
      return true;
    }

    const cardsCount = await this.page.locator(this.hotelCards).count();
    return cardsCount > 0;
  }
}
