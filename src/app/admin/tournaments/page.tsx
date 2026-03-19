"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { AdminTournamentRow } from "../_lib/types";

function statusVariant(status: string) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

export default function AllTournamentsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<AdminTournamentRow[]>([]);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminTournamentRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tournaments");
      if (!res.ok) throw new Error("Could not load tournaments.");
      const data = (await res.json()) as any;
      setRows((data?.items ?? []) as AdminTournamentRow[]);
    } catch (e: any) {
      toast({ tone: "danger", message: e?.message ?? "Could not load tournaments." });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const org =
        `${r.organizer?.organization ?? ""} ${r.organizer?.full_name ?? ""} ${r.organizer?.email ?? ""}`.toLowerCase();
      return `${r.name ?? ""}`.toLowerCase().includes(needle) || org.includes(needle);
    });
  }, [rows, q]);

  async function setStatus(id: string, status: "approved" | "rejected") {
    const res = await fetch(`/api/admin/tournaments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return toast({ tone: "danger", message: "Update failed." });
    toast({ tone: "success", message: status === "approved" ? "Approved" : "Rejected" });
    await load();
  }

  async function deleteTournament(id: string, name: string) {
    const target = rows.find((r) => r.id === id) ?? null;
    setDeleteTarget(target ?? ({ id, name } as any));
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
      toast({ tone: "danger", message: "Delete failed." });
      await load();
      return;
    }
    toast({ tone: "success", message: "Tournament deleted" });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-2xl font-medium tracking-tight">All Tournaments</div>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            Approve, reject, or delete any tournament.
          </div>
        </div>
        <div className="w-full sm:w-[360px]">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or organizer…"
          />
        </div>
      </div>

      <Card className="p-6">
        <div className="text-sm text-[color:var(--muted)]">
          {loading ? "Loading…" : `${filtered.length} tournaments`}
        </div>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="text-left text-[color:var(--muted)]">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Format</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Organizer</th>
                <th className="py-2 pr-3 font-medium">City</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="py-4 text-[color:var(--muted)]" colSpan={6}>
                    No results.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-t border-[color:var(--border)] [border-top-width:0.5px]">
                    <td className="py-3 pr-3">
                      <div className="font-medium">{t.name}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {t.organizer?.email ?? ""}
                      </div>
                    </td>
                    <td className="py-3 pr-3">{t.format ? <Badge variant={t.format}>{t.format}</Badge> : "—"}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                    </td>
                    <td className="py-3 pr-3">
                      {t.organizer?.organization ?? t.organizer?.full_name ?? "—"}
                    </td>
                    <td className="py-3 pr-3">{t.city ?? "—"}</td>
                    <td className="py-3 text-right">
                      <div className={cn("inline-flex items-center gap-2")}>
                        <Button className="h-10 rounded-xl" onClick={() => setStatus(t.id, "approved")}>
                          Approve
                        </Button>
                        <Button variant="danger" className="h-10 rounded-xl" onClick={() => setStatus(t.id, "rejected")}>
                          Reject
                        </Button>
                        <Button variant="ghost" className="h-10 rounded-xl" onClick={() => deleteTournament(t.id, t.name)}>
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

