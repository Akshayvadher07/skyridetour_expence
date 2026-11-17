// =============================================================================
// SkyRideTour — Trip Validation Schema
// Inline Customer Details (Name, Phone, Email, Address)
// =============================================================================

import { z } from "zod";

// ─── Enums (mirrors Prisma) ────────────────────────────────────────────────────

export const TRIP_TYPES       = ["ONE_WAY", "ROUND_TRIP", "LOCAL", "MULTI_DAY"] as const;
export const PAYMENT_STATUSES = ["PAID", "PARTIAL", "PENDING"] as const;
export const PAYMENT_METHODS  = ["CASH", "UPI", "BANK_TRANSFER", "OTHER"] as const;
export const TOLL_TYPES       = ["NORMAL", "ANNUAL_PASS", "FASTAG", "FREE", "OTHER"] as const;

export const TRIP_TYPE_LABELS: Record<typeof TRIP_TYPES[number], string> = {
  ONE_WAY:    "One Way",
  ROUND_TRIP: "Round Trip",
  LOCAL:      "Local",
  MULTI_DAY:  "Multi Day",
};

export const PAYMENT_STATUS_LABELS: Record<typeof PAYMENT_STATUSES[number], string> = {
  PAID:    "Paid",
  PARTIAL: "Partial",
  PENDING: "Pending",
};

export const PAYMENT_METHOD_LABELS: Record<typeof PAYMENT_METHODS[number], string> = {
  CASH:          "Cash",
  UPI:           "UPI",
  BANK_TRANSFER: "Bank Transfer",
  OTHER:         "Other",
};

export const TOLL_TYPE_LABELS: Record<typeof TOLL_TYPES[number], string> = {
  NORMAL:      "Cash / Ticket",
  ANNUAL_PASS: "Annual Pass (₹0 trip cost)",
  FASTAG:      "FASTag",
  FREE:        "Free",
  OTHER:       "Other",
};

// ─── Core Trip Schema ─────────────────────────────────────────────────────────

export const tripSchema = z.object({
  date:            z.string().min(1, "Trip date is required"),

  // Inline Customer Details
  customerName:    z.string().min(2, "Customer name must be at least 2 characters").max(100).trim(),
  customerPhone:   z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  customerEmail:   z.string().email("Invalid email").optional().or(z.literal("")),
  customerAddress: z.string().max(300).optional().or(z.literal("")),

  // Route
  pickupLocation:  z.string().min(2, "Pickup location is required").max(200).trim(),
  dropLocation:    z.string().min(2, "Drop location is required").max(200).trim(),
  tripType:        z.enum(TRIP_TYPES),

  // Assignment
  vehicleId: z.string().optional().or(z.literal("")),
  driverId:  z.string().optional().or(z.literal("")),

  // Multi-day
  startDate: z.string().optional().or(z.literal("")),
  endDate:   z.string().optional().or(z.literal("")),

  // Odometer
  startKm: z.coerce.number().min(0).optional(),
  endKm:   z.coerce.number().min(0).optional(),

  // Revenue
  tripAmount:    z.coerce.number().min(0, "Trip amount cannot be negative").default(0),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("PENDING"),
  paymentMethod: z.enum(PAYMENT_METHODS).default("CASH"),

  // Direct Expenses — all default 0
  cngExpense:           z.coerce.number().min(0).default(0),
  petrolExpense:        z.coerce.number().min(0).default(0),
  dieselExpense:        z.coerce.number().min(0).default(0),
  tollType:             z.enum(TOLL_TYPES).default("NORMAL"),
  tollExpense:          z.coerce.number().min(0).default(0),
  parkingExpense:       z.coerce.number().min(0).default(0),
  driverExpense:        z.coerce.number().min(0).default(0),
  foodExpense:          z.coerce.number().min(0).default(0),
  accommodationExpense: z.coerce.number().min(0).default(0),
  otherExpense:         z.coerce.number().min(0).default(0),
  otherExpenseNotes:    z.string().max(500).optional().or(z.literal("")),

  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const updateTripSchema = tripSchema.partial();

export type TripInput       = z.infer<typeof tripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
