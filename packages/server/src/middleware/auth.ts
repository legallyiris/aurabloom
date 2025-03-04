import { Elysia, t } from "elysia";
import { apiError } from "../utils/apiError";

const sessionCookie = t.Cookie({
  session: t.Object({
    id: t.Number(),
    username: t.String(),
  }),
});

export const authMiddleware = new Elysia()
  .derive({ as: "global" }, ({ cookie: { session } }) => {
    return {
      user: session.value,
    };
  })
  .resolve({ as: "scoped" }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return apiError(401, "unauthorized");
    }

    return { user };
  });
