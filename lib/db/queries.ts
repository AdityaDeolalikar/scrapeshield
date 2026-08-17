import { desc, eq } from "drizzle-orm";

import { db } from "./client";
import { scraperRuns, scrapers } from "./schema";

/**
 * Get all active scrapers.
 */
export async function getScrapers() {
  return db
    .select()
    .from(scrapers)
    .where(eq(scrapers.isActive, true))
    .orderBy(desc(scrapers.createdAt));
}

/**
 * Get a single scraper by ID.
 */
export async function getScraperById(id: string) {
  const result = await db
    .select()
    .from(scrapers)
    .where(eq(scrapers.id, id))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create a new scraper.
 */
export async function createScraper(input: {
  name: string;
  url: string;
  description?: string;
}) {
  const result = await db
    .insert(scrapers)
    .values({
      name: input.name,
      url: input.url,
      description: input.description,
    })
    .returning();

  return result[0];
}

/**
 * Create a new scraper run.
 *
 * A run starts in the "running" state.
 */
export async function createScraperRun(scraperId: string) {
  const result = await db
    .insert(scraperRuns)
    .values({
      scraperId,
      status: "running",
      recordsFound: 0,
    })
    .returning();

  return result[0];
}

/**
 * Get all runs for a scraper.
 */
export async function getScraperRuns(scraperId: string) {
  return db
    .select()
    .from(scraperRuns)
    .where(eq(scraperRuns.scraperId, scraperId))
    .orderBy(desc(scraperRuns.startedAt));
}

/**
 * Get a single run.
 */
export async function getScraperRunById(id: string) {
  const result = await db
    .select()
    .from(scraperRuns)
    .where(eq(scraperRuns.id, id))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Mark a run as successful.
 */
export async function completeScraperRun(
  runId: string,
  input: {
    recordsFound: number;
    durationMs: number;
    output?: unknown;
  },
) {
  const result = await db
    .update(scraperRuns)
    .set({
      status: "success",
      recordsFound: input.recordsFound,
      durationMs: input.durationMs,
      output: input.output,
      completedAt: new Date(),
    })
    .where(eq(scraperRuns.id, runId))
    .returning();

  return result[0] ?? null;
}

/**
 * Mark a run as failed.
 */
export async function failScraperRun(
  runId: string,
  input: {
    error: string;
    durationMs: number;
  },
) {
  const result = await db
    .update(scraperRuns)
    .set({
      status: "failed",
      error: input.error,
      durationMs: input.durationMs,
      completedAt: new Date(),
    })
    .where(eq(scraperRuns.id, runId))
    .returning();

  return result[0] ?? null;
}


export async function attachBrightDataCollection(
  runId: string,
  collectionId: string,
) {
  const result = await db
    .update(scraperRuns)
    .set({
      brightDataCollectionId: collectionId,
    })
    .where(eq(scraperRuns.id, runId))
    .returning();

  return result[0] ?? null;
}