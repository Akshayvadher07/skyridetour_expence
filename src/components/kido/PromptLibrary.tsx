"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Star,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Filter,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Prompt {
  id: string;
  title: string;
  category: string;
  tone: string;
  style: string;
  audience: string;
  goal: string;
  keywords: string[];
  length: string;
  language: string;
  finalPrompt: string;
  isFavorite: boolean;
  createdAt: Date | string;
}

interface PromptLibraryProps {
  initialPrompts: Prompt[];
}

export default function PromptLibrary({ initialPrompts }: PromptLibraryProps) {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Unique categories from prompts
  const categories = useMemo(() => {
    const cats = [...new Set(prompts.map((p) => p.category))].sort();
    return ["all", ...cats];
  }, [prompts]);

  // Filtered prompts
  const filtered = useMemo(() => {
    return prompts.filter((p) => {
      if (favoritesOnly && !p.isFavorite) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.finalPrompt.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [prompts, search, categoryFilter, favoritesOnly]);

  const handleCopy = async (prompt: Prompt) => {
    await navigator.clipboard.writeText(prompt.finalPrompt);
    setCopiedId(prompt.id);
    toast.success("Prompt copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleFavorite = async (prompt: Prompt) => {
    const newVal = !prompt.isFavorite;
    // Optimistic update
    setPrompts((prev) =>
      prev.map((p) => (p.id === prompt.id ? { ...p, isFavorite: newVal } : p))
    );

    try {
      const res = await fetch(`/api/kido/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newVal }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(newVal ? "Added to favorites" : "Removed from favorites");
    } catch {
      // Revert
      setPrompts((prev) =>
        prev.map((p) => (p.id === prompt.id ? { ...p, isFavorite: !newVal } : p))
      );
      toast.error("Failed to update favorite");
    }
  };

  const handleDelete = async (prompt: Prompt) => {
    if (!confirm(`Delete "${prompt.title}"? This cannot be undone.`)) return;

    setDeletingId(prompt.id);
    try {
      const res = await fetch(`/api/kido/prompts/${prompt.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setPrompts((prev) => prev.filter((p) => p.id !== prompt.id));
      toast.success("Prompt deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete prompt");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts…"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 capitalize">
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Favorites toggle */}
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
              favoritesOnly
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", favoritesOnly && "fill-amber-400")} />
            Favorites
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing <span className="text-white font-medium">{filtered.length}</span> of{" "}
          {prompts.length} prompts
        </p>
        <Link
          href="/kido/dashboard/builder"
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          New Prompt
        </Link>
      </div>

      {/* Prompt Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookMarked className="w-10 h-10 text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm">
            {prompts.length === 0
              ? "No prompts yet. Build your first one!"
              : "No prompts match your filters."}
          </p>
          {prompts.length === 0 && (
            <Link
              href="/kido/dashboard/builder"
              className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Go to Builder →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              copiedId={copiedId}
              deletingId={deletingId}
              onCopy={handleCopy}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Prompt Card ──────────────────────────────────────────────────────────────
function PromptCard({
  prompt,
  copiedId,
  deletingId,
  onCopy,
  onToggleFavorite,
  onDelete,
}: {
  prompt: Prompt;
  copiedId: string | null;
  deletingId: string | null;
  onCopy: (p: Prompt) => void;
  onToggleFavorite: (p: Prompt) => void;
  onDelete: (p: Prompt) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 hover:border-slate-700/60 rounded-2xl overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/kido/dashboard/prompts/${prompt.id}`}
              className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors truncate"
            >
              {prompt.title}
            </Link>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-widest font-medium shrink-0">
              {prompt.category}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <MetaBadge label="Tone" value={prompt.tone} />
            <MetaBadge label="Style" value={prompt.style} />
            <MetaBadge label="Lang" value={prompt.language} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          <ActionBtn
            onClick={() => onToggleFavorite(prompt)}
            title={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              prompt.isFavorite
                ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                : "text-slate-500 hover:text-amber-400"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", prompt.isFavorite && "fill-amber-400")} />
          </ActionBtn>
          <ActionBtn
            onClick={() => onCopy(prompt)}
            title="Copy prompt"
            className={copiedId === prompt.id ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-500 hover:text-white"}
          >
            {copiedId === prompt.id ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </ActionBtn>
          <ActionBtn
            onClick={() => onDelete(prompt)}
            title="Delete prompt"
            disabled={deletingId === prompt.id}
            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </ActionBtn>
        </div>
      </div>

      {/* Prompt preview */}
      <div
        className="px-5 pb-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <p
          className={cn(
            "text-xs text-slate-400 leading-relaxed transition-all",
            !expanded && "line-clamp-2"
          )}
        >
          {prompt.finalPrompt}
        </p>
        <button
          type="button"
          className="text-[10px] text-indigo-400 hover:text-indigo-300 mt-1.5 transition-colors"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      </div>

      {/* Keywords */}
      {prompt.keywords.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-1.5">
          {prompt.keywords.map((kw) => (
            <span
              key={kw}
              className="text-[10px] bg-slate-800/60 border border-slate-700/40 text-slate-400 px-2 py-0.5 rounded-full"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-slate-800/40 flex items-center justify-between">
        <span className="text-[10px] text-slate-600">
          {new Date(prompt.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="text-[10px] text-slate-600">
          {prompt.finalPrompt.length} chars
        </span>
      </div>
    </div>
  );
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[10px] text-slate-500">
      <span className="text-slate-600 uppercase tracking-widest">{label}: </span>
      {value}
    </span>
  );
}

function ActionBtn({
  children,
  onClick,
  title,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "w-7 h-7 rounded-lg border border-slate-700/60 flex items-center justify-center transition-all disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}
