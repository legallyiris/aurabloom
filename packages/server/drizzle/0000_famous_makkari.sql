CREATE TABLE `channels` (
	`id` text PRIMARY KEY DEFAULT 'PMrVgck74p5oAX8iLOUtu' NOT NULL,
	`communityId` text NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`type` text DEFAULT 'text' NOT NULL,
	`createdAt` integer DEFAULT 1741297811 NOT NULL,
	`createdBy` integer NOT NULL,
	`isPrivate` integer DEFAULT false NOT NULL,
	`parentChannelId` text,
	FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `communities` (
	`id` text PRIMARY KEY DEFAULT 'ItYuj9mEBPflEAolMg0Zd' NOT NULL,
	`name` text(100) NOT NULL,
	`description` text(500),
	`icon` text,
	`createdAt` integer DEFAULT 1741297811 NOT NULL,
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
	`joinedAt` integer DEFAULT 1741297811 NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`communityId`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY DEFAULT 'bpgKL88hXvrvnnw6CbYcc' NOT NULL,
	`channelId` text NOT NULL,
	`userId` integer NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT 1741297811 NOT NULL,
	`updatedAt` integer,
	`isDeleted` integer DEFAULT false NOT NULL,
	`isEdited` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT 1741297811 NOT NULL,
	`userAgent` text,
	`ipAddress` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(48) NOT NULL,
	`displayName` text(48) NOT NULL,
	`aboutMe` text(500),
	`password` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);