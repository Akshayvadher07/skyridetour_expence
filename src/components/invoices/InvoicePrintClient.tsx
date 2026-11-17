"use client";

// =============================================================================
// SkyRideTour — Printable Invoice Client Component
// Inline Customer Details (Name, Phone, Email, Address from Trip)
// =============================================================================

import { Printer, ArrowLeft, Phone, Mail, MapPin, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceDetail } from "@/server/actions/invoice";
import { PAYMENT_METHOD_LABELS, TRIP_TYPE_LABELS } from "@/lib/validators/trip";

export function InvoicePrintClient({ invoice }: { invoice: InvoiceDetail }) {
  const { trip, invoiceNumber, issueDate, totalAmount, paidAmount, status } = invoice;
  const balance = Math.max(0, Number(totalAmount) - Number(paidAmount));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top action toolbar (hidden during print) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link href={`/trips/${trip.id}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Trip Details
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]
              hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-sm font-semibold
              transition-all shadow-md active:scale-[0.97]">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="card-elevated p-8 sm:p-12 bg-white text-slate-900 shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
        
        {/* Header: Brand & Invoice Meta */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                S
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SkyRideTour</h1>
                <p className="text-xs text-slate-500">Travel Car & Trip Management</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-600 space-y-1">
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Somnath, Gujarat, India</p>
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> +91 98765 43210</p>
              <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> info@skyridetour.com</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block text-xs font-mono font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mb-2">
              INVOICE
            </span>
            <h2 className="text-xl font-mono font-bold text-slate-900">{invoiceNumber}</h2>
            <p className="text-xs text-slate-500 mt-1">Date: {formatDate(issueDate)}</p>
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                status === "PAID" ? "bg-emerald-100 text-emerald-800" : status === "PARTIAL" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
              }`}>
                {status === "PAID" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Bill To & Journey Details */}
        <div className="grid sm:grid-cols-2 gap-8 my-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Billed To</p>
            <p className="text-base font-bold text-slate-900">{trip.customerName}</p>
            <p className="text-sm text-slate-600 mt-1">+91 {trip.customerPhone}</p>
            {trip.customerAddress && <p className="text-sm text-slate-600 mt-0.5">{trip.customerAddress}</p>}
            {trip.customerEmail && <p className="text-sm text-slate-600 mt-0.5">{trip.customerEmail}</p>}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Trip Summary</p>
            <div className="space-y-1.5 text-xs text-slate-700">
              <p><span className="font-semibold text-slate-900">Trip #:</span> {trip.tripNumber}</p>
              <p><span className="font-semibold text-slate-900">Trip Date:</span> {formatDate(trip.date)}</p>
              <p><span className="font-semibold text-slate-900">Type:</span> {TRIP_TYPE_LABELS[trip.tripType]}</p>
              {trip.vehicle && <p><span className="font-semibold text-slate-900">Vehicle:</span> {trip.vehicle.name} ({trip.vehicle.registrationNumber})</p>}
              {trip.driver && <p><span className="font-semibold text-slate-900">Driver:</span> {trip.driver.name}</p>}
            </div>
          </div>
        </div>

        {/* Route Card */}
        <div className="mb-8 p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Pickup Location</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{trip.pickupLocation}</p>
          </div>
          <div className="text-slate-400 font-bold">→</div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Drop Location</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{trip.dropLocation}</p>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
              <th className="py-3 text-left">Description</th>
              <th className="py-3 text-center">Qty / Type</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-4">
                <p className="font-semibold text-slate-900">Travel Service Charge</p>
                <p className="text-xs text-slate-500 mt-0.5">{trip.pickupLocation} to {trip.dropLocation} ({TRIP_TYPE_LABELS[trip.tripType]})</p>
              </td>
              <td className="py-4 text-center text-slate-600 text-xs">1 Trip</td>
              <td className="py-4 text-right font-semibold text-slate-900">{formatCurrency(Number(totalAmount))}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals & Payments */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-slate-200">
          <div className="w-full sm:w-1/2 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Payment History</p>
            {trip.payments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No payments logged yet.</p>
            ) : (
              trip.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-600">{formatDate(p.paymentDate)} ({PAYMENT_METHOD_LABELS[p.paymentMethod]})</span>
                  <span className="font-semibold text-emerald-600">+{formatCurrency(Number(p.amount))}</span>
                </div>
              ))
            )}
          </div>

          <div className="w-full sm:w-1/2 max-w-xs space-y-2 text-sm ml-auto">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(totalAmount))}</span>
            </div>
            <div className="flex justify-between py-1 text-emerald-600">
              <span>Total Paid</span>
              <span>-{formatCurrency(Number(paidAmount))}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-slate-900 font-bold text-base text-slate-900">
              <span>Balance Due</span>
              <span className={balance > 0 ? "text-red-600" : "text-emerald-600"}>{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-600">Thank you for traveling with SkyRideTour!</p>
          <p>This is a computer-generated invoice. No physical signature required.</p>
        </div>

      </div>
    </div>
  );
}
