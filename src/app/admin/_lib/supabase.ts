"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function getAdminSupabase() {
  return createBrowserSupabaseClient();
}

