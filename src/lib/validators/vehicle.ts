// =============================================================================
// SkyRideTour — Vehicle Validation Schemas
// =============================================================================

import { z } from "zod";

// ─── Gujarat Registration Regex ───────────────────────────────────────────────
// Matches: GJ-01-AB-1234 or GJ01AB1234 (with or without hyphens, any state code)
// Full Indian pattern: [A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}
const REG_NUMBER_REGEX = /^[A-Z]{2}[- ]?[0-9]{1,2}[- ]?[A-Z]{1,3}[- ]?[0-9]{4}$/;

// ─── Enums (mirror Prisma enums) ─────────────────────────────────────────────

export const VEHICLE_TYPES = [
  "SEDAN", "SUV", "HATCHBACK", "VAN",
  "TEMPO_TRAVELLER", "MINI_BUS", "LUXURY", "OTHER",
] as const;

export const FUEL_TYPES = [
  "CNG", "PETROL", "DIESEL", "ELECTRIC", "HYBRID",
] as const;

export const VEHICLE_TYPE_LABELS: Record<typeof VEHICLE_TYPES[number], string> = {
  SEDAN:           "Sedan",
  SUV:             "SUV",
  HATCHBACK:       "Hatchback",
  VAN:             "Van",
  TEMPO_TRAVELLER: "Tempo Traveller",
  MINI_BUS:        "Mini Bus",
  LUXURY:          "Luxury",
  OTHER:           "Other",
};

export const FUEL_TYPE_LABELS: Record<typeof FUEL_TYPES[number], string> = {
  CNG:      "CNG",
  PETROL:   "Petrol",
  DIESEL:   "Diesel",
  ELECTRIC: "Electric (EV)",
  HYBRID:   "Hybrid",
};

// ─── Core Schema ──────────────────────────────────────────────────────────────

export const vehicleSchema = z.object({
  name: z
    .string()
    .min(2, "Vehicle name must be at least 2 characters")
    .max(100)
    .trim(),

  registrationNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(REG_NUMBER_REGEX, "Enter a valid Indian registration number (e.g. GJ-01-AB-1234)"),

  model: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),

  vehicleType: z.enum(VEHICLE_TYPES),

  fuelType: z.enum(FUEL_TYPES),

  seatingCapacity: z.coerce
    .number()
    .int()
    .min(1, "At least 1 seat")
    .max(55, "Max 55 seats")
    .default(4),

  year: z.coerce
    .number()
    .int()
    .min(1990, "Year must be 1990 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future")
    .optional()
    .nullable(),

  color: z
    .string()
    .max(50)
    .optional()
    .or(z.literal("")),

  /** ISO date string — stored as DateTime in DB */
  insuranceExpiry: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),

  pucExpiry: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),

  isActive: z.boolean().default(true),

  notes: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("")),
});

export const updateVehicleSchema = vehicleSchema.partial();

// ─── Document Expiry Status ───────────────────────────────────────────────────

export type DocStatus = "valid" | "expiring" | "expired" | "missing";

/** Returns the expiry status of a document date */
export function getDocStatus(expiry: Date | string | null | undefined): DocStatus {
  if (!expiry) return "missing";
  const expiryDate = typeof expiry === "string" ? new Date(expiry) : expiry;
  const now = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0)  return "expired";
  if (daysLeft < 30) return "expiring";
  return "valid";
}

export function getDaysUntilExpiry(expiry: Date | string | null | undefined): number | null {
  if (!expiry) return null;
  const expiryDate = typeof expiry === "string" ? new Date(expiry) : expiry;
  return Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type VehicleInput       = z.infer<typeof vehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
