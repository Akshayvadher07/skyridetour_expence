// =============================================================================
// SkyRideTour — Executive Dashboard Page (Step 16) — Server Component
// =============================================================================

import { getDashboardData } from "@/server/actions/dashboard";
import { DashboardClient }  from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await getDashboardData();

  if (!result.success) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-[var(--muted-foreground)] font-medium">Failed to load dashboard data</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 opacity-60">{result.error}</p>
        </div>
      </div>
    );
  }

  return <DashboardClient data={result.data} />;
}
