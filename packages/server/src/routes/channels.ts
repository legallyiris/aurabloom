import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { nanoid } from "nanoid";

import db, { schema } from "../db";
import { models } from "../db/models";
import { channelTypes } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { apiError, apiUnauthenticated } from "../utils/apiError";

export const channelsRoutes = new Elysia({
  prefix: "/channels",
  tags: ["channels"],
})
  .use(authMiddleware)
  .post(
    "/:communityId",
    async ({ params, body, user }) => {
      if (!user) return apiUnauthenticated();

      try {
        const community = db
          .select()
          .from(schema.communities)
          .where(eq(schema.communities.id, params.communityId))
          .get();

        if (!community) return apiError(404, "community not found");

        const membership = db
          .select()
          .from(schema.communityMembers)
          .where(
            and(
              eq(schema.communityMembers.communityId, params.communityId),
              eq(schema.communityMembers.userId, user.id),
            ),
          )
          .get();

        if (!membership)
          return apiError(403, "you must be a member to create channels");

        if (community.createdBy !== user.id) {
          return apiError(
            403,
            "only the community creator can create channels",
          );
        }

        if (body.parentChannelId) {
          const parentChannel = db
            .select()
            .from(schema.channels)
            .where(eq(schema.channels.id, body.parentChannelId))
            .get();

          if (!parentChannel) return apiError(404, "parent channel not found");
          if (parentChannel.type !== "category")
            return apiError(400, "parent channel must be a category channel");
        }

        const channel = await db
          .insert(schema.channels)
          .values({
            id: nanoid(),
            communityId: params.communityId,
            name: body.name,
            description: body.description,
            type: body.type || "text",
            isPrivate: body.isPrivate || false,
            createdBy: user.id,
            parentChannelId: body.parentChannelId || null,
          })
          .returning();

        return {
          status: "success",
          data: channel[0],
        };
      } catch (error) {
        console.error(error);
        return apiError(500, "failed to create channel");
      }
    },
    {
      body: models.channel.create,
      beforeHandle: ({ body, set }) => {
        if (body.type && !channelTypes.includes(body.type)) {
          set.status = 400;
          return apiError(400, "invalid channel type");
        }
      },
      detail: {
        summary: "create a channel",
        description: "create a new channel in a community",
      },
    },
  )
  .get(
    "/:communityId",
    async ({ params, user }) => {
      if (!user) return apiUnauthenticated();

      try {
        const community = db
          .select()
          .from(schema.communities)
          .where(eq(schema.communities.id, params.communityId))
          .get();

        if (!community) {
          return apiError(404, "community not found");
        }

        const membership = db
          .select()
          .from(schema.communityMembers)
          .where(
            and(
              eq(schema.communityMembers.communityId, params.communityId),
              eq(schema.communityMembers.userId, user.id),
            ),
          )
          .get();

        if (!membership && !community.isPublic) {
          return apiError(403, "you don't have access to this community");
        }

        const channels = db
          .select()
          .from(schema.channels)
          .where(eq(schema.channels.communityId, params.communityId))
          .all();

        return {
          status: "success",
          data: channels,
        };
      } catch (error) {
        return apiError(500, "failed to retrieve channels");
      }
    },
    {
      detail: {
        summary: "list channels",
        description: "get all channels in a community",
      },
    },
  );
