"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function Progress({
  value,
  className,
}: {
  value: number; // 0-100
  className?: string;
}) {
  const v = clamp(value, 0, 100);

  const color =
    v >= 100
      ? "bg-[var(--danger)]"
      : v >= 80
        ? "bg-[var(--warning)]"
        : "bg-[var(--success)]";

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full",
        "bg-[rgba(0,0,0,0.06)]",
        className,
      )}
      aria-label="Progress"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      role="progressbar"
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", color)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

