"use client";

import { useEffect, useState }        from "react";
import { useForm, type Resolver }      from "react-hook-form";
import { zodResolver }                 from "@hookform/resolvers/zod";
import { toast }                       from "sonner";
import { Loader2, Receipt }            from "lucide-react";
import { expenseSchema, type ExpenseInput, OVERHEAD_CATEGORIES, OVERHEAD_CATEGORY_LABELS } from "@/lib/validators/expense";
import { createExpense, updateExpense, type ExpenseWithRefs } from "@/server/actions/expense";
import { getVehicles } from "@/server/actions/vehicle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

interface ExpenseFormProps {
  open: boolean; onClose: () => void; onSuccess: () => void;
  expense?: ExpenseWithRefs | null;
}

function toDateInput(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export function ExpenseForm({ open, onClose, onSuccess, expense }: ExpenseFormProps) {
  const isEdit = !!expense;
  const [vehicles, setVehicles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getVehicles().then((r) => { if (r.success) setVehicles(r.data.map((v) => ({ id: v.id, name: v.name }))); });
  }, []);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema) as unknown as Resolver<ExpenseInput>,
    defaultValues: { date: "", category: "MAINTENANCE", amount: 0, description: "", vehicleId: "", tripId: "" },
  });

  useEffect(() => {
    if (expense && open) {
      reset({
        date:        toDateInput(expense.date),
        category:    expense.category as ExpenseInput["category"],
        amount:      Number(expense.amount),
        description: expense.description ?? "",
        vehicleId:   expense.vehicleId ?? "",
        tripId:      expense.tripId    ?? "",
      });
    } else if (!open) {
      reset({ date: "", category: "MAINTENANCE", amount: 0, description: "", vehicleId: "", tripId: "" });
    }
  }, [expense, open, reset]);

  const onSubmit = async (data: ExpenseInput) => {
    const result = isEdit ? await updateExpense(expense!.id, data) : await createExpense(data);
    if (!result.success) { toast.error("Failed", { description: result.error }); return; }
    toast.success(isEdit ? "Expense updated" : "Expense logged");
    onSuccess(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-base">{isEdit ? "Edit Expense" : "Log Expense"}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">Record a business or vehicle overhead cost.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form id="expense-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1" noValidate>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Date" required error={errors.date?.message}>
              <input type="date" {...register("date")} className={inp(!!errors.date)} />
            </Field>
            <Field label="Category" required error={errors.category?.message}>
              <select {...register("category")} className={inp(!!errors.category)}>
                {OVERHEAD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{OVERHEAD_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Amount (₹)" required error={errors.amount?.message}>
            <input type="number" min={0} step="0.01" placeholder="0.00" {...register("amount")} className={inp(!!errors.amount)} />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <input type="text" placeholder="e.g. Oil change at Rajkot service centre" {...register("description")} className={inp(!!errors.description)} />
          </Field>
          <Field label="Link to Vehicle (optional)" error={errors.vehicleId?.message}>
            <select {...register("vehicleId")} className={inp(!!errors.vehicleId)}>
              <option value="">None</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
        </form>
        <DialogFooter className="gap-2 mt-2">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="expense-form" type="submit" disabled={isSubmitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
              bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]
              text-sm font-semibold transition-all disabled:opacity-60 active:scale-[0.97]">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? "Saving…" : "Logging…"}</> : isEdit ? "Save Changes" : "Log Expense"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
