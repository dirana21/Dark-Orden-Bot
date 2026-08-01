CREATE TABLE `build_skill_slot_icons` (
	`guild_id` text NOT NULL,
	`character` text NOT NULL,
	`slot_type` text NOT NULL,
	`slot_index` integer NOT NULL,
	`icon_key` text NOT NULL,
	`icon_content_type` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`guild_id`, `character`, `slot_type`, `slot_index`),
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
