import { NextResponse } from "next/server";

import {
  getFailureById,
  getScraperById,
} from "@/lib/db/queries";

import {
  analyzeFailure,
} from "@/lib/healing/analyzer";

import {
  generateRepairCandidates,
} from "@/lib/healing/candidate-generator";

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
    const { id } =
      await context.params;

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

    const analysis =
      analyzeFailure({
        type: failure.type,
        message: failure.message,
        oldSelector:
          failure.oldSelector,
        expectedRecords:
          failure.expectedRecords,
        actualRecords:
          failure.actualRecords,
      });

    if (
      !analysis.repairable ||
      !analysis.affectedField
    ) {
      return NextResponse.json({
        success: true,
        data: {
          candidates: [],
          analysis,
        },
      });
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

    const candidates =
      generateRepairCandidates(
        html,
        analysis.affectedField,
        analysis.oldSelector,
      );

    return NextResponse.json({
      success: true,

      data: {
        failureId: failure.id,

        analysis,

        candidateCount:
          candidates.length,

        candidates,
      },
    });
  } catch (error) {
    console.error(
      "Failed to generate repair candidates:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate candidates",
      },
      { status: 500 },
    );
  }
}