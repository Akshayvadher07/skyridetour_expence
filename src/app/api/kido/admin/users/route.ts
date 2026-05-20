import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/kido/admin/users ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "all"; // all | pending | approved
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (filter === "pending") where.approved = false;
    if (filter === "approved") where.approved = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        createdAt: true,
        _count: { select: { prompts: true } },
      },
    });

    const stats = await prisma.user.groupBy({
      by: ["approved"],
      _count: { _all: true },
    });

    const pendingCount = stats.find((s) => s.approved === false)?._count._all ?? 0;
    const approvedCount = stats.find((s) => s.approved === true)?._count._all ?? 0;

    return NextResponse.json({ users, stats: { pending: pendingCount, approved: approvedCount } });
  } catch (error) {
    console.error("[KIDO_ADMIN_USERS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
