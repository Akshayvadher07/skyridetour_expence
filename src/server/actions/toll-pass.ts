"use server";

import { revalidatePath }  from "next/cache";
import { prisma }          from "@/lib/prisma";
import {
  tollPassSchema,
  updateTollPassSchema,
  type TollPassInput,
  type UpdateTollPassInput,
} from "@/lib/validators/toll-pass";
import type { ActionResult } from "@/types";
import type { Prisma }       from "@prisma/client";

export type TollPassWithVehicle = Prisma.TollPassGetPayload<{
  include: { vehicle: { select: { name: true; registrationNumber: true } } };
}>;

export async function getTollPasses(
  vehicleId?: string
): Promise<ActionResult<TollPassWithVehicle[]>> {
  try {
    const where: Prisma.TollPassWhereInput = vehicleId ? { vehicleId } : {};
    const passes = await prisma.tollPass.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: { vehicle: { select: { name: true, registrationNumber: true } } },
    });
    return { success: true, data: passes };
  } catch (err) {
    console.error("[getTollPasses]", err);
    return { success: false, error: "Failed to fetch toll passes." };
  }
}

export async function getTollPassById(
  id: string
): Promise<ActionResult<TollPassWithVehicle>> {
  try {
    const pass = await prisma.tollPass.findUnique({
      where: { id },
      include: { vehicle: { select: { name: true, registrationNumber: true } } },
    });
    if (!pass) return { success: false, error: "Toll pass not found." };
    return { success: true, data: pass };
  } catch (err) {
    console.error("[getTollPassById]", err);
    return { success: false, error: "Failed to fetch toll pass." };
  }
}

export async function createTollPass(
  data: TollPassInput
): Promise<ActionResult<{ id: string; passName: string }>> {
  try {
    const parsed = tollPassSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    const pass = await prisma.tollPass.create({
      data: {
        passName:      d.passName,
        vehicleId:     d.vehicleId,
        passCost:      d.passCost,
        tollsIncluded: d.tollsIncluded,
        startDate:     new Date(d.startDate),
        expiryDate:    new Date(d.expiryDate),
        isActive:      d.isActive ?? true,
        notes:         d.notes || null,
      },
      select: { id: true, passName: true },
    });

    revalidatePath("/toll-passes");
    return { success: true, data: pass };
  } catch (err) {
    console.error("[createTollPass]", err);
    return { success: false, error: "Failed to create toll pass." };
  }
}

export async function updateTollPass(
  id:   string,
  data: UpdateTollPassInput
): Promise<ActionResult<{ id: string; passName: string }>> {
  try {
    const parsed = updateTollPassSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    const pass = await prisma.tollPass.update({
      where: { id },
      data: {
        ...(d.passName      !== undefined && { passName:      d.passName }),
        ...(d.vehicleId     !== undefined && { vehicleId:     d.vehicleId }),
        ...(d.passCost      !== undefined && { passCost:      d.passCost }),
        ...(d.tollsIncluded !== undefined && { tollsIncluded: d.tollsIncluded }),
        ...(d.startDate     !== undefined && { startDate:     new Date(d.startDate) }),
        ...(d.expiryDate    !== undefined && { expiryDate:    new Date(d.expiryDate) }),
        ...(d.isActive      !== undefined && { isActive:      d.isActive }),
        ...(d.notes         !== undefined && { notes:         d.notes || null }),
      },
      select: { id: true, passName: true },
    });

    revalidatePath("/toll-passes");
    return { success: true, data: pass };
  } catch (err) {
    console.error("[updateTollPass]", err);
    return { success: false, error: "Failed to update toll pass." };
  }
}

export async function deleteTollPass(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await prisma.tollPass.delete({ where: { id } });
    revalidatePath("/toll-passes");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("[deleteTollPass]", err);
    return { success: false, error: "Failed to delete toll pass." };
  }
}

/** Called by Trip creation when TollType = ANNUAL_PASS — increments usage counter */
export async function incrementTollPassUsage(
  vehicleId: string
): Promise<void> {
  try {
    const activePasses = await prisma.tollPass.findMany({
      where: {
        vehicleId,
        isActive:   true,
        expiryDate: { gte: new Date() },
      },
      orderBy: { expiryDate: "asc" },
      take: 1,
    });

    if (activePasses.length === 0) return;

    await prisma.tollPass.update({
      where: { id: activePasses[0].id },
      data:  { tollsUsed: { increment: 1 } },
    });
  } catch (err) {
    console.error("[incrementTollPassUsage]", err);
  }
}
