"use server";

// =============================================================================
// SkyRideTour — Global Search Action (Step 18)
// Queries Trips (by trip #, customer name/phone, route), Vehicles, and Drivers.
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

export interface SearchResultItem {
  id:       string;
  title:    string;
  subtitle: string;
  type:     "trip" | "vehicle" | "driver";
  url:      string;
}

export async function globalSearch(
  query: string
): Promise<ActionResult<SearchResultItem[]>> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const q = query.trim();

    const [trips, vehicles, drivers] = await Promise.all([
      prisma.trip.findMany({
        where: {
          OR: [
            { tripNumber:     { contains: q, mode: "insensitive" } },
            { customerName:   { contains: q, mode: "insensitive" } },
            { customerPhone:  { contains: q, mode: "insensitive" } },
            { pickupLocation: { contains: q, mode: "insensitive" } },
            { dropLocation:   { contains: q, mode: "insensitive" } },
          ],
        },
        take: 8,
        select: { id: true, tripNumber: true, customerName: true, pickupLocation: true, dropLocation: true },
      }),

      prisma.vehicle.findMany({
        where: {
          OR: [
            { name:               { contains: q, mode: "insensitive" } },
            { registrationNumber: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: { id: true, name: true, registrationNumber: true },
      }),

      prisma.driver.findMany({
        where: {
          OR: [
            { name:          { contains: q, mode: "insensitive" } },
            { phone:         { contains: q, mode: "insensitive" } },
            { licenseNumber: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: { id: true, name: true, phone: true },
      }),
    ]);

    const results: SearchResultItem[] = [
      ...trips.map((t) => ({
        id:       t.id,
        title:    `${t.tripNumber} · ${t.customerName}`,
        subtitle: `Trip · ${t.pickupLocation} → ${t.dropLocation}`,
        type:     "trip" as const,
        url:      `/trips/${t.id}`,
      })),

      ...vehicles.map((v) => ({
        id:       v.id,
        title:    v.name,
        subtitle: `Vehicle · ${v.registrationNumber}`,
        type:     "vehicle" as const,
        url:      `/vehicles/${v.id}`,
      })),

      ...drivers.map((d) => ({
        id:       d.id,
        title:    d.name,
        subtitle: `Driver · +91 ${d.phone}`,
        type:     "driver" as const,
        url:      `/drivers/${d.id}`,
      })),
    ];

    return { success: true, data: results };
  } catch (err) {
    console.error("[globalSearch]", err);
    return { success: false, error: "Search failed." };
  }
}
