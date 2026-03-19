import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All tournaments — Admin — DebateHub",
  description: "Search, approve, reject, or delete tournaments.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

