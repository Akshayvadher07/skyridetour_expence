import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminUserManager from "@/components/kido/AdminUserManager";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/kido/dashboard");

  const users = await prisma.user.findMany({
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

  const pendingCount = users.filter((u) => !u.approved && u.role === "CLIENT").length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">User Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          {pendingCount > 0 ? (
            <span className="text-amber-400 font-medium">
              {pendingCount} user{pendingCount !== 1 ? "s" : ""} awaiting approval
            </span>
          ) : (
            "All users are up to date"
          )}
        </p>
      </div>
      <AdminUserManager
        initialUsers={users}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
