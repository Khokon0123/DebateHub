"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

function scorePassword(pw: string) {
  let score = 0;
  const s = pw ?? "";
  if (s.length >= 8) score += 1;
  if (s.length >= 12) score += 1;
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) score += 1;
  if (/\d/.test(s)) score += 1;
  if (/[^A-Za-z0-9]/.test(s)) score += 1;
  return Math.min(score, 5);
}

export function PasswordStrength({ value }: { value: string }) {
  const score = scorePassword(value);
  const pct = Math.round((score / 5) * 100);
  const label =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  const color =
    pct >= 80
      ? "bg-[var(--success)]"
      : pct >= 50
        ? "bg-[var(--warning)]"
        : "bg-[var(--danger)]";

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[color:var(--muted)]">Password strength</span>
        <span className="font-medium text-[color:var(--text)]">{label}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

