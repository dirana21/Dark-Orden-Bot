CREATE TABLE `guild_planner_task_completions` (
	`task_id` text NOT NULL,
	`user_id` text NOT NULL,
	`completion_period` text NOT NULL,
	`completed_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`task_id`, `user_id`),
	FOREIGN KEY (`task_id`) REFERENCES `guild_planner_tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `guild_planner_task_completions_user_idx` ON `guild_planner_task_completions` (`user_id`,`completion_period`);--> statement-breakpoint
CREATE TABLE `guild_planner_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `guild_planner_tasks_guild_kind_idx` ON `guild_planner_tasks` (`guild_id`,`kind`,`created_at`);