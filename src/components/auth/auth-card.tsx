"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function AuthLogo() {
  return (
    <div className="flex items-baseline justify-center gap-0.5">
      <span className="text-[15px] font-medium tracking-tight text-black">
        Debate
      </span>
      <span className="text-[15px] font-medium tracking-tight text-[var(--primary)]">
        Hub
      </span>
    </div>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  logoHref = "/",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  logoHref?: string | null;
}) {
  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-[400px]">
        <div className="rounded-[14px] bg-white p-6 border border-[color:var(--border)] [border-width:0.5px]">
          {logoHref ? (
            <Link href={logoHref} className="block">
              <AuthLogo />
            </Link>
          ) : (
            <AuthLogo />
          )}
          <div className="mt-5 text-center">
            <h1 className="text-xl font-medium tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-[color:var(--muted)]">{subtitle}</p>
            ) : null}
          </div>
          <div className="mt-6">{children}</div>
        </div>
        {footer ? (
          <div className={cn("mt-4 text-center text-sm text-[color:var(--muted)]")}>
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  );
}

