import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My tournaments — DebateHub",
  description: "View, edit, and delete your submitted tournaments.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

