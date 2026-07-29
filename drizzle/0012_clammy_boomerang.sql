CREATE TABLE `build_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`character` text NOT NULL,
	`name` text NOT NULL,
	`description_html` text NOT NULL,
	`icon_key` text NOT NULL,
	`icon_content_type` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `build_skills_guild_character_idx` ON `build_skills` (`guild_id`,`character`,`created_at`);