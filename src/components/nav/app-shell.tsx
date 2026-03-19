"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/nav/navbar";

function isPublicPath(pathname: string) {
  return !pathname.startsWith("/dashboard") && !pathname.startsWith("/admin");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = isPublicPath(pathname);

  return (
    <>
      {showNavbar ? <Navbar /> : null}
      {children}
    </>
  );
}

