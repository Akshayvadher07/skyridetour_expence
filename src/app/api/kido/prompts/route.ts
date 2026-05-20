import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────
const CreatePromptSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  category: z.string().min(1, "Category is required"),
  tone: z.string().min(1, "Tone is required"),
  style: z.string().min(1, "Style is required"),
  audience: z.string().min(1, "Audience is required"),
  goal: z.string().min(1, "Goal is required"),
  keywords: z.array(z.string()).default([]),
  length: z.string().min(1, "Length is required"),
  language: z.string().min(1, "Language is required"),
  instructions: z.string().optional(),
  finalPrompt: z.string().min(1, "Final prompt is required"),
  isFavorite: z.boolean().default(false),
});

// ─── GET /api/kido/prompts ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const favoritesOnly = searchParams.get("favorites") === "true";
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: session.user.id };
    if (favoritesOnly) where.isFavorite = true;
    if (category && category !== "all") where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { finalPrompt: { contains: search, mode: "insensitive" } },
      ];
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
          instructions: true,
          finalPrompt: true,
          isFavorite: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.prompt.count({ where }),
    ]);

    return NextResponse.json({
      prompts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[KIDO_PROMPTS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

// ─── POST /api/kido/prompts ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.create({
      data: { ...parsed.data, userId: session.user.id },
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error("[KIDO_PROMPTS_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
  }
}
