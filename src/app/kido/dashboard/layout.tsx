import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import KidoSidebar from "@/components/kido/KidoSidebar";
import KidoTopBar from "@/components/kido/KidoTopBar";

export default async function KidoDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/kido/auth/signin");
  }

  // Extra guard: unapproved users can't access dashboard
  if (!(session.user as any).approved && session.user.role !== "ADMIN") {
    redirect("/kido/pending");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-64 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <KidoSidebar role={session.user.role} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <KidoTopBar user={session.user} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
