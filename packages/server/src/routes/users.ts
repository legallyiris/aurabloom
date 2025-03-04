import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import db, { schema } from "../db";
import { models } from "../db/models";
import { authMiddleware } from "../middleware/auth";
import ip from "../middleware/ip";
import { apiError } from "../utils/apiError";
import { deleteSession } from "../utils/sessions";

export const usersRoutes = new Elysia({
  prefix: "/users",
  tags: ["users"],
})
  .use(authMiddleware)
  .post(
    "/users",
    async ({ body }) => {
      try {
        const existingUser = db
          .select()
          .from(schema.users)
          .where(eq(schema.users.username, body.username))
          .get();

        if (existingUser) {
          return apiError(409, "user with that username already exists");
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

        return {
          status: "success",
          data: {
            id: user[0].id,
            username: user[0].username,
            displayName: user[0].displayName,
          },
        };
      } catch (error) {
        return apiError(500, "failed to create user");
      }
    },
    {
      body: models.user.create,
      beforeHandle: ({ body, set }) => {
        if (body.username.length < 3 || body.username.length > 48) {
          set.status = 400;
          return apiError(400, "username must be 3-48 characters");
        }

        if (body.password.length < 8 || body.password.length > 768) {
          set.status = 400;
          return apiError(400, "password must be 8-768 characters");
        }

        if (
          body.displayName &&
          (body.displayName.length < 3 || body.displayName.length > 48)
        ) {
          set.status = 400;
          return apiError(400, "display name must be 3-48 characters");
        }
      },
      detail: {
        summary: "create a new user",
        description:
          "create a new user with the given username, password, and display name",
      },
    },
  )
  .get(
    "/me",
    async ({ user }) => {
      if (!user) return apiError(401, "not authenticated");
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
    async ({ user, cookie: { session } }) => {
      try {
        if (!user) return apiError(401, "not authenticated");

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
      } catch (error) {
        return apiError(500, "failed to retrieve sessions");
      }
    },
    {
      detail: {
        summary: "list user sessions",
        description:
          "get all active sessions for the currently authenticated user",
      },
    },
  );
