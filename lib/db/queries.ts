import { desc, eq } from "drizzle-orm";

import { db } from "./client";
import { scrapers } from "./schema";

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