import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getMongoDb();
  const tournaments = db.collection("tournaments");

  const body = await req.json();
  const status = body?.status;
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { id } = await params;
  await tournaments.updateOne(
    { _id: id as any } as any,
    { $set: { status, updated_at: now } },
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}

