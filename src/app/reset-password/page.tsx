import * as React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordClient from "./client";

export const metadata: Metadata = {
  title: "Reset password — DebateHub",
  description: "Reset your DebateHub password.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}

