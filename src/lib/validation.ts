import { z } from "zod";

export const warehouseSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  address: z.string().min(5, "Full address specification required"),
  totalCapacity: z.coerce.number().positive("Total capacity must be a positive metric tonnage"),
  availableCapacity: z.coerce.number().nonnegative("Available capacity must be at least 0"),
}).refine((data) => data.availableCapacity <= data.totalCapacity, {
  message: "Available space cannot exceed total capacity.",
  path: ["availableCapacity"],
});

export const bookingSchema = z.object({
  warehouseId: z.string().cuid(),
  volume: z.coerce.number().positive("Operational volume must be greater than zero"),
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.endDate > data.startDate, {
  message: "Operational window error: End date must follow start date",
  path: ["endDate"],
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;

export const signupSchema = z.object({
  email: z.string().email("Invalid email identity"),
  password: z.string().min(6, "Credentials must meet 6-char security minimum"),
  name: z.string().min(2, "Full name is required"),
  role: z.enum(["OWNER", "CLIENT"]),
  phone: z.string().min(10, "Valid phone number required"),
  location: z.string().optional(),
  companyName: z.string().optional(),
  warehouseCount: z.coerce.number().optional(),
  city: z.string().optional(),
  businessType: z.string().optional(),
  gstNumber: z.string().optional(),
  requirements: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
