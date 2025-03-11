import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { nanoid } from "nanoid/non-secure";
import db, { schema } from "../db";
import { ensureCommunityActorExists } from "../federation/utils";
import { getBaseUrl } from "../federation/utils";
import { authMiddleware } from "../middleware/auth";
import { uploadObject } from "../utils/s3";

const communityCreateBody = t.Object({
  name: t.String({ minLength: 3, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  icon: t.Optional(t.String()),
  isPublic: t.Optional(t.Boolean()),
});

function formatCommunityResponse(
  community: typeof schema.communities.$inferSelect,
  baseUrl: string,
) {
  return {
    ...community,
    icon: community.icon ? `${baseUrl}/api/s3/${community.icon}` : null,
  };
}

export const communitiesRoutes = new Elysia({
  prefix: "/communities",
  tags: ["communities"],
})
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, user, error, request }) => {
      if (!user) return error(401, "unauthenticated");

      try {
        const community = await db
          .insert(schema.communities)
          .values({
            id: nanoid(),
            name: body.name,
            description: body.description,
            icon: body.icon,
            createdBy: user.id,
            isPublic: body.isPublic ?? true,
          })
          .returning();

        if (!community.length) return error(500, "failed to create community");

        await ensureCommunityActorExists(community[0].id, getBaseUrl(request));

        await db.insert(schema.communityMembers).values({
          userId: user.id,
          communityId: community[0].id,
          displayName: user.username,
        });

        return {
          status: "success",
          data: community[0],
        };
      } catch (err) {
        console.error(err);
        return error(500, "failed to create community");
      }
    },
    {
      body: communityCreateBody,
      detail: {
        summary: "create a new community",
        description:
          "create a new community and make the current user its creator",
      },
    },
  )
  .get(
    "/",
    async ({ error }) => {
      try {
        const communities = db
          .select({
            id: schema.communities.id,
            name: schema.communities.name,
            description: schema.communities.description,
            icon: schema.communities.icon,
            createdAt: schema.communities.createdAt,
            createdBy: schema.communities.createdBy,
            isPublic: schema.communities.isPublic,
          })
          .from(schema.communities)
          .leftJoin(
            schema.communityMembers,
            eq(schema.communities.id, schema.communityMembers.communityId),
          )
          .where(eq(schema.communities.isPublic, true))
          .groupBy(schema.communities.id)
          .orderBy(desc(schema.communities.createdAt))
          .all();

        return {
          status: "success",
          data: communities,
        };
      } catch (err) {
        return error(500, "failed to retrieve communities");
      }
    },
    {
      detail: {
        summary: "list public communities",
        description: "get a list of all public communities",
      },
    },
  )
  .get(
    "/me",
    async ({ user, error, request }) => {
      if (!user) return error(401, "unauthenticated");

      try {
        const memberships = db
          .select({
            community: schema.communities,
            joinedAt: schema.communityMembers.joinedAt,
            displayName: schema.communityMembers.displayName,
            aboutMe: schema.communityMembers.aboutMe,
          })
          .from(schema.communityMembers)
          .innerJoin(
            schema.communities,
            eq(schema.communityMembers.communityId, schema.communities.id),
          )
          .where(eq(schema.communityMembers.userId, user.id))
          .all();

        return {
          status: "success",
          data: memberships.map((m) => ({
            ...formatCommunityResponse(m.community, getBaseUrl(request)),
            membership: {
              joinedAt: m.joinedAt,
              displayName: m.displayName,
              aboutMe: m.aboutMe,
            },
          })),
        };
      } catch (err) {
        return error(500, "failed to retrieve your communities");
      }
    },
    {
      detail: {
        summary: "list my communities",
        description:
          "get a list of all communities the current user is a member of",
      },
    },
  )
  .get(
    "/:id",
    async ({ params, user, error, request }) => {
      if (!user) return error(401, "unauthenticated");

      try {
        const community = db
          .select()
          .from(schema.communities)
          .where(eq(schema.communities.id, params.id))
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
                eq(schema.communityMembers.communityId, params.id),
                eq(schema.communityMembers.userId, user.id),
              ),
            )
            .get();

          if (!membership) {
            return error(403, "you don't have access to this community");
          }
        }

        const memberCount = await db.$count(
          schema.communityMembers,
          eq(schema.communityMembers.communityId, params.id),
        );

        const userMembership = db
          .select()
          .from(schema.communityMembers)
          .where(
            and(
              eq(schema.communityMembers.communityId, params.id),
              eq(schema.communityMembers.userId, user.id),
            ),
          )
          .get();

        return {
          status: "success",
          data: {
            ...formatCommunityResponse(community, getBaseUrl(request)),
            memberCount,
            isMember: !!userMembership,
            membership: userMembership || null,
          },
        };
      } catch (err) {
        console.error("failed to retrieve community:", err);
        return error(500, "failed to retrieve community");
      }
    },
    {
      detail: {
        summary: "get community details",
        description: "get details of a specific community by ID",
      },
    },
  )
  .post(
    "/:id/join",
    async ({ params, user, error }) => {
      if (!user) return error(401, "unauthenticated");

      try {
        const community = db
          .select()
          .from(schema.communities)
          .where(eq(schema.communities.id, params.id))
          .get();

        if (!community) return error(404, "community not found");

        const existingMembership = db
          .select()
          .from(schema.communityMembers)
          .where(
            and(
              eq(schema.communityMembers.communityId, params.id),
              eq(schema.communityMembers.userId, user.id),
            ),
          )
          .get();

        if (existingMembership) {
          return error(400, "you are already a member of this community");
        }

        if (!community.isPublic) return error(404, "community not found");

        const membership = await db
          .insert(schema.communityMembers)
          .values({
            userId: user.id,
            communityId: params.id,
            displayName: user.username,
          })
          .returning();

        return {
          status: "success",
          data: membership[0],
        };
      } catch (err) {
        return error(500, "failed to join community");
      }
    },
    {
      detail: {
        summary: "join a community",
        description: "join a public community as the current user",
      },
    },
  )
  .patch(
    "/:id/icon",
    async ({ params, user, error, request }) => {
      if (!user) return error(401, "unauthenticated");

      try {
        const community = db
          .select()
          .from(schema.communities)
          .where(eq(schema.communities.id, params.id))
          .get();

        if (!community) return error(404, "community not found");
        if (community.createdBy !== user.id)
          return error(403, "only the community creator can update the icon");

        const formData = await request.formData();
        const icon = formData.get("icon");

        if (!icon || !(icon instanceof File))
          return error(400, "icon file is required");

        const iconUrl = await uploadObject(icon, "community-icons");

        const updated = await db
          .update(schema.communities)
          .set({ icon: iconUrl })
          .where(eq(schema.communities.id, params.id))
          .returning();

        return {
          status: "success",
          data: {
            ...updated[0],
            icon: updated[0].icon
              ? `${getBaseUrl(request)}/api/s3/${updated[0].icon}`
              : null,
          },
        };
      } catch (err) {
        return error(500, "failed to update community icon");
      }
    },
    {
      detail: {
        summary: "update community icon",
        description: "update a community's icon",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  icon: { type: "string", format: "binary" },
                },
                required: ["icon"],
              },
            },
          },
        },
      },
    },
  );
