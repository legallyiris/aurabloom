import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import db, { schema } from "../db";
import { models } from "../db/models";
import { apiError } from "../utils/apiError";

export const usersRoutes = new Elysia({
  prefix: "/users",
  tags: ["users"],
}).post(
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
);
