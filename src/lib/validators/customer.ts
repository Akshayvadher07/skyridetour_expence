// =============================================================================
// SkyRideTour — Customer Validation Schemas
// =============================================================================

import { z } from "zod";

// ─── Core Customer Schema ──────────────────────────────────────────────────────

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .trim(),

  /** Valid 10-digit Indian mobile: must start with 6, 7, 8, or 9 */
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),

  email: z
    .string()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(500, "Address must be under 500 characters")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .max(1000, "Notes must be under 1,000 characters")
    .optional()
    .or(z.literal("")),
});

/** Partial schema for updates — all fields optional */
export const updateCustomerSchema = customerSchema.partial();

/** Search / pagination query params */
export const customerQuerySchema = z.object({
  query: z.string().optional(),
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CustomerInput       = z.infer<typeof customerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQuery       = z.infer<typeof customerQuerySchema>;
