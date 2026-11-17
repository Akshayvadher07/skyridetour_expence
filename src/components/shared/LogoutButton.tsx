"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, AlertTriangle, Loader2 } from "lucide-react";

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

function LogoutDialog({
  isOpen,
  onConfirm,
  onCancel,
  isLoading,
}: {
  isOpen:    boolean;
  onConfirm: () => void;
  onCancel:  () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div className="relative z-10 w-full max-w-sm bg-[var(--card)] border border-[var(--border)]
        rounded-2xl shadow-2xl p-6 animate-fade-in">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full
          bg-red-100 mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>

        {/* Text */}
        <h3
          id="logout-dialog-title"
          className="text-center text-lg font-semibold text-[var(--foreground)] mb-1"
        >
          Sign Out?
        </h3>
        <p className="text-center text-[var(--muted-foreground)] text-sm mb-6">
          You&apos;ll be redirected to the login page. Any unsaved changes will be lost.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            id="logout-cancel-btn"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border)]
              text-[var(--foreground)] text-sm font-medium
              hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="logout-confirm-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
              bg-red-500 hover:bg-red-600 text-white text-sm font-medium
              transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing out…
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Logout Button ────────────────────────────────────────────────────────────

interface LogoutButtonProps {
  /** "full" = icon + text label, "icon" = icon only (for compact layouts) */
  variant?: "full" | "icon";
  className?: string;
}

export function LogoutButton({ variant = "full", className = "" }: LogoutButtonProps) {
  const { data: session } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);

  if (!session) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      setIsLoading(false);
      setDialogOpen(false);
    }
  };

  if (variant === "icon") {
    return (
      <>
        <button
          id="logout-icon-btn"
          onClick={() => setDialogOpen(true)}
          title="Sign out"
          aria-label="Sign out"
          className={`p-2 rounded-lg text-[var(--muted-foreground)] hover:text-red-500
            hover:bg-red-50 transition-all duration-150 ${className}`}
        >
          <LogOut className="w-4 h-4" />
        </button>
        <LogoutDialog
          isOpen={dialogOpen}
          onConfirm={handleConfirm}
          onCancel={() => setDialogOpen(false)}
          isLoading={isLoading}
        />
      </>
    );
  }

  return (
    <>
      <button
        id="logout-full-btn"
        onClick={() => setDialogOpen(true)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10
          transition-all duration-150 group ${className}`}
      >
        <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        Sign Out
      </button>
      <LogoutDialog
        isOpen={dialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
        isLoading={isLoading}
      />
    </>
  );
}
