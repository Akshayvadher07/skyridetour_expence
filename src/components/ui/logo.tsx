"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark" | "color";
  iconOnly?: boolean;
}

export function Logo({ variant = "dark", iconOnly = false, className, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center justify-center select-none shrink-1", className)} {...props}>
      <img 
        src="/bharatgodam-logo.jpg" 
        alt="BharatGodam Logo" 
        className="h-full w-auto max-h-full object-contain rounded bg-white p-1 shadow-sm hover:scale-[1.03] transition-transform duration-300"
      />
    </div>
  );
}
