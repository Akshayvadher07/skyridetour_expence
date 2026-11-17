"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Car } from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────

const signinSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SigninInput = z.infer<typeof signinSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = async (data: SigninInput) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--primary)] shadow-lg mb-4">
          <Car className="w-8 h-8 text-[var(--primary-foreground)]" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          SkyRide<span className="text-[var(--primary)]">Tour</span>
        </h1>
        <p className="text-white/50 text-sm mt-1">Travel Management Portal</p>
      </div>

      {/* Card */}
      <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.10] rounded-2xl p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
        <p className="text-white/40 text-sm mb-6">Enter your credentials to continue</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="owner@skyridetour.com"
              {...register("email")}
              className={`w-full px-4 py-2.5 rounded-xl bg-white/[0.08] border text-white placeholder:text-white/20
                text-sm outline-none transition-all duration-200
                focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]
                ${errors.email ? "border-red-400/60" : "border-white/10"}`}
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-white/[0.08] border text-white placeholder:text-white/20
                  text-sm outline-none transition-all duration-200
                  focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]
                  ${errors.password ? "border-red-400/60" : "border-white/10"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            id="signin-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 mt-2
              bg-[var(--primary)] hover:bg-[var(--primary-hover)]
              text-[var(--primary-foreground)] font-semibold rounded-xl
              transition-all duration-200 shadow-lg hover:shadow-[var(--shadow-glow)]
              disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-white/20 text-xs mt-6">
        SkyRideTour © {new Date().getFullYear()} · Private Business Portal
      </p>
    </div>
  );
}
