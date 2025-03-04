import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text("username", { length: 48 }).notNull().unique(),
  displayName: text("displayName", { length: 48 }).notNull(),
  password: text("password").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

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
