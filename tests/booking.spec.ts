import { test, expect } from "@playwright/test";
import { BookingHomePage } from "../pages/bookingHomePage";
import { SearchResultsPage } from "../pages/searchResultPage";
import { HotelDetailsPage } from "../pages/hotelDetailsPage";
import { ExcelUtil } from "../excel/excelUtil";
import path from "path";

// === Load Excel Data ===
const excelFile = "BookingTestData.xlsx";
const sheetName = "TestData";

// Update check-in/check-out dates automatically before running
ExcelUtil.updateDates(excelFile, sheetName, "CheckInDate", "CheckOutDate");
const bookingData = ExcelUtil.getTestData(excelFile, sheetName);

/**
 * ✅ Playwright Test - Hotel Booking
 * Steps:
 * 1. Open booking.com
 * 2. Search for location, check-in, and check-out dates
 * 3. Select the specified hotel
 * 4. Verify dates on hotel page
 * 5. Reserve a room
 */
for (const data of bookingData) {
  const { Location, CheckInDate, CheckOutDate, HotelName } = data;

  test.describe(`Hotel Booking Test - ${HotelName}`, () => {
    test(`Book hotel in ${Location}`, async ({ page }) => {
      console.log(
        `========== Starting Hotel Booking Test for ${HotelName} ==========`
      );

      const homePage = new BookingHomePage(page);
      const searchResultsPage = new SearchResultsPage(page);

      // Step 1: Navigate to Booking.com
      await homePage.navigateToBooking();
      await expect(await homePage.isHomePageLoaded()).toBeTruthy();
      console.log("✓ Home page loaded successfully");

      // Step 2: Search for hotel
      await homePage.searchHotel(Location, CheckInDate, CheckOutDate);
      console.log("✓ Hotel search completed");

      // Step 3: Verify search results page loaded
      await expect(
        await searchResultsPage.isSearchResultsPageLoaded()
      ).toBeTruthy();
      console.log("✓ Search results page loaded");

      // Step 4: Select hotel and switch to the new tab
      const newHotelPage = await searchResultsPage.selectHotel(HotelName);
      console.log(`✓ Hotel selected: ${HotelName}`);

      // Step 5: Use the new tab for hotel details
      const hotelDetailsPage = new HotelDetailsPage(newHotelPage);
      await expect(
        await hotelDetailsPage.isHotelDetailsPageLoaded()
      ).toBeTruthy();
      console.log("✓ Hotel details page loaded");

      // Step 6: Click "See Availability"
      await hotelDetailsPage.clickSeeAvailability();
      console.log("✓ Clicked See Availability button");

      // Step 7: Verify displayed dates
      const displayedCheckIn = await hotelDetailsPage.getDisplayedCheckInDate();
      const displayedCheckOut =
        await hotelDetailsPage.getDisplayedCheckOutDate();
      const expectedCheckIn = await ExcelUtil.formatBookingDate(CheckInDate);
      const expectedCheckOut = await ExcelUtil.formatBookingDate(CheckOutDate);
      expect(displayedCheckIn.toLowerCase()).toContain(
        expectedCheckIn.toLowerCase()
      );
      expect(displayedCheckOut.toLowerCase()).toContain(
        expectedCheckOut.toLowerCase()
      );

      console.log("✓ Dates verified successfully");

      // Step 8: Select room and reserve
      await hotelDetailsPage.selectRoomAndReserve(0);
      console.log("✓ Room selected and reserve button clicked");

      console.log(
        `========== Hotel Booking Test Completed Successfully for ${HotelName} ==========`
      );
    });
  });
}
