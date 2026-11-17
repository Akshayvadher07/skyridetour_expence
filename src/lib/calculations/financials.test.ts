// =============================================================================
// SkyRideTour — Financial & Business Logic Automated Verification Test (Step 24)
// Run with: npx tsx src/lib/calculations/financials.test.ts
// =============================================================================

import { computeTripFinancials, runBenchmarkVerification } from "./financials";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
}

function runTests() {
  console.log("=========================================================");
  console.log("SkyRideTour — Financial & Business Logic Test Suite");
  console.log("=========================================================\n");

  // TEST 1: Mandatory Benchmark Case
  console.log("Testing Benchmark Scenario...");
  console.log("Trip Date: 25-07-2026 | Route: Somnath -> Somnath (Round Trip) | Gross: ₹3,000");
  console.log("Expenses: CNG ₹800, Toll: Annual Pass (₹0), Parking ₹200, Driver Allowance ₹150");

  const benchmarkResult = computeTripFinancials({
    tripAmount:    3000,
    cng:           800,
    petrol:        0,
    diesel:        0,
    tollType:      "ANNUAL_PASS",
    tollExpense:   0,
    parking:       200,
    driverExpense: 150,
    food:          0,
    accommodation: 0,
    otherExpense:  0,
  });

  console.log("Result:", benchmarkResult);

  assert(benchmarkResult.totalExpense === 1150.00, `Expected Total Expense = 1150.00, got ${benchmarkResult.totalExpense}`);
  assert(benchmarkResult.netProfit === 1850.00, `Expected Net Profit = 1850.00, got ${benchmarkResult.netProfit}`);
  assert(benchmarkResult.profitMargin === 61.67, `Expected Profit Margin = 61.67%, got ${benchmarkResult.profitMargin}`);

  console.log("✅ Benchmark Scenario PASSED!\n");

  // TEST 2: Normal Toll Expense
  console.log("Testing Normal Toll Expense...");
  const normalTollResult = computeTripFinancials({
    tripAmount:    3000,
    cng:           800,
    petrol:        0,
    diesel:        0,
    tollType:      "NORMAL",
    tollExpense:   300,
    parking:       200,
    driverExpense: 150,
    food:          0,
    accommodation: 0,
    otherExpense:  0,
  });

  assert(normalTollResult.totalExpense === 1450.00, `Expected Total Expense = 1450.00, got ${normalTollResult.totalExpense}`);
  assert(normalTollResult.netProfit === 1550.00, `Expected Net Profit = 1550.00, got ${normalTollResult.netProfit}`);
  assert(normalTollResult.profitMargin === 51.67, `Expected Profit Margin = 51.67%, got ${normalTollResult.profitMargin}`);

  console.log("✅ Normal Toll Expense PASSED!\n");

  // TEST 3: Zero Revenue Case
  console.log("Testing Zero Revenue Case...");
  const zeroRev = computeTripFinancials({
    tripAmount:    0,
    cng:           500,
    petrol:        0,
    diesel:        0,
    tollType:      "NORMAL",
    tollExpense:   100,
    parking:       0,
    driverExpense: 0,
    food:          0,
    accommodation: 0,
    otherExpense:  0,
  });

  assert(zeroRev.totalExpense === 600.00, `Expected Total Expense = 600.00, got ${zeroRev.totalExpense}`);
  assert(zeroRev.netProfit === -600.00, `Expected Net Profit = -600.00, got ${zeroRev.netProfit}`);
  assert(zeroRev.profitMargin === 0, `Expected Profit Margin = 0%, got ${zeroRev.profitMargin}`);

  console.log("✅ Zero Revenue Case PASSED!\n");

  // TEST 4: Built-in Helper
  assert(runBenchmarkVerification(), "runBenchmarkVerification helper should return true");
  console.log("✅ runBenchmarkVerification Helper PASSED!\n");

  console.log("=========================================================");
  console.log("🎉 ALL FINANCIAL & BUSINESS LOGIC TESTS PASSED 100%");
  console.log("=========================================================");
}

try {
  runTests();
} catch (err: any) {
  console.error("❌ TEST FAILED:", err.message);
  process.exit(1);
}
