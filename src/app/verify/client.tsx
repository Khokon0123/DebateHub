"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [state, setState] = React.useState<"loading" | "success" | "error">("loading");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function run() {
      if (!token || !email) {
        setError("Invalid verification link.");
        setState("error");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setState("success");
      } catch (e: any) {
        setError(e?.message ?? "Could not verify email.");
        setState("error");
      }
    }
    run();
  }, [token, email]);

  return (
    <AuthCard
      title={
        state === "loading"
          ? "Verifying your email…"
          : state === "success"
            ? "Email verified!"
            : "Verification failed"
      }
      subtitle={
        state === "loading"
          ? "One moment while we confirm your account."
          : state === "success"
            ? "You can now sign in to DebateHub."
            : "Please try again."
      }
      footer={
        <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
          Back to login
        </Link>
      }
    >
      {state === "loading" ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : state === "success" ? (
        <Button fullWidth onClick={() => router.replace("/login")}>
          Go to login
        </Button>
      ) : (
        <div className="rounded-[14px] border border-[rgba(163,45,45,0.35)] bg-[rgba(163,45,45,0.08)] p-3 text-sm text-[var(--danger)]">
          {error ?? "Could not verify email."}
        </div>
      )}
    </AuthCard>
  );
}