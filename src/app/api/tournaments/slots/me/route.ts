import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/server";
import { getSessionFromRequest } from "@/lib/auth/session";

function mapSlotTournament(doc: any) {
  return {
    id: doc._id as string,
    user_id: doc.user_id ?? null,
    name: doc.name ?? null,
    format: doc.format ?? null,
    team_cap: doc.team_cap ?? null,
    registered_teams: doc.registered_teams ?? null,
    registration_open: doc.registration_open ?? null,
    updated_at: doc.updated_at ?? doc.updatedAt ?? null,
    registration_link: doc.registration_link ?? null,
    start_date: doc.start_date ?? null,
    city: doc.city ?? null,
    country: doc.country ?? null,
    status: doc.status ?? "approved",
  };
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getMongoDb();
  const tournaments = db.collection("tournaments");

  const docs = await tournaments
    .find({
      user_id: session.userId,
      status: "approved",
    })
    .sort({ start_date: 1 })
    .toArray();

  return NextResponse.json({ items: docs.map(mapSlotTournament) }, { status: 200 });
}

