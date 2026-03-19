"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { Toggle } from "@/components/dashboard/toggle";
import type { TournamentRow } from "../_lib/types";

function pct(reg: number, cap: number | null) {
  if (!cap || cap <= 0) return 0;
  return Math.round((Math.min(reg, cap) / cap) * 100);
}

function fmtTs(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SlotTrackerPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<TournamentRow[]>([]);

  const [draft, setDraft] = React.useState<Record<string, { reg: number; open: boolean }>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments/slots/me", { method: "GET" });
      if (!res.ok) throw new Error("Could not load slot tracker.");
      const data = (await res.json()) as any;
      const rows = (data?.items ?? []) as TournamentRow[];
      setItems(rows);
      setDraft((prev) => {
        const next = { ...prev };
        for (const r of rows) {
          if (!next[r.id]) {
            next[r.id] = {
              reg: r.registered_teams ?? 0,
              open: r.registration_open ?? true,
            };
          }
        }
        return next;
      });
    } catch (e: any) {
      toast({ tone: "danger", message: e?.message ?? "Could not load slot tracker." });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyLink(link: string | null) {
    if (!link) return toast({ tone: "danger", message: "No registration link set." });
    try {
      await navigator.clipboard.writeText(link);
      toast({ tone: "success", message: "Registration link copied" });
    } catch {
      toast({ tone: "danger", message: "Could not copy link" });
    }
  }

  async function save(t: TournamentRow) {
    const d = draft[t.id];
    if (!d) return;

    const cap = t.team_cap ?? null;
    const reg = Math.max(0, Math.floor(d.reg));
    const open = d.open;

    const shouldClose = cap !== null && cap > 0 && reg >= cap;
    const nextOpen = shouldClose ? false : open;

    setSavingId(t.id);
    const res = await fetch(`/api/tournaments/${t.id}/slots`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registered_teams: reg, registration_open: nextOpen }),
    });
    setSavingId(null);

    if (!res.ok) {
      toast({ tone: "danger", message: "Update failed." });
      return;
    }
    toast({ tone: "success", message: "Updated" });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-2xl font-medium tracking-tight">Slot Tracker</div>
        <div className="mt-1 text-sm text-[color:var(--muted)]">
          Update registrations for your approved tournaments.
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-[color:var(--muted)]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4 text-sm text-[color:var(--muted)]">
            No approved tournaments yet. Once approved, they’ll appear here for slot tracking.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((t) => {
              const d = draft[t.id] ?? { reg: t.registered_teams ?? 0, open: t.registration_open ?? true };
              const cap = t.team_cap ?? null;
              const reg = d.reg ?? 0;
              const p = pct(reg, cap);
              const spots = cap && cap > 0 ? Math.max(0, cap - reg) : null;

              return (
                <div
                  key={t.id}
                  className="rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{t.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {t.format ? <Badge variant={t.format}>{t.format}</Badge> : null}
                        <Badge variant={(d.open ? "open" : "closed")}>{d.open ? "Open" : "Closed"}</Badge>
                        <span className="text-xs text-[color:var(--muted)]">
                          Last updated: {fmtTs(t.updated_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" className="h-11 rounded-xl" onClick={() => copyLink(t.registration_link)}>
                        Copy link
                      </Button>
                      <Button className="h-11 rounded-xl" onClick={() => save(t)} disabled={savingId === t.id}>
                        {savingId === t.id ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-[color:var(--muted)]">
                          Registered{" "}
                          <span className="font-medium text-[color:var(--text)]">{reg}</span>
                          {cap ? (
                            <>
                              {" "}
                              / <span className="font-medium text-[color:var(--text)]">{cap}</span>
                            </>
                          ) : null}
                        </div>
                        <div className="text-sm font-medium">
                          {spots === null ? "—" : `${spots} spots left`}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={cap ? p : 0} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          className="h-11 rounded-xl"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              [t.id]: { ...d, reg: Math.max(0, reg - 1) },
                            }))
                          }
                        >
                          −
                        </Button>
                        <div className="w-[140px]">
                          <Input
                            type="number"
                            min={0}
                            value={String(reg)}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                [t.id]: { ...d, reg: Number(e.target.value || 0) },
                              }))
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          className="h-11 rounded-xl"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              [t.id]: { ...d, reg: reg + 1 },
                            }))
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className={cn("rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4")}>
                      <div className="ui-label text-[color:var(--muted)]">
                        Registration
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-sm font-medium">
                          {d.open ? "Open" : "Closed"}
                        </div>
                        <Toggle
                          checked={d.open}
                          onChange={(v) =>
                            setDraft((prev) => ({
                              ...prev,
                              [t.id]: { ...d, open: v },
                            }))
                          }
                          label=""
                          disabled={cap !== null && cap > 0 && reg >= cap}
                        />
                      </div>
                      {cap !== null && cap > 0 && reg >= cap ? (
                        <div className="mt-2 text-xs text-[var(--danger)]">
                          Cap reached — registration will be closed on save.
                        </div>
                      ) : null}
                      <div className="mt-3 text-xs text-[color:var(--muted)]">
                        Tip: toggling doesn’t save until you press <span className="font-medium">Save</span>.
                      </div>
                    </div>
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

