PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_build_loadouts` (
	`user_id` text NOT NULL,
	`character` text NOT NULL,
	`setup_type` text DEFAULT 'pvp' NOT NULL,
	`slots_json` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `character`, `setup_type`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_build_loadouts`("user_id", "character", "setup_type", "slots_json", "updated_at") SELECT "user_id", "character", 'pvp', "slots_json", "updated_at" FROM `user_build_loadouts`;--> statement-breakpoint
DROP TABLE `user_build_loadouts`;--> statement-breakpoint
ALTER TABLE `__new_user_build_loadouts` RENAME TO `user_build_loadouts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `user_build_loadouts_user_idx` ON `user_build_loadouts` (`user_id`);
