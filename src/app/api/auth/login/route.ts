import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getMongoDb } from "@/lib/mongo/server";
import { getAppwriteAdmin } from "@/lib/appwrite/admin";

const COOKIE_NAME = "debatehub_token";

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "dev-change-me-jwt-secret";
}

export async function POST(req: Request) {
  const db = await getMongoDb();
  const { email, password } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const users = db.collection("users");
  const profiles = db.collection("profiles");

  const user = await users.findOne({ email: normalizedEmail });
  if (!user || !user.passwordHash) {
    return NextResponse.json(
      { error: "Invalid login credentials." },
      { status: 401 },
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid login credentials." },
      { status: 401 },
    );
  }

  // Block login unless Appwrite email is verified.
  try {
    const { users: awUsers } = getAppwriteAdmin();
    const awUsersList = await awUsers.list([]);
    const awUser = awUsersList.users.find(
      (u: any) => u.email === normalizedEmail
    );
    if (!awUser || !awUser.emailVerification) {
      return NextResponse.json(
        { error: "Please verify your email first." },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Please verify your email first." },
      { status: 403 }
    );
  }

  const profile = await profiles.findOne({ _id: user._id });
  const role = (profile?.role as string | null) ?? null;

  const token = jwt.sign(
    {
      sub: user._id,
      role,
      email: normalizedEmail,
    },
    getJwtSecret(),
    { expiresIn: "7d" },
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}