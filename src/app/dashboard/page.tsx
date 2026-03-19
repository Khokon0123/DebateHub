"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getDashboardSupabase } from "./_lib/supabase";
import type { TournamentRow } from "./_lib/types";

function firstName(fullNameOrEmail: string) {
  const s = fullNameOrEmail.trim();
  if (!s) return "there";
  const parts = s.split(/\s+/);
  return parts[0] || "there";
}

export default function DashboardOverviewPage() {
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState<string>("Organizer");
  const [tournaments, setTournaments] = React.useState<TournamentRow[]>([]);

  React.useEffect(() => {
    const supabase = getDashboardSupabase();
    if (!supabase) return;
    const sb = supabase;

    let cancelled = false;
    function withTimeout<T>(p: PromiseLike<T>, ms = 10000): Promise<T | null> {
      return Promise.race([
        Promise.resolve(p),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
      ]);
    }
    async function load() {
      setLoading(true);
      const authRes = await withTimeout(sb.auth.getUser(), 10000);
      if (!authRes) {
        if (!cancelled) {
          setTournaments([]);
          setLoading(false);
        }
        return;
      }
      const { data: auth } = authRes;
      if (!auth.user) {
        if (!cancelled) {
          setTournaments([]);
          setLoading(false);
        }
        return;
      }

      try {
        const profRes = await withTimeout(
          sb
            .from("profiles")
            .select("full_name,email")
            .eq("id", auth.user.id)
            .maybeSingle(),
          10000,
        );
        const p = profRes?.data as any;
        const fullName =
          (p?.full_name as string | null) ??
          (auth.user.user_metadata?.full_name as string | undefined) ??
          (auth.user.email ?? "Organizer");
        setName(fullName);
      } catch (e: any) {
        console.log("[dashboard] overview profile fetch error:", e);
        setName(auth.user.email ?? "Organizer");
      }

      const tournamentsRes = await withTimeout(
        sb
          .from("tournaments")
          .select(
            "id,user_id,name,format,status,start_date,end_date,city,country,venue,type,team_cap,registered_teams,registration_open,registration_link,updated_at,rounds,fee,registration_deadline,address,maps_link,description,rules,prizes",
          )
          .eq("user_id", auth.user.id)
          .order("created_at", { ascending: false }),
        10000,
      );

      if (cancelled) return;
      if (!tournamentsRes) {
        setTournaments([]);
        setLoading(false);
        return;
      }

      const { data, error } = tournamentsRes;
      if (error) {
        console.log("[dashboard] overview tournaments fetch error:", error);
        setTournaments([]);
        setLoading(false);
        return;
      }
      setTournaments((data as TournamentRow[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = React.useMemo(() => {
    const total = tournaments.length;
    const pending = tournaments.filter((t) => t.status === "pending").length;
    const approved = tournaments.filter((t) => t.status === "approved").length;
    const rejected = tournaments.filter((t) => t.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [tournaments]);

  const recent = tournaments.slice(0, 3);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-2xl font-medium tracking-tight">
          Welcome, {firstName(name)}
        </div>
        <div className="mt-1 text-sm text-[color:var(--muted)]">
          Manage your tournament submissions and registrations.
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="ui-label text-[color:var(--muted)]">Total</div>
          <div className="mt-2 text-2xl font-medium">{stats.total}</div>
        </Card>
        <Card className="p-5">
          <div className="ui-label text-[color:var(--muted)]">Pending</div>
          <div className="mt-2 text-2xl font-medium text-[var(--warning)]">
            {stats.pending}
          </div>
        </Card>
        <Card className="p-5">
          <div className="ui-label text-[color:var(--muted)]">Approved</div>
          <div className="mt-2 text-2xl font-medium text-[var(--success)]">
            {stats.approved}
          </div>
        </Card>
        <Card className="p-5">
          <div className="ui-label text-[color:var(--muted)]">Rejected</div>
          <div className="mt-2 text-2xl font-medium text-[var(--danger)]">
            {stats.rejected}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-medium">Recent tournaments</div>
          <Link
            href="/dashboard/tournaments"
            className="text-sm font-medium text-[var(--primary)] hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-sm text-[color:var(--muted)]">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4 text-sm text-[color:var(--muted)]">
              No tournaments yet.{" "}
              <Link
                href="/submit"
                className="font-medium text-[var(--primary)] hover:underline"
              >
                Submit one now
              </Link>
              .
            </div>
          ) : (
            recent.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-2 rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.name}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {t.format ? <Badge variant={t.format}>{t.format}</Badge> : null}
                    <Badge
                      variant={
                        t.status === "approved"
                          ? "approved"
                          : t.status === "rejected"
                            ? "rejected"
                            : "pending"
                      }
                    >
                      {t.status}
                    </Badge>
                  </div>
                </div>
                <Link
                  href={`/tournament/${t.id}`}
                  className="text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  View →
                </Link>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

