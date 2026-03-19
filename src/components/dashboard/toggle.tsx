"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2",
        disabled && "opacity-60 pointer-events-none",
      )}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={label ?? "Toggle"}
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-[var(--success)]" : "bg-[rgba(0,0,0,0.16)]",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      {label ? <span className="text-sm">{label}</span> : null}
    </button>
  );
}

