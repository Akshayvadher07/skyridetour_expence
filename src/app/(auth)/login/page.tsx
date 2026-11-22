"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn }            from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm }           from "react-hook-form";
import { zodResolver }       from "@hookform/resolvers/zod";
import { z }                 from "zod";
import { toast }             from "sonner";
import { motion }            from "framer-motion";
import {
  Eye, EyeOff, Loader2, MapPin, Shield, AlertCircle,
} from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

// ─── Error map — NextAuth error codes → user-friendly messages ────────────────

const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin:    "Invalid email or password. Please try again.",
  OAuthSignin:          "Could not sign in. Please try again.",
  OAuthCallback:        "Authentication failed. Please try again.",
  OAuthCreateAccount:   "Could not create account. Please try again.",
  EmailCreateAccount:   "Could not create account. Please try again.",
  Callback:             "Sign-in service is temporarily unavailable. Please try again later.",
  OAuthAccountNotLinked:"Account already exists with a different sign-in method.",
  SessionRequired:      "Please sign in to access this page.",
  default:              "An error occurred during sign in.",
};

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [authError,    setAuthError]    = useState<string | null>(null);

  // Surface NextAuth error from query param (e.g. /login?error=CredentialsSignin)
  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (errorCode) {
      setAuthError(AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.default);
    }
  }, [searchParams]);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);
    try {
      const result = await signIn("credentials", {
        email:       data.email.toLowerCase().trim(),
        password:    data.password,
        redirect:    false,
        callbackUrl,
      });

      if (!result) {
        setAuthError(AUTH_ERRORS.default);
        return;
      }

      if (result.error) {
        // Don't expose raw error code — map to user-friendly message
        setAuthError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.default);
        toast.error("Sign in failed", { description: AUTH_ERRORS[result.error] ?? AUTH_ERRORS.default });
        return;
      }

      toast.success("Welcome back!", { description: "Redirecting to your dashboard…" });
      router.push(result.url ?? callbackUrl);
      router.refresh();
    } catch {
      setAuthError("Something went wrong. Please try again.");
      toast.error("Unexpected error. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Logo & Brand */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--primary)] shadow-lg mb-4">
          <MapPin className="w-8 h-8 text-[var(--primary-foreground)]" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          SkyRide<span className="text-[var(--primary)]">Tour</span>
        </h1>
        <p className="text-white/50 text-sm mt-1">Business Management Portal</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.10] rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-4 h-4 text-[var(--primary)]" />
          <div>
            <h2 className="text-lg font-semibold text-white leading-tight">Sign in to your account</h2>
            <p className="text-white/40 text-xs">Owner &amp; Manager access only</p>
          </div>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{authError}</p>
          </motion.div>
        )}

        <form
          id="login-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
          aria-label="Login form"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white/70 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="owner@skyridetour.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
              className={[
                "w-full px-4 py-2.5 rounded-xl bg-white/[0.08] border text-white",
                "placeholder:text-white/20 text-sm outline-none transition-all duration-200",
                "focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]",
                errors.email
                  ? "border-red-400/60 ring-1 ring-red-400/30"
                  : "border-white/10",
              ].join(" ")}
            />
            {errors.email && (
              <p id="email-error" className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white/70 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
                className={[
                  "w-full px-4 py-2.5 pr-11 rounded-xl bg-white/[0.08] border text-white",
                  "placeholder:text-white/20 text-sm outline-none transition-all duration-200",
                  "focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]",
                  errors.password
                    ? "border-red-400/60 ring-1 ring-red-400/30"
                    : "border-white/10",
                ].join(" ")}
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30
                  hover:text-white/60 transition-colors rounded-md focus:outline-none
                  focus:ring-1 focus:ring-white/30"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye    className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className={[
              "w-full flex items-center justify-center gap-2 py-3 px-6 mt-2 rounded-xl",
              "bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold text-sm",
              "transition-all duration-200 shadow-lg",
              "hover:bg-[var(--primary-hover)] hover:shadow-[0_0_24px_rgba(245,158,11,0.35)]",
              "disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-transparent",
            ].join(" ")}
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
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-white/20 text-xs mt-6"
      >
        SkyRideTour © {new Date().getFullYear()} · Private Portal · Unauthorized access is prohibited
      </motion.p>
    </div>
  );
}

// ─── Page export — wraps form in Suspense for useSearchParams ─────────────────

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-dvh">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
