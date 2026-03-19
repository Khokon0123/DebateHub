"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const next = searchParams.get("next") || "/dashboard";

  const [fullName, setFullName] = React.useState("");
  const [org, setOrg] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
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
    if (!whatsapp.trim()) return "WhatsApp Number is required.";
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

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured. Add keys to .env.local.");
      return;
    }

    setSubmitting(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // IMPORTANT: To remove email verification completely, disable email confirmations in Supabase:
        // Supabase Dashboard → Authentication → Settings → turn OFF "Enable email confirmations".
        // The client cannot force-disable confirmation emails if that setting is enabled.
        data: {
          full_name: fullName.trim(),
          organization: org.trim(),
          whatsapp: whatsapp.trim(),
        },
      },
    });

    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    toast({ tone: "success", message: "Account created" });
    router.replace(`/login?next=${encodeURIComponent(next)}&created=1`);
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
          <div className="ui-label text-[color:var(--muted)]">WhatsApp Number</div>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+1 555 123 4567"
            inputMode="tel"
            autoComplete="tel"
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
    </AuthCard>
  );
}

