# 🏨 Booking Holiday with Playwright

An automated end-to-end testing framework for hotel booking workflows on Booking.com using **Playwright** and **TypeScript**. This project demonstrates modern test automation with data-driven testing using Excel spreadsheets.

## 📋 Project Overview

This framework automates the complete hotel booking journey:
1. Navigate to Booking.com
2. Search for hotels by location and dates
3. Select a specific hotel from search results
4. Verify booking details and availability
5. Complete room reservation

The tests are **data-driven**, pulling test cases from an Excel spreadsheet, allowing non-technical stakeholders to define test scenarios.

## 🎯 Key Features

- ✅ **Page Object Model (POM)** - Clean separation of test logic and page interactions
- ✅ **Data-Driven Testing** - Test data stored in Excel (`BookingTestData.xlsx`)
- ✅ **Automatic Date Management** - Automatically updates check-in/check-out dates before each test run
- ✅ **Multi-Tab Handling** - Seamlessly switches between browser tabs when hotel links open in new windows
- ✅ **Comprehensive Logging** - Detailed console logs for debugging and test tracking
- ✅ **Screenshot & Video Reports** - Captures screenshots and videos on test failure
- ✅ **HTML Test Reports** - Beautiful HTML reports with test results and traces
- ✅ **Cross-browser Support** - Configured for Chromium browser with headless option

## 📁 Project Structure

```
.
├── tests/
│   ├── booking.spec.ts          # Main test suite - Hotel booking workflows
│   └── baseTest.ts              # Base test configuration
├── pages/
│   ├── basePage.ts              # Base page class with common methods
│   ├── bookingHomePage.ts       # Page Object for Booking.com homepage
│   ├── searchResultPage.ts      # Page Object for search results page
│   └── hotelDetailsPage.ts      # Page Object for hotel details page
├── excel/
│   └── excelUtil.ts             # Utility class for reading/updating Excel data
├── reports/                     # Generated HTML test reports
├── test-results/                # Test artifacts (screenshots, videos, traces)
├── playwright.config.ts         # Playwright configuration
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## 🔧 Technology Stack

- **Playwright** (v1.56.1) - Browser automation framework
- **TypeScript** - Type-safe test scripts
- **Node.js** - JavaScript runtime
- **XLSX** (v0.18.5) - Excel file reader/writer for data-driven tests

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/MohamedMostafaSW/BookingHolidayWithPlayWright.git
   cd BookingHolidayWithPlayWright
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Prepare test data**
   - Create a file `excel/BookingTestData.xlsx` with the following columns:
     - `Location` - City or hotel location
     - `CheckInDate` - Check-in date
     - `CheckOutDate` - Check-out date
     - `HotelName` - Name of the hotel to book
   
   Example:
   | Location | CheckInDate | CheckOutDate | HotelName |
   |----------|-------------|--------------|-----------|
   | Paris    | 2025-12-01  | 2025-12-05   | Le Marais Hotel |
   | London   | 2025-12-10  | 2025-12-15   | The Savoy |

4. **Install Playwright browsers** (if not automatically installed)
   ```bash
   npx playwright install
   ```

## 🚀 Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npx playwright test tests/booking.spec.ts
```

### Run with UI mode (interactive debugging)
```bash
npx playwright test --ui
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run in debug mode
```bash
npx playwright test --debug
```

### Generate and view HTML report
```bash
npx playwright show-report
```

## ⚙️ Configuration

### Playwright Configuration (`playwright.config.ts`)

- **Test Timeout**: 2 minutes per test
- **Expect Timeout**: 10 seconds for assertions
- **Action Timeout**: 15 seconds for clicks, fills, etc.
- **Navigation Timeout**: 30 seconds for page loads
- **Retries**: 2 retries on CI, 0 on local runs
- **Browser**: Chromium (Chrome) in non-headless mode
- **Screenshots**: Captured on test failure
- **Videos**: Recorded on test failure
- **Traces**: Recorded on test failure for detailed debugging

## 📊 Page Objects

### BasePage (`pages/basePage.ts`)
Base class with reusable methods:
- `click()` - Click on elements with wait
- `type()` - Fill text input fields
- `isDisplayed()` - Check element visibility
- `scrollToElement()` - Scroll to view element
- `waitForPageLoad()` - Wait for full page load
- `switchToNewTabAfterClick()` - Handle multi-tab scenarios

### BookingHomePage (`pages/bookingHomePage.ts`)
- `navigateToBooking()` - Go to Booking.com
- `isHomePageLoaded()` - Verify homepage loaded
- `searchHotel()` - Search hotels by location and dates

### SearchResultPage (`pages/searchResultPage.ts`)
- `isSearchResultsPageLoaded()` - Verify results page
- `selectHotel()` - Select hotel from results (handles new tabs)

### HotelDetailsPage (`pages/hotelDetailsPage.ts`)
- `isHotelDetailsPageLoaded()` - Verify details page
- `clickSeeAvailability()` - Click availability button
- `getDisplayedCheckInDate()` - Get check-in date from UI
- `getDisplayedCheckOutDate()` - Get check-out date from UI
- `selectRoomAndReserve()` - Complete booking

## 📈 Test Data Management

### ExcelUtil Class (`excel/excelUtil.ts`)

**Methods:**
- `getTestData(fileName, sheetName)` - Read test data from Excel
- `updateDates(fileName, sheetName, checkInCol, checkOutCol)` - Automatically update dates
- `formatBookingDate(dateStr)` - Format dates for UI comparison

**Features:**
- Automatically updates check-in and check-out dates to current date + 60 days
- Reads multiple test cases from a single Excel file
- Supports date formatting for UI assertions

## 🧪 Test Execution Flow

```
For each test data row in Excel:
  ├── Load test data (Location, CheckInDate, CheckOutDate, HotelName)
  ├── Update dates automatically
  ├── Navigate to Booking.com
  ├── Perform hotel search
  ├── Verify search results page
  ├── Select hotel (handle new tab)
  ├── Verify hotel details page
  ├── Click "See Availability"
  ├── Verify dates displayed match expected dates
  ├── Select room and complete reservation
  └── Generate test report
```

## 📊 Test Reports

After each test run, reports are generated in:
- **HTML Report**: `reports/index.html` - Comprehensive test results with screenshots and videos
- **Console Output**: Detailed logs with ✅/❌ indicators for each step

View the HTML report:
```bash
npx playwright show-report
```

## 🐛 Debugging

### Debug Mode
```bash
npx playwright test --debug
```
Opens Playwright Inspector to step through tests.

### View Traces
Traces are automatically saved on failure in `test-results/`. Open them:
```bash
npx playwright show-trace <trace-file-path>
```

### Screenshots & Videos
- Automatic screenshots on failure: `test-results/`
- Videos recorded on failure: `test-results/`

## 📝 Best Practices

1. **Keep test data in Excel** - Non-technical team members can maintain test cases
2. **Use Page Object Model** - Reduces code duplication and improves maintainability
3. **Meaningful element names** - Log messages should clearly describe what's being tested
4. **Proper waits** - Use explicit waits instead of fixed delays
5. **Error handling** - All methods include try-catch with informative error messages

## ⚠️ Important Notes

- **Dynamic Dates**: Check-in/check-out dates are automatically updated to today + 60 days before each test run
- **New Tab Handling**: The framework automatically detects and switches to hotel detail pages opened in new tabs
- **Real Browser**: Tests run in non-headless Chrome to ensure realistic user interaction simulation

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## 📄 License

ISC License

## 👤 Author

Mohamed Mostafa (@MohamedMostafaSW)

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev)
- [Booking.com](https://www.booking.com)
- [XLSX Documentation](https://github.com/SheetJS/sheetjs)

---

**Last Updated**: November 2025
