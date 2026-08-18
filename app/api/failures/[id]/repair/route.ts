import { NextResponse } from "next/server";

import {
  createRepair,
  getFailureById,
  getScraperById,
} from "@/lib/db/queries";

import {
  analyzeFailure,
} from "@/lib/healing/analyzer";

import {
  generateRepairCandidates,
} from "@/lib/healing/candidate-generator";

import {
  testCandidate,
} from "@/lib/healing/candidate-tester";

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
          repairable: false,
          analysis,
          candidates: [],
          recommendation: null,
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

    const testedCandidates =
      candidates.map((candidate) =>
        testCandidate(
          html,
          candidate,
          failure.expectedRecords ?? 0,
        ),
      );

    const rankedCandidates =
      testedCandidates.sort(
        (a, b) =>
          b.score - a.score,
      );

    const validCandidates =
      rankedCandidates.filter(
        (candidate) =>
          candidate.valid,
      );

    const recommendation =
      validCandidates[0] ?? null;

    if (!analysis.oldSelector) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to create repair: old selector is missing.",
        },
        { status: 422 },
      );
    }

    if (
      !recommendation ||
      !analysis.oldSelector
    ) {
      return NextResponse.json({
        success: true,
        data: {
          repairable: false,
          failureId: failure.id,
          analysis,
          candidates: rankedCandidates,
          recommendation,
        },
      });
    }

    let repair = null;

    if (recommendation) {
      repair = await createRepair({
        scraperId:
          failure.scraperId,

        runId:
          failure.runId,

        failureId:
          failure.id,

        oldSelector:
          analysis.oldSelector,

        newSelector:
          recommendation.selector,

        confidence:
          recommendation.score,

        reason:
          analysis.reason,
      });
    }

    return NextResponse.json({
      success: true,

      data: {
        repairable: true,

        failureId:
          failure.id,

        analysis,

        candidates:
          rankedCandidates,

        recommendation,

        repair,
      },
    });
  } catch (error) {
    console.error(
      "Failed to generate repair recommendation:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate repair recommendation",
      },
      { status: 500 },
    );
  }
}