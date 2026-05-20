import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdatePromptSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  category: z.string().optional(),
  tone: z.string().optional(),
  style: z.string().optional(),
  audience: z.string().optional(),
  goal: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  length: z.string().optional(),
  language: z.string().optional(),
  instructions: z.string().optional(),
  finalPrompt: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

// ─── GET /api/kido/prompts/[id] ───────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const prompt = await prisma.prompt.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("[KIDO_PROMPT_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 });
  }
}

// ─── PATCH /api/kido/prompts/[id] ─────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = UpdatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Ensure ownership
    const existing = await prisma.prompt.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const updated = await prisma.prompt.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ prompt: updated });
  } catch (error) {
    console.error("[KIDO_PROMPT_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}

// ─── DELETE /api/kido/prompts/[id] ────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Ensure ownership
    const existing = await prisma.prompt.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    await prisma.prompt.delete({ where: { id } });

    return NextResponse.json({ message: "Prompt deleted successfully" });
  } catch (error) {
    console.error("[KIDO_PROMPT_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}
