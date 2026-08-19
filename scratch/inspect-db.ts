import { db } from "@/lib/db/client";
import { scrapers, scraperRuns, failures, repairs, scraperVersions } from "@/lib/db/schema";

async function main() {
  console.log("=== INSPECTING DATABASE RECORDS ===");

  const allScrapers = await db.select().from(scrapers);
  console.log(`\n--- SCRAPERS (${allScrapers.length}) ---`);
  console.table(allScrapers);

  const allVersions = await db.select().from(scraperVersions);
  console.log(`\n--- SCRAPER VERSIONS (${allVersions.length}) ---`);
  console.table(allVersions);

  const allRuns = await db.select().from(scraperRuns);
  console.log(`\n--- SCRAPER RUNS (${allRuns.length}) ---`);
  console.log(`Total runs: ${allRuns.length}`);

  const allFailures = await db.select().from(failures);
  console.log(`\n--- FAILURES (${allFailures.length}) ---`);
  console.log(`Total failures: ${allFailures.length}`);

  const allRepairs = await db.select().from(repairs);
  console.log(`\n--- REPAIRS (${allRepairs.length}) ---`);
  console.log(`Total repairs: ${allRepairs.length}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
