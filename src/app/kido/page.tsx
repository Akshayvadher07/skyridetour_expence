import Link from "next/link";
import { Sparkles, Zap, Shield, ArrowRight, Brain, Layers } from "lucide-react";

export default function KidoLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Kido <span className="text-indigo-400">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/kido/auth/signin"
            className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/kido/auth/signup"
            className="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs text-indigo-300 tracking-widest uppercase font-medium">
            AI Prompt Engineering Platform
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
          Build Prompts That{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Actually Work
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Kido AI gives you a structured prompt builder with real-time token
          interpolation, category management, and a library of saved prompts —
          all in a sleek, distraction-free workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/kido/auth/signup"
            className="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25"
          >
            Start Building Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/kido/auth/signin"
            className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Zap,
              color: "text-indigo-400",
              bg: "bg-indigo-500/10 border-indigo-500/20",
              title: "Real-Time Interpolation",
              desc: "Variables like {tone}, {audience}, and {goal} are woven into your prompt live as you type.",
            },
            {
              icon: Layers,
              color: "text-violet-400",
              bg: "bg-violet-500/10 border-violet-500/20",
              title: "Structured Builder",
              desc: "Category, tone, style, audience, goal — every dimension of a great prompt, organized.",
            },
            {
              icon: Shield,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
              title: "Admin Gated Access",
              desc: "Every new account is reviewed by an admin before access is granted. Zero spam.",
            },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 hover:border-slate-700/60 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} border flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-6 text-center">
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Kido AI. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
