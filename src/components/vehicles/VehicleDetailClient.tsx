"use client";

// =============================================================================
// SkyRideTour — Vehicle Detail Client
// Stat cards, expiry alert banners, tabbed trips + expenses table, edit modal
// =============================================================================

import { useState }    from "react";
import Link            from "next/link";
import { useRouter }   from "next/navigation";
import { toast }       from "sonner";
import {
  Car, DollarSign, TrendingUp, Wrench, AlertTriangle,
  ShieldAlert, CheckCircle2, Pencil, ToggleRight, ToggleLeft,
  Calendar, Fuel, Ticket, Users, FileText, Loader2,
} from "lucide-react";

import {
  updateVehicle, toggleVehicleStatus, type VehicleDetail, type VehicleStats,
} from "@/server/actions/vehicle";
import { VehicleForm }    from "@/components/vehicles/VehicleForm";
import { Badge }          from "@/components/ui/badge";
import {
  cn, formatCurrency, formatDate,
} from "@/lib/utils";
import {
  getDocStatus, getDaysUntilExpiry,
  VEHICLE_TYPE_LABELS, FUEL_TYPE_LABELS,
  type DocStatus,
} from "@/lib/validators/vehicle";
import type { PaymentStatus, VehicleType, FuelType } from "@prisma/client";

// =============================================================================
// EXPIRY ALERT BANNER
// =============================================================================

function ExpiryBanner({
  label,
  expiry,
}: {
  label:  string;
  expiry: Date | null;
}) {
  const status = getDocStatus(expiry);
  const days   = getDaysUntilExpiry(expiry);
  if (status === "valid" || status === "missing") return null;

  const isExpired = status === "expired";

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 rounded-xl border text-sm",
      isExpired
        ? "bg-red-50 border-red-200 text-red-800"
        : "bg-amber-50 border-amber-200 text-amber-800"
    )}>
      {isExpired
        ? <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-red-500" />
        : <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-amber-500" />}
      <div>
        <p className="font-semibold">
          {isExpired ? `${label} has expired` : `${label} expiring soon`}
        </p>
        <p className="text-xs opacity-80 mt-0.5">
          {isExpired
            ? `${label} expired on ${formatDate(expiry!)}. Renew immediately to avoid legal issues.`
            : `${label} expires on ${formatDate(expiry!)} — ${days} day${days !== 1 ? "s" : ""} remaining.`}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// STAT CARD
// =============================================================================

function Stat({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="card-elevated p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-xl font-bold text-[var(--foreground)] tracking-tight leading-tight">{value}</p>
      <p className="text-xs text-[var(--muted-foreground)] mt-1">{label}</p>
      {sub && <p className="text-[10px] text-[var(--muted-foreground)] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// =============================================================================
// DOC STATUS ROW
// =============================================================================

const DOC_STATUS_STYLE: Record<DocStatus, string> = {
  valid:    "text-emerald-700",
  expiring: "text-amber-700",
  expired:  "text-red-700",
  missing:  "text-[var(--muted-foreground)]",
};

const DOC_STATUS_ICON: Record<DocStatus, React.ElementType> = {
  valid:    CheckCircle2,
  expiring: AlertTriangle,
  expired:  ShieldAlert,
  missing:  Calendar,
};

function DocStatusRow({ label, expiry }: { label: string; expiry: Date | null }) {
  const status = getDocStatus(expiry);
  const days   = getDaysUntilExpiry(expiry);
  const Icon   = DOC_STATUS_ICON[status];
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4 flex-shrink-0", DOC_STATUS_STYLE[status])} />
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm text-[var(--muted-foreground)]">
          {expiry ? formatDate(expiry) : "Not set"}
        </span>
        {days !== null && (
          <p className={cn("text-[11px] font-medium", DOC_STATUS_STYLE[status])}>
            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TRIP ROW
// =============================================================================

const PMT_STYLE: Record<PaymentStatus, string> = {
  PAID: "success", PARTIAL: "warning", PENDING: "danger",
};

function TripRow({ trip }: { trip: VehicleDetail["trips"][0] }) {
  return (
    <Link href={`/trips/${trip.id}`}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--muted)]/40 transition-colors group">
      <div className="w-10 text-center flex-shrink-0">
        <p className="text-xs font-semibold text-[var(--foreground)]">{formatDate(trip.date).slice(0, 5)}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">{formatDate(trip.date).slice(6)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">
          {trip.pickupLocation} → {trip.dropLocation}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {trip.customerName} {trip.driver && `· ${trip.driver.name}`}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold">{formatCurrency(Number(trip.tripAmount))}</p>
        <Badge variant={PMT_STYLE[trip.paymentStatus] as "success" | "warning" | "danger"}
          className="text-[10px] mt-0.5">
          {trip.paymentStatus}
        </Badge>
      </div>
    </Link>
  );
}

// =============================================================================
// EXPENSE ROW
// =============================================================================

function ExpenseRow({ expense }: { expense: VehicleDetail["expenses"][0] }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--muted)]/40 transition-colors">
      <div className="w-10 text-center flex-shrink-0">
        <p className="text-xs font-semibold text-[var(--foreground)]">{formatDate(expense.date).slice(0, 5)}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">{formatDate(expense.date).slice(6)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">{expense.category}</p>
        {expense.description && <p className="text-xs text-[var(--muted-foreground)] truncate">{expense.description}</p>}
      </div>
      <p className="text-sm font-semibold text-red-600 flex-shrink-0">
        -{formatCurrency(Number(expense.amount))}
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VehicleDetailClient({
  vehicle,
  stats,
}: {
  vehicle: VehicleDetail;
  stats:   VehicleStats;
}) {
  const router          = useRouter();
  const [tab, setTab]   = useState<"trips" | "expenses" | "docs">("trips");
  const [editOpen, setEditOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    const result = await toggleVehicleStatus(vehicle.id, !vehicle.isActive);
    setToggling(false);
    if (!result.success) toast.error("Failed", { description: result.error });
    else {
      toast.success(`${vehicle.name} ${!vehicle.isActive ? "activated" : "deactivated"}`);
      router.refresh();
    }
  };

  const insStatus = getDocStatus(vehicle.insuranceExpiry);
  const pucStatus = getDocStatus(vehicle.pucExpiry);

  return (
    <>
      {/* ── Alert banners ──────────────────────────────────────────────── */}
      {(insStatus === "expiring" || insStatus === "expired") && (
        <ExpiryBanner label="Insurance" expiry={vehicle.insuranceExpiry} />
      )}
      {(pucStatus === "expiring" || pucStatus === "expired") && (
        <ExpiryBanner label="PUC Certificate" expiry={vehicle.pucExpiry} />
      )}

      {/* ── Header card ────────────────────────────────────────────────── */}
      <div className="card-elevated p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0",
              vehicle.isActive ? "bg-blue-100" : "bg-slate-100"
            )}>
              <Car className={cn("w-8 h-8", vehicle.isActive ? "text-blue-600" : "text-slate-400")} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[var(--foreground)] leading-tight">
                  {vehicle.name}
                </h1>
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  vehicle.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                )}>
                  {vehicle.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-[var(--muted-foreground)]">
                <span className="font-mono font-medium">{vehicle.registrationNumber}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5" />
                  {FUEL_TYPE_LABELS[vehicle.fuelType as FuelType] ?? vehicle.fuelType}
                </span>
                <span>·</span>
                <span>{VEHICLE_TYPE_LABELS[vehicle.vehicleType as VehicleType] ?? vehicle.vehicleType}</span>
                {vehicle.year && <><span>·</span><span>{vehicle.year}</span></>}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {vehicle.seatingCapacity} seats
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border)]
                text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              {toggling
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : vehicle.isActive
                  ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                  : <ToggleLeft  className="w-3.5 h-3.5" />}
              {vehicle.isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              id="edit-vehicle-btn"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border)]
                text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Lifetime Earnings"   value={formatCurrency(stats.totalRevenue)}
          sub={`${stats.totalTrips} trip${stats.totalTrips !== 1 ? "s" : ""}`}
          icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
        <Stat label="Trip Expenses"       value={formatCurrency(stats.tripExpenses)}
          sub="Fuel, toll, driver etc."
          icon={Car} color="bg-blue-50 text-blue-600" />
        <Stat label="Maintenance Cost"    value={formatCurrency(stats.totalExpenses)}
          sub="Service, repair, insurance"
          icon={Wrench} color="bg-amber-50 text-amber-600" />
        <Stat label="Net Yield"           value={formatCurrency(stats.netYield)}
          sub={stats.activeTollPasses > 0 ? `${stats.activeTollPasses} active toll pass` : undefined}
          icon={TrendingUp} color={stats.netYield >= 0 ? "bg-violet-50 text-violet-600" : "bg-red-50 text-red-500"} />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="card-elevated overflow-hidden">
        <div className="flex border-b border-[var(--border)] px-1 pt-1 overflow-x-auto">
          {([
            ["trips",    `Trips (${vehicle.trips.length})`,    Car],
            ["expenses", `Expenses (${vehicle.expenses.length})`, Wrench],
            ["docs",     "Documents",                           FileText],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap relative transition-colors",
                tab === key
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-t-full" />
              )}
            </button>
          ))}
          {stats.activeTollPasses > 0 && (
            <div className="ml-auto flex items-center pr-4">
              <span className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
                <Ticket className="w-3.5 h-3.5" />
                {stats.activeTollPasses} active toll pass
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Trips tab */}
          {tab === "trips" && (
            <div className="space-y-1">
              {vehicle.trips.length === 0 ? (
                <div className="py-10 text-center">
                  <Car className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-30 mb-3" />
                  <p className="text-sm text-[var(--muted-foreground)]">No trips assigned to this vehicle.</p>
                  <Link href="/trips/new"
                    className="text-[var(--primary)] text-sm font-medium hover:underline mt-2 inline-block">
                    Create a trip →
                  </Link>
                </div>
              ) : (
                vehicle.trips.map((t) => <TripRow key={t.id} trip={t} />)
              )}
            </div>
          )}

          {/* Expenses tab */}
          {tab === "expenses" && (
            <div className="space-y-1">
              {vehicle.expenses.length === 0 ? (
                <div className="py-10 text-center">
                  <Wrench className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-30 mb-3" />
                  <p className="text-sm text-[var(--muted-foreground)]">No standalone expenses recorded.</p>
                </div>
              ) : (
                vehicle.expenses.map((e) => <ExpenseRow key={e.id} expense={e} />)
              )}
            </div>
          )}

          {/* Documents tab */}
          {tab === "docs" && (
            <div className="max-w-sm">
              <DocStatusRow label="Insurance"       expiry={vehicle.insuranceExpiry} />
              <DocStatusRow label="PUC Certificate" expiry={vehicle.pucExpiry} />
              {vehicle.notes && (
                <div className="pt-3 mt-1">
                  <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-[var(--foreground)]">{vehicle.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <VehicleForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => router.refresh()}
        vehicle={vehicle}
      />
    </>
  );
}
