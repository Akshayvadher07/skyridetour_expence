// =============================================================================
// SkyRideTour — Server-Side Financial Calculation Engine (Step 12)
// ALL financial values are computed here — never on the client.
//
// Core Rules:
//   1. Direct Trip Expenses = CNG + Petrol + Diesel + Toll + Parking
//                           + Driver Expense + Food + Accommodation + Other
//   2. If TollType === 'ANNUAL_PASS' → direct trip toll expense = ₹0.00
//      (the pass cost is a business overhead, not a per-trip charge)
//   3. Net Profit    = Trip Amount - Total Expense
//   4. Profit Margin = (Net Profit / Trip Amount) * 100   [0 if tripAmount = 0]
//
// Benchmark Verification:
//   Trip Amount ₹3,000 | CNG ₹800 | Petrol ₹0 | Toll: ANNUAL_PASS (₹0)
//   Parking ₹200 | Driver Allowance ₹150
//   → Total Expense = ₹1,150.00 | Net Profit = ₹1,850.00 | Margin = 61.67%
// =============================================================================

export type TollType =
  | "NORMAL"
  | "ANNUAL_PASS"
  | "FASTAG"
  | "FREE"
  | "OTHER";

export interface TripExpenseInput {
  tripAmount:    number;   // ₹ gross charged to customer
  cng:           number;
  petrol:        number;
  diesel:        number;
  tollType:      TollType;
  tollExpense:   number;   // only counted when tollType is NORMAL/FASTAG/OTHER
  parking:       number;
  driverExpense: number;
  food:          number;
  accommodation: number;
  otherExpense:  number;
}

export interface FinancialResult {
  totalExpense:  number;  // rounded to 2 decimal places
  netProfit:     number;
  profitMargin:  number;  // percentage, rounded to 2 decimal places
}

/**
 * Compute trip financials on the server.
 * This is the single source of truth — called from createTrip and updateTrip.
 */
export function computeTripFinancials(input: TripExpenseInput): FinancialResult {
  const {
    tripAmount,
    cng, petrol, diesel,
    tollType, tollExpense,
    parking, driverExpense,
    food, accommodation, otherExpense,
  } = input;

  // Enforce toll pass rule: ANNUAL_PASS and FREE → ₹0 direct trip expense
  const effectiveTollExpense =
    tollType === "ANNUAL_PASS" || tollType === "FREE"
      ? 0
      : tollExpense;

  const totalExpense = round2(
    cng + petrol + diesel
    + effectiveTollExpense
    + parking + driverExpense
    + food + accommodation + otherExpense
  );

  const netProfit    = round2(tripAmount - totalExpense);

  const profitMargin =
    tripAmount > 0
      ? round2((netProfit / tripAmount) * 100)
      : 0;

  return { totalExpense, netProfit, profitMargin };
}

/** Round a number to 2 decimal places (avoids floating-point drift) */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Validate the benchmark scenario from the business requirements.
 * Called in tests — not in production runtime.
 */
export function runBenchmarkVerification(): boolean {
  const result = computeTripFinancials({
    tripAmount:    3000,
    cng:           800,
    petrol:        0,
    diesel:        0,
    tollType:      "ANNUAL_PASS",
    tollExpense:   0,     // would be ignored even if non-zero
    parking:       200,
    driverExpense: 150,
    food:          0,
    accommodation: 0,
    otherExpense:  0,
  });

  const ok =
    result.totalExpense  === 1150   &&
    result.netProfit     === 1850   &&
    result.profitMargin  === 61.67;

  if (!ok) {
    console.error("[Benchmark FAILED]", result);
  }
  return ok;
}
