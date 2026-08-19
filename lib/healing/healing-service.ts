import {
  executeScraper,
} from "@/lib/scraper/executor";

import {
  getLatestFailureForRun,
  getScraperRunById,
  getScraperById,
  getActiveScraperVersion,
  createScraperRun,
  completeScraperRun,
  attachBrightDataCollection,
  setRunCollecting,
  updateScraper,
} from "@/lib/db/queries";

import {
  triggerBrightDataScraper,
  getBrightDataResult,
} from "@/lib/bright-data/client";

import {
  processScraperOutput,
} from "@/lib/scraper/output-processor";

import {
  generateRepairForFailure,
} from "@/lib/healing/repair-service";

import {
  approveRepairAutomatically,
} from "@/lib/healing/approval-service";

import {
  verifyRepair,
} from "@/lib/healing/verification-service";

export async function healScraperRun(
  runId: string,
) {
  /**
   * -----------------------------------------
   * STEP 1
   * Find run
   * -----------------------------------------
   */
  const run =
    await getScraperRunById(runId);

  if (!run) {
    throw new Error(
      "Scraper run not found",
    );
  }

  /**
   * -----------------------------------------
   * STEP 2
   * Find failure
   * -----------------------------------------
   */
  const failure =
    await getLatestFailureForRun(
      runId,
    );

  if (!failure) {
    return {
      status: "no_failure",

      runId,

      message:
        "No failure found for this run.",
    };
  }

  /**
   * -----------------------------------------
   * STEP 3
   * Analyze + generate + test + create repair
   * -----------------------------------------
   */
  const repairResult =
    await generateRepairForFailure(
      failure.id,
    );

  /**
   * No valid repair.
   */
  if (
    !repairResult.repairable ||
    !repairResult.repair
  ) {
    return {
      status: "repair_not_found",

      runId,

      failureId:
        failure.id,

      analysis:
        repairResult.analysis,

      candidates:
        repairResult.candidates,

      recommendation:
        repairResult.recommendation,
    };
  }

  /**
   * -----------------------------------------
   * STEP 4
   * Automatically approve repair
   * -----------------------------------------
   */
  const approval =
    await approveRepairAutomatically(
      repairResult.repair.id,
    );

  /**
   * -----------------------------------------
   * STEP 5
   * Verify newly activated version
   * -----------------------------------------
   */
  const verification =
    await verifyRepair(
      repairResult.repair.id,
    );


  /**
   * -----------------------------------------
   * STEP 6
   * Determine final state + re-execute scraper
   * -----------------------------------------
   */
  if (
    verification.status ===
    "verified"
  ) {
    /**
     * Automatically execute the scraper again using
     * the newly active, verified version via Bright Data.
     */
    const scraper = await getScraperById(failure.scraperId);
    let rerun;

    if (scraper?.collectorId) {
      const retryRun = await createScraperRun(failure.scraperId);

      try {
        const bdTrigger = await triggerBrightDataScraper({
          url: scraper.url,
          collectorId: scraper.collectorId,
        });

        await attachBrightDataCollection(retryRun.id, bdTrigger.collection_id);
        await setRunCollecting(retryRun.id);

        const bdResult = await getBrightDataResult(bdTrigger.collection_id);
        const activeVersion = await getActiveScraperVersion(failure.scraperId);
        const selectors = (activeVersion?.selectors as Record<string, string>) || undefined;

        const validation = await processScraperOutput(
          bdResult,
          scraper.url,
          selectors,
        );

        if (validation.valid) {
          const completedRun = await completeScraperRun(retryRun.id, {
            recordsFound: validation.recordsFound,
            durationMs: 0,
            output: validation.data,
          });

          rerun = {
            runId: retryRun.id,
            scraperId: failure.scraperId,
            version: activeVersion?.version || "v1.1",
            status: "success" as const,
            recordsFound: validation.recordsFound,
            output: completedRun?.output ?? validation.data,
          };
        } else {
          rerun = await executeScraper(failure.scraperId);
        }
      } catch {
        rerun = await executeScraper(failure.scraperId);
      }
    } else {
      rerun = await executeScraper(failure.scraperId);
    }

    if (rerun && rerun.status === "success") {
      await updateScraper(failure.scraperId, {
        status: "healthy",
        healthScore: 100,
        currentVersion: approval.newVersion,
      });
    }

    return {
      status: "healed",

      runId,

      failureId:
        failure.id,

      analysis:
        repairResult.analysis,

      candidates:
        repairResult.candidates,

      recommendation:
        repairResult.recommendation,

      repair:
        repairResult.repair,

      approval,

      verification,

      rerun,
    };
  }

  if (
    verification.status ===
    "rolled_back"
  ) {
    return {
      status: "rollback",

      runId,

      failureId:
        failure.id,

      analysis:
        repairResult.analysis,

      repair:
        repairResult.repair,

      approval,

      verification,
    };
  }

  return {
    status:
      "verification_failed",

    runId,

    failureId:
      failure.id,

    repair:
      repairResult.repair,

    approval,

    verification,
  };
}