"use server";

// =============================================================================
// SkyRideTour — Trip Server Actions
// Inline Customer Details
// =============================================================================

import { revalidatePath }       from "next/cache";
import { prisma }               from "@/lib/prisma";
import { tripSchema, updateTripSchema, type TripInput, type UpdateTripInput } from "@/lib/validators/trip";
import { computeTripFinancials }  from "@/lib/calculations/financials";
import { incrementTollPassUsage } from "@/server/actions/toll-pass";
import type { ActionResult }      from "@/types";
import type { Prisma }            from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

export type TripListItem = Prisma.TripGetPayload<{
  select: {
    id: true; tripNumber: true; date: true;
    customerName: true; customerPhone: true; customerEmail: true; customerAddress: true;
    pickupLocation: true; dropLocation: true;
    tripType: true; tripAmount: true;
    totalExpense: true; netProfit: true; profitMargin: true;
    paymentStatus: true; paymentMethod: true;
    vehicle: { select: { name: true } };
    driver:  { select: { name: true } };
  };
}>;

export type TripDetail = Prisma.TripGetPayload<{
  include: {
    vehicle:  { select: { name: true; registrationNumber: true } };
    driver:   { select: { name: true; phone: true } };
    payments: { orderBy: { paymentDate: "desc" } };
    expenses: true;
    invoices: { select: { id: true; invoiceNumber: true; createdAt: true } };
  };
}>;

// =============================================================================
// TRIP NUMBER GENERATOR
// =============================================================================

async function generateTripNumber(): Promise<string> {
  const year   = new Date().getFullYear();
  const prefix = `SRT-${year}-`;

  const last = await prisma.trip.findFirst({
    where:   { tripNumber: { startsWith: prefix } },
    orderBy: { tripNumber: "desc" },
    select:  { tripNumber: true },
  });

  const seq = last
    ? parseInt(last.tripNumber.replace(prefix, ""), 10) + 1
    : 1;

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// =============================================================================
// QUERIES
// =============================================================================

export async function getTrips(opts?: {
  query?:         string;
  vehicleId?:     string;
  driverId?:      string;
  paymentStatus?: string;
  tripType?:      string;
  dateFrom?:      string;
  dateTo?:        string;
  page?:          number;
  limit?:         number;
}): Promise<ActionResult<{ trips: TripListItem[]; total: number }>> {
  try {
    const {
      query, vehicleId, driverId,
      paymentStatus, tripType, dateFrom, dateTo,
      page = 1, limit = 50,
    } = opts ?? {};

    const where: Prisma.TripWhereInput = {
      ...(vehicleId     && { vehicleId }),
      ...(driverId      && { driverId }),
      ...(paymentStatus && { paymentStatus: paymentStatus as Prisma.EnumPaymentStatusFilter }),
      ...(tripType      && { tripType:      tripType as Prisma.EnumTripTypeFilter }),
      ...(dateFrom && dateTo && { date: { gte: new Date(dateFrom), lte: new Date(dateTo) } }),
      ...(dateFrom && !dateTo && { date: { gte: new Date(dateFrom) } }),
      ...(!dateFrom && dateTo && { date: { lte: new Date(dateTo) } }),
      ...(query && {
        OR: [
          { tripNumber:     { contains: query, mode: "insensitive" } },
          { customerName:   { contains: query, mode: "insensitive" } },
          { customerPhone:  { contains: query, mode: "insensitive" } },
          { pickupLocation: { contains: query, mode: "insensitive" } },
          { dropLocation:   { contains: query, mode: "insensitive" } },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
        select: {
          id: true, tripNumber: true, date: true,
          customerName: true, customerPhone: true, customerEmail: true, customerAddress: true,
          pickupLocation: true, dropLocation: true,
          tripType: true, tripAmount: true,
          totalExpense: true, netProfit: true, profitMargin: true,
          paymentStatus: true, paymentMethod: true,
          vehicle: { select: { name: true } },
          driver:  { select: { name: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    return { success: true, data: { trips, total } };
  } catch {
    console.warn("[getTrips] Database server offline.");
    return { success: false, error: "Database server offline." };
  }
}

export async function getTripById(
  id: string
): Promise<ActionResult<TripDetail>> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle:  { select: { name: true, registrationNumber: true } },
        driver:   { select: { name: true, phone: true } },
        payments: { orderBy: { paymentDate: "desc" } },
        expenses: true,
        invoices: { select: { id: true, invoiceNumber: true, createdAt: true } },
      },
    });
    if (!trip) return { success: false, error: "Trip not found." };
    return { success: true, data: trip };
  } catch {
    console.warn("[getTripById] Database server offline.");
    return { success: false, error: "Database server offline." };
  }
}

// =============================================================================
// MUTATIONS
// =============================================================================

export async function createTrip(
  data: TripInput
): Promise<ActionResult<{ id: string; tripNumber: string }>> {
  try {
    const parsed = tripSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    const financials = computeTripFinancials({
      tripAmount:    d.tripAmount,
      cng:           d.cngExpense,
      petrol:        d.petrolExpense,
      diesel:        d.dieselExpense,
      tollType:      d.tollType,
      tollExpense:   d.tollExpense,
      parking:       d.parkingExpense,
      driverExpense: d.driverExpense,
      food:          d.foodExpense,
      accommodation: d.accommodationExpense,
      otherExpense:  d.otherExpense,
    });

    const totalKm =
      d.startKm !== undefined && d.endKm !== undefined
        ? d.endKm - d.startKm
        : undefined;

    const tripNumber = await generateTripNumber();

    const trip = await prisma.trip.create({
      data: {
        tripNumber,
        date:            new Date(d.date),
        customerName:    d.customerName,
        customerPhone:   d.customerPhone,
        customerEmail:   d.customerEmail   || null,
        customerAddress: d.customerAddress || null,
        vehicleId:       d.vehicleId  || null,
        driverId:        d.driverId   || null,
        pickupLocation:  d.pickupLocation,
        dropLocation:    d.dropLocation,
        tripType:        d.tripType,
        startDate:       d.startDate ? new Date(d.startDate) : null,
        endDate:         d.endDate   ? new Date(d.endDate)   : null,
        startKm:         d.startKm   ?? null,
        endKm:           d.endKm     ?? null,
        totalKm:         totalKm     ?? null,
        tripAmount:      d.tripAmount,
        paymentStatus:   d.paymentStatus,
        paymentMethod:   d.paymentMethod,
        cngExpense:           d.cngExpense,
        petrolExpense:        d.petrolExpense,
        dieselExpense:        d.dieselExpense,
        tollType:             d.tollType,
        tollExpense:          financials.totalExpense > 0 ? (
                                d.tollType === "ANNUAL_PASS" || d.tollType === "FREE" ? 0 : d.tollExpense
                              ) : 0,
        parkingExpense:       d.parkingExpense,
        driverExpense:        d.driverExpense,
        foodExpense:          d.foodExpense,
        accommodationExpense: d.accommodationExpense,
        otherExpense:         d.otherExpense,
        otherExpenseNotes:    d.otherExpenseNotes || null,
        totalExpense:         financials.totalExpense,
        netProfit:            financials.netProfit,
        profitMargin:         financials.profitMargin,
        notes:                d.notes || null,
      },
      select: { id: true, tripNumber: true },
    });

    if (d.tollType === "ANNUAL_PASS" && d.vehicleId) {
      await incrementTollPassUsage(d.vehicleId);
    }

    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true, data: trip };
  } catch {
    console.warn("[createTrip] Database server offline.");
    return { success: false, error: "Failed to create trip." };
  }
}

export async function updateTrip(
  id:   string,
  data: UpdateTripInput
): Promise<ActionResult<{ id: string; tripNumber: string }>> {
  try {
    const parsed = updateTripSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    const existing = await prisma.trip.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Trip not found." };

    const merged = {
      tripAmount:          d.tripAmount          ?? Number(existing.tripAmount),
      cng:                 d.cngExpense          ?? Number(existing.cngExpense),
      petrol:              d.petrolExpense        ?? Number(existing.petrolExpense),
      diesel:              d.dieselExpense        ?? Number(existing.dieselExpense),
      tollType:            d.tollType            ?? existing.tollType,
      tollExpense:         d.tollExpense          ?? Number(existing.tollExpense),
      parking:             d.parkingExpense       ?? Number(existing.parkingExpense),
      driverExpense:       d.driverExpense        ?? Number(existing.driverExpense),
      food:                d.foodExpense          ?? Number(existing.foodExpense),
      accommodation:       d.accommodationExpense ?? Number(existing.accommodationExpense),
      otherExpense:        d.otherExpense         ?? Number(existing.otherExpense),
    };

    const financials = computeTripFinancials(merged);

    const totalKm =
      d.startKm !== undefined && d.endKm !== undefined
        ? d.endKm - d.startKm
        : undefined;

    const trip = await prisma.trip.update({
      where: { id },
      data: {
        ...(d.date            !== undefined && { date:            new Date(d.date) }),
        ...(d.customerName    !== undefined && { customerName:    d.customerName }),
        ...(d.customerPhone   !== undefined && { customerPhone:   d.customerPhone }),
        ...(d.customerEmail   !== undefined && { customerEmail:   d.customerEmail   || null }),
        ...(d.customerAddress !== undefined && { customerAddress: d.customerAddress || null }),
        ...(d.vehicleId       !== undefined && { vehicleId:       d.vehicleId  || null }),
        ...(d.driverId        !== undefined && { driverId:        d.driverId   || null }),
        ...(d.pickupLocation  !== undefined && { pickupLocation:  d.pickupLocation }),
        ...(d.dropLocation    !== undefined && { dropLocation:    d.dropLocation }),
        ...(d.tripType        !== undefined && { tripType:        d.tripType }),
        ...(d.startDate       !== undefined && { startDate:       d.startDate ? new Date(d.startDate) : null }),
        ...(d.endDate         !== undefined && { endDate:         d.endDate   ? new Date(d.endDate)   : null }),
        ...(d.startKm         !== undefined && { startKm:         d.startKm }),
        ...(d.endKm           !== undefined && { endKm:           d.endKm }),
        ...(totalKm           !== undefined && { totalKm }),
        ...(d.tripAmount      !== undefined && { tripAmount:      d.tripAmount }),
        ...(d.paymentStatus   !== undefined && { paymentStatus:   d.paymentStatus }),
        ...(d.paymentMethod   !== undefined && { paymentMethod:   d.paymentMethod }),
        ...(d.cngExpense      !== undefined && { cngExpense:      d.cngExpense }),
        ...(d.petrolExpense   !== undefined && { petrolExpense:   d.petrolExpense }),
        ...(d.dieselExpense   !== undefined && { dieselExpense:   d.dieselExpense }),
        ...(d.tollType        !== undefined && { tollType:        d.tollType }),
        ...(d.tollExpense     !== undefined && {
          tollExpense: (d.tollType === "ANNUAL_PASS" || d.tollType === "FREE") ? 0 : d.tollExpense,
        }),
        ...(d.parkingExpense       !== undefined && { parkingExpense:       d.parkingExpense }),
        ...(d.driverExpense        !== undefined && { driverExpense:        d.driverExpense }),
        ...(d.foodExpense          !== undefined && { foodExpense:          d.foodExpense }),
        ...(d.accommodationExpense !== undefined && { accommodationExpense: d.accommodationExpense }),
        ...(d.otherExpense         !== undefined && { otherExpense:         d.otherExpense }),
        ...(d.otherExpenseNotes    !== undefined && { otherExpenseNotes:    d.otherExpenseNotes || null }),
        ...(d.notes                !== undefined && { notes:                d.notes || null }),
        totalExpense: financials.totalExpense,
        netProfit:    financials.netProfit,
        profitMargin: financials.profitMargin,
      },
      select: { id: true, tripNumber: true },
    });

    revalidatePath("/trips");
    revalidatePath(`/trips/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: trip };
  } catch {
    console.warn("[updateTrip] Database server offline.");
    return { success: false, error: "Failed to update trip." };
  }
}

export async function deleteTrip(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    await prisma.trip.delete({ where: { id } });
    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true, data: { id } };
  } catch {
    console.warn("[deleteTrip] Database server offline.");
    return { success: false, error: "Failed to delete trip." };
  }
}
