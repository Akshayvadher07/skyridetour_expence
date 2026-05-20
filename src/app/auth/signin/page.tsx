'use client';

import { signIn } from "next-auth/react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Mail, Loader2, ShieldCheck, AlertCircle, Package, User, Building2, Phone, MapPin, Hash, Briefcase, FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { registerUser } from "@/lib/actions/public";
import { Logo } from "@/components/ui/logo";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email("Industrial email identity required"),
  password: z.string().min(6, "Credentials must meet 6-char security minimum"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  email: z.string().email("Industrial email identity required"),
  password: z.string().min(6, "Credentials must meet 6-char security minimum"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Full name is required"),
  role: z.enum(["OWNER", "CLIENT"]),
  phone: z.string().min(10, "Valid mobile number required"),
  companyName: z.string().optional(),
  location: z.string().optional(),
  warehouseCount: z.string().optional(),
  city: z.string().optional(),
  businessType: z.string().optional(),
  gstNumber: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignInContent() {
  
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [signupRole, setSignupRole] = useState<'CLIENT' | 'OWNER'>('CLIENT');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");

    if (errorParam === "CredentialsSignin") {
      setError("AUTHENTICATION_FAILED: Invalid credential pair.");
    } else if (errorParam) {
      setError(`SYSTEM_ERROR: ${errorParam}`);
    }
  }, [searchParams]);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignup,
    setValue: setSignupValue,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'CLIENT' }
  });

  useEffect(() => {
    setSignupValue('role', signupRole);
  }, [signupRole, setSignupValue]);

  const onLogin = async (data: LoginFormValues) => {
  setIsLoading(true);
  setError(null);
  setSuccess(null);

  try {
    const result = await signIn("credentials", {
      email: data.email.toLowerCase(),
      password: data.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    console.log("LOGIN RESULT:", result);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result?.ok) {
      window.location.href = "/dashboard";
      return;
    }

    setError("Authentication failed");
    setIsLoading(false);

  } catch (err) {
    console.error(err);

    setError(
      "SYSTEM_TIMEOUT: Communication with Identity Registry failed."
    );

    setIsLoading(false);
  }
};

  const onSignup = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      ...data,
      gstNumber: !data.gstNumber || data.gstNumber.trim() === '' ? "NA" : data.gstNumber
    };

    try {
      const result = await registerUser(payload);
      if (result.success) {
        setSuccess("REGISTRATION_SUCCESS: Your identity is pending Admin verification.");
        setMode('signin');
        resetSignup();
      } else {
        setError(result.error || "REGISTRATION_FAILED: Registration rejected.");
      }
    } catch (err) {
      setError("SYSTEM_ERROR: Could not complete registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full opacity-50 blur-3xl" />

      <Card className="w-full max-w-lg shadow-2xl border-slate-200 rounded-3xl overflow-hidden bg-white relative z-10 transition-all duration-500">
        <CardHeader className="space-y-4 text-center pb-6 pt-10">
          <div className="flex justify-center pb-2">
            <Logo variant="light" className="h-20 md:h-24 w-auto mb-8" />
          </div>

          <div className="space-y-1">
            <CardDescription className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Industrial Logistics Handshake
            </CardDescription>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mt-6 border border-slate-200 w-fit mx-auto">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
              className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                mode === 'signin' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
              className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                mode === 'signup' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Create Account
            </button>
          </div>
        </CardHeader>

        <CardContent className="pb-10 px-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-5 rounded-2xl bg-rose-50 p-4 text-[11px] font-bold text-rose-600 border border-rose-100 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-5 rounded-2xl bg-emerald-50 p-4 text-[11px] font-bold text-emerald-600 border border-emerald-100 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'signin' ? (
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Node</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    {...registerLogin("email")}
                    type="email"
                    placeholder="corp@domain.com"
                    className={cn(
                      "w-full h-12 pl-12 pr-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none transition-all",
                      loginErrors.email ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
                    )}
                    disabled={isLoading}
                  />
                </div>
                {loginErrors.email && <p className="text-[9px] text-rose-600 font-black uppercase tracking-tighter ml-1">{loginErrors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    {...registerLogin("password")}
                    type="password"
                    placeholder="••••••••"
                    className={cn(
                      "w-full h-12 pl-12 pr-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none transition-all",
                      loginErrors.password ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
                    )}
                    disabled={isLoading}
                  />
                </div>
                {loginErrors.password && <p className="text-[9px] text-rose-600 font-black uppercase tracking-tighter ml-1">{loginErrors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-primary text-xs font-black text-primary-foreground uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><span>Authenticate Session</span><ShieldCheck className="h-5 w-5" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-5">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Register as a:</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSignupRole('CLIENT')}
                    className={cn(
                      "flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                      signupRole === 'CLIENT' ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole('OWNER')}
                    className={cn(
                      "flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                      signupRole === 'OWNER' ? "bg-[#0f172a] border-slate-800 text-white shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    Warehouse Owner
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input {...registerSignup("name")} className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="John Doe" disabled={isLoading}/>
                  </div>
                  {signupErrors.name && <p className="text-[8px] text-rose-600 font-black uppercase tracking-tighter">{signupErrors.name.message}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input {...registerSignup("email")} type="email" className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="corp@domain.com" disabled={isLoading}/>
                  </div>
                  {signupErrors.email && <p className="text-[8px] text-rose-600 font-black uppercase tracking-tighter">{signupErrors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile No.</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input {...registerSignup("phone")} className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="+91 9999999999" disabled={isLoading}/>
                  </div>
                  {signupErrors.phone && <p className="text-[8px] text-rose-600 font-black uppercase tracking-tighter">{signupErrors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input {...registerSignup("companyName")} className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder={signupRole === 'CLIENT' ? "Optional" : "Required"} disabled={isLoading}/>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input {...registerSignup("gstNumber")} className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="NA" disabled={isLoading}/>
                  </div>
                </div>

                {signupRole === 'CLIENT' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <input {...registerSignup("city")} className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Mumbai" disabled={isLoading}/>
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Type</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <input {...registerSignup("businessType")} className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Manufacturer" disabled={isLoading}/>
                      </div>
                    </div>
                  </>
                )}

                {signupRole === 'OWNER' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Location / Region</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <input {...registerSignup("location")} className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="State/Region" disabled={isLoading}/>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Listings (Warehouses)</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <input {...registerSignup("warehouseCount")} type="number" className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="1" disabled={isLoading}/>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input {...registerSignup("password")} type="password" className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="••••••••" disabled={isLoading}/>
                  </div>
                  {signupErrors.password && <p className="text-[8px] text-rose-600 font-black uppercase tracking-tighter">{signupErrors.password.message}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input {...registerSignup("confirmPassword")} type="password" className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="••••••••" disabled={isLoading}/>
                  </div>
                  {signupErrors.confirmPassword && <p className="text-[8px] text-rose-600 font-black uppercase tracking-tighter">{signupErrors.confirmPassword.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-primary text-xs font-black text-primary-foreground uppercase tracking-[0.2em] shadow-xl hover:bg-primary/90 transition-all active:scale-[0.98] mt-4"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Transmit Identity Request"}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 h-10 w-10" /></div>}>
      <SignInContent />
    </Suspense>
  );
}