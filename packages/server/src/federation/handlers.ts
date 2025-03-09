import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid/non-secure";

import db, { schema } from "../db";
import rootLogger from "./logger";
import { createAcceptActivity, deliverActivity, getBaseUrl } from "./utils";

const logger = rootLogger.child("handlers");

import {
  type ActivityPubActivity,
  type Community,
  type CreateNoteActivity,
  type FederatedActor,
  type FollowActivity,
  isCreateNoteActivity,
  isFollowActivity,
} from "./types";

export async function handleFollowActivity(
  activity: FollowActivity,
  targetActor: FederatedActor,
  request?: Request,
) {
  try {
    logger.info(
      `follow activity received: ${activity.actor} -> ${activity.object}`,
    );

    let remoteActor = db
      .select()
      .from(schema.federatedActors)
      .where(eq(schema.federatedActors.actorUrl, activity.actor))
      .get();

    if (!remoteActor) {
      try {
        const actorResponse = await fetch(activity.actor, {
          headers: {
            Accept: "application/activity+json",
          },
        });

        if (!actorResponse.ok) {
          logger.error(`failed to fetch remote actor: ${activity.actor}`);
          return;
        }

        const actorData = await actorResponse.json();

        remoteActor = (
          await db
            .insert(schema.federatedActors)
            .values({
              userId: null,
              communityId: null,
              actorType: actorData.type === "Group" ? "community" : "user",
              actorUrl: activity.actor,
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
      } catch (err) {
        logger.error(`failed to create remote actor: ${err}`);
        return;
      }
    }

    const existingFollow = db
      .select()
      .from(schema.federatedFollows)
      .where(
        and(
          eq(schema.federatedFollows.followerId, remoteActor.id),
          eq(schema.federatedFollows.followedId, targetActor.id),
        ),
      )
      .get();

    if (existingFollow) return;

    await db.insert(schema.federatedFollows).values({
      followerId: remoteActor.id,
      followedId: targetActor.id,
      accepted: true,
    });

    const baseUrl = request ? getBaseUrl(request) : undefined;

    if (baseUrl && targetActor.privateKey) {
      const acceptActivity = createAcceptActivity(
        targetActor.actorUrl,
        activity,
      );

      await db.insert(schema.federatedActivities).values({
        activityId: acceptActivity.id,
        activityType: "Accept",
        actorId: targetActor.id,
        object: JSON.stringify(acceptActivity),
        isLocal: true,
      });

      await deliverActivity(
        acceptActivity,
        remoteActor.inbox,
        targetActor.privateKey,
        `${targetActor.actorUrl}#main-key`,
      );
    }
  } catch (err) {
    logger.error(`error handling Follow activity: ${err}`);
  }
}

export async function handleFollowCommunityActivity(
  activity: FollowActivity,
  targetActor: FederatedActor,
  request?: Request,
) {
  try {
    logger.info(
      `follow community activity received: ${activity.actor} -> ${activity.object}`,
    );

    let remoteActor = db
      .select()
      .from(schema.federatedActors)
      .where(eq(schema.federatedActors.actorUrl, activity.actor))
      .get();

    if (!remoteActor) {
      try {
        const actorResponse = await fetch(activity.actor, {
          headers: {
            Accept: "application/activity+json",
          },
        });

        if (!actorResponse.ok) {
          logger.error(`failed to fetch remote actor: ${activity.actor}`);
          return;
        }

        const actorData = await actorResponse.json();

        remoteActor = (
          await db
            .insert(schema.federatedActors)
            .values({
              userId: null,
              communityId: null,
              actorType: actorData.type === "Group" ? "community" : "user",
              actorUrl: activity.actor,
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
      } catch (err) {
        logger.error(`failed to create remote actor: ${err}`);
        return;
      }
    }

    const existingFollow = db
      .select()
      .from(schema.federatedFollows)
      .where(
        and(
          eq(schema.federatedFollows.followerId, remoteActor.id),
          eq(schema.federatedFollows.followedId, targetActor.id),
        ),
      )
      .get();

    if (existingFollow) return;

    await db.insert(schema.federatedFollows).values({
      followerId: remoteActor.id,
      followedId: targetActor.id,
      accepted: true,
    });

    const baseUrl = request ? getBaseUrl(request) : undefined;

    if (baseUrl && targetActor.privateKey) {
      const acceptActivity = createAcceptActivity(
        targetActor.actorUrl,
        activity,
      );

      await db.insert(schema.federatedActivities).values({
        activityId: acceptActivity.id,
        activityType: "Accept",
        actorId: targetActor.id,
        object: JSON.stringify(acceptActivity),
        isLocal: true,
      });

      await deliverActivity(
        acceptActivity,
        remoteActor.inbox,
        targetActor.privateKey,
        `${targetActor.actorUrl}#main-key`,
      );
    }
  } catch (err) {
    logger.error(`error handling Follow Community activity: ${err}`);
  }
}

export async function handleCreateNoteActivity(
  activity: ActivityPubActivity,
  targetActor: FederatedActor,
) {
  try {
    logger.info(
      `create Note activity received for user: ${targetActor.userId}`,
    );

    if (!targetActor.userId) {
      logger.error("target actor has no associated user id");
      return;
    }

    let remoteActor = db
      .select()
      .from(schema.federatedActors)
      .where(eq(schema.federatedActors.actorUrl, activity.actor))
      .get();

    if (!remoteActor) {
      try {
        const actorResponse = await fetch(activity.actor, {
          headers: {
            Accept: "application/activity+json",
          },
        });

        if (!actorResponse.ok) {
          logger.error(`failed to fetch remote actor: ${activity.actor}`);
          return;
        }

        const actorData = await actorResponse.json();

        remoteActor = (
          await db
            .insert(schema.federatedActors)
            .values({
              userId: null,
              communityId: null,
              actorType: actorData.type === "Group" ? "community" : "user",
              actorUrl: activity.actor,
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
      } catch (err) {
        logger.error(`failed to create remote actor: ${err}`);
        return;
      }
    }

    const note = activity.object;
    if (typeof note === "string") {
      logger.error("note object is a string, expected an object");
      return;
    }

    const content = note.content;
    const messageId = nanoid();

    // TODO: implement direct message handling

    await db.insert(schema.federatedActivities).values({
      activityId: activity.id,
      activityType: "Create",
      actorId: remoteActor.id,
      object: JSON.stringify(activity),
      isLocal: false,
    });
  } catch (err) {
    logger.error(`error handling Create Note activity: ${err}`);
  }
}

export async function handleCreateCommunityNoteActivity(
  activity: ActivityPubActivity,
  targetActor: FederatedActor,
  community: Community,
) {
  try {
    logger.info(`create Note activity received for community: ${community.id}`);

    if (!community.id) {
      logger.error("target community has no id");
      return;
    }

    let remoteActor = db
      .select()
      .from(schema.federatedActors)
      .where(eq(schema.federatedActors.actorUrl, activity.actor))
      .get();

    if (!remoteActor) {
      try {
        const actorResponse = await fetch(activity.actor, {
          headers: {
            Accept: "application/activity+json",
          },
        });

        if (!actorResponse.ok) {
          logger.error(`failed to fetch remote actor: ${activity.actor}`);
          return;
        }

        const actorData = await actorResponse.json();

        remoteActor = (
          await db
            .insert(schema.federatedActors)
            .values({
              userId: null,
              communityId: null,
              actorType: actorData.type === "Group" ? "community" : "user",
              actorUrl: activity.actor,
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
      } catch (err) {
        logger.error(`failed to create remote actor: ${err}`);
        return;
      }
    }

    const note = activity.object;
    if (typeof note === "string") {
      logger.error("note object is a string, expected an object");
      return;
    }

    const content = note.content;

    const federationChannel = db
      .select()
      .from(schema.channels)
      .where(
        and(
          eq(schema.channels.communityId, community.id),
          eq(schema.channels.name, "federation"),
        ),
      )
      .get();

    if (!federationChannel) {
      logger.warn(`no federation channel found for community ${community.id}`);
      return;
    }

    const federationUserId = 1;

    const messageId = nanoid();
    await db.insert(schema.messages).values({
      id: messageId,
      channelId: federationChannel.id,
      userId: federationUserId,
      content: `[${remoteActor.actorUrl}] ${content}`,
    });

    await db.insert(schema.federatedActivities).values({
      messageId,
      activityId: activity.id,
      activityType: "Create",
      actorId: remoteActor.id,
      object: JSON.stringify(activity),
      isLocal: false,
    });
  } catch (err) {
    logger.error(`Error handling Create Community Note activity: ${err}`);
  }
}
