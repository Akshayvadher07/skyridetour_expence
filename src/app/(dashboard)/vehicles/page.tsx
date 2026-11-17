"use client";

// =============================================================================
// SkyRideTour — Vehicle List Page
// Grid + List view toggle, document expiry alerts, search, CRUD
// =============================================================================

import { useState, useEffect, useCallback, useTransition } from "react";
import Link            from "next/link";
import { toast }       from "sonner";
import {
  Truck, Plus, Search, LayoutGrid, List, AlertTriangle,
  ShieldAlert, Car, CheckCircle2, X, Pencil, Trash2,
  ToggleLeft, ToggleRight, Loader2, ChevronRight,
} from "lucide-react";

import {
  getVehicles, deleteVehicle, toggleVehicleStatus,
  type VehicleListItem,
} from "@/server/actions/vehicle";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { Badge }       from "@/components/ui/badge";
import {
  cn, formatCurrency, formatDate,
} from "@/lib/utils";
import {
  getDocStatus, getDaysUntilExpiry,
  VEHICLE_TYPE_LABELS, FUEL_TYPE_LABELS,
  type DocStatus,
} from "@/lib/validators/vehicle";
import type { VehicleType, FuelType } from "@prisma/client";

// =============================================================================
// DOC EXPIRY BADGE
// =============================================================================

const DOC_STATUS_CONFIG: Record<DocStatus, { label: string; cls: string; icon: React.ElementType }> = {
  valid:    { label: "Valid",         cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  expiring: { label: "Expiring Soon", cls: "bg-amber-50  text-amber-700  border-amber-200",    icon: AlertTriangle },
  expired:  { label: "Expired",       cls: "bg-red-50    text-red-700    border-red-200",       icon: ShieldAlert },
  missing:  { label: "Not Set",       cls: "bg-slate-50  text-slate-500  border-slate-200",     icon: X },
};

function DocBadge({ label, expiry }: { label: string; expiry: Date | null }) {
  const status = getDocStatus(expiry);
  const days   = getDaysUntilExpiry(expiry);
  const { cls, icon: Icon } = DOC_STATUS_CONFIG[status];

  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border", cls)}>
      <Icon className="w-2.5 h-2.5 flex-shrink-0" />
      {label}
      {days !== null && days >= 0 && days < 30 && ` · ${days}d`}
      {days !== null && days < 0 && " · EXPIRED"}
    </span>
  );
}

// =============================================================================
// FUEL BADGE
// =============================================================================

const FUEL_COLORS: Record<string, string> = {
  CNG:      "bg-green-50   text-green-700  border-green-200",
  PETROL:   "bg-blue-50    text-blue-700   border-blue-200",
  DIESEL:   "bg-orange-50  text-orange-700 border-orange-200",
  ELECTRIC: "bg-violet-50  text-violet-700 border-violet-200",
  HYBRID:   "bg-teal-50    text-teal-700   border-teal-200",
};

function FuelBadge({ fuel }: { fuel: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
      FUEL_COLORS[fuel] ?? "bg-slate-50 text-slate-600 border-slate-200"
    )}>
      {FUEL_TYPE_LABELS[fuel as FuelType] ?? fuel}
    </span>
  );
}

// =============================================================================
// VEHICLE CARD (Grid View)
// =============================================================================

function VehicleCard({
  vehicle,
  onEdit,
  onToggle,
  onDelete,
}: {
  vehicle:  VehicleListItem;
  onEdit:   () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const insuranceStatus = getDocStatus(vehicle.insuranceExpiry);
  const pucStatus       = getDocStatus(vehicle.pucExpiry);
  const hasAlert        = ["expiring", "expired"].includes(insuranceStatus)
                       || ["expiring", "expired"].includes(pucStatus);

  return (
    <div className={cn(
      "card-elevated group flex flex-col overflow-hidden transition-shadow hover:shadow-lg",
      !vehicle.isActive && "opacity-60"
    )}>
      {/* Top accent + alert banner */}
      {hasAlert && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <p className="text-[11px] text-amber-700 font-medium">
            Document expiry alert
          </p>
        </div>
      )}

      <div className="p-4 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Vehicle icon + name */}
          <Link href={`/vehicles/${vehicle.id}`} className="flex items-center gap-3 group/link flex-1 min-w-0">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              vehicle.isActive ? "bg-blue-50" : "bg-slate-100"
            )}>
              <Car className={cn("w-5 h-5", vehicle.isActive ? "text-blue-600" : "text-slate-400")} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[var(--foreground)] truncate
                group-hover/link:text-[var(--primary)] transition-colors">
                {vehicle.name}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] font-mono">
                {vehicle.registrationNumber}
              </p>
            </div>
          </Link>

          {/* Status badge */}
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
            vehicle.isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          )}>
            {vehicle.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <FuelBadge fuel={vehicle.fuelType} />
          <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded">
            {VEHICLE_TYPE_LABELS[vehicle.vehicleType as VehicleType] ?? vehicle.vehicleType}
          </span>
          {vehicle.year && (
            <span className="text-[10px] text-[var(--muted-foreground)]">{vehicle.year}</span>
          )}
          <span className="text-[10px] text-[var(--muted-foreground)]">
            {vehicle.seatingCapacity} seats
          </span>
        </div>

        {/* Doc expiry badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <DocBadge label="Ins." expiry={vehicle.insuranceExpiry} />
          <DocBadge label="PUC"  expiry={vehicle.pucExpiry} />
        </div>

        {/* Revenue stat */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <div>
            <p className="text-[10px] text-[var(--muted-foreground)]">Revenue</p>
            <p className="text-sm font-bold text-[var(--foreground)]">
              {formatCurrency(vehicle.totalRevenue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[var(--muted-foreground)]">Trips</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{vehicle._count.trips}</p>
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center border-t border-[var(--border)] divide-x divide-[var(--border)]">
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-[var(--muted-foreground)]
            hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onToggle}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-[var(--muted-foreground)]
            hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
          {vehicle.isActive
            ? <><ToggleRight className="w-3.5 h-3.5 text-emerald-500" /> Deactivate</>
            : <><ToggleLeft  className="w-3.5 h-3.5" /> Activate</>}
        </button>
        <Link href={`/vehicles/${vehicle.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-[var(--muted-foreground)]
            hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
          View <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// VEHICLE LIST ROW (List View)
// =============================================================================

function VehicleRow({
  vehicle, onEdit, onToggle, onDelete,
}: {
  vehicle: VehicleListItem;
  onEdit:   () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className={cn(
      "border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors group",
      !vehicle.isActive && "opacity-60"
    )}>
      <td className="px-4 py-3">
        <Link href={`/vehicles/${vehicle.id}`} className="flex items-center gap-3 group/link">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)] group-hover/link:text-[var(--primary)] transition-colors">
              {vehicle.name}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] font-mono">
              {vehicle.registrationNumber}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3"><FuelBadge fuel={vehicle.fuelType} /></td>
      <td className="px-4 py-3 hidden md:table-cell text-sm text-[var(--muted-foreground)]">
        {VEHICLE_TYPE_LABELS[vehicle.vehicleType as VehicleType] ?? vehicle.vehicleType}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          <DocBadge label="Ins." expiry={vehicle.insuranceExpiry} />
          <DocBadge label="PUC"  expiry={vehicle.pucExpiry} />
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell text-sm font-semibold text-[var(--foreground)]">
        {formatCurrency(vehicle.totalRevenue)}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell text-center">
        <Badge variant={vehicle._count.trips > 0 ? "default" : "secondary"}>
          {vehicle._count.trips}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
          vehicle.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        )}>
          {vehicle.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
            aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
            aria-label={vehicle.isActive ? "Deactivate" : "Activate"}>
            {vehicle.isActive
              ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
              : <ToggleLeft  className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400"
            aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function VehiclesPage() {
  const [vehicles,    setVehicles]    = useState<VehicleListItem[]>([]);
  const [query,       setQuery]       = useState("");
  const [debouncedQ,  setDebouncedQ]  = useState("");
  const [viewMode,    setViewMode]    = useState<"grid" | "list">("grid");
  const [loading,     setLoading]     = useState(true);
  const [formOpen,    setFormOpen]    = useState(false);
  const [editing,     setEditing]     = useState<VehicleListItem | null>(null);
  const [, startTx]                  = useTransition();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getVehicles(debouncedQ);
    if (result.success) setVehicles(result.data);
    else toast.error("Failed to load vehicles", { description: result.error });
    setLoading(false);
  }, [debouncedQ]);

  useEffect(() => { startTx(() => { void fetchData(); }); }, [fetchData]);

  const handleToggle = async (v: VehicleListItem) => {
    const result = await toggleVehicleStatus(v.id, !v.isActive);
    if (!result.success) toast.error("Failed to update status", { description: result.error });
    else toast.success(`${v.name} ${!v.isActive ? "activated" : "deactivated"}`);
    void fetchData();
  };

  const handleDelete = async (v: VehicleListItem) => {
    if (!window.confirm(`Delete ${v.name}? This cannot be undone.`)) return;
    const result = await deleteVehicle(v.id);
    if (!result.success) toast.error("Cannot delete", { description: result.error });
    else { toast.success(`${v.name} removed`); void fetchData(); }
  };

  // ── Summary stats ──────────────────────────────────────────────────────────
  const active      = vehicles.filter((v) => v.isActive).length;
  const alerts      = vehicles.filter((v) => {
    const ins = getDocStatus(v.insuranceExpiry);
    const puc = getDocStatus(v.pucExpiry);
    return ins === "expiring" || ins === "expired" || puc === "expiring" || puc === "expired";
  }).length;
  const totalRev    = vehicles.reduce((s, v) => s + v.totalRevenue, 0);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Fleet</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} · {active} active
            {alerts > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                · ⚠ {alerts} doc alert{alerts > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <button
          id="add-vehicle-btn"
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]
            hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]
            text-sm font-semibold transition-all active:scale-[0.97]
            hover:shadow-[0_0_16px_rgba(245,158,11,0.35)]"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Vehicles", value: String(vehicles.length), icon: Truck,        color: "bg-blue-50 text-blue-600" },
          { label: "Active",         value: String(active),          icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Doc Alerts",     value: String(alerts),          icon: AlertTriangle,color: alerts > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400" },
          { label: "Fleet Revenue",  value: formatCurrency(totalRev),icon: Car,          color: "bg-violet-50 text-violet-600" },
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

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            id="vehicle-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, reg, model…"
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-[var(--border)]
              bg-[var(--card)] text-sm text-[var(--foreground)]
              placeholder:text-[var(--muted-foreground)] outline-none
              focus:ring-2 focus:ring-[var(--primary)] transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[var(--muted)] rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode("grid")}
            id="grid-view-btn"
            className={cn("p-1.5 rounded-lg transition-colors",
              viewMode === "grid"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            id="list-view-btn"
            className={cn("p-1.5 rounded-lg transition-colors",
              viewMode === "list"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card-elevated py-16 text-center">
          <Truck className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3 opacity-30" />
          <p className="text-[var(--muted-foreground)] font-medium">
            {debouncedQ ? `No vehicles match "${debouncedQ}"` : "No vehicles in fleet yet"}
          </p>
          {!debouncedQ && (
            <button onClick={() => setFormOpen(true)}
              className="text-[var(--primary)] text-sm font-medium hover:underline mt-2 inline-block">
              Add your first vehicle →
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onEdit={() => { setEditing(v); setFormOpen(true); }}
              onToggle={() => handleToggle(v)}
              onDelete={() => handleDelete(v)}
            />
          ))}
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
                  {["Vehicle", "Fuel", "Type", "Documents", "Revenue", "Trips", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)]
                      text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <VehicleRow
                    key={v.id}
                    vehicle={v}
                    onEdit={() => { setEditing(v); setFormOpen(true); }}
                    onToggle={() => handleToggle(v)}
                    onDelete={() => handleDelete(v)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form modal */}
      <VehicleForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSuccess={fetchData}
        vehicle={editing}
      />
    </div>
  );
}
