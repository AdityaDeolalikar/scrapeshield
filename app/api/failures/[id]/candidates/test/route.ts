import { NextResponse } from "next/server";

import {
  getFailureById,
  getScraperById,
} from "@/lib/db/queries";

import {
  testCandidate,
} from "@/lib/healing/candidate-tester";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } =
      await context.params;

    const body =
      await request.json();

    const selector =
      typeof body.selector === "string"
        ? body.selector.trim()
        : "";

    if (!selector) {
      return NextResponse.json(
        {
          success: false,
          error:
            "selector is required",
        },
        { status: 400 },
      );
    }

    const failure =
      await getFailureById(id);

    if (!failure) {
      return NextResponse.json(
        {
          success: false,
          error: "Failure not found",
        },
        { status: 404 },
      );
    }

    const scraper =
      await getScraperById(
        failure.scraperId,
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
      return NextResponse.json(
        {
          success: false,
          error:
            `Failed to fetch scraper page: ${response.status}`,
        },
        { status: 502 },
      );
    }

    const html =
      await response.text();

    const field =
      body.field ??
      "price";

    const result =
      testCandidate(
        html,
        {
          selector,
          field,
        },
        failure.expectedRecords ?? 0,
      );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to test candidate:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to test candidate",
      },
      { status: 500 },
    );
  }
}