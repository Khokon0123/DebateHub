"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") return children;
  return <AdminShell>{children}</AdminShell>;
}

