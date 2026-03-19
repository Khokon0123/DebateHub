"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-xl bg-white px-3 py-2 text-sm min-h-[44px] " +
  "border border-[color:var(--border)] [border-width:0.5px] " +
  "placeholder:text-[color:var(--muted)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page-bg)] " +
  "disabled:bg-[rgba(0,0,0,0.02)] disabled:opacity-70";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        base,
        error && "border-[var(--danger)] focus-visible:ring-[var(--danger)]",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(function Select({ className, error, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        base,
        "appearance-none pr-9",
        "bg-[linear-gradient(45deg,transparent_50%,rgba(0,0,0,0.55)_50%),linear-gradient(135deg,rgba(0,0,0,0.55)_50%,transparent_50%)]",
        "bg-[length:6px_6px,6px_6px] bg-[position:calc(100%-16px)_50%,calc(100%-11px)_50%] bg-no-repeat",
        error && "border-[var(--danger)] focus-visible:ring-[var(--danger)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

