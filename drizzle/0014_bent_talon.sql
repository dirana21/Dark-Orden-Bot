ALTER TABLE `build_skills` ADD `slot_type` text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `build_skills` ADD `slot_index` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY guild_id, character
           ORDER BY created_at, id
         ) AS position
  FROM build_skills
  WHERE slot_index = 0
)
UPDATE build_skills
SET slot_index = (
  SELECT position FROM ranked WHERE ranked.id = build_skills.id
)
WHERE slot_index = 0;--> statement-breakpoint
CREATE UNIQUE INDEX `build_skills_guild_character_slot_idx` ON `build_skills` (`guild_id`,`character`,`slot_type`,`slot_index`);
