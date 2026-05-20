"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Copy,
  Save,
  Check,
  Loader2,
  Plus,
  X,
  Star,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Marketing", "Copywriting", "Technical", "Creative Writing",
  "Education", "Research", "Sales", "Customer Support",
  "Product", "Data Analysis", "HR", "Legal", "Other",
];

const TONES = [
  "Professional", "Casual", "Friendly", "Authoritative",
  "Empathetic", "Humorous", "Formal", "Inspirational",
  "Direct", "Conversational",
];

const STYLES = [
  "Instructional", "Narrative", "Analytical", "Persuasive",
  "Descriptive", "Comparative", "Step-by-step", "Q&A",
  "Bullet points", "Essay",
];

const AUDIENCES = [
  "General public", "Developers", "Executives", "Students",
  "Marketers", "Designers", "Sales teams", "Non-technical users",
  "Domain experts", "Children",
];

const LENGTHS = [
  "Short (1-2 sentences)", "Medium (1 paragraph)", "Long (2-3 paragraphs)",
  "Detailed (4+ paragraphs)", "Comprehensive (full document)",
];

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Hindi", "Japanese", "Chinese", "Arabic", "Italian",
];

// ─── Token interpolation engine ───────────────────────────────────────────────
function buildPrompt(fields: PromptFields): string {
  const {
    category, tone, style, audience, goal, keywords, length, language, instructions,
  } = fields;

  if (!goal.trim()) return "";

  const keywordStr =
    keywords.length > 0
      ? `Focus on these key concepts: ${keywords.join(", ")}.`
      : "";

  const instructionStr = instructions?.trim()
    ? `\n\nAdditional instructions: ${instructions.trim()}`
    : "";

  return `You are a ${tone.toLowerCase()} ${category.toLowerCase()} expert writing in a ${style.toLowerCase()} style.

Your target audience is: ${audience}.
Your primary goal is: ${goal.trim()}.
${keywordStr}

Please write a ${length.toLowerCase()} response in ${language}.${instructionStr}`.trim();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PromptFields {
  title: string;
  category: string;
  tone: string;
  style: string;
  audience: string;
  goal: string;
  keywords: string[];
  length: string;
  language: string;
  instructions: string;
  isFavorite: boolean;
}

const DEFAULT_FIELDS: PromptFields = {
  title: "",
  category: "Marketing",
  tone: "Professional",
  style: "Instructional",
  audience: "General public",
  goal: "",
  keywords: [],
  length: "Medium (1 paragraph)",
  language: "English",
  instructions: "",
  isFavorite: false,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PromptBuilder() {
  const router = useRouter();
  const [fields, setFields] = useState<PromptFields>(DEFAULT_FIELDS);
  const [keywordInput, setKeywordInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const finalPrompt = useMemo(() => buildPrompt(fields), [fields]);

  const set = useCallback(
    <K extends keyof PromptFields>(key: K, value: PromptFields[K]) => {
      setFields((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw || fields.keywords.includes(kw) || fields.keywords.length >= 10) return;
    set("keywords", [...fields.keywords, kw]);
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    set("keywords", fields.keywords.filter((k) => k !== kw));
  };

  const handleCopy = async () => {
    if (!finalPrompt) return;
    await navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!fields.title.trim()) {
      toast.error("Please enter a title for your prompt.");
      return;
    }
    if (!finalPrompt) {
      toast.error("Please fill in the Goal field to generate a prompt.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/kido/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, finalPrompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      toast.success("Prompt saved successfully");
      router.push(`/kido/dashboard/prompts/${data.prompt.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save prompt");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFields(DEFAULT_FIELDS);
    setKeywordInput("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: Input Panel ─────────────────────────────────────────────── */}
      <div className="space-y-5">
        {/* Title + Favorite */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 space-y-4">
          <SectionLabel>Prompt Identity</SectionLabel>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <FieldLabel>Title</FieldLabel>
              <input
                type="text"
                value={fields.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Product launch email sequence"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Favorite</FieldLabel>
              <button
                type="button"
                onClick={() => set("isFavorite", !fields.isFavorite)}
                className={cn(
                  "h-[42px] w-[42px] rounded-xl border flex items-center justify-center transition-all",
                  fields.isFavorite
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-500 hover:text-amber-400"
                )}
              >
                <Star className={cn("w-4 h-4", fields.isFavorite && "fill-amber-400")} />
              </button>
            </div>
          </div>
        </div>

        {/* Core Parameters */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 space-y-4">
          <SectionLabel>Core Parameters</SectionLabel>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Category"
              value={fields.category}
              options={CATEGORIES}
              onChange={(v) => set("category", v)}
            />
            <SelectField
              label="Tone"
              value={fields.tone}
              options={TONES}
              onChange={(v) => set("tone", v)}
            />
            <SelectField
              label="Style"
              value={fields.style}
              options={STYLES}
              onChange={(v) => set("style", v)}
            />
            <SelectField
              label="Audience"
              value={fields.audience}
              options={AUDIENCES}
              onChange={(v) => set("audience", v)}
            />
            <SelectField
              label="Length"
              value={fields.length}
              options={LENGTHS}
              onChange={(v) => set("length", v)}
            />
            <SelectField
              label="Language"
              value={fields.language}
              options={LANGUAGES}
              onChange={(v) => set("language", v)}
            />
          </div>
        </div>

        {/* Goal */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 space-y-4">
          <SectionLabel>Goal & Context</SectionLabel>

          <div className="space-y-1.5">
            <FieldLabel>
              Goal{" "}
              <span className="text-indigo-400 normal-case font-normal">
                (drives the prompt)
              </span>
            </FieldLabel>
            <textarea
              value={fields.goal}
              onChange={(e) => set("goal", e.target.value)}
              placeholder="Describe what you want the AI to accomplish…"
              rows={3}
              className={cn(inputCls, "resize-none")}
            />
          </div>

          {/* Keywords */}
          <div className="space-y-1.5">
            <FieldLabel>Keywords</FieldLabel>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Add keyword, press Enter"
                className={cn(inputCls, "flex-1")}
              />
              <button
                type="button"
                onClick={addKeyword}
                className="px-3 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/20 rounded-xl text-indigo-400 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {fields.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {fields.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="text-indigo-400/60 hover:text-indigo-300 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Additional Instructions */}
          <div className="space-y-1.5">
            <FieldLabel>Additional Instructions (optional)</FieldLabel>
            <textarea
              value={fields.instructions}
              onChange={(e) => set("instructions", e.target.value)}
              placeholder="Any specific constraints, format requirements, or extra context…"
              rows={2}
              className={cn(inputCls, "resize-none")}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-3 rounded-xl border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 text-sm font-medium transition-all"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !finalPrompt || !fields.title.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Prompt
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Right: Live Preview ───────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-6 h-fit">
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl overflow-hidden">
          {/* Preview header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white tracking-tight">
                Live Preview
              </span>
              {finalPrompt && (
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-medium">
                  Ready
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!finalPrompt}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-lg transition-all"
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

          {/* Token badges */}
          <div className="px-5 py-3 border-b border-slate-800/40 flex flex-wrap gap-2">
            {[
              { label: "tone", value: fields.tone },
              { label: "category", value: fields.category },
              { label: "style", value: fields.style },
              { label: "audience", value: fields.audience },
              { label: "length", value: fields.length },
              { label: "language", value: fields.language },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/40 rounded-lg px-2 py-1"
              >
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                  {label}:
                </span>
                <span className="text-[10px] text-indigo-300 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Prompt output */}
          <div className="p-5 min-h-64">
            {finalPrompt ? (
              <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-[family-name:var(--font-kido)]">
                {finalPrompt}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Sparkles className="w-8 h-8 text-slate-700 mb-3" />
                <p className="text-sm text-slate-600">
                  Fill in the <span className="text-indigo-400">Goal</span> field to
                  generate your prompt
                </p>
              </div>
            )}
          </div>

          {/* Character count */}
          {finalPrompt && (
            <div className="px-5 py-3 border-t border-slate-800/40 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                {finalPrompt.length} characters
              </span>
              <span className="text-xs text-slate-600">
                ~{Math.ceil(finalPrompt.split(/\s+/).length / 4)} tokens
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-slate-400 uppercase tracking-widest block">
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 pr-9 text-sm text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-900">
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
      </div>
    </div>
  );
}
