"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  Sparkles,
  BookMarked,
  Users,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/kido/dashboard", icon: LayoutDashboard },
  { label: "Build Prompt", href: "/kido/dashboard/builder", icon: Sparkles },
  { label: "My Prompts", href: "/kido/dashboard/prompts", icon: BookMarked },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Admin Overview", href: "/kido/dashboard/admin", icon: BarChart3, adminOnly: true },
  { label: "User Approvals", href: "/kido/dashboard/admin/users", icon: Users, adminOnly: true },
];

interface KidoSidebarProps {
  role: string;
}

export default function KidoSidebar({ role }: KidoSidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/60 flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white tracking-tight">
            Kido <span className="text-indigo-400">AI</span>
          </span>
          {isAdmin && (
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-2.5 h-2.5 text-violet-400" />
              <span className="text-[10px] text-violet-400 uppercase tracking-widest font-medium">
                Admin
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* User nav */}
        <div className="mb-2">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium px-3 mb-2">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* Admin nav */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium px-3 mb-2">
              Administration
            </p>
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-800/60">
        <Link
          href="/kido"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-all text-sm"
        >
          <Settings className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </aside>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        isActive
          ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-400" : "")} />
      <span>{item.label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
      )}
    </Link>
  );
}
