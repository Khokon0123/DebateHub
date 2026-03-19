"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function LockIcon() {
  return (
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(0,0,0,0.06)]">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-black">
        <path
          d="M7.5 11V8.8a4.5 4.5 0 0 1 9 0V11"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M7 11h10a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 17 20H7A1.5 1.5 0 0 1 5.5 18.5v-6A1.5 1.5 0 0 1 7 11Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    const sb = supabase;

    setSubmitting(true);

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setError("Login failed, please try again.");
    }, 10000);

    try {
      const { data: authData, error: signInErr } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (timedOut) return;
      window.clearTimeout(timeoutId);

      if (signInErr || !authData?.user) {
        setError("Login failed, please try again.");
        return;
      }

      const user = authData.user;
      const { data: profile, error: profErr } = await sb
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profErr) {
        setError("Could not verify admin role, please try again");
        return;
      }

      const role = ((profile as any)?.role as string | null)?.toLowerCase().trim() ?? "";
      if (role !== "admin") {
        await sb.auth.signOut();
        setError("You do not have admin access");
        return;
      }

      router.replace("/admin");
    } catch (err: any) {
      if (timedOut) return;
      window.clearTimeout(timeoutId);
      setError("Login failed, please try again.");
    } finally {
      if (!timedOut) {
        setSubmitting(false);
      }
    }
  }

  return (
    <AuthCard
      title="Admin Login"
      subtitle="DebateHub admin access only"
      logoHref={null}
      footer={
        <Link
          href="/login"
          className="font-medium text-[var(--primary)] hover:underline"
        >
          Back to organizer login
        </Link>
      }
    >
      <div className="-mt-2">
        <LockIcon />
      </div>

      <form onSubmit={onSubmit} className="mt-2 space-y-3">
        <div>
          <div className="ui-label text-[color:var(--muted)]">Email</div>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@domain.com"
            inputMode="email"
            autoComplete="email"
          />
        </div>

        <div>
          <div className="ui-label text-[color:var(--muted)]">Password</div>
          <div className="relative">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPw ? "text" : "password"}
              placeholder="Your password"
              autoComplete="current-password"
              className="pr-12"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-2 rounded-lg text-xs font-medium text-[var(--blue-text)] hover:bg-[rgba(24,95,165,0.08)]"
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-[14px] border border-[rgba(163,45,45,0.35)] bg-[rgba(163,45,45,0.08)] p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <Button type="submit" fullWidth isLoading={submitting}>
          Sign In
        </Button>
      </form>
    </AuthCard>
  );
}

