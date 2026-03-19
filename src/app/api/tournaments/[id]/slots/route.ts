import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getMongoDb();
  const tournaments = db.collection("tournaments");

  const { id } = await params;
  const existing = await tournaments.findOne({ _id: id as any } as any);
  if (!existing) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const isAdmin = session.role === "admin";
  if (!isAdmin && existing.user_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const registered_teams =
    typeof body.registered_teams === "number"
      ? body.registered_teams
      : Number(body.registered_teams ?? 0);
  const registration_open = Boolean(body.registration_open);

  const cap = existing.team_cap ?? null;
  const shouldClose =
    cap !== null && cap > 0 && registered_teams >= Number(cap);

  const now = new Date().toISOString();

  await tournaments.updateOne(
    { _id: id as any } as any,
    {
      $set: {
        registered_teams,
        registration_open: shouldClose ? false : registration_open,
        updated_at: now,
      },
    },
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}

