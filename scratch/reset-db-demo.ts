import { db } from "@/lib/db/client";
import { scrapers, scraperVersions, scraperRuns, failures, repairs } from "@/lib/db/schema";
import { defaultScraperSelectors } from "@/lib/scraper/default-config";

async function resetDatabase() {
  console.log("==================================================");
  console.log("SCRAPESHIELD DEMO DATABASE RESET");
  console.log("==================================================");

  // 1. Clear existing test data
  console.log("[1] Truncating repairs, failures, runs, versions, and scrapers tables...");
  await db.delete(repairs);
  await db.delete(failures);
  await db.delete(scraperRuns);
  await db.delete(scraperVersions);
  await db.delete(scrapers);

  // 2. Create single clean demo scraper
  console.log("[2] Inserting single demo scraper: 'Books to Scrape'...");
  const [newScraper] = await db
    .insert(scrapers)
    .values({
      name: "Books to Scrape",
      url: "https://books.toscrape.com/",
      description: "Real-time self-healing web scraper for Books to Scrape.",
      collectorId: "c_msx2ztefhbwpo451v",
      status: "healthy",
      healthScore: 100,
      successRate: 100,
      currentVersion: "v1.0",
      isActive: true,
    })
    .returning();

  if (!newScraper) {
    throw new Error("Failed to create demo scraper.");
  }

  // 3. Create initial active version v1.0
  console.log(`[3] Inserting initial active version v1.0 for scraper ${newScraper.id}...`);
  const initialSchema = {
    fields: {
      title: { type: "text", selector: defaultScraperSelectors.title },
      price: { type: "price", selector: defaultScraperSelectors.price },
      availability: { type: "text", selector: defaultScraperSelectors.availability },
      rating: { type: "rating", selector: defaultScraperSelectors.rating },
      productUrl: { type: "url", selector: defaultScraperSelectors.productUrl },
      imageUrl: { type: "url", selector: defaultScraperSelectors.imageUrl },
    },
  };

  const [initialVersion] = await db
    .insert(scraperVersions)
    .values({
      scraperId: newScraper.id,
      version: "v1.0",
      selectors: defaultScraperSelectors,
      schema: initialSchema,
      isActive: true,
    })
    .returning();

  console.log("==================================================");
  console.log("VERIFICATION CHECK:");
  console.log("==================================================");
  console.log(`Scraper ID      : ${newScraper.id}`);
  console.log(`Name            : ${newScraper.name}`);
  console.log(`URL             : ${newScraper.url}`);
  console.log(`Collector ID    : ${newScraper.collectorId}`);
  console.log(`Status          : ${newScraper.status}`);
  console.log(`Health Score    : ${newScraper.healthScore}%`);
  console.log(`Success Rate    : ${newScraper.successRate}%`);
  console.log(`Current Version : ${newScraper.currentVersion}`);
  console.log(`Active Version  : ${initialVersion.version} (isActive: ${initialVersion.isActive})`);
  console.log(`Active Selectors: ${JSON.stringify(initialVersion.selectors)}`);
  console.log("==================================================");
  console.log("✅ DATABASE SUCCESSFULLY RESET FOR HACKATHON DEMO RECORDING.");

  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
