"use client";

import { signOut } from "next-auth/react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useState } from "react";

interface KidoTopBarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function KidoTopBar({ user }: KidoTopBarProps) {
  const [open, setOpen] = useState(false);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "KA";

  return (
    <header className="h-14 border-b border-slate-800/60 bg-slate-900/30 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      {/* Left: breadcrumb placeholder */}
      <div />

      {/* Right: user menu */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-1.5 transition-all"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
            {initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-medium text-white leading-none">
              {user.name ?? "User"}
            </p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">
              {user.role}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800/60 rounded-xl shadow-xl z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/60">
                <p className="text-xs font-medium text-white truncate">
                  {user.name ?? "User"}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => signOut({ callbackUrl: "/kido/auth/signin" })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
