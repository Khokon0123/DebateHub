"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const prefill = searchParams.get("email") ?? "";

  const [email, setEmail] = React.useState(prefill);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return setError("Email is required.");

    const supabase = createBrowserSupabaseClient();
    if (!supabase)
      return setError("Supabase is not configured. Add keys to .env.local.");

    setSubmitting(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          "/dashboard/profile",
        )}`,
      },
    );
    setSubmitting(false);

    if (resetErr) {
      setError(resetErr.message);
      return;
    }

    setSent(true);
    toast({ tone: "success", message: "Reset link sent" });
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We’ll email you a reset link."
      footer={
        <Link
          href="/login"
          className="font-medium text-[var(--primary)] hover:underline"
        >
          Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-[14px] bg-[var(--blue-bg)] p-4 text-sm text-[var(--blue-text)]">
          If an account exists for <span className="font-medium">{email}</span>,
          you’ll get a reset email shortly.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <div className="ui-label text-[color:var(--muted)]">Email</div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              inputMode="email"
              autoComplete="email"
            />
          </div>

          {error ? (
            <div className="rounded-[14px] border border-[rgba(163,45,45,0.35)] bg-[rgba(163,45,45,0.08)] p-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            fullWidth
            isLoading={submitting}
          >
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

