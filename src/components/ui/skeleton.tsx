"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[rgba(0,0,0,0.06)]",
        className,
      )}
      aria-hidden="true"
    />
  );
}

