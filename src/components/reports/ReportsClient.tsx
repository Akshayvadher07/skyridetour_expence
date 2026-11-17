"use client";

// =============================================================================
// SkyRideTour — Reports & Analytics Client Component (Step 17)
// Date preset controls, summary KPI cards, vehicle/driver yield tables, CSV export
// =============================================================================

import { useState, useTransition } from "react";
import { Download, Calendar, Filter, Loader2, Car, User, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { getReportsData, type ReportsData } from "@/server/actions/reports";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function ReportsClient({ initialData }: { initialData: ReportsData }) {
  const [data, setData]       = useState<ReportsData>(initialData);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [preset, setPreset]   = useState<"thisMonth" | "lastMonth" | "thisYear" | "custom">("thisMonth");
  const [isPending, startTx]  = useTransition();

  const handleApplyFilter = (fromStr: string, toStr: string, presetName?: typeof preset) => {
    if (presetName) setPreset(presetName);
    startTx(async () => {
      const res = await getReportsData(fromStr, toStr);
      if (res.success) setData(res.data);
      else toast.error("Failed to load reports data");
    });
  };

  const handlePreset = (type: "thisMonth" | "lastMonth" | "thisYear") => {
    const now = new Date();
    let from = new Date();
    let to   = new Date();

    if (type === "thisMonth") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to   = new Date();
    } else if (type === "lastMonth") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to   = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (type === "thisYear") {
      from = new Date(now.getFullYear(), 0, 1);
      to   = new Date();
    }

    const fStr = toISODate(from);
    const tStr = toISODate(to);
    setDateFrom(fStr);
    setDateTo(tStr);
    handleApplyFilter(fStr, tStr, type);
  };

  const exportCSV = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Trips", data.summary.totalTrips],
      ["Gross Revenue", data.summary.grossRevenue],
      ["Direct Costs", data.summary.directCosts],
      ["Overhead Costs", data.summary.overheadCosts],
      ["Total Expenses", data.summary.totalExpenses],
      ["Net Profit", data.summary.netProfit],
      ["Profit Margin (%)", data.summary.profitMargin],
      ["Avg Ticket Size", data.summary.avgTicketSize],
      [],
      ["Vehicle Name", "Trips", "Revenue", "Direct Costs", "Net Yield"],
      ...data.vehicleYields.map((v) => [v.name, v.tripsCount, v.revenue, v.directCosts, v.netYield]),
      [],
      ["Driver Name", "Trips", "Revenue", "Direct Costs", "Net Yield"],
      ...data.driverYields.map((d) => [d.name, d.tripsCount, d.revenue, d.directCosts, d.netYield]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SkyRideTour_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report CSV exported!");
  };

  const { summary, vehicleYields, driverYields } = data;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Comprehensive financial yield and asset performance.</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]
            hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-sm font-semibold
            transition-all shadow-md active:scale-[0.97]">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card-elevated p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(["thisMonth", "lastMonth", "thisYear"] as const).map((p) => (
            <button key={p} onClick={() => handlePreset(p)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border",
                preset === p
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]"
              )}>
              {p === "thisMonth" ? "This Month" : p === "lastMonth" ? "Last Month" : "This Year"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-sm">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]" />
          <span className="text-xs text-[var(--muted-foreground)]">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]" />
          <button onClick={() => handleApplyFilter(dateFrom, dateTo, "custom")} disabled={isPending}
            className="px-3 py-1.5 rounded-xl bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-xs font-semibold transition-colors flex items-center gap-1">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />} Apply
          </button>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-elevated p-4">
          <p className="text-xs text-[var(--muted-foreground)] font-medium">Gross Revenue</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary.grossRevenue)}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{summary.totalTrips} trips completed</p>
        </div>

        <div className="card-elevated p-4">
          <p className="text-xs text-[var(--muted-foreground)] font-medium">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(summary.totalExpenses)}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
            Direct: {formatCurrency(summary.directCosts)} | Overhead: {formatCurrency(summary.overheadCosts)}
          </p>
        </div>

        <div className="card-elevated p-4">
          <p className="text-xs text-[var(--muted-foreground)] font-medium">Net Profit</p>
          <p className={cn("text-2xl font-bold mt-1", summary.netProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
            {formatCurrency(summary.netProfit)}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Profit Margin: {summary.profitMargin}%</p>
        </div>

        <div className="card-elevated p-4">
          <p className="text-xs text-[var(--muted-foreground)] font-medium">Avg Ticket Size</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{formatCurrency(summary.avgTicketSize)}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">revenue per trip</p>
        </div>
      </div>

      {/* Asset Yield Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vehicle Yield */}
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-[var(--foreground)] text-base">Vehicle Yield Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)] uppercase">
                  <th className="py-2 text-left">Vehicle</th>
                  <th className="py-2 text-center">Trips</th>
                  <th className="py-2 text-right">Revenue</th>
                  <th className="py-2 text-right">Net Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {vehicleYields.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-[var(--muted-foreground)]">No vehicle records</td></tr>
                ) : vehicleYields.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 font-medium text-[var(--foreground)] truncate max-w-[140px]">{v.name}</td>
                    <td className="py-2.5 text-center">{v.tripsCount}</td>
                    <td className="py-2.5 text-right font-semibold">{formatCurrency(v.revenue)}</td>
                    <td className={cn("py-2.5 text-right font-bold", v.netYield >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {formatCurrency(v.netYield)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver Yield */}
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-[var(--foreground)] text-base">Driver Performance Yield</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)] uppercase">
                  <th className="py-2 text-left">Driver</th>
                  <th className="py-2 text-center">Trips</th>
                  <th className="py-2 text-right">Revenue</th>
                  <th className="py-2 text-right">Net Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {driverYields.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-[var(--muted-foreground)]">No driver records</td></tr>
                ) : driverYields.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2.5 font-medium text-[var(--foreground)]">{d.name}</td>
                    <td className="py-2.5 text-center">{d.tripsCount}</td>
                    <td className="py-2.5 text-right font-semibold">{formatCurrency(d.revenue)}</td>
                    <td className={cn("py-2.5 text-right font-bold", d.netYield >= 0 ? "text-emerald-600" : "text-red-500")}>
                      {formatCurrency(d.netYield)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
