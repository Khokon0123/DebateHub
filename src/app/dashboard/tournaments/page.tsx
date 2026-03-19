"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { getDashboardSupabase } from "../_lib/supabase";
import type { TournamentRow } from "../_lib/types";

function fmtDate(d: string | null) {
  if (!d) return "Date TBA";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return d;
  return x.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function statusVariant(status: string) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

export default function MyTournamentsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<TournamentRow[]>([]);

  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<TournamentRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<TournamentRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [edit, setEdit] = React.useState({
    name: "",
    format: "" as "" | "BP" | "AP" | "WSDC" | "KP",
    type: "" as "" | "In-Person" | "Online" | "Hybrid",
    start_date: "",
    end_date: "",
    city: "",
    country: "",
    venue: "",
    team_cap: "",
    rounds: "",
    fee: "",
    registration_deadline: "",
    registration_link: "",
    description: "",
    rules: "",
    prizes: "",
  });

  async function load() {
    const supabase = getDashboardSupabase();
    if (!supabase) return;
    const sb = supabase;

    setLoading(true);
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return;
    setUserId(auth.user.id);

    const { data, error } = await sb
      .from("tournaments")
      .select(
        "id,user_id,name,format,status,start_date,end_date,city,country,venue,type,team_cap,registered_teams,registration_open,registration_link,updated_at,rounds,fee,registration_deadline,address,maps_link,description,rules,prizes",
      )
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ tone: "danger", message: error.message });
      setItems([]);
      setLoading(false);
      return;
    }
    setItems((data as TournamentRow[]) ?? []);
    setLoading(false);
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEdit(t: TournamentRow) {
    setCurrent(t);
    setEdit({
      name: t.name ?? "",
      format: (t.format ?? "") as any,
      type: (t.type ?? "") as any,
      start_date: t.start_date ?? "",
      end_date: t.end_date ?? "",
      city: t.city ?? "",
      country: t.country ?? "",
      venue: t.venue ?? "",
      team_cap: t.team_cap?.toString() ?? "",
      rounds: t.rounds?.toString() ?? "",
      fee: t.fee ?? "",
      registration_deadline: t.registration_deadline ?? "",
      registration_link: t.registration_link ?? "",
      description: t.description ?? "",
      rules: t.rules ?? "",
      prizes: t.prizes ?? "",
    });
    setOpen(true);
  }

  async function saveEdit() {
    if (!current || !userId) return;
    if (!edit.name.trim()) {
      toast({ tone: "danger", message: "Tournament name is required." });
      return;
    }

    const supabase = getDashboardSupabase();
    if (!supabase) return;
    const sb = supabase;

    setSaving(true);
    const { error } = await sb
      .from("tournaments")
      .update({
        name: edit.name.trim(),
        format: edit.format || null,
        type: edit.type || null,
        start_date: edit.start_date || null,
        end_date: edit.end_date || null,
        city: edit.city.trim() || null,
        country: edit.country.trim() || null,
        venue: edit.venue.trim() || null,
        team_cap: edit.team_cap ? Number(edit.team_cap) : null,
        rounds: edit.rounds ? Number(edit.rounds) : null,
        fee: edit.fee.trim() || null,
        registration_deadline: edit.registration_deadline || null,
        registration_link: edit.registration_link.trim() || null,
        description: edit.description.trim() || null,
        rules: edit.rules.trim() || null,
        prizes: edit.prizes.trim() || null,
        status: "pending",
      })
      .eq("id", current.id)
      .eq("user_id", userId);

    setSaving(false);
    if (error) {
      toast({ tone: "danger", message: error.message });
      return;
    }

    toast({ tone: "success", message: "Saved. Status reset to pending for re-approval." });
    setOpen(false);
    setCurrent(null);
    await load();
  }

  async function deleteTournament(t: TournamentRow) {
    if (!userId) return;
    setDeleteTarget(t);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!userId || !deleteTarget) return;

    const supabase = getDashboardSupabase();
    if (!supabase) return;
    const sb = supabase;

    setDeleting(true);
    const id = deleteTarget.id;
    setItems((prev) => prev.filter((x) => x.id !== id));

    const { error } = await sb
      .from("tournaments")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    setDeleting(false);
    setDeleteOpen(false);
    setDeleteTarget(null);

    if (error) {
      toast({ tone: "danger", message: error.message });
      await load();
      return;
    }
    toast({ tone: "success", message: "Tournament deleted successfully" });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-medium tracking-tight">My Tournaments</div>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            Manage and update your submissions.
          </div>
        </div>
        <Link href="/submit">
          <Button className="h-11 rounded-xl">Submit Tournament</Button>
        </Link>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-[color:var(--muted)]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4 text-sm text-[color:var(--muted)]">
            No tournaments yet.{" "}
            <Link href="/submit" className="font-medium text-[var(--primary)] hover:underline">
              Submit your first tournament
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-3 rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {t.format ? <Badge variant={t.format}>{t.format}</Badge> : null}
                    <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                    <span className="text-xs text-[color:var(--muted)]">
                      {fmtDate(t.start_date)} • {(t.city ?? "City TBA")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="h-11 rounded-xl" onClick={() => openEdit(t)}>
                    Edit
                  </Button>
                  <Button variant="danger" className="h-11 rounded-xl" onClick={() => deleteTournament(t)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit tournament">
        <div className="rounded-[14px] bg-[rgba(133,79,11,0.10)] p-4 text-sm text-[var(--warning)]">
          Important: saving any edit will set this tournament’s status back to{" "}
          <span className="font-medium">pending</span> so an admin can re-approve it.
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="ui-label text-[color:var(--muted)]">Tournament name</div>
            <Input value={edit.name} onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))} />
          </div>

          <div>
            <div className="ui-label text-[color:var(--muted)]">Format</div>
            <Select value={edit.format} onChange={(e) => setEdit((p) => ({ ...p, format: e.target.value as any }))}>
              <option value="">—</option>
              <option value="BP">BP</option>
              <option value="AP">AP</option>
              <option value="WSDC">WSDC</option>
              <option value="KP">KP</option>
            </Select>
          </div>
          <div>
            <div className="ui-label text-[color:var(--muted)]">Type</div>
            <Select value={edit.type} onChange={(e) => setEdit((p) => ({ ...p, type: e.target.value as any }))}>
              <option value="">—</option>
              <option value="In-Person">In-Person</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </Select>
          </div>

          <div>
            <div className="ui-label text-[color:var(--muted)]">Start date</div>
            <Input type="date" value={edit.start_date} onChange={(e) => setEdit((p) => ({ ...p, start_date: e.target.value }))} />
          </div>
          <div>
            <div className="ui-label text-[color:var(--muted)]">End date</div>
            <Input type="date" value={edit.end_date} onChange={(e) => setEdit((p) => ({ ...p, end_date: e.target.value }))} />
          </div>

          <div>
            <div className="ui-label text-[color:var(--muted)]">City</div>
            <Input value={edit.city} onChange={(e) => setEdit((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <div>
            <div className="ui-label text-[color:var(--muted)]">Country</div>
            <Input value={edit.country} onChange={(e) => setEdit((p) => ({ ...p, country: e.target.value }))} />
          </div>

          <div className="sm:col-span-2">
            <div className="ui-label text-[color:var(--muted)]">Venue</div>
            <Input value={edit.venue} onChange={(e) => setEdit((p) => ({ ...p, venue: e.target.value }))} />
          </div>

          <div>
            <div className="ui-label text-[color:var(--muted)]">Team cap</div>
            <Input type="number" min={1} value={edit.team_cap} onChange={(e) => setEdit((p) => ({ ...p, team_cap: e.target.value }))} />
          </div>
          <div>
            <div className="ui-label text-[color:var(--muted)]">Rounds</div>
            <Input type="number" min={0} value={edit.rounds} onChange={(e) => setEdit((p) => ({ ...p, rounds: e.target.value }))} />
          </div>

          <div>
            <div className="ui-label text-[color:var(--muted)]">Fee</div>
            <Input value={edit.fee} onChange={(e) => setEdit((p) => ({ ...p, fee: e.target.value }))} />
          </div>
          <div>
            <div className="ui-label text-[color:var(--muted)]">Registration deadline</div>
            <Input type="date" value={edit.registration_deadline} onChange={(e) => setEdit((p) => ({ ...p, registration_deadline: e.target.value }))} />
          </div>

          <div className="sm:col-span-2">
            <div className="ui-label text-[color:var(--muted)]">Registration link</div>
            <Input value={edit.registration_link} onChange={(e) => setEdit((p) => ({ ...p, registration_link: e.target.value }))} />
          </div>

          <div className="sm:col-span-2">
            <div className="ui-label text-[color:var(--muted)]">Description</div>
            <textarea
              value={edit.description}
              onChange={(e) => setEdit((p) => ({ ...p, description: e.target.value }))}
              className="mt-2 w-full min-h-[110px] rounded-xl bg-white px-3 py-2 text-sm border border-[color:var(--border)] [border-width:0.5px]"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="ui-label text-[color:var(--muted)]">Rules</div>
            <textarea
              value={edit.rules}
              onChange={(e) => setEdit((p) => ({ ...p, rules: e.target.value }))}
              className="mt-2 w-full min-h-[90px] rounded-xl bg-white px-3 py-2 text-sm border border-[color:var(--border)] [border-width:0.5px]"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <Button variant="ghost" className="h-11 rounded-xl" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="h-11 rounded-xl" onClick={saveEdit} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Tournament?">
        <div className="text-sm text-[color:var(--muted)]">
          This will permanently remove your tournament from the public listing. This cannot be undone.
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

