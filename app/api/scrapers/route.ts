import { NextResponse } from "next/server";

import {
  createScraper,
  getScrapers,
} from "@/lib/db/queries";

/**
 * GET /api/scrapers
 *
 * Returns all active scrapers.
 */
export async function GET() {
  try {
    const scrapers = await getScrapers();

    return NextResponse.json({
      success: true,
      data: scrapers,
    });
  } catch (error) {
    console.error("Failed to fetch scrapers:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch scrapers",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * POST /api/scrapers
 *
 * Creates a new scraper.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Scraper name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Scraper URL is required",
        },
        {
          status: 400,
        },
      );
    }

    const scraper = await createScraper({
      name: body.name.trim(),
      url: body.url.trim(),
      description:
        typeof body.description === "string"
          ? body.description.trim()
          : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: scraper,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Failed to create scraper:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create scraper",
      },
      {
        status: 500,
      },
    );
  }
}