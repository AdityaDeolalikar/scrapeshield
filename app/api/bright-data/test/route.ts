import { NextResponse } from "next/server";

import {
  getBrightDataResult,
  triggerBrightDataScraper,
} from "@/lib/bright-data/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const url =
      typeof body.url === "string"
        ? body.url.trim()
        : "";

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "url is required",
        },
        { status: 400 },
      );
    }

    const result =
      await triggerBrightDataScraper({
        url,
      });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Bright Data trigger failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const collectionId =
      searchParams.get("collectionId");

    if (!collectionId) {
      return NextResponse.json(
        {
          success: false,
          error: "collectionId is required",
        },
        { status: 400 },
      );
    }

    const result =
      await getBrightDataResult(collectionId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Bright Data result retrieval failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 },
    );
  }
}