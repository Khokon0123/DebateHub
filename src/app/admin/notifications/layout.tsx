import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications — Admin — DebateHub",
  description: "Recent tournament submissions and activity.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

