import { z } from "zod";

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(254).toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(24, "Enter a valid phone number")
    .regex(/^\+?[0-9\s().-]+$/, "Enter a valid phone number"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number")
    .refine((password) => new TextEncoder().encode(password).length <= 72, "Password is too long"),
  confirmPassword: z.string(),
}).refine((input) => input.password === input.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegistrationInput = z.infer<typeof registrationSchema>;