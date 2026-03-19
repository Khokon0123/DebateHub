import { Suspense } from "react";
import type { Metadata } from "next";
import SignupClient from "./client";

export const metadata: Metadata = {
  title: "Sign up — DebateHub",
  description: "Create a DebateHub organizer account to submit and manage tournaments.",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupClient />
    </Suspense>
  );
}

