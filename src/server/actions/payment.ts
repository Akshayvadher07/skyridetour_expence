"use server";

// =============================================================================
// SkyRideTour — Payment Tracking (Step 13)
// Fields: paymentDate (not paidAt), paymentMethod (not method)
// =============================================================================

import { revalidatePath } from "next/cache";
import { prisma }         from "@/lib/prisma";
import { z }              from "zod";
import type { ActionResult } from "@/types";
import type { Prisma }       from "@prisma/client";

export type PaymentRecord = Prisma.PaymentGetPayload<{ select: {
  id: true; amount: true; paymentMethod: true; paymentDate: true; notes: true;
} }>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const recordPaymentSchema = z.object({
  tripId:      z.string().min(1),
  amount:      z.coerce.number().positive("Payment amount must be greater than 0"),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "OTHER"]).default("CASH"),
  paymentDate: z.string().optional(),
  notes:       z.string().max(500).optional().or(z.literal("")),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function recalculatePaymentStatus(tripId: string): Promise<void> {
  const trip = await prisma.trip.findUnique({
    where:  { id: tripId },
    select: { tripAmount: true },
  });
  if (!trip) return;

  const agg = await prisma.payment.aggregate({
    where: { tripId },
    _sum:  { amount: true },
  });

  const totalPaid  = Number(agg._sum.amount ?? 0);
  const tripAmount = Number(trip.tripAmount);

  const paymentStatus =
    totalPaid <= 0            ? "PENDING"
    : totalPaid >= tripAmount ? "PAID"
    :                           "PARTIAL";

  await prisma.trip.update({
    where: { id: tripId },
    data:  { paymentStatus },
  });
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getPaymentsForTrip(
  tripId: string
): Promise<ActionResult<{
  payments:   PaymentRecord[];
  totalPaid:  number;
  balance:    number;
  tripAmount: number;
}>> {
  try {
    const [trip, payments] = await Promise.all([
      prisma.trip.findUnique({ where: { id: tripId }, select: { tripAmount: true } }),
      prisma.payment.findMany({
        where:   { tripId },
        orderBy: { paymentDate: "desc" },
        select:  { id: true, amount: true, paymentMethod: true, paymentDate: true, notes: true },
      }),
    ]);

    if (!trip) return { success: false, error: "Trip not found." };

    const totalPaid  = payments.reduce((s, p) => s + Number(p.amount), 0);
    const tripAmount = Number(trip.tripAmount);
    const balance    = Math.max(0, tripAmount - totalPaid);

    return { success: true, data: { payments, totalPaid, balance, tripAmount } };
  } catch (err) {
    console.error("[getPaymentsForTrip]", err);
    return { success: false, error: "Failed to fetch payments." };
  }
}

export async function recordPayment(
  data: RecordPaymentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = recordPaymentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }
    const d = parsed.data;

    const payment = await prisma.payment.create({
      data: {
        tripId:        d.tripId,
        amount:        d.amount,
        paymentMethod: d.paymentMethod,
        paymentDate:   d.paymentDate ? new Date(d.paymentDate) : new Date(),
        notes:         d.notes || null,
      },
      select: { id: true },
    });

    await recalculatePaymentStatus(d.tripId);
    revalidatePath(`/trips/${d.tripId}`);
    revalidatePath("/trips");
    revalidatePath("/dashboard");
    return { success: true, data: payment };
  } catch (err) {
    console.error("[recordPayment]", err);
    return { success: false, error: "Failed to record payment." };
  }
}

export async function deletePayment(
  paymentId: string,
  tripId:    string
): Promise<ActionResult<{ id: string }>> {
  try {
    await prisma.payment.delete({ where: { id: paymentId } });
    await recalculatePaymentStatus(tripId);
    revalidatePath(`/trips/${tripId}`);
    revalidatePath("/trips");
    return { success: true, data: { id: paymentId } };
  } catch (err) {
    console.error("[deletePayment]", err);
    return { success: false, error: "Failed to delete payment." };
  }
}
