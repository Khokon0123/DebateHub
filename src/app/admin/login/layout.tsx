import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login — DebateHub",
  description: "Restricted admin access to the DebateHub admin panel.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

