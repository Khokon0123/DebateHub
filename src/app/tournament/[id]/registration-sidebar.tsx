"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type Tournament = {
  id: string;
  registration_link: string | null;
  registration_open: boolean | null;
  registration_deadline: string | null;
  fee: string | null;
  team_cap: number | null;
  registered_teams: number | null;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDeadline(value: string | null) {
  const d = parseDate(value);
  if (!d) return "Not set";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function regState(t: Tournament): {
  variant: "open" | "closing" | "closed" | "full" | "opening";
  label: string;
  buttonLabel: string;
  disabled: boolean;
} {
  const cap = t.team_cap ?? null;
  const reg = t.registered_teams ?? 0;
  const deadline = parseDate(t.registration_deadline);
  const now = new Date();

  const isFull = cap !== null && cap > 0 && reg >= cap;
  if (isFull) return { variant: "full", label: "Full", buttonLabel: "Registration Closed", disabled: true };

  const deadlinePassed = deadline ? startOfDay(deadline) < startOfDay(now) : false;
  if (deadlinePassed) return { variant: "closed", label: "Closed", buttonLabel: "Registration Closed", disabled: true };

  const isOpen = t.registration_open === true;
  if (!isOpen) {
    if (deadline && startOfDay(deadline) >= startOfDay(now)) {
      return { variant: "opening", label: "Opening Soon", buttonLabel: "Registration Closed", disabled: true };
    }
    return { variant: "closed", label: "Closed", buttonLabel: "Registration Closed", disabled: true };
  }

  const closingSoon =
    deadline ? startOfDay(deadline) <= startOfDay(addDays(now, 7)) : false;
  if (closingSoon) return { variant: "closing", label: "Closing soon", buttonLabel: "Register Now", disabled: false };

  return { variant: "open", label: "Open", buttonLabel: "Register Now", disabled: false };
}

export function RegistrationSidebar({ tournament }: { tournament: Tournament }) {
  const { toast } = useToast();

  const cap = tournament.team_cap ?? null;
  const reg = tournament.registered_teams ?? 0;
  const spotsLeft = cap && cap > 0 ? Math.max(0, cap - reg) : null;
  const pct = cap && cap > 0 ? Math.round((Math.min(reg, cap) / cap) * 100) : 0;

  const state = regState(tournament);
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `/tournament/${tournament.id}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ tone: "success", message: "Link copied" });
    } catch {
      toast({ tone: "danger", message: "Could not copy link" });
    }
  }

  async function share() {
    const nav: any = navigator;
    if (nav?.share) {
      try {
        await nav.share({ url: shareUrl });
      } catch {
        // user cancelled
      }
      return;
    }
    await copyLink();
  }

  const canRegister = !state.disabled && !!tournament.registration_link;

  return (
    <>
      {/* Desktop / sidebar card */}
      <div className="hidden lg:block">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="ui-label text-[color:var(--muted)]">Registration</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={state.variant}>{state.label}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--muted)]">Deadline</span>
              <span className="font-medium">{fmtDeadline(tournament.registration_deadline)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--muted)]">Fee</span>
              <span className="font-medium">{tournament.fee?.trim() ? tournament.fee : "—"}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[color:var(--muted)]">Spots left</span>
              <span className="font-medium">
                {spotsLeft === null ? "—" : spotsLeft}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={cap ? pct : 0} />
              {cap ? (
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  {reg} / {cap} teams
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            {state.disabled ? (
              <Button fullWidth disabled>
                {state.buttonLabel}
              </Button>
            ) : (
              <a
                href={tournament.registration_link ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "block",
                  !tournament.registration_link && "pointer-events-none opacity-60",
                )}
              >
                <Button fullWidth>Register Now</Button>
              </a>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={copyLink}>
              Copy link
            </Button>
            <Button variant="ghost" onClick={share}>
              Share
            </Button>
          </div>
        </Card>
      </div>

      {/* Mobile pinned register bar */}
      <div className="lg:hidden">
        <div className="rounded-[14px] bg-white p-5 border border-[color:var(--border)] [border-width:0.5px]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="ui-label text-[color:var(--muted)]">Registration</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={state.variant}>{state.label}</Badge>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-[color:var(--muted)]">Spots left</div>
              <div className="font-medium">{spotsLeft === null ? "—" : spotsLeft}</div>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={cap ? pct : 0} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={copyLink}>
              Copy link
            </Button>
            <Button variant="ghost" onClick={share}>
              Share
            </Button>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-[color:var(--border)] [border-top-width:0.5px]">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            {state.disabled ? (
              <Button fullWidth disabled>
                {state.buttonLabel}
              </Button>
            ) : (
              <a
                href={tournament.registration_link ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "block",
                  !tournament.registration_link && "pointer-events-none opacity-60",
                )}
              >
                <Button fullWidth>Register Now</Button>
              </a>
            )}
            {!canRegister ? (
              <div className="mt-2 text-xs text-[color:var(--muted)]">
                Registration link not available.
              </div>
            ) : null}
          </div>
        </div>
        <div className="h-20" />
      </div>
    </>
  );
}

