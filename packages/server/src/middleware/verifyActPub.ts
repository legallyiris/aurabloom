import { eq } from "drizzle-orm";
import { type Context, Elysia } from "elysia";

import db, { schema } from "../db";
import { verifySignature } from "../federation/crypto";
import rootLogger from "../federation/logger";
import type { ActivityPubActivity } from "../federation/types";
const logger = rootLogger.child("middleware:verifyActivityPubSignature");

type ActivityPubContext = Context<{ body: unknown; request: Request }>;

export const verifyActivityPubSignature = new Elysia()
  .derive(async (ctx: ActivityPubContext) => {
    const { request, body } = ctx;
    if (request.method !== "POST") {
      logger.warn("request is not a POST request, not verifying");
      return { verificationResult: null };
    }

    const activityData = body as ActivityPubActivity;
    if (!activityData || !activityData.id) {
      logger.warn("activity has no id, cannot verify");
      return { verificationResult: null };
    }

    if (!activityData.actor) {
      logger.warn("activity has no actor, cannot verify");
      return { verificationResult: null };
    }

    let remoteActor = db
      .select()
      .from(schema.federatedActors)
      .where(eq(schema.federatedActors.actorUrl, activityData.actor))
      .get();

    if (!remoteActor) {
      logger.warn(
        "a remote actor tried to do activity without us knowing about them. getting actor",
      );
      try {
        const actorResponse = await fetch(activityData.actor, {
          headers: {
            Accept: "application/activity+json",
          },
        });
        if (!actorResponse.ok) {
          logger.error(
            `failed to fetch remote actor. actor: ${activityData.actor}, status: ${actorResponse.status}`,
          );
          return { verificationResult: null };
        }
        const actorData = await actorResponse.json();

        remoteActor = (
          await db
            .insert(schema.federatedActors)
            .values({
              userId: null,
              communityId: null,
              actorType: actorData.type === "Group" ? "community" : "user",
              actorUrl: activityData.actor,
              inbox: actorData.inbox,
              outbox: actorData.outbox,
              followers: actorData.followers,
              following: actorData.following,
              publicKey: actorData.publicKey?.publicKeyPem || null,
              privateKey: null,
              sharedInbox: actorData.endpoints?.sharedInbox || null,
            })
            .returning()
        )[0];

        if (!remoteActor) {
          logger.error("failed to add actor after attempting to get it");
          return { verificationResult: null };
        }
      } catch (e) {
        logger.error("failed to request actor:", e);
        return { verificationResult: null };
      }
    }
    if (!remoteActor.publicKey) {
      logger.warn(
        "remote actor has no public key, signature verification failed",
      );
      return { verificationResult: null };
    }
    const isValid = await verifySignature(request, remoteActor.publicKey);

    if (!isValid) {
      logger.warn("invalid signature");
      return { verificationResult: null };
    }
    return { verificationResult: { actor: remoteActor } };
  })
  .resolve({ as: "scoped" }, ({ verificationResult, set, error }) => {
    if (!verificationResult) {
      logger.warn("verification failed");
      set.status = 401;
      return error(401, "unauthorized");
    }

    logger.info("verified actor:", verificationResult.actor.id);
    return { actor: verificationResult.actor };
  });
