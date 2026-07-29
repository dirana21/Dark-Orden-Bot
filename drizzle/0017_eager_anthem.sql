CREATE TABLE `build_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`name` text NOT NULL,
	`image_key` text,
	`image_content_type` text,
	`created_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `build_characters_guild_name_idx` ON `build_characters` (`guild_id`,`name`);--> statement-breakpoint
CREATE INDEX `build_characters_guild_created_idx` ON `build_characters` (`guild_id`,`created_at`);