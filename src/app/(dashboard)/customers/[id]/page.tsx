// src/app/(dashboard)/customers/[id]/page.tsx
import { redirect } from "next/navigation";

export default function CustomerDetailPage() {
  redirect("/trips");
}
