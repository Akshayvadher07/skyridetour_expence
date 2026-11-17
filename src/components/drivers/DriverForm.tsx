"use client";

// =============================================================================
// SkyRideTour — Driver Form Modal (Create + Edit)
// =============================================================================

import { useEffect }              from "react";
import { useForm, type Resolver }  from "react-hook-form";
import { zodResolver }             from "@hookform/resolvers/zod";
import { toast }                   from "sonner";
import { Loader2, UserCheck }      from "lucide-react";
import {
  driverSchema,
  type DriverInput,
  DRIVER_STATUSES,
  DRIVER_STATUS_LABELS,
} from "@/lib/validators/driver";
import { createDriver, updateDriver } from "@/server/actions/driver";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

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

const inp = (err?: boolean) => cn(
  "w-full px-3 py-2 rounded-xl border text-sm bg-[var(--background)] text-[var(--foreground)]",
  "placeholder:text-[var(--muted-foreground)] outline-none transition-all",
  "focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]",
  err ? "border-red-400" : "border-[var(--border)]"
);

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface DriverFormProps {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
  driver?: {
    id:            string;
    name:          string;
    phone:         string;
    licenseNumber: string;
    licenseExpiry: Date;
    salary:        number;
    joiningDate:   Date | null;
    status:        string;
    notes:         string | null;
  } | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DriverForm({ open, onClose, onSuccess, driver }: DriverFormProps) {
  const isEdit = !!driver;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverInput>({
    resolver: zodResolver(driverSchema) as unknown as Resolver<DriverInput>,
    defaultValues: {
      name: "", phone: "", licenseNumber: "",
      licenseExpiry: "", salary: 0,
      joiningDate: "", status: "ACTIVE", notes: "",
    },
  });

  useEffect(() => {
    if (driver && open) {
      reset({
        name:          driver.name,
        phone:         driver.phone,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: toDateInput(driver.licenseExpiry),
        salary:        driver.salary,
        joiningDate:   toDateInput(driver.joiningDate),
        status:        driver.status as DriverInput["status"],
        notes:         driver.notes ?? "",
      });
    } else if (!open) {
      reset({
        name: "", phone: "", licenseNumber: "",
        licenseExpiry: "", salary: 0,
        joiningDate: "", status: "ACTIVE", notes: "",
      });
    }
  }, [driver, open, reset]);

  const onSubmit = async (data: DriverInput) => {
    const result = isEdit
      ? await updateDriver(driver!.id, data)
      : await createDriver(data);

    if (!result.success) {
      toast.error(isEdit ? "Update failed" : "Could not create driver", {
        description: result.error,
      });
      return;
    }
    toast.success(isEdit ? `${result.data.name} updated` : `${result.data.name} added to roster`);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? "Edit Driver" : "Add Driver"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isEdit ? "Update driver profile." : "Register a new driver in SkyRideTour."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="driver-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1" noValidate>

          <Section label="Personal Info" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.name?.message}>
              <input id="driver-name" type="text" placeholder="Ramesh Kumar"
                {...register("name")} className={inp(!!errors.name)} />
            </Field>
            <Field label="Mobile Number" required error={errors.phone?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)] select-none">+91</span>
                <input id="driver-phone" type="tel" maxLength={10} placeholder="9876543210"
                  {...register("phone")} className={cn(inp(!!errors.phone), "pl-12")} />
              </div>
            </Field>
          </div>

          <Section label="License" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="License Number" required error={errors.licenseNumber?.message}>
              <input id="driver-license" type="text" placeholder="GJ01 2020 0123456"
                {...register("licenseNumber")}
                className={inp(!!errors.licenseNumber)}
                style={{ textTransform: "uppercase" }} />
            </Field>
            <Field label="License Expiry" required error={errors.licenseExpiry?.message}>
              <input id="driver-license-expiry" type="date"
                {...register("licenseExpiry")} className={inp(!!errors.licenseExpiry)} />
            </Field>
          </div>

          <Section label="Employment" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Monthly Salary (₹)" error={errors.salary?.message}>
              <input id="driver-salary" type="number" min={0} placeholder="15000"
                {...register("salary")} className={inp(!!errors.salary)} />
            </Field>
            <Field label="Joining Date" error={errors.joiningDate?.message}>
              <input id="driver-joining" type="date"
                {...register("joiningDate")} className={inp(!!errors.joiningDate)} />
            </Field>
            <Field label="Status" required error={errors.status?.message}>
              <select id="driver-status" {...register("status")} className={inp(!!errors.status)}>
                {DRIVER_STATUSES.map((s) => (
                  <option key={s} value={s}>{DRIVER_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes" error={errors.notes?.message}>
            <textarea id="driver-notes" rows={2} placeholder="Any additional notes…"
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
          <button form="driver-form" type="submit" id="driver-submit-btn" disabled={isSubmitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2
              px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)]
              text-[var(--primary-foreground)] text-sm font-semibold
              transition-all disabled:opacity-60 active:scale-[0.97]">
            {isSubmitting
              ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? "Saving…" : "Adding…"}</>
              : isEdit ? "Save Changes" : "Add Driver"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
