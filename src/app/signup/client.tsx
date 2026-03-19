"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const next = searchParams.get("next") || "/dashboard";
  const [needsVerify, setNeedsVerify] = React.useState(false);
  const [verificationSent, setVerificationSent] = React.useState<boolean | null>(
    null,
  );

  const [fullName, setFullName] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function validate() {
    if (!fullName.trim()) return "Full Name is required.";
    if (!org.trim()) return "Organization/Club Name is required.";
    if (!email.trim()) return "Email is required.";
    if (!isValidEmail(email)) return "Please enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!confirm) return "Confirm Password is required.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
    }, 10000);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          organization: org.trim(),
        }),
      });

      if (timedOut) return;
      window.clearTimeout(timeoutId);

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as any;
        setSubmitting(false);
        setError(body?.error ?? "Could not create account.");
        return;
      }

      const body = (await res.json().catch(() => null)) as any;
      setVerificationSent(Boolean(body?.verificationSent));
      setSubmitting(false);
      toast({ tone: "success", message: "Account created" });
      setNeedsVerify(true);
    } catch {
      if (timedOut) return;
      window.clearTimeout(timeoutId);
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
    } finally {
      if (!timedOut) setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create Organizer Account"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      {needsVerify ? (
        <div className="space-y-3">
          <div className="rounded-[14px] border border-[rgba(24,95,165,0.22)] bg-[var(--blue-bg)] p-4 text-sm text-[var(--blue-text)]">
            {verificationSent === false ? (
              <>
                We created your account, but we couldn’t send the verification
                email. Make sure your Appwrite platform includes this site URL,
                then try again.
              </>
            ) : (
              <>Please check your email to verify your account.</>
            )}
          </div>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-medium text-white hover:opacity-95"
          >
            Go to login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <div className="ui-label text-[color:var(--muted)]">Full Name</div>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div>
          <div className="ui-label text-[color:var(--muted)]">
            Organization/Club Name
          </div>
          <Input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="School / club / org"
          />
        </div>

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
              placeholder="Create a password"
              autoComplete="new-password"
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
          <PasswordStrength value={password} />
        </div>

        <div>
          <div className="ui-label text-[color:var(--muted)]">Confirm Password</div>
          <div className="relative">
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter password"
              autoComplete="new-password"
              className="pr-12"
              error={!!confirm && password !== confirm}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-2 rounded-lg text-xs font-medium text-[var(--blue-text)] hover:bg-[rgba(24,95,165,0.08)]"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
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
          Create Account
        </Button>
      </form>
      )}
    </AuthCard>
  );
}

