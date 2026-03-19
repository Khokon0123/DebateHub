"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { AdminTournamentRow } from "../_lib/types";

const STORAGE_KEY = "debatehub_admin_last_seen";

function fmtTs(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<AdminTournamentRow[]>([]);
  const [lastSeen, setLastSeen] = React.useState<string | null>(null);

  React.useEffect(() => {
    const prev = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    setLastSeen(prev);
    const now = new Date().toISOString();
    window.localStorage.setItem(STORAGE_KEY, now);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("Could not load notifications.");
      const data = (await res.json()) as any;
      setRows((data?.items ?? []) as AdminTournamentRow[]);
    } catch (e: any) {
      toast({ tone: "danger", message: e?.message ?? "Could not load notifications." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastSeenDate = lastSeen ? new Date(lastSeen) : null;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-2xl font-medium tracking-tight">Notifications</div>
        <div className="mt-1 text-sm text-[color:var(--muted)]">
          Recent submissions and status changes.
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-[color:var(--muted)]">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-[color:var(--muted)]">No activity yet.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const created = r.created_at ? new Date(r.created_at) : null;
              const unread = !!(lastSeenDate && created && created > lastSeenDate);
              return (
                <div
                  key={r.id}
                  className={cn(
                    "rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4",
                    unread && "border-l-[var(--primary)] [border-left-width:3px]",
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{r.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {r.format ? <Badge variant={r.format}>{r.format}</Badge> : null}
                        <Badge variant={r.status === "approved" ? "approved" : r.status === "rejected" ? "rejected" : "pending"}>
                          {r.status}
                        </Badge>
                        <span className="text-xs text-[color:var(--muted)]">
                          {r.organizer?.organization ?? r.organizer?.full_name ?? "Organizer"} • {fmtTs(r.created_at)}
                        </span>
                      </div>
                    </div>
                    {unread ? (
                      <span className="text-xs font-medium text-[var(--primary)]">
                        New
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

