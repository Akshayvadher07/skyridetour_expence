"use server";

// =============================================================================
// SkyRideTour — Vehicle Server Actions
// =============================================================================

import { revalidatePath }   from "next/cache";
import { prisma }           from "@/lib/prisma";
import {
  vehicleSchema,
  updateVehicleSchema,
  type VehicleInput,
  type UpdateVehicleInput,
} from "@/lib/validators/vehicle";
import type { ActionResult } from "@/types";
import type { Prisma }       from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

export interface VehicleStats {
  totalRevenue:   number;  // sum of tripAmount across all trips
  totalExpenses:  number;  // sum of standalone vehicle Expenses (MAINTENANCE, REPAIR, etc.)
  tripExpenses:   number;  // sum of totalExpense on Trips (fuel + toll + parking etc.)
  netYield:       number;  // totalRevenue - totalExpenses - tripExpenses
  totalTrips:     number;
  activeTollPasses: number;
}

export interface VehicleListItem {
  id:                 string;
  name:               string;
  registrationNumber: string;
  model:              string | null;
  vehicleType:        string;
  fuelType:           string;
  seatingCapacity:    number;
  year:               number | null;
  color:              string | null;
  insuranceExpiry:    Date | null;
  pucExpiry:          Date | null;
  isActive:           boolean;
  notes:              string | null;
  createdAt:          Date;
  updatedAt:          Date;
  _count:             { trips: number; tollPasses: number };
  totalRevenue:       number;
}

export type VehicleDetail = Prisma.VehicleGetPayload<{
  include: {
    trips: {
      include: {
        driver:   { select: { name: true } };
      };
      orderBy: { date: "desc" };
    };
    expenses: {
      orderBy: { date: "desc" };
    };
    tollPasses: {
      orderBy: { startDate: "desc" };
    };
  };
}>;

export type VehicleDetailWithStats = VehicleDetail & { stats: VehicleStats };

// =============================================================================
// HELPERS
// =============================================================================

function toDateOrNull(value?: string | null): Date | null {
  if (!value || value === "") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// =============================================================================
// QUERIES
// =============================================================================

export async function getVehicles(
  query  = "",
  onlyActive = false
): Promise<ActionResult<VehicleListItem[]>> {
  try {
    const searchTerm = query.trim();
    const where: Prisma.VehicleWhereInput = {
      ...(onlyActive && { isActive: true }),
      ...(searchTerm && {
        OR: [
          { name:               { contains: searchTerm, mode: "insensitive" } },
          { registrationNumber: { contains: searchTerm, mode: "insensitive" } },
          { model:              { contains: searchTerm, mode: "insensitive" } },
        ],
      }),
    };

    const raw = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { trips: true, tollPasses: true } },
        trips:  { select: { tripAmount: true } },
      },
    });

    const vehicles: VehicleListItem[] = raw.map((v) => {
      const totalRevenue = v.trips.reduce((s, t) => s + Number(t.tripAmount), 0);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { trips, ...rest } = v;
      return { ...rest, totalRevenue };
    });

    return { success: true, data: vehicles };
  } catch (err) {
    console.error("[getVehicles]", err);
    return { success: false, error: "Failed to fetch vehicles." };
  }
}

export async function getVehicleById(
  id: string
): Promise<ActionResult<VehicleDetailWithStats>> {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          include: {
            driver:   { select: { name: true } },
          },
          orderBy: { date: "desc" },
        },
        expenses:   { orderBy: { date: "desc" } },
        tollPasses: { orderBy: { startDate: "desc" } },
      },
    });

    if (!vehicle) return { success: false, error: "Vehicle not found." };

    // ── Compute stats ─────────────────────────────────────────────────────────
    const totalRevenue = vehicle.trips.reduce(
      (s, t) => s + Number(t.tripAmount), 0
    );
    const tripExpenses = vehicle.trips.reduce(
      (s, t) => s + Number(t.totalExpense), 0
    );
    const totalExpenses = vehicle.expenses.reduce(
      (s, e) => s + Number(e.amount), 0
    );
    const netYield    = totalRevenue - tripExpenses - totalExpenses;
    const now         = new Date();
    const activeTollPasses = vehicle.tollPasses.filter(
      (p) => p.expiryDate > now
    ).length;

    const stats: VehicleStats = {
      totalRevenue, totalExpenses, tripExpenses,
      netYield, totalTrips: vehicle.trips.length, activeTollPasses,
    };

    return { success: true, data: { ...vehicle, stats } };
  } catch (err) {
    console.error("[getVehicleById]", err);
    return { success: false, error: "Failed to fetch vehicle." };
  }
}

// =============================================================================
// MUTATIONS
// =============================================================================

export async function createVehicle(
  data: VehicleInput
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const parsed = vehicleSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return { success: false, error: msg };
    }

    const d = parsed.data;

    // Duplicate reg check
    const existing = await prisma.vehicle.findFirst({
      where: { registrationNumber: d.registrationNumber },
      select: { id: true, name: true },
    });
    if (existing) {
      return {
        success: false,
        error: `Registration ${d.registrationNumber} is already registered to "${existing.name}".`,
      };
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        name:               d.name,
        registrationNumber: d.registrationNumber,
        model:              d.model              || null,
        vehicleType:        d.vehicleType,
        fuelType:           d.fuelType,
        seatingCapacity:    d.seatingCapacity    ?? 4,
        year:               d.year               ?? null,
        color:              d.color              || null,
        insuranceExpiry:    toDateOrNull(d.insuranceExpiry),
        pucExpiry:          toDateOrNull(d.pucExpiry),
        isActive:           d.isActive           ?? true,
        notes:              d.notes              || null,
      },
      select: { id: true, name: true },
    });

    revalidatePath("/vehicles");
    return { success: true, data: vehicle };
  } catch (err) {
    console.error("[createVehicle]", err);
    return { success: false, error: "Failed to create vehicle." };
  }
}

export async function updateVehicle(
  id:   string,
  data: UpdateVehicleInput
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const parsed = updateVehicleSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return { success: false, error: msg };
    }

    const d = parsed.data;

    if (d.registrationNumber) {
      const conflict = await prisma.vehicle.findFirst({
        where: { registrationNumber: d.registrationNumber, NOT: { id } },
        select: { id: true, name: true },
      });
      if (conflict) {
        return {
          success: false,
          error: `Registration ${d.registrationNumber} is already used by "${conflict.name}".`,
        };
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(d.name               !== undefined && { name:               d.name }),
        ...(d.registrationNumber !== undefined && { registrationNumber: d.registrationNumber }),
        ...(d.model              !== undefined && { model:              d.model    || null }),
        ...(d.vehicleType        !== undefined && { vehicleType:        d.vehicleType }),
        ...(d.fuelType           !== undefined && { fuelType:           d.fuelType }),
        ...(d.seatingCapacity    !== undefined && { seatingCapacity:    d.seatingCapacity }),
        ...(d.year               !== undefined && { year:               d.year     ?? null }),
        ...(d.color              !== undefined && { color:              d.color    || null }),
        ...(d.insuranceExpiry    !== undefined && { insuranceExpiry:    toDateOrNull(d.insuranceExpiry) }),
        ...(d.pucExpiry          !== undefined && { pucExpiry:          toDateOrNull(d.pucExpiry) }),
        ...(d.isActive           !== undefined && { isActive:           d.isActive }),
        ...(d.notes              !== undefined && { notes:              d.notes    || null }),
      },
      select: { id: true, name: true },
    });

    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    return { success: true, data: vehicle };
  } catch (err) {
    console.error("[updateVehicle]", err);
    return { success: false, error: "Failed to update vehicle." };
  }
}

export async function deleteVehicle(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const tripCount = await prisma.trip.count({ where: { vehicleId: id } });
    if (tripCount > 0) {
      return {
        success: false,
        error: `Cannot delete: this vehicle has ${tripCount} trip record${tripCount > 1 ? "s" : ""}. Deactivate it instead.`,
      };
    }

    await prisma.vehicle.delete({ where: { id } });
    revalidatePath("/vehicles");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("[deleteVehicle]", err);
    return { success: false, error: "Failed to delete vehicle." };
  }
}

export async function toggleVehicleStatus(
  id:       string,
  isActive: boolean
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data:  { isActive },
      select: { id: true, isActive: true },
    });
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    return { success: true, data: vehicle };
  } catch (err) {
    console.error("[toggleVehicleStatus]", err);
    return { success: false, error: "Failed to update vehicle status." };
  }
}
