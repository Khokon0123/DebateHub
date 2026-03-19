import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyClient from "./client";

export const metadata: Metadata = {
  title: "Verify email — DebateHub",
  description: "Verify your DebateHub account email.",
};

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyClient />
    </Suspense>
  );
}

