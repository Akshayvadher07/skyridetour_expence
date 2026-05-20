import PromptBuilder from "@/components/kido/PromptBuilder";

export default function BuilderPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Prompt Builder</h1>
        <p className="text-sm text-slate-400 mt-1">
          Fill in the fields below. Your prompt is assembled in real-time.
        </p>
      </div>
      <PromptBuilder />
    </div>
  );
}
