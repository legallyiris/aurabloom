import { Logger } from "@aurabloom/common";
import { Elysia, t } from "elysia";
import { ensureActorExists, getBaseUrl } from "../federation/utils";
import { renewSession, validateSession } from "../utils/sessions";

const logger = new Logger("authMiddleware");

export const authMiddleware = new Elysia()
  .derive({ as: "global" }, async ({ cookie: { session }, request }) => {
    if (!session.value) return { user: null };
    const baseUrl = getBaseUrl(request);

    const validSession = await validateSession(session.value);
    if (!validSession) return { user: null };

    const renewDuration = 60 * 60 * 24 * 2;
    const now = Math.floor(Date.now() / 1000);
    if (validSession.expiresAt - now < renewDuration)
      await renewSession(validSession.id);

    try {
      const baseUrl = getBaseUrl();
      await ensureActorExists(validSession.user.id, baseUrl);
    } catch (error) {
      logger.warn(
        `failed to ensure federation actor for user with id ${validSession.user.id}`,
        error,
      );
    }

    const avatarUrl = validSession.user.avatarUrl
      ? `${baseUrl}/api/s3/${validSession.user.avatarUrl}`
      : null;

    return {
      user: {
        ...validSession.user,
        avatarUrl,
      },
      sessionId: validSession.id,
    };
  })
  .resolve({ as: "scoped" }, ({ user, set, error }) => {
    if (!user) {
      set.status = 401;
      return error(401, "unauthorized");
    }

    return { user };
  });
