"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Warehouse, 
  History, 
  LogOut, 
  User as UserIcon,
  Package,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/ui/logo";

const navItems = [
  { label: "Dashboard", href: "/dashboard/client", icon: LayoutDashboard },
  { label: "Book Warehouse", href: "/dashboard/client/book", icon: Warehouse },
  { label: "Booking History", href: "/dashboard/client/history", icon: History },
];

export default function ClientSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[240px] bg-gradient-to-b from-sidebar to-[#0b3a77] text-sidebar-foreground h-screen flex flex-col fixed left-0 top-0 border-r border-sidebar/50 shadow-xl z-50">
      {/* Brand Header */}
      <div className="w-full h-24 flex items-center justify-start px-6 border-b border-slate-800">
        <Logo variant="dark" className="h-12 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:text-white hover:bg-secondary"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-bold tracking-wide uppercase">{item.label}</span>
              {isActive && <div className="absolute right-2 h-1.5 w-1.5 bg-white rounded-full animate-pulse" />}
            </Link>
          );
        })}
      </nav>

      {/* User Actions */}
      <div className="p-2 border-t border-slate-800/50 space-y-1">
        <button className="flex items-center gap-2.5 px-3 py-2 w-full text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all">
          <UserIcon className="h-4 w-4" />
          <span className="uppercase tracking-wide">Account Profile</span>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-2.5 px-3 py-2 w-full text-[11px] font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span className="uppercase tracking-wide">Terminate Session</span>
        </button>
      </div>
    </div>
  );
}
