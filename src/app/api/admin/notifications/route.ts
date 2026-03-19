import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getMongoDb();
  const tournaments = db.collection("tournaments");

  // Treat "notifications" as the most recent tournament creations.
  const docs = await tournaments
    .aggregate([
      {
        $lookup: {
          from: "profiles",
          localField: "user_id",
          foreignField: "_id",
          as: "organizerArr",
        },
      },
      { $addFields: { organizer: { $arrayElemAt: ["$organizerArr", 0] } } },
      { $sort: { created_at: -1 } },
      { $limit: 50 },
      {
        $project: {
          organizerArr: 0,
        },
      },
    ])
    .toArray();

  return NextResponse.json(
    {
      items: docs.map((d: any) => ({
        id: d._id as string,
        user_id: d.user_id ?? null,
        name: d.name ?? null,
        status: d.status ?? null,
        created_at: d.created_at ?? null,
        organizer: d.organizer
          ? {
              full_name: (d.organizer.full_name as string | null) ?? null,
              email: (d.organizer.email as string | null) ?? null,
            }
          : null,
      })),
    },
    { status: 200 },
  );
}

