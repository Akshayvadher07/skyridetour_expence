import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

// ─── Tailwind Utility ─────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency (INR / Paise) ───────────────────────────────────────────────────

/**
 * Convert paise (integer) → display string in Indian number format
 * e.g. 300000 → "₹3,000.00"
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Convert paise → rupees number
 * e.g. 300000 → 3000
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Convert rupees (user input) → paise integer
 * e.g. 3000 → 300000, 3000.50 → 300050
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Format a plain rupee number in Indian format (no conversion from paise)
 * e.g. 3000 → "₹3,000"
 * @deprecated Prefer formatPaise() for paise-stored values
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Percentage ───────────────────────────────────────────────────────────────

/**
 * Format a decimal ratio as a percentage string
 * e.g. formatPercent(0.6167) → "61.67%"
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Compute profit margin as a percentage string
 * e.g. profitMargin(185000, 300000) → "61.67%"
 */
export function profitMargin(netProfitPaise: number, grossPaise: number): string {
  if (grossPaise === 0) return "0.00%";
  return formatPercent(netProfitPaise / grossPaise);
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

/**
 * Display a JS Date or ISO string in DD-MM-YYYY (Indian standard)
 * e.g. new Date("2026-07-25") → "25-07-2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd-MM-yyyy");
}

/**
 * Display a JS Date or ISO string in DD-MM-YYYY HH:mm (Indian local)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd-MM-yyyy HH:mm");
}

/**
 * Returns today's date as a JS Date (midnight IST)
 */
export function today(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

// ─── Invoice Number ───────────────────────────────────────────────────────────

/**
 * Generate the next invoice number for the given year and count
 * e.g. generateInvoiceNumber(2026, 42) → "SRT-2026-0042"
 */
export function generateInvoiceNumber(year: number, sequence: number): string {
  return `SRT-${year}-${String(sequence).padStart(4, "0")}`;
}

// ─── Trip Profit Helpers ──────────────────────────────────────────────────────

/**
 * Compute net profit in paise from gross and direct expenses.
 * TOLL_PASS_USED expenses (amount=0) are intentionally excluded by their 0 value.
 */
export function computeNetProfit(grossPaise: number, totalDirectExpensePaise: number): number {
  return grossPaise - totalDirectExpensePaise;
}

/**
 * Compute toll-pass amortised cost per use
 */
export function amortisedCostPerUse(passCostPaise: number, estimatedTotalUses: number): number {
  if (estimatedTotalUses === 0) return 0;
  return Math.round(passCostPaise / estimatedTotalUses);
}
