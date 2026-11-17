"use client";

import { useEffect }              from "react";
import { useForm, type Resolver }  from "react-hook-form";
import { zodResolver }             from "@hookform/resolvers/zod";
import { toast }                   from "sonner";
import { Loader2, Ticket }         from "lucide-react";
import {
  tollPassSchema, type TollPassInput,
} from "@/lib/validators/toll-pass";
import { createTollPass, updateTollPass, type TollPassWithVehicle } from "@/server/actions/toll-pass";
import { getVehicles } from "@/server/actions/vehicle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";

function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

const inp = (err?: boolean) => cn(
  "w-full px-3 py-2 rounded-xl border text-sm bg-[var(--background)] text-[var(--foreground)]",
  "placeholder:text-[var(--muted-foreground)] outline-none transition-all",
  "focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]",
  err ? "border-red-400" : "border-[var(--border)]"
);

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--foreground)]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TollPassFormProps {
  open: boolean; onClose: () => void; onSuccess: () => void;
  pass?: TollPassWithVehicle | null;
}

export function TollPassForm({ open, onClose, onSuccess, pass }: TollPassFormProps) {
  const isEdit = !!pass;
  const [vehicles, setVehicles] = useState<{ id: string; name: string; registrationNumber: string }[]>([]);

  useEffect(() => {
    getVehicles("", true).then((r) => {
      if (r.success) setVehicles(r.data.map((v) => ({ id: v.id, name: v.name, registrationNumber: v.registrationNumber })));
    });
  }, []);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TollPassInput>({
    resolver: zodResolver(tollPassSchema) as unknown as Resolver<TollPassInput>,
    defaultValues: { passName: "", vehicleId: "", passCost: 0, tollsIncluded: 0, startDate: "", expiryDate: "", isActive: true, notes: "" },
  });

  useEffect(() => {
    if (pass && open) {
      reset({
        passName:      pass.passName,
        vehicleId:     pass.vehicleId,
        passCost:      Number(pass.passCost),
        tollsIncluded: pass.tollsIncluded,
        startDate:     toDateInput(pass.startDate),
        expiryDate:    toDateInput(pass.expiryDate),
        isActive:      pass.isActive,
        notes:         pass.notes ?? "",
      });
    } else if (!open) {
      reset({ passName: "", vehicleId: "", passCost: 0, tollsIncluded: 0, startDate: "", expiryDate: "", isActive: true, notes: "" });
    }
  }, [pass, open, reset]);

  const onSubmit = async (data: TollPassInput) => {
    const result = isEdit ? await updateTollPass(pass!.id, data) : await createTollPass(data);
    if (!result.success) { toast.error("Failed", { description: result.error }); return; }
    toast.success(isEdit ? `${result.data.passName} updated` : `${result.data.passName} created`);
    onSuccess(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Ticket className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <DialogTitle className="text-base">{isEdit ? "Edit Toll Pass" : "Add Toll Pass"}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isEdit ? "Update pass details." : "Register an annual toll pass."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form id="toll-pass-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1" noValidate>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Pass Name" required error={errors.passName?.message}>
              <input type="text" placeholder="NH-48 Annual Pass" {...register("passName")} className={inp(!!errors.passName)} />
            </Field>
            <Field label="Vehicle" required error={errors.vehicleId?.message}>
              <select {...register("vehicleId")} className={inp(!!errors.vehicleId)}>
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Pass Cost (₹)" error={errors.passCost?.message}>
              <input type="number" min={0} placeholder="1200" {...register("passCost")} className={inp(!!errors.passCost)} />
            </Field>
            <Field label="Tolls Included (0 = unlimited)" error={errors.tollsIncluded?.message}>
              <input type="number" min={0} placeholder="0" {...register("tollsIncluded")} className={inp(!!errors.tollsIncluded)} />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start Date" required error={errors.startDate?.message}>
              <input type="date" {...register("startDate")} className={inp(!!errors.startDate)} />
            </Field>
            <Field label="Expiry Date" required error={errors.expiryDate?.message}>
              <input type="date" {...register("expiryDate")} className={inp(!!errors.expiryDate)} />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="pass-active" {...register("isActive")} className="w-4 h-4 accent-[var(--primary)]" />
            <label htmlFor="pass-active" className="text-sm font-medium text-[var(--foreground)]">Pass is active</label>
          </div>
          <Field label="Notes" error={errors.notes?.message}>
            <textarea rows={2} placeholder="Any notes…" {...register("notes")} className={cn(inp(!!errors.notes), "resize-none")} />
          </Field>
        </form>
        <DialogFooter className="gap-2 mt-2">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="toll-pass-form" type="submit" disabled={isSubmitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
              bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]
              text-sm font-semibold transition-all disabled:opacity-60 active:scale-[0.97]">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? "Saving…" : "Creating…"}</> : isEdit ? "Save Changes" : "Create Pass"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
