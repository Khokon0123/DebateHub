import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getMongoDb } from "@/lib/mongo/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getMongoDb();
  const users = db.collection("users");
  const profiles = db.collection("profiles");

  const body = await req.json();

  const full_name = typeof body.full_name === "string" ? body.full_name : undefined;
  const organization =
    typeof body.organization === "string" ? body.organization : undefined;
  const email = typeof body.email === "string" ? body.email.trim() : undefined;
  const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp : undefined;
  const facebook = typeof body.facebook === "string" ? body.facebook : undefined;
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : undefined;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Update profile document
  await profiles.updateOne(
    { _id: session.userId as any } as any,
    {
      $set: {
        ...(full_name !== undefined ? { full_name } : {}),
        ...(organization !== undefined ? { organization } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(whatsapp !== undefined ? { whatsapp } : {}),
        ...(facebook !== undefined ? { facebook } : {}),
      },
    },
    { upsert: true },
  );

  // Update auth user
  const updateUser: any = {};
  if (email !== undefined) updateUser.email = email;
  if (newPassword && newPassword.length >= 8) {
    updateUser.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updateUser).length > 0) {
    await users.updateOne(
      { _id: session.userId as any } as any,
      { $set: updateUser },
      { upsert: false },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

