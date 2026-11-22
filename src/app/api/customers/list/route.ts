// src/app/api/customers/list/route.ts
// Returns distinct inline customer names & phones from recent trips for optional autocompletion

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role === "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const trips = await prisma.trip.findMany({
      select: { customerName: true, customerPhone: true },
      distinct: ["customerPhone"],
      orderBy: { date: "desc" },
      take: 100,
    });
    const customers = trips.map((t) => ({
      name:  t.customerName,
      phone: t.customerPhone,
    }));
    return NextResponse.json({ data: customers });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
