import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getMongoDb } from "@/lib/mongo/server";
import { RegistrationSidebar } from "./registration-sidebar";

type Tournament = {
  id: string;
  name: string;
  format: "BP" | "AP" | "WSDC" | "KP" | null;
  category: "Inter-School" | "Inter-College" | "Inter-University" | "Open" | null;
  type: "In-Person" | "Online" | "Hybrid" | null;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  address: string | null;
  maps_link: string | null;
  team_cap: number | null;
  registered_teams: number | null;
  fee: string | null;
  registration_deadline: string | null;
  registration_link: string | null;
  registration_open: boolean | null;
  rounds: number | null;
  judges: string | null;
  prizes: string | null;
  description: string | null;
  rules: string | null;
  payment_info: string | null;
  whatsapp: string | null;
  facebook: string | null;
  status: "pending" | "approved" | "rejected" | string;
  organization: string | null;
  email: string | null;
};

function parseDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateRange(start: string | null, end: string | null) {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s && !e) return "Date TBA";
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  if (s && e) {
    const same =
      s.getFullYear() === e.getFullYear() &&
      s.getMonth() === e.getMonth() &&
      s.getDate() === e.getDate();
    return same ? fmt(s) : `${fmt(s)}–${fmt(e)}`;
  }
  return fmt(s ?? e!);
}

function registrationBadge(t: Tournament): { variant: "open" | "closing" | "closed" | "full" | "opening"; label: string } {
  const cap = t.team_cap ?? null;
  const reg = t.registered_teams ?? 0;
  const deadline = parseDate(t.registration_deadline);
  const now = new Date();

  const isFull = cap !== null && cap > 0 && reg >= cap;
  if (isFull) return { variant: "full", label: "Full" };

  const deadlinePassed = deadline ? new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()) < new Date(now.getFullYear(), now.getMonth(), now.getDate()) : false;
  if (deadlinePassed) return { variant: "closed", label: "Closed" };

  if (t.registration_open === false) {
    if (deadline) return { variant: "opening", label: "Opening Soon" };
    return { variant: "closed", label: "Closed" };
  }

  const closingSoon = deadline ? (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7 : false;
  if (closingSoon) return { variant: "closing", label: "Closing soon" };

  return { variant: "open", label: "Open" };
}

function extractSchedule(text: string | null) {
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const dayIdxs = lines
    .map((l, idx) => ({ l, idx }))
    .filter(({ l }) => /^day\s*\d+[:\-]?/i.test(l) || /^day\s*one[:\-]?/i.test(l));
  if (dayIdxs.length === 0) return null;

  const blocks: Array<{ title: string; items: string[] }> = [];
  for (let i = 0; i < dayIdxs.length; i++) {
    const start = dayIdxs[i]!.idx;
    const end = dayIdxs[i + 1]?.idx ?? lines.length;
    const title = lines[start] || `Day ${i + 1}`;
    const items = lines
      .slice(start + 1, end)
      .filter(Boolean)
      .map((x) => x.replace(/^[\-\u2022]\s*/, ""));
    blocks.push({ title, items });
  }
  return blocks;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const db = await getMongoDb();
    const t = await db.collection("tournaments").findOne(
      { _id: id as any, status: "approved" } as any,
      { projection: { name: 1, city: 1, country: 1, status: 1 } },
    );
    if (!t) {
      return {
        title: "Tournament not found — DebateHub",
        description: "Tournament not found.",
      };
    }

    const loc = `${t.city ?? ""}${t.country ? `, ${t.country}` : ""}`.trim();
    return {
      title: `${t.name} — DebateHub`,
      description: loc
        ? `Tournament details for ${t.name} (${loc}).`
        : `Tournament details for ${t.name}.`,
    };
  } catch {
    return { title: "Tournament — DebateHub", description: "Tournament details on DebateHub." };
  }
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let t = await (async () => {
    const db = await getMongoDb();
    return db.collection("tournaments").findOne(
      { _id: id as any, status: "approved" } as any,
      {
        projection: {
          _id: 1,
          name: 1,
          format: 1,
          category: 1,
          type: 1,
          start_date: 1,
          end_date: 1,
          city: 1,
          country: 1,
          venue: 1,
          address: 1,
          maps_link: 1,
          team_cap: 1,
          registered_teams: 1,
          fee: 1,
          registration_deadline: 1,
          registration_link: 1,
          registration_open: 1,
          rounds: 1,
          judges: 1,
          prizes: 1,
          description: 1,
          rules: 1,
          payment_info: 1,
          whatsapp: 1,
          facebook: 1,
          status: 1,
          organization: 1,
          email: 1,
        },
      },
    );
  })();

  if (!t) notFound();
  const mapped = t as any as Tournament;
  const tournament = { ...mapped, id: (mapped as any)._id ?? mapped.id };
  // Keep existing template references working (`t.*`) by aliasing to the normalized object.
  t = tournament as any;

  const cap = tournament.team_cap ?? null;
  const reg = tournament.registered_teams ?? 0;
  const pct =
    cap && cap > 0 ? Math.round((Math.min(reg, cap) / cap) * 100) : 0;

  const regBadge = registrationBadge(tournament);
  const schedule = extractSchedule(tournament.description);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 pb-24 lg:pb-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          ← Back to Browse
        </Link>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Left */}
        <div className="space-y-5">
          {/* 1) Hero */}
          <Card className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {tournament.format ? (
                  <Badge variant={tournament.format}>{tournament.format}</Badge>
                ) : null}
                {tournament.category ? (
                  <Badge variant="category" caps={false}>
                    {tournament.category}
                  </Badge>
                ) : null}
                <Badge variant={regBadge.variant}>{regBadge.label}</Badge>
                {tournament.type ? (
                  <Badge variant="pending" className="normal-case" caps={false}>
                    {tournament.type}
                  </Badge>
                ) : null}
              </div>

              <h1 className="text-3xl font-medium tracking-tight">{tournament.name}</h1>

              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Date</div>
                  <div className="mt-1 text-sm font-medium">
                    {formatDateRange(tournament.start_date, tournament.end_date)}
                  </div>
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Location</div>
                  <div className="mt-1 text-sm font-medium">
                    {(tournament.city ?? "City TBA") +
                      (tournament.country ? `, ${tournament.country}` : "")}
                  </div>
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Venue</div>
                  <div className="mt-1 text-sm font-medium">
                    {tournament.venue ?? "TBA"}
                  </div>
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Teams</div>
                  <div className="mt-1 text-sm font-medium">
                    {reg}
                    {cap ? ` / ${cap}` : ""}
                  </div>
                  <div className="mt-2">
                    <Progress value={cap ? pct : 0} />
                  </div>
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Rounds</div>
                  <div className="mt-1 text-sm font-medium">
                    {tournament.rounds ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 2) About */}
          <Card className="p-6">
            <h2 className="text-lg font-medium">About</h2>
            <div className="mt-3 whitespace-pre-wrap text-sm text-[color:var(--muted)]">
              {tournament.description?.trim()
                ? tournament.description
                : "No description provided."}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4">
                <div className="ui-label text-[color:var(--muted)]">Format</div>
                <div className="mt-1 text-sm font-medium">{tournament.format ?? "—"}</div>
              </div>
              <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4">
                <div className="ui-label text-[color:var(--muted)]">Category</div>
                <div className="mt-1 text-sm font-medium">{tournament.category ?? "Open"}</div>
              </div>
              <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4">
                <div className="ui-label text-[color:var(--muted)]">Team cap</div>
                <div className="mt-1 text-sm font-medium">{tournament.team_cap ?? "—"}</div>
              </div>
              <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4">
                <div className="ui-label text-[color:var(--muted)]">Fee</div>
                <div className="mt-1 text-sm font-medium">
                  {tournament.fee?.trim() ? tournament.fee : "—"}
                </div>
              </div>
              <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4">
                <div className="ui-label text-[color:var(--muted)]">Judges</div>
                <div className="mt-1 text-sm font-medium">
                  {tournament.judges?.trim() ? tournament.judges : "—"}
                </div>
              </div>
              <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4 sm:col-span-2">
                <div className="ui-label text-[color:var(--muted)]">Prizes</div>
                <div className="mt-1 text-sm font-medium">
                  {tournament.prizes?.trim() ? tournament.prizes : "—"}
                </div>
              </div>
            </div>
          </Card>

          {/* 3) Schedule */}
          {schedule ? (
            <Card className="p-6">
              <h2 className="text-lg font-medium">Schedule</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {schedule.map((day) => (
                  <div
                    key={day.title}
                    className="rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4"
                  >
                    <div className="font-medium">{day.title}</div>
                    <ul className="mt-2 space-y-1 text-sm text-[color:var(--muted)]">
                      {day.items.length ? (
                        day.items.map((x, idx) => <li key={idx}>• {x}</li>)
                      ) : (
                        <li>• Details TBA</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {/* 4) Format and Rules */}
          <Card className="p-6">
            <h2 className="text-lg font-medium">Format and Rules</h2>
            <div className="mt-3 whitespace-pre-wrap text-sm text-[color:var(--muted)]">
              {tournament.rules?.trim() ? tournament.rules : "No rules provided yet."}
            </div>
            {tournament.payment_info?.trim() ? (
              <div className="mt-6">
                <div className="ui-label text-[color:var(--muted)]">
                  Payment info
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--muted)]">
                  {tournament.payment_info}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-5 lg:sticky lg:top-20">
          <RegistrationSidebar
            tournament={{
              id: tournament.id,
              registration_link: tournament.registration_link,
              registration_open: tournament.registration_open,
              registration_deadline: tournament.registration_deadline,
              fee: tournament.fee,
              team_cap: tournament.team_cap,
              registered_teams: tournament.registered_teams,
            }}
          />

          <Card className="p-5">
            <div className="ui-label text-[color:var(--muted)]">Organizer</div>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[color:var(--muted)]">Organization</span>
                <span className="font-medium">{tournament.organization ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[color:var(--muted)]">Email</span>
                {tournament.email ? (
                  <a
                    href={`mailto:${tournament.email}`}
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    {tournament.email}
                  </a>
                ) : (
                  <span className="font-medium">—</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[color:var(--muted)]">WhatsApp</span>
                <span className="font-medium">{tournament.whatsapp ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[color:var(--muted)]">Facebook</span>
                {tournament.facebook ? (
                  <a
                    href={tournament.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    Open
                  </a>
                ) : (
                  <span className="font-medium">—</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

