import { NextResponse } from "next/server";

import {
  completeScraperRun,
  failScraperRun,
  getScraperRunById,
  getScraperById,
  createFailure
} from "@/lib/db/queries";

import {
  getBrightDataResult,
} from "@/lib/bright-data/client";

import {
  validateScraperOutput,
} from "@/lib/validation/validate-scraper-output";

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

    if (!run.brightDataCollectionId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bright Data collection has not been created yet.",
        },
        { status: 409 },
      );
    }

    const result =
      await getBrightDataResult(
        run.brightDataCollectionId,
      );

    /**
     * Bright Data returns a status object while
     * the collection is still processing.
     */
    if (
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      "status" in result
    ) {
      const status =
        (result as { status: string }).status;

      if (status !== "ready") {
        return NextResponse.json({
          success: true,

          data: {
            status: "collecting",
            brightDataStatus: status,
          },
        });
      }
    }

    /**
     * Validate the actual scraper output.
     */
    const validation =
      validateScraperOutput(result);

    // if (!validation.valid) {
    //   await failScraperRun(id, {
    //     error: JSON.stringify(
    //       validation.errors,
    //     ),
    //     durationMs: 0,
    //   });

    //   return NextResponse.json({
    //     success: true,

    //     data: {
    //       status: "failed",
    //       recordsFound:
    //         validation.recordsFound,
    //       errors: validation.errors,
    //     },
    //   });
    // }

    if (!validation.valid) {
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

  const failure = await createFailure({
    scraperId: scraper.id,
    runId: run.id,
    type: "schema_invalid",
    message:
      "Scraper output failed validation.",
    expectedRecords: 20,
    actualRecords:
      validation.recordsFound,
  });

  await failScraperRun(id, {
    error: JSON.stringify(
      validation.errors,
    ),
    durationMs: 0,
  });

  return NextResponse.json({
    success: true,

    data: {
      status: "failed",

      recordsFound:
        validation.recordsFound,

      errors: validation.errors,

      failureId: failure?.id ?? null,
    },
  });
}

    /**
     * Successful extraction.
     */
    const completed =
      await completeScraperRun(id, {
        recordsFound:
          validation.recordsFound,

        durationMs: 0,

        output: validation.data,
      });

    return NextResponse.json({
      success: true,

      data: {
        status: "success",

        recordsFound:
          validation.recordsFound,

        run: completed,
      },
    });
  } catch (error) {
    console.error(
      "Failed to sync scraper run:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync scraper run",
      },
      { status: 500 },
    );
  }
}