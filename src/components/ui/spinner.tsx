"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "h-4 w-4 rounded-full border-2",
          "border-[color:var(--border)] border-t-[var(--primary)]",
          "animate-spin",
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

