"use server";

// =============================================================================
// SkyRideTour — Driver Server Actions
// =============================================================================

import { revalidatePath }  from "next/cache";
import { prisma }          from "@/lib/prisma";
import {
  driverSchema,
  updateDriverSchema,
  type DriverInput,
  type UpdateDriverInput,
} from "@/lib/validators/driver";
import type { ActionResult } from "@/types";
import type { Prisma }       from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

export interface DriverStats {
  totalTrips:        number;
  totalAllowances:   number;  // sum of driverExpense on all trips
  totalRevenue:      number;  // sum of tripAmount on assigned trips
}

export interface DriverListItem {
  id:            string;
  name:          string;
  phone:         string;
  licenseNumber: string;
  licenseExpiry: Date;
  salary:        number;
  joiningDate:   Date | null;
  status:        string;
  notes:         string | null;
  createdAt:     Date;
  updatedAt:     Date;
  _count:        { trips: number };
  totalAllowances: number;
}

export type DriverDetail = Prisma.DriverGetPayload<{
  include: {
    trips: {
      include: {
        vehicle:  { select: { name: true } };
      };
      orderBy: { date: "desc" };
    };
  };
}>;

export type DriverDetailWithStats = DriverDetail & { stats: DriverStats };

// =============================================================================
// QUERIES
// =============================================================================

export async function getDrivers(
  query = ""
): Promise<ActionResult<DriverListItem[]>> {
  try {
    const where: Prisma.DriverWhereInput = query
      ? {
          OR: [
            { name:          { contains: query, mode: "insensitive" } },
            { phone:         { contains: query, mode: "insensitive" } },
            { licenseNumber: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    const raw = await prisma.driver.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { trips: true } },
        trips:  { select: { driverExpense: true } },
      },
    });

    const drivers: DriverListItem[] = raw.map((d) => {
      const totalAllowances = d.trips.reduce(
        (s, t) => s + Number(t.driverExpense), 0
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { trips, ...rest } = d;
      return {
        ...rest,
        salary:          Number(rest.salary),
        totalAllowances,
      };
    });

    return { success: true, data: drivers };
  } catch (err) {
    console.error("[getDrivers]", err);
    return { success: false, error: "Failed to fetch drivers." };
  }
}

export async function getDriverById(
  id: string
): Promise<ActionResult<DriverDetailWithStats>> {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        trips: {
          include: {
            vehicle:  { select: { name: true } },
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!driver) return { success: false, error: "Driver not found." };

    const totalAllowances = driver.trips.reduce(
      (s, t) => s + Number(t.driverExpense), 0
    );
    const totalRevenue = driver.trips.reduce(
      (s, t) => s + Number(t.tripAmount), 0
    );

    const stats: DriverStats = {
      totalTrips:      driver.trips.length,
      totalAllowances,
      totalRevenue,
    };

    return { success: true, data: { ...driver, stats } };
  } catch (err) {
    console.error("[getDriverById]", err);
    return { success: false, error: "Failed to fetch driver." };
  }
}

// =============================================================================
// MUTATIONS
// =============================================================================

export async function createDriver(
  data: DriverInput
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const parsed = driverSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    // Duplicate license check
    const existing = await prisma.driver.findFirst({
      where: { licenseNumber: d.licenseNumber },
      select: { id: true, name: true },
    });
    if (existing) {
      return { success: false, error: `License ${d.licenseNumber} already registered to "${existing.name}".` };
    }

    const driver = await prisma.driver.create({
      data: {
        name:          d.name,
        phone:         d.phone,
        licenseNumber: d.licenseNumber,
        licenseExpiry: new Date(d.licenseExpiry),
        salary:        d.salary,
        joiningDate:   d.joiningDate ? new Date(d.joiningDate) : null,
        status:        d.status,
        notes:         d.notes || null,
      },
      select: { id: true, name: true },
    });

    revalidatePath("/drivers");
    return { success: true, data: driver };
  } catch (err) {
    console.error("[createDriver]", err);
    return { success: false, error: "Failed to create driver." };
  }
}

export async function updateDriver(
  id:   string,
  data: UpdateDriverInput
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const parsed = updateDriverSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    if (d.licenseNumber) {
      const conflict = await prisma.driver.findFirst({
        where: { licenseNumber: d.licenseNumber, NOT: { id } },
        select: { id: true, name: true },
      });
      if (conflict) {
        return { success: false, error: `License ${d.licenseNumber} is used by "${conflict.name}".` };
      }
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(d.name          !== undefined && { name: d.name }),
        ...(d.phone         !== undefined && { phone: d.phone }),
        ...(d.licenseNumber !== undefined && { licenseNumber: d.licenseNumber }),
        ...(d.licenseExpiry !== undefined && { licenseExpiry: new Date(d.licenseExpiry) }),
        ...(d.salary        !== undefined && { salary: d.salary }),
        ...(d.joiningDate   !== undefined && { joiningDate: d.joiningDate ? new Date(d.joiningDate) : null }),
        ...(d.status        !== undefined && { status: d.status }),
        ...(d.notes         !== undefined && { notes: d.notes || null }),
      },
      select: { id: true, name: true },
    });

    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    return { success: true, data: driver };
  } catch (err) {
    console.error("[updateDriver]", err);
    return { success: false, error: "Failed to update driver." };
  }
}

export async function deleteDriver(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const tripCount = await prisma.trip.count({ where: { driverId: id } });
    if (tripCount > 0) {
      return {
        success: false,
        error: `Cannot delete: driver has ${tripCount} trip record${tripCount > 1 ? "s" : ""}. Set status to Inactive instead.`,
      };
    }
    await prisma.driver.delete({ where: { id } });
    revalidatePath("/drivers");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("[deleteDriver]", err);
    return { success: false, error: "Failed to delete driver." };
  }
}

export async function updateDriverStatus(
  id:     string,
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE"
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const driver = await prisma.driver.update({
      where: { id },
      data:  { status },
      select: { id: true, status: true },
    });
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    return { success: true, data: { ...driver, status: driver.status.toString() } };
  } catch (err) {
    console.error("[updateDriverStatus]", err);
    return { success: false, error: "Failed to update status." };
  }
}
