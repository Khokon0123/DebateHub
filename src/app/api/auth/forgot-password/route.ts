import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/server";
import { Resend } from "resend";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = await getMongoDb();
  const users = db.collection("users");

  const user = await users.findOne({ email: normalizedEmail });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Create a reset token
  const token = randomUUID();
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  await users.updateOne(
    { email: normalizedEmail },
    { $set: { resetToken: token, resetTokenExpires: expires.toISOString() } }
  );

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const baseUrl = process.env.APP_URL || (host ? `${proto}://${host}` : "");

  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "DebateHub <onboarding@resend.dev>",
      to: normalizedEmail,
      subject: "Reset your DebateHub password",
      html: `
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background:#1d4ed8;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request a password reset, ignore this email.</p>
      `,
    });
  } catch (e) {
    console.error("Reset email failed:", e);
  }

  return NextResponse.json({ ok: true });
}