"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAppwriteAccount } from "@/lib/appwrite/appwrite";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId") ?? "";
  const secret = searchParams.get("secret") ?? "";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId || !secret) {
      setError("Invalid or expired reset link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const account = getAppwriteAccount();
      if (!account) {
        setError("Appwrite is not configured. Set NEXT_PUBLIC_APPWRITE_* env vars.");
        return;
      }
      await account.updateRecovery(userId, secret, password);
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a new password for your account."
      footer={
        <Link
          href="/login"
          className="font-medium text-[var(--primary)] hover:underline"
        >
          Back to login
        </Link>
      }
    >
      {done ? (
        <div className="space-y-3">
          <div className="rounded-[14px] bg-[var(--blue-bg)] p-4 text-sm text-[var(--blue-text)]">
            Password updated. You can now sign in.
          </div>
          <Button fullWidth onClick={() => router.replace("/login")}>
            Go to login
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <div className="ui-label text-[color:var(--muted)]">New password</div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div>
            <div className="ui-label text-[color:var(--muted)]">Confirm password</div>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              error={!!confirm && password !== confirm}
            />
          </div>

          {error ? (
            <div className="rounded-[14px] border border-[rgba(163,45,45,0.35)] bg-[rgba(163,45,45,0.08)] p-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          <Button type="submit" fullWidth isLoading={submitting}>
            Reset password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

