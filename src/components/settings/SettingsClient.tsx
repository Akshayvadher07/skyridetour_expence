"use client";

// =============================================================================
// SkyRideTour — Settings Client Component (Step 20)
// Business profile form + Password update section
// =============================================================================

import { useState } from "react";
import { useForm }  from "react-hook-form";
import { toast }    from "sonner";
import { Building2, Key, Loader2, Save } from "lucide-react";
import { updateSettings, changePassword, type BusinessSettings, type SettingsInput } from "@/server/actions/settings";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

function inp(err?: boolean) {
  return cn(
    "w-full px-3 py-2.5 rounded-xl border text-sm bg-[var(--background)] text-[var(--foreground)]",
    "placeholder:text-[var(--muted-foreground)] outline-none transition-all",
    "focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]",
    err ? "border-red-400" : "border-[var(--border)]"
  );
}

export function SettingsClient({ initialSettings }: { initialSettings: BusinessSettings }) {
  const { data: session } = useSession();
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPass, setSavingPass]         = useState(false);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass]         = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsInput>({
    defaultValues: initialSettings,
  });

  const onSaveSettings = async (data: SettingsInput) => {
    setSavingSettings(true);
    const res = await updateSettings(data);
    setSavingSettings(false);

    if (!res.success) {
      toast.error("Failed to update settings", { description: res.error });
      return;
    }

    toast.success("Business profile updated!");
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPass.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      toast.error("Session expired. Please sign in again.");
      return;
    }

    setSavingPass(true);
    const res = await changePassword(userId, currentPass, newPass);
    setSavingPass(false);

    if (!res.success) {
      toast.error("Password change failed", { description: res.error });
      return;
    }

    toast.success("Password changed successfully!");
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">System Settings</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Manage your business profile, invoicing details, and security.</p>
      </div>

      {/* Business Profile */}
      <div className="card-elevated p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--foreground)] text-base">Business Profile</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Displayed on generated invoices and printed documents.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSaveSettings)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">Company Name</label>
              <input type="text" {...register("companyName", { required: "Required" })} className={inp(!!errors.companyName)} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">Phone Number</label>
              <input type="text" {...register("phone", { required: "Required" })} className={inp(!!errors.phone)} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">Email Address</label>
              <input type="email" {...register("email", { required: "Required" })} className={inp(!!errors.email)} />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">GST Number</label>
              <input type="text" {...register("gstNumber")} className={inp()} placeholder="e.g. 24AAAAA0000A1Z5" />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">Invoice Number Prefix</label>
              <input type="text" {...register("invoicePrefix")} className={inp()} placeholder="INV-2026-" />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">Default Currency</label>
              <input type="text" {...register("currencySymbol")} className={inp()} placeholder="₹" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">Business Address</label>
            <textarea rows={2} {...register("address", { required: "Required" })} className={cn(inp(!!errors.address), "resize-none")} />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingSettings}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)]
                hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-sm font-semibold
                transition-all shadow-md active:scale-[0.97] disabled:opacity-60">
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card-elevated p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--foreground)] text-base">Security & Password</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Update your account login credentials.</p>
          </div>
        </div>

        <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">Current Password</label>
            <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required className={inp()} />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">New Password</label>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={8} className={inp()} />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] mb-1 block">Confirm New Password</label>
            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required minLength={8} className={inp()} />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingPass}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600
                hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md active:scale-[0.97] disabled:opacity-60">
              {savingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
