PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT 1741727076 NOT NULL,
	`userAgent` text,
	`ipAddress` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "userId", "expiresAt", "createdAt", "userAgent", "ipAddress") SELECT "id", "userId", "expiresAt", "createdAt", "userAgent", "ipAddress" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_communities` (
	`id` text PRIMARY KEY DEFAULT 'aE04NxdCyMhNmw05XVFOL' NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`icon` text,
	`createdAt` integer DEFAULT 1741727076 NOT NULL,
	`createdBy` integer NOT NULL,
	`isPublic` integer DEFAULT true NOT NULL,
	`avatar` text,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_communities`("id", "name", "description", "icon", "createdAt", "createdBy", "isPublic", "avatar") SELECT "id", "name", "description", "icon", "createdAt", "createdBy", "isPublic", "avatar" FROM `communities`;--> statement-breakpoint
DROP TABLE `communities`;--> statement-breakpoint
ALTER TABLE `__new_communities` RENAME TO `communities`;--> statement-breakpoint
CREATE TABLE `__new_communityMembers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`communityId` text NOT NULL,
	`displayName` text(100),
	`aboutMe` text(500),
	`joinedAt` integer DEFAULT 1741727076 NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_communityMembers`("id", "userId", "communityId", "displayName", "aboutMe", "joinedAt") SELECT "id", "userId", "communityId", "displayName", "aboutMe", "joinedAt" FROM `communityMembers`;--> statement-breakpoint
DROP TABLE `communityMembers`;--> statement-breakpoint
ALTER TABLE `__new_communityMembers` RENAME TO `communityMembers`;--> statement-breakpoint
CREATE TABLE `__new_channels` (
	`id` text PRIMARY KEY DEFAULT 'gPh1hODU27VWlisbZL-iw' NOT NULL,
	`communityId` text NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`type` text DEFAULT 'text' NOT NULL,
	`createdAt` integer DEFAULT 1741727076 NOT NULL,
	`createdBy` integer NOT NULL,
	`isPrivate` integer DEFAULT false NOT NULL,
	`parentChannelId` text,
	FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_channels`("id", "communityId", "name", "description", "type", "createdAt", "createdBy", "isPrivate", "parentChannelId") SELECT "id", "communityId", "name", "description", "type", "createdAt", "createdBy", "isPrivate", "parentChannelId" FROM `channels`;--> statement-breakpoint
DROP TABLE `channels`;--> statement-breakpoint
ALTER TABLE `__new_channels` RENAME TO `channels`;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text PRIMARY KEY DEFAULT 'Q0plqE3fah-1TPMS1zfLq' NOT NULL,
	`channelId` text NOT NULL,
	`userId` integer NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT 1741727076 NOT NULL,
	`updatedAt` integer,
	`isDeleted` integer DEFAULT false NOT NULL,
	`isEdited` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "channelId", "userId", "content", "createdAt", "updatedAt", "isDeleted", "isEdited") SELECT "id", "channelId", "userId", "content", "createdAt", "updatedAt", "isDeleted", "isEdited" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
CREATE TABLE `__new_federatedActivities` (
	`id` text PRIMARY KEY DEFAULT 'Q_EZCpMBTfLg_xemCHctq' NOT NULL,
	`messageId` text,
	`activityId` text NOT NULL,
	`activityType` text NOT NULL,
	`actorId` text,
	`object` text NOT NULL,
	`published` integer DEFAULT 1741727076 NOT NULL,
	`isLocal` integer NOT NULL,
	FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actorId`) REFERENCES `federatedActors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_federatedActivities`("id", "messageId", "activityId", "activityType", "actorId", "object", "published", "isLocal") SELECT "id", "messageId", "activityId", "activityType", "actorId", "object", "published", "isLocal" FROM `federatedActivities`;--> statement-breakpoint
DROP TABLE `federatedActivities`;--> statement-breakpoint
ALTER TABLE `__new_federatedActivities` RENAME TO `federatedActivities`;--> statement-breakpoint
CREATE UNIQUE INDEX `federatedActivities_activityId_unique` ON `federatedActivities` (`activityId`);--> statement-breakpoint
CREATE TABLE `__new_federatedActors` (
	`id` text PRIMARY KEY DEFAULT '8QcnVDOr9iwNUJ7JiVD6V' NOT NULL,
	`userId` integer,
	`communityId` text,
	`actorType` text NOT NULL,
	`actorUrl` text NOT NULL,
	`inbox` text NOT NULL,
	`outbox` text NOT NULL,
	`followers` text NOT NULL,
	`following` text NOT NULL,
	`publicKey` text,
	`privateKey` text,
	`sharedInbox` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_federatedActors`("id", "userId", "communityId", "actorType", "actorUrl", "inbox", "outbox", "followers", "following", "publicKey", "privateKey", "sharedInbox") SELECT "id", "userId", "communityId", "actorType", "actorUrl", "inbox", "outbox", "followers", "following", "publicKey", "privateKey", "sharedInbox" FROM `federatedActors`;--> statement-breakpoint
DROP TABLE `federatedActors`;--> statement-breakpoint
ALTER TABLE `__new_federatedActors` RENAME TO `federatedActors`;--> statement-breakpoint
CREATE UNIQUE INDEX `federatedActors_actorUrl_unique` ON `federatedActors` (`actorUrl`);--> statement-breakpoint
CREATE TABLE `__new_federatedFollows` (
	`id` text PRIMARY KEY DEFAULT 'mZlTgMxVdcjDmgM1HWjld' NOT NULL,
	`followerId` text NOT NULL,
	`followedId` text NOT NULL,
	`accepted` integer DEFAULT false,
	`createdAt` integer DEFAULT 1741727076 NOT NULL,
	FOREIGN KEY (`followerId`) REFERENCES `federatedActors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`followedId`) REFERENCES `federatedActors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_federatedFollows`("id", "followerId", "followedId", "accepted", "createdAt") SELECT "id", "followerId", "followedId", "accepted", "createdAt" FROM `federatedFollows`;--> statement-breakpoint
DROP TABLE `federatedFollows`;--> statement-breakpoint
ALTER TABLE `__new_federatedFollows` RENAME TO `federatedFollows`;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;