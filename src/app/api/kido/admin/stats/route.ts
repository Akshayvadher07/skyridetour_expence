import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/kido/admin/stats ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      totalPrompts,
      recentUsers,
      recentPrompts,
      promptsByCategory,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { approved: false, role: "USER" } }),
      prisma.user.count({ where: { approved: true } }),
      prisma.prompt.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, approved: true, createdAt: true },
      }),
      prisma.prompt.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.prompt.groupBy({
        by: ["category"],
        _count: { _all: true },
        orderBy: { _count: { category: "desc" } },
      }),
    ]);

    return NextResponse.json({
      stats: { totalUsers, pendingUsers, approvedUsers, totalPrompts },
      recentUsers,
      recentPrompts,
      promptsByCategory: promptsByCategory.map((p) => ({
        category: p.category,
        count: p._count._all,
      })),
    });
  } catch (error) {
    console.error("[KIDO_ADMIN_STATS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
