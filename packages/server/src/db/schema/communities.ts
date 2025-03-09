import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid/non-secure";
import { users } from "./users";

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
