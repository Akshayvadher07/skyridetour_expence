// src/app/(dashboard)/reports/page.tsx
import { getReportsData } from "@/server/actions/reports";
import { ReportsClient }  from "@/components/reports/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const result = await getReportsData();

  if (!result.success) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)]">Failed to load analytics.</p>
      </div>
    );
  }

  return <ReportsClient initialData={result.data} />;
}
