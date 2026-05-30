CREATE TABLE `memory_entry` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`session_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`tier` text NOT NULL,
	`content` text NOT NULL,
	`tags` text NOT NULL DEFAULT '[]',
	`relevance_score` integer NOT NULL DEFAULT 50,
	`access_count` integer NOT NULL DEFAULT 0,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL,
	CONSTRAINT `fk_memory_entry_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `memory_entry_project_idx` ON `memory_entry` (`project_id`);
--> statement-breakpoint
CREATE INDEX `memory_entry_tier_idx` ON `memory_entry` (`tier`);
--> statement-breakpoint
CREATE INDEX `memory_entry_agent_idx` ON `memory_entry` (`agent_id`);
--> statement-breakpoint
CREATE INDEX `memory_entry_project_tier_idx` ON `memory_entry` (`project_id`, `tier`);
