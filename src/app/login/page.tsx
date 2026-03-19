import { Suspense } from "react";
import type { Metadata } from "next";
import LoginClient from "./client";

export const metadata: Metadata = {
  title: "Log in — DebateHub",
  description: "Log in to your DebateHub organizer account to manage tournaments and submissions.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}

