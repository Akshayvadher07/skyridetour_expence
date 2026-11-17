"use client";

import { useState }    from "react";
import Link            from "next/link";
import { useRouter }   from "next/navigation";
import { toast }       from "sonner";
import {
  Phone, Calendar, CreditCard, Car, DollarSign,
  Route, Pencil, Loader2, CheckCircle2, AlertTriangle, ShieldAlert,
  FileText, Clock,
} from "lucide-react";

import {
  updateDriverStatus, type DriverDetailWithStats, type DriverStats,
} from "@/server/actions/driver";
import { DriverForm }  from "@/components/drivers/DriverForm";
import { Badge }       from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  getLicenseStatus, getDaysUntilLicenseExpiry,
  DRIVER_STATUS_LABELS, DRIVER_STATUSES,
  type LicenseStatus,
} from "@/lib/validators/driver";
import type { PaymentStatus } from "@prisma/client";

// ─── License Alert Banner ─────────────────────────────────────────────────────

function LicenseBanner({ expiry }: { expiry: Date }) {
  const status = getLicenseStatus(expiry);
  const days   = getDaysUntilLicenseExpiry(expiry);
  if (status === "valid") return null;
  const isExpired = status === "expired";
  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 rounded-xl border text-sm",
      isExpired ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"
    )}>
      {isExpired
        ? <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-red-500" />
        : <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-amber-500" />}
      <div>
        <p className="font-semibold">{isExpired ? "License has expired" : "License expiring soon"}</p>
        <p className="text-xs opacity-80 mt-0.5">
          {isExpired
            ? `License expired on ${formatDate(expiry)}. Renew immediately.`
            : `License expires on ${formatDate(expiry)} — ${days} day${days !== 1 ? "s" : ""} remaining.`}
        </p>
      </div>
    </div>
  );
}

// ─── Status Colors ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  ON_LEAVE: "bg-amber-100 text-amber-700",
};

const PMT_STYLE: Record<PaymentStatus, string> = {
  PAID: "success", PARTIAL: "warning", PENDING: "danger",
};

// ─── Trip Row ─────────────────────────────────────────────────────────────────

function TripRow({ trip }: { trip: DriverDetailWithStats["trips"][0] }) {
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
          {trip.customerName}
          {trip.vehicle && ` · ${trip.vehicle.name}`}
          {Number(trip.driverExpense) > 0 && ` · Allowance: ${formatCurrency(Number(trip.driverExpense))}`}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold">{formatCurrency(Number(trip.tripAmount))}</p>
        <Badge variant={PMT_STYLE[trip.paymentStatus] as "success" | "warning" | "danger"} className="text-[10px] mt-0.5">
          {trip.paymentStatus}
        </Badge>
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DriverDetailClient({
  driver,
  stats,
}: {
  driver: DriverDetailWithStats;
  stats:  DriverStats;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen]     = useState(false);
  const [statusMenu, setStatusMenu] = useState(false);
  const [toggling, setToggling]     = useState(false);
  const [tab, setTab]               = useState<"trips" | "info">("trips");

  const licStatus = getLicenseStatus(driver.licenseExpiry);

  const handleStatusChange = async (status: "ACTIVE" | "INACTIVE" | "ON_LEAVE") => {
    setStatusMenu(false);
    setToggling(true);
    const result = await updateDriverStatus(driver.id, status);
    setToggling(false);
    if (!result.success) toast.error("Failed", { description: result.error });
    else { toast.success(`Marked ${DRIVER_STATUS_LABELS[status]}`); router.refresh(); }
  };

  return (
    <>
      {/* License alert banner */}
      {licStatus !== "valid" && <LicenseBanner expiry={driver.licenseExpiry} />}

      {/* Header card */}
      <div className="card-elevated p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600
              flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white text-2xl font-bold">{driver.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[var(--foreground)]">{driver.name}</h1>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                  STATUS_COLORS[driver.status] ?? "bg-slate-100 text-slate-500")}>
                  {DRIVER_STATUS_LABELS[driver.status as keyof typeof DRIVER_STATUS_LABELS] ?? driver.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-[var(--muted-foreground)]">
                <a href={`tel:+91${driver.phone}`} className="flex items-center gap-1.5 hover:text-[var(--primary)]">
                  <Phone className="w-3.5 h-3.5" /> +91 {driver.phone}
                </a>
                <span>·</span>
                <span className="flex items-center gap-1.5 font-mono">
                  <CreditCard className="w-3.5 h-3.5" /> {driver.licenseNumber}
                </span>
                {driver.joiningDate && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Since {formatDate(driver.joiningDate)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status picker */}
            <div className="relative">
              <button onClick={() => setStatusMenu((v) => !v)} disabled={toggling}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border)]
                  text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50">
                {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                Status
              </button>
              {statusMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusMenu(false)} />
                  <div className="absolute right-0 top-10 z-20 w-36 bg-[var(--card)] border border-[var(--border)]
                    rounded-xl shadow-lg py-1">
                    {DRIVER_STATUSES.map((s) => (
                      <button key={s} onClick={() => handleStatusChange(s)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors",
                          driver.status === s && "font-semibold text-[var(--primary)]"
                        )}>
                        {DRIVER_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button id="edit-driver-btn" onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border)]
                text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Trips",       value: String(stats.totalTrips),               icon: Route,    color: "bg-blue-50 text-blue-600" },
          { label: "Total Allowances",  value: formatCurrency(stats.totalAllowances),  icon: DollarSign, color: "bg-amber-50 text-amber-600" },
          { label: "Trip Revenue",      value: formatCurrency(stats.totalRevenue),      icon: Car,      color: "bg-emerald-50 text-emerald-600" },
          { label: "Monthly Salary",    value: formatCurrency(Number(driver.salary)),   icon: CreditCard, color: "bg-violet-50 text-violet-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-elevated p-4">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", color)}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-xl font-bold text-[var(--foreground)] tracking-tight leading-tight">{value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card-elevated overflow-hidden">
        <div className="flex border-b border-[var(--border)] px-1 pt-1">
          {([
            ["trips", `Trip History (${stats.totalTrips})`, Route],
            ["info",  "Personal Info",                       FileText],
          ] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium relative transition-colors",
                tab === key ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}>
              <Icon className="w-4 h-4" />{label}
              {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-t-full" />}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === "trips" && (
            <div className="space-y-1">
              {driver.trips.length === 0 ? (
                <div className="py-10 text-center">
                  <Route className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-30 mb-3" />
                  <p className="text-sm text-[var(--muted-foreground)]">No trips assigned yet.</p>
                </div>
              ) : driver.trips.map((t) => <TripRow key={t.id} trip={t} />)}
            </div>
          )}
          {tab === "info" && (
            <div className="grid sm:grid-cols-2 gap-5 max-w-lg">
              {[
                { icon: Phone,    label: "Phone",           value: `+91 ${driver.phone}` },
                { icon: CreditCard, label: "License",       value: driver.licenseNumber },
                { icon: Calendar,  label: "License Expiry", value: formatDate(driver.licenseExpiry) },
                { icon: Calendar,  label: "Joining Date",   value: driver.joiningDate ? formatDate(driver.joiningDate) : "Not set" },
                { icon: DollarSign, label: "Monthly Salary", value: formatCurrency(Number(driver.salary)) },
                { icon: CheckCircle2, label: "Status",      value: DRIVER_STATUS_LABELS[driver.status as keyof typeof DRIVER_STATUS_LABELS] ?? driver.status },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-[var(--foreground)] mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
              {driver.notes && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-[var(--foreground)]">{driver.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DriverForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => router.refresh()}
        driver={{
          ...driver,
          salary: Number(driver.salary),
          status: driver.status.toString(),
        }}
      />
    </>
  );
}
