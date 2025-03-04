import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import db, { schema } from "../db";
import { authMiddleware } from "../middleware/auth";
import { apiError } from "../utils/apiError";

const communityCreateBody = t.Object({
  name: t.String({ minLength: 3, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  icon: t.Optional(t.String()),
  isPublic: t.Optional(t.Boolean()),
});

export const communitiesRoutes = new Elysia({
  prefix: "/communities",
  tags: ["communities"],
})
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, user }) => {
      if (!user) return apiError(401, "not authenticated");

      try {
        const community = await db
          .insert(schema.communities)
          .values({
            name: body.name,
            description: body.description,
            icon: body.icon,
            createdBy: user.id,
            isPublic: body.isPublic ?? true,
          })
          .returning();

        if (!community.length) {
          return apiError(500, "failed to create community");
        }

        await db.insert(schema.communityMembers).values({
          userId: user.id,
          communityId: community[0].id,
          displayName: user.username,
        });

        return {
          status: "success",
          data: community[0],
        };
      } catch (error) {
        return apiError(500, "failed to create community");
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
    async () => {
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
      } catch (error) {
        return apiError(500, "failed to retrieve communities");
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
    async ({ user }) => {
      if (!user) return apiError(401, "not authenticated");

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
            ...m.community,
            membership: {
              joinedAt: m.joinedAt,
              displayName: m.displayName,
              aboutMe: m.aboutMe,
            },
          })),
        };
      } catch (error) {
        return apiError(500, "failed to retrieve your communities");
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
    async ({ params, user }) => {
      if (!user) return apiError(401, "not authenticated");

      try {
        const community = db
          .select()
          .from(schema.communities)
          .where(eq(schema.communities.id, params.id))
          .get();

        if (!community) {
          return apiError(404, "community not found");
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
            return apiError(403, "you don't have access to this community");
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
            ...community,
            memberCount: memberCount || 0,
            isMember: !!userMembership,
            membership: userMembership || null,
          },
        };
      } catch (error) {
        return apiError(500, "failed to retrieve community");
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
    async ({ params, user }) => {
      if (!user) return apiError(401, "not authenticated");
      try {
        const community = db
          .select()
          .from(schema.communities)
          .where(eq(schema.communities.id, params.id))
          .get();

        if (!community) return apiError(404, "community not found");

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
          return apiError(400, "you are already a member of this community");
        }

        if (!community.isPublic) return apiError(404, "community not found");

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
      } catch (error) {
        return apiError(500, "failed to join community");
      }
    },
    {
      detail: {
        summary: "join a community",
        description: "join a public community as the current user",
      },
    },
  );
