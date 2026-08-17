import { NextResponse } from "next/server";

import {
  createFailure,
  failScraperRun,
  getScraperRunById,
} from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const runId =
      typeof body.runId === "string"
        ? body.runId.trim()
        : "";

    if (!runId) {
      return NextResponse.json(
        {
          success: false,
          error: "runId is required",
        },
        { status: 400 },
      );
    }

    const run = await getScraperRunById(runId);

    if (!run) {
      return NextResponse.json(
        {
          success: false,
          error: "Run not found",
        },
        { status: 404 },
      );
    }

    const simulatedFailure =
      await createFailure({
        scraperId: run.scraperId,
        runId: run.id,
        type: "schema_invalid",
        message:
          "Required field 'price' is missing from scraper output.",
        oldSelector: ".price_color",
        expectedRecords: 20,
        actualRecords: 20,
      });

    await failScraperRun(run.id, {
      error:
        "Simulated schema validation failure: price field missing.",
      durationMs: 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        status: "failed",
        failureId: simulatedFailure?.id ?? null,
        failureType: "schema_invalid",
        message:
          "Required field 'price' is missing.",
      },
    });
  } catch (error) {
    console.error(
      "Failed to simulate scraper failure:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to simulate failure",
      },
      { status: 500 },
    );
  }
}