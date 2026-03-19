"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Format = "BP" | "AP" | "WSDC" | "KP";
type TType = "In-Person" | "Online" | "Hybrid";
type Platform = "Zoom" | "Meet" | "Teams";
type Category = "Inter-School" | "Inter-College" | "Inter-University" | "Open";

type Profile = {
  full_name: string | null;
  organization: string | null;
  email: string | null;
  whatsapp: string | null;
  facebook: string | null;
};

type FormState = {
  // Step 1
  name: string;
  format: Format | null;
  category: Category;
  type: TType | null;
  start_date: string;
  end_date: string;
  rounds: string;
  team_cap: string;
  description: string;
  rules: string;
  prizes: string;

  // Step 2
  city: string;
  country: string;
  venue: string;
  address: string;
  maps_link: string;
  platform: Platform | "";
  meeting_link: string;

  // Step 3
  registration_deadline: string;
  fee: string;
  registration_link: string;
  payment_info: string;
  judges: string;
  organizer: string;
  contact_email: string;
  whatsapp: string;
  facebook: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isValidUrl(v: string) {
  if (!v.trim()) return true;
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function regStatusPreview(s: FormState): { variant: "open" | "closing" | "closed" | "full" | "opening"; label: string } {
  const cap = Number(s.team_cap || 0);
  const deadline = parseDate(s.registration_deadline);
  const now = new Date();
  const open = true; // submissions always create "open" by default

  if (cap > 0 && 0 >= cap) return { variant: "full", label: "Full" };
  if (!deadline) return { variant: "open", label: "Open" };
  if (!open) return { variant: "opening", label: "Opening Soon" };
  const closingSoon = startOfDay(deadline) <= startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
  return closingSoon ? { variant: "closing", label: "Closing soon" } : { variant: "open", label: "Open" };
}

function StepPill({
  idx,
  active,
  done,
  label,
}: {
  idx: number;
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium",
          "border border-[color:var(--border)] [border-width:0.5px]",
          done
            ? "bg-[rgba(59,109,17,0.10)] text-[var(--success)] border-[rgba(59,109,17,0.25)]"
            : active
              ? "bg-[var(--blue-bg)] text-[var(--blue-text)] border-[var(--primary)]/20"
              : "bg-white text-[color:var(--muted)]",
        )}
      >
        {idx}
      </div>
      <div className={cn("text-sm", active ? "font-medium" : "text-[color:var(--muted)]")}>
        {label}
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div className="mt-1 text-xs text-[var(--danger)]">{msg}</div>;
}

function OptionCard({
  title,
  description,
  selected,
  onClick,
  icon,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-[14px] p-4 w-full",
        "border border-[color:var(--border)] [border-width:0.5px]",
        "hover:bg-[rgba(24,95,165,0.04)]",
        selected && "bg-[var(--blue-bg)] border-[var(--primary)]/25",
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              selected ? "bg-white/70" : "bg-[rgba(0,0,0,0.04)]",
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          {description ? (
            <div className="mt-1 text-xs text-[color:var(--muted)]">{description}</div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function SubmitPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [supabaseReady, setSupabaseReady] = React.useState(true);

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const [s, setS] = React.useState<FormState>({
    name: "",
    format: null,
    category: "Open",
    type: null,
    start_date: "",
    end_date: "",
    rounds: "",
    team_cap: "",
    description: "",
    rules: "",
    prizes: "",

    city: "",
    country: "",
    venue: "",
    address: "",
    maps_link: "",
    platform: "",
    meeting_link: "",

    registration_deadline: "",
    fee: "",
    registration_link: "",
    payment_info: "",
    judges: "",
    organizer: "",
    contact_email: "",
    whatsapp: "",
    facebook: "",
  });

  React.useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setSupabaseReady(false);
      setLoading(false);
      return;
    }
    const sb = supabase;

    async function run() {
      const { data } = await sb.auth.getUser();
      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent("/submit")}`);
        return;
      }

      setUserId(data.user.id);
      try {
        const { data: p } = await sb
          .from("profiles")
          .select("full_name,organization,email,whatsapp,facebook")
          .eq("id", data.user.id)
          .maybeSingle();
        const prof = (p as Profile | null) ?? null;
        setProfile(prof);
        setS((prev) => ({
          ...prev,
          organizer: prof?.organization ?? "",
          contact_email: prof?.email ?? data.user.email ?? "",
          whatsapp: prof?.whatsapp ?? "",
          facebook: prof?.facebook ?? "",
        }));
      } catch {
        // ignore; profile may not exist yet if schema isn't applied
        setS((prev) => ({
          ...prev,
          contact_email: data.user.email ?? "",
        }));
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [router]);

  const progressPct = Math.round(((step - 1) / 3) * 100);

  function validateStep(target: 1 | 2 | 3 | 4): boolean {
    const e: Errors = {};

    if (target === 1) {
      if (!s.name.trim()) e.name = "Tournament Name is required.";
      if (!s.format) e.format = "Format is required.";
      if (!s.type) e.type = "Type is required.";
      if (!s.start_date) e.start_date = "Start Date is required.";
      if (!s.end_date) e.end_date = "End Date is required.";
      const sd = parseDate(s.start_date);
      const ed = parseDate(s.end_date);
      if (sd && ed && startOfDay(ed) < startOfDay(sd)) e.end_date = "End Date must be on or after Start Date.";
      if (!s.team_cap.trim()) e.team_cap = "Team Cap is required.";
      if (s.team_cap && Number(s.team_cap) <= 0) e.team_cap = "Team Cap must be greater than 0.";
      if (!s.description.trim()) e.description = "Description is required.";
      if (s.description.trim().length < 30) e.description = "Description must be at least 30 characters.";
      if (s.description.length > 600) e.description = "Max 600 characters.";
      if (s.rules.length > 400) e.rules = "Max 400 characters.";
      if (s.rounds && Number(s.rounds) < 0) e.rounds = "Rounds must be 0 or more.";
    }

    if (target === 2) {
      if (!s.city.trim()) e.city = "City is required.";
      if (!s.country.trim()) e.country = "Country is required.";
      if (!s.venue.trim()) e.venue = "Venue Name is required.";
      if (s.maps_link && !isValidUrl(s.maps_link)) e.maps_link = "Please enter a valid URL.";
      if ((s.type === "Online" || s.type === "Hybrid")) {
        if (!s.platform) e.platform = "Platform is required for Online/Hybrid.";
        if (!s.meeting_link.trim()) e.meeting_link = "Meeting Link is required for Online/Hybrid.";
        if (s.meeting_link && !isValidUrl(s.meeting_link)) e.meeting_link = "Please enter a valid URL.";
      }
    }

    if (target === 3) {
      if (!s.registration_deadline) e.registration_deadline = "Registration Deadline is required.";
      if (!s.fee.trim()) e.fee = "Entry Fee is required.";
      if (!s.registration_link.trim()) e.registration_link = "Registration Link is required.";
      if (s.registration_link && !isValidUrl(s.registration_link)) e.registration_link = "Please enter a valid URL.";

      if (!s.organizer.trim()) e.organizer = "Organizer/Club Name is required.";
      if (!s.contact_email.trim()) e.contact_email = "Contact Email is required.";
      if (s.contact_email && !isValidEmail(s.contact_email)) e.contact_email = "Please enter a valid email.";
      if (!s.whatsapp.trim()) e.whatsapp = "WhatsApp Number is required.";
      if (s.facebook && !isValidUrl(s.facebook)) e.facebook = "Please enter a valid URL.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (!validateStep(step)) {
      toast({ tone: "danger", message: "Please fix the highlighted fields." });
      return;
    }
    setStep((prev) => (prev === 4 ? 4 : ((prev + 1) as any)));
    setErrors({});
  }

  function prevStep() {
    setStep((prev) => (prev === 1 ? 1 : ((prev - 1) as any)));
    setErrors({});
  }

  async function submit() {
    if (!validateStep(3)) {
      toast({ tone: "danger", message: "Please fix the highlighted fields." });
      setStep(3);
      return;
    }
    if (!userId) {
      toast({ tone: "danger", message: "You must be signed in to submit a tournament." });
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      toast({ tone: "danger", message: "Supabase is not configured." });
      return;
    }
    const sb = supabase;

    setSubmitting(true);

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setSubmitting(false);
      toast({
        tone: "danger",
        message: "Submission is taking longer than expected. Please try again.",
      });
    }, 10000);

    const onlineDetails =
      (s.type === "Online" || s.type === "Hybrid") && (s.platform || s.meeting_link)
        ? `\n\nOnline details:\nPlatform: ${s.platform || "—"}\nMeeting link: ${s.meeting_link || "—"}\n`
        : "";

    const payload = {
      user_id: userId,
      name: s.name.trim(),
      format: s.format,
      category: s.category,
      type: s.type,
      start_date: s.start_date || null,
      end_date: s.end_date || null,
      rounds: s.rounds ? Number(s.rounds) : null,
      team_cap: Number(s.team_cap),
      registered_teams: 0,
      description: (s.description.trim() + onlineDetails).trim(),
      rules: s.rules.trim() || null,
      prizes: s.prizes.trim() || null,

      city: s.city.trim(),
      country: s.country.trim(),
      venue: s.venue.trim(),
      address: s.address.trim() || null,
      maps_link: s.maps_link.trim() || null,

      registration_deadline: s.registration_deadline || null,
      fee: s.fee.trim(),
      registration_link: s.registration_link.trim(),
      payment_info: s.payment_info.trim() || null,
      judges: s.judges.trim() || null,
      whatsapp: s.whatsapp.trim() || null,
      facebook: s.facebook.trim() || null,

      status: "approved",
      registration_open: true,
    };

    try {
      const { data, error } = await sb
        .from("tournaments")
        .insert(payload)
        .select("id")
        .maybeSingle();

      if (timedOut) return;
      window.clearTimeout(timeoutId);
      setSubmitting(false);

      if (error || !data?.id) {
        toast({
          tone: "danger",
          message: error?.message || "Could not submit tournament.",
        });
        return;
      }

      toast({ tone: "success", message: "Tournament submitted and now live!" });
      router.replace("/dashboard/tournaments");
    } catch (e: any) {
      if (timedOut) return;
      window.clearTimeout(timeoutId);
      setSubmitting(false);
      toast({
        tone: "danger",
        message: e?.message || "Could not submit tournament.",
      });
    }
  }

  if (!supabaseReady) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Card className="p-6">
          <div className="text-lg font-medium">Supabase not configured</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">
            Add real values to <code className="font-medium">.env.local</code> to enable submissions.
          </div>
        </Card>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-medium">Submit Tournament</div>
              <div className="mt-1 text-sm text-[color:var(--muted)]">
                Loading your organizer profile…
              </div>
            </div>
            <Spinner />
          </div>
        </Card>
      </main>
    );
  }

  const descCount = `${Math.min(s.description.length, 600)}/600`;
  const rulesCount = `${Math.min(s.rules.length, 400)}/400`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-medium tracking-tight">Submit Tournament</div>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            Step {step} of 4
          </div>
        </div>
      </div>

      <Card className="p-5">
        <div className="grid gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <StepPill idx={1} label="Details" active={step === 1} done={step > 1} />
            <StepPill idx={2} label="Location" active={step === 2} done={step > 2} />
            <StepPill idx={3} label="Registration" active={step === 3} done={step > 3} />
            <StepPill idx={4} label="Review" active={step === 4} done={false} />
          </div>
          <Progress value={progressPct} />
        </div>
      </Card>

      <div className="mt-5">
        {/* STEP 1 */}
        {step === 1 ? (
          <Card className="p-6">
            <div className="text-lg font-medium">Step 1 — Tournament Details</div>

            <div className="mt-5 grid gap-4">
              <div>
                <div className="ui-label text-[color:var(--muted)]">Tournament Name *</div>
                <Input
                  value={s.name}
                  onChange={(e) => setS((p) => ({ ...p, name: e.target.value }))}
                  error={!!errors.name}
                  placeholder="e.g., Spring Invitational"
                />
                <FieldError msg={errors.name} />
              </div>

              <div>
                <div className="ui-label text-[color:var(--muted)]">Format *</div>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(["BP", "AP", "WSDC", "KP"] as const).map((f) => (
                    <OptionCard
                      key={f}
                      title={f}
                      selected={s.format === f}
                      onClick={() => setS((p) => ({ ...p, format: f }))}
                      description="Format"
                    />
                  ))}
                </div>
                <FieldError msg={errors.format} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Category</div>
                  <Select
                    value={s.category}
                    onChange={(e) =>
                      setS((p) => ({ ...p, category: e.target.value as Category }))
                    }
                  >
                    <option value="Inter-School">Inter-School</option>
                    <option value="Inter-College">Inter-College</option>
                    <option value="Inter-University">Inter-University</option>
                    <option value="Open">Open</option>
                  </Select>
                </div>
                <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4 text-sm text-[color:var(--muted)]">
                  Category helps users filter tournaments on the public listing.
                </div>
              </div>

              <div>
                <div className="ui-label text-[color:var(--muted)]">Type *</div>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {([
                    { t: "In-Person" as const, icon: "🏛️", desc: "Physical venue" },
                    { t: "Online" as const, icon: "💻", desc: "Virtual tournament" },
                    { t: "Hybrid" as const, icon: "🌐", desc: "Online + venue" },
                  ]).map(({ t, icon, desc }) => (
                    <OptionCard
                      key={t}
                      title={t}
                      description={desc}
                      selected={s.type === t}
                      onClick={() => setS((p) => ({ ...p, type: t }))}
                      icon={<span className="text-lg">{icon}</span>}
                    />
                  ))}
                </div>
                <FieldError msg={errors.type} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Start Date *</div>
                  <Input
                    type="date"
                    value={s.start_date}
                    onChange={(e) => setS((p) => ({ ...p, start_date: e.target.value }))}
                    error={!!errors.start_date}
                  />
                  <FieldError msg={errors.start_date} />
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">End Date *</div>
                  <Input
                    type="date"
                    value={s.end_date}
                    onChange={(e) => setS((p) => ({ ...p, end_date: e.target.value }))}
                    error={!!errors.end_date}
                  />
                  <FieldError msg={errors.end_date} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Number of Preliminary Rounds</div>
                  <Input
                    type="number"
                    value={s.rounds}
                    onChange={(e) => setS((p) => ({ ...p, rounds: e.target.value }))}
                    min={0}
                    error={!!errors.rounds}
                    placeholder="e.g., 5"
                  />
                  <FieldError msg={errors.rounds} />
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Team Cap *</div>
                  <Input
                    type="number"
                    value={s.team_cap}
                    onChange={(e) => setS((p) => ({ ...p, team_cap: e.target.value }))}
                    min={1}
                    error={!!errors.team_cap}
                    placeholder="e.g., 64"
                  />
                  <FieldError msg={errors.team_cap} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="ui-label text-[color:var(--muted)]">Description * (min 30 chars)</div>
                  <div className="text-xs text-[color:var(--muted)]">{descCount}</div>
                </div>
                <textarea
                  value={s.description}
                  onChange={(e) => setS((p) => ({ ...p, description: e.target.value.slice(0, 600) }))}
                  className={cn(
                    "mt-2 w-full min-h-[140px] rounded-xl bg-white px-3 py-2 text-sm",
                    "border border-[color:var(--border)] [border-width:0.5px]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page-bg)]",
                    errors.description && "border-[var(--danger)] focus-visible:ring-[var(--danger)]",
                  )}
                  placeholder="Tell teams what to expect…"
                />
                <FieldError msg={errors.description} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="ui-label text-[color:var(--muted)]">Format and Rules</div>
                    <div className="text-xs text-[color:var(--muted)]">{rulesCount}</div>
                  </div>
                  <textarea
                    value={s.rules}
                    onChange={(e) => setS((p) => ({ ...p, rules: e.target.value.slice(0, 400) }))}
                    className={cn(
                      "mt-2 w-full min-h-[120px] rounded-xl bg-white px-3 py-2 text-sm",
                      "border border-[color:var(--border)] [border-width:0.5px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page-bg)]",
                      errors.rules && "border-[var(--danger)] focus-visible:ring-[var(--danger)]",
                    )}
                    placeholder="Key rules, judging notes, speaker limits…"
                  />
                  <FieldError msg={errors.rules} />
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Prizes and Awards</div>
                  <textarea
                    value={s.prizes}
                    onChange={(e) => setS((p) => ({ ...p, prizes: e.target.value }))}
                    className={cn(
                      "mt-2 w-full min-h-[120px] rounded-xl bg-white px-3 py-2 text-sm",
                      "border border-[color:var(--border)] [border-width:0.5px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page-bg)]",
                    )}
                    placeholder="Trophies, scholarships, cash prizes…"
                  />
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {/* STEP 2 */}
        {step === 2 ? (
          <Card className="p-6">
            <div className="text-lg font-medium">Step 2 — Location</div>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="ui-label text-[color:var(--muted)]">City *</div>
                  <Input
                    value={s.city}
                    onChange={(e) => setS((p) => ({ ...p, city: e.target.value }))}
                    error={!!errors.city}
                    placeholder="City"
                  />
                  <FieldError msg={errors.city} />
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Country *</div>
                  <Input
                    value={s.country}
                    onChange={(e) => setS((p) => ({ ...p, country: e.target.value }))}
                    error={!!errors.country}
                    placeholder="Country"
                  />
                  <FieldError msg={errors.country} />
                </div>
              </div>

              <div>
                <div className="ui-label text-[color:var(--muted)]">Venue Name *</div>
                <Input
                  value={s.venue}
                  onChange={(e) => setS((p) => ({ ...p, venue: e.target.value }))}
                  error={!!errors.venue}
                  placeholder="Venue name"
                />
                <FieldError msg={errors.venue} />
              </div>

              <div>
                <div className="ui-label text-[color:var(--muted)]">Full Address</div>
                <Input
                  value={s.address}
                  onChange={(e) => setS((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Street, building, etc."
                />
              </div>

              <div>
                <div className="ui-label text-[color:var(--muted)]">Google Maps Link</div>
                <Input
                  value={s.maps_link}
                  onChange={(e) => setS((p) => ({ ...p, maps_link: e.target.value }))}
                  error={!!errors.maps_link}
                  placeholder="https://maps.google.com/…"
                />
                <FieldError msg={errors.maps_link} />
              </div>

              {(s.type === "Online" || s.type === "Hybrid") ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="ui-label text-[color:var(--muted)]">Platform *</div>
                    <Select
                      value={s.platform}
                      onChange={(e) => setS((p) => ({ ...p, platform: e.target.value as Platform }))}
                      error={!!errors.platform}
                    >
                      <option value="">Select…</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Meet">Meet</option>
                      <option value="Teams">Teams</option>
                    </Select>
                    <FieldError msg={errors.platform} />
                  </div>
                  <div>
                    <div className="ui-label text-[color:var(--muted)]">Meeting Link *</div>
                    <Input
                      value={s.meeting_link}
                      onChange={(e) => setS((p) => ({ ...p, meeting_link: e.target.value }))}
                      error={!!errors.meeting_link}
                      placeholder="https://…"
                    />
                    <FieldError msg={errors.meeting_link} />
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        {/* STEP 3 */}
        {step === 3 ? (
          <Card className="p-6">
            <div className="text-lg font-medium">Step 3 — Registration</div>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Registration Deadline *</div>
                  <Input
                    type="date"
                    value={s.registration_deadline}
                    onChange={(e) => setS((p) => ({ ...p, registration_deadline: e.target.value }))}
                    error={!!errors.registration_deadline}
                  />
                  <FieldError msg={errors.registration_deadline} />
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Entry Fee *</div>
                  <Input
                    value={s.fee}
                    onChange={(e) => setS((p) => ({ ...p, fee: e.target.value }))}
                    error={!!errors.fee}
                    placeholder="e.g., $50 / team"
                  />
                  <FieldError msg={errors.fee} />
                </div>
              </div>

              <div>
                <div className="ui-label text-[color:var(--muted)]">Registration Link *</div>
                <Input
                  value={s.registration_link}
                  onChange={(e) => setS((p) => ({ ...p, registration_link: e.target.value }))}
                  error={!!errors.registration_link}
                  placeholder="https://…"
                />
                <FieldError msg={errors.registration_link} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Payment Instructions</div>
                  <textarea
                    value={s.payment_info}
                    onChange={(e) => setS((p) => ({ ...p, payment_info: e.target.value }))}
                    className={cn(
                      "mt-2 w-full min-h-[120px] rounded-xl bg-white px-3 py-2 text-sm",
                      "border border-[color:var(--border)] [border-width:0.5px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page-bg)]",
                    )}
                    placeholder="Bank details, mobile money, etc."
                  />
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Adjudicators</div>
                  <textarea
                    value={s.judges}
                    onChange={(e) => setS((p) => ({ ...p, judges: e.target.value }))}
                    className={cn(
                      "mt-2 w-full min-h-[120px] rounded-xl bg-white px-3 py-2 text-sm",
                      "border border-[color:var(--border)] [border-width:0.5px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page-bg)]",
                    )}
                    placeholder="Who can judge / expected pool / requirements…"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Organizer/Club Name *</div>
                  <Input
                    value={s.organizer}
                    onChange={(e) => setS((p) => ({ ...p, organizer: e.target.value }))}
                    error={!!errors.organizer}
                    placeholder="Organizer"
                  />
                  <FieldError msg={errors.organizer} />
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Contact Email *</div>
                  <Input
                    value={s.contact_email}
                    onChange={(e) => setS((p) => ({ ...p, contact_email: e.target.value }))}
                    error={!!errors.contact_email}
                    placeholder="email@domain.com"
                    inputMode="email"
                  />
                  <FieldError msg={errors.contact_email} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="ui-label text-[color:var(--muted)]">WhatsApp Number *</div>
                  <Input
                    value={s.whatsapp}
                    onChange={(e) => setS((p) => ({ ...p, whatsapp: e.target.value }))}
                    error={!!errors.whatsapp}
                    placeholder="+1 555…"
                    inputMode="tel"
                  />
                  <FieldError msg={errors.whatsapp} />
                </div>
                <div>
                  <div className="ui-label text-[color:var(--muted)]">Facebook Page</div>
                  <Input
                    value={s.facebook}
                    onChange={(e) => setS((p) => ({ ...p, facebook: e.target.value }))}
                    error={!!errors.facebook}
                    placeholder="https://facebook.com/…"
                  />
                  <FieldError msg={errors.facebook} />
                </div>
              </div>

              {profile ? (
                <div className="rounded-[14px] bg-[rgba(24,95,165,0.06)] p-4 text-sm text-[color:var(--muted)]">
                  Prefilled from your profile. You can edit these fields for this submission.
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        {/* STEP 4 */}
        {step === 4 ? (
          <Card className="p-6">
            <div className="text-lg font-medium">Step 4 — Review</div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              Confirm everything looks right before submitting.
            </div>

            <div className="mt-5 rounded-[14px] bg-[var(--blue-bg)] p-4 text-sm text-[var(--blue-text)]">
              Your tournament will go live immediately after submission.
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4">
                <div className="ui-label text-[color:var(--muted)]">Tournament</div>
                <div className="mt-2 text-sm">
                  <div className="font-medium">{s.name || "—"}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {s.format ? <Badge variant={s.format}>{s.format}</Badge> : null}
                    <Badge variant="category" caps={false}>{s.category}</Badge>
                    {s.type ? <Badge variant="pending" className="normal-case">{s.type}</Badge> : null}
                    <Badge variant={regStatusPreview(s).variant}>{regStatusPreview(s).label}</Badge>
                  </div>
                  <div className="mt-3 text-[color:var(--muted)]">
                    {s.start_date || "—"} → {s.end_date || "—"}
                  </div>
                  <div className="mt-1 text-[color:var(--muted)]">
                    Rounds: {s.rounds || "—"} • Cap: {s.team_cap || "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4">
                <div className="ui-label text-[color:var(--muted)]">Location</div>
                <div className="mt-2 text-sm">
                  <div className="font-medium">{s.venue || "—"}</div>
                  <div className="mt-2 text-[color:var(--muted)]">
                    {s.city || "—"}, {s.country || "—"}
                  </div>
                  {s.address ? <div className="mt-1 text-[color:var(--muted)]">{s.address}</div> : null}
                  {s.maps_link ? <div className="mt-2 text-[color:var(--muted)]">Maps: {s.maps_link}</div> : null}
                  {(s.type === "Online" || s.type === "Hybrid") ? (
                    <div className="mt-2 text-[color:var(--muted)]">
                      Platform: {s.platform || "—"} • Link: {s.meeting_link || "—"}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4 sm:col-span-2">
                <div className="ui-label text-[color:var(--muted)]">Registration</div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <div className="text-[color:var(--muted)]">Deadline</div>
                    <div className="font-medium">{s.registration_deadline || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[color:var(--muted)]">Fee</div>
                    <div className="font-medium">{s.fee || "—"}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[color:var(--muted)]">Registration link</div>
                    <div className="font-medium break-all">{s.registration_link || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[color:var(--muted)]">Organizer</div>
                    <div className="font-medium">{s.organizer || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[color:var(--muted)]">Contact</div>
                    <div className="font-medium">{s.contact_email || "—"}</div>
                    <div className="text-[color:var(--muted)]">{s.whatsapp || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4 sm:col-span-2">
                <div className="ui-label text-[color:var(--muted)]">Description</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--muted)]">
                  {s.description || "—"}
                </div>
              </div>

              {s.rules ? (
                <div className="rounded-[14px] border border-[color:var(--border)] [border-width:0.5px] p-4 sm:col-span-2">
                  <div className="ui-label text-[color:var(--muted)]">Format and Rules</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--muted)]">
                    {s.rules}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[color:var(--muted)]">
          {step > 1 ? (
            <button className="font-medium text-[var(--primary)] hover:underline" onClick={prevStep}>
              ← Back
            </button>
          ) : (
            <Link className="font-medium text-[var(--primary)] hover:underline" href="/">
              ← Back to listing
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {step < 4 ? (
            <Button className="h-11 rounded-xl" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button className="h-11 rounded-xl" onClick={submit} isLoading={submitting}>
              Submit Tournament
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

