import type { Metadata } from "next";
import { AdminGate } from "./admin-gate";

export const metadata: Metadata = {
  title: "Admin — DebateHub",
  description: "Admin panel for reviewing and managing tournaments on DebateHub.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}

