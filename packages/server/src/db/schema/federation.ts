import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid/non-secure";

import { communities } from "./communities";
import { messages } from "./messages";
import { users } from "./users";

export const federatedActors = sqliteTable("federatedActors", {
  id: text("id").primaryKey().default(nanoid()),
  userId: int("userId").references(() => users.id),
  communityId: text("communityId").references(() => communities.id),
  actorType: text("actorType", { enum: ["user", "community"] }).notNull(),
  actorUrl: text("actorUrl").notNull().unique(),
  inbox: text("inbox").notNull(),
  outbox: text("outbox").notNull(),
  followers: text("followers").notNull(),
  following: text("following").notNull(),
  publicKey: text("publicKey"),
  privateKey: text("privateKey"),
  sharedInbox: text("sharedInbox"),
});

export const federatedActivities = sqliteTable("federatedActivities", {
  id: text("id").primaryKey().default(nanoid()),
  messageId: text("messageId").references(() => messages.id),
  activityId: text("activityId").notNull().unique(),
  activityType: text("activityType", {
    enum: [
      "Create",
      "Update",
      "Delete",
      "Follow",
      "Accept",
      "Reject",
      "Announce",
    ],
  }).notNull(),
  actorId: text("actorId").references(() => federatedActors.id),
  object: text("object").notNull(),
  published: int("published")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  isLocal: int("isLocal", { mode: "boolean" }).notNull(),
});

export const federatedFollows = sqliteTable("federatedFollows", {
  id: text("id").primaryKey().default(nanoid()),
  followerId: text("followerId")
    .references(() => federatedActors.id)
    .notNull(),
  followedId: text("followedId")
    .references(() => federatedActors.id)
    .notNull(),
  accepted: int("accepted", { mode: "boolean" }).default(false),
  createdAt: int("createdAt")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
});

// Relations
export const federatedActorsRelations = relations(
  federatedActors,
  ({ one }) => ({
    user: one(users, {
      fields: [federatedActors.userId],
      references: [users.id],
      relationName: "actorToUser",
    }),
    community: one(communities, {
      fields: [federatedActors.communityId],
      references: [communities.id],
      relationName: "actorToCommunity",
    }),
  }),
);

export const federatedActivitiesRelations = relations(
  federatedActivities,
  ({ one }) => ({
    message: one(messages, {
      fields: [federatedActivities.messageId],
      references: [messages.id],
    }),
    actor: one(federatedActors, {
      fields: [federatedActivities.actorId],
      references: [federatedActors.id],
    }),
  }),
);

export const federatedFollowsRelations = relations(
  federatedFollows,
  ({ one }) => ({
    follower: one(federatedActors, {
      fields: [federatedFollows.followerId],
      references: [federatedActors.id],
      relationName: "followerActor",
    }),
    followed: one(federatedActors, {
      fields: [federatedFollows.followedId],
      references: [federatedActors.id],
      relationName: "followedActor",
    }),
  }),
);
