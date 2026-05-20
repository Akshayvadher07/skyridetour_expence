import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PromptDetailView from "@/components/kido/PromptDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PromptDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const prompt = await prisma.prompt.findFirst({
    where: { id, userId: session!.user.id },
  });

  if (!prompt) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <PromptDetailView prompt={prompt} />
    </div>
  );
}
