"use client";

// =============================================================================
// SkyRideTour — Vehicle Form Modal (Create + Edit)
// =============================================================================

import { useEffect }              from "react";
import { useForm, type Resolver }  from "react-hook-form";
import { zodResolver }             from "@hookform/resolvers/zod";
import { toast }         from "sonner";
import { Loader2, Truck } from "lucide-react";
import {
  vehicleSchema,
  type VehicleInput,
  VEHICLE_TYPES,
  FUEL_TYPES,
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
} from "@/lib/validators/vehicle";
import { createVehicle, updateVehicle } from "@/server/actions/vehicle";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Field Wrapper ─────────────────────────────────────────────────────────────

function Field({
  label, required, error, children, className,
}: {
  label: string; required?: boolean; error?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-[var(--foreground)]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

const inp = (err?: boolean) => cn(
  "w-full px-3 py-2 rounded-xl border text-sm bg-[var(--background)] text-[var(--foreground)]",
  "placeholder:text-[var(--muted-foreground)] outline-none transition-all",
  "focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]",
  err ? "border-red-400" : "border-[var(--border)]"
);

// ─── Section Divider ──────────────────────────────────────────────────────────

function Section({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] flex-shrink-0">
        {label}
      </p>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface VehicleFormProps {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
  vehicle?: {
    id:                 string;
    name:               string;
    registrationNumber: string;
    model:              string | null;
    vehicleType:        string;
    fuelType:           string;
    seatingCapacity:    number;
    year:               number | null;
    color:              string | null;
    insuranceExpiry:    Date | null;
    pucExpiry:          Date | null;
    isActive:           boolean;
    notes:              string | null;
  } | null;
}

function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export function VehicleForm({ open, onClose, onSuccess, vehicle }: VehicleFormProps) {
  const isEdit = !!vehicle;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema) as unknown as Resolver<VehicleInput>,
    defaultValues: {
      name: "", registrationNumber: "", model: "",
      vehicleType: "SUV", fuelType: "CNG",
      seatingCapacity: 4, year: undefined,
      color: "", insuranceExpiry: "", pucExpiry: "",
      isActive: true, notes: "",
    },
  });

  useEffect(() => {
    if (vehicle && open) {
      reset({
        name:               vehicle.name,
        registrationNumber: vehicle.registrationNumber,
        model:              vehicle.model           ?? "",
        vehicleType:        vehicle.vehicleType     as VehicleInput["vehicleType"],
        fuelType:           vehicle.fuelType        as VehicleInput["fuelType"],
        seatingCapacity:    vehicle.seatingCapacity,
        year:               vehicle.year            ?? undefined,
        color:              vehicle.color           ?? "",
        insuranceExpiry:    toDateInput(vehicle.insuranceExpiry),
        pucExpiry:          toDateInput(vehicle.pucExpiry),
        isActive:           vehicle.isActive,
        notes:              vehicle.notes           ?? "",
      });
    } else if (!open) {
      reset({
        name: "", registrationNumber: "", model: "",
        vehicleType: "SUV", fuelType: "CNG",
        seatingCapacity: 4, year: undefined,
        color: "", insuranceExpiry: "", pucExpiry: "",
        isActive: true, notes: "",
      });
    }
  }, [vehicle, open, reset]);

  const onSubmit = async (data: VehicleInput) => {
    const result = isEdit
      ? await updateVehicle(vehicle!.id, data)
      : await createVehicle(data);

    if (!result.success) {
      toast.error(isEdit ? "Update failed" : "Could not add vehicle", {
        description: result.error,
      });
      return;
    }
    toast.success(isEdit ? `${result.data.name} updated` : `${result.data.name} added to fleet`);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? "Edit Vehicle" : "Add Vehicle to Fleet"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isEdit ? "Update vehicle details." : "Register a new vehicle in SkyRideTour."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="vehicle-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1" noValidate>

          {/* ── Basic Info ── */}
          <Section label="Basic Info" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vehicle Name" required error={errors.name?.message}>
              <input id="vehicle-name" type="text" placeholder="e.g. Innova Crysta White"
                {...register("name")} className={inp(!!errors.name)} />
            </Field>
            <Field label="Registration Number" required error={errors.registrationNumber?.message}>
              <input id="vehicle-reg" type="text" placeholder="GJ-01-AB-1234"
                {...register("registrationNumber")}
                className={inp(!!errors.registrationNumber)}
                style={{ textTransform: "uppercase" }} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Vehicle Type" required error={errors.vehicleType?.message}>
              <select id="vehicle-type" {...register("vehicleType")} className={inp(!!errors.vehicleType)}>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{VEHICLE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </Field>
            <Field label="Fuel Type" required error={errors.fuelType?.message}>
              <select id="vehicle-fuel" {...register("fuelType")} className={inp(!!errors.fuelType)}>
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>{FUEL_TYPE_LABELS[f]}</option>
                ))}
              </select>
            </Field>
            <Field label="Seating Capacity" error={errors.seatingCapacity?.message}>
              <input id="vehicle-seats" type="number" min={1} max={55}
                {...register("seatingCapacity")} className={inp(!!errors.seatingCapacity)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Model" error={errors.model?.message}>
              <input id="vehicle-model" type="text" placeholder="e.g. Toyota Innova"
                {...register("model")} className={inp(!!errors.model)} />
            </Field>
            <Field label="Year" error={errors.year?.message}>
              <input id="vehicle-year" type="number" placeholder="2022"
                min={1990} max={new Date().getFullYear() + 1}
                {...register("year")} className={inp(!!errors.year)} />
            </Field>
            <Field label="Color" error={errors.color?.message}>
              <input id="vehicle-color" type="text" placeholder="e.g. White"
                {...register("color")} className={inp(!!errors.color)} />
            </Field>
          </div>

          {/* ── Documents ── */}
          <Section label="Documents & Compliance" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Insurance Expiry Date" error={errors.insuranceExpiry?.message}>
              <input id="vehicle-insurance" type="date"
                {...register("insuranceExpiry")} className={inp(!!errors.insuranceExpiry)} />
            </Field>
            <Field label="PUC Expiry Date" error={errors.pucExpiry?.message}>
              <input id="vehicle-puc" type="date"
                {...register("pucExpiry")} className={inp(!!errors.pucExpiry)} />
            </Field>
          </div>

          {/* ── Other ── */}
          <Section label="Other" />
          <div className="flex items-center gap-3">
            <input id="vehicle-active" type="checkbox" {...register("isActive")}
              className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)]" />
            <label htmlFor="vehicle-active" className="text-sm font-medium text-[var(--foreground)]">
              Vehicle is active and available for trips
            </label>
          </div>
          <Field label="Notes" error={errors.notes?.message}>
            <textarea id="vehicle-notes" rows={2} placeholder="Any additional notes…"
              {...register("notes")} className={cn(inp(!!errors.notes), "resize-none")} />
          </Field>
        </form>

        <DialogFooter className="gap-2 mt-2">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-[var(--border)]
              text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]
              transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="vehicle-form" type="submit" id="vehicle-submit-btn" disabled={isSubmitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2
              px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)]
              text-[var(--primary-foreground)] text-sm font-semibold
              transition-all disabled:opacity-60 active:scale-[0.97]">
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? "Saving…" : "Adding…"}</>
              : isEdit ? "Save Changes" : "Add Vehicle"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
