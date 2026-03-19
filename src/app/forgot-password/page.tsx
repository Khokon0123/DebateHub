import { Suspense } from "react";
import type { Metadata } from "next";
import ForgotPasswordClient from "./client";

export const metadata: Metadata = {
  title: "Forgot password — DebateHub",
  description: "Reset your DebateHub password via email.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordClient />
    </Suspense>
  );
}

