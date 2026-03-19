import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a tournament — DebateHub",
  description: "Submit a debate tournament for review on DebateHub.",
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}

