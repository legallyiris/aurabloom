CREATE TABLE `federatedActivities` (
	`id` text PRIMARY KEY DEFAULT 'fyXW3KSx49TCWk-QJeaPS' NOT NULL,
	`messageId` text,
	`activityId` text NOT NULL,
	`activityType` text NOT NULL,
	`actorId` text,
	`object` text NOT NULL,
	`published` integer DEFAULT 1741395552 NOT NULL,
	`isLocal` integer NOT NULL,
	FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actorId`) REFERENCES `federatedActors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `federatedActivities_activityId_unique` ON `federatedActivities` (`activityId`);--> statement-breakpoint
CREATE TABLE `federatedActors` (
	`id` text PRIMARY KEY DEFAULT 'raLv8cTMctF4FVPGhw93K' NOT NULL,
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
CREATE UNIQUE INDEX `federatedActors_actorUrl_unique` ON `federatedActors` (`actorUrl`);--> statement-breakpoint
CREATE TABLE `federatedFollows` (
	`id` text PRIMARY KEY DEFAULT 'sjfHITAx_I3n2GqeEXDWu' NOT NULL,
	`followerId` text NOT NULL,
	`followedId` text NOT NULL,
	`accepted` integer DEFAULT false,
	`createdAt` integer DEFAULT 1741395552 NOT NULL,
	FOREIGN KEY (`followerId`) REFERENCES `federatedActors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`followedId`) REFERENCES `federatedActors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT 1741395552 NOT NULL,
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
	`id` text PRIMARY KEY DEFAULT '6r_w_JBHzWWbzgJTlYbXK' NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`icon` text,
	`createdAt` integer DEFAULT 1741395552 NOT NULL,
	`createdBy` integer NOT NULL,
	`isPublic` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_communities`("id", "name", "description", "icon", "createdAt", "createdBy", "isPublic") SELECT "id", "name", "description", "icon", "createdAt", "createdBy", "isPublic" FROM `communities`;--> statement-breakpoint
DROP TABLE `communities`;--> statement-breakpoint
ALTER TABLE `__new_communities` RENAME TO `communities`;--> statement-breakpoint
CREATE TABLE `__new_communityMembers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`communityId` text NOT NULL,
	`displayName` text(100),
	`aboutMe` text(500),
	`joinedAt` integer DEFAULT 1741395552 NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_communityMembers`("id", "userId", "communityId", "displayName", "aboutMe", "joinedAt") SELECT "id", "userId", "communityId", "displayName", "aboutMe", "joinedAt" FROM `communityMembers`;--> statement-breakpoint
DROP TABLE `communityMembers`;--> statement-breakpoint
ALTER TABLE `__new_communityMembers` RENAME TO `communityMembers`;--> statement-breakpoint
CREATE TABLE `__new_channels` (
	`id` text PRIMARY KEY DEFAULT '9mwEs6IE_c6kJ522MuueJ' NOT NULL,
	`communityId` text NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`type` text DEFAULT 'text' NOT NULL,
	`createdAt` integer DEFAULT 1741395552 NOT NULL,
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
	`id` text PRIMARY KEY DEFAULT 'cbNEOI0g7TMhPtUoj9CZn' NOT NULL,
	`channelId` text NOT NULL,
	`userId` integer NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT 1741395552 NOT NULL,
	`updatedAt` integer,
	`isDeleted` integer DEFAULT false NOT NULL,
	`isEdited` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "channelId", "userId", "content", "createdAt", "updatedAt", "isDeleted", "isEdited") SELECT "id", "channelId", "userId", "content", "createdAt", "updatedAt", "isDeleted", "isEdited" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;