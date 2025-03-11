import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import db, { schema } from "../db";
import { verifyActivityPubSignature } from "../middleware/verifyActPub";
import {
  handleCreateCommunityNoteActivity,
  handleCreateNoteActivity,
  handleFollowActivity,
  handleFollowCommunityActivity,
} from "./handlers";
import rootLogger from "./logger";
import {
  type ActivityPubActivity,
  type ActivityPubActor,
  type FollowActivity,
  type WebfingerResponse,
  isCreateNoteActivity,
} from "./types";
import { getBaseUrl } from "./utils";

const logger = rootLogger.child("routes");

export const federationRoutes = new Elysia()
  .get(
    "/.well-known/webfinger",
    async ({ query, error, request }) => {
      try {
        if (!query.resource)
          return error(400, "resource parameter is required");

        const match = query.resource.match(/^acct:([^@]+)@(.+)$/);
        if (!match) return error(400, "invalid resource format");

        const [, username, domain] = match;
        const host = request.headers.get("host") || "";

        if (domain !== host) return error(404, "user not found");

        const user = db
          .select()
          .from(schema.users)
          .where(eq(schema.users.username, username))
          .get();

        if (!user) return error(404, "user not found");

        const baseUrl = getBaseUrl(request);
        const actorUrl = `${baseUrl}/ap/users/${username}`;

        const response: WebfingerResponse = {
          subject: `acct:${username}@${domain}`,
          links: [
            {
              rel: "self",
              type: "application/activity+json",
              href: actorUrl,
            },
            {
              rel: "http://webfinger.net/rel/profile-page",
              type: "text/html",
              href: `${baseUrl}/users/${username}`,
            },
          ],
        };

        return response;
      } catch (err) {
        logger.error("webfinger error:", err);
        return error(500, "internal server error");
      }
    },
    {
      query: t.Object({
        resource: t.Optional(t.String()),
      }),
      detail: {
        summary: "webfinger endpoint",
        description: "used for actor discovery in activitypub",
        tags: ["federation"],
      },
    },
  )

  .group("/ap/users/:username", (app) =>
    app
      .get(
        "/",
        async ({ error, params, request }) => {
          try {
            const { username } = params;

            const user = db
              .select()
              .from(schema.users)
              .where(eq(schema.users.username, username))
              .get();

            if (!user) return error(404, "user not found");

            const fedActor = db
              .select()
              .from(schema.federatedActors)
              .where(
                and(
                  eq(schema.federatedActors.userId, user.id),
                  eq(schema.federatedActors.actorType, "user"),
                ),
              )
              .get();
            if (!fedActor) return error(404, "actor not found");

            const baseUrl = getBaseUrl(request);
            const actorUrl = `${baseUrl}/ap/users/${username}`;

            const actor: ActivityPubActor = {
              "@context": [
                "https://www.w3.org/ns/activitystreams",
                "https://w3id.org/security/v1",
              ],
              id: actorUrl,
              type: "Person",
              preferredUsername: user.username,
              name: user.displayName,
              summary: user.aboutMe || "",
              inbox: fedActor.inbox,
              outbox: fedActor.outbox,
              followers: fedActor.followers,
              following: fedActor.following,
              publicKey: {
                id: `${actorUrl}#main-key`,
                owner: actorUrl,
                publicKeyPem: fedActor.publicKey || "",
              },
              url: `${baseUrl}/users/${username}`,
              icon: {
                type: "Image",
                mediaType: "image/png",
                url: `${baseUrl}/avatar/${username}`,
              },
            };

            return actor;
          } catch (err) {
            logger.error("actor GET error:", err);
            return error(500, "internal server error");
          }
        },
        {
          detail: {
            summary: "get user actor",
            description: "returns activitypub actor information for a user",
            tags: ["federation"],
          },
        },
      )
      .get(
        "/outbox",
        async ({ query, error, params, request }) => {
          try {
            const { username } = params;
            const user = db
              .select()
              .from(schema.users)
              .where(eq(schema.users.username, username))
              .get();

            if (!user) return error(404, "user not found");

            const actor = db
              .select()
              .from(schema.federatedActors)
              .where(
                and(
                  eq(schema.federatedActors.userId, user.id),
                  eq(schema.federatedActors.actorType, "user"),
                ),
              )
              .get();

            if (!actor) return error(404, "actor not found");

            const baseUrl = getBaseUrl(request);
            const actorUrl = `${baseUrl}/ap/users/${username}`;

            if (!query.page) {
              const activityCount = await db.$count(
                schema.federatedActivities,
                eq(schema.federatedActivities.actorId, actor.id),
              );

              return {
                "@context": "https://www.w3.org/ns/activitystreams",
                id: `${actorUrl}/outbox`,
                type: "OrderedCollection",
                totalItems: activityCount,
                first: `${actorUrl}/outbox?page=true`,
                last: `${actorUrl}/outbox?page=true&before=0`,
              };
            }

            const activities = db
              .select({
                activityId: schema.federatedActivities.activityId,
                activityType: schema.federatedActivities.activityType,
                object: schema.federatedActivities.object,
                published: schema.federatedActivities.published,
              })
              .from(schema.federatedActivities)
              .where(eq(schema.federatedActivities.actorId, actor.id))
              .orderBy(desc(schema.federatedActivities.published))
              .limit(20)
              .all();

            const activityObjects = activities.map((act) =>
              JSON.parse(act.object),
            );

            return {
              "@context": "https://www.w3.org/ns/activitystreams",
              id: `${actorUrl}/outbox?page=true`,
              type: "OrderedCollectionPage",
              partOf: `${actorUrl}/outbox`,
              orderedItems: activityObjects,
            };
          } catch (err) {
            logger.error("outbox GET error:", err);
            return error(500, "internal server error");
          }
        },
        {
          query: t.Object({
            page: t.Optional(t.String()),
          }),
          detail: {
            summary: "get user outbox",
            description: "returns activitypub outbox for a user",
            tags: ["federation"],
          },
        },
      )
      .use(verifyActivityPubSignature)
      .post(
        "/inbox",
        async ({ body, error, params, request }) => {
          const { username } = params;
          const user = db
            .select()
            .from(schema.users)
            .where(eq(schema.users.username, username))
            .get();

          if (!user) return error(404, "user not found");

          const targetActor = db
            .select()
            .from(schema.federatedActors)
            .where(
              and(
                eq(schema.federatedActors.userId, user.id),
                eq(schema.federatedActors.actorType, "user"),
              ),
            )
            .get();

          if (!targetActor) return error(404, "actor not found");

          const activityData = body as ActivityPubActivity;

          if (!activityData.id || !activityData.type || !activityData.actor)
            return error(400, "invalid activity format");
          logger.info(`received activity for ${username}:`, activityData);

          if (
            activityData.type === "Follow" &&
            typeof activityData.object === "string"
          ) {
            const followActivity: FollowActivity = {
              ...activityData,
              type: "Follow",
              object: activityData.object,
            };
            await handleFollowActivity(followActivity, targetActor, request);
          } else if (isCreateNoteActivity(activityData)) {
            await handleCreateNoteActivity(activityData, targetActor);
          } else {
            logger.warn(
              `unknown or unsupported activity type: ${activityData.type}`,
            );
          }

          return new Response(null, { status: 202 });
        },

        {
          body: t.Any(),
          detail: {
            summary: "user inbox",
            description:
              "activitypub inbox for receiving activities directed to a user",
            tags: ["federation"],
          },
          beforeHandle: [
            ({ request, set }) => {
              const acceptHeader = request.headers.get("accept");
              if (acceptHeader?.includes("application/activity+json")) {
                set.headers["Content-Type"] = "application/activity+json";
              }
            },
          ],
        },
      ),
  )
  .group("/ap/communities/:id", (app) =>
    app
      .get(
        "/",
        async ({ params, request, error }) => {
          try {
            const { id } = params;

            const community = db
              .select()
              .from(schema.communities)
              .where(eq(schema.communities.id, id))
              .get();

            if (!community) return error(404, "community not found");
            if (!community.isPublic)
              return error(403, "this community is private");

            const fedActor = db
              .select()
              .from(schema.federatedActors)
              .where(
                and(
                  eq(schema.federatedActors.communityId, id),
                  eq(schema.federatedActors.actorType, "community"),
                ),
              )
              .get();
            if (!fedActor) return error(404, "actor not found");

            const baseUrl = getBaseUrl(request);
            const actorUrl = `${baseUrl}/ap/communities/${id}`;

            const actor: ActivityPubActor = {
              "@context": [
                "https://www.w3.org/ns/activitystreams",
                "https://w3id.org/security/v1",
              ],
              id: actorUrl,
              type: "Group",
              preferredUsername: community.name
                .toLowerCase()
                .replace(/\s+/g, "-"),
              name: community.name,
              summary: community.description || "",
              inbox: fedActor.inbox,
              outbox: fedActor.outbox,
              followers: fedActor.followers,
              following: fedActor.following,
              publicKey: {
                id: `${actorUrl}#main-key`,
                owner: actorUrl,
                publicKeyPem: fedActor.publicKey || "",
              },
              url: `${baseUrl}/communities/${id}`,
              icon: community.icon
                ? {
                    type: "Image",
                    mediaType: "image/png",
                    url: community.icon,
                  }
                : undefined,
            };

            return actor;
          } catch (err) {
            logger.error("community actor GET error:", err);
            return error(500, "internal server error");
          }
        },
        {
          detail: {
            summary: "get community actor",
            description:
              "returns activitypub actor information for a community",
            tags: ["federation"],
          },
        },
      )
      .get(
        "/outbox",
        async ({ params, query, request, error }) => {
          try {
            const { id } = params;

            const community = db
              .select()
              .from(schema.communities)
              .where(eq(schema.communities.id, id))
              .get();

            if (!community) return error(404, "community not found");
            if (!community.isPublic)
              return error(403, "this community is private");

            const actor = db
              .select()
              .from(schema.federatedActors)
              .where(
                and(
                  eq(schema.federatedActors.communityId, id),
                  eq(schema.federatedActors.actorType, "community"),
                ),
              )
              .get();

            if (!actor) return error(404, "actor not found");

            const baseUrl = getBaseUrl(request);
            const actorUrl = `${baseUrl}/ap/communities/${id}`;

            if (!query.page) {
              const activityCount = await db.$count(
                schema.federatedActivities,
                eq(schema.federatedActivities.actorId, actor.id),
              );

              return {
                "@context": "https://www.w3.org/ns/activitystreams",
                id: `${actorUrl}/outbox`,
                type: "OrderedCollection",
                totalItems: activityCount,
                first: `${actorUrl}/outbox?page=true`,
                last: `${actorUrl}/outbox?page=true&before=0`,
              };
            }

            const activities = db
              .select({
                activityId: schema.federatedActivities.activityId,
                activityType: schema.federatedActivities.activityType,
                object: schema.federatedActivities.object,
                published: schema.federatedActivities.published,
              })
              .from(schema.federatedActivities)
              .where(eq(schema.federatedActivities.actorId, actor.id))
              .orderBy(desc(schema.federatedActivities.published))
              .limit(20)
              .all();

            const activityObjects = activities.map((act) =>
              JSON.parse(act.object),
            );

            return {
              "@context": "https://www.w3.org/ns/activitystreams",
              id: `${actorUrl}/outbox?page=true`,
              type: "OrderedCollectionPage",
              partOf: `${actorUrl}/outbox`,
              orderedItems: activityObjects,
            };
          } catch (err) {
            logger.error("community outbox GET error:", err);
            return error(500, "internal server error");
          }
        },
        {
          query: t.Object({
            page: t.Optional(t.String()),
          }),
          detail: {
            summary: "get community outbox",
            description: "returns activitypub outbox for a community",
            tags: ["federation"],
          },
        },
      )
      .use(verifyActivityPubSignature)
      .post(
        "/inbox",
        async ({ params, body, request, error }) => {
          const { id } = params;
          const community = db
            .select()
            .from(schema.communities)
            .where(eq(schema.communities.id, id))
            .get();

          if (!community) return error(404, "community not found");
          if (!community.isPublic)
            return error(403, "this community is not federating");

          const targetActor = db
            .select()
            .from(schema.federatedActors)
            .where(
              and(
                eq(schema.federatedActors.communityId, id),
                eq(schema.federatedActors.actorType, "community"),
              ),
            )
            .get();

          if (!targetActor) return error(404, "actor not found");

          const activityData = body as ActivityPubActivity;
          if (!activityData.id || !activityData.type || !activityData.actor)
            return error(400, "invalid activity format");

          logger.info(`received activity for community ${id}:`, activityData);

          if (
            activityData.type === "Follow" &&
            typeof activityData.object === "string"
          ) {
            const followActivity: FollowActivity = {
              ...activityData,
              type: "Follow",
              object: activityData.object,
            };
            await handleFollowCommunityActivity(
              followActivity,
              targetActor,
              request,
            );
          } else if (isCreateNoteActivity(activityData)) {
            await handleCreateCommunityNoteActivity(activityData, targetActor, {
              ...community,
              domain: null,
              isLocal: false,
            });
          } else {
            logger.warn(
              `unknown or unsupported activity type: ${activityData.type}`,
            );
          }

          return new Response(null, { status: 202 });
        },
        {
          body: t.Any(),
          detail: {
            summary: "community inbox",
            description:
              "activitypub inbox for receiving activities directed to a community",
            tags: ["federation"],
          },
          beforeHandle: [
            ({ request, set }) => {
              const acceptHeader = request.headers.get("accept");
              if (acceptHeader?.includes("application/activity+json")) {
                set.headers["Content-Type"] = "application/activity+json";
              }
            },
          ],
        },
      ),
  )
  .use(verifyActivityPubSignature)
  .post(
    "/ap/shared/inbox",
    async ({ body, error }) => {
      const activityData = body as ActivityPubActivity;
      if (!activityData.id || !activityData.type || !activityData.actor) {
        return error(400, "invalid activity format");
      }

      logger.info("received activity in shared inbox:", activityData);

      const recipients = [];
      const to = Array.isArray(activityData.to)
        ? activityData.to
        : activityData.to
          ? [activityData.to]
          : [];
      const cc = Array.isArray(activityData.cc)
        ? activityData.cc
        : activityData.cc
          ? [activityData.cc]
          : [];

      const addressees = [...to, ...cc];

      for (const address of addressees) {
        const actor = db
          .select()
          .from(schema.federatedActors)
          .where(eq(schema.federatedActors.actorUrl, address))
          .get();

        if (actor) recipients.push(actor);
      }

      logger.info(
        `found ${recipients.length} recipients for shared inbox activity`,
      );

      if (recipients.length > 0) {
        if (
          activityData.type === "Follow" &&
          typeof activityData.object === "string"
        ) {
          const followActivity: FollowActivity = {
            ...activityData,
            type: "Follow",
            object: activityData.object,
          };

          for (const recipient of recipients) {
            if (recipient.actorType === "user") {
              await handleFollowActivity(followActivity, recipient);
            } else if (recipient.actorType === "community") {
              await handleFollowCommunityActivity(followActivity, recipient);
            }
          }
        } else if (isCreateNoteActivity(activityData)) {
          for (const recipient of recipients) {
            if (recipient.actorType === "user" && recipient.userId) {
              await handleCreateNoteActivity(activityData, recipient);
            } else if (
              recipient.actorType === "community" &&
              recipient.communityId
            ) {
              const community = db
                .select()
                .from(schema.communities)
                .where(eq(schema.communities.id, recipient.communityId))
                .get();

              if (community) {
                await handleCreateCommunityNoteActivity(
                  activityData,
                  recipient,
                  { ...community, domain: null, isLocal: false },
                );
              }
            }
          }
        }
      }

      return new Response(null, { status: 202 });
    },
    {
      body: t.Any(),
      detail: {
        summary: "shared inbox",
        description:
          "activitypub shared inbox for receiving activities directed to multiple actors",
        tags: ["federation"],
      },
      beforeHandle: ({ request, set }) => {
        const acceptHeader = request.headers.get("accept");
        if (acceptHeader?.includes("application/activity+json")) {
          set.headers["Content-Type"] = "application/activity+json";
        }
      },
    },
  );
