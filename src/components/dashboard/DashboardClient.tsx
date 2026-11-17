"use client";

// =============================================================================
// SkyRideTour — Dashboard Client (Step 16)
// KPI cards + Recharts trend + expense donut + recent trips + alert banners
// =============================================================================

import dynamic from "next/dynamic";
import Link    from "next/link";
import {
  DollarSign, TrendingUp, TrendingDown, Route,
  AlertTriangle, ShieldAlert, Car, User, Ticket,
  CreditCard, ArrowRight,
} from "lucide-react";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardData } from "@/server/actions/dashboard";

// Recharts — SSR disabled (avoids window-not-defined error)
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line      = dynamic(() => import("recharts").then((m) => m.Line),      { ssr: false });
const PieChart  = dynamic(() => import("recharts").then((m) => m.PieChart),  { ssr: false });
const Pie       = dynamic(() => import("recharts").then((m) => m.Pie),       { ssr: false });
const Cell      = dynamic(() => import("recharts").then((m) => m.Cell),      { ssr: false });
const XAxis     = dynamic(() => import("recharts").then((m) => m.XAxis),     { ssr: false });
const YAxis     = dynamic(() => import("recharts").then((m) => m.YAxis),     { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip   = dynamic(() => import("recharts").then((m) => m.Tooltip),   { ssr: false });
const Legend    = dynamic(() => import("recharts").then((m) => m.Legend),    { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, negative }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; negative?: boolean;
}) {
  return (
    <div className="card-elevated p-4 flex flex-col gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className={cn("text-2xl font-bold tracking-tight leading-none", negative ? "text-red-500" : "text-[var(--foreground)]")}>{value}</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1.5">{label}</p>
        {sub && <p className="text-[10px] text-[var(--muted-foreground)] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

function AlertBanner({ label, count, href, icon: Icon, color }: {
  label: string; count: number; href: string;
  icon: React.ElementType; color: string;
}) {
  if (count === 0) return null;
  return (
    <Link href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80",
        color
      )}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{count} {label}</span>
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

// ─── Donut chart data builder ─────────────────────────────────────────────────

const DONUT_COLORS = [
  "#2563EB", "#16A34A", "#DC2626", "#D97706", "#7C3AED",
  "#0891B2", "#DB2777", "#059669", "#EA580C", "#4F46E5",
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardClient({ data }: { data: DashboardData }) {
  const { today, thisMonth, breakdown, trend, recentTrips, alerts } = data;

  const totalAlerts = alerts.pendingPayments + alerts.insuranceExpiring + alerts.pucExpiring +
    alerts.licenseExpiring + alerts.tollPassExpiring;

  // Build donut data
  const donutData = [
    { name: "CNG",           value: breakdown.cng },
    { name: "Petrol",        value: breakdown.petrol },
    { name: "Diesel",        value: breakdown.diesel },
    { name: "Toll",          value: breakdown.toll },
    { name: "Parking",       value: breakdown.parking },
    { name: "Driver Allow.", value: breakdown.driverExpense },
    { name: "Food",          value: breakdown.food },
    { name: "Accommodation", value: breakdown.accommodation },
    { name: "Maintenance",   value: breakdown.maintenance },
    { name: "Repair",        value: breakdown.repair },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Dashboard</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {totalAlerts > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            {totalAlerts} alert{totalAlerts > 1 ? "s" : ""} need attention
          </div>
        )}
      </div>

      {data.dbConnected === false && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>PostgreSQL server is offline (showing preview data). Start PostgreSQL on port 5432 or update DATABASE_URL in .env to view live database records.</span>
          </div>
        </div>
      )}

      {/* Alert banners */}
      {totalAlerts > 0 && (
        <div className="grid sm:grid-cols-2 gap-2">
          <AlertBanner count={alerts.pendingPayments}   label="pending/partial payments" href="/trips?status=PENDING"   icon={CreditCard}     color="bg-red-50 border-red-200 text-red-800" />
          <AlertBanner count={alerts.insuranceExpiring} label="vehicle insurance expiring" href="/vehicles"             icon={ShieldAlert}    color="bg-amber-50 border-amber-200 text-amber-800" />
          <AlertBanner count={alerts.pucExpiring}       label="vehicle PUC expiring"     href="/vehicles"               icon={ShieldAlert}    color="bg-amber-50 border-amber-200 text-amber-800" />
          <AlertBanner count={alerts.licenseExpiring}   label="driver license expiring"  href="/drivers"                icon={User}           color="bg-amber-50 border-amber-200 text-amber-800" />
          <AlertBanner count={alerts.tollPassExpiring}  label="toll pass expiring"       href="/toll-passes"            icon={Ticket}         color="bg-violet-50 border-violet-200 text-violet-800" />
        </div>
      )}

      {/* Today KPIs */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Today</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard label="Revenue"     value={formatCurrency(today.revenue)}   icon={DollarSign}  color="bg-blue-50 text-blue-600" />
          <KpiCard label="Expenses"    value={formatCurrency(today.expenses)}  icon={TrendingDown} color="bg-red-50 text-red-600" negative />
          <KpiCard label="Net Profit"  value={formatCurrency(today.netProfit)} icon={TrendingUp}  color={today.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"} negative={today.netProfit < 0} />
          <KpiCard label="Trips"       value={String(today.tripsCount)}        icon={Route}       color="bg-violet-50 text-violet-600" sub="completed today" />
        </div>
      </div>

      {/* Month KPIs */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">This Month</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard label="Revenue"    value={formatCurrency(thisMonth.revenue)}   icon={DollarSign}  color="bg-blue-50 text-blue-600" />
          <KpiCard label="Expenses"   value={formatCurrency(thisMonth.expenses)}  icon={TrendingDown} color="bg-red-50 text-red-600" negative />
          <KpiCard label="Net Profit" value={formatCurrency(thisMonth.netProfit)} icon={TrendingUp}  color={thisMonth.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"} negative={thisMonth.netProfit < 0} />
          <KpiCard label="Trips"      value={String(thisMonth.tripsCount)}        icon={Route}       color="bg-violet-50 text-violet-600" sub="this month" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid xl:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="card-elevated p-4 xl:col-span-2">
          <p className="text-sm font-semibold text-[var(--foreground)] mb-4">Revenue vs Expenses vs Profit — Last 30 Days</p>
          {trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
              No trip data in the last 30 days
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="revenue"  stroke="#2563EB" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#DC2626" strokeWidth={2} dot={false} name="Expenses" />
                  <Line type="monotone" dataKey="profit"   stroke="#16A34A" strokeWidth={2} dot={false} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense donut */}
        <div className="card-elevated p-4">
          <p className="text-sm font-semibold text-[var(--foreground)] mb-4">Expense Breakdown</p>
          {donutData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
              No expenses this month
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent trips */}
      <div className="card-elevated overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <p className="text-sm font-semibold text-[var(--foreground)]">Recent Trips</p>
          <Link href="/trips" className="text-xs text-[var(--primary)] font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentTrips.length === 0 ? (
          <div className="py-12 text-center">
            <Car className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-30 mb-3" />
            <p className="text-sm text-[var(--muted-foreground)]">No trips yet</p>
            <Link href="/trips" className="text-[var(--primary)] text-sm font-medium hover:underline mt-2 inline-block">
              Create your first trip →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recentTrips.map((t) => (
              <Link key={t.id} href={`/trips/${t.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--muted)]/40 transition-colors">
                <div className="w-16 flex-shrink-0">
                  <p className="text-xs font-mono font-medium text-[var(--primary)]">{t.tripNumber}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{formatDate(t.date)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {t.pickupLocation} → {t.dropLocation}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{t.customerName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(t.tripAmount)}</p>
                  <p className={cn("text-xs font-medium", t.netProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
                    {t.netProfit >= 0 ? "+" : ""}{formatCurrency(t.netProfit)}
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                  t.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700"
                    : t.paymentStatus === "PARTIAL" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                )}>
                  {t.paymentStatus}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
