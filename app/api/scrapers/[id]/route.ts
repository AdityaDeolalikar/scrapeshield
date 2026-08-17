import { NextResponse } from "next/server";

import {
  getScraperById,
  updateScraper,
} from "@/lib/db/queries";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Scraper ID is required",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const existingScraper =
      await getScraperById(id);

    if (!existingScraper) {
      return NextResponse.json(
        {
          success: false,
          error: "Scraper not found",
        },
        { status: 404 },
      );
    }

    const scraper = await updateScraper(id, {
      name:
        typeof body.name === "string"
          ? body.name.trim()
          : undefined,

      url:
        typeof body.url === "string"
          ? body.url.trim()
          : undefined,

      collectorId:
        typeof body.collectorId === "string"
          ? body.collectorId.trim()
          : undefined,

      description:
        typeof body.description === "string"
          ? body.description.trim()
          : undefined,
    });

    return NextResponse.json({
      success: true,
      data: scraper,
    });
  } catch (error) {
    console.error(
      "Failed to update scraper:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update scraper",
      },
      { status: 500 },
    );
  }
}