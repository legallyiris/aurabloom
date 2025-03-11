PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_channels` (
	`id` text PRIMARY KEY DEFAULT 'bCjb2sbRVrhNZ1bRR2B6l' NOT NULL,
	`communityId` text NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`type` text DEFAULT 'text' NOT NULL,
	`createdAt` integer DEFAULT 1741393375 NOT NULL,
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
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_communities` (
	`id` text PRIMARY KEY DEFAULT 'JL-KOxIy-90O_QDH4TeEi' NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`icon` text,
	`createdAt` integer DEFAULT 1741393375 NOT NULL,
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
	`joinedAt` integer DEFAULT 1741393375 NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_communityMembers`("id", "userId", "communityId", "displayName", "aboutMe", "joinedAt") SELECT "id", "userId", "communityId", "displayName", "aboutMe", "joinedAt" FROM `communityMembers`;--> statement-breakpoint
DROP TABLE `communityMembers`;--> statement-breakpoint
ALTER TABLE `__new_communityMembers` RENAME TO `communityMembers`;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text PRIMARY KEY DEFAULT 'gTCVbeECXH8yIp4BL9ia2' NOT NULL,
	`channelId` text NOT NULL,
	`userId` integer NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT 1741393375 NOT NULL,
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
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT 1741393375 NOT NULL,
	`userAgent` text,
	`ipAddress` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "userId", "expiresAt", "createdAt", "userAgent", "ipAddress") SELECT "id", "userId", "expiresAt", "createdAt", "userAgent", "ipAddress" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;