"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeVariant =
  | "BP"
  | "AP"
  | "WSDC"
  | "KP"
  | "category"
  | "pending"
  | "approved"
  | "rejected"
  | "open"
  | "closed"
  | "closing"
  | "full"
  | "opening";

const variantStyles: Record<BadgeVariant, string> = {
  BP: "bg-[var(--blue-bg)] text-[var(--blue-text)] border-[var(--primary)]/20",
  AP: "bg-[rgba(59,109,17,0.10)] text-[var(--success)] border-[rgba(59,109,17,0.25)]",
  WSDC:
    "bg-[rgba(133,79,11,0.10)] text-[var(--warning)] border-[rgba(133,79,11,0.25)]",
  KP: "bg-[rgba(109,40,217,0.10)] text-[rgb(109,40,217)] border-[rgba(109,40,217,0.25)]",
  category:
    "bg-[var(--blue-bg)] text-[var(--blue-text)] border-[var(--primary)]/20",

  pending:
    "bg-[rgba(133,79,11,0.10)] text-[var(--warning)] border-[rgba(133,79,11,0.25)]",
  approved:
    "bg-[rgba(59,109,17,0.10)] text-[var(--success)] border-[rgba(59,109,17,0.25)]",
  rejected:
    "bg-[rgba(163,45,45,0.10)] text-[var(--danger)] border-[rgba(163,45,45,0.25)]",

  open: "bg-[rgba(59,109,17,0.10)] text-[var(--success)] border-[rgba(59,109,17,0.25)]",
  closed:
    "bg-[rgba(163,45,45,0.10)] text-[var(--danger)] border-[rgba(163,45,45,0.25)]",
  closing:
    "bg-[rgba(133,79,11,0.10)] text-[var(--warning)] border-[rgba(133,79,11,0.25)]",
  full: "bg-[rgba(163,45,45,0.10)] text-[var(--danger)] border-[rgba(163,45,45,0.25)]",
  opening:
    "bg-[rgba(133,79,11,0.10)] text-[var(--warning)] border-[rgba(133,79,11,0.25)]",
};

export function Badge({
  variant,
  children,
  className,
  caps = true,
}: {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
  caps?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] leading-none tracking-wide",
        caps && "uppercase",
        variantStyles[variant],
        className,
      )}
    >
      {children ?? variant}
    </span>
  );
}

