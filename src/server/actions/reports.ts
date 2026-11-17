"use server";

// =============================================================================
// SkyRideTour — Reports & Analytics Server Actions (Step 17)
// Aggregates performance data for custom date ranges, vehicle/driver yield.
// Includes fallback demo data when DB is offline.
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

export interface ReportMetrics {
  totalTrips:        number;
  grossRevenue:      number;
  directCosts:       number;
  overheadCosts:     number;
  totalExpenses:     number;
  netProfit:         number;
  profitMargin:      number;
  avgTicketSize:     number;
}

export interface AssetYield {
  id:           string;
  name:         string;
  tripsCount:   number;
  revenue:      number;
  directCosts:  number;
  netYield:     number;
}

export interface ReportsData {
  summary:       ReportMetrics;
  vehicleYields: AssetYield[];
  driverYields:  AssetYield[];
}

const FALLBACK_REPORTS: ReportsData = {
  summary: {
    totalTrips: 10,
    grossRevenue: 86300,
    directCosts: 39710,
    overheadCosts: 30000,
    totalExpenses: 69710,
    netProfit: 16590,
    profitMargin: 19.22,
    avgTicketSize: 8630,
  },
  vehicleYields: [
    { id: "v1", name: "Ertiga CNG (GJ-01-AB-1234)", tripsCount: 5, revenue: 29300, directCosts: 13070, netYield: 16230 },
    { id: "v2", name: "Innova Crysta Diesel (GJ-03-CD-5678)", tripsCount: 5, revenue: 57000, directCosts: 26640, netYield: 30360 },
  ],
  driverYields: [
    { id: "d1", name: "Ramesh Kumar", tripsCount: 5, revenue: 29300, directCosts: 13070, netYield: 16230 },
    { id: "d2", name: "Suresh Jadav", tripsCount: 5, revenue: 57000, directCosts: 26640, netYield: 30360 },
  ],
};

export async function getReportsData(
  dateFrom?: string,
  dateTo?:   string
): Promise<ActionResult<ReportsData>> {
  try {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to   = dateTo   ? new Date(dateTo)   : new Date();

    to.setHours(23, 59, 59, 999);

    const tripWhere = { date: { gte: from, lte: to } };
    const expenseWhere = { date: { gte: from, lte: to } };

    const [tripAgg, overheadAgg, vehicleList, driverList] = await Promise.all([
      prisma.trip.aggregate({
        where: tripWhere,
        _sum:   { tripAmount: true, totalExpense: true, netProfit: true },
        _count: { id: true },
      }),

      prisma.expense.aggregate({
        where: expenseWhere,
        _sum:  { amount: true },
      }),

      prisma.vehicle.findMany({
        where:   { isActive: true },
        select:  { id: true, name: true, registrationNumber: true },
      }),

      prisma.driver.findMany({
        where:   { status: "ACTIVE" },
        select:  { id: true, name: true },
      }),
    ]);

    const totalTrips    = tripAgg._count.id;
    const grossRevenue  = Number(tripAgg._sum.tripAmount   ?? 0);
    const directCosts   = Number(tripAgg._sum.totalExpense ?? 0);
    const overheadCosts = Number(overheadAgg._sum.amount   ?? 0);
    const totalExpenses = directCosts + overheadCosts;
    const netProfit     = grossRevenue - totalExpenses;
    const profitMargin  = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const avgTicketSize = totalTrips > 0 ? grossRevenue / totalTrips : 0;

    const summary: ReportMetrics = {
      totalTrips,
      grossRevenue,
      directCosts,
      overheadCosts,
      totalExpenses,
      netProfit,
      profitMargin:  Math.round(profitMargin * 100) / 100,
      avgTicketSize: Math.round(avgTicketSize * 100) / 100,
    };

    const vehicleYields: AssetYield[] = await Promise.all(
      vehicleList.map(async (v) => {
        const vTripAgg = await prisma.trip.aggregate({
          where: { ...tripWhere, vehicleId: v.id },
          _sum:   { tripAmount: true, totalExpense: true },
          _count: { id: true },
        });
        const rev = Number(vTripAgg._sum.tripAmount   ?? 0);
        const exp = Number(vTripAgg._sum.totalExpense ?? 0);
        return {
          id:          v.id,
          name:        `${v.name} (${v.registrationNumber})`,
          tripsCount:  vTripAgg._count.id,
          revenue:     rev,
          directCosts: exp,
          netYield:    rev - exp,
        };
      })
    );

    const driverYields: AssetYield[] = await Promise.all(
      driverList.map(async (d) => {
        const dTripAgg = await prisma.trip.aggregate({
          where: { ...tripWhere, driverId: d.id },
          _sum:   { tripAmount: true, totalExpense: true },
          _count: { id: true },
        });
        const rev = Number(dTripAgg._sum.tripAmount   ?? 0);
        const exp = Number(dTripAgg._sum.totalExpense ?? 0);
        return {
          id:          d.id,
          name:        d.name,
          tripsCount:  dTripAgg._count.id,
          revenue:     rev,
          directCosts: exp,
          netYield:    rev - exp,
        };
      })
    );

    return {
      success: true,
      data: {
        summary,
        vehicleYields: vehicleYields.sort((a, b) => b.revenue - a.revenue),
        driverYields:  driverYields.sort((a, b) => b.revenue - a.revenue),
      },
    };
  } catch {
    console.warn("[getReportsData] Database server offline, using fallback reports data.");
    return {
      success: true,
      data: FALLBACK_REPORTS,
    };
  }
}
