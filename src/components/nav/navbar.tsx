"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type AuthedUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role?: string | null;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [user, setUser] = React.useState<AuthedUser | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/auth/me", { method: "GET" });
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = (await res.json()) as any;
        const u = data?.user;
        const profile = data?.profile;
        if (!u) {
          if (!cancelled) setUser(null);
          return;
        }

        if (cancelled) return;
        setUser({
          id: u.id,
          email: u.email ?? null,
          fullName: (profile?.full_name as string | null) ?? null,
          role: (profile?.role as string | null) ?? null,
        });
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navLink = (href: string, label: string) => {
    const active = isActive(pathname, href);
    return (
      <Link
        href={href}
        className={cn(
          "h-11 inline-flex items-center rounded-xl px-3 text-sm font-medium",
          "transition-colors hover:bg-[rgba(24,95,165,0.08)]",
          active ? "text-[var(--primary)]" : "text-[color:var(--text)]",
        )}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  };

  async function onSignOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setUser(null);
    router.push("/");
  }

  function onSubmitTournament() {
    router.push(user ? "/dashboard" : "/login");
  }

  const displayName =
    user?.fullName?.trim() ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "Organizer";

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="border-b border-[color:var(--border)] [border-bottom-width:0.5px]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-baseline gap-0.5">
            <span className="text-[15px] font-medium tracking-tight text-black">
              Debate
            </span>
            <span className="text-[15px] font-medium tracking-tight text-[var(--primary)]">
              Hub
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-2 md:flex">
            {navLink("/", "Browse Tournaments")}

            <Button onClick={onSubmitTournament} className="h-11 rounded-xl">
              Submit Tournament
            </Button>

            {user ? (
              <div className="relative">
                <button
                  className={cn(
                    "h-11 inline-flex items-center gap-2 rounded-xl px-3 text-sm font-medium",
                    "border border-[color:var(--border)] [border-width:0.5px]",
                    "hover:bg-[rgba(24,95,165,0.06)]",
                    menuOpen && "bg-[rgba(24,95,165,0.06)]",
                  )}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="max-w-[180px] truncate">{displayName}</span>
                  <span className="text-[color:var(--muted)]">▾</span>
                </button>

                {menuOpen ? (
                  <div
                    className={cn(
                      "absolute right-0 mt-2 w-56 overflow-hidden rounded-[14px] bg-white",
                      "border border-[color:var(--border)] [border-width:0.5px]",
                      "shadow-[0_14px_40px_rgba(0,0,0,0.12)]",
                    )}
                    role="menu"
                  >
                    <Link
                      href="/dashboard"
                      className="h-11 flex items-center px-4 text-sm hover:bg-[rgba(24,95,165,0.08)]"
                      role="menuitem"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/tournaments"
                      className="h-11 flex items-center px-4 text-sm hover:bg-[rgba(24,95,165,0.08)]"
                      role="menuitem"
                    >
                      My Tournaments
                    </Link>
                    <button
                      className="h-11 w-full text-left px-4 text-sm hover:bg-[rgba(163,45,45,0.10)]"
                      onClick={onSignOut}
                      role="menuitem"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              className={cn(
                "h-11 w-11 inline-flex items-center justify-center rounded-xl",
                "border border-[color:var(--border)] [border-width:0.5px]",
                "hover:bg-[rgba(24,95,165,0.08)]",
              )}
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
            >
              <div className="flex flex-col gap-1.5">
                <span className="h-[2px] w-5 bg-black" />
                <span className="h-[2px] w-5 bg-black" />
                <span className="h-[2px] w-5 bg-black" />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile top drawer */}
        <div
          className={cn(
            "md:hidden overflow-hidden bg-white",
            "transition-[max-height] duration-200 ease-out",
            drawerOpen ? "max-h-[520px]" : "max-h-0",
          )}
        >
          <div className="px-4 pb-4 pt-2 sm:px-6">
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className={cn(
                  "h-11 flex items-center rounded-xl px-4 text-sm font-medium",
                  "border border-[color:var(--border)] [border-width:0.5px]",
                  isActive(pathname, "/")
                    ? "text-[var(--primary)]"
                    : "text-[color:var(--text)]",
                )}
              >
                Browse Tournaments
              </Link>

              <button
                className={cn(
                  "h-11 flex items-center rounded-xl px-4 text-sm font-medium",
                  "bg-[var(--primary)] text-white",
                )}
                onClick={onSubmitTournament}
              >
                Submit Tournament
              </button>

              {user ? (
                <div className="mt-2">
                  <div className="ui-label px-1 text-[color:var(--muted)]">
                    {displayName}
                  </div>
                  <div className="mt-2 flex flex-col gap-2">
                    <Link
                      href="/dashboard"
                      className={cn(
                        "h-11 flex items-center rounded-xl px-4 text-sm font-medium",
                        "border border-[color:var(--border)] [border-width:0.5px]",
                      )}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/tournaments"
                      className={cn(
                        "h-11 flex items-center rounded-xl px-4 text-sm font-medium",
                        "border border-[color:var(--border)] [border-width:0.5px]",
                      )}
                    >
                      My Tournaments
                    </Link>
                    <button
                      className={cn(
                        "h-11 flex items-center rounded-xl px-4 text-sm font-medium",
                        "border border-[color:var(--border)] [border-width:0.5px]",
                        "text-[var(--danger)]",
                      )}
                      onClick={onSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  <Link
                    href="/login"
                    className={cn(
                      "h-11 flex items-center rounded-xl px-4 text-sm font-medium",
                      "border border-[color:var(--border)] [border-width:0.5px]",
                      isActive(pathname, "/login")
                        ? "text-[var(--primary)]"
                        : "text-[color:var(--text)]",
                    )}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className={cn(
                      "h-11 flex items-center rounded-xl px-4 text-sm font-medium",
                      "border border-[color:var(--border)] [border-width:0.5px]",
                      isActive(pathname, "/signup")
                        ? "text-[var(--primary)]"
                        : "text-[color:var(--text)]",
                    )}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

