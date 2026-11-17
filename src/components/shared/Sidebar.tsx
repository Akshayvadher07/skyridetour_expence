"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/shared/LogoutButton";
import {
  LayoutDashboard,
  Car,
  Receipt,
  Users,
  Truck,
  UserCheck,
  Ticket,
  BarChart3,
  FileText,
  Settings,
  MapPin,
  ChevronRight,
  CreditCard,
} from "lucide-react";

// =============================================================================
// NAV CONFIG
// =============================================================================

const NAV_GROUPS = [
  {
    group: "Main",
    items: [
      { href: "/dashboard",  label: "Dashboard",        icon: LayoutDashboard },
      { href: "/trips",      label: "Trips",            icon: Car             },
    ],
  },
  {
    group: "Fleet",
    items: [
      { href: "/vehicles",   label: "Vehicles",         icon: Truck           },
      { href: "/drivers",    label: "Drivers",          icon: UserCheck       },
      { href: "/toll-passes",label: "Toll Passes",      icon: Ticket          },
    ],
  },
  {
    group: "Finance",
    items: [
      { href: "/expenses",   label: "Expenses",         icon: Receipt         },
      { href: "/payments",   label: "Payments",         icon: CreditCard      },
      { href: "/invoices",   label: "Invoices",         icon: FileText        },
    ],
  },
  {
    group: "Insights",
    items: [
      { href: "/reports",    label: "Reports",          icon: BarChart3       },
      { href: "/settings",   label: "Settings",         icon: Settings        },
    ],
  },
] as const;

// =============================================================================
// NAV ITEM
// =============================================================================

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href:    string;
  label:   string;
  icon:    React.ElementType;
  active:  boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
          "transition-all duration-150 group relative",
          active
            ? "bg-white/10 text-white shadow-sm"
            : "text-white/50 hover:text-white hover:bg-white/[0.06]"
        )}
        aria-current={active ? "page" : undefined}
      >
        {/* Active indicator bar */}
        {active && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[var(--primary)]"
          />
        )}
        <Icon
          className={cn(
            "w-[18px] h-[18px] flex-shrink-0 transition-colors",
            active ? "text-[var(--primary)]" : "text-white/35 group-hover:text-white/60"
          )}
        />
        <span className="flex-1 leading-none">{label}</span>
        {active && (
          <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
        )}
      </Link>
    </li>
  );
}

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

interface SidebarProps {
  /** Whether the mobile sheet is open (ignored on desktop) */
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname          = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const initials = session?.user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "O";

  return (
    <aside
      className="flex flex-col h-full w-64 bg-[var(--sidebar)] select-none"
      aria-label="Main navigation"
    >
      {/* ── Brand ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-[18px] border-b border-white/[0.07] flex-shrink-0">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 group"
          aria-label="SkyRideTour home"
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl
              bg-[var(--primary)] shadow-md flex-shrink-0
              group-hover:scale-105 transition-transform duration-200"
          >
            <MapPin className="w-5 h-5 text-[var(--primary-foreground)]" />
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight tracking-tight">
              SkyRide<span className="text-[var(--primary)]">Tour</span>
            </p>
            <p className="text-white/30 text-[10px] leading-tight tracking-wide">
              Travel Management
            </p>
          </div>
        </Link>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5 scrollbar-thin">
        {NAV_GROUPS.map(({ group, items }) => (
          <div key={group}>
            <p className="text-white/20 text-[10px] font-semibold uppercase tracking-[0.12em] px-3 mb-1.5">
              {group}
            </p>
            <ul className="space-y-px">
              {items.map(({ href, label, icon }) => (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={isActive(href)}
                  onClick={onClose}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User footer ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 py-4 border-t border-white/[0.07]">
        {/* Avatar row */}
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl">
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-amber-600
              flex items-center justify-center flex-shrink-0 shadow-sm"
          >
            <span className="text-[var(--primary-foreground)] text-xs font-bold leading-none">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-medium truncate leading-tight">
              {session?.user?.name ?? "Owner"}
            </p>
            <p className="text-white/30 text-[11px] truncate leading-tight mt-0.5">
              {session?.user?.email ?? ""}
            </p>
          </div>
        </div>

        {/* Logout */}
        <LogoutButton variant="full" />
      </div>
    </aside>
  );
}

// Re-export nav groups for use in mobile bottom nav
export { NAV_GROUPS };
