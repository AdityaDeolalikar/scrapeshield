import { NextResponse } from "next/server";

import {
  getFailureById,
} from "@/lib/db/queries";

import {
  analyzeFailure,
} from "@/lib/healing/analyzer";

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

    const analysis =
      analyzeFailure({
        type: failure.type,

        message:
          failure.message,

        oldSelector:
          failure.oldSelector,

        expectedRecords:
          failure.expectedRecords,

        actualRecords:
          failure.actualRecords,
      });

    return NextResponse.json({
      success: true,

      data: {
        failureId: failure.id,

        analysis,
      },
    });
  } catch (error) {
    console.error(
      "Failed to analyze failure:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze failure",
      },
      { status: 500 },
    );
  }
}