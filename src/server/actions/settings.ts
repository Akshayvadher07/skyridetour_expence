"use server";

// =============================================================================
// SkyRideTour — System Settings & Business Profile Actions (Step 20)
// Singleton Setting table.
// =============================================================================

import { revalidatePath } from "next/cache";
import { prisma }         from "@/lib/prisma";
import { z }              from "zod";
import bcrypt             from "bcryptjs";
import type { ActionResult } from "@/types";

export interface BusinessSettings {
  companyName:   string;
  phone:         string;
  email:         string;
  address:       string;
  gstNumber:     string;
  invoicePrefix: string;
  currencySymbol: string;
}

const settingsSchema = z.object({
  companyName:    z.string().min(2).max(100),
  phone:          z.string().min(10).max(15),
  email:          z.string().email(),
  address:        z.string().min(5).max(300),
  gstNumber:      z.string().optional().or(z.literal("")),
  invoicePrefix:  z.string().min(2).max(10),
  currencySymbol: z.string().min(1).max(10),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function getSettings(): Promise<ActionResult<BusinessSettings>> {
  try {
    const setting = await prisma.setting.findFirst();

    if (!setting) {
      const created = await prisma.setting.create({
        data: {
          companyName:    "SkyRideTour",
          phone:          "+91 98765 43210",
          email:          "info@skyridetour.com",
          address:        "Somnath, Gujarat, India",
          gstNumber:      "24AAAAA0000A1Z5",
          invoicePrefix:  "SRT-2026-",
          currencySymbol: "₹",
        },
      });
      return {
        success: true,
        data: {
          companyName:    created.companyName,
          phone:          created.phone          ?? "",
          email:          created.email          ?? "",
          address:        created.address        ?? "",
          gstNumber:      created.gstNumber      ?? "",
          invoicePrefix:  created.invoicePrefix,
          currencySymbol: created.currencySymbol,
        },
      };
    }

    return {
      success: true,
      data: {
        companyName:    setting.companyName,
        phone:          setting.phone          ?? "",
        email:          setting.email          ?? "",
        address:        setting.address        ?? "",
        gstNumber:      setting.gstNumber      ?? "",
        invoicePrefix:  setting.invoicePrefix,
        currencySymbol: setting.currencySymbol,
      },
    };
  } catch (err) {
    console.error("[getSettings]", err);
    return { success: false, error: "Failed to fetch settings." };
  }
}

export async function updateSettings(
  data: SettingsInput
): Promise<ActionResult<BusinessSettings>> {
  try {
    const parsed = settingsSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    const existing = await prisma.setting.findFirst();

    if (existing) {
      await prisma.setting.update({
        where: { id: existing.id },
        data: {
          companyName:    d.companyName,
          phone:          d.phone,
          email:          d.email,
          address:        d.address,
          gstNumber:      d.gstNumber      || null,
          invoicePrefix:  d.invoicePrefix,
          currencySymbol: d.currencySymbol,
        },
      });
    } else {
      await prisma.setting.create({
        data: {
          companyName:    d.companyName,
          phone:          d.phone,
          email:          d.email,
          address:        d.address,
          gstNumber:      d.gstNumber      || null,
          invoicePrefix:  d.invoicePrefix,
          currencySymbol: d.currencySymbol,
        },
      });
    }

    revalidatePath("/settings");
    return { success: true, data: d as BusinessSettings };
  } catch (err) {
    console.error("[updateSettings]", err);
    return { success: false, error: "Failed to update settings." };
  }
}

export async function changePassword(
  userId:          string,
  currentPassword: string,
  newPassword:     string
): Promise<ActionResult<void>> {
  try {
    if (newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      return { success: false, error: "User not found." };
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return { success: false, error: "Current password is incorrect." };
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data:  { passwordHash: hashed },
    });

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[changePassword]", err);
    return { success: false, error: "Failed to change password." };
  }
}
