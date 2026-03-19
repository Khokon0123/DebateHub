"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { AdminTournamentRow } from "./_lib/types";

function statusVariant(status: string) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<AdminTournamentRow[]>([]);
  const [view, setView] = React.useState<AdminTournamentRow | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminTournamentRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tournaments");
      if (!res.ok) throw new Error("Could not load admin tournaments.");
      const data = (await res.json()) as any;
      setRows((data?.items ?? []) as AdminTournamentRow[]);
    } catch (e: any) {
      toast({ tone: "danger", message: e?.message ?? "Could not load admin tournaments." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = React.useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [rows]);

  const pending = React.useMemo(
    () => rows.filter((r) => r.status === "pending"),
    [rows],
  );

  async function setStatus(id: string, status: "approved" | "rejected") {
    const res = await fetch(`/api/admin/tournaments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast({ tone: "danger", message: "Could not update tournament status." });
      return;
    }
    toast({ tone: "success", message: status === "approved" ? "Approved" : "Rejected" });
    await load();
  }

  function requestDelete(t: AdminTournamentRow) {
    setDeleteTarget(t);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(true);
    setRows((prev) => prev.filter((x) => x.id !== id));
    const res = await fetch(`/api/admin/tournaments/${id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteOpen(false);
    setDeleteTarget(null);
    if (!res.ok) {
      toast({ tone: "danger", message: "Could not delete tournament." });
      await load();
      return;
    }
    toast({ tone: "success", message: "Tournament deleted" });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-medium tracking-tight">Admin Dashboard</div>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            Review submissions and manage all tournaments.
          </div>
        </div>
        <Link href="/admin/pending" className="text-sm font-medium text-[var(--primary)] hover:underline">
          Pending Approval →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="ui-label text-[color:var(--muted)]">Total</div>
          <div className="mt-2 text-2xl font-medium">{stats.total}</div>
        </Card>
        <Card className="p-5">
          <div className="ui-label text-[color:var(--muted)]">Pending</div>
          <div className="mt-2 text-2xl font-medium text-[var(--warning)]">{stats.pending}</div>
        </Card>
        <Card className="p-5">
          <div className="ui-label text-[color:var(--muted)]">Approved</div>
          <div className="mt-2 text-2xl font-medium text-[var(--success)]">{stats.approved}</div>
        </Card>
        <Card className="p-5">
          <div className="ui-label text-[color:var(--muted)]">Rejected</div>
          <div className="mt-2 text-2xl font-medium text-[var(--danger)]">{stats.rejected}</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-medium">Pending tournaments</div>
          <div className="text-sm text-[color:var(--muted)]">{pending.length} pending</div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
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
              ) : pending.length === 0 ? (
                <tr>
                  <td className="py-4 text-[color:var(--muted)]" colSpan={6}>
                    No pending tournaments.
                  </td>
                </tr>
              ) : (
                pending.map((t) => (
                  <tr key={t.id} className="border-t border-[color:var(--border)] [border-top-width:0.5px]">
                    <td className="py-3 pr-3 font-medium">{t.name}</td>
                    <td className="py-3 pr-3">{t.format ? <Badge variant={t.format}>{t.format}</Badge> : "—"}</td>
                    <td className="py-3 pr-3">{t.city ?? "—"}</td>
                    <td className="py-3 pr-3">{t.organizer?.organization ?? t.organizer?.full_name ?? "—"}</td>
                    <td className="py-3 pr-3">{fmtDate(t.created_at)}</td>
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
                        <Button variant="danger" className="h-10 rounded-xl" onClick={() => requestDelete(t)}>
                          Delete
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

      <Modal open={!!view} onClose={() => setView(null)} title="Tournament details">
        {view ? (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="sm:col-span-2">
              <div className="text-lg font-medium">{view.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {view.format ? <Badge variant={view.format}>{view.format}</Badge> : null}
                <Badge variant={statusVariant(view.status)}>{view.status}</Badge>
              </div>
            </div>
            <div>
              <div className="ui-label text-[color:var(--muted)]">City</div>
              <div className="mt-1 font-medium">{view.city ?? "—"}</div>
            </div>
            <div>
              <div className="ui-label text-[color:var(--muted)]">Venue</div>
              <div className="mt-1 font-medium">{view.venue ?? "—"}</div>
            </div>
            <div>
              <div className="ui-label text-[color:var(--muted)]">Submitted</div>
              <div className="mt-1 font-medium">{fmtDate(view.created_at)}</div>
            </div>
            <div>
              <div className="ui-label text-[color:var(--muted)]">Organizer</div>
              <div className="mt-1 font-medium">{view.organizer?.organization ?? "—"}</div>
              <div className="mt-1 text-[color:var(--muted)]">{view.organizer?.email ?? "—"}</div>
              <div className="mt-1 text-[color:var(--muted)]">{view.organizer?.whatsapp ?? "—"}</div>
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end pt-2">
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

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Tournament?">
        <div className="text-sm text-[color:var(--muted)]">
          This will permanently remove this tournament from the platform.
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} isLoading={deleting}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

