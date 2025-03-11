import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import db, { schema } from "../db";
import { models } from "../db/models";
import ip from "../middleware/ip";
import { createSession, deleteSession } from "../utils/sessions";

const sessionCookie = t.Cookie({
  session: t.Optional(t.String()),
});

export const authRoutes = new Elysia({
  prefix: "/auth",
  tags: ["auth"],
})
  .use(ip)
  .post(
    "/login",
    async ({ body, cookie: { session }, request, error, ip }) => {
      try {
        const failedAttempt = async () => {
          await Bun.sleep(Math.random() * 2000 + 1000);
          return error(401, "invalid username or password");
        };

        const user = db
          .select()
          .from(schema.users)
          .where(eq(schema.users.username, body.username))
          .get();

        if (!user) return failedAttempt();

        const passwordMatch = await Bun.password.verify(
          body.password,
          user.password,
        );
        if (!passwordMatch) return failedAttempt();

        const { sessionId } = await createSession(user.id, request, ip);
        session.value = sessionId;

        if (!sessionId) return error(500, "session creation failed");

        return {
          status: "success",
          data: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
          },
        };
      } catch (err) {
        return error(500, "login failed");
      }
    },
    {
      cookie: sessionCookie,
      body: models.user.login,
      detail: {
        summary: "user login",
        description: "authenticate a user with username and password",
      },
    },
  )
  .post(
    "/logout",
    ({ cookie: { session } }) => {
      if (session.value) {
        deleteSession(session.value);
        session.remove();
      }

      return {
        status: "success",
        data: {
          message: "logged out successfully",
        },
      };
    },
    {
      cookie: sessionCookie,
      detail: {
        summary: "user logout",
        description: "log out the current user by removing the session cookie",
      },
    },
  );
