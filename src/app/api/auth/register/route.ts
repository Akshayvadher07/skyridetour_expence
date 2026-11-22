import { Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth-utils";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validators/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for") ?? undefined);
    if (!(await consumeRateLimit("register-ip", ip, 5, 60 * 60 * 1000))) {
      return jsonResponse({ error: "Too many registration attempts. Try again later." }, 429);
    }

    const payload: unknown = await request.json().catch(() => null);
    const parsed = registrationSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.issues[0]?.message ?? "Invalid registration details." }, 400);
    }

    const { name, email, phone, password } = parsed.data;
    if (!(await consumeRateLimit("register-email", email, 3, 60 * 60 * 1000))) {
      return jsonResponse({ error: "Too many registration attempts. Try again later." }, 429);
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      return jsonResponse({ error: "An account with this email already exists." }, 409);
    }

    await prisma.user.create({
      data: {
        name,
        email,
        phone: phone.replace(/[^\d+]/g, ""),
        passwordHash: await hashPassword(password),
        role: UserRole.CLIENT,
      },
      select: { id: true },
    });

    return jsonResponse({ status: "created" }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonResponse({ error: "An account with this email already exists." }, 409);
    }
    console.error("[REGISTER] Registration failed:", error instanceof Error ? error.name : "UnknownError");
    return jsonResponse({ error: "Registration is temporarily unavailable." }, 503);
  }
}