"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  fullWidth,
  isLoading,
  className,
  disabled,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium min-h-[44px] " +
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page-bg)] " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--primary)] text-white hover:bg-[color-mix(in_srgb,var(--primary),#000_12%)]",
    ghost:
      "bg-transparent text-[var(--blue-text)] hover:bg-[rgba(24,95,165,0.08)] border border-[var(--border)]",
    danger:
      "bg-[var(--danger)] text-white hover:bg-[color-mix(in_srgb,var(--danger),#000_12%)]",
  };

  return (
    <button
      className={cn(base, styles[variant], fullWidth && "w-full", className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span
            className={cn(
              "h-4 w-4 rounded-full border-2 animate-spin",
              variant === "ghost"
                ? "border-[color:var(--border)] border-t-[var(--primary)]"
                : "border-white/40 border-t-white",
            )}
            aria-hidden="true"
          />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

