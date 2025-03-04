CREATE TABLE `channels` (
	`id` text PRIMARY KEY DEFAULT 'VOs60qres7o-7gQ03q_zz' NOT NULL,
	`communityId` text NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`type` text DEFAULT 'text' NOT NULL,
	`createdAt` integer DEFAULT 1741130585 NOT NULL,
	`createdBy` integer NOT NULL,
	`isPrivate` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `communities` (
	`id` text PRIMARY KEY DEFAULT '6r9WqVUsgZdyrwDvXtjlv' NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`icon` text,
	`createdAt` integer DEFAULT 1741130585 NOT NULL,
	`createdBy` integer NOT NULL,
	`isPublic` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `communityMembers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`communityId` text NOT NULL,
	`displayName` text(100),
	`aboutMe` text(500),
	`joinedAt` integer DEFAULT 1741130585 NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY DEFAULT '7NDxcVTNYwdgOutljsoU3' NOT NULL,
	`channelId` text NOT NULL,
	`userId` integer NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT 1741130585 NOT NULL,
	`updatedAt` integer,
	`isDeleted` integer DEFAULT false NOT NULL,
	`isEdited` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT 1741130585 NOT NULL,
	`userAgent` text,
	`ipAddress` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "userId", "expiresAt", "createdAt", "userAgent", "ipAddress") SELECT "id", "userId", "expiresAt", "createdAt", "userAgent", "ipAddress" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `users` ADD `aboutMe` text(500);