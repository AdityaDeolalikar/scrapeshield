import { NextResponse } from "next/server";

import {
  createScraperRun,
  getScraperById,
} from "@/lib/db/queries";

/**
 * POST /api/runs
 *
 * Creates a new scraper run for a given scraperId.
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

    const run = await createScraperRun(body.scraperId);

    return NextResponse.json(
      {
        success: true,
        data: run,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create scraper run:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create scraper run",
      },
      { status: 500 },
    );
  }
}
