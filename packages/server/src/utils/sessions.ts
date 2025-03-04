import { eq } from "drizzle-orm";
import type { SocketAddress } from "elysia/universal";
import { nanoid } from "nanoid";

import db from "../db";
import { schema } from "../db";

export const createSession = async (
  userId: number,
  req: Request,
  ip?: SocketAddress,
) => {
  const sessionId = nanoid();
  const expiryDays = 7;
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * expiryDays;

  const userAgent = req.headers.get("user-agent") || null;
  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    ip?.address ||
    null;

  await db
    .insert(schema.sessions)
    .values({
      id: sessionId,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    })
    .returning();

  return {
    sessionId,
    expiresAt,
  };
};

export const validateSession = async (sessionId: string) => {
  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.id, sessionId),
    with: {
      user: true,
    },
  });

  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt < now) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
    return null;
  }

  return session;
};

export const deleteSession = async (sessionId: string) => {
  db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
};
