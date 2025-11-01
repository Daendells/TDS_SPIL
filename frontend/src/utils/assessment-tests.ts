import { ValueAssessmentStorage } from "../lib/assessment-storage";
import { ValueAssessmentData } from "../app/value-assessment/page";

// Mock data untuk testing
const mockAssessmentData: ValueAssessmentData = {
  email: "test@example.com",
  consent: true,
  fullName: "John Doe",
  identityNumber: "1234567890",
  rank: "nakhoda",
  vesselName: "MV Test Ship",
  seamanCode: "TST001",
  section1Answers: { 1: 1, 2: 2, 3: 3 },
  section2Answers: { 1: "A", 2: "B", 3: "C" },
  section3Answers: { 1: 4, 2: 5, 3: 6 },
  startTime: "2025-10-16T08:00:00.000Z",
  currentStep: 3,
  section1StartTime: "2025-10-16T08:05:00.000Z",
  section2StartTime: "2025-10-16T08:35:00.000Z",
  section3StartTime: "2025-10-16T09:05:00.000Z",
};

/**
 * Test Suite untuk Value Assessment FormData System
 */
export class AssessmentSystemTests {
  /**
   * Test basic save/load functionality
   */
  static testBasicSaveLoad(): boolean {
    try {
      console.log("Testing basic save/load...");

      // Clear any existing data
      ValueAssessmentStorage.clear();

      // Save test data
      ValueAssessmentStorage.save(mockAssessmentData, 3);

      // Load data
      const { data, step } = ValueAssessmentStorage.load();

      // Validate
      const isValid =
        data !== null &&
        step === 3 &&
        data.email === mockAssessmentData.email &&
        data.seamanCode === mockAssessmentData.seamanCode;

      console.log("Basic save/load test:", isValid ? "PASSED" : "FAILED");
      return isValid;
    } catch (error) {
      console.error("Basic save/load test FAILED:", error);
      return false;
    }
  }

  /**
   * Test progress calculation
   */
  static testProgressCalculation(): boolean {
    try {
      console.log("Testing progress calculation...");

      const progress = ValueAssessmentStorage.getProgress(mockAssessmentData);
      const expected = 100; // All sections completed

      const isValid = progress === expected;
      console.log(
        "Progress calculation test:",
        isValid ? "PASSED" : "FAILED",
        `(${progress}%)`
      );
      return isValid;
    } catch (error) {
      console.error("Progress calculation test FAILED:", error);
      return false;
    }
  }

  /**
   * Test time remaining calculation
   */
  static testTimeRemaining(): boolean {
    try {
      console.log("Testing time remaining calculation...");

      // Test with start time 10 minutes ago
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const remaining = ValueAssessmentStorage.getTimeRemaining(
        tenMinutesAgo,
        30
      );
      const expected = 20 * 60; // 20 minutes should remain

      // Allow 5 second tolerance for execution time
      const isValid = Math.abs(remaining - expected) <= 5;

      console.log(
        "Time remaining test:",
        isValid ? "PASSED" : "FAILED",
        `(${remaining}s remaining, expected ~${expected}s)`
      );
      return isValid;
    } catch (error) {
      console.error("Time remaining test FAILED:", error);
      return false;
    }
  }

  /**
   * Test time formatting
   */
  static testTimeFormatting(): boolean {
    try {
      console.log("Testing time formatting...");

      const testCases = [
        { input: 3661, expected: "61:01" }, // 1 hour 1 minute 1 second
        { input: 90, expected: "01:30" }, // 1 minute 30 seconds
        { input: 45, expected: "00:45" }, // 45 seconds
        { input: 0, expected: "00:00" }, // 0 seconds
      ];

      let allPassed = true;

      for (const testCase of testCases) {
        const result = ValueAssessmentStorage.formatTime(testCase.input);
        const passed = result === testCase.expected;

        if (!passed) {
          console.error(
            `Time format test FAILED: ${testCase.input}s -> ${result} (expected ${testCase.expected})`
          );
          allPassed = false;
        }
      }

      console.log("Time formatting test:", allPassed ? "PASSED" : "FAILED");
      return allPassed;
    } catch (error) {
      console.error("Time formatting test FAILED:", error);
      return false;
    }
  }

  /**
   * Test data validation
   */
  static testDataValidation(): boolean {
    try {
      console.log("Testing data validation...");

      // Test valid data
      const validResult =
        ValueAssessmentStorage["validateAssessmentData"](mockAssessmentData);

      // Test invalid data
      const invalidData = { email: "test", invalid: true };
      const invalidResult =
        !ValueAssessmentStorage["validateAssessmentData"](invalidData);

      // Test null data
      const nullResult =
        !ValueAssessmentStorage["validateAssessmentData"](null);

      const allValid = validResult && invalidResult && nullResult;

      console.log("Data validation test:", allValid ? "PASSED" : "FAILED");
      return allValid;
    } catch (error) {
      console.error("Data validation test FAILED:", error);
      return false;
    }
  }

  /**
   * Test export functionality
   */
  static testExportFunctionality(): boolean {
    try {
      console.log("Testing export functionality...");

      // Save test data first
      ValueAssessmentStorage.save(mockAssessmentData, 3);

      // Create mock DOM element for testing
      const originalCreateElement = document.createElement;
      let downloadTriggered = false;

      document.createElement = function (tagName: string) {
        if (tagName === "a") {
          const element = originalCreateElement.call(
            document,
            tagName
          ) as HTMLAnchorElement;
          element.click = function () {
            downloadTriggered = true;
          };
          return element;
        }
        return originalCreateElement.call(document, tagName);
      };

      // Test export
      ValueAssessmentStorage.exportToFile();

      // Restore original function
      document.createElement = originalCreateElement;

      console.log(
        "Export functionality test:",
        downloadTriggered ? "PASSED" : "FAILED"
      );
      return downloadTriggered;
    } catch (error) {
      console.error("Export functionality test FAILED:", error);
      return false;
    }
  }

  /**
   * Test storage existence check
   */
  static testStorageCheck(): boolean {
    try {
      console.log("Testing storage existence check...");

      // Clear storage
      ValueAssessmentStorage.clear();
      const emptyCheck = !ValueAssessmentStorage.hasStoredData();

      // Add data
      ValueAssessmentStorage.save(mockAssessmentData, 3);
      const dataCheck = ValueAssessmentStorage.hasStoredData();

      const isValid = emptyCheck && dataCheck;

      console.log(
        "Storage existence check test:",
        isValid ? "PASSED" : "FAILED"
      );
      return isValid;
    } catch (error) {
      console.error("Storage existence check test FAILED:", error);
      return false;
    }
  }

  /**
   * Run all tests
   */
  static runAllTests(): void {
    console.log("=== Value Assessment FormData System Tests ===");

    const tests = [
      this.testBasicSaveLoad,
      this.testProgressCalculation,
      this.testTimeRemaining,
      this.testTimeFormatting,
      this.testDataValidation,
      this.testExportFunctionality,
      this.testStorageCheck,
    ];

    let passed = 0;
    const total = tests.length;

    for (const test of tests) {
      if (test.call(this)) {
        passed++;
      }
    }

    console.log(`\n=== Test Results: ${passed}/${total} tests passed ===`);

    if (passed === total) {
      console.log("🎉 All tests PASSED! FormData system is working correctly.");
    } else {
      console.warn("⚠️ Some tests FAILED. Please check the implementation.");
    }

    // Clean up
    ValueAssessmentStorage.clear();
  }
}

// Export untuk penggunaan di development
export default AssessmentSystemTests;
