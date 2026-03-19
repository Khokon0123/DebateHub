import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongo/server";
import { getAppwriteAdmin } from "@/lib/appwrite/admin";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const db = await getMongoDb();
  const { email, password, full_name, organization, whatsapp } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userId = randomUUID();

  const users = db.collection("users");
  const profiles = db.collection("profiles");

  const existing = await users.findOne({ email: normalizedEmail });
  if (existing) {
    return NextResponse.json({ error: "Account already exists for this email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create user in Appwrite first
  try {
    const { users: awUsers } = getAppwriteAdmin();
    await awUsers.create({
      userId,
      email: normalizedEmail,
      password,
      name: typeof full_name === "string" ? full_name : undefined,
    } as any);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Could not create account." }, { status: 400 });
  }

  // Create auth user in MongoDB
  await users.insertOne({
    _id: userId as any,
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  } as any);

  // Create profile
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

  // Send verification email via Nodemailer (Gmail)
  let verificationSent = false;
  try {
    const { users: awUsers } = getAppwriteAdmin();
    const token = await awUsers.createToken({ userId, expire: 3600 } as any);

    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? "http";
    const baseUrl = process.env.APP_URL || (host ? `${proto}://${host}` : "");
    const verifyUrl = `${baseUrl}/verify?userId=${userId}&secret=${token.secret}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"DebateHub" <${process.env.GMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Verify your DebateHub account",
      html: `
        <h2>Welcome to DebateHub!</h2>
        <p>Click the link below to verify your email address:</p>
        <a href="${verifyUrl}" style="background:#1d4ed8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Verify Email
        </a>
        <p>This link expires in 1 hour.</p>
        <p>If you did not create an account, ignore this email.</p>
      `,
    });
    verificationSent = true;
  } catch (e) {
    console.error("Verification email failed:", e);
  }

  return NextResponse.json({ ok: true, verificationSent });
}