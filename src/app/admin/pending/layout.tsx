import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pending approval — Admin — DebateHub",
  description: "Review pending tournaments and approve or reject submissions.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

