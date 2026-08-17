import { NextResponse } from "next/server";

import {
  attachBrightDataCollection,
  getScraperById,
  getScraperRunById,
  setRunCollecting,
} from "@/lib/db/queries";

import {
  triggerBrightDataScraper,
} from "@/lib/bright-data/client";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const run = await getScraperRunById(id);

    if (!run) {
      return NextResponse.json(
        {
          success: false,
          error: "Run not found",
        },
        { status: 404 },
      );
    }

    if (run.status !== "running") {
      return NextResponse.json(
        {
          success: false,
          error: `Run cannot be executed from status: ${run.status}`,
        },
        { status: 409 },
      );
    }

    const scraper = await getScraperById(
      run.scraperId,
    );

    if (!scraper) {
      return NextResponse.json(
        {
          success: false,
          error: "Scraper not found",
        },
        { status: 404 },
      );
    }

    if (!scraper.collectorId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This scraper does not have a Bright Data collector configured.",
        },
        { status: 400 },
      );
    }

    const result =
      await triggerBrightDataScraper({
        url: scraper.url,
        collectorId: scraper.collectorId,
      });

    await attachBrightDataCollection(
      run.id,
      result.collection_id,
    );

    await setRunCollecting(run.id);

    return NextResponse.json({
      success: true,

      data: {
        runId: run.id,

        collectionId:
          result.collection_id,

        status: "collecting",
      },
    });
  } catch (error) {
    console.error(
      "Failed to execute scraper run:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute scraper",
      },
      { status: 500 },
    );
  }
}