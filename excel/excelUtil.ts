import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

export class ExcelUtil {
  private static readonly TEST_DATA_PATH = path.join(process.cwd(), "excel");

  /**
   * Read all data from an Excel sheet
   * @param fileName Excel file name (e.g., data.xlsx)
   * @param sheetName Sheet name
   * @returns Array of objects representing each row
   */
  static getTestData(
    fileName: string,
    sheetName: string
  ): Record<string, any>[] {
    const filePath = path.join(this.TEST_DATA_PATH, fileName);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return [];
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      console.error(`❌ Sheet not found: ${sheetName}`);
      return [];
    }

    // 👇 Add <Record<string, any>> for type safety
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
    console.log(`✅ Loaded ${data.length} rows from sheet: ${sheetName}`);
    return data;
  }

  /**
   * Update check-in/check-out dates in Excel
   * @param fileName Excel file name
   * @param sheetName Sheet name
   * @param checkInCol Column header for check-in
   * @param checkOutCol Column header for check-out
   */
  static updateDates(
    fileName: string,
    sheetName: string,
    checkInCol: string,
    checkOutCol: string
  ): void {
    const filePath = path.join(this.TEST_DATA_PATH, fileName);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      console.error(`❌ Sheet not found: ${sheetName}`);
      return;
    }

    const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    const today = new Date();
    const checkOut = new Date(today);
    checkOut.setDate(today.getDate() + 60);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    data.forEach((row) => {
      row[checkInCol] = formatDate(today);
      row[checkOutCol] = formatDate(checkOut);
    });

    const updatedSheet = XLSX.utils.json_to_sheet(data);
    workbook.Sheets[sheetName] = updatedSheet;
    XLSX.writeFile(workbook, filePath);

    console.log(`✅ Updated dates successfully in ${fileName}`);
  }
  // ✅ Convert '2025-11-02' → 'Sun, Nov 2'
  static formatBookingDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
}
