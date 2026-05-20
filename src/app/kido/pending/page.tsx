import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Brain, LogOut } from "lucide-react";

export default async function KidoPendingPage() {
  const session = await getServerSession(authOptions);

  // If already approved, redirect to dashboard
  if (session?.user && ((session.user as any).approved || session.user.role === "ADMIN")) {
    redirect("/kido/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-10">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6">
            <Brain className="w-6 h-6 text-white" />
          </div>

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
            <Clock className="w-7 h-7 text-amber-400" />
          </div>

          <h2 className="text-xl font-bold text-white mb-3 tracking-tight">
            Awaiting Approval
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-2">
            Your account has been created and is pending review by an administrator.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            You&apos;ll receive access once your account is approved. This typically
            takes less than 24 hours.
          </p>

          <div className="space-y-3">
            <Link
              href="/kido/auth/signin"
              className="flex items-center justify-center gap-2 w-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Return
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
