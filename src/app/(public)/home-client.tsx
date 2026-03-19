"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";

type TournamentFormat = "BP" | "AP" | "WSDC" | "KP" | null;
type TournamentType = "In-Person" | "Online" | "Hybrid" | null;
type TournamentCategory = "Inter-School" | "Inter-College" | "Inter-University" | "Open" | null;

export type TournamentRow = {
  id: string;
  name: string;
  format: TournamentFormat;
  category: TournamentCategory;
  type: TournamentType;
  start_date: string | null;
  end_date: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  team_cap: number | null;
  registered_teams: number | null;
  registration_deadline: string | null;
  registration_open: boolean | null;
};

type DateTab = "all" | "upcoming" | "week" | "month";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

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

function registrationStatus(t: TournamentRow): {
  variant: "open" | "closing" | "closed" | "full";
  label: string;
} {
  const cap = t.team_cap ?? null;
  const reg = t.registered_teams ?? 0;
  const deadline = parseDate(t.registration_deadline);
  const now = new Date();

  const isFull = cap !== null && cap > 0 && reg >= cap;
  if (isFull) return { variant: "full", label: "Full" };

  const isClosedByFlag = t.registration_open === false;
  const isClosedByDate = deadline ? startOfDay(deadline) < startOfDay(now) : false;
  if (isClosedByFlag || isClosedByDate) return { variant: "closed", label: "Closed" };

  const closingSoon =
    deadline ? startOfDay(deadline) <= startOfDay(addDays(now, 7)) : false;
  if (closingSoon) return { variant: "closing", label: "Closing soon" };

  return { variant: "open", label: "Open" };
}

function matchesSearch(t: TournamentRow, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${t.name ?? ""} ${t.city ?? ""} ${t.country ?? ""}`.toLowerCase();
  return hay.includes(needle);
}

function inDateTab(t: TournamentRow, tab: DateTab) {
  if (tab === "all") return true;
  const s = parseDate(t.start_date);
  if (!s) return false;

  const today = startOfDay(new Date());
  const start = startOfDay(s);

  if (tab === "upcoming") return start >= today;
  if (tab === "week") return start >= today && start <= startOfDay(addDays(today, 7));
  if (tab === "month") return start >= today && sameMonth(start, today);
  return true;
}

function BackToTop() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 700);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      className={cn(
        "sm:hidden fixed bottom-6 right-4 z-40",
        "h-11 rounded-full px-4 text-sm font-medium",
        "bg-[var(--primary)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
      )}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      Back to top
    </button>
  );
}

export default function HomeClient({
  initial,
  countries,
  fetchError,
}: {
  initial: TournamentRow[];
  countries: string[];
  fetchError?: string | null;
}) {
  const [query, setQuery] = React.useState("");
  const [format, setFormat] = React.useState<"all" | "BP" | "AP" | "WSDC" | "KP">(
    "all",
  );
  const [country, setCountry] = React.useState<string>("all");
  const [category, setCategory] = React.useState<
    "all" | "Inter-School" | "Inter-College" | "Inter-University" | "Open"
  >("all");
  const [dateTab, setDateTab] = React.useState<DateTab>("all");

  const filtered = React.useMemo(() => {
    return initial
      .filter((t) => matchesSearch(t, query))
      .filter((t) => (format === "all" ? true : t.format === format))
      .filter((t) => (country === "all" ? true : (t.country ?? "") === country))
      .filter((t) =>
        category === "all" ? true : ((t.category ?? "Open") === category),
      )
      .filter((t) => inDateTab(t, dateTab));
  }, [initial, query, format, country, category, dateTab]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight">DebateHub</h1>
        <p className="text-[color:var(--muted)]">
          Find debate tournaments happening near you
        </p>
      </div>

      <div className="mt-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, city, country…"
          aria-label="Search tournaments"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="ui-label mr-1 text-[color:var(--muted)]">Format</div>
          {(["all", "BP", "AP", "WSDC", "KP"] as const).map((v) => {
            const active = format === v;
            return (
              <button
                key={v}
                onClick={() => setFormat(v)}
                className={cn(
                  "min-h-[44px] rounded-full px-4 text-sm font-medium",
                  "border border-[color:var(--border)] [border-width:0.5px]",
                  active
                    ? "bg-[var(--blue-bg)] text-[var(--blue-text)]"
                    : "bg-white hover:bg-[rgba(24,95,165,0.06)]",
                )}
              >
                {v === "all" ? "All" : v}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 sm:items-center sm:w-[640px]">
            <div className="flex items-center gap-2">
              <div className="ui-label shrink-0 text-[color:var(--muted)]">
                Country
              </div>
              <Select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="all">All countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="ui-label shrink-0 text-[color:var(--muted)]">
                Category
              </div>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="all">All Categories</option>
                <option value="Inter-School">Inter-School</option>
                <option value="Inter-College">Inter-College</option>
                <option value="Inter-University">Inter-University</option>
                <option value="Open">Open</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
            <div className="ui-label mr-1 text-[color:var(--muted)]">Date</div>
            {(
              [
                ["all", "All"],
                ["upcoming", "Upcoming"],
                ["week", "This Week"],
                ["month", "This Month"],
              ] as const
            ).map(([key, label]) => {
              const active = dateTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setDateTab(key)}
                  className={cn(
                    "min-h-[44px] rounded-full px-4 text-sm font-medium",
                    "border border-[color:var(--border)] [border-width:0.5px]",
                    active
                      ? "bg-[var(--blue-bg)] text-[var(--blue-text)]"
                      : "bg-white hover:bg-[rgba(24,95,165,0.06)]",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 text-sm text-[color:var(--muted)]">
        {`${filtered.length} tournaments found`}
      </div>

      {fetchError ? (
        <Card className="mt-4 p-6">
          <div className="text-lg font-medium">Couldn’t load tournaments</div>
          <div className="mt-1 text-sm text-[color:var(--muted)]">{fetchError}</div>
          <div className="mt-4">
            <Button className="h-11 rounded-xl" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <Card className="col-span-full p-6">
            <div className="text-lg font-medium">No tournaments found</div>
            <div className="mt-1 text-sm text-[color:var(--muted)]">
              Try adjusting your search or filters.
            </div>
          </Card>
        ) : null}

        {filtered.map((t) => {
          const cap = t.team_cap ?? null;
          const reg = t.registered_teams ?? 0;
          const pct = cap && cap > 0 ? Math.round((Math.min(reg, cap) / cap) * 100) : 0;
          const regStatus = registrationStatus(t);
          const fmt = (t.format ?? "BP") as "BP" | "AP" | "WSDC" | "KP";
          const cat = (t.category ?? "Open") as Exclude<TournamentCategory, null>;

          return (
            <Link key={t.id} href={`/tournament/${t.id}`} className="block">
              <Card className="group h-full p-5 transition-colors hover:bg-[rgba(24,95,165,0.04)]">
                <div className="min-w-0">
                  <div className="truncate text-lg font-medium">{t.name}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={fmt}>{fmt}</Badge>
                    <Badge variant="category" caps={false}>
                      {cat}
                    </Badge>
                    <Badge variant={regStatus.variant}>{regStatus.label}</Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
                  <div>
                    <span className="font-medium text-[color:var(--text)]">Date:</span>{" "}
                    {formatDateRange(t.start_date, t.end_date)}
                  </div>
                  <div>
                    <span className="font-medium text-[color:var(--text)]">Location:</span>{" "}
                    {(t.city ?? "City TBA") + (t.country ? `, ${t.country}` : "")}
                  </div>
                  <div>
                    <span className="font-medium text-[color:var(--text)]">Venue:</span>{" "}
                    {t.venue ?? "TBA"}
                  </div>
                  <div>
                    <span className="font-medium text-[color:var(--text)]">Type:</span>{" "}
                    {t.type ?? "TBA"}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-[color:var(--muted)]">
                      Teams{" "}
                      <span className="font-medium text-[color:var(--text)]">{reg}</span>
                      {cap ? (
                        <>
                          {" "}
                          / <span className="font-medium text-[color:var(--text)]">{cap}</span>
                        </>
                      ) : null}
                    </div>
                    {cap ? <div className="text-xs text-[color:var(--muted)]">{pct}%</div> : null}
                  </div>
                  <div className="mt-2">
                    <Progress value={cap ? pct : 0} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <BackToTop />
    </main>
  );
}

