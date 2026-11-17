"use client";

// =============================================================================
// SkyRideTour — General Expense Ledger Page (Step 10)
// Standalone overhead expenses: maintenance, salaries, insurance, etc.
// =============================================================================

import { useState, useEffect, useCallback, useTransition } from "react";
import { toast }        from "sonner";
import {
  Receipt, Plus, Search, X, Filter, Loader2,
  Pencil, Trash2, Car, ChevronDown,
} from "lucide-react";

import {
  getExpenses, deleteExpense, type ExpenseWithRefs,
} from "@/server/actions/expense";
import { ExpenseForm }  from "@/components/expenses/ExpenseForm";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { OVERHEAD_CATEGORY_LABELS, OVERHEAD_CATEGORIES } from "@/lib/validators/expense";

// ─── Category Colour Map ──────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  MAINTENANCE:   "bg-blue-50 text-blue-700",
  REPAIR:        "bg-red-50 text-red-700",
  INSURANCE:     "bg-violet-50 text-violet-700",
  DRIVER_SALARY: "bg-emerald-50 text-emerald-700",
  CLEANING:      "bg-teal-50 text-teal-700",
  SERVICE:       "bg-indigo-50 text-indigo-700",
  CNG:           "bg-green-50 text-green-700",
  PETROL:        "bg-orange-50 text-orange-700",
  DIESEL:        "bg-amber-50 text-amber-700",
  TOLL:          "bg-slate-50 text-slate-700",
  PARKING:       "bg-zinc-50 text-zinc-700",
  FOOD:          "bg-rose-50 text-rose-700",
  ACCOMMODATION: "bg-purple-50 text-purple-700",
  OTHER:         "bg-gray-50 text-gray-700",
};

function CatBadge({ cat }: { cat: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
      CAT_COLORS[cat] ?? "bg-slate-50 text-slate-700")}>
      {OVERHEAD_CATEGORY_LABELS[cat as keyof typeof OVERHEAD_CATEGORY_LABELS] ?? cat}
    </span>
  );
}

// ─── Expense Row ──────────────────────────────────────────────────────────────

function ExpenseRow({
  expense, onEdit, onDelete,
}: {
  expense: ExpenseWithRefs;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors group">
      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{formatDate(expense.date)}</td>
      <td className="px-4 py-3"><CatBadge cat={expense.category} /></td>
      <td className="px-4 py-3 hidden md:table-cell">
        <p className="text-sm text-[var(--foreground)] truncate max-w-[200px]">
          {expense.description || "—"}
        </p>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {expense.vehicle ? (
          <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Car className="w-3 h-3" />
            {expense.vehicle.name}
          </span>
        ) : expense.trip ? (
          <span className="text-xs text-[var(--muted-foreground)] font-mono">
            {expense.trip.tripNumber}
          </span>
        ) : (
          <span className="text-xs text-[var(--muted-foreground)]">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold text-red-600">
          -{formatCurrency(Number(expense.amount))}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
            aria-label="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
            aria-label="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [expenses,   setExpenses]   = useState<ExpenseWithRefs[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalAmt,   setTotalAmt]   = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [formOpen,   setFormOpen]   = useState(false);
  const [editing,    setEditing]    = useState<ExpenseWithRefs | null>(null);
  const [catFilter,  setCatFilter]  = useState("");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [, startTx]                 = useTransition();

  const LIMIT = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getExpenses({
      category: catFilter || undefined,
      dateFrom:  dateFrom || undefined,
      dateTo:    dateTo   || undefined,
      page,
      limit: LIMIT,
    });
    if (result.success) {
      setExpenses(result.data.expenses);
      setTotal(result.data.total);
      setTotalAmt(result.data.totalAmount);
    } else {
      toast.error("Failed to load expenses", { description: result.error });
    }
    setLoading(false);
  }, [catFilter, dateFrom, dateTo, page]);

  useEffect(() => { startTx(() => { void fetchData(); }); }, [fetchData]);
  useEffect(() => { setPage(1); }, [catFilter, dateFrom, dateTo]);

  const handleDelete = async (expense: ExpenseWithRefs) => {
    if (!window.confirm("Delete this expense record?")) return;
    const result = await deleteExpense(expense.id);
    if (!result.success) toast.error("Cannot delete", { description: result.error });
    else { toast.success("Expense deleted"); void fetchData(); }
  };

  // Category breakdown for current view
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  const topCategories = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Expense Ledger</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {total} record{total !== 1 ? "s" : ""} · Total: {formatCurrency(totalAmt)}
          </p>
        </div>
        <button
          id="add-expense-btn"
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]
            hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]
            text-sm font-semibold transition-all active:scale-[0.97]">
          <Plus className="w-4 h-4" /> Log Expense
        </button>
      </div>

      {/* Category breakdown pills */}
      {topCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topCategories.map(([cat, amt]) => (
            <button
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? "" : cat)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                catFilter === cat
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}>
              <span>{OVERHEAD_CATEGORY_LABELS[cat as keyof typeof OVERHEAD_CATEGORY_LABELS] ?? cat}</span>
              <span className="opacity-70">{formatCurrency(amt)}</span>
            </button>
          ))}
          {catFilter && (
            <button onClick={() => setCatFilter("")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border
                border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Category select */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="pl-8 pr-8 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]
              text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]
              appearance-none">
            <option value="">All Categories</option>
            {OVERHEAD_CATEGORIES.map((c) => (
              <option key={c} value={c}>{OVERHEAD_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]
              text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          <span className="text-[var(--muted-foreground)] text-sm">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)]
              text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        </div>

        {(dateFrom || dateTo || catFilter) && (
          <button onClick={() => { setCatFilter(""); setDateFrom(""); setDateTo(""); }}
            className="flex items-center gap-1 text-sm text-red-500 hover:underline">
            <X className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
                {["Date", "Category", "Description", "Linked To", "Amount", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)] mx-auto" />
                </td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Receipt className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-30 mb-3" />
                  <p className="text-sm text-[var(--muted-foreground)]">No expense records found</p>
                  <button onClick={() => setFormOpen(true)}
                    className="text-[var(--primary)] text-sm font-medium hover:underline mt-2 inline-block">
                    Log first expense →
                  </button>
                </td></tr>
              ) : (
                expenses.map((e) => (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    onEdit={() => { setEditing(e); setFormOpen(true); }}
                    onDelete={() => handleDelete(e)}
                  />
                ))
              )}
            </tbody>
            {expenses.length > 0 && (
              <tfoot>
                <tr className="border-t border-[var(--border)] bg-[var(--muted)]/40">
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    {catFilter ? `${OVERHEAD_CATEGORY_LABELS[catFilter as keyof typeof OVERHEAD_CATEGORY_LABELS]} Total` : "Total (this view)"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-red-600">
                    -{formatCurrency(totalAmt)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted-foreground)]">Page {page} of {totalPages}</p>
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

      <ExpenseForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSuccess={fetchData}
        expense={editing}
      />
    </div>
  );
}
