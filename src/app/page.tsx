import type { Metadata } from "next";
import { getMongoDb } from "@/lib/mongo/server";
import HomeClient, { type TournamentRow } from "./(public)/home-client";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "DebateHub — Browse Tournaments",
  description: "Find debate tournaments happening near you. Search and filter by format, country, and date.",
};

export default async function HomePage() {
  try {
    const db = await getMongoDb();
    const tournaments = db.collection("tournaments");

    const countryDocs = await tournaments.distinct("country", {
      status: "approved",
      country: { $ne: null },
    });

    const countries = (countryDocs ?? [])
      .map((c) => (typeof c === "string" ? c : null))
      .filter(Boolean) as string[];
    countries.sort((a, b) => a.localeCompare(b));

    const docs = await tournaments
      .find(
        { status: "approved" },
        {
          projection: {
            _id: 1,
            name: 1,
            format: 1,
            category: 1,
            type: 1,
            start_date: 1,
            end_date: 1,
            city: 1,
            country: 1,
            venue: 1,
            team_cap: 1,
            registered_teams: 1,
            registration_deadline: 1,
            registration_open: 1,
          },
        },
      )
      .sort({ start_date: 1 })
      .toArray();

    const initial = docs.map((d: any) => ({
      id: d._id as string,
      name: d.name ?? "",
      format: d.format ?? null,
      category: d.category ?? null,
      type: d.type ?? null,
      start_date: d.start_date ?? null,
      end_date: d.end_date ?? null,
      city: d.city ?? null,
      country: d.country ?? null,
      venue: d.venue ?? null,
      team_cap: d.team_cap ?? null,
      registered_teams: d.registered_teams ?? null,
      registration_deadline: d.registration_deadline ?? null,
      registration_open: d.registration_open ?? null,
    })) as TournamentRow[];

    return <HomeClient initial={initial} countries={countries} />;
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
