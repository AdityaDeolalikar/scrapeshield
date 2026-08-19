import {
  createScraper,
  createScraperVersion,
  updateScraperVersion,
  createScraperRun,
  failScraperRun,
  createFailure,
  getScraperById,
  getActiveScraperVersion,
} from "../lib/db/queries";

import { healScraperRun } from "../lib/healing/healing-service";
import { processScraperOutput } from "../lib/scraper/output-processor";

async function runE2ETest() {
  console.log("==================================================");
  console.log("STARTING SCRAPESHIELD END-TO-END HEALING TEST");
  console.log("==================================================\n");

  // Step 1: Create Scraper
  const scraper = await createScraper({
    name: "Books to Scrape",
    url: "https://books.toscrape.com/",
    collectorId: "c_test_books_collector",
    description: "End to end test scraper",
  });

  console.log(`[1] Created Scraper: ${scraper.id} (${scraper.name})`);

  // Step 2: Create initial Version v1.0 with old broken selector .price_color
  const version1 = await createScraperVersion({
    scraperId: scraper.id,
    version: "v1.0",
    selectors: {
      title: ".product_pod h3 a",
      price: ".price_color", // old selector
    },
    schema: {
      fields: {
        price: { selector: ".price_color" },
      },
    },
    isActive: true,
  });

  await updateScraperVersion(scraper.id, "v1.0");

  console.log(`[2] Created Version v1.0 (Active: true, price: '.price_color')`);

  // Step 3: Run normal scraper execution check (v1.0 selector works on live page)
  const initialRun = await createScraperRun(scraper.id);
  const activeVerBefore = await getActiveScraperVersion(scraper.id);
  const initialOutput = await processScraperOutput(
    null,
    scraper.url,
    activeVerBefore?.selectors as Record<string, string>,
  );

  console.log(`[3] Initial Run (v1.0): Valid=${initialOutput.valid}, RecordsFound=${initialOutput.recordsFound}`);

  // Step 4: Simulate Failure (.price_color fails / breaks)
  const failedRun = await createScraperRun(scraper.id);
  const failure = await createFailure({
    scraperId: scraper.id,
    runId: failedRun.id,
    type: "schema_invalid",
    message: "Required field 'price' is missing from scraper output.",
    oldSelector: ".price_color",
    expectedRecords: 20,
    actualRecords: 0,
  });

  await failScraperRun(failedRun.id, {
    error: "Required field 'price' is missing.",
    durationMs: 150,
  });

  console.log(`[4] Simulated Failure Logged (RunId: ${failedRun.id}, FailureId: ${failure?.id})`);

  // Step 5: Execute Heal Orchestration (/api/runs/[id]/heal)
  console.log(`\n[5] Triggering Self-Healing Pipeline for Run ${failedRun.id}...`);

  const healResult = await healScraperRun(failedRun.id);

  console.log("\n==================================================");
  console.log("HEALING PIPELINE RESULTS:");
  console.log("==================================================");
  console.log(`Status         : ${healResult.status}`);
  console.log(`Failure ID     : ${healResult.failureId}`);
  if ("repair" in healResult && healResult.repair) {
    console.log(`Old Selector   : ${healResult.repair.oldSelector}`);
    console.log(`New Selector   : ${healResult.repair.newSelector}`);
    console.log(`Confidence     : ${healResult.repair.confidence}`);
  }
  if ("approval" in healResult && healResult.approval) {
    console.log(`New Version    : ${healResult.approval.newVersion}`);
  }
  if ("verification" in healResult && healResult.verification) {
    console.log(`Verification   : status=${healResult.verification.status}, matches=${healResult.verification.verification.matchCount}, coverage=${healResult.verification.verification.coverage}, valid=${healResult.verification.verification.valid}`);
  }
  if ("rerun" in healResult && healResult.rerun) {
    console.log(`Rerun Status   : ${healResult.rerun.status}`);
    console.log(`Records Found  : ${healResult.rerun.recordsFound}`);
    console.log(`Rerun Version  : ${healResult.rerun.version}`);
  }

  // Step 6: Verify Active Version in DB
  const activeVerAfter = await getActiveScraperVersion(scraper.id);
  const updatedScraper = await getScraperById(scraper.id);

  console.log("\n==================================================");
  console.log("FINAL DATABASE STATE:");
  console.log("==================================================");
  console.log(`Scraper Version: ${updatedScraper?.currentVersion}`);
  console.log(`Active Version : ${activeVerAfter?.version}`);
  console.log(`Active Selectors: ${JSON.stringify(activeVerAfter?.selectors)}`);
  console.log("==================================================");

  const rerunSuccess = "rerun" in healResult && healResult.rerun?.status === "success" && healResult.rerun?.recordsFound === 20;

  if (
    healResult.status === "healed" &&
    activeVerAfter?.version === "v1.1" &&
    (activeVerAfter?.selectors as Record<string, string>)?.price === ".product_price" &&
    rerunSuccess
  ) {
    console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY! CORE HACKATHON FEATURE COMPLETE.");
  } else {
    console.error("\n❌ TEST FAILED. Check details above.");
  }

  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
