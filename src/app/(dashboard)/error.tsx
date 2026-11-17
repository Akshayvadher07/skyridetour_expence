"use client";

// src/app/(dashboard)/error.tsx
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Something went wrong</h2>
      <p className="text-sm text-[var(--muted-foreground)] max-w-sm mt-1 mb-6">
        An unexpected error occurred while loading this page.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)]
          hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-sm font-semibold transition-all"
      >
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}
