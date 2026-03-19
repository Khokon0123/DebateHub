"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (!open) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="absolute inset-x-0 top-6 mx-auto w-[calc(100vw-2rem)] max-w-2xl">
        <div
          className={cn(
            "rounded-[14px] bg-white",
            "border border-[color:var(--border)] [border-width:0.5px]",
            "shadow-[0_18px_60px_rgba(0,0,0,0.22)]",
          )}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[color:var(--border)] [border-bottom-width:0.5px]">
            <div className="text-sm font-medium">{title}</div>
            <button
              className="h-9 w-9 rounded-xl hover:bg-[rgba(24,95,165,0.08)] text-[color:var(--muted)]"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

