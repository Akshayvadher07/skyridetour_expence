import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PromptLibrary from "@/components/kido/PromptLibrary";

export default async function PromptsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const prompts = await prisma.prompt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      tone: true,
      style: true,
      audience: true,
      goal: true,
      keywords: true,
      length: true,
      language: true,
      finalPrompt: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">My Prompts</h1>
        <p className="text-sm text-slate-400 mt-1">
          {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} saved
        </p>
      </div>
      <PromptLibrary initialPrompts={prompts} />
    </div>
  );
}
