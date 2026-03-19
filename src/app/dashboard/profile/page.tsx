"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getDashboardSupabase } from "../_lib/supabase";

type Profile = {
  full_name: string | null;
  organization: string | null;
  email: string | null;
  whatsapp: string | null;
  facebook: string | null;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [changingPw, setChangingPw] = React.useState(false);

  const [userId, setUserId] = React.useState<string | null>(null);
  const [authEmail, setAuthEmail] = React.useState<string>("");

  const [p, setP] = React.useState<Profile>({
    full_name: "",
    organization: "",
    email: "",
    whatsapp: "",
    facebook: "",
  });

  const [newPassword, setNewPassword] = React.useState("");

  React.useEffect(() => {
    const supabase = getDashboardSupabase();
    if (!supabase) return;
    const sb = supabase;

    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) return;
      if (cancelled) return;

      setUserId(auth.user.id);
      setAuthEmail(auth.user.email ?? "");

      try {
        const { data } = await sb
          .from("profiles")
          .select("full_name,organization,email,whatsapp,facebook")
          .eq("id", auth.user.id)
          .maybeSingle();

        const prof = (data as Profile | null) ?? null;
        setP({
          full_name: prof?.full_name ?? (auth.user.user_metadata?.full_name as string | undefined) ?? "",
          organization: prof?.organization ?? (auth.user.user_metadata?.organization as string | undefined) ?? "",
          email: prof?.email ?? (auth.user.email ?? ""),
          whatsapp: prof?.whatsapp ?? (auth.user.user_metadata?.whatsapp as string | undefined) ?? "",
          facebook: prof?.facebook ?? "",
        });
      } catch {
        setP((prev) => ({ ...prev, email: auth.user.email ?? "" }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile() {
    if (!userId) return;
    if (!p.full_name?.trim()) return toast({ tone: "danger", message: "Full name is required." });
    if (!p.organization?.trim()) return toast({ tone: "danger", message: "Organization is required." });
    if (!p.email?.trim()) return toast({ tone: "danger", message: "Email is required." });
    if (!isValidEmail(p.email)) return toast({ tone: "danger", message: "Please enter a valid email." });
    if (!p.whatsapp?.trim()) return toast({ tone: "danger", message: "WhatsApp is required." });

    const supabase = getDashboardSupabase();
    if (!supabase) return;
    const sb = supabase;

    setSaving(true);

    const { error: upsertErr } = await sb.from("profiles").upsert(
      {
        id: userId,
        full_name: p.full_name.trim(),
        organization: p.organization.trim(),
        email: p.email.trim(),
        whatsapp: p.whatsapp.trim(),
        facebook: p.facebook?.trim() || null,
      },
      { onConflict: "id" },
    );

    if (upsertErr) {
      setSaving(false);
      toast({ tone: "danger", message: upsertErr.message });
      return;
    }

    // If they changed auth email, attempt to update it too (Supabase may require confirmation)
    if (p.email.trim() && authEmail && p.email.trim() !== authEmail) {
      const { error: authErr } = await sb.auth.updateUser({ email: p.email.trim() });
      if (authErr) {
        setSaving(false);
        toast({
          tone: "warning",
          message: `Profile saved, but email change requires attention: ${authErr.message}`,
        });
        return;
      }
      toast({
        tone: "warning",
        message: "Profile saved. Please confirm the email change from your inbox.",
      });
      setAuthEmail(p.email.trim());
      setSaving(false);
      return;
    }

    setSaving(false);
    toast({ tone: "success", message: "Profile saved" });
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      toast({ tone: "danger", message: "Password must be at least 8 characters." });
      return;
    }
    const supabase = getDashboardSupabase();
    if (!supabase) return;
    const sb = supabase;

    setChangingPw(true);
    const { error } = await sb.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      toast({ tone: "danger", message: error.message });
      return;
    }
    setNewPassword("");
    toast({ tone: "success", message: "Password updated" });
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-2xl font-medium tracking-tight">Profile</div>
        <div className="mt-1 text-sm text-[color:var(--muted)]">
          Update your organizer details and password.
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-[color:var(--muted)]">Loading…</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="ui-label text-[color:var(--muted)]">Full name</div>
              <Input value={p.full_name ?? ""} onChange={(e) => setP((x) => ({ ...x, full_name: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <div className="ui-label text-[color:var(--muted)]">Organization</div>
              <Input value={p.organization ?? ""} onChange={(e) => setP((x) => ({ ...x, organization: e.target.value }))} />
            </div>
            <div>
              <div className="ui-label text-[color:var(--muted)]">Email</div>
              <Input value={p.email ?? ""} onChange={(e) => setP((x) => ({ ...x, email: e.target.value }))} inputMode="email" />
            </div>
            <div>
              <div className="ui-label text-[color:var(--muted)]">WhatsApp</div>
              <Input value={p.whatsapp ?? ""} onChange={(e) => setP((x) => ({ ...x, whatsapp: e.target.value }))} inputMode="tel" />
            </div>
            <div className="sm:col-span-2">
              <div className="ui-label text-[color:var(--muted)]">Facebook</div>
              <Input value={p.facebook ?? ""} onChange={(e) => setP((x) => ({ ...x, facebook: e.target.value }))} placeholder="https://facebook.com/…" />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <Button className="h-11 rounded-xl" onClick={saveProfile} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="text-lg font-medium">Change password</div>
        <div className="mt-1 text-sm text-[color:var(--muted)]">
          Choose a new password (min 8 characters).
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="ui-label text-[color:var(--muted)]">New password</div>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <Button className="h-11 rounded-xl" onClick={changePassword} disabled={changingPw}>
            {changingPw ? "Updating…" : "Update password"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

