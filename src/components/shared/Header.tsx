"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { CommandPalette } from "@/components/shared/CommandPalette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Plus,
  Search,
  Bell,
  Settings,
  User,
  ChevronRight,
  Car,
  Users,
  Truck,
  Receipt,
  FileText,
  X,
  Loader2,
} from "lucide-react";

// =============================================================================
// BREADCRUMB CONFIG
// =============================================================================

const SEGMENT_LABELS: Record<string, string> = {
  dashboard:   "Dashboard",
  trips:       "Trips",
  customers:   "Customers",
  vehicles:    "Vehicles",
  drivers:     "Drivers",
  expenses:    "Expenses",
  payments:    "Payments",
  invoices:    "Invoices",
  reports:     "Reports",
  analytics:   "Analytics",
  settings:    "Settings",
  "toll-passes": "Toll Passes",
  new:         "New",
  edit:        "Edit",
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-sm">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const href   = "/" + segments.slice(0, i + 1).join("/");
        const label  = SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
        // Skip dynamic IDs in breadcrumb display
        const isId   = /^[a-z0-9]{20,}$/i.test(seg);
        if (isId) return null;

        return (
          <span key={href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)] flex-shrink-0" />}
            {isLast ? (
              <span className="font-semibold text-[var(--foreground)]">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// =============================================================================
// COMMAND SEARCH DIALOG
// =============================================================================

const SEARCH_ITEMS = [
  { label: "New Trip",       href: "/trips/new",       icon: Car,      shortcut: "N" },
  { label: "Trips",          href: "/trips",            icon: Car,      shortcut: "T" },
  { label: "Customers",      href: "/customers",        icon: Users,    shortcut: "C" },
  { label: "Vehicles",       href: "/vehicles",         icon: Truck,    shortcut: "V" },
  { label: "Expenses",       href: "/expenses",         icon: Receipt,  shortcut: "E" },
  { label: "Invoices",       href: "/invoices",         icon: FileText, shortcut: "I" },
  { label: "Settings",       href: "/settings",         icon: Settings, shortcut: "S" },
];

function CommandDialog({
  open,
  onClose,
}: {
  open:    boolean;
  onClose: () => void;
}) {
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);
  const router                = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = SEARCH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const navigate = useCallback(
    (href: string) => {
      setLoading(true);
      onClose();
      router.push(href);
      setLoading(false);
    },
    [router, onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quick search"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        className="relative z-10 w-full max-w-lg bg-[var(--card)] border border-[var(--border)]
          rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          {loading ? (
            <Loader2 className="w-4 h-4 text-[var(--muted-foreground)] animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            id="command-search-input"
            type="text"
            placeholder="Search pages, actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && filtered[0]) navigate(filtered[0].href);
            }}
            className="flex-1 bg-transparent text-[var(--foreground)] text-sm
              placeholder:text-[var(--muted-foreground)] outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)]
              hover:bg-[var(--muted)] transition-colors"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <ul className="py-2 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-[var(--muted-foreground)] text-sm">
              No results for &ldquo;{query}&rdquo;
            </li>
          ) : (
            filtered.map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
                    text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors group"
                >
                  <item.icon className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0 group-hover:text-[var(--primary)]" />
                  <span className="flex-1">{item.label}</span>
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px]
                    font-mono bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]">
                    {item.shortcut}
                  </kbd>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--border)] bg-[var(--muted)]/40">
          <kbd className="text-[10px] font-mono text-[var(--muted-foreground)]">↑↓ Navigate</kbd>
          <kbd className="text-[10px] font-mono text-[var(--muted-foreground)]">↵ Open</kbd>
          <kbd className="text-[10px] font-mono text-[var(--muted-foreground)]">Esc Close</kbd>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// USER DROPDOWN
// =============================================================================

function UserDropdown() {
  const { data: session } = useSession();

  const initials = session?.user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "O";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="user-menu-trigger"
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl
            hover:bg-[var(--muted)] transition-colors focus:outline-none
            focus:ring-2 focus:ring-[var(--ring)]"
          aria-label="User menu"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
              bg-gradient-to-br from-[var(--primary)] to-amber-600 shadow-sm"
          >
            <span className="text-[var(--primary-foreground)] text-[11px] font-bold leading-none">
              {initials}
            </span>
          </div>
          <span className="hidden md:block text-sm font-medium text-[var(--foreground)] max-w-[120px] truncate">
            {session?.user?.name ?? "Owner"}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 mt-1">
        {/* User info header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {session?.user?.name ?? "Owner"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">
              {session?.user?.email ?? ""}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <User className="w-4 h-4" />
            Profile &amp; Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout — use a div wrapper so it renders inside the menu */}
        <div className="px-1 py-0.5">
          <LogoutButton variant="full" className="text-red-500 hover:text-red-600 text-[13px]" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// HEADER COMPONENT
// =============================================================================

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifCount]                = useState(0); // wire to real data in Phase 2

  // ── Cmd+K / Ctrl+K keyboard shortcut ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-14
          bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)]"
      >
        {/* Mobile menu toggle */}
        <button
          id="mobile-menu-btn"
          onClick={onMenuClick}
          className="lg:hidden flex-shrink-0 p-2 -ml-1.5 rounded-lg text-[var(--muted-foreground)]
            hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <div className="flex-1 min-w-0">
          <Breadcrumbs />
        </div>

        {/* Right action cluster */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Search trigger */}
          <button
            id="search-trigger-btn"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm
              text-[var(--muted-foreground)] bg-[var(--muted)] hover:bg-[var(--border)]
              transition-colors border border-transparent hover:border-[var(--border)]"
            aria-label="Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Search…</span>
            <kbd className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded
              bg-[var(--background)] text-[var(--muted-foreground)] border border-[var(--border)]">
              ⌘K
            </kbd>
          </button>

          {/* Notification bell */}
          <button
            id="notification-bell-btn"
            className="relative p-2 rounded-xl text-[var(--muted-foreground)]
              hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            aria-label={notifCount > 0 ? `${notifCount} notifications` : "Notifications"}
          >
            <Bell className="w-4.5 h-4.5" />
            {notifCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 flex h-2 w-2"
                aria-hidden="true"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </button>

          {/* Add Trip CTA */}
          <Link
            id="add-trip-btn"
            href="/trips/new"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl
              bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]
              text-sm font-semibold transition-all duration-150
              hover:shadow-[0_0_16px_rgba(245,158,11,0.35)] active:scale-[0.97]"
            aria-label="Create new trip"
          >
            <Plus className="w-4 h-4" />
            Add Trip
          </Link>

          {/* Mobile add button (icon only) */}
          <Link
            href="/trips/new"
            className="sm:hidden flex items-center justify-center w-8 h-8 rounded-xl
              bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)]
              transition-colors active:scale-95"
            aria-label="Create new trip"
          >
            <Plus className="w-4 h-4" />
          </Link>

          {/* User avatar dropdown */}
          <UserDropdown />
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
