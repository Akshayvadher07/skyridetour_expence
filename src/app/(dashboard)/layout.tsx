// =============================================================================
// SkyRideTour — Dashboard Layout
// Orchestrates: desktop fixed sidebar + sticky header + scrollable content
//               mobile: Sheet drawer (off-canvas) + bottom navigation bar
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { BottomNav } from "@/components/shared/BottomNav";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

// =============================================================================
// LAYOUT
// =============================================================================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname                    = usePathname();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">

      {/* ── Desktop sidebar — hidden on mobile, fixed on lg+ ─────────────── */}
      <div
        className="hidden lg:flex flex-shrink-0 w-64 h-full border-r border-white/[0.06]
          shadow-[var(--shadow-sidebar)]"
        aria-hidden="false"
      >
        <Sidebar />
      </div>

      {/* ── Mobile sidebar — Sheet (off-canvas drawer) ────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-[var(--sidebar)] border-r border-white/[0.06]"
          aria-describedby={undefined}
        >
          {/* Accessible title — visually hidden */}
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Sticky header */}
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* Scrollable page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto scrollbar-thin
            p-4 sm:p-6
            pb-24 lg:pb-6"   /* extra bottom padding on mobile for bottom nav */
        >
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom navigation bar ──────────────────────────────────── */}
      <BottomNav />
    </div>
  );
}
