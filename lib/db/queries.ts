import { desc, eq, and } from "drizzle-orm";

import { db } from "./client";
// import { scraperRuns, scrapers, failures } from "./schema";
import {
  failures,
  repairs,
  scraperRuns,
  scraperVersions,
  scrapers,
} from "./schema";

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

export async function updateScraper(
  id: string,
  input: {
    name?: string;
    url?: string;
    collectorId?: string;
    description?: string;
  },
) {
  const result = await db
    .update(scrapers)
    .set({
      ...(input.name !== undefined && {
        name: input.name,
      }),

      ...(input.url !== undefined && {
        url: input.url,
      }),

      ...(input.collectorId !== undefined && {
        collectorId: input.collectorId,
      }),

      ...(input.description !== undefined && {
        description: input.description,
      }),

      updatedAt: new Date(),
    })
    .where(eq(scrapers.id, id))
    .returning();

  return result[0] ?? null;
}

/**
 * Create a new scraper.
 */
export async function createScraper(input: {
  name: string;
  url: string;
  collectorId? :string;
  description?: string;
}) {
  const result = await db
    .insert(scrapers)
    .values({
      name: input.name,
      url: input.url,
      collectorId: input.collectorId,
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


export async function setRunCollecting(
  runId: string,
) {
  const result = await db
    .update(scraperRuns)
    .set({
      status: "collecting",
    })
    .where(eq(scraperRuns.id, runId))
    .returning();

  return result[0] ?? null;
}

/**
 * Attach Bright Data collection to a scraper run.
 */
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


/**
 * Create a scraper failure record.
 *
 * A failure represents a problem detected during
 * validation of a scraper run.
 */
export async function createFailure(input: {
  scraperId: string;
  runId: string;
  type:
    | "selector_missing"
    | "empty_result"
    | "schema_invalid"
    | "data_changed"
    | "page_structure_changed"
    | "unknown";
  message: string;
  oldSelector?: string;
  expectedRecords?: number;
  actualRecords?: number;
}) {
  const result = await db
    .insert(failures)
    .values({
      scraperId: input.scraperId,
      runId: input.runId,
      type: input.type,
      message: input.message,
      oldSelector: input.oldSelector,
      expectedRecords:
        input.expectedRecords,
      actualRecords:
        input.actualRecords,
    })
    .returning();

  return result[0] ?? null;
}

// export async function getFailureById(
//   id: string,
// ) {
//   const result = await db
//     .select()
//     .from(failures)
//     .where(eq(failures.id, id))
//     .limit(1);

//   return result[0] ?? null;
// }

/**
 * Get a failure by ID.
 */
export async function getFailureById(
  id: string,
) {
  const result = await db
    .select()
    .from(failures)
    .where(eq(failures.id, id))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create a repair attempt.
 */
export async function createRepair(input: {
  scraperId: string;
  runId: string;
  failureId: string;
  oldSelector: string;
  newSelector: string;
  confidence: number;
  reason: string;
}) {
  const result = await db
    .insert(repairs)
    .values({
      scraperId: input.scraperId,
      runId: input.runId,
      failureId: input.failureId,

      status: "detected",

      oldSelector:
        input.oldSelector,

      newSelector:
        input.newSelector,

      confidence:
        input.confidence,

      reason:
        input.reason,
    })
    .returning();

  return result[0] ?? null;
}

/**
 * Get a repair by ID.
 */
export async function getRepairById(
  id: string,
) {
  const result = await db
    .select()
    .from(repairs)
    .where(eq(repairs.id, id))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Approve a repair.
 */
export async function approveRepair(
  repairId: string,
) {
  const result = await db
    .update(repairs)
    .set({
      status: "approved",
      completedAt: new Date(),
    })
    .where(eq(repairs.id, repairId))
    .returning();

  return result[0] ?? null;
}

/**
 * Reject a repair.
 */
export async function rejectRepair(
  repairId: string,
) {
  const result = await db
    .update(repairs)
    .set({
      status: "rejected",
      completedAt: new Date(),
    })
    .where(eq(repairs.id, repairId))
    .returning();

  return result[0] ?? null;
}

/**
 * Create a new scraper version.
 */
export async function createScraperVersion(
  input: {
    scraperId: string;
    version: string;
    selectors: unknown;
    schema: unknown;
    isActive?: boolean;
  },
) {
  const result = await db
    .insert(scraperVersions)
    .values({
      scraperId: input.scraperId,

      version:
        input.version,

      selectors:
        input.selectors,

      schema:
        input.schema,

      isActive:
        input.isActive ?? false,
    })
    .returning();

  return result[0] ?? null;
}

/**
 * Activate a scraper version.
 *
 * Only one version should be active at a time.
 */
// export async function activateScraperVersion(
//   scraperId: string,
//   versionId: string,
// ) {
//   await db
//     .update(scraperVersions)
//     .set({
//       isActive: false,
//     })
//     .where(
//       eq(
//         scraperVersions.scraperId,
//         scraperId,
//       ),
//     );

//   const result = await db
//     .update(scraperVersions)
//     .set({
//       isActive: true,
//     })
//     .where(
//       eq(
//         scraperVersions.id,
//         versionId,
//       ),
//     )
//     .returning();

//   return result[0] ?? null;
// }


/**
 * Activate one scraper version and deactivate
 * all other versions for the same scraper.
 */
export async function activateScraperVersion(
  scraperId: string,
  versionId: string,
) {
  return db.transaction(async (tx) => {
    await tx
      .update(scraperVersions)
      .set({
        isActive: false,
      })
      .where(
        eq(
          scraperVersions.scraperId,
          scraperId,
        ),
      );

    const result = await tx
      .update(scraperVersions)
      .set({
        isActive: true,
      })
      .where(
        eq(scraperVersions.id, versionId),
      )
      .returning();

    return result[0] ?? null;
  });
}

/**
 * Get the currently active scraper version.
 */
// export async function getActiveScraperVersion(
//   scraperId: string,
// ) {
//   const result = await db
//     .select()
//     .from(scraperVersions)
//     .where(
//       eq(
//         scraperVersions.scraperId,
//         scraperId,
//       ),
//     )
//     .limit(1);

//   return result[0] ?? null;
// }

export async function getActiveScraperVersion(
  scraperId: string,
) {
  const result = await db
    .select()
    .from(scraperVersions)
    .where(
      and(
        eq(
          scraperVersions.scraperId,
          scraperId,
        ),
        eq(
          scraperVersions.isActive,
          true,
        ),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}


/**
 * Get the latest version of a scraper.
 */
export async function getLatestScraperVersion(
  scraperId: string,
) {
  const result = await db
    .select()
    .from(scraperVersions)
    .where(
      eq(
        scraperVersions.scraperId,
        scraperId,
      ),
    )
    .orderBy(
      desc(scraperVersions.createdAt),
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Update the current version of a scraper.
 */
// export async function updateScraperVersion(
//   scraperId: string,
//   version: string,
// ) {
//   const result = await db
//     .update(scrapers)
//     .set({
//       currentVersion: version,
//       updatedAt: new Date(),
//     })
//     .where(eq(scrapers.id, scraperId))
//     .returning();

//   return result[0] ?? null;
// }

/**
 * Update the current version of a scraper.
 */
export async function updateScraperVersion(
  scraperId: string,
  version: string,
) {
  const result = await db
    .update(scrapers)
    .set({
      currentVersion: version,
      updatedAt: new Date(),
    })
    .where(eq(scrapers.id, scraperId))
    .returning();

  return result[0] ?? null;
}

/**
 * Get a scraper version by ID.
 */
export async function getScraperVersionById(
  id: string,
) {
  const result = await db
    .select()
    .from(scraperVersions)
    .where(eq(scraperVersions.id, id))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Roll back a scraper to a previous version.
 */
export async function rollbackScraper(
  scraperId: string,
  previousVersion: string,
) {
  return db.transaction(async (tx) => {
    await tx
      .update(scraperVersions)
      .set({
        isActive: false,
      })
      .where(
        eq(
          scraperVersions.scraperId,
          scraperId,
        ),
      );

    const previous = await tx
      .select()
      .from(scraperVersions)
      .where(
        and(
          eq(
            scraperVersions.scraperId,
            scraperId,
          ),
          eq(
            scraperVersions.version,
            previousVersion,
          ),
        ),
      )
      .limit(1);

    if (!previous[0]) {
      throw new Error(
        `Previous scraper version ${previousVersion} was not found`,
      );
    }

    await tx
      .update(scraperVersions)
      .set({
        isActive: true,
      })
      .where(
        eq(
          scraperVersions.id,
          previous[0].id,
        ),
      );

    const scraper = await tx
      .update(scrapers)
      .set({
        currentVersion: previousVersion,
        status: "healthy",
        updatedAt: new Date(),
      })
      .where(eq(scrapers.id, scraperId))
      .returning();

    return {
      version: previous[0],
      scraper: scraper[0] ?? null,
    };
  });
}

// export async function getFailuresByRunId(
//   runId: string,
// ) {
//   return db
//     .select()
//     .from(failures)
//     .where(
//       eq(failures.runId, runId),
//     )
//     .orderBy(
//       desc(failures.detectedAt),
//     );
// }


export async function getLatestFailureForRun(
  runId: string,
) {
  const result = await db
    .select()
    .from(failures)
    .where(
      eq(failures.runId, runId),
    )
    .orderBy(
      desc(failures.detectedAt),
    )
    .limit(1);

  return result[0] ?? null;
}

export async function getFailureByRunId(
  runId: string,
) {
  const result = await db
    .select()
    .from(failures)
    .where(
      eq(
        failures.runId,
        runId,
      ),
    )
    .orderBy(
      desc(
        failures.detectedAt,
      ),
    )
    .limit(1);

  return result[0] ?? null;
}