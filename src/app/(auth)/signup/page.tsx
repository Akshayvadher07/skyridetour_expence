"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Loader2, MapPin } from "lucide-react";
import { registrationSchema, type RegistrationInput } from "@/lib/validators/auth";

type RegistrationResponse = { error?: unknown };

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({ resolver: zodResolver(registrationSchema) });

  const onSubmit = async (data: RegistrationInput) => {
    setFormError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({})) as RegistrationResponse;

      if (!response.ok) {
        const message = typeof result.error === "string" ? result.error : "Registration failed. Please try again.";
        setFormError(message);
        return;
      }

      const loginResult = await signIn("credentials", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        redirect: false,
        callbackUrl: "/client/dashboard",
      });

      if (loginResult?.ok && !loginResult.error) {
        toast.success("Your account is ready.");
        router.replace("/client/dashboard");
        router.refresh();
        return;
      }

      toast.success("Account created. Sign in to continue.");
      router.replace("/login?registered=1");
    } catch {
      setFormError("Registration is temporarily unavailable. Please try again.");
    }
  };

  const inputClass = (invalid: boolean, password = false) => [
    "w-full rounded-xl border bg-white/[0.08] px-4 py-2.5 text-sm text-white",
    "outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]",
    "placeholder:text-white/25",
    password ? "pr-11" : "",
    invalid ? "border-red-400/60" : "border-white/10",
  ].join(" ");

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]">
          <MapPin className="h-6 w-6 text-[var(--primary-foreground)]" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          SkyRide<span className="text-[var(--primary)]">Tour</span>
        </h1>
        <p className="mt-1 text-sm text-white/50">Create your client account</p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl sm:p-8"
      >
        <h2 className="text-lg font-semibold text-white">Create account</h2>
        <p className="mb-5 mt-1 text-xs text-white/45">Your account is created with client access.</p>

        {formError && (
          <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-white/70">Full name</label>
            <input id="name" autoComplete="name" {...register("name")} className={inputClass(!!errors.name)} />
            {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/70">Email</label>
            <input id="email" type="email" autoComplete="email" {...register("email")} className={inputClass(!!errors.email)} />
            {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-white/70">Phone number</label>
            <input id="phone" type="tel" autoComplete="tel" {...register("phone")} className={inputClass(!!errors.phone)} />
            {errors.phone && <p className="mt-1 text-xs text-red-300">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/70">Password</label>
            <div className="relative">
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" {...register("password")} className={inputClass(!!errors.password, true)} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-white/40">At least 8 characters, including an uppercase letter and a number.</p>
            {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-white/70">Confirm password</label>
            <div className="relative">
              <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" {...register("confirmPassword")} className={inputClass(!!errors.confirmPassword, true)} />
              <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 hover:text-white" aria-label={showConfirmPassword ? "Hide confirmation" : "Show confirmation"}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-300">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-lg transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</> : "Create account"}
          </button>
        </form>
      </motion.section>

      <p className="mt-5 text-center text-sm text-white/55">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}