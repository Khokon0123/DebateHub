import { Suspense } from "react";
import type { Metadata } from "next";
import AuthCallbackClient from "./client";

export const metadata: Metadata = {
  title: "Signing in — DebateHub",
  description: "Completing sign-in for DebateHub.",
};

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackClient />
    </Suspense>
  );
}

