// =============================================================================
// SkyRideTour — Vehicle Detail Page (Server Component)
// =============================================================================

import { notFound }                from "next/navigation";
import Link                        from "next/link";
import { getVehicleById }          from "@/server/actions/vehicle";
import { VehicleDetailClient }     from "@/components/vehicles/VehicleDetailClient";
import { ArrowLeft }               from "lucide-react";
import type { Metadata }           from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getVehicleById(id);
  if (!result.success) return { title: "Vehicle Not Found" };
  return { title: `${result.data.name} · Fleet` };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getVehicleById(id);

  if (!result.success) notFound();

  return (
    <div className="space-y-5 max-w-5xl">
      <Link
        href="/vehicles"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]
          hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Fleet
      </Link>
      <VehicleDetailClient vehicle={result.data} stats={result.data.stats} />
    </div>
  );
}
