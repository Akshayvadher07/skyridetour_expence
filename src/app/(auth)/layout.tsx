import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to SkyRideTour business management portal",
  robots: "noindex, nofollow",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--sidebar)] flex items-center justify-center relative overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient glow — top right */}
      <div
        aria-hidden="true"
        className="absolute top-[-8%] right-[-4%] w-[500px] h-[500px]
          rounded-full bg-[var(--primary)] opacity-[0.07] blur-3xl pointer-events-none"
      />

      {/* Ambient glow — bottom left */}
      <div
        aria-hidden="true"
        className="absolute bottom-[-10%] left-[-6%] w-96 h-96
          rounded-full bg-blue-500 opacity-[0.05] blur-3xl pointer-events-none"
      />

      {/* Route indicator dot — top left corner */}
      <div className="absolute top-4 left-5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white/20 text-[11px] font-mono tracking-widest">SECURE</span>
      </div>

      {/* Content */}
      <main className="relative z-10 w-full py-8">{children}</main>
    </div>
  );
}
