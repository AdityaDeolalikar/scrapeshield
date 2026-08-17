import { NextResponse } from "next/server";

import {
  completeScraperRun,
  failScraperRun,
  getScraperRunById,
} from "@/lib/db/queries";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
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

    return NextResponse.json({
      success: true,
      data: run,
    });
  } catch (error) {
    console.error("Failed to fetch run:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch run",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const body = await request.json();

    if (body.status === "success") {
      const run = await completeScraperRun(id, {
        recordsFound: Number(body.recordsFound ?? 0),
        durationMs: Number(body.durationMs ?? 0),
        output: body.output,
      });

      if (!run) {
        return NextResponse.json(
          {
            success: false,
            error: "Run not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: run,
      });
    }

    if (body.status === "failed") {
      const run = await failScraperRun(id, {
        error:
          typeof body.error === "string"
            ? body.error
            : "Unknown scraper error",
        durationMs: Number(body.durationMs ?? 0),
      });

      if (!run) {
        return NextResponse.json(
          {
            success: false,
            error: "Run not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: run,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid run status",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Failed to update run:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update run",
      },
      { status: 500 },
    );
  }
}