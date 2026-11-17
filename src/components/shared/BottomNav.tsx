"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Receipt,
  Users,
  Plus,
} from "lucide-react";

// High-frequency screens for bottom nav (mobile only)
const BOTTOM_NAV = [
  { href: "/dashboard", label: "Home",     icon: LayoutDashboard },
  { href: "/trips",     label: "Trips",    icon: Car             },
  { href: "/expenses",  label: "Expenses", icon: Receipt         },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex
        bg-[var(--sidebar)]/95 backdrop-blur-md border-t border-white/[0.08]
        safe-area-padding-bottom"
    >
      {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 px-1 transition-colors",
              active
                ? "text-[var(--primary)]"
                : "text-white/35 hover:text-white/60"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 transition-transform",
                active && "scale-110"
              )}
            />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}

      {/* Floating center CTA — New Trip */}
      <Link
        href="/trips/new"
        id="bottom-nav-add-trip"
        aria-label="Create new trip"
        className="flex-1 flex flex-col items-center gap-1 py-2 px-1 relative"
      >
        <div
          className="-mt-5 w-12 h-12 rounded-full flex items-center justify-center
            bg-[var(--primary)] shadow-[0_0_20px_rgba(245,158,11,0.4)]
            hover:bg-[var(--primary-hover)] active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6 text-[var(--primary-foreground)]" />
        </div>
        <span className="text-[10px] font-medium leading-none text-white/35 mt-0.5">New Trip</span>
      </Link>
    </nav>
  );
}
