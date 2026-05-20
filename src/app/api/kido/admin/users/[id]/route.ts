import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ActionSchema = z.object({
  action: z.enum(["approve", "reject", "promote", "demote"]),
});

// ─── PATCH /api/kido/admin/users/[id] ─────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { action } = parsed.data;

    // Prevent self-modification
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot modify your own account" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "approve":
        updateData = { approved: true };
        break;
      case "reject":
        updateData = { approved: false };
        break;
      case "promote":
        updateData = { role: "ADMIN", approved: true };
        break;
      case "demote":
        updateData = { role: "CLIENT" };
        break;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, approved: true },
    });

    return NextResponse.json({ user: updated, message: `User ${action}d successfully` });
  } catch (error) {
    console.error("[KIDO_ADMIN_USER_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// ─── DELETE /api/kido/admin/users/[id] ────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("[KIDO_ADMIN_USER_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
