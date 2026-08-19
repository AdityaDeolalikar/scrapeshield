import { NextResponse } from "next/server";

import { getScraperById } from "@/lib/db/queries";
import { executeScraper } from "@/lib/scraper/executor";

/**
 * POST /api/runs
 *
 * Creates and executes a new scraper run for a given scraperId
 * using the currently active scraper version.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.scraperId || typeof body.scraperId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "scraperId is required",
        },
        { status: 400 },
      );
    }

    const scraper = await getScraperById(body.scraperId);

    if (!scraper) {
      return NextResponse.json(
        {
          success: false,
          error: "Scraper not found",
        },
        { status: 404 },
      );
    }

    const result = await executeScraper(body.scraperId);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to execute scraper run:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create scraper run",
      },
      { status: 500 },
    );
  }
}
