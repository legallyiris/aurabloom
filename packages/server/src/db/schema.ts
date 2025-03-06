import { Param, relations } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  int,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid/non-secure";

export const channelTypes = ["text", "category"] as const;
export type ChannelType = (typeof channelTypes)[number];

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text("username", { length: 48 }).notNull().unique(),
  displayName: text("displayName", { length: 48 }).notNull(),
  aboutMe: text("aboutMe", { length: 500 }),
  password: text("password").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  expiresAt: int("expiresAt").notNull(),
  createdAt: int("createdAt")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  userAgent: text("userAgent"),
  ipAddress: text("ipAddress"),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

//

export const communities = sqliteTable("communities", {
  id: text("id").primaryKey().default(nanoid()),
  name: text("name", { length: 100 }).notNull(),
  description: text("description", { length: 500 }),
  icon: text("icon"),
  createdAt: int("createdAt")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  createdBy: int("createdBy")
    .notNull()
    .references(() => users.id),
  isPublic: int("isPublic", { mode: "boolean" }).notNull().default(true),
});

export const communityMembers = sqliteTable("communityMembers", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  communityId: text("communityId")
    .notNull()
    .references(() => communities.id),
  displayName: text("displayName", { length: 100 }),
  aboutMe: text("aboutMe", { length: 500 }),
  joinedAt: int("joinedAt")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
});

export const channels = sqliteTable("channels", {
  id: text("id").primaryKey().default(nanoid()),
  communityId: text("communityId")
    .notNull()
    .references(() => communities.id),
  name: text("name", { length: 100 }).notNull(),
  description: text("description", { length: 500 }),
  type: text("type", { enum: channelTypes }).notNull().default("text"),
  createdAt: int("createdAt")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  createdBy: int("createdBy")
    .notNull()
    .references(() => users.id),
  isPrivate: int("isPrivate", { mode: "boolean" }).notNull().default(false),
  parentChannelId: text("parentChannelId"),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().default(nanoid()),
  channelId: text("channelId")
    .notNull()
    .references(() => channels.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: int("createdAt")
    .notNull()
    .default(Math.floor(Date.now() / 1000)),
  updatedAt: int("updatedAt"),
  isDeleted: int("isDeleted", { mode: "boolean" }).notNull().default(false),
  isEdited: int("isEdited", { mode: "boolean" }).notNull().default(false),
});

//

export const communitiesRelations = relations(communities, ({ many, one }) => ({
  channels: many(channels),
  members: many(communityMembers),
  creator: one(users, {
    fields: [communities.createdBy],
    references: [users.id],
  }),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  messages: many(messages),
  community: one(communities, {
    fields: [channels.communityId],
    references: [communities.id],
  }),
  creator: one(users, {
    fields: [channels.createdBy],
    references: [users.id],
  }),
  parent: one(channels, {
    fields: [channels.parentChannelId],
    references: [channels.id],
  }),
  children: many(channels, {
    relationName: "children",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  author: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const communityMembersRelations = relations(
  communityMembers,
  ({ one }) => ({
    user: one(users, {
      fields: [communityMembers.userId],
      references: [users.id],
    }),
    community: one(communities, {
      fields: [communityMembers.communityId],
      references: [communities.id],
    }),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  communities: many(communityMembers),
  messages: many(messages),
  ownedCommunities: many(communities, {
    relationName: "creator",
  }),
  createdChannels: many(channels, {
    relationName: "creator",
  }),
}));
