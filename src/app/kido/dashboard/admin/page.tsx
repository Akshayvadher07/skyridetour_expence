import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  BookMarked,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default async function KidoAdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/kido/dashboard");

  const [
    totalUsers,
    pendingUsers,
    approvedUsers,
    totalPrompts,
    recentUsers,
    promptsByCategory,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { approved: false, role: "CLIENT" } }),
    prisma.user.count({ where: { approved: true } }),
    prisma.prompt.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        createdAt: true,
        _count: { select: { prompts: true } },
      },
    }),
    prisma.prompt.groupBy({
      by: ["category"],
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
      take: 6,
    }),
  ]);

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Pending Approval",
      value: pendingUsers,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      urgent: pendingUsers > 0,
    },
    {
      label: "Approved Users",
      value: approvedUsers,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Total Prompts",
      value: totalPrompts,
      icon: BookMarked,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Overview</h1>
        <p className="text-sm text-slate-400 mt-1">
          Platform health and user management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, urgent }) => (
          <div
            key={label}
            className={`bg-slate-900/40 backdrop-blur-md border rounded-2xl p-5 ${
              urgent ? "border-amber-500/30" : "border-slate-800/60"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl ${bg} border flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-medium">
              {label}
            </p>
            {urgent && (
              <p className="text-[10px] text-amber-400 mt-1 font-medium">
                Needs attention
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">Recent Users</span>
            </div>
            <Link
              href="/kido/dashboard/admin/users"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Manage all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/40">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {user.name ?? "—"}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-[10px] text-slate-500">
                    {user._count.prompts} prompts
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      user.approved
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {user.approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prompts by Category */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800/60">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-white">Top Categories</span>
          </div>
          <div className="p-5 space-y-3">
            {promptsByCategory.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No prompts yet</p>
            ) : (
              promptsByCategory.map((cat) => {
                const pct = totalPrompts > 0 ? (cat._count._all / totalPrompts) * 100 : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{cat.category}</span>
                      <span className="text-xs text-slate-500">{cat._count._all}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
