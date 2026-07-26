PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_black_sun_scores` (
	`user_id` text NOT NULL,
	`guild_id` text NOT NULL,
	`session_number` integer NOT NULL,
	`event_role` text,
	`points` integer DEFAULT 0 NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`user_id`, `session_number`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_black_sun_scores`("user_id", "guild_id", "session_number", "event_role", "points", "updated_at") SELECT "user_id", "guild_id", 1, NULL, "points", "updated_at" FROM `black_sun_scores`;--> statement-breakpoint
DROP TABLE `black_sun_scores`;--> statement-breakpoint
ALTER TABLE `__new_black_sun_scores` RENAME TO `black_sun_scores`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `black_sun_scores_guild_points_idx` ON `black_sun_scores` (`guild_id`,`session_number`,`points`);--> statement-breakpoint
CREATE TABLE `__new_vengeful_souls_scores` (
	`user_id` text NOT NULL,
	`guild_id` text NOT NULL,
	`session_number` integer NOT NULL,
	`event_role` text,
	`points` integer DEFAULT 0 NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`user_id`, `session_number`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_vengeful_souls_scores`("user_id", "guild_id", "session_number", "event_role", "points", "updated_at") SELECT "user_id", "guild_id", 1, NULL, "points", "updated_at" FROM `vengeful_souls_scores`;--> statement-breakpoint
DROP TABLE `vengeful_souls_scores`;--> statement-breakpoint
ALTER TABLE `__new_vengeful_souls_scores` RENAME TO `vengeful_souls_scores`;--> statement-breakpoint
CREATE INDEX `vengeful_souls_scores_guild_points_idx` ON `vengeful_souls_scores` (`guild_id`,`session_number`,`points`);
