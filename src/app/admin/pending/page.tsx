"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { getAdminSupabase } from "../_lib/supabase";
import { TOURNAMENT_SELECT_WITH_ORGANIZER, mapOrganizer } from "../_lib/queries";
import type { AdminTournamentRow } from "../_lib/types";

function fmtDateTime(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusVariant(status: string) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

export default function PendingApprovalPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<AdminTournamentRow[]>([]);
  const [view, setView] = React.useState<AdminTournamentRow | null>(null);

  async function load() {
    const supabase = getAdminSupabase();
    if (!supabase) return;
    const sb = supabase;

    setLoading(true);
    const { data, error } = await sb
      .from("tournaments")
      .select(TOURNAMENT_SELECT_WITH_ORGANIZER)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ tone: "danger", message: error.message });
      setRows([]);
      setLoading(false);
      return;
    }
    setRows(((data as any[]) ?? []).map(mapOrganizer));
    setLoading(false);
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: "approved" | "rejected") {
    const supabase = getAdminSupabase();
    if (!supabase) return;
    const sb = supabase;

    const { error } = await (sb.from("tournaments") as any)
      .update({ status })
      .eq("id", id);
    if (error) return toast({ tone: "danger", message: error.message });
    toast({ tone: "success", message: status === "approved" ? "Approved" : "Rejected" });
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-2xl font-medium tracking-tight">Pending Approval</div>
        <div className="mt-1 text-sm text-[color:var(--muted)]">
          Review pending submissions. Approving makes them visible publicly.
        </div>
      </div>

      <Card className="p-6">
        <div className="mt-1 text-sm text-[color:var(--muted)]">
          {loading ? "Loading…" : `${rows.length} pending tournaments`}
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="text-left text-[color:var(--muted)]">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Format</th>
                <th className="py-2 pr-3 font-medium">City</th>
                <th className="py-2 pr-3 font-medium">Organizer</th>
                <th className="py-2 pr-3 font-medium">Submitted</th>
                <th className="py-2 pr-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-4 text-[color:var(--muted)]" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="py-4 text-[color:var(--muted)]" colSpan={6}>
                    No pending tournaments.
                  </td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.id} className="border-t border-[color:var(--border)] [border-top-width:0.5px]">
                    <td className="py-3 pr-3 font-medium">{t.name}</td>
                    <td className="py-3 pr-3">{t.format ? <Badge variant={t.format}>{t.format}</Badge> : "—"}</td>
                    <td className="py-3 pr-3">{t.city ?? "—"}</td>
                    <td className="py-3 pr-3">{t.organizer?.organization ?? t.organizer?.full_name ?? "—"}</td>
                    <td className="py-3 pr-3">{fmtDateTime(t.created_at)}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="ghost" className="h-10 rounded-xl" onClick={() => setView(t)}>
                          View
                        </Button>
                        <Button className="h-10 rounded-xl" onClick={() => setStatus(t.id, "approved")}>
                          Approve
                        </Button>
                        <Button variant="danger" className="h-10 rounded-xl" onClick={() => setStatus(t.id, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!view} onClose={() => setView(null)} title="Full tournament details">
        {view ? (
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-lg font-medium">{view.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {view.format ? <Badge variant={view.format}>{view.format}</Badge> : null}
                <Badge variant={statusVariant(view.status)}>{view.status}</Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="ui-label text-[color:var(--muted)]">Organizer</div>
                <div className="mt-1 font-medium">{view.organizer?.organization ?? "—"}</div>
                <div className="mt-1 text-[color:var(--muted)]">{view.organizer?.email ?? "—"}</div>
                <div className="mt-1 text-[color:var(--muted)]">{view.organizer?.whatsapp ?? "—"}</div>
              </div>
              <div>
                <div className="ui-label text-[color:var(--muted)]">Submitted</div>
                <div className="mt-1 font-medium">{fmtDateTime(view.created_at)}</div>
              </div>
              <div>
                <div className="ui-label text-[color:var(--muted)]">Location</div>
                <div className="mt-1 font-medium">
                  {(view.city ?? "—") + (view.country ? `, ${view.country}` : "")}
                </div>
                <div className="mt-1 text-[color:var(--muted)]">{view.venue ?? "—"}</div>
                <div className="mt-1 text-[color:var(--muted)]">{view.address ?? "—"}</div>
              </div>
              <div>
                <div className="ui-label text-[color:var(--muted)]">Registration</div>
                <div className="mt-1 font-medium">Deadline: {view.registration_deadline ?? "—"}</div>
                <div className="mt-1 text-[color:var(--muted)]">Fee: {view.fee ?? "—"}</div>
                <div className="mt-1 text-[color:var(--muted)] break-all">
                  Link: {view.registration_link ?? "—"}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="ui-label text-[color:var(--muted)]">Description</div>
                <div className="mt-2 whitespace-pre-wrap text-[color:var(--muted)]">
                  {view.description ?? "—"}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="ui-label text-[color:var(--muted)]">Rules</div>
                <div className="mt-2 whitespace-pre-wrap text-[color:var(--muted)]">
                  {view.rules ?? "—"}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" className="h-11 rounded-xl" onClick={() => setView(null)}>
                Close
              </Button>
              <Button className="h-11 rounded-xl" onClick={() => setStatus(view.id, "approved")}>
                Approve
              </Button>
              <Button variant="danger" className="h-11 rounded-xl" onClick={() => setStatus(view.id, "rejected")}>
                Reject
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

