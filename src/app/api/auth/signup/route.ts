import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongo/server";
import { getAppwriteAdmin } from "@/lib/appwrite/admin";

function getJwtSecret() {
  // In production, set JWT_SECRET in env.
  // For dev it falls back to a non-secure placeholder to keep the app runnable.
  return process.env.JWT_SECRET ?? "dev-change-me-jwt-secret";
}

export async function POST(req: Request) {
  const db = await getMongoDb();
  const { email, password, full_name, organization, whatsapp } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userId = randomUUID();

  const users = db.collection("users");
  const profiles = db.collection("profiles");

  const existing = await users.findOne({ email: normalizedEmail });
  if (existing) {
    return NextResponse.json(
      { error: "Account already exists for this email." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create user in Appwrite first (so we can fail early if Appwrite rejects).
  try {
    const { users: awUsers } = getAppwriteAdmin();
    await awUsers.create({
      userId,
      email: normalizedEmail,
      password,
      name: typeof full_name === "string" ? full_name : undefined,
    } as any);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Could not create account." },
      { status: 400 },
    );
  }

  // Create auth user
  await users.insertOne({
    _id: userId as any,
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  } as any);

  // Create profile for organizer (default role is not admin)
  await profiles.insertOne({
    _id: userId as any,
    email: normalizedEmail,
    full_name: full_name ?? null,
    organization: organization ?? null,
    whatsapp: whatsapp ?? null,
    facebook: null,
    role: null,
    createdAt: new Date().toISOString(),
  } as any);

  // Send Appwrite verification email.
  let verificationSent = false;
  try {
    const { users: awUsers } = getAppwriteAdmin();
    const session = await awUsers.createSession({ userId } as any);
    const jwtRes = await awUsers.createJWT({ userId, sessionId: session.$id } as any);

    const { client } = getAppwriteAdmin();
    client.setJWT(jwtRes.jwt);
    const account = new (await import("node-appwrite")).Account(client);

    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? "http";
    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (host ? `${proto}://${host}` : "");

    if (!baseUrl) {
      throw new Error(
        "Missing APP_URL for verification redirect (e.g. http://localhost:3000).",
      );
    }

    await account.createVerification(`${baseUrl}/verify`);
    verificationSent = true;
  } catch {
    // If email fails, still keep the user created; they can retry later.
  }

  return NextResponse.json({ ok: true, verificationSent });
}

