"use client";

// =============================================================================
// SkyRideTour — Command Palette Modal (Step 18)
// Triggered via Cmd+K / Ctrl+K or search bar click in Header.
// =============================================================================

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X, User, Route, Car, UserCheck, ArrowRight, Loader2 } from "lucide-react";
import { globalSearch, type SearchResultItem } from "@/server/actions/search";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  customer: User,
  trip:     Route,
  vehicle:  Car,
  driver:   UserCheck,
};

const TYPE_COLORS = {
  customer: "bg-blue-50 text-blue-600",
  trip:     "bg-emerald-50 text-emerald-600",
  vehicle:  "bg-violet-50 text-violet-600",
  driver:   "bg-amber-50 text-amber-600",
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isPending, startTx]  = useTransition();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const t = setTimeout(() => {
      startTx(async () => {
        const res = await globalSearch(query);
        if (res.success) setResults(res.data);
      });
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border border-[var(--border)] shadow-2xl">
        <div className="flex items-center px-4 border-b border-[var(--border)] bg-[var(--card)]">
          <Search className="w-5 h-5 text-[var(--muted-foreground)] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, trips, vehicles, drivers... (Cmd+K)"
            autoFocus
            className="w-full px-3 py-4 text-base bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
          />
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
          ) : query ? (
            <button onClick={() => setQuery("")} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        <div className="max-h-[350px] overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
              Type at least 2 characters to search across SkyRideTour.
            </div>
          ) : results.length === 0 && !isPending ? (
            <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item) => {
                const Icon = TYPE_ICONS[item.type];
                const color = TYPE_COLORS[item.type];
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item.url)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--muted)]/50 transition-colors text-left group"
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{item.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
