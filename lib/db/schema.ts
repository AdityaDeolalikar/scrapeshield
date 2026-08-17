import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

/**
 * Scrapers
 *
 * Represents a configured web scraper in ScrapeShield.
 */
export const scrapers = pgTable("scrapers", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  url: text("url").notNull(),

  description: text("description"),

  status: text("status")
    .$type<"healthy" | "warning" | "failed" | "healing">()
    .notNull()
    .default("healthy"),

  healthScore: real("health_score").notNull().default(100),

  successRate: real("success_rate").notNull().default(100),

  currentVersion: text("current_version").notNull().default("v1.0"),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

/**
 * Scraper runs
 *
 * Every time a scraper executes, we store a record here.
 */
export const scraperRuns = pgTable("scraper_runs", {
  id: uuid("id").defaultRandom().primaryKey(),

  scraperId: uuid("scraper_id")
    .notNull()
    .references(() => scrapers.id, {
      onDelete: "cascade",
    }),

  brightDataCollectionId: text(
    "bright_data_collection_id",
  ),

  status: text("status")
    .$type<"running" | "success" | "failed" | "healing">()
    .notNull()
    .default("running"),

  recordsFound: integer("records_found").notNull().default(0),

  durationMs: integer("duration_ms"),

  error: text("error"),

  output: jsonb("output"),

  startedAt: timestamp("started_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  completedAt: timestamp("completed_at", {
    withTimezone: true,
  }),


});

/**
 * Scraper failures
 *
 * Stores why a scraper failed.
 */
export const failures = pgTable("failures", {
  id: uuid("id").defaultRandom().primaryKey(),

  scraperId: uuid("scraper_id")
    .notNull()
    .references(() => scrapers.id, {
      onDelete: "cascade",
    }),

  runId: uuid("run_id")
    .notNull()
    .references(() => scraperRuns.id, {
      onDelete: "cascade",
    }),

  type: text("type")
    .$type<
      | "selector_missing"
      | "empty_result"
      | "schema_invalid"
      | "data_changed"
      | "page_structure_changed"
      | "unknown"
    >()
    .notNull(),

  message: text("message").notNull(),

  oldSelector: text("old_selector"),

  expectedRecords: integer("expected_records"),

  actualRecords: integer("actual_records"),

  detectedAt: timestamp("detected_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

/**
 * Scraper repairs
 *
 * Stores every attempted self-healing operation.
 */
export const repairs = pgTable("repairs", {
  id: uuid("id").defaultRandom().primaryKey(),

  scraperId: uuid("scraper_id")
    .notNull()
    .references(() => scrapers.id, {
      onDelete: "cascade",
    }),

  runId: uuid("run_id")
    .notNull()
    .references(() => scraperRuns.id, {
      onDelete: "cascade",
    }),

  failureId: uuid("failure_id")
    .notNull()
    .references(() => failures.id, {
      onDelete: "cascade",
    }),

  status: text("status")
    .$type<
      | "detected"
      | "analyzing"
      | "testing"
      | "approved"
      | "rejected"
      | "failed"
    >()
    .notNull()
    .default("detected"),

  oldSelector: text("old_selector").notNull(),

  newSelector: text("new_selector"),

  confidence: real("confidence"),

  reason: text("reason"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  completedAt: timestamp("completed_at", {
    withTimezone: true,
  }),
});

/**
 * Scraper versions
 *
 * Every successful repair can create a new scraper version.
 */
export const scraperVersions = pgTable("scraper_versions", {
  id: uuid("id").defaultRandom().primaryKey(),

  scraperId: uuid("scraper_id")
    .notNull()
    .references(() => scrapers.id, {
      onDelete: "cascade",
    }),

  version: text("version").notNull(),

  selectors: jsonb("selectors").notNull(),

  schema: jsonb("schema").notNull(),

  isActive: boolean("is_active").notNull().default(false),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

/**
 * Relations
 */

export const scrapersRelations = relations(
  scrapers,
  ({ many }) => ({
    runs: many(scraperRuns),
    failures: many(failures),
    repairs: many(repairs),
    versions: many(scraperVersions),
  }),
);

export const scraperRunsRelations = relations(
  scraperRuns,
  ({ one, many }) => ({
    scraper: one(scrapers, {
      fields: [scraperRuns.scraperId],
      references: [scrapers.id],
    }),

    failures: many(failures),
    repairs: many(repairs),
  }),
);

export const failuresRelations = relations(
  failures,
  ({ one, many }) => ({
    scraper: one(scrapers, {
      fields: [failures.scraperId],
      references: [scrapers.id],
    }),

    run: one(scraperRuns, {
      fields: [failures.runId],
      references: [scraperRuns.id],
    }),

    repairs: many(repairs),
  }),
);

export const repairsRelations = relations(
  repairs,
  ({ one }) => ({
    scraper: one(scrapers, {
      fields: [repairs.scraperId],
      references: [scrapers.id],
    }),

    run: one(scraperRuns, {
      fields: [repairs.runId],
      references: [scraperRuns.id],
    }),

    failure: one(failures, {
      fields: [repairs.failureId],
      references: [failures.id],
    }),
  }),
);

export const scraperVersionsRelations = relations(
  scraperVersions,
  ({ one }) => ({
    scraper: one(scrapers, {
      fields: [scraperVersions.scraperId],
      references: [scrapers.id],
    }),
  }),
);