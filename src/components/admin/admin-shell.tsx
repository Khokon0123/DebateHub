"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AdminProfile = {
  full_name: string | null;
  email: string | null;
  role: string | null;
};

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "AD").toUpperCase();
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabaseRef = React.useRef<ReturnType<
    typeof createBrowserSupabaseClient
  > | null>(null);

  const [ready, setReady] = React.useState(false);
  const [profile, setProfile] = React.useState<AdminProfile | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [denied, setDenied] = React.useState(false);

  React.useEffect(() => {
    const supabase = (supabaseRef.current ??= createBrowserSupabaseClient());
    if (!supabase) {
      router.replace(`/admin/login`);
      return;
    }
    const sb = supabase;

    let cancelled = false;
    async function load() {
      setDenied(false);
      const { data } = await sb.auth.getUser();
      if (!data.user) {
        router.replace(`/admin/login`);
        return;
      }
      if (cancelled) return;

      setEmail(data.user.email ?? null);
      try {
        const { data: p } = await sb
          .from("profiles")
          .select("full_name,email,role")
          .eq("id", data.user.id)
          .maybeSingle();
        const prof = (p as AdminProfile | null) ?? null;
        setProfile(prof);

        const role =
          (prof?.role ?? (data.user.user_metadata?.role as string | undefined) ?? "")
            .toLowerCase()
            .trim();
        if (role !== "admin") {
          // Sign them out and send to admin login
          await sb.auth.signOut();
          router.replace(`/admin/login`);
          return;
        }
      } catch {
        await sb.auth.signOut();
        router.replace(`/admin/login`);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    load();
    const { data: sub } = sb.auth.onAuthStateChange(() => load());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router, pathname]);

  async function signOut() {
    const supabase = (supabaseRef.current ??= createBrowserSupabaseClient());
    if (supabase) await supabase.auth.signOut();
    router.replace("/");
  }

  const displayName =
    profile?.full_name?.trim() || (email ? email.split("@")[0] : "Admin");
  const displayEmail = profile?.email?.trim() || email || "";

  const nav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/pending", label: "Pending Approval" },
    { href: "/admin/tournaments", label: "All Tournaments" },
    { href: "/admin/notifications", label: "Notifications" },
  ];

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-[14px] bg-white p-6 border border-[color:var(--border)] [border-width:0.5px]">
          <div className="text-lg font-medium">Loading admin…</div>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            Checking your permissions.
          </div>
        </div>
      </div>
    );
  }

  if (denied) return null;

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          {/* Sidebar (desktop) / stacked header (mobile) */}
          <aside>
            <div className="md:sticky md:top-20">
              <Link href="/" className="flex items-baseline gap-0.5">
                <span className="text-[15px] font-medium tracking-tight text-black">
                  Debate
                </span>
                <span className="text-[15px] font-medium tracking-tight text-[var(--primary)]">
                  Hub
                </span>
                <span className="ml-2 rounded-full bg-[var(--blue-bg)] px-2 py-1 text-[11px] font-medium text-[var(--blue-text)]">
                  Admin
                </span>
              </Link>

              <div className="mt-5 rounded-[14px] bg-white p-4 border border-[color:var(--border)] [border-width:0.5px]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--blue-bg)] text-[var(--blue-text)] flex items-center justify-center font-medium">
                    {initials(displayName || displayEmail || "Admin")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{displayName}</div>
                    <div className="truncate text-xs text-[color:var(--muted)]">{displayEmail}</div>
                  </div>
                </div>
              </div>

              <nav className="mt-4 grid gap-2 md:space-y-1">
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

              <div className="mt-4 md:mt-6">
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

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

