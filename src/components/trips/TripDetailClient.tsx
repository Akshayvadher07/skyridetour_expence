"use client";

// =============================================================================
// SkyRideTour — Trip Detail Client
// Inline Customer Details (Name, Phone, Email, Address)
// =============================================================================

import { useState, useCallback, useEffect } from "react";
import Link             from "next/link";
import { useRouter }    from "next/navigation";
import { toast }        from "sonner";
import {
  Car, User, Phone, MapPin, Calendar, CreditCard,
  DollarSign, TrendingUp, TrendingDown, Percent,
  Pencil, Loader2, Plus, Trash2, FileText, Route,
  Ticket, Fuel, Mail, CheckCircle,
} from "lucide-react";

import { deleteTrip, type TripDetail }  from "@/server/actions/trip";
import {
  getPaymentsForTrip, recordPayment, deletePayment,
  type PaymentRecord,
} from "@/server/actions/payment";
import { TripForm }    from "@/components/trips/TripForm";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  TRIP_TYPE_LABELS, PAYMENT_METHOD_LABELS, TOLL_TYPE_LABELS,
  PAYMENT_STATUS_LABELS, PAYMENT_METHODS,
} from "@/lib/validators/trip";
import type { PaymentStatus } from "@prisma/client";

// ─── Payment Status Badge ─────────────────────────────────────────────────────

const PMT_CONFIG: Record<PaymentStatus, { cls: string }> = {
  PAID:    { cls: "bg-emerald-100 text-emerald-700" },
  PARTIAL: { cls: "bg-amber-100   text-amber-700"   },
  PENDING: { cls: "bg-red-100     text-red-700"     },
};

// ─── Summary Stat ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color, large }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; large?: boolean;
}) {
  return (
    <div className="card-elevated p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className={cn("font-bold text-[var(--foreground)] tracking-tight leading-tight", large ? "text-2xl" : "text-xl")}>{value}</p>
      <p className="text-xs text-[var(--muted-foreground)] mt-1">{label}</p>
      {sub && <p className="text-[10px] text-[var(--muted-foreground)] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Expense Table Row ────────────────────────────────────────────────────────

function ExpenseLineRow({ label, amount, highlight }: { label: string; amount: number; highlight?: boolean }) {
  if (amount === 0) return null;
  return (
    <tr className={cn("border-b border-[var(--border)]", highlight && "font-semibold")}>
      <td className="px-4 py-2.5 text-sm text-[var(--foreground)]">{label}</td>
      <td className="px-4 py-2.5 text-right text-sm text-red-600 font-medium">
        -{formatCurrency(amount)}
      </td>
    </tr>
  );
}

// ─── Record Payment Form ──────────────────────────────────────────────────────

function RecordPaymentForm({ tripId, onSuccess }: { tripId: string; onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "UPI" | "BANK_TRANSFER" | "OTHER">("CASH");
  const [notes,  setNotes]  = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("Enter a valid payment amount"); return; }
    setSaving(true);
    const result = await recordPayment({ tripId, amount: num, paymentMethod: method, notes });
    setSaving(false);
    if (!result.success) { toast.error("Payment failed", { description: result.error }); return; }
    toast.success(`₹${num.toLocaleString("en-IN")} recorded`);
    setAmount(""); setNotes("");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[var(--border)]">
      <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (₹)" required
        className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] text-sm bg-[var(--background)]
          outline-none focus:ring-2 focus:ring-[var(--primary)]" />
      <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}
        className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm bg-[var(--background)]
          outline-none focus:ring-2 focus:ring-[var(--primary)]">
        {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
      </select>
      <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="hidden sm:block flex-1 px-3 py-2 rounded-xl border border-[var(--border)] text-sm bg-[var(--background)]
          outline-none focus:ring-2 focus:ring-[var(--primary)]" />
      <button type="submit" disabled={saving}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600
          hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Record
      </button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TripDetailClient({ trip }: { trip: TripDetail }) {
  const router = useRouter();
  const [editOpen, setEditOpen]   = useState(false);
  const [payments, setPayments]   = useState<PaymentRecord[]>([]);
  const [totalPaid,  setTotalPaid]  = useState(0);
  const [balance,    setBalance]    = useState(0);
  const [tab,      setTab]        = useState<"expenses" | "payments" | "info">("expenses");

  const loadPayments = useCallback(async () => {
    const result = await getPaymentsForTrip(trip.id);
    if (result.success) {
      setPayments(result.data.payments);
      setTotalPaid(result.data.totalPaid);
      setBalance(result.data.balance);
    }
  }, [trip.id]);

  useEffect(() => { void loadPayments(); }, [loadPayments]);

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm("Remove this payment record?")) return;
    const result = await deletePayment(paymentId, trip.id);
    if (!result.success) toast.error("Failed", { description: result.error });
    else { toast.success("Payment removed"); void loadPayments(); router.refresh(); }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm(`Permanently delete ${trip.tripNumber}? All payments and invoices will be removed.`)) return;
    const result = await deleteTrip(trip.id);
    if (!result.success) toast.error("Cannot delete", { description: result.error });
    else { toast.success(`${trip.tripNumber} deleted`); router.push("/trips"); }
  };

  const profit = Number(trip.netProfit);
  const margin = Number(trip.profitMargin);
  const pmt    = PMT_CONFIG[trip.paymentStatus];

  return (
    <>
      {/* ── Header card ── */}
      <div className="card-elevated p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--foreground)] font-mono">{trip.tripNumber}</h1>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", pmt.cls)}>
                {PAYMENT_STATUS_LABELS[trip.paymentStatus]}
              </span>
              <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                {TRIP_TYPE_LABELS[trip.tripType]}
              </span>
            </div>
            <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mt-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {trip.pickupLocation}
              <span className="text-[var(--border)]">→</span>
              {trip.dropLocation}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mt-1">
              <Calendar className="w-3.5 h-3.5" /> {formatDate(trip.date)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/invoices/${trip.id}`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-semibold transition-colors">
              <FileText className="w-3.5 h-3.5" /> Invoice
            </Link>
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border)]
                text-sm font-medium hover:bg-[var(--muted)] transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleDeleteTrip}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-red-200
                text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Trip Revenue"   value={formatCurrency(Number(trip.tripAmount))}   icon={DollarSign}  color="bg-blue-50 text-blue-600" />
        <StatCard label="Total Expenses" value={formatCurrency(Number(trip.totalExpense))} icon={TrendingDown} color="bg-red-50 text-red-600" />
        <StatCard label="Net Profit"     value={formatCurrency(profit)}
          icon={TrendingUp} color={profit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"} />
        <StatCard label="Profit Margin"  value={`${margin.toFixed(2)}%`} icon={Percent}
          color={margin >= 50 ? "bg-violet-50 text-violet-600" : margin >= 20 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"} />
      </div>

      {/* ── Customer + Vehicle + Driver Cards ── */}
      <div className="grid sm:grid-cols-3 gap-3">
        {/* Inline Customer Details */}
        <div className="card-elevated p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <User className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide font-semibold">Customer</p>
            <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5 truncate">{trip.customerName}</p>
            <a href={`tel:+91${trip.customerPhone}`}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] mt-0.5">
              <Phone className="w-3 h-3" /> +91 {trip.customerPhone}
            </a>
            {trip.customerEmail && (
              <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5 truncate">
                <Mail className="w-3 h-3" /> {trip.customerEmail}
              </p>
            )}
          </div>
        </div>

        {/* Vehicle */}
        <div className="card-elevated p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Car className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide font-semibold">Vehicle</p>
            {trip.vehicle ? (
              <>
                <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{trip.vehicle.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{trip.vehicle.registrationNumber}</p>
              </>
            ) : <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Unassigned</p>}
          </div>
        </div>

        {/* Driver */}
        <div className="card-elevated p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <User className="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide font-semibold">Driver</p>
            {trip.driver ? (
              <>
                <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">{trip.driver.name}</p>
                <a href={`tel:+91${trip.driver.phone}`}
                  className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] mt-0.5">
                  <Phone className="w-3 h-3" /> +91 {trip.driver.phone}
                </a>
              </>
            ) : <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Unassigned</p>}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="card-elevated overflow-hidden">
        <div className="flex border-b border-[var(--border)] px-1 pt-1 overflow-x-auto">
          {([
            ["expenses", "Expense Breakdown", Fuel],
            ["payments", `Payments (${payments.length})`, CreditCard],
            ["info",     "Trip Info",          FileText],
          ] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium relative transition-colors whitespace-nowrap",
                tab === key ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}>
              <Icon className="w-4 h-4" />{label}
              {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-t-full" />}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === "expenses" && (
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Expense Item</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <ExpenseLineRow label="CNG"           amount={Number(trip.cngExpense)} />
                  <ExpenseLineRow label="Petrol"         amount={Number(trip.petrolExpense)} />
                  <ExpenseLineRow label="Diesel"         amount={Number(trip.dieselExpense)} />
                  <tr className="border-b border-[var(--border)]">
                    <td className="px-4 py-2.5 text-sm text-[var(--foreground)]">
                      Toll ({TOLL_TYPE_LABELS[trip.tollType]})
                      {(trip.tollType === "ANNUAL_PASS" || trip.tollType === "FREE") && (
                        <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">₹0 trip cost</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-medium text-[var(--muted-foreground)]">
                      {Number(trip.tollExpense) > 0 ? `-${formatCurrency(Number(trip.tollExpense))}` : "—"}
                    </td>
                  </tr>
                  <ExpenseLineRow label="Parking"        amount={Number(trip.parkingExpense)} />
                  <ExpenseLineRow label="Driver Allowance" amount={Number(trip.driverExpense)} />
                  <ExpenseLineRow label="Food"            amount={Number(trip.foodExpense)} />
                  <ExpenseLineRow label="Accommodation"   amount={Number(trip.accommodationExpense)} />
                  {Number(trip.otherExpense) > 0 && (
                    <ExpenseLineRow label={`Other${trip.otherExpenseNotes ? ` (${trip.otherExpenseNotes})` : ""}`}
                      amount={Number(trip.otherExpense)} />
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--muted)]/30">
                    <td className="px-4 py-3 text-sm font-bold text-[var(--foreground)]">Total Expenses</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-red-600">
                      -{formatCurrency(Number(trip.totalExpense))}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-bold text-[var(--foreground)]">Net Profit</td>
                    <td className={cn("px-4 py-2 text-right text-sm font-bold", profit >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {formatCurrency(profit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {tab === "payments" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--muted)]/40 rounded-xl p-3 text-center">
                  <p className="text-xs text-[var(--muted-foreground)]">Trip Amount</p>
                  <p className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(Number(trip.tripAmount))}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-700">Paid</p>
                  <p className="text-sm font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
                </div>
                <div className={cn("rounded-xl p-3 text-center", balance > 0 ? "bg-red-50" : "bg-emerald-50")}>
                  <p className={cn("text-xs", balance > 0 ? "text-red-700" : "text-emerald-700")}>Balance</p>
                  <p className={cn("text-sm font-bold", balance > 0 ? "text-red-700" : "text-emerald-700")}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>

              {payments.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-6">No payments recorded yet.</p>
              ) : (
                <div className="space-y-1">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--muted)]/40 group transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(Number(p.amount))}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {PAYMENT_METHOD_LABELS[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? p.paymentMethod} · {formatDate(p.paymentDate)}
                          {p.notes && ` · ${p.notes}`}
                        </p>
                      </div>
                      <button onClick={() => handleDeletePayment(p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {balance > 0 && (
                <RecordPaymentForm tripId={trip.id} onSuccess={() => { void loadPayments(); router.refresh(); }} />
              )}
            </div>
          )}

          {tab === "info" && (
            <div className="grid sm:grid-cols-2 gap-5 max-w-lg">
              {[
                { icon: Route,      label: "Trip Number",    value: trip.tripNumber },
                { icon: User,       label: "Customer Name",  value: trip.customerName },
                { icon: Phone,      label: "Customer Phone", value: `+91 ${trip.customerPhone}` },
                { icon: Calendar,   label: "Date",           value: formatDate(trip.date) },
                { icon: MapPin,     label: "Pickup",         value: trip.pickupLocation },
                { icon: MapPin,     label: "Drop",           value: trip.dropLocation },
                { icon: Ticket,     label: "Toll Type",      value: TOLL_TYPE_LABELS[trip.tollType] },
                { icon: CreditCard, label: "Payment Mode",   value: PAYMENT_METHOD_LABELS[trip.paymentMethod] },
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
              {trip.customerAddress && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wide mb-1">Customer Address</p>
                  <p className="text-sm text-[var(--foreground)]">{trip.customerAddress}</p>
                </div>
              )}
              {trip.notes && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wide mb-1">Trip Notes</p>
                  <p className="text-sm text-[var(--foreground)]">{trip.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TripForm open={editOpen} onClose={() => setEditOpen(false)} onSuccess={() => router.refresh()} trip={trip} />
    </>
  );
}
