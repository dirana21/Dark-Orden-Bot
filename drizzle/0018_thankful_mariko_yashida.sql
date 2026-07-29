CREATE TABLE `user_build_loadouts` (
	`user_id` text NOT NULL,
	`character` text NOT NULL,
	`slots_json` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `character`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_build_loadouts_user_idx` ON `user_build_loadouts` (`user_id`);