CREATE TABLE `user_build_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`main_character` text,
	`mirror_character` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
