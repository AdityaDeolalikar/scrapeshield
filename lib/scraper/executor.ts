import * as cheerio from "cheerio";
import {
  getScraperById,
  getActiveScraperVersion,
  createScraperRun,
  completeScraperRun,
  failScraperRun,
  createFailure,
} from "@/lib/db/queries";

export interface ExecutionResult {
  runId: string;
  scraperId: string;
  version: string;
  status: "success" | "failed";
  recordsFound: number;
  output?: unknown;
  error?: string;
  failureId?: string | null;
}

export async function executeScraper(
  scraperId: string,
): Promise<ExecutionResult> {
  const scraper = await getScraperById(scraperId);

  if (!scraper) {
    throw new Error(`Scraper ${scraperId} not found`);
  }

  const activeVersion =
    await getActiveScraperVersion(scraperId);

  if (!activeVersion) {
    throw new Error(
      `No active version found for scraper ${scraperId}`,
    );
  }

  const run = await createScraperRun(scraperId);

  const selectors =
    (activeVersion.selectors as Record<string, string>) || {};

  const priceSelector = selectors.price || ".price_color";
  const titleSelector = selectors.title || "h3 a";

  const startTime = Date.now();

  const response = await fetch(scraper.url, {
    headers: {
      "User-Agent": "ScrapeShield/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorMsg = `Failed to fetch page: ${response.status}`;

    await failScraperRun(run.id, {
      error: errorMsg,
      durationMs: Date.now() - startTime,
    });

    return {
      runId: run.id,
      scraperId,
      version: activeVersion.version,
      status: "failed",
      recordsFound: 0,
      error: errorMsg,
    };
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const books: Array<{
    title: string;
    price: string;
    currency: string;
  }> = [];

  let priceMatches = 0;

  $(".product_pod, article").each((_i, elem) => {
    const title =
      $(elem).find(titleSelector).text().trim() ||
      $(elem).find("h3 a").text().trim();

    const priceText = $(elem).find(priceSelector).text().trim();

    if (priceText && priceText.length > 0) {
      priceMatches++;

      const currencyMatch = priceText.match(/^[^\d]+/);
      const currency = currencyMatch ? currencyMatch[0] : "£";

      books.push({
        title: title || "Unknown Title",
        price: priceText,
        currency,
      });
    }
  });

  // Fallback if container parsing yields nothing
  if (books.length === 0 && priceMatches === 0) {
    $(priceSelector).each((_i, elem) => {
      const priceText = $(elem).text().trim();
      if (priceText && priceText.length > 0) {
        priceMatches++;
        books.push({
          title: "Product",
          price: priceText,
          currency: "£",
        });
      }
    });
  }

  const durationMs = Date.now() - startTime;

  if (priceMatches === 0 || books.length === 0) {
    const failure = await createFailure({
      scraperId,
      runId: run.id,
      type: "schema_invalid",
      message: `Scraper output failed validation: price selector '${priceSelector}' matched 0 elements.`,
      oldSelector: priceSelector,
      expectedRecords: 20,
      actualRecords: 0,
    });

    await failScraperRun(run.id, {
      error: `Selector '${priceSelector}' failed to extract data`,
      durationMs,
    });

    return {
      runId: run.id,
      scraperId,
      version: activeVersion.version,
      status: "failed",
      recordsFound: 0,
      error: `Selector '${priceSelector}' failed to extract data`,
      failureId: failure?.id ?? null,
    };
  }

  const outputData = {
    books,
    version: activeVersion.version,
    url: scraper.url,
  };

  const completedRun = await completeScraperRun(run.id, {
    recordsFound: books.length,
    durationMs,
    output: outputData,
  });

  return {
    runId: run.id,
    scraperId,
    version: activeVersion.version,
    status: "success",
    recordsFound: books.length,
    output: completedRun?.output ?? outputData,
  };
}
