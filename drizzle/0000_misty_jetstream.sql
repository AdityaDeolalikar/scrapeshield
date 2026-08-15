CREATE TABLE "failures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scraper_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"old_selector" text,
	"expected_records" integer,
	"actual_records" integer,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scraper_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"failure_id" uuid NOT NULL,
	"status" text DEFAULT 'detected' NOT NULL,
	"old_selector" text NOT NULL,
	"new_selector" text,
	"confidence" real,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scraper_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scraper_id" uuid NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"records_found" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"error" text,
	"output" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scraper_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scraper_id" uuid NOT NULL,
	"version" text NOT NULL,
	"selectors" jsonb NOT NULL,
	"schema" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrapers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'healthy' NOT NULL,
	"health_score" real DEFAULT 100 NOT NULL,
	"success_rate" real DEFAULT 100 NOT NULL,
	"current_version" text DEFAULT 'v1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "failures" ADD CONSTRAINT "failures_scraper_id_scrapers_id_fk" FOREIGN KEY ("scraper_id") REFERENCES "public"."scrapers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failures" ADD CONSTRAINT "failures_run_id_scraper_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."scraper_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_scraper_id_scrapers_id_fk" FOREIGN KEY ("scraper_id") REFERENCES "public"."scrapers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_run_id_scraper_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."scraper_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_failure_id_failures_id_fk" FOREIGN KEY ("failure_id") REFERENCES "public"."failures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraper_runs" ADD CONSTRAINT "scraper_runs_scraper_id_scrapers_id_fk" FOREIGN KEY ("scraper_id") REFERENCES "public"."scrapers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraper_versions" ADD CONSTRAINT "scraper_versions_scraper_id_scrapers_id_fk" FOREIGN KEY ("scraper_id") REFERENCES "public"."scrapers"("id") ON DELETE cascade ON UPDATE no action;