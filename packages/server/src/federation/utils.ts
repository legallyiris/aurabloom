import logger from "./logger";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid/non-secure";

import { read } from "bun:ffi";
import config from "../config";
import db from "../db";
import { schema } from "../db";
import { generateKeyPair, signData } from "./crypto";
import type {
  AcceptActivity,
  ActivityPubActivity,
  CreateNoteActivity,
  FederatedActor,
  FollowActivity,
} from "./types";

export function getBaseUrl(req?: Request): string {
  if (req) {
    const host = req.headers.get("host") || "localhost";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    return `${proto}://${host}`;
  }

  return `${config.server.secure ? "https" : "http"}://${config.server.hostName || "localhost"}`;
}

export async function ensureActorExists(
  userId: number,
  baseUrl: string,
): Promise<string> {
  const existingActor = db
    .select()
    .from(schema.federatedActors)
    .where(
      and(
        eq(schema.federatedActors.userId, userId),
        eq(schema.federatedActors.actorType, "user"),
      ),
    )
    .get();

  if (existingActor) return existingActor.id;
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();

  if (!user) throw new Error("User not found");
  const keys = await generateKeyPair();
  const actorUrl = `${baseUrl}/ap/users/${user.username}`;
  try {
    const actor = await db
      .insert(schema.federatedActors)
      .values({
        id: nanoid(),
        userId,
        communityId: null,
        actorType: "user",
        actorUrl,
        inbox: `${actorUrl}/inbox`,
        outbox: `${actorUrl}/outbox`,
        followers: `${actorUrl}/followers`,
        following: `${actorUrl}/following`,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        sharedInbox: `${baseUrl}/ap/shared/inbox`,
      })
      .returning();

    return actor[0].id;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create actor");
  }
}

export async function ensureCommunityActorExists(
  communityId: string,
  baseUrl: string,
): Promise<string> {
  const existingActor = db
    .select()
    .from(schema.federatedActors)
    .where(
      and(
        eq(schema.federatedActors.communityId, communityId),
        eq(schema.federatedActors.actorType, "community"),
      ),
    )
    .get();

  if (existingActor) return existingActor.id;

  const community = db
    .select()
    .from(schema.communities)
    .where(eq(schema.communities.id, communityId))
    .get();

  if (!community) throw new Error("community not found");

  const keys = await generateKeyPair();
  const actorUrl = `${baseUrl}/ap/communities/${communityId}`;

  const actor = await db
    .insert(schema.federatedActors)
    .values({
      id: nanoid(),
      userId: null,
      communityId,
      actorType: "community",
      actorUrl,
      inbox: `${actorUrl}/inbox`,
      outbox: `${actorUrl}/outbox`,
      followers: `${actorUrl}/followers`,
      following: `${actorUrl}/following`,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      sharedInbox: `${baseUrl}/ap/shared/inbox`,
    })
    .returning();

  return actor[0].id;
}

export function createMessageActivity(
  actorUrl: string,
  messageId: string,
  content: string,
  channelUrl: string,
): CreateNoteActivity {
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${actorUrl}/activities/${nanoid()}`,
    type: "Create",
    actor: actorUrl,
    published: new Date().toISOString(),
    to: [channelUrl],
    object: {
      id: `${actorUrl}/notes/${messageId}`,
      type: "Note",
      attributedTo: actorUrl,
      content,
      published: new Date().toISOString(),
      to: [channelUrl],
    },
  };
}

export function createFollowActivity(
  actorUrl: string,
  targetActorUrl: string,
): FollowActivity {
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${actorUrl}/activities/${nanoid()}`,
    type: "Follow",
    actor: actorUrl,
    object: targetActorUrl,
    published: new Date().toISOString(),
  };
}

export function createAcceptActivity(
  actorUrl: string,
  followActivity: FollowActivity,
): AcceptActivity {
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    id: `${actorUrl}/activities/${nanoid()}`,
    type: "Accept",
    actor: actorUrl,
    object: followActivity,
    published: new Date().toISOString(),
  };
}

export async function deliverActivity(
  activity: ActivityPubActivity,
  targetInbox: string,
  privateKey: string,
  keyId: string,
): Promise<boolean> {
  try {
    const activityJson = JSON.stringify(activity);

    const date = new Date().toUTCString();
    const parsedUrl = new URL(targetInbox);
    const path = parsedUrl.pathname;

    const stringToSign = `(request-target): post ${path}\nhost: ${parsedUrl.host}\ndate: ${date}\ndigest: SHA-256=${Buffer.from(activityJson).toString("base64")}`;
    const signature = await signData(stringToSign, privateKey);
    const signatureHeader = `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"`;

    const response = await fetch(targetInbox, {
      method: "POST",
      headers: {
        "Content-Type": "application/activity+json",
        Host: parsedUrl.host,
        Date: date,
        Digest: `SHA-256=${Buffer.from(activityJson).toString("base64")}`,
        Signature: signatureHeader,
      },
      body: activityJson,
    });

    if (!response.ok) {
      logger.error(
        `failed to deliver activity to ${targetInbox}: ${response.status} ${response.statusText}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`error delivering activity to ${targetInbox}:`, error);
    return false;
  }
}
