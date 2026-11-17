"use server";

// =============================================================================
// SkyRideTour — Dashboard Aggregation Actions (Step 16)
// Robust error handling with demo fallback when DB server is offline.
// =============================================================================

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodMetrics {
  revenue:     number;
  expenses:    number;
  netProfit:   number;
  tripsCount:  number;
}

export interface ExpenseBreakdown {
  cng:           number;
  petrol:        number;
  diesel:        number;
  toll:          number;
  parking:       number;
  driverExpense: number;
  food:          number;
  accommodation: number;
  other:         number;
  maintenance:   number;
  repair:        number;
  insurance:     number;
  driverSalary:  number;
  cleaning:      number;
  service:       number;
  overheadOther: number;
}

export interface TrendPoint {
  date:     string;  // YYYY-MM-DD
  revenue:  number;
  expenses: number;
  profit:   number;
}

export interface DashboardData {
  today:     PeriodMetrics;
  thisMonth: PeriodMetrics;
  breakdown: ExpenseBreakdown;
  trend:     TrendPoint[];
  recentTrips: {
    id: string; tripNumber: string; date: Date;
    pickupLocation: string; dropLocation: string;
    tripAmount: number; netProfit: number; paymentStatus: string;
    customerName: string;
  }[];
  alerts: {
    pendingPayments:    number;
    insuranceExpiring:  number;
    pucExpiring:        number;
    licenseExpiring:    number;
    tollPassExpiring:   number;
  };
  dbConnected?: boolean;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Aggregate helpers ────────────────────────────────────────────────────────

async function getTripMetrics(dateFrom: Date, dateTo: Date): Promise<PeriodMetrics> {
  try {
    const agg = await prisma.trip.aggregate({
      where: { date: { gte: dateFrom, lte: dateTo } },
      _sum:   { tripAmount: true, totalExpense: true, netProfit: true },
      _count: { id: true },
    });
    return {
      revenue:    Number(agg._sum.tripAmount  ?? 0),
      expenses:   Number(agg._sum.totalExpense ?? 0),
      netProfit:  Number(agg._sum.netProfit   ?? 0),
      tripsCount: agg._count.id,
    };
  } catch {
    return { revenue: 0, expenses: 0, netProfit: 0, tripsCount: 0 };
  }
}

// ─── Fallback Demo Data when DB is unreachable ───────────────────────────────

const FALLBACK_DASHBOARD_DATA: DashboardData = {
  today: { revenue: 3000, expenses: 1150, netProfit: 1850, tripsCount: 1 },
  thisMonth: { revenue: 86300, expenses: 39710, netProfit: 46590, tripsCount: 10 },
  breakdown: {
    cng: 7200, petrol: 0, diesel: 16100, toll: 2980, parking: 1850,
    driverExpense: 5950, food: 2100, accommodation: 2500, other: 0,
    maintenance: 3500, repair: 0, insurance: 8500, driverSalary: 18000,
    cleaning: 0, service: 0, overheadOther: 0,
  },
  trend: [
    { date: "2026-07-25", revenue: 3000, expenses: 1150, profit: 1850 },
    { date: "2026-08-01", revenue: 8500, expenses: 4100, profit: 4400 },
    { date: "2026-08-05", revenue: 5500, expenses: 2370, profit: 3130 },
    { date: "2026-08-10", revenue: 18000, expenses: 11150, profit: 6850 },
    { date: "2026-08-15", revenue: 4000, expenses: 1400, profit: 2600 },
    { date: "2026-08-20", revenue: 7200, expenses: 3280, profit: 3920 },
    { date: "2026-08-25", revenue: 4800, expenses: 1600, profit: 3200 },
    { date: "2026-09-01", revenue: 6500, expenses: 3060, profit: 3440 },
    { date: "2026-09-08", revenue: 12000, expenses: 6550, profit: 5450 },
    { date: "2026-09-14", revenue: 11000, expenses: 5220, profit: 5780 },
  ],
  recentTrips: [
    { id: "demo-1", tripNumber: "SRT-2026-0001", date: new Date("2026-07-25"), pickupLocation: "Somnath", dropLocation: "Somnath", tripAmount: 3000, netProfit: 1850, paymentStatus: "PAID", customerName: "Amit Shah" },
    { id: "demo-2", tripNumber: "SRT-2026-0002", date: new Date("2026-08-01"), pickupLocation: "Ahmedabad Airport", dropLocation: "Somnath Temple", tripAmount: 8500, netProfit: 4400, paymentStatus: "PAID", customerName: "Rajesh Patel" },
    { id: "demo-3", tripNumber: "SRT-2026-0003", date: new Date("2026-08-05"), pickupLocation: "Rajkot", dropLocation: "Dwarkadhish Temple", tripAmount: 5500, netProfit: 3130, paymentStatus: "PARTIAL", customerName: "Amit Shah" },
  ],
  alerts: { pendingPayments: 2, insuranceExpiring: 0, pucExpiring: 0, licenseExpiring: 0, tollPassExpiring: 0 },
  dbConnected: false,
};

// ─── Main dashboard action ────────────────────────────────────────────────────

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  try {
    const now   = new Date();
    const todayStart = startOfDay(now);
    const todayEnd   = endOfDay(now);
    const monthStart = startOfMonth(now);
    const alertDate  = daysFromNow(30);

    const [
      today,
      thisMonth,
      tripExpenseAgg,
      overheadAgg,
      recentTripsRaw,
      pendingPayments,
      insuranceExpiring,
      pucExpiring,
      licenseExpiring,
      tollPassExpiring,
      last30DaysTrips,
    ] = await Promise.all([
      getTripMetrics(todayStart, todayEnd),
      getTripMetrics(monthStart, todayEnd),

      prisma.trip.aggregate({
        where: { date: { gte: monthStart, lte: todayEnd } },
        _sum: {
          cngExpense: true, petrolExpense: true, dieselExpense: true,
          tollExpense: true, parkingExpense: true, driverExpense: true,
          foodExpense: true, accommodationExpense: true, otherExpense: true,
        },
      }),

      prisma.expense.groupBy({
        by:    ["category"],
        where: { date: { gte: monthStart, lte: todayEnd } },
        _sum:  { amount: true },
      }),

      prisma.trip.findMany({
        take:    8,
        orderBy: { date: "desc" },
        select: {
          id: true, tripNumber: true, date: true,
          customerName: true,
          pickupLocation: true, dropLocation: true,
          tripAmount: true, netProfit: true, paymentStatus: true,
        },
      }),

      prisma.trip.count({ where: { paymentStatus: { in: ["PENDING", "PARTIAL"] } } }),
      prisma.vehicle.count({ where: { insuranceExpiry: { lte: alertDate, gte: now }, isActive: true } }),
      prisma.vehicle.count({ where: { pucExpiry:       { lte: alertDate, gte: now }, isActive: true } }),
      prisma.driver.count({ where:  { licenseExpiry:   { lte: alertDate, gte: now }, status: "ACTIVE" } }),
      prisma.tollPass.count({ where: { expiryDate:     { lte: alertDate, gte: now }, isActive: true } }),

      prisma.trip.findMany({
        where:   { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select:  { date: true, tripAmount: true, totalExpense: true, netProfit: true },
        orderBy: { date: "asc" },
      }),
    ]);

    const overheadMap: Record<string, number> = {};
    for (const g of overheadAgg) {
      overheadMap[g.category] = Number(g._sum.amount ?? 0);
    }

    const breakdown: ExpenseBreakdown = {
      cng:           Number(tripExpenseAgg._sum.cngExpense          ?? 0),
      petrol:        Number(tripExpenseAgg._sum.petrolExpense        ?? 0),
      diesel:        Number(tripExpenseAgg._sum.dieselExpense        ?? 0),
      toll:          Number(tripExpenseAgg._sum.tollExpense          ?? 0),
      parking:       Number(tripExpenseAgg._sum.parkingExpense       ?? 0),
      driverExpense: Number(tripExpenseAgg._sum.driverExpense        ?? 0),
      food:          Number(tripExpenseAgg._sum.foodExpense          ?? 0),
      accommodation: Number(tripExpenseAgg._sum.accommodationExpense ?? 0),
      other:         Number(tripExpenseAgg._sum.otherExpense         ?? 0),
      maintenance:   overheadMap["MAINTENANCE"]  ?? 0,
      repair:        overheadMap["REPAIR"]       ?? 0,
      insurance:     overheadMap["INSURANCE"]    ?? 0,
      driverSalary:  overheadMap["DRIVER_SALARY"] ?? 0,
      cleaning:      overheadMap["CLEANING"]     ?? 0,
      service:       overheadMap["SERVICE"]      ?? 0,
      overheadOther: overheadMap["OTHER"]        ?? 0,
    };

    const trendMap = new Map<string, TrendPoint>();
    for (const t of last30DaysTrips) {
      const key = new Date(t.date).toISOString().split("T")[0];
      const existing = trendMap.get(key) ?? { date: key, revenue: 0, expenses: 0, profit: 0 };
      existing.revenue  += Number(t.tripAmount);
      existing.expenses += Number(t.totalExpense);
      existing.profit   += Number(t.netProfit);
      trendMap.set(key, existing);
    }
    const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const recentTrips = recentTripsRaw.map((t) => ({
      ...t,
      tripAmount: Number(t.tripAmount),
      netProfit:  Number(t.netProfit),
    }));

    return {
      success: true,
      data: {
        today,
        thisMonth,
        breakdown,
        trend,
        recentTrips,
        alerts: {
          pendingPayments,
          insuranceExpiring,
          pucExpiring,
          licenseExpiring,
          tollPassExpiring,
        },
        dbConnected: true,
      },
    };
  } catch {
    console.warn("[getDashboardData] Database server offline, using fallback preview data.");
    return {
      success: true,
      data: FALLBACK_DASHBOARD_DATA,
    };
  }
}
