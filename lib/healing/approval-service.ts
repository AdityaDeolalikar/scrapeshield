import {
  approveRepair,
  createScraperVersion,
  getLatestScraperVersion,
  getRepairById,
  getScraperById,
  activateScraperVersion,
  updateScraperVersion,
} from "@/lib/db/queries";

import {
  defaultScraperSelectors,
} from "@/lib/scraper/default-config";

type SelectorMap = Record<string, string>;

interface ScraperSchema {
  fields?: Record<
    string,
    {
      type?: string;
      selector?: string;
      [key: string]: unknown;
    }
  >;
  [key: string]: unknown;
}

export async function approveRepairAutomatically(
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
   * 2. Validate replacement selector.
   */
  if (!repair.newSelector) {
    throw new Error(
      "Repair does not contain a replacement selector",
    );
  }

  /**
   * 3. Already approved?
   */
  if (repair.status === "approved") {
    return {
      repair,
      alreadyApproved: true,
    };
  }

  /**
   * 4. Get scraper.
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
   * 5. Current version becomes
   *    the rollback version.
   */
  const previousVersion =
    scraper.currentVersion || "v1.0";

  /**
   * 6. Get latest version snapshot.
   */
  const latestVersion =
    await getLatestScraperVersion(
      repair.scraperId,
    );

  /**
   * 7. Calculate next version.
   */
  const versionMatch =
    previousVersion.match(
      /^v(\d+)\.(\d+)$/,
    );

  let nextVersion = "v1.1";

  if (versionMatch) {
    const major = Number(
      versionMatch[1],
    );

    const minor = Number(
      versionMatch[2],
    );

    nextVersion =
      `v${major}.${minor + 1}`;
  }

  /**
   * 8. Preserve existing selectors with default fallbacks for complete configuration.
   */
  const existingSelectors: SelectorMap =
    latestVersion?.selectors &&
    typeof latestVersion.selectors ===
      "object"
      ? (latestVersion.selectors as SelectorMap)
      : {};

  const selectors: SelectorMap = {
    ...defaultScraperSelectors,
    ...existingSelectors,

    price:
      repair.newSelector,
  };

  /**
   * 9. Update schema to represent all fields.
   */
  const schema = {
    fields: {
      title: {
        type: "text",
        selector: selectors.title,
      },
      price: {
        type: "price",
        selector: selectors.price,
      },
      availability: {
        type: "text",
        selector: selectors.availability,
      },
      rating: {
        type: "rating",
        selector: selectors.rating,
      },
      productUrl: {
        type: "url",
        selector: selectors.productUrl,
      },
      imageUrl: {
        type: "url",
        selector: selectors.imageUrl,
      },
    },
  };

  /**
   * 10. Create new version.
   */
  const version =
    await createScraperVersion({
      scraperId:
        repair.scraperId,

      version:
        nextVersion,

      selectors,

      schema,

      isActive: false,
    });

  if (!version) {
    throw new Error(
      "Failed to create scraper version",
    );
  }

  /**
   * 11. Activate new version.
   */
  const activatedVersion =
    await activateScraperVersion(
      repair.scraperId,
      version.id,
    );

  if (!activatedVersion) {
    throw new Error(
      "Failed to activate scraper version",
    );
  }

  /**
   * 12. Update scraper.
   */
  const updatedScraper =
    await updateScraperVersion(
      repair.scraperId,
      nextVersion,
    );

  if (!updatedScraper) {
    throw new Error(
      "Failed to update scraper version",
    );
  }

  /**
   * 13. Approve repair.
   */
  const approvedRepair =
    await approveRepair(repairId);

  if (!approvedRepair) {
    throw new Error(
      "Failed to approve repair",
    );
  }

  return {
    repair: approvedRepair,

    previousVersion,

    newVersion:
      nextVersion,

    version:
      activatedVersion,

    scraper:
      updatedScraper,

    alreadyApproved: false,
  };
}