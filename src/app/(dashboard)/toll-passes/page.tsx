"use client";

// =============================================================================
// SkyRideTour — Toll Pass Management Page
// =============================================================================

import { useState, useEffect, useCallback, useTransition } from "react";
import { toast }          from "sonner";
import {
  Ticket, Plus, Loader2, AlertTriangle, CheckCircle2,
  ShieldAlert, Car, Calendar, Hash, Pencil, Trash2, X,
} from "lucide-react";

import {
  getTollPasses, deleteTollPass, type TollPassWithVehicle,
} from "@/server/actions/toll-pass";
import { TollPassForm } from "@/components/toll-passes/TollPassForm";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  getPassStatus, getDaysUntilPassExpiry, type PassStatus,
} from "@/lib/validators/toll-pass";

// ─── Status Config ────────────────────────────────────────────────────────────

const PASS_STATUS_CONFIG: Record<PassStatus, { label: string; cls: string; icon: React.ElementType }> = {
  active:    { label: "Active",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  expiring:  { label: "Expiring",     cls: "bg-amber-50  text-amber-700  border-amber-200",    icon: AlertTriangle },
  expired:   { label: "Expired",      cls: "bg-red-50    text-red-700    border-red-200",       icon: ShieldAlert },
  exhausted: { label: "Fully Used",   cls: "bg-slate-50  text-slate-600  border-slate-200",     icon: X },
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function UsageBar({
  used, total, label,
}: { used: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mb-1">
        <span>{label}</span>
        <span>{used}/{total} used</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all",
            pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Pass Card ────────────────────────────────────────────────────────────────

function PassCard({
  pass, onEdit, onDelete,
}: {
  pass: TollPassWithVehicle;
  onEdit:   () => void;
  onDelete: () => void;
}) {
  const status = getPassStatus(
    pass.expiryDate, pass.tollsIncluded, pass.tollsUsed, pass.isActive
  );
  const days = getDaysUntilPassExpiry(pass.expiryDate);
  const { label, cls, icon: Icon } = PASS_STATUS_CONFIG[status];

  const validityPct = (() => {
    const total = new Date(pass.expiryDate).getTime() - new Date(pass.startDate).getTime();
    const elapsed = Date.now() - new Date(pass.startDate).getTime();
    return total > 0 ? Math.max(0, Math.min(100, (elapsed / total) * 100)) : 100;
  })();

  return (
    <div className={cn(
      "card-elevated overflow-hidden flex flex-col",
      (status === "expired" || status === "exhausted") && "opacity-70"
    )}>
      {/* Status alert banner */}
      {(status === "expiring" || status === "expired") && (
        <div className={cn(
          "px-3 py-2 flex items-center gap-2 text-[11px] font-medium border-b",
          status === "expired" ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
        )}>
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
          {status === "expired" ? "This pass has expired" : `Expiring in ${days} day${days !== 1 ? "s" : ""}`}
        </div>
      )}

      <div className="p-4 flex-1 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Ticket className="w-5 h-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{pass.passName}</p>
              <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                <Car className="w-3 h-3" />
                {pass.vehicle.name}
                <span className="font-mono">({pass.vehicle.registrationNumber})</span>
              </p>
            </div>
          </div>
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0", cls)}>
            {label}
          </span>
        </div>

        {/* Cost */}
        <div className="flex items-center gap-4 text-sm">
          <div>
            <p className="text-[10px] text-[var(--muted-foreground)]">Cost</p>
            <p className="font-bold text-[var(--foreground)]">{formatCurrency(Number(pass.passCost))}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--muted-foreground)]">Tolls Logged</p>
            <p className="font-bold text-[var(--foreground)] flex items-center gap-1">
              <Hash className="w-3 h-3" />{pass.tollsUsed}
              {pass.tollsIncluded > 0 && <span className="text-[var(--muted-foreground)] font-normal">/ {pass.tollsIncluded}</span>}
            </p>
          </div>
        </div>

        {/* Usage progress */}
        {pass.tollsIncluded > 0 && (
          <UsageBar used={pass.tollsUsed} total={pass.tollsIncluded} label="Toll Usage" />
        )}

        {/* Validity progress */}
        <div>
          <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mb-1">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Validity</span>
            <span>{formatDate(pass.startDate)} → {formatDate(pass.expiryDate)}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all",
                validityPct >= 90 ? "bg-red-500" : validityPct >= 60 ? "bg-amber-500" : "bg-blue-500")}
              style={{ width: `${validityPct}%` }}
            />
          </div>
          {days >= 0 && (
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{days} days remaining</p>
          )}
        </div>

        {pass.notes && (
          <p className="text-xs text-[var(--muted-foreground)] italic">{pass.notes}</p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center border-t border-[var(--border)] divide-x divide-[var(--border)]">
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs
            text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs
            text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TollPassesPage() {
  const [passes,   setPasses]   = useState<TollPassWithVehicle[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState<TollPassWithVehicle | null>(null);
  const [, startTx]             = useTransition();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getTollPasses();
    if (result.success) setPasses(result.data);
    else toast.error("Failed to load toll passes", { description: result.error });
    setLoading(false);
  }, []);

  useEffect(() => { startTx(() => { void fetchData(); }); }, [fetchData]);

  const handleDelete = async (pass: TollPassWithVehicle) => {
    if (!window.confirm(`Delete "${pass.passName}"?`)) return;
    const result = await deleteTollPass(pass.id);
    if (!result.success) toast.error("Cannot delete", { description: result.error });
    else { toast.success(`${pass.passName} deleted`); void fetchData(); }
  };

  const active   = passes.filter((p) => getPassStatus(p.expiryDate, p.tollsIncluded, p.tollsUsed, p.isActive) === "active").length;
  const expiring = passes.filter((p) => getPassStatus(p.expiryDate, p.tollsIncluded, p.tollsUsed, p.isActive) === "expiring").length;
  const totalCost = passes.reduce((s, p) => s + Number(p.passCost), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Toll Passes</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {passes.length} pass{passes.length !== 1 ? "es" : ""} · {active} active
            {expiring > 0 && <span className="ml-2 text-amber-600 font-medium">· ⚠ {expiring} expiring</span>}
          </p>
        </div>
        <button
          id="add-pass-btn"
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]
            hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]
            text-sm font-semibold transition-all active:scale-[0.97]">
          <Plus className="w-4 h-4" /> Add Pass
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Passes", value: String(passes.length),       icon: Ticket,        color: "bg-violet-50 text-violet-600" },
          { label: "Active",       value: String(active),              icon: CheckCircle2,  color: "bg-emerald-50 text-emerald-600" },
          { label: "Expiring",     value: String(expiring),            icon: AlertTriangle, color: expiring > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400" },
          { label: "Total Invested",value: formatCurrency(totalCost),  icon: Ticket,        color: "bg-blue-50 text-blue-600" },
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

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : passes.length === 0 ? (
        <div className="card-elevated py-16 text-center">
          <Ticket className="w-12 h-12 mx-auto text-[var(--muted-foreground)] opacity-30 mb-3" />
          <p className="text-[var(--muted-foreground)] font-medium">No toll passes yet</p>
          <button onClick={() => setFormOpen(true)}
            className="text-[var(--primary)] text-sm font-medium hover:underline mt-2 inline-block">
            Add your first toll pass →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {passes.map((p) => (
            <PassCard
              key={p.id}
              pass={p}
              onEdit={() => { setEditing(p); setFormOpen(true); }}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

      <TollPassForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSuccess={fetchData}
        pass={editing}
      />
    </div>
  );
}
