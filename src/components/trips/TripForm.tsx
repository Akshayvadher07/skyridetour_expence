"use client";

// =============================================================================
// SkyRideTour — Trip Form
// Inline Customer Details (Name, Phone, Email, Address)
// =============================================================================

import { useEffect, useState, useCallback } from "react";
import { useForm, useWatch, type Resolver }  from "react-hook-form";
import { zodResolver }                       from "@hookform/resolvers/zod";
import { toast }                             from "sonner";
import {
  Loader2, Route, TrendingUp, TrendingDown, ChevronDown, Info, User,
} from "lucide-react";

import { tripSchema, type TripInput, TRIP_TYPES, TRIP_TYPE_LABELS, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, TOLL_TYPES, TOLL_TYPE_LABELS } from "@/lib/validators/trip";
import { createTrip, updateTrip, type TripDetail } from "@/server/actions/trip";
import { getVehicles }   from "@/server/actions/vehicle";
import { getDrivers }    from "@/server/actions/driver";
import { computeTripFinancials } from "@/lib/calculations/financials";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inp = (err?: boolean) => cn(
  "w-full px-3 py-2 rounded-xl border text-sm bg-[var(--background)] text-[var(--foreground)]",
  "placeholder:text-[var(--muted-foreground)] outline-none transition-all",
  "focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]",
  err ? "border-red-400" : "border-[var(--border)]"
);

function Field({ label, required, error, children, className }: {
  label: string; required?: boolean; error?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-[var(--foreground)]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Section({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="w-6 h-6 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">{label}</p>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

// ─── Live Preview Panel ────────────────────────────────────────────────────────

function FinancialPreview({ control }: { control: ReturnType<typeof useForm<TripInput>>["control"] }) {
  const watched = useWatch({ control });

  const financials = computeTripFinancials({
    tripAmount:    Number(watched.tripAmount)          || 0,
    cng:           Number(watched.cngExpense)          || 0,
    petrol:        Number(watched.petrolExpense)        || 0,
    diesel:        Number(watched.dieselExpense)        || 0,
    tollType:      watched.tollType                    ?? "NORMAL",
    tollExpense:   Number(watched.tollExpense)          || 0,
    parking:       Number(watched.parkingExpense)       || 0,
    driverExpense: Number(watched.driverExpense)        || 0,
    food:          Number(watched.foodExpense)          || 0,
    accommodation: Number(watched.accommodationExpense) || 0,
    otherExpense:  Number(watched.otherExpense)         || 0,
  });

  const isProfit = financials.netProfit >= 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
        Live Financial Preview
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)]">Revenue</p>
          <p className="text-base font-bold text-blue-600">{formatCurrency(Number(watched.tripAmount) || 0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)]">Expenses</p>
          <p className="text-base font-bold text-red-500">{formatCurrency(financials.totalExpense)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--muted-foreground)]">Net Profit</p>
          <p className={cn("text-base font-bold flex items-center gap-1", isProfit ? "text-emerald-600" : "text-red-500")}>
            {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatCurrency(financials.netProfit)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--muted-foreground)]">Profit Margin</span>
        <span className={cn("font-semibold", isProfit ? "text-emerald-600" : "text-red-500")}>
          {financials.profitMargin.toFixed(2)}%
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", isProfit ? "bg-emerald-500" : "bg-red-500")}
          style={{ width: `${Math.min(Math.abs(financials.profitMargin), 100)}%` }}
        />
      </div>
      {watched.tollType === "ANNUAL_PASS" && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Annual Pass — toll expense set to ₹0 for this trip (pass usage logged separately).
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TripFormProps {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
  trip?: TripDetail | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TripForm({ open, onClose, onSuccess, trip }: TripFormProps) {
  const isEdit = !!trip;
  const [vehicles, setVehicles] = useState<{ id: string; name: string; registrationNumber: string }[]>([]);
  const [drivers,  setDrivers]  = useState<{ id: string; name: string }[]>([]);

  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm<TripInput>({
    resolver: zodResolver(tripSchema) as unknown as Resolver<TripInput>,
    defaultValues: {
      date: "", customerName: "", customerPhone: "", customerEmail: "", customerAddress: "",
      pickupLocation: "", dropLocation: "", tripType: "ONE_WAY", vehicleId: "", driverId: "",
      tripAmount: 0, paymentStatus: "PENDING", paymentMethod: "CASH",
      cngExpense: 0, petrolExpense: 0, dieselExpense: 0,
      tollType: "NORMAL", tollExpense: 0, parkingExpense: 0,
      driverExpense: 0, foodExpense: 0, accommodationExpense: 0,
      otherExpense: 0, otherExpenseNotes: "", notes: "",
    },
  });

  const loadRefs = useCallback(async () => {
    const [veh, drv] = await Promise.all([
      getVehicles("", true),
      getDrivers(),
    ]);
    if (veh.success) setVehicles(veh.data.map((v) => ({ id: v.id, name: v.name, registrationNumber: v.registrationNumber })));
    if (drv.success) setDrivers(drv.data.filter((d) => d.status === "ACTIVE").map((d) => ({ id: d.id, name: d.name })));
  }, []);

  useEffect(() => { if (open) void loadRefs(); }, [open, loadRefs]);

  useEffect(() => {
    if (trip && open) {
      reset({
        date:            new Date(trip.date).toISOString().split("T")[0],
        customerName:    trip.customerName,
        customerPhone:   trip.customerPhone,
        customerEmail:   trip.customerEmail   ?? "",
        customerAddress: trip.customerAddress ?? "",
        pickupLocation:  trip.pickupLocation,
        dropLocation:    trip.dropLocation,
        tripType:        trip.tripType,
        vehicleId:       trip.vehicleId  ?? "",
        driverId:        trip.driverId   ?? "",
        tripAmount:      Number(trip.tripAmount),
        paymentStatus:   trip.paymentStatus,
        paymentMethod:   trip.paymentMethod,
        cngExpense:           Number(trip.cngExpense),
        petrolExpense:        Number(trip.petrolExpense),
        dieselExpense:        Number(trip.dieselExpense),
        tollType:             trip.tollType,
        tollExpense:          Number(trip.tollExpense),
        parkingExpense:       Number(trip.parkingExpense),
        driverExpense:        Number(trip.driverExpense),
        foodExpense:          Number(trip.foodExpense),
        accommodationExpense: Number(trip.accommodationExpense),
        otherExpense:         Number(trip.otherExpense),
        otherExpenseNotes:    trip.otherExpenseNotes ?? "",
        notes:                trip.notes             ?? "",
      });
    } else if (!open) {
      reset();
    }
  }, [trip, open, reset]);

  const tollType = watch("tollType");

  const onSubmit = async (data: TripInput) => {
    const result = isEdit ? await updateTrip(trip!.id, data) : await createTrip(data);
    if (!result.success) { toast.error("Failed", { description: result.error }); return; }
    toast.success(isEdit ? `${result.data.tripNumber} updated` : `${result.data.tripNumber} created`);
    onSuccess(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Route className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-base">{isEdit ? `Edit ${trip!.tripNumber}` : "New Trip"}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isEdit ? "Update trip and customer details." : "Record inline customer details and trip expenses."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="trip-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-1" noValidate>

          {/* ── Customer Information ── */}
          <Section label="Customer Information" icon={User} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Customer Name" required error={errors.customerName?.message}>
              <input type="text" placeholder="e.g. Rajesh Patel" {...register("customerName")} className={inp(!!errors.customerName)} />
            </Field>

            <Field label="Mobile Phone" required error={errors.customerPhone?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] select-none">+91</span>
                <input type="tel" maxLength={10} placeholder="9825012345" {...register("customerPhone")} className={cn(inp(!!errors.customerPhone), "pl-12")} />
              </div>
            </Field>

            <Field label="Email Address (optional)" error={errors.customerEmail?.message}>
              <input type="email" placeholder="customer@gmail.com" {...register("customerEmail")} className={inp(!!errors.customerEmail)} />
            </Field>

            <Field label="Address / City (optional)" error={errors.customerAddress?.message}>
              <input type="text" placeholder="e.g. Satellite, Ahmedabad" {...register("customerAddress")} className={inp(!!errors.customerAddress)} />
            </Field>
          </div>

          {/* ── Route Details ── */}
          <Section label="Route Details" icon={Route} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Trip Date" required error={errors.date?.message}>
              <input type="date" {...register("date")} className={inp(!!errors.date)} />
            </Field>
            <Field label="Pickup Location" required error={errors.pickupLocation?.message}>
              <input type="text" placeholder="e.g. Somnath Temple" {...register("pickupLocation")} className={inp(!!errors.pickupLocation)} />
            </Field>
            <Field label="Drop Location" required error={errors.dropLocation?.message}>
              <input type="text" placeholder="e.g. Dwarka" {...register("dropLocation")} className={inp(!!errors.dropLocation)} />
            </Field>
            <Field label="Trip Type" required error={errors.tripType?.message} className="sm:col-span-3">
              <select {...register("tripType")} className={inp(!!errors.tripType)}>
                {TRIP_TYPES.map((t) => <option key={t} value={t}>{TRIP_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
          </div>

          {/* ── Assignment ── */}
          <Section label="Assignment" icon={ChevronDown} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vehicle" error={errors.vehicleId?.message}>
              <select {...register("vehicleId")} className={inp(!!errors.vehicleId)}>
                <option value="">Unassigned</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
              </select>
            </Field>
            <Field label="Driver" error={errors.driverId?.message}>
              <select {...register("driverId")} className={inp(!!errors.driverId)}>
                <option value="">Unassigned</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          </div>

          {/* ── Revenue ── */}
          <Section label="Revenue & Payment" icon={TrendingUp} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Trip Amount (₹)" required error={errors.tripAmount?.message}>
              <input type="number" min={0} step="0.01" placeholder="3000" {...register("tripAmount")} className={inp(!!errors.tripAmount)} />
            </Field>
            <Field label="Payment Status" error={errors.paymentStatus?.message}>
              <select {...register("paymentStatus")} className={inp(!!errors.paymentStatus)}>
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
            <Field label="Payment Method" error={errors.paymentMethod?.message}>
              <select {...register("paymentMethod")} className={inp(!!errors.paymentMethod)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
              </select>
            </Field>
          </div>

          {/* ── Direct Expenses ── */}
          <Section label="Direct Trip Expenses" icon={TrendingDown} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="CNG (₹)" error={errors.cngExpense?.message}>
              <input type="number" min={0} step="0.01" placeholder="0" {...register("cngExpense")} className={inp(!!errors.cngExpense)} />
            </Field>
            <Field label="Petrol (₹)" error={errors.petrolExpense?.message}>
              <input type="number" min={0} step="0.01" placeholder="0" {...register("petrolExpense")} className={inp(!!errors.petrolExpense)} />
            </Field>
            <Field label="Diesel (₹)" error={errors.dieselExpense?.message}>
              <input type="number" min={0} step="0.01" placeholder="0" {...register("dieselExpense")} className={inp(!!errors.dieselExpense)} />
            </Field>
            <Field label="Toll Type" error={errors.tollType?.message}>
              <select {...register("tollType")} className={inp(!!errors.tollType)}>
                {TOLL_TYPES.map((t) => <option key={t} value={t}>{TOLL_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Toll Amount (₹)" error={errors.tollExpense?.message}>
              <input type="number" min={0} step="0.01" placeholder="0"
                disabled={tollType === "ANNUAL_PASS" || tollType === "FREE"}
                {...register("tollExpense")} className={cn(inp(!!errors.tollExpense), (tollType === "ANNUAL_PASS" || tollType === "FREE") && "opacity-40 cursor-not-allowed")} />
            </Field>
            <Field label="Parking (₹)" error={errors.parkingExpense?.message}>
              <input type="number" min={0} step="0.01" placeholder="0" {...register("parkingExpense")} className={inp(!!errors.parkingExpense)} />
            </Field>
            <Field label="Driver Allowance (₹)" error={errors.driverExpense?.message}>
              <input type="number" min={0} step="0.01" placeholder="0" {...register("driverExpense")} className={inp(!!errors.driverExpense)} />
            </Field>
            <Field label="Food (₹)" error={errors.foodExpense?.message}>
              <input type="number" min={0} step="0.01" placeholder="0" {...register("foodExpense")} className={inp(!!errors.foodExpense)} />
            </Field>
            <Field label="Accommodation (₹)" error={errors.accommodationExpense?.message}>
              <input type="number" min={0} step="0.01" placeholder="0" {...register("accommodationExpense")} className={inp(!!errors.accommodationExpense)} />
            </Field>
            <Field label="Other (₹)" error={errors.otherExpense?.message}>
              <input type="number" min={0} step="0.01" placeholder="0" {...register("otherExpense")} className={inp(!!errors.otherExpense)} />
            </Field>
            <Field label="Other Expense Notes" className="sm:col-span-2" error={errors.otherExpenseNotes?.message}>
              <input type="text" placeholder="Describe other expense…" {...register("otherExpenseNotes")} className={inp(!!errors.otherExpenseNotes)} />
            </Field>
          </div>

          <FinancialPreview control={control} />

          <Field label="Trip Notes" error={errors.notes?.message}>
            <textarea rows={2} placeholder="Any additional notes…" {...register("notes")}
              className={cn(inp(!!errors.notes), "resize-none")} />
          </Field>
        </form>

        <DialogFooter className="gap-2 mt-2">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-[var(--border)]
              text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="trip-form" type="submit" id="trip-submit-btn" disabled={isSubmitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2
              px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)]
              text-[var(--primary-foreground)] text-sm font-semibold
              transition-all disabled:opacity-60 active:scale-[0.97]">
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? "Saving…" : "Creating…"}</>
              : isEdit ? "Save Changes" : "Create Trip"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
