"use client";

// =============================================================================
// SkyRideTour — Driver List Page
// =============================================================================

import { useState, useEffect, useCallback, useTransition } from "react";
import Link              from "next/link";
import { toast }         from "sonner";
import {
  Users, Plus, Search, X, ChevronRight,
  MoreHorizontal, Pencil, Trash2, Loader2,
  Phone, Car, DollarSign, ShieldAlert, AlertTriangle, CheckCircle2,
} from "lucide-react";

import {
  getDrivers, deleteDriver, updateDriverStatus,
  type DriverListItem,
} from "@/server/actions/driver";
import { DriverForm }  from "@/components/drivers/DriverForm";
import { Badge }       from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  getLicenseStatus, getDaysUntilLicenseExpiry,
  DRIVER_STATUS_LABELS,
  type LicenseStatus,
} from "@/lib/validators/driver";

// ─── License Badge ─────────────────────────────────────────────────────────────

const LIC_CONFIG: Record<LicenseStatus, { cls: string; icon: React.ElementType }> = {
  valid:    { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  expiring: { cls: "bg-amber-50  text-amber-700  border-amber-200",    icon: AlertTriangle },
  expired:  { cls: "bg-red-50    text-red-700    border-red-200",       icon: ShieldAlert },
};

function LicBadge({ expiry }: { expiry: Date }) {
  const status = getLicenseStatus(expiry);
  const days   = getDaysUntilLicenseExpiry(expiry);
  const { cls, icon: Icon } = LIC_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border", cls)}>
      <Icon className="w-2.5 h-2.5" />
      {formatDate(expiry)}
      {days !== null && days >= 0 && days < 30 && ` · ${days}d`}
      {days !== null && days < 0 && " · EXPIRED"}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  ON_LEAVE: "bg-amber-100 text-amber-700",
};

// ─── Driver Row ────────────────────────────────────────────────────────────────

function DriverRow({
  driver, onEdit, onDelete, onStatusChange,
}: {
  driver: DriverListItem;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: "ACTIVE" | "INACTIVE" | "ON_LEAVE") => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors group">
      <td className="px-4 py-3">
        <Link href={`/drivers/${driver.id}`} className="flex items-center gap-3 group/link">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600
            flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">{driver.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)] group-hover/link:text-[var(--primary)] transition-colors">
              {driver.name}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] font-mono">{driver.licenseNumber}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <a href={`tel:+91${driver.phone}`}
          className="flex items-center gap-1.5 text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
          <Phone className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          {driver.phone}
        </a>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <LicBadge expiry={driver.licenseExpiry} />
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
          STATUS_COLORS[driver.status] ?? "bg-slate-100 text-slate-500")}>
          {DRIVER_STATUS_LABELS[driver.status as keyof typeof DRIVER_STATUS_LABELS] ?? driver.status}
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-center">
        <Badge variant={driver._count.trips > 0 ? "default" : "secondary"}>
          {driver._count.trips}
        </Badge>
      </td>
      <td className="px-4 py-3 hidden xl:table-cell">
        <span className="text-sm font-semibold text-[var(--foreground)]">
          {formatCurrency(driver.totalAllowances)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <Link href={`/drivers/${driver.id}`}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors opacity-0 group-hover:opacity-100">
            <ChevronRight className="w-4 h-4" />
          </Link>
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 w-44 bg-[var(--card)] border border-[var(--border)]
                  rounded-xl shadow-lg py-1 overflow-hidden">
                  <button onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  {(["ACTIVE", "INACTIVE", "ON_LEAVE"] as const).map((s) => (
                    driver.status !== s && (
                      <button key={s} onClick={() => { onStatusChange(s); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]">
                        Set {DRIVER_STATUS_LABELS[s]}
                      </button>
                    )
                  ))}
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DriversPage() {
  const [drivers,   setDrivers]   = useState<DriverListItem[]>([]);
  const [query,     setQuery]     = useState("");
  const [debQ,      setDebQ]      = useState("");
  const [loading,   setLoading]   = useState(true);
  const [formOpen,  setFormOpen]  = useState(false);
  const [editing,   setEditing]   = useState<DriverListItem | null>(null);
  const [, startTx]              = useTransition();

  useEffect(() => {
    const t = setTimeout(() => setDebQ(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getDrivers(debQ);
    if (result.success) setDrivers(result.data);
    else toast.error("Failed to load drivers", { description: result.error });
    setLoading(false);
  }, [debQ]);

  useEffect(() => { startTx(() => { void fetchData(); }); }, [fetchData]);

  const handleDelete = async (driver: DriverListItem) => {
    if (!window.confirm(`Delete ${driver.name}?`)) return;
    const result = await deleteDriver(driver.id);
    if (!result.success) toast.error("Cannot delete", { description: result.error });
    else { toast.success(`${driver.name} removed`); void fetchData(); }
  };

  const handleStatusChange = async (driver: DriverListItem, status: "ACTIVE" | "INACTIVE" | "ON_LEAVE") => {
    const result = await updateDriverStatus(driver.id, status);
    if (!result.success) toast.error("Failed", { description: result.error });
    else { toast.success(`${driver.name} marked ${DRIVER_STATUS_LABELS[status]}`); void fetchData(); }
  };

  // Summary stats
  const active   = drivers.filter((d) => d.status === "ACTIVE").length;
  const alerts   = drivers.filter((d) => getLicenseStatus(d.licenseExpiry) !== "valid").length;
  const totalAllowances = drivers.reduce((s, d) => s + d.totalAllowances, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Drivers</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {drivers.length} driver{drivers.length !== 1 ? "s" : ""} · {active} active
            {alerts > 0 && <span className="ml-2 text-amber-600 font-medium">· ⚠ {alerts} license alert{alerts > 1 ? "s" : ""}</span>}
          </p>
        </div>
        <button
          id="add-driver-btn"
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]
            hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]
            text-sm font-semibold transition-all active:scale-[0.97]
            hover:shadow-[0_0_16px_rgba(245,158,11,0.35)]">
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Drivers", value: String(drivers.length),          icon: Users,       color: "bg-blue-50 text-blue-600" },
          { label: "Active",        value: String(active),                  icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "License Alerts",value: String(alerts),                  icon: AlertTriangle, color: alerts > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400" },
          { label: "Total Allowances", value: formatCurrency(totalAllowances), icon: DollarSign, color: "bg-violet-50 text-violet-600" },
        ].map(({ label, value, icon: Icon, color }) => (
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input id="driver-search" type="text" value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, license…"
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

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
                {["Driver", "Phone", "License Expiry", "Status", "Trips", "Allowances", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)] mx-auto" />
                </td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Users className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-30 mb-3" />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {debQ ? `No drivers match "${debQ}"` : "No drivers added yet"}
                  </p>
                  {!debQ && (
                    <button onClick={() => setFormOpen(true)}
                      className="text-[var(--primary)] text-sm font-medium hover:underline mt-2 inline-block">
                      Add your first driver →
                    </button>
                  )}
                </td></tr>
              ) : (
                drivers.map((d) => (
                  <DriverRow
                    key={d.id}
                    driver={d}
                    onEdit={() => { setEditing(d); setFormOpen(true); }}
                    onDelete={() => handleDelete(d)}
                    onStatusChange={(s) => handleStatusChange(d, s)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DriverForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSuccess={fetchData}
        driver={editing}
      />
    </div>
  );
}
