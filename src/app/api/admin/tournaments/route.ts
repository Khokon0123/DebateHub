import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/server";
import { getSessionFromRequest } from "@/lib/auth/session";

function toOrganizer(profile: any) {
  return profile
    ? {
        full_name: (profile.full_name as string | null) ?? null,
        organization: (profile.organization as string | null) ?? null,
        email: (profile.email as string | null) ?? null,
        whatsapp: (profile.whatsapp as string | null) ?? null,
      }
    : null;
}

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;

  const db = await getMongoDb();
  const tournaments = db.collection("tournaments");

  const match: any = {};
  if (status && status !== "all") match.status = status;

  const regex = q ? new RegExp(q, "i") : null;

  const pipeline: any[] = [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    {
      $lookup: {
        from: "profiles",
        localField: "user_id",
        foreignField: "_id",
        as: "organizerArr",
      },
    },
    {
      $addFields: {
        organizer: { $arrayElemAt: ["$organizerArr", 0] },
      },
    },
  ];

  if (regex) {
    pipeline.push({
      $match: {
        $or: [
          { name: { $regex: regex } },
          { city: { $regex: regex } },
          { "organizer.full_name": { $regex: regex } },
          { "organizer.email": { $regex: regex } },
        ],
      },
    });
  }

  pipeline.push(
    { $sort: { created_at: -1 } },
    { $limit: 200 },
    {
      $project: {
        organizerArr: 0,
      },
    },
  );

  const docs = await tournaments.aggregate(pipeline).toArray();

  return NextResponse.json(
    {
      items: docs.map((d: any) => ({
        id: d._id as string,
        user_id: d.user_id ?? null,
        name: d.name ?? null,
        format: d.format ?? null,
        status: d.status ?? null,
        city: d.city ?? null,
        country: d.country ?? null,
        venue: d.venue ?? null,
        type: d.type ?? null,
        team_cap: d.team_cap ?? null,
        registered_teams: d.registered_teams ?? null,
        registration_deadline: d.registration_deadline ?? null,
        registration_open: d.registration_open ?? null,
        registration_link: d.registration_link ?? null,
        fee: d.fee ?? null,
        rounds: d.rounds ?? null,
        address: d.address ?? null,
        maps_link: d.maps_link ?? null,
        description: d.description ?? null,
        rules: d.rules ?? null,
        prizes: d.prizes ?? null,
        payment_info: d.payment_info ?? null,
        judges: d.judges ?? null,
        whatsapp: d.whatsapp ?? null,
        facebook: d.facebook ?? null,
        created_at: d.created_at ?? null,
        updated_at: d.updated_at ?? null,
        category: d.category ?? null,
        organizer: toOrganizer(d.organizer),
      })),
    },
    { status: 200 },
  );
}

