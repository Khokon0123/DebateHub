"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Spinner } from "@/components/ui/spinner";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured. Add keys to .env.local.");
      return;
    }
    const sb = supabase;

    async function run() {
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeErr } = await sb.auth.exchangeCodeForSession(code);
        if (exchangeErr) {
          setError(exchangeErr.message);
          return;
        }
      }
      router.replace(next);
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthCard
      title={error ? "Something went wrong" : "Signing you in…"}
      subtitle={error ? "Please try again." : "One moment while we finish up."}
    >
      {error ? (
        <div className="rounded-[14px] border border-[rgba(163,45,45,0.35)] bg-[rgba(163,45,45,0.08)] p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
    </AuthCard>
  );
}

