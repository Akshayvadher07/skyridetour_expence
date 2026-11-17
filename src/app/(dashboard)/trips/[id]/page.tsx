// =============================================================================
// SkyRideTour — Trip Detail Page (Step 14) — Server Component
// =============================================================================

import { notFound }         from "next/navigation";
import Link                 from "next/link";
import { getTripById }      from "@/server/actions/trip";
import { TripDetailClient } from "@/components/trips/TripDetailClient";
import { ArrowLeft }        from "lucide-react";
import type { Metadata }    from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getTripById(id);
  if (!result.success) return { title: "Trip Not Found" };
  return { title: `${result.data.tripNumber} · Trips` };
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTripById(id);
  if (!result.success) notFound();

  return (
    <div className="space-y-5 max-w-5xl">
      <Link href="/trips"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Trips
      </Link>
      <TripDetailClient trip={result.data} />
    </div>
  );
}
