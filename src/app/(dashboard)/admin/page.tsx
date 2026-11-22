import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/server/actions/dashboard";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  const result = await getDashboardData();
  if (!result.success) {
    return <p className="py-20 text-center text-[var(--muted-foreground)]">Failed to load dashboard data.</p>;
  }
  return <DashboardClient data={result.data} />;
}