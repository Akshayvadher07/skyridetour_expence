"use server";

// =============================================================================
// SkyRideTour — Expiry & Payment Alert Server Action (Step 19)
// Scans for pending payments, expiring vehicle docs, driver licenses, and toll passes.
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

export interface AlertItem {
  id:       string;
  title:    string;
  subtitle: string;
  type:     "payment" | "insurance" | "puc" | "license" | "tollPass";
  url:      string;
  days:     number | null;
}

export interface SystemAlerts {
  count: number;
  items: AlertItem[];
}

export async function getSystemAlerts(): Promise<ActionResult<SystemAlerts>> {
  try {
    const now       = new Date();
    const alertDate = new Date();
    alertDate.setDate(now.getDate() + 30);

    const [
      pendingTrips,
      insuranceVehicles,
      pucVehicles,
      licenseDrivers,
      tollPasses,
    ] = await Promise.all([
      // Pending / Partial payments
      prisma.trip.findMany({
        where:   { paymentStatus: { in: ["PENDING", "PARTIAL"] } },
        take:    5,
        orderBy: { date: "desc" },
        select:  { id: true, tripNumber: true, tripAmount: true, customerName: true },
      }),

      // Insurance expiring within 30 days or already expired
      prisma.vehicle.findMany({
        where:   { insuranceExpiry: { lte: alertDate }, isActive: true },
        take:    5,
        select:  { id: true, name: true, registrationNumber: true, insuranceExpiry: true },
      }),

      // PUC expiring within 30 days or already expired
      prisma.vehicle.findMany({
        where:   { pucExpiry: { lte: alertDate }, isActive: true },
        take:    5,
        select:  { id: true, name: true, registrationNumber: true, pucExpiry: true },
      }),

      // License expiring within 30 days or already expired
      prisma.driver.findMany({
        where:   { licenseExpiry: { lte: alertDate }, status: "ACTIVE" },
        take:    5,
        select:  { id: true, name: true, licenseExpiry: true },
      }),

      // Toll pass expiring within 30 days
      prisma.tollPass.findMany({
        where:   { expiryDate: { lte: alertDate }, isActive: true },
        take:    5,
        select:  { id: true, passName: true, expiryDate: true, vehicle: { select: { name: true } } },
      }),
    ]);

    const items: AlertItem[] = [];

    for (const t of pendingTrips) {
      items.push({
        id:       `payment-${t.id}`,
        title:    `Pending Payment: ${t.tripNumber}`,
        subtitle: `${t.customerName} · ₹${Number(t.tripAmount).toLocaleString("en-IN")}`,
        type:     "payment",
        url:      `/trips/${t.id}`,
        days:     null,
      });
    }

    for (const v of insuranceVehicles) {
      if (!v.insuranceExpiry) continue;
      const days = Math.ceil((new Date(v.insuranceExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id:       `ins-${v.id}`,
        title:    `Insurance Expiring: ${v.name}`,
        subtitle: `${v.registrationNumber} · ${days < 0 ? "Expired!" : `${days} days left`}`,
        type:     "insurance",
        url:      `/vehicles/${v.id}`,
        days,
      });
    }

    for (const v of pucVehicles) {
      if (!v.pucExpiry) continue;
      const days = Math.ceil((new Date(v.pucExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id:       `puc-${v.id}`,
        title:    `PUC Expiring: ${v.name}`,
        subtitle: `${v.registrationNumber} · ${days < 0 ? "Expired!" : `${days} days left`}`,
        type:     "puc",
        url:      `/vehicles/${v.id}`,
        days,
      });
    }

    for (const d of licenseDrivers) {
      if (!d.licenseExpiry) continue;
      const days = Math.ceil((new Date(d.licenseExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id:       `lic-${d.id}`,
        title:    `License Expiring: ${d.name}`,
        subtitle: `${days < 0 ? "Expired!" : `${days} days left`}`,
        type:     "license",
        url:      `/drivers/${d.id}`,
        days,
      });
    }

    for (const p of tollPasses) {
      const days = Math.ceil((new Date(p.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      items.push({
        id:       `toll-${p.id}`,
        title:    `Toll Pass Expiring: ${p.passName}`,
        subtitle: `${p.vehicle.name} · ${days < 0 ? "Expired!" : `${days} days left`}`,
        type:     "tollPass",
        url:      `/toll-passes`,
        days,
      });
    }

    return {
      success: true,
      data: {
        count: items.length,
        items,
      },
    };
  } catch (err) {
    console.error("[getSystemAlerts]", err);
    return { success: false, error: "Failed to fetch alerts." };
  }
}
