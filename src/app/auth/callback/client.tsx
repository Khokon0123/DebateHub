"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { Spinner } from "@/components/ui/spinner";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Mongo migration: we no longer exchange OAuth/session codes here.
    // Keep the callback route as a simple redirect target for compatibility.
    router.replace(next);
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

