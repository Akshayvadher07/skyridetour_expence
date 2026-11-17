// src/app/(dashboard)/loading.tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      <p className="text-sm font-medium text-[var(--muted-foreground)]">Loading SkyRideTour...</p>
    </div>
  );
}
