// src/app/(dashboard)/drivers/[id]/page.tsx
import { notFound } from "next/navigation";
import Link         from "next/link";
import { getDriverById } from "@/server/actions/driver";
import { DriverDetailClient } from "@/components/drivers/DriverDetailClient";
import { ArrowLeft }    from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getDriverById(id);
  if (!result.success) return { title: "Driver Not Found" };
  return { title: `${result.data.name} · Drivers` };
}

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getDriverById(id);
  if (!result.success) notFound();

  return (
    <div className="space-y-5 max-w-5xl">
      <Link href="/drivers"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Drivers
      </Link>
      <DriverDetailClient driver={result.data} stats={result.data.stats} />
    </div>
  );
}
