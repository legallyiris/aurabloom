import { Elysia, t } from "elysia";
import { apiError } from "../utils/apiError";
import { renewSession, validateSession } from "../utils/sessions";

export const authMiddleware = new Elysia()
  .derive({ as: "global" }, async ({ cookie: { session } }) => {
    if (!session.value) return { user: null };

    const validSession = await validateSession(session.value);
    if (!validSession) return { user: null };

    const renewDuration = 60 * 60 * 24 * 2;
    const now = Math.floor(Date.now() / 1000);
    if (validSession.expiresAt - now < renewDuration)
      await renewSession(validSession.id);

    return {
      user: {
        id: validSession.user.id,
        username: validSession.user.username,
      },
      sessionId: validSession.id,
    };
  })
  .resolve({ as: "scoped" }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return apiError(401, "unauthorized");
    }

    return { user };
  });
