import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getMongoDb } from "@/lib/mongo/server";
import { getAppwriteAdmin } from "@/lib/appwrite/admin";

export async function POST(req: Request) {
  const { token, email, password } = await req.json();

  if (!token || !email || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = await getMongoDb();
  const users = db.collection("users");

  const user = await users.findOne({ email: normalizedEmail });

  if (!user || user.resetToken !== token) {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }

  if (new Date() > new Date(user.resetTokenExpires)) {
    return NextResponse.json({ error: "Reset link has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Update password in MongoDB
  await users.updateOne(
    { email: normalizedEmail },
    {
      $set: { passwordHash },
      $unset: { resetToken: "", resetTokenExpires: "" }
    }
  );

  // Update password in Appwrite too
  try {
    const { users: awUsers } = getAppwriteAdmin();
    const awUsersList = await awUsers.list([]);
    const awUser = awUsersList.users.find((u: any) => u.email === normalizedEmail);
    if (awUser) {
      await awUsers.updatePassword({ userId: awUser.$id, password } as any);
    }
  } catch (e) {
    console.error("Appwrite password update failed:", e);
  }

  return NextResponse.json({ ok: true });
}