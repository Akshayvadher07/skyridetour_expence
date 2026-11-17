"use client";

// =============================================================================
// SkyRideTour — Trip List Page
// Inline Customer Details
// =============================================================================

import { useState, useEffect, useCallback, useTransition } from "react";
import Link            from "next/link";
import { toast }       from "sonner";
import {
  Route, Plus, Search, X, ChevronDown, Loader2,
  Car, User, TrendingUp, TrendingDown, ChevronRight,
  Filter, Calendar, Trash2, Phone,
} from "lucide-react";

import { getTrips, deleteTrip, type TripListItem } from "@/server/actions/trip";
import { TripForm } from "@/components/trips/TripForm";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  TRIP_TYPE_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUSES, TRIP_TYPES,
} from "@/lib/validators/trip";
import type { PaymentStatus } from "@prisma/client";

// ─── Payment Status Badge ──────────────────────────────────────────────────────

const PMT_CONFIG: Record<PaymentStatus, { cls: string }> = {
  PAID:    { cls: "bg-emerald-100 text-emerald-700" },
  PARTIAL: { cls: "bg-amber-100   text-amber-700"   },
  PENDING: { cls: "bg-red-100     text-red-700"     },
};

// ─── Trip Row ─────────────────────────────────────────────────────────────────

function TripRow({
  trip, onDelete,
}: {
  trip: TripListItem;
  onDelete: () => void;
}) {
  const pmt    = PMT_CONFIG[trip.paymentStatus];
  const profit = Number(trip.netProfit);

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors group">
      {/* Trip number + date */}
      <td className="px-4 py-3">
        <Link href={`/trips/${trip.id}`} className="group/link">
          <p className="text-xs font-mono font-medium text-[var(--primary)] group-hover/link:underline">
            {trip.tripNumber}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{formatDate(trip.date)}</p>
        </Link>
      </td>

      {/* Customer */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[var(--foreground)] truncate max-w-[140px]">
          {trip.customerName}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
          <Phone className="w-3 h-3" /> +91 {trip.customerPhone}
        </p>
      </td>

      {/* Route */}
      <td className="px-4 py-3 hidden md:table-cell">
        <p className="text-sm text-[var(--foreground)] truncate max-w-[180px]">
          {trip.pickupLocation} → {trip.dropLocation}
        </p>
        <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded">
          {TRIP_TYPE_LABELS[trip.tripType]}
        </span>
      </td>

      {/* Vehicle + Driver */}
      <td className="px-4 py-3 hidden lg:table-cell">
        {trip.vehicle && (
          <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Car className="w-3 h-3" /> {trip.vehicle.name}
          </p>
        )}
        {trip.driver && (
          <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <User className="w-3 h-3" /> {trip.driver.name}
          </p>
        )}
      </td>

      {/* Revenue */}
      <td className="px-4 py-3 text-right">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {formatCurrency(Number(trip.tripAmount))}
        </p>
        <p className="text-[10px] text-[var(--muted-foreground)]">
          Exp: {formatCurrency(Number(trip.totalExpense))}
        </p>
      </td>

      {/* Profit */}
      <td className="px-4 py-3 text-right hidden sm:table-cell">
        <p className={cn("text-sm font-bold flex items-center justify-end gap-1",
          profit >= 0 ? "text-emerald-600" : "text-red-500")}>
          {profit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {formatCurrency(profit)}
        </p>
        <p className="text-[10px] text-[var(--muted-foreground)]">
          {Number(trip.profitMargin).toFixed(1)}%
        </p>
      </td>

      {/* Payment status */}
      <td className="px-4 py-3">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", pmt.cls)}>
          {PAYMENT_STATUS_LABELS[trip.paymentStatus]}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/trips/${trip.id}`}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
            <ChevronRight className="w-4 h-4" />
          </Link>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const [trips,         setTrips]         = useState<TripListItem[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [formOpen,      setFormOpen]      = useState(false);
  const [query,         setQuery]         = useState("");
  const [debQ,          setDebQ]          = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [typeFilter,    setTypeFilter]    = useState("");
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const [showFilters,   setShowFilters]   = useState(false);
  const [, startTx]                       = useTransition();

  const LIMIT = 50;

  useEffect(() => {
    const t = setTimeout(() => setDebQ(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { setPage(1); }, [debQ, statusFilter, typeFilter, dateFrom, dateTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getTrips({
      query:         debQ         || undefined,
      paymentStatus: statusFilter || undefined,
      tripType:      typeFilter   || undefined,
      dateFrom:      dateFrom     || undefined,
      dateTo:        dateTo       || undefined,
      page,
      limit: LIMIT,
    });
    if (result.success) { setTrips(result.data.trips); setTotal(result.data.total); }
    else toast.error("Failed to load trips", { description: result.error });
    setLoading(false);
  }, [debQ, statusFilter, typeFilter, dateFrom, dateTo, page]);

  useEffect(() => { startTx(() => { void fetchData(); }); }, [fetchData]);

  const handleDelete = async (trip: TripListItem) => {
    if (!window.confirm(`Delete trip ${trip.tripNumber}? This will remove all payments and invoices.`)) return;
    const result = await deleteTrip(trip.id);
    if (!result.success) toast.error("Cannot delete", { description: result.error });
    else { toast.success(`${trip.tripNumber} deleted`); void fetchData(); }
  };

  const clearFilters = () => {
    setQuery(""); setStatusFilter(""); setTypeFilter(""); setDateFrom(""); setDateTo("");
  };
  const hasFilters = query || statusFilter || typeFilter || dateFrom || dateTo;
  const totalPages = Math.ceil(total / LIMIT);

  const totalRevenue  = trips.reduce((s, t) => s + Number(t.tripAmount), 0);
  const totalExpenses = trips.reduce((s, t) => s + Number(t.totalExpense), 0);
  const totalProfit   = trips.reduce((s, t) => s + Number(t.netProfit), 0);
  const pendingCount  = trips.filter((t) => t.paymentStatus !== "PAID").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Trips</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {total} trip{total !== 1 ? "s" : ""}
            {pendingCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {pendingCount} unpaid</span>}
          </p>
        </div>
        <button
          id="add-trip-btn"
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]
            hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]
            text-sm font-semibold transition-all active:scale-[0.97]
            hover:shadow-[0_0_16px_rgba(37,99,235,0.35)]">
          <Plus className="w-4 h-4" /> New Trip
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenue",   value: formatCurrency(totalRevenue),  color: "bg-blue-50 text-blue-600",    icon: Route },
          { label: "Expenses",  value: formatCurrency(totalExpenses), color: "bg-red-50 text-red-600",     icon: TrendingDown },
          { label: "Net Profit",value: formatCurrency(totalProfit),   color: totalProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600", icon: TrendingUp },
          { label: "Trips",     value: String(total),                 color: "bg-violet-50 text-violet-600", icon: Calendar },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card-elevated p-3.5 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--foreground)] leading-tight">{value}</p>
              <p className="text-[11px] text-[var(--muted-foreground)]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters toolbar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input id="trip-search" type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trip #, customer name/phone, route…"
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[var(--border)]
                bg-[var(--card)] text-sm placeholder:text-[var(--muted-foreground)]
                outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" />
            {query && (
              <button onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button onClick={() => setShowFilters((v) => !v)}
            className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors",
              showFilters ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]")}>
            <Filter className="w-3.5 h-3.5" /> Filters
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          </button>

          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-red-500 hover:underline">
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-[var(--muted)]/40 rounded-xl border border-[var(--border)]">
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]
                  text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none">
                <option value="">All Payment Status</option>
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
            </div>

            <div className="relative">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]
                  text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none">
                <option value="">All Trip Types</option>
                {TRIP_TYPES.map((t) => <option key={t} value={t}>{TRIP_TYPE_LABELS[t]}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]
                  text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              <span className="text-sm text-[var(--muted-foreground)]">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]
                  text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
                {["Trip #", "Customer", "Route", "Vehicle / Driver", "Revenue", "Profit", "Payment", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)] mx-auto" />
                </td></tr>
              ) : trips.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Route className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-30 mb-3" />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {hasFilters ? "No trips match your filters" : "No trips recorded yet"}
                  </p>
                  {!hasFilters && (
                    <button onClick={() => setFormOpen(true)}
                      className="text-[var(--primary)] text-sm font-medium hover:underline mt-2 inline-block">
                      Record your first trip →
                    </button>
                  )}
                </td></tr>
              ) : (
                trips.map((t) => (
                  <TripRow key={t.id} trip={t} onDelete={() => handleDelete(t)} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted-foreground)]">
              Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium
                  hover:bg-[var(--muted)] disabled:opacity-40 transition-colors">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium
                  hover:bg-[var(--muted)] disabled:opacity-40 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      <TripForm open={formOpen} onClose={() => setFormOpen(false)} onSuccess={fetchData} />
    </div>
  );
}
