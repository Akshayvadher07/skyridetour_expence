// =============================================================================
// SkyRideTour — Expense (Overhead) Validation Schemas
// =============================================================================

import { z } from "zod";

export const OVERHEAD_CATEGORIES = [
  "MAINTENANCE", "REPAIR", "INSURANCE", "DRIVER_SALARY",
  "CLEANING", "SERVICE", "CNG", "PETROL", "DIESEL",
  "TOLL", "PARKING", "FOOD", "ACCOMMODATION", "OTHER",
] as const;

export const OVERHEAD_CATEGORY_LABELS: Record<typeof OVERHEAD_CATEGORIES[number], string> = {
  MAINTENANCE:   "Maintenance",
  REPAIR:        "Repair",
  INSURANCE:     "Insurance",
  DRIVER_SALARY: "Driver Salary",
  CLEANING:      "Cleaning",
  SERVICE:       "Service",
  CNG:           "CNG",
  PETROL:        "Petrol",
  DIESEL:        "Diesel",
  TOLL:          "Toll",
  PARKING:       "Parking",
  FOOD:          "Food",
  ACCOMMODATION: "Accommodation",
  OTHER:         "Other",
};

export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),

  category: z.enum(OVERHEAD_CATEGORIES),

  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(9_99_999, "Amount seems too high"),

  description: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),

  vehicleId: z
    .string()
    .optional()
    .or(z.literal("")),

  tripId: z
    .string()
    .optional()
    .or(z.literal("")),
});

export const updateExpenseSchema = expenseSchema.partial();

export type ExpenseInput       = z.infer<typeof expenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
