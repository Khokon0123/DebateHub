"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/dashboard";
  const created = searchParams.get("created") === "1";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError("Email is required.");
    if (!password) return setError("Password is required.");

    setSubmitting(true);

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setError("Something went wrong. Please try again.");
    }, 8000);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (timedOut) return;
      window.clearTimeout(timeoutId);

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as any;
        setError(body?.error ?? "Invalid login credentials.");
        return;
      }

      router.replace(next);
    } catch (err: any) {
      if (timedOut) return;
      window.clearTimeout(timeoutId);
      setError("Something went wrong. Please try again.");
    } finally {
      if (!timedOut) {
        setSubmitting(false);
      }
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      footer={
        <div className="space-y-3">
          <div>
            Don’t have an account?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className="font-medium text-[var(--primary)] hover:underline"
            >
              Sign up
            </Link>
          </div>
          <div className="h-px w-full bg-[rgba(0,0,0,0.08)]" />
          <div>
            Are you an admin?{" "}
            <Link
              href="/admin/login"
              className="font-medium text-[var(--primary)] hover:underline"
            >
              Sign in as Admin
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        {created ? (
          <div className="rounded-[14px] border border-[rgba(59,109,17,0.35)] bg-[rgba(59,109,17,0.08)] p-3 text-sm text-[var(--success)]">
            Account created! Please sign in.
          </div>
        ) : null}
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
          <div className="mt-2 flex justify-end">
            <Link
              href={`/forgot-password?email=${encodeURIComponent(email)}`}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
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
          Sign In
        </Button>
      </form>
    </AuthCard>
  );
}

