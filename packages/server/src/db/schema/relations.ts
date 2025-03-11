import { relations } from "drizzle-orm";
import { channels } from './channels';
import { communities, communityMembers } from './communities';
import { messages } from './messages';
import { sessions, users } from './users';

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

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
