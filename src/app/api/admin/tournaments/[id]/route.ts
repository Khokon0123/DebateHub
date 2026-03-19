import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getMongoDb();
  const tournaments = db.collection("tournaments");

  const { id } = await params;
  await tournaments.deleteOne({ _id: id as any } as any);
  return NextResponse.json({ ok: true }, { status: 200 });
}

