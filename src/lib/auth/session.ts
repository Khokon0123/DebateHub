import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "debatehub_token";

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "dev-change-me-jwt-secret";
}

export type Session = {
  userId: string;
  role: string | null;
  email: string | null;
};

export function getSessionFromRequest(req: NextRequest): Session | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const userId = decoded?.sub as string | undefined;
    if (!userId) return null;

    return {
      userId,
      role: (decoded?.role as string | null) ?? null,
      email: (decoded?.email as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

