"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function getDashboardSupabase() {
  return createBrowserSupabaseClient();
}

