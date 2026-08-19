import * as cheerio from "cheerio";

import {
  getActiveScraperVersion,
  getRepairById,
  getScraperById,
  rollbackScraper,
  updateScraperVersion,
} from "@/lib/db/queries";

interface SelectorMap {
  [field: string]: string;
}

export async function verifyRepair(
  repairId: string,
) {
  /**
   * 1. Get repair.
   */
  const repair =
    await getRepairById(repairId);

  if (!repair) {
    throw new Error(
      "Repair not found",
    );
  }

  /**
   * 2. Repair must be approved.
   */
  if (repair.status !== "approved") {
    throw new Error(
      "Repair must be approved before verification",
    );
  }

  /**
   * 3. Get scraper.
   */
  const scraper =
    await getScraperById(
      repair.scraperId,
    );

  if (!scraper) {
    throw new Error(
      "Scraper not found",
    );
  }

  /**
   * 4. Get active version.
   */
  const activeVersion =
    await getActiveScraperVersion(
      repair.scraperId,
    );

  if (!activeVersion) {
    throw new Error(
      "No active scraper version found",
    );
  }

  /**
   * 5. Read selector from ACTIVE VERSION.
   *
   * This is important.
   *
   * We must NOT use repair.newSelector here.
   */
  const selectors =
    activeVersion.selectors as SelectorMap;

  const selector =
    selectors.price;

  if (!selector) {
    throw new Error(
      "No price selector found in active version",
    );
  }

  /**
   * 6. Fetch page.
   */
  const response = await fetch(
    scraper.url,
    {
      headers: {
        "User-Agent":
          "ScrapeShield/1.0",

        Accept:
          "text/html,application/xhtml+xml",
      },

      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch scraper page: ${response.status}`,
    );
  }

  const html =
    await response.text();

  /**
   * 7. Parse HTML.
   */
  const $ =
    cheerio.load(html);

  /**
   * 8. Test selector.
   */
  const elements =
    $(selector);

  const matchCount =
    elements.length;

  let nonEmptyCount = 0;

  elements.each(
    (_index, element) => {
      const value =
        $(element)
          .text()
          .trim();

      if (value.length > 0) {
        nonEmptyCount++;
      }
    },
  );

  const coverage =
    matchCount > 0
      ? nonEmptyCount /
        matchCount
      : 0;

  const valid =
    matchCount > 0 &&
    nonEmptyCount > 0 &&
    coverage >= 0.8;

  const verification = {
    selector,

    matchCount,

    nonEmptyCount,

    coverage,

    valid,
  };

  /**
   * 9. Successful verification.
   */
  if (valid) {
    await updateScraperVersion(
      repair.scraperId,
      activeVersion.version,
    );

    return {
      status: "verified",

      version:
        activeVersion.version,

      verification,
    };
  }

  /**
   * 10. Verification failed.
   *
   * Roll back.
   */
  const previousVersion =
    await getPreviousVersion(
      repair.scraperId,
      activeVersion.version,
    );

  if (!previousVersion) {
    return {
      status: "rollback_failed",

      failedVersion:
        activeVersion.version,

      verification,
    };
  }

  const rollback =
    await rollbackScraper(
      repair.scraperId,
      previousVersion.version,
    );

  return {
    status: "rolled_back",

    failedVersion:
      activeVersion.version,

    restoredVersion:
      previousVersion.version,

    verification,

    rollback,
  };
}

/**
 * Find the version immediately
 * before the active version.
 */
async function getPreviousVersion(
  scraperId: string,
  activeVersion: string,
) {
  const { db } = await import(
    "@/lib/db/client"
  );

  const {
    scraperVersions,
  } = await import(
    "@/lib/db/schema"
  );

  const {
    and,
    eq,
    lt,
    desc,
  } = await import(
    "drizzle-orm"
  );

  const currentVersions =
    await db
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
            activeVersion,
          ),
        ),
      )
      .orderBy(
        desc(
          scraperVersions.createdAt,
        ),
      )
      .limit(1);

  const current =
    currentVersions[0];

  if (!current) {
    return null;
  }

  const previousVersions =
    await db
      .select()
      .from(scraperVersions)
      .where(
        and(
          eq(
            scraperVersions.scraperId,
            scraperId,
          ),

          lt(
            scraperVersions.createdAt,
            current.createdAt,
          ),
        ),
      )
      .orderBy(
        desc(
          scraperVersions.createdAt,
        ),
      )
      .limit(1);

  return (
    previousVersions[0] ??
    null
  );
}