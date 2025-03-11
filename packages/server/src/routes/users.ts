import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import db, { schema } from "../db";
import { models } from "../db/models";
import { ensureActorExists, getBaseUrl } from "../federation/utils";
import { authMiddleware } from "../middleware/auth";
import { createSession, deleteSession } from "../utils/sessions";

import routeLogger from "./_logger";
const logger = routeLogger.child("users");

export const usersRoutes = new Elysia({
  prefix: "/users",
  tags: ["users"],
})
  .post(
    "/users",
    async ({ body, error, cookie: { session }, request, server }) => {
      try {
        const existingUser = db
          .select()
          .from(schema.users)
          .where(eq(schema.users.username, body.username))
          .get();

        if (existingUser) {
          return error(409, "user with that username already exists");
        }

        const passwordHash = await Bun.password.hash(body.password);

        const user = await db
          .insert(schema.users)
          .values({
            username: body.username,
            displayName: body.displayName || body.username,
            password: passwordHash,
          })
          .returning();

        try {
          const baseUrl = getBaseUrl(request);
          await ensureActorExists(user[0].id, baseUrl);
        } catch (fedErr) {
          logger.error(
            "failed to create federation actor for new user:",
            fedErr,
          );
        }

        // also create a session
        const { sessionId } = await createSession(
          user[0].id,
          request,
          server?.requestIP(request) || undefined,
        );
        session.value = sessionId;

        return {
          status: "success",
          data: {
            id: user[0].id,
            username: user[0].username,
            displayName: user[0].displayName,
          },
        };
      } catch (err) {
        logger.error("failed to create user:", err);
        return error(500, "failed to create user");
      }
    },
    {
      body: models.user.create,
      beforeHandle: ({ body, set, error }) => {
        if (body.username.length < 3 || body.username.length > 48) {
          set.status = 400;
          return error(400, "username must be 3-48 characters");
        }

        if (body.password.length < 8 || body.password.length > 768) {
          set.status = 400;
          return error(400, "password must be 8-768 characters");
        }

        if (
          body.displayName &&
          (body.displayName.length < 3 || body.displayName.length > 48)
        ) {
          set.status = 400;
          return error(400, "display name must be 3-48 characters");
        }
      },
      detail: {
        summary: "create a new user",
        description:
          "create a new user with the given username, password, and display name",
      },
    },
  )
  .use(authMiddleware)
  .get(
    "/me",
    async ({ user, error }) => {
      if (!user) return error(401, "unauthenticated");
      return {
        status: "success",
        data: user,
      };
    },
    {
      detail: {
        summary: "get current user",
        description: "get the currently authenticated user's information",
      },
    },
  )
  .get(
    "/me/sessions",
    async ({ user, cookie: { session }, error }) => {
      try {
        if (!user) return error(401, "unauthenticated");

        const sessions = db
          .select({
            id: schema.sessions.id,
            createdAt: schema.sessions.createdAt,
            expiresAt: schema.sessions.expiresAt,
            userAgent: schema.sessions.userAgent,
            ipAddress: schema.sessions.ipAddress,
          })
          .from(schema.sessions)
          .where(eq(schema.sessions.userId, user.id))
          .all();

        const formattedSessions = sessions.map((session) => {
          const createdDate = new Date(session.createdAt * 1000);
          const expiresDate = new Date(session.expiresAt * 1000);

          return {
            id: session.id,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            createdAtFormatted: createdDate.toISOString(),
            expiresAtFormatted: expiresDate.toISOString(),
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
            current: false,
          };
        });

        const currentSessionId = session.value;
        const currentSession = formattedSessions.find(
          (s) => s.id === currentSessionId,
        );
        if (currentSession) currentSession.current = true;

        return {
          status: "success",
          data: {
            sessions: formattedSessions,
          },
        };
      } catch (err) {
        logger.error("failed to retrieve sessions:", err);
        return error(500, "failed to retrieve sessions");
      }
    },
    {
      detail: {
        summary: "list user sessions",
        description:
          "get all active sessions for the currently authenticated user",
      },
    },
  )
  .delete(
    "/me/sessions/:sessionId",
    async ({ params, user, cookie: { session }, error }) => {
      try {
        if (!user) return error(401, "not authenticated");

        const targetSession = db
          .select()
          .from(schema.sessions)
          .where(
            and(
              eq(schema.sessions.id, params.sessionId),
              eq(schema.sessions.userId, user.id),
            ),
          )
          .get();

        if (!targetSession) return error(404, "session not found");

        if (params.sessionId === session.value) {
          return error(
            400,
            "cannot delete current session, use /auth/logout instead",
          );
        }

        await deleteSession(params.sessionId);

        return {
          status: "success",
          data: {
            message: "session deleted successfully",
          },
        };
      } catch (err) {
        logger.error("failed to delete session:", err);
        return error(500, "failed to delete session");
      }
    },
    {
      detail: {
        summary: "delete a specific session",
        description: "revoke a specific session (log out from another device)",
      },
    },
  );
