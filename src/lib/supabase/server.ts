import { createClient } from "@supabase/supabase-js";

function looksLikePlaceholder(v: string) {
  return v.includes("your_supabase_");
}

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  if (looksLikePlaceholder(url) || looksLikePlaceholder(anonKey)) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

