import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Sparkles, BookMarked, Star, ArrowRight, TrendingUp } from "lucide-react";

export default async function KidoDashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [totalPrompts, favoritePrompts, recentPrompts] = await Promise.all([
    prisma.prompt.count({ where: { userId } }),
    prisma.prompt.count({ where: { userId, isFavorite: true } }),
    prisma.prompt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        tone: true,
        createdAt: true,
        isFavorite: true,
      },
    }),
  ]);

  const stats = [
    {
      label: "Total Prompts",
      value: totalPrompts,
      icon: BookMarked,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Favorites",
      value: favoritePrompts,
      icon: Star,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "This Month",
      value: recentPrompts.length,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome back, {session!.user.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Your AI prompt workspace is ready.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5"
          >
            <div className={`w-9 h-9 rounded-xl ${bg} border flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-medium">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/kido/dashboard/builder"
          className="group bg-gradient-to-br from-indigo-500/10 to-purple-600/10 hover:from-indigo-500/20 hover:to-purple-600/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl p-6 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <h3 className="font-semibold text-white tracking-tight">Build a Prompt</h3>
          <p className="text-sm text-slate-400 mt-1">
            Use the structured builder with real-time token interpolation.
          </p>
        </Link>

        <Link
          href="/kido/dashboard/prompts"
          className="group bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/60 rounded-2xl p-6 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center">
              <BookMarked className="w-5 h-5 text-slate-300" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <h3 className="font-semibold text-white tracking-tight">My Prompts</h3>
          <p className="text-sm text-slate-400 mt-1">
            Browse, search, and manage your saved prompt library.
          </p>
        </Link>
      </div>

      {/* Recent Prompts */}
      {recentPrompts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest">
              Recent Prompts
            </h2>
            <Link
              href="/kido/dashboard/prompts"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentPrompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/kido/dashboard/prompts/${prompt.id}`}
                className="flex items-center justify-between bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/60 rounded-xl px-4 py-3 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {prompt.isFavorite && (
                    <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                  )}
                  <span className="text-sm text-white font-medium truncate">
                    {prompt.title}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full shrink-0">
                    {prompt.category}
                  </span>
                </div>
                <span className="text-xs text-slate-600 shrink-0 ml-3">
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
