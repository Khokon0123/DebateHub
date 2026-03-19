import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getMongoDb } from "@/lib/mongo/server";

const COOKIE_NAME = "debatehub_token";

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "dev-change-me-jwt-secret";
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null, profile: null }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const userId = decoded.sub as string;

    const db = await getMongoDb();
    const users = db.collection("users");
    const profiles = db.collection("profiles");

    const user = await users.findOne({ _id: userId as any } as any);
    if (!user) {
      return NextResponse.json({ user: null, profile: null }, { status: 401 });
    }

    const profile = await profiles.findOne({ _id: userId as any } as any);

    if (!profile) {
      const fallbackFullName = user.email
        ? String(user.email).split("@")[0] || "Organizer"
        : "Organizer";

      await profiles.updateOne(
        { _id: userId as any } as any,
        {
          $setOnInsert: {
            _id: userId as any,
            email: user.email ?? null,
            full_name: fallbackFullName,
            organization: null,
            whatsapp: null,
            facebook: null,
            role: null,
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );

      const created = await profiles.findOne({ _id: userId as any } as any);
      return NextResponse.json(
        {
          user: {
            id: user._id,
            email: user.email ?? null,
          },
          profile: created
            ? {
                full_name: (created.full_name as string | null) ?? null,
                organization: (created.organization as string | null) ?? null,
                email: (created.email as string | null) ?? null,
                whatsapp: (created.whatsapp as string | null) ?? null,
                facebook: (created.facebook as string | null) ?? null,
                role: (created.role as string | null) ?? null,
              }
            : null,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email ?? null,
        },
        profile: profile
          ? {
              full_name: (profile.full_name as string | null) ?? null,
              organization: (profile.organization as string | null) ?? null,
              email: (profile.email as string | null) ?? null,
              whatsapp: (profile.whatsapp as string | null) ?? null,
              facebook: (profile.facebook as string | null) ?? null,
              role: (profile.role as string | null) ?? null,
            }
          : null,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json({ user: null, profile: null }, { status: 401 });
  }
}

