"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { HomeIcon, ListIcon, PlusIcon, SlotsIcon, UserIcon } from "./icons";

type Profile = {
  full_name: string | null;
  organization: string | null;
  email: string | null;
};

const EMPTY_STATE = "EMPTY_STATE" as const;

function EmptyDashboardState() {
  return (
    <Card className="p-6">
      <div className="text-lg font-medium">No tournaments yet</div>
      <div className="mt-2 text-sm text-[color:var(--muted)]">
        If you just signed in, your dashboard may take a moment to populate. You can
        submit your first tournament anytime.
      </div>
      <div className="mt-4">
        <Link
          href="/submit"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[color-mix(in_srgb,var(--primary),#000_12%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page-bg)]"
        >
          Submit a tournament
        </Link>
      </div>
    </Card>
  );
}

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "U").toUpperCase();
}

function firstName(nameOrEmail: string) {
  const s = nameOrEmail.trim();
  if (!s) return "there";
  const parts = s.split(/\s+/);
  return parts[0] || "there";
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [ready, setReady] = React.useState(false);
  const [loadState, setLoadState] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadState(null);
      setReady(false);

      const timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          setLoadState(EMPTY_STATE);
          setReady(true);
        }
      }, 10000);

      try {
        const res = await fetch("/api/auth/me", { method: "GET" });
        if (cancelled) return;
        window.clearTimeout(timeoutId);

        if (!res.ok) {
          setReady(true);
          router.replace(
            `/login?next=${encodeURIComponent(pathname || "/dashboard")}`,
          );
          return;
        }

        const data = (await res.json()) as any;
        const user = data?.user;
        const prof = data?.profile;

        if (!user) {
          setReady(true);
          router.replace(
            `/login?next=${encodeURIComponent(pathname || "/dashboard")}`,
          );
          return;
        }

        setEmail(user.email ?? null);
        setProfile({
          full_name: (prof?.full_name as string | null) ?? null,
          organization: (prof?.organization as string | null) ?? null,
          email: (prof?.email as string | null) ?? null,
        });
      } catch (e: any) {
        setLoadState(EMPTY_STATE);
        console.log("[dashboard] profile fetch error:", e);
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled) setReady(true);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/");
  }

  const displayName = profile?.full_name?.trim() || (email ? email.split("@")[0] : "Organizer");
  const displayEmail = profile?.email?.trim() || email || "";

  const nav = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/tournaments", label: "My Tournaments" },
    { href: "/submit", label: "Submit New" },
    { href: "/dashboard/slots", label: "Slot Tracker" },
    { href: "/dashboard/profile", label: "Profile" },
  ];

  const mobile = [
    { href: "/dashboard", label: "Home", icon: <HomeIcon /> },
    { href: "/dashboard/tournaments", label: "Tournaments", icon: <ListIcon /> },
    { href: "/submit", label: "Submit", icon: <PlusIcon /> },
    { href: "/dashboard/slots", label: "Slots", icon: <SlotsIcon /> },
    { href: "/dashboard/profile", label: "Profile", icon: <UserIcon /> },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="hidden md:block">
            <div className="sticky top-20">
              <Link href="/" className="flex items-baseline gap-0.5">
                <span className="text-[15px] font-medium tracking-tight text-black">
                  Debate
                </span>
                <span className="text-[15px] font-medium tracking-tight text-[var(--primary)]">
                  Hub
                </span>
              </Link>

              <div className="mt-5 rounded-[14px] bg-white p-4 border border-[color:var(--border)] [border-width:0.5px]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--blue-bg)] text-[var(--blue-text)] flex items-center justify-center font-medium">
                    {initials(displayName || displayEmail || "Organizer")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{displayName}</div>
                    <div className="truncate text-xs text-[color:var(--muted)]">{displayEmail}</div>
                  </div>
                </div>
              </div>

              <nav className="mt-4 space-y-1">
                {nav.map((i) => {
                  const active = isActive(pathname, i.href);
                  return (
                    <Link
                      key={i.href}
                      href={i.href}
                      className={cn(
                        "h-11 flex items-center rounded-xl px-3 text-sm font-medium",
                        "border border-[color:var(--border)] [border-width:0.5px] bg-white",
                        "hover:bg-[rgba(24,95,165,0.06)]",
                        active && "text-[var(--primary)] bg-[rgba(24,95,165,0.06)]",
                      )}
                    >
                      {i.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6">
                <Button
                  variant="ghost"
                  className="h-11 w-full justify-center rounded-xl"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            {!ready ? (
              <div className="space-y-4">
                <Card className="p-6">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="mt-2 h-4 w-80" />
                </Card>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-3 h-7 w-14" />
                    </Card>
                  ))}
                </div>
              </div>
            ) : loadState === EMPTY_STATE ? (
              <EmptyDashboardState />
            ) : (
              children
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[color:var(--border)] [border-top-width:0.5px]">
        <div className="mx-auto max-w-6xl px-2">
          <div className="grid grid-cols-5">
            {mobile.map((i) => {
              const active = isActive(pathname, i.href);
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  className={cn(
                    "h-16 flex flex-col items-center justify-center gap-1 text-xs",
                    active ? "text-[var(--primary)]" : "text-[color:var(--muted)]",
                  )}
                >
                  {i.icon}
                  <span className="font-medium">{i.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}

