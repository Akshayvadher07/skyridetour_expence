"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Shield,
  ShieldOff,
  Trash2,
  Search,
  Filter,
  Loader2,
  Users,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  approved: boolean;
  createdAt: Date | string;
  _count: { prompts: number };
}

type FilterType = "all" | "pending" | "approved";
type Action = "approve" | "reject" | "promote" | "demote";

interface AdminUserManagerProps {
  initialUsers: User[];
  currentUserId: string;
}

export default function AdminUserManager({
  initialUsers,
  currentUserId,
}: AdminUserManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filter === "pending" && (u.approved || u.role === "ADMIN")) return false;
      if (filter === "approved" && !u.approved) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (u.name ?? "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, search, filter]);

  const pendingCount = users.filter((u) => !u.approved && u.role === "USER").length;

  const performAction = async (userId: string, action: Action) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/kido/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");

      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          switch (action) {
            case "approve":
              return { ...u, approved: true };
            case "reject":
              return { ...u, approved: false };
            case "promote":
              return { ...u, role: "ADMIN", approved: true };
            case "demote":
              return { ...u, role: "USER" };
            default:
              return u;
          }
        })
      );

      toast.success(data.message ?? "Action completed");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Permanently delete "${user.name ?? user.email}"? This will also delete all their prompts.`)) return;

    setLoadingId(user.id);
    try {
      const res = await fetch(`/api/kido/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("User deleted");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-slate-800/60 border border-slate-700/60 rounded-xl p-1">
            {(["all", "pending", "approved"] as FilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                  filter === f
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {f === "pending" && pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-500">
        Showing <span className="text-white font-medium">{filtered.length}</span> of{" "}
        {users.length} users
      </p>

      {/* User list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-10 h-10 text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm">No users match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              isLoading={loadingId === user.id}
              onAction={performAction}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({
  user,
  isSelf,
  isLoading,
  onAction,
  onDelete,
}: {
  user: User;
  isSelf: boolean;
  isLoading: boolean;
  onAction: (id: string, action: Action) => void;
  onDelete: (user: User) => void;
}) {
  const isAdmin = user.role === "ADMIN";
  const isPending = !user.approved && !isAdmin;

  return (
    <div
      className={cn(
        "bg-slate-900/40 backdrop-blur-md border rounded-2xl p-4 transition-all",
        isPending ? "border-amber-500/20" : "border-slate-800/60"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* User info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
              isAdmin
                ? "bg-gradient-to-br from-violet-500/30 to-purple-600/30 border border-violet-500/20 text-violet-300"
                : "bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 border border-indigo-500/20 text-indigo-300"
            )}
          >
            {(user.name ?? user.email)[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-white truncate">
                {user.name ?? "—"}
              </p>
              {isAdmin && (
                <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-medium">
                  Admin
                </span>
              )}
              {isSelf && (
                <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Status + meta */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-500">{user._count.prompts} prompts</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              "text-[10px] px-2.5 py-1 rounded-full font-medium border",
              isAdmin
                ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                : user.approved
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            )}
          >
            {isAdmin ? "Admin" : user.approved ? "Approved" : "Pending"}
          </span>

          {/* Actions */}
          {!isSelf && (
            <div className="flex items-center gap-1">
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              ) : (
                <>
                  {isPending && (
                    <ActionIconBtn
                      onClick={() => onAction(user.id, "approve")}
                      title="Approve user"
                      className="text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </ActionIconBtn>
                  )}
                  {user.approved && !isAdmin && (
                    <ActionIconBtn
                      onClick={() => onAction(user.id, "reject")}
                      title="Revoke approval"
                      className="text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </ActionIconBtn>
                  )}
                  {!isAdmin && (
                    <ActionIconBtn
                      onClick={() => onAction(user.id, "promote")}
                      title="Promote to Admin"
                      className="text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/20"
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </ActionIconBtn>
                  )}
                  {isAdmin && (
                    <ActionIconBtn
                      onClick={() => onAction(user.id, "demote")}
                      title="Demote to User"
                      className="text-slate-400 hover:bg-slate-700/60"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                    </ActionIconBtn>
                  )}
                  <ActionIconBtn
                    onClick={() => onDelete(user)}
                    title="Delete user"
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </ActionIconBtn>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionIconBtn({
  children,
  onClick,
  title,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "w-7 h-7 rounded-lg border border-slate-700/60 flex items-center justify-center transition-all",
        className
      )}
    >
      {children}
    </button>
  );
}
