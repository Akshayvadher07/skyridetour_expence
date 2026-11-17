// =============================================================================
// SkyRideTour — Toll Pass Validation Schemas
// =============================================================================

import { z } from "zod";

export const tollPassSchema = z.object({
  passName: z
    .string()
    .min(2, "Pass name must be at least 2 characters")
    .max(100)
    .trim(),

  vehicleId: z
    .string()
    .min(1, "Please select a vehicle"),

  passCost: z.coerce
    .number()
    .min(0, "Cost cannot be negative")
    .default(0),

  tollsIncluded: z.coerce
    .number()
    .int()
    .min(0, "Cannot be negative")
    .default(0),

  startDate: z
    .string()
    .min(1, "Start date is required"),

  expiryDate: z
    .string()
    .min(1, "Expiry date is required"),

  isActive: z.boolean().default(true),

  notes: z.string().max(500).optional().or(z.literal("")),
});

export const updateTollPassSchema = tollPassSchema.partial();

// ─── Pass Status ──────────────────────────────────────────────────────────────

export type PassStatus = "active" | "expiring" | "expired" | "exhausted";

export function getPassStatus(
  expiryDate: Date | string,
  tollsIncluded: number,
  tollsUsed: number,
  isActive: boolean
): PassStatus {
  if (!isActive) return "expired";
  if (tollsIncluded > 0 && tollsUsed >= tollsIncluded) return "exhausted";
  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const days   = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0)  return "expired";
  if (days < 30) return "expiring";
  return "active";
}

export function getDaysUntilPassExpiry(expiry: Date | string): number {
  const d = typeof expiry === "string" ? new Date(expiry) : expiry;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TollPassInput       = z.infer<typeof tollPassSchema>;
export type UpdateTollPassInput = z.infer<typeof updateTollPassSchema>;
