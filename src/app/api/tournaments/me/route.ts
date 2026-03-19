import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/server";
import { getSessionFromRequest } from "@/lib/auth/session";

function mapTournament(doc: any) {
  return {
    id: doc._id as string,
    user_id: doc.user_id ?? null,
    name: doc.name ?? null,
    format: doc.format ?? null,
    status: doc.status ?? "pending",
    start_date: doc.start_date ?? null,
    end_date: doc.end_date ?? null,
    city: doc.city ?? null,
    country: doc.country ?? null,
    venue: doc.venue ?? null,
    type: doc.type ?? null,
    team_cap: doc.team_cap ?? null,
    registered_teams: doc.registered_teams ?? null,
    registration_open: doc.registration_open ?? null,
    registration_link: doc.registration_link ?? null,
    updated_at: doc.updated_at ?? doc.updatedAt ?? null,
    rounds: doc.rounds ?? null,
    fee: doc.fee ?? null,
    registration_deadline: doc.registration_deadline ?? null,
    address: doc.address ?? null,
    maps_link: doc.maps_link ?? null,
    description: doc.description ?? null,
    rules: doc.rules ?? null,
    prizes: doc.prizes ?? null,
    // category may be used elsewhere
    category: doc.category ?? null,
  };
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getMongoDb();
  const tournaments = db.collection("tournaments");

  const docs = await tournaments
    .find({ user_id: session.userId })
    .sort({ created_at: -1 })
    .toArray();

  return NextResponse.json({ items: docs.map(mapTournament) }, { status: 200 });
}

