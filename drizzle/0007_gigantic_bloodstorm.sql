ALTER TABLE `users` ADD `discord_user_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_username` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_display_name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_avatar_hash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `discord_connected_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_user_id_unique` ON `users` (`discord_user_id`);