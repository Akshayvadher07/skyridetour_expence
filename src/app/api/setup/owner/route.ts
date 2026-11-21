import { createHash, timingSafeEqual } from "node:crypto";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { hashPassword, validatePasswordStrength } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailSchema = z.string().email();

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function hasValidToken(request: Request, expectedToken: string): boolean {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const providedToken = match?.[1] ?? "";
  const expectedDigest = createHash("sha256").update(expectedToken).digest();
  const providedDigest = createHash("sha256").update(providedToken).digest();

  return timingSafeEqual(expectedDigest, providedDigest);
}

export async function POST(request: Request) {
  const initializationToken = process.env.OWNER_INIT_TOKEN;
  if (!initializationToken || initializationToken.length < 32) {
    return jsonResponse({ error: "Owner initialization is not configured." }, 503);
  }

  if (!hasValidToken(request, initializationToken)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  try {
    const existingOwner = await prisma.user.findFirst({
      where: { role: UserRole.OWNER },
      select: { id: true },
    });

    if (existingOwner) {
      return jsonResponse({ status: "already_initialized" });
    }

    const rawEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_OWNER_PASSWORD;
    const emailResult = emailSchema.safeParse(rawEmail);

    if (!emailResult.success || !password || validatePasswordStrength(password)) {
      return jsonResponse({ error: "Owner initialization is not configured." }, 503);
    }

    const emailConflict = await prisma.user.findUnique({
      where: { email: emailResult.data },
      select: { id: true },
    });

    if (emailConflict) {
      return jsonResponse({ error: "An account already uses the configured owner email." }, 409);
    }

    const passwordHash = await hashPassword(password);

    try {
      await prisma.user.create({
        data: {
          name: "SkyRide Owner",
          email: emailResult.data,
          passwordHash,
          role: UserRole.OWNER,
        },
        select: { id: true },
      });
    } catch {
      const ownerAfterConflict = await prisma.user.findFirst({
        where: { role: UserRole.OWNER },
        select: { id: true },
      });

      if (ownerAfterConflict) {
        return jsonResponse({ status: "already_initialized" });
      }

      return jsonResponse({ error: "Owner initialization could not be completed." }, 409);
    }

    return jsonResponse({ status: "initialized" }, 201);
  } catch {
    return jsonResponse({ error: "Owner initialization failed." }, 500);
  }
}