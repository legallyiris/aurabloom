import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid/non-secure";
import { channels } from './channels';
import { users } from './users';

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
