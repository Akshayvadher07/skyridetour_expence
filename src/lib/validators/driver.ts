// =============================================================================
// SkyRideTour — Driver Validation Schemas
// =============================================================================

import { z } from "zod";

// ─── Status enum (mirrors Prisma DriverStatus) ────────────────────────────────

export const DRIVER_STATUSES = ["ACTIVE", "INACTIVE", "ON_LEAVE"] as const;

export const DRIVER_STATUS_LABELS: Record<typeof DRIVER_STATUSES[number], string> = {
  ACTIVE:   "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
};

// ─── Core Schema ──────────────────────────────────────────────────────────────

export const driverSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .trim(),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),

  licenseNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(5, "License number is too short")
    .max(20, "License number is too long"),

  /** ISO date string YYYY-MM-DD */
  licenseExpiry: z
    .string()
    .min(1, "License expiry date is required"),

  /** Monthly salary in ₹ — converted from form string to number */
  salary: z.coerce
    .number()
    .min(0, "Salary cannot be negative")
    .max(9_99_999, "Salary seems too high — check value")
    .default(0),

  joiningDate: z
    .string()
    .optional()
    .or(z.literal("")),

  status: z.enum(DRIVER_STATUSES).default("ACTIVE"),

  notes: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("")),
});

export const updateDriverSchema = driverSchema.partial();

// ─── License Expiry Status ────────────────────────────────────────────────────

export type LicenseStatus = "valid" | "expiring" | "expired";

export function getLicenseStatus(expiry: Date | string | null | undefined): LicenseStatus {
  if (!expiry) return "expired";
  const d = typeof expiry === "string" ? new Date(expiry) : expiry;
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0)  return "expired";
  if (days < 30) return "expiring";
  return "valid";
}

export function getDaysUntilLicenseExpiry(expiry: Date | string | null | undefined): number | null {
  if (!expiry) return null;
  const d = typeof expiry === "string" ? new Date(expiry) : expiry;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type DriverInput       = z.infer<typeof driverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
