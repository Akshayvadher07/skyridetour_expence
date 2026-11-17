// src/app/(dashboard)/invoices/[id]/page.tsx
import { notFound } from "next/navigation";
import { getInvoiceById, getOrCreateInvoiceForTrip } from "@/server/actions/invoice";
import { InvoicePrintClient } from "@/components/invoices/InvoicePrintClient";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  let result = await getInvoiceById(id);
  if (!result.success) {
    result = await getOrCreateInvoiceForTrip(id);
  }
  if (!result.success) return { title: "Invoice Not Found" };
  return { title: `Invoice ${result.data.invoiceNumber} · SkyRideTour` };
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let result = await getInvoiceById(id);
  if (!result.success) {
    // Fallback: try treating ID as tripId
    result = await getOrCreateInvoiceForTrip(id);
  }

  if (!result.success) notFound();

  return <InvoicePrintClient invoice={result.data} />;
}
