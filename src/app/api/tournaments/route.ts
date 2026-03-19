import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongo/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getMongoDb();
  const tournaments = db.collection("tournaments");

  const payload = await req.json();
  const tournamentId = randomUUID();
  const now = new Date().toISOString();

  // The UI sends the same shape as the existing Supabase payload.
  // We translate it into a Mongo document.
  await tournaments.insertOne({
    _id: tournamentId,
    user_id: session.userId,
    ...payload,
    registered_teams: payload.registered_teams ?? 0,
    created_at: now,
    updated_at: now,
  });

  return NextResponse.json({ ok: true, id: tournamentId }, { status: 201 });
}

