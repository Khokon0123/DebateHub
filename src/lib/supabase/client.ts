"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function looksLikePlaceholder(v: string) {
  return v.includes("your_supabase_");
}

let cachedClient: SupabaseClient<any> | null = null;

export function createBrowserSupabaseClient() {
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (looksLikePlaceholder(url) || looksLikePlaceholder(anonKey)) return null;

  if (!cachedClient) cachedClient = createClient<any>(url, anonKey);
  return cachedClient;
}

