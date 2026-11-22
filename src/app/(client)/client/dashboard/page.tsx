import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/shared/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "CLIENT") redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");

  const identityFilters = [
    ...(session.user.email ? [{ customerEmail: { equals: session.user.email, mode: "insensitive" as const } }] : []),
    ...(session.user.phone ? [{ customerPhone: session.user.phone }] : []),
  ];
  const trips = identityFilters.length
    ? await prisma.trip.findMany({
        where: { OR: identityFilters },
        select: {
          id: true,
          tripNumber: true,
          date: true,
          pickupLocation: true,
          dropLocation: true,
          tripAmount: true,
          paymentStatus: true,
        },
        orderBy: { date: "desc" },
        take: 50,
      })
    : [];

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-8">
        <Link href="/client/dashboard" className="text-lg font-bold">SkyRide<span className="text-[var(--primary)]">Tour</span></Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">{session.user.name}</span>
          <LogoutButton />
        </div>
      </header>
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
        <p className="text-sm font-medium text-[var(--primary)]">CLIENT ACCOUNT</p>
        <h1 className="mt-1 text-2xl font-bold">Your trips</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Trips associated with your account details appear here.</p>
        {trips.length ? (
          <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted-foreground)]">
                <tr><th className="px-4 py-3">Trip</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Payment</th></tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{trip.tripNumber}</td>
                    <td className="px-4 py-3">{trip.date.toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">{trip.pickupLocation} → {trip.dropLocation}</td>
                    <td className="px-4 py-3">{formatCurrency(trip.tripAmount)}</td>
                    <td className="px-4 py-3">{trip.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] px-5 py-12 text-center">
            <p className="font-medium">No trips are linked to your account yet.</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Ask your SkyRideTour operator to use your registered email or phone number on the trip.</p>
          </div>
        )}
      </section>
    </main>
  );
}