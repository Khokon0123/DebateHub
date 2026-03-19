import { NextResponse } from "next/server";
import { getAppwriteAdmin } from "@/lib/appwrite/admin";

export async function POST(req: Request) {
  const { userId, secret } = await req.json();

  if (!userId || !secret) {
    return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });
  }

  try {
    const { users } = getAppwriteAdmin();
    await users.updateEmailVerification({ userId, emailVerification: true } as any);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Could not verify email." }, { status: 400 });
  }
}