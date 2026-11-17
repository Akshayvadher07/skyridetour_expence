"use server";

// =============================================================================
// SkyRideTour — Invoice Server Actions
// Inline Customer Details (Name, Phone, Email, Address from Trip)
// =============================================================================

import { revalidatePath }  from "next/cache";
import { prisma }          from "@/lib/prisma";
import type { ActionResult } from "@/types";
import type { Prisma }       from "@prisma/client";

export type InvoiceDetail = Prisma.InvoiceGetPayload<{
  include: {
    trip: {
      include: {
        vehicle:  { select: { name: true; registrationNumber: true } };
        driver:   { select: { name: true; phone: true } };
        payments: { orderBy: { paymentDate: "desc" } };
      };
    };
  };
}>;

async function generateInvoiceNumber(): Promise<string> {
  const year   = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const last = await prisma.invoice.findFirst({
    where:   { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select:  { invoiceNumber: true },
  });

  const seq = last
    ? parseInt(last.invoiceNumber.replace(prefix, ""), 10) + 1
    : 1;

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/**
 * Get or create an invoice for a specific trip.
 */
export async function getOrCreateInvoiceForTrip(
  tripId: string
): Promise<ActionResult<InvoiceDetail>> {
  try {
    const existing = await prisma.invoice.findUnique({
      where: { tripId },
      include: {
        trip: {
          include: {
            vehicle:  { select: { name: true, registrationNumber: true } },
            driver:   { select: { name: true, phone: true } },
            payments: { orderBy: { paymentDate: "desc" } },
          },
        },
      },
    });

    if (existing) {
      return { success: true, data: existing };
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { payments: true },
    });

    if (!trip) return { success: false, error: "Trip not found." };

    const invoiceNumber = await generateInvoiceNumber();
    const paidAmount    = trip.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        tripId:      trip.id,
        issueDate:   new Date(),
        totalAmount: trip.tripAmount,
        discount:    0,
        paidAmount,
        status:      trip.paymentStatus,
      },
      include: {
        trip: {
          include: {
            vehicle:  { select: { name: true, registrationNumber: true } },
            driver:   { select: { name: true, phone: true } },
            payments: { orderBy: { paymentDate: "desc" } },
          },
        },
      },
    });

    revalidatePath(`/invoices/${newInvoice.id}`);
    revalidatePath(`/trips/${tripId}`);
    return { success: true, data: newInvoice };
  } catch (err) {
    console.error("[getOrCreateInvoiceForTrip]", err);
    return { success: false, error: "Failed to generate invoice." };
  }
}

export async function getInvoiceById(
  id: string
): Promise<ActionResult<InvoiceDetail>> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            vehicle:  { select: { name: true, registrationNumber: true } },
            driver:   { select: { name: true, phone: true } },
            payments: { orderBy: { paymentDate: "desc" } },
          },
        },
      },
    });

    if (!invoice) return { success: false, error: "Invoice not found." };
    return { success: true, data: invoice };
  } catch (err) {
    console.error("[getInvoiceById]", err);
    return { success: false, error: "Failed to fetch invoice." };
  }
}
