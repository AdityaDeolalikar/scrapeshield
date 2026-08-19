import { NextResponse } from "next/server";

import {
  healScraperRun,
} from "@/lib/healing/healing-service";

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

    const result =
      await healScraperRun(id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to heal scraper run:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to heal scraper run",
      },
      {
        status: 500,
      },
    );
  }
}