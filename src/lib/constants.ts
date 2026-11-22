// =============================================================================
// SkyRideTour — Application Constants
// Synced with prisma/schema.prisma enums
// =============================================================================

import type {
  TripType,
  PaymentStatus,
  PaymentMethod,
  TollType,
  ExpenseCategory,
  DriverStatus,
  FuelType,
  VehicleType,
  UserRole,
} from "@prisma/client";

// ─── Re-exports for convenience ───────────────────────────────────────────────
export type {
  TripType, PaymentStatus, PaymentMethod,
  TollType, ExpenseCategory, DriverStatus,
  FuelType, VehicleType, UserRole,
};

// ─── App Identity ─────────────────────────────────────────────────────────────
export const APP_NAME          = "SkyRideTour";
export const APP_TAGLINE       = "Travel Management System";
export const INVOICE_PREFIX    = "SRT";
export const CURRENCY_SYMBOL   = "₹";
export const LOCALE            = "en-IN";

// ─── Trip Types ───────────────────────────────────────────────────────────────
export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  ONE_WAY:     "One Way",
  ROUND_TRIP:  "Round Trip",
  LOCAL:       "Local",
  MULTI_DAY:   "Multi-Day",
};

export const TRIP_TYPES: { value: TripType; label: string }[] = [
  { value: "ONE_WAY",    label: "One Way" },
  { value: "ROUND_TRIP", label: "Round Trip" },
  { value: "LOCAL",      label: "Local" },
  { value: "MULTI_DAY",  label: "Multi-Day" },
];

// ─── Payment Status ───────────────────────────────────────────────────────────
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  PAID:    "Paid",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-red-100 text-red-700 border-red-200",
  PARTIAL: "bg-amber-100 text-amber-700 border-amber-200",
  PAID:    "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// ─── Payment Methods ──────────────────────────────────────────────────────────
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH:         "Cash",
  UPI:          "UPI",
  BANK_TRANSFER:"Bank Transfer",
  OTHER:        "Other",
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH",          label: "Cash" },
  { value: "UPI",           label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "OTHER",         label: "Other" },
];

// ─── Toll Types ───────────────────────────────────────────────────────────────
export const TOLL_TYPE_LABELS: Record<TollType, string> = {
  NORMAL:      "Cash at Booth",
  ANNUAL_PASS: "Annual Pass (₹0 trip cost)",
  FASTAG:      "FASTag",
  FREE:        "No Toll",
  OTHER:       "Other",
};

export const TOLL_TYPES: { value: TollType; label: string; description: string }[] = [
  { value: "NORMAL",      label: "Cash at Booth",          description: "Enter actual cash paid" },
  { value: "ANNUAL_PASS", label: "Annual Pass",            description: "No direct cost — pass logs usage" },
  { value: "FASTAG",      label: "FASTag",                 description: "Enter amount deducted from wallet" },
  { value: "FREE",        label: "No Toll on This Route",  description: "Zero cost" },
  { value: "OTHER",       label: "Other",                  description: "Specify in notes" },
];

// ─── Expense Categories ───────────────────────────────────────────────────────
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  CNG:           "CNG Fuel",
  PETROL:        "Petrol Fuel",
  DIESEL:        "Diesel Fuel",
  TOLL:          "Toll Charges",
  PARKING:       "Parking",
  FOOD:          "Food / Meals",
  ACCOMMODATION: "Accommodation",
  MAINTENANCE:   "Maintenance",
  REPAIR:        "Repair",
  INSURANCE:     "Insurance",
  DRIVER_SALARY: "Driver Salary",
  CLEANING:      "Cleaning",
  SERVICE:       "Vehicle Service",
  OTHER:         "Other",
};

/** Expenses typically logged as vehicle/business overhead (not per-trip) */
export const OVERHEAD_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "MAINTENANCE",
  "REPAIR",
  "INSURANCE",
  "DRIVER_SALARY",
  "CLEANING",
  "SERVICE",
  "OTHER",
];

/** Expenses typically logged directly against a trip */
export const TRIP_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "CNG",
  "PETROL",
  "DIESEL",
  "TOLL",
  "PARKING",
  "FOOD",
  "ACCOMMODATION",
  "OTHER",
];

// ─── Driver Status ────────────────────────────────────────────────────────────
export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  ACTIVE:   "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
};

export const DRIVER_STATUS_COLORS: Record<DriverStatus, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  ON_LEAVE: "bg-amber-100 text-amber-700",
};

// ─── Fuel Types ───────────────────────────────────────────────────────────────
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  CNG:      "CNG",
  PETROL:   "Petrol",
  DIESEL:   "Diesel",
  ELECTRIC: "Electric",
  HYBRID:   "Hybrid",
};

/** Maps vehicle fuelType to the matching trip expense field name */
export const FUEL_TYPE_TO_EXPENSE_FIELD: Record<FuelType, string> = {
  CNG:      "cngExpense",
  PETROL:   "petrolExpense",
  DIESEL:   "dieselExpense",
  ELECTRIC: "otherExpense",   // EV charging logged under otherExpense
  HYBRID:   "petrolExpense",
};

// ─── Vehicle Types ────────────────────────────────────────────────────────────
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  SEDAN:           "Sedan",
  SUV:             "SUV",
  HATCHBACK:       "Hatchback",
  VAN:             "Van",
  TEMPO_TRAVELLER: "Tempo Traveller",
  MINI_BUS:        "Mini Bus",
  LUXURY:          "Luxury",
  OTHER:           "Other",
};

// ─── User Roles ───────────────────────────────────────────────────────────────
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:   "Administrator",
  OWNER:   "Owner",
  MANAGER: "Manager",
  CLIENT:  "Client",
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
export const DEFAULT_DRIVER_ALLOWANCE  = 150;     // ₹150/day
export const DEFAULT_PARKING_EXPENSE   = 0;
export const INVOICE_NUMBER_PAD        = 4;        // SRT-2026-0001

// ─── Popular Locations (Gujarat-centric for SkyRideTour) ──────────────────────
export const POPULAR_LOCATIONS = [
  "Somnath",
  "Dwarka",
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Jamnagar",
  "Bhavnagar",
  "Gandhinagar",
  "Anand",
  "Nadiad",
  "Bharuch",
  "Porbandar",
  "Veraval",
  "Junagadh",
  "Diu",
  "Mumbai",
  "Pune",
  "Udaipur",
  "Jaipur",
  "Goa",
] as const;

export type PopularLocation = (typeof POPULAR_LOCATIONS)[number];
