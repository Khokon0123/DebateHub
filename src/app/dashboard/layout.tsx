import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — DebateHub",
  description: "Organizer dashboard for managing tournaments and registrations.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}

