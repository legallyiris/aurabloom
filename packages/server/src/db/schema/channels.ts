import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid/non-secure";
import { communities } from "./communities";
import { users } from "./users";

const channelTypes = ["text", "category"] as const;
export type ChannelType = (typeof channelTypes)[number];

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

export { channelTypes };
