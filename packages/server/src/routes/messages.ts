import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";

import db, { schema } from "../db";
import {
  createMessageActivity,
  ensureActorExists,
  getBaseUrl,
} from "../federation/utils";
import { authMiddleware } from "../middleware/auth";

const messageCreateBody = t.Object({
  content: t.String({ minLength: 1, maxLength: 5000 }),
});

export const messagesRoutes = new Elysia({
  prefix: "/messages",
  tags: ["messages"],
})
  .use(authMiddleware)
  .post(
    "/:channelId",
    async ({ params, body, user, request, error }) => {
      if (!user) return error(401, "unauthenticated");

      try {
        const channel = db
          .select()
          .from(schema.channels)
          .where(eq(schema.channels.id, params.channelId))
          .get();

        if (!channel) {
          return error(404, "channel not found");
        }

        const community = db
          .select()
          .from(schema.communities)
          .where(eq(schema.communities.id, channel.communityId))
          .get();

        if (!community) {
          return error(404, "community not found");
        }

        const membership = db
          .select()
          .from(schema.communityMembers)
          .where(
            and(
              eq(schema.communityMembers.userId, user.id),
              eq(schema.communityMembers.communityId, community.id),
            ),
          )
          .get();

        if (!membership) {
          return error(403, "you must be a member to post messages");
        }

        const messageId = nanoid();
        const message = await db
          .insert(schema.messages)
          .values({
            id: messageId,
            channelId: params.channelId,
            userId: user.id,
            content: body.content,
          })
          .returning();

        if (community.isPublic) {
          try {
            const baseUrl = getBaseUrl(request);

            const actorId = await ensureActorExists(user.id, baseUrl);

            const actor = db
              .select()
              .from(schema.federatedActors)
              .where(eq(schema.federatedActors.id, actorId))
              .get();

            if (actor) {
              const activity = createMessageActivity(
                actor.actorUrl,
                messageId,
                body.content,
                `${baseUrl}/ap/communities/${community.id}`,
              );

              await db.insert(schema.federatedActivities).values({
                id: nanoid(),
                messageId,
                activityId: activity.id,
                activityType: "Create",
                actorId,
                object: JSON.stringify(activity),
                isLocal: true,
              });

              // TODO: Implement delivery to followers
            }
          } catch (fedErr) {
            console.error("federation error:", fedErr);
          }
        }

        return {
          status: "success",
          data: message[0],
        };
      } catch (err) {
        console.error("Error creating message:", err);
        return error(500, "failed to create message");
      }
    },
    {
      body: messageCreateBody,
      detail: {
        summary: "send message",
        description: "send a new message to a channel",
      },
    },
  )
  .get(
    "/:channelId",
    async ({ params, query, user, error }) => {
      if (!user) return error(401, "unauthenticated");
      const q = query;

      try {
        const limit = Number(q.limit || 50);
        // const before = q.before ? Number(q.before) : undefined;

        const channel = db
          .select()
          .from(schema.channels)
          .where(eq(schema.channels.id, params.channelId))
          .get();

        if (!channel) {
          return error(404, "channel not found");
        }

        const community = db
          .select()
          .from(schema.communities)
          .where(eq(schema.communities.id, channel.communityId))
          .get();

        if (!community) {
          return error(404, "community not found");
        }

        if (!community.isPublic) {
          const membership = db
            .select()
            .from(schema.communityMembers)
            .where(
              and(
                eq(schema.communityMembers.userId, user.id),
                eq(schema.communityMembers.communityId, community.id),
              ),
            )
            .get();

          if (!membership) {
            return error(403, "you must be a member to view messages");
          }
        }

        const query = db
          .select({
            id: schema.messages.id,
            content: schema.messages.content,
            createdAt: schema.messages.createdAt,
            updatedAt: schema.messages.updatedAt,
            isEdited: schema.messages.isEdited,
            author: {
              id: schema.users.id,
              username: schema.users.username,
              displayName: schema.users.displayName,
            },
          })
          .from(schema.messages)
          .where(
            and(
              eq(schema.messages.channelId, params.channelId),
              eq(schema.messages.isDeleted, false),
            ),
          )
          .innerJoin(schema.users, eq(schema.messages.userId, schema.users.id));

        const messages = query
          .orderBy(desc(schema.messages.createdAt))
          .limit(limit)
          .all();

        return {
          status: "success",
          data: messages.reverse(),
        };
      } catch (err) {
        return error(500, "failed to retrieve messages");
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        before: t.Optional(t.String()),
      }),
      detail: {
        summary: "get messages",
        description: "get messages from a channel",
      },
    },
  );
