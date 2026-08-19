import {
  createRepair,
  getFailureById,
  getScraperById,
} from "@/lib/db/queries";

import {
  analyzeFailure,
} from "@/lib/healing/analyzer";

import {
  generateRepairCandidates,
} from "@/lib/healing/candidate-generator";

import {
  testCandidate,
} from "@/lib/healing/candidate-tester";

export async function generateRepairForFailure(
  failureId: string,
) {
  const failure =
    await getFailureById(failureId);

  if (!failure) {
    throw new Error("Failure not found");
  }

  const scraper =
    await getScraperById(
      failure.scraperId,
    );

  if (!scraper) {
    throw new Error("Scraper not found");
  }

  /**
   * -----------------------------------------
   * 1. Analyze failure
   * -----------------------------------------
   */

  const analysis =
    analyzeFailure({
      type: failure.type,

      message: failure.message,

      oldSelector:
        failure.oldSelector,

      expectedRecords:
        failure.expectedRecords,

      actualRecords:
        failure.actualRecords,
    });

  /**
   * -----------------------------------------
   * 2. Check whether repair is possible
   * -----------------------------------------
   */

  if (
    !analysis.repairable ||
    !analysis.affectedField
  ) {
    return {
      repairable: false,

      failureId: failure.id,

      analysis,

      candidates: [],

      recommendation: null,

      repair: null,
    };
  }

  /**
   * -----------------------------------------
   * 3. Fetch current webpage
   * -----------------------------------------
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
   * -----------------------------------------
   * 4. Generate candidates
   * -----------------------------------------
   */

  const candidates =
    generateRepairCandidates(
      html,

      analysis.affectedField,

      analysis.oldSelector,
    );

  /**
   * -----------------------------------------
   * 5. Test every candidate
   * -----------------------------------------
   */

  const testedCandidates =
    candidates.map((candidate) =>
      testCandidate(
        html,

        candidate,

        failure.expectedRecords ?? 0,
      ),
    );

  /**
   * -----------------------------------------
   * 6. Rank candidates
   * -----------------------------------------
   */

  const rankedCandidates =
    testedCandidates.sort(
      (a, b) =>
        b.score - a.score,
    );

  /**
   * -----------------------------------------
   * 7. Only consider valid candidates
   * -----------------------------------------
   */

  const validCandidates =
    rankedCandidates.filter(
      (candidate) =>
        candidate.valid,
    );

  const recommendation =
    validCandidates[0] ?? null;

  /**
   * -----------------------------------------
   * 8. Validate old selector
   * -----------------------------------------
   */

  if (!analysis.oldSelector) {
    throw new Error(
      "Unable to create repair: old selector is missing.",
    );
  }

  /**
   * -----------------------------------------
   * 9. No valid repair found
   * -----------------------------------------
   */

  if (!recommendation) {
    return {
      repairable: false,

      failureId: failure.id,

      analysis,

      candidates: rankedCandidates,

      recommendation: null,

      repair: null,
    };
  }

  /**
   * -----------------------------------------
   * 10. Create repair record
   * -----------------------------------------
   */

  const repair =
    await createRepair({
      scraperId:
        failure.scraperId,

      runId:
        failure.runId,

      failureId:
        failure.id,

      oldSelector:
        analysis.oldSelector,

      newSelector:
        recommendation.selector,

      confidence:
        recommendation.score,

      reason:
        analysis.reason,
    });

  return {
    repairable: true,

    failureId: failure.id,

    analysis,

    candidates:
      rankedCandidates,

    recommendation,

    repair,
  };
}