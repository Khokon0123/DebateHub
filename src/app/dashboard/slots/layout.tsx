import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Slot tracker — DebateHub",
  description: "Track registrations and open/close tournament registration.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

