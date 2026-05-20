"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Star,
  Trash2,
  Sparkles,
  Loader2,
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
  instructions: string | null;
  finalPrompt: string;
  isFavorite: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function PromptDetailView({ prompt: initial }: { prompt: Prompt }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.finalPrompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFavorite = async () => {
    const newVal = !prompt.isFavorite;
    setPrompt((p) => ({ ...p, isFavorite: newVal }));
    try {
      const res = await fetch(`/api/kido/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newVal }),
      });
      if (!res.ok) throw new Error();
      toast.success(newVal ? "Added to favorites" : "Removed from favorites");
    } catch {
      setPrompt((p) => ({ ...p, isFavorite: !newVal }));
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${prompt.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/kido/prompts/${prompt.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Prompt deleted");
      router.push("/kido/dashboard/prompts");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  const meta = [
    { label: "Category", value: prompt.category },
    { label: "Tone", value: prompt.tone },
    { label: "Style", value: prompt.style },
    { label: "Audience", value: prompt.audience },
    { label: "Length", value: prompt.length },
    { label: "Language", value: prompt.language },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/kido/dashboard/prompts"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Prompts
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
              prompt.isFavorite
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-amber-400"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", prompt.isFavorite && "fill-amber-400")} />
            {prompt.isFavorite ? "Favorited" : "Favorite"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800/60 text-slate-400 hover:text-white text-xs font-medium transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800/60 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 text-xs font-medium transition-all disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{prompt.title}</h1>
        <p className="text-xs text-slate-500 mt-1">
          Created{" "}
          {new Date(prompt.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {meta.map(({ label, value }) => (
          <div
            key={label}
            className="bg-slate-900/40 border border-slate-800/60 rounded-xl px-4 py-3"
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1">
              {label}
            </p>
            <p className="text-sm text-white font-medium">{value}</p>
          </div>
        ))}
      </div>

      {/* Goal */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-2">
          Goal
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">{prompt.goal}</p>
      </div>

      {/* Keywords */}
      {prompt.keywords.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-3">
            Keywords
          </p>
          <div className="flex flex-wrap gap-2">
            {prompt.keywords.map((kw) => (
              <span
                key={kw}
                className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {prompt.instructions && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-2">
            Additional Instructions
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{prompt.instructions}</p>
        </div>
      )}

      {/* Final Prompt */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">Final Prompt</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-lg transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="p-5">
          <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
            {prompt.finalPrompt}
          </pre>
        </div>
        <div className="px-5 py-3 border-t border-slate-800/40 flex items-center justify-between">
          <span className="text-xs text-slate-600">{prompt.finalPrompt.length} characters</span>
          <span className="text-xs text-slate-600">
            ~{Math.ceil(prompt.finalPrompt.split(/\s+/).length / 4)} tokens
          </span>
        </div>
      </div>
    </div>
  );
}
