CREATE TABLE `vengeful_souls_scores` (
	`user_id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `vengeful_souls_scores_guild_points_idx` ON `vengeful_souls_scores` (`guild_id`,`points`);