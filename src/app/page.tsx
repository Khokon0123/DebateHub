import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import HomeClient, { type TournamentRow } from "./(public)/home-client";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "DebateHub — Browse Tournaments",
  description: "Find debate tournaments happening near you. Search and filter by format, country, and date.",
};

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return (
      <HomeClient
        initial={[]}
        countries={[]}
        fetchError={"Supabase is not configured."}
      />
    );
  }

  try {
    const { data: countryRows } = await supabase
      .from("tournaments")
      .select("country")
      .eq("status", "approved")
      .not("country", "is", null)
      .order("country", { ascending: true });

    const countries = Array.from(
      new Set(
        ((countryRows ?? []) as Array<{ country: string | null }>).flatMap((r) =>
          r.country ? [r.country] : [],
        ),
      ),
    );

    const { data, error } = await supabase
      .from("tournaments")
      .select(
        "id,name,format,category,type,start_date,end_date,city,country,venue,team_cap,registered_teams,registration_deadline,registration_open",
      )
      .eq("status", "approved")
      .order("start_date", { ascending: true, nullsFirst: false });

    if (error) {
      return <HomeClient initial={[]} countries={countries} fetchError={error.message} />;
    }

    return <HomeClient initial={((data ?? []) as TournamentRow[])} countries={countries} />;
  } catch (e: any) {
    return (
      <HomeClient
        initial={[]}
        countries={[]}
        fetchError={e?.message ?? "Unknown error"}
      />
    );
  }
}
