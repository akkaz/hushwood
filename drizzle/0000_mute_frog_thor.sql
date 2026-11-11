CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`mascot` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `class_school` ON `classes` (`school_id`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`class_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`quiet_seconds` integer DEFAULT 0 NOT NULL,
	`measured_seconds` integer DEFAULT 0 NOT NULL,
	`best_streak` integer DEFAULT 0 NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "lesson_status" CHECK("lessons"."status" IN ('active', 'finished', 'expired')),
	CONSTRAINT "lesson_counters" CHECK("lessons"."quiet_seconds" >= 0 AND "lessons"."measured_seconds" >= "lessons"."quiet_seconds" AND "lessons"."best_streak" >= 0 AND "lessons"."best_streak" <= "lessons"."quiet_seconds" AND "lessons"."xp" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `active_class` ON `lessons` (`class_id`) WHERE "lessons"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX `active_teacher` ON `lessons` (`user_id`) WHERE "lessons"."status" = 'active';--> statement-breakpoint
CREATE INDEX `lesson_school` ON `lessons` (`school_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`school_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`school_id`, `user_id`),
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `member_user` ON `members` (`user_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`domain` text DEFAULT '' NOT NULL,
	`invite_code` text NOT NULL,
	`cup` text NOT NULL,
	`rewards` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `school_invite` ON `schools` (`invite_code`);