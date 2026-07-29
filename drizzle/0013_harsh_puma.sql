CREATE TABLE `user_build_skill_settings` (
	`skill_id` text NOT NULL,
	`user_id` text NOT NULL,
	`combo_enabled` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`skill_id`, `user_id`),
	FOREIGN KEY (`skill_id`) REFERENCES `build_skills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_build_skill_settings_user_idx` ON `user_build_skill_settings` (`user_id`);--> statement-breakpoint
ALTER TABLE `build_skills` ADD `combo_available` integer DEFAULT false NOT NULL;