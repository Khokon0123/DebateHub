import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo/server";
import { getAppwriteAdmin } from "@/lib/appwrite/admin";

export async function POST(req: Request) {
  const { token, email } = await req.json();

  if (!token || !email) {
    return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = await getMongoDb();
  const users = db.collection("users");

  const user = await users.findOne({ email: normalizedEmail });

  if (!user || user.verifyToken !== token) {
    return NextResponse.json({ error: "Invalid or expired verification link." }, { status: 400 });
  }

  if (new Date() > new Date(user.verifyExpires)) {
    return NextResponse.json({ error: "Verification link has expired. Please sign up again." }, { status: 400 });
  }

  // Mark verified in MongoDB
  await users.updateOne(
    { email: normalizedEmail },
    { $set: { emailVerified: true }, $unset: { verifyToken: "", verifyExpires: "" } }
  );

  // Mark verified in Appwrite too
  try {
    const { users: awUsers } = getAppwriteAdmin();
    const awUsersList = await awUsers.list([]);
    const awUser = awUsersList.users.find((u: any) => u.email === normalizedEmail);
    if (awUser) {
      await awUsers.updateEmailVerification({ userId: awUser.$id, emailVerification: true } as any);
    }
  } catch (e) {
    console.error("Appwrite verification update failed:", e);
  }

  return NextResponse.json({ ok: true });
}