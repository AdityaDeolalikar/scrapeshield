import { NextResponse } from "next/server";

import {
  verifyRepair,
} from "@/lib/healing/verification-service";

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
      await verifyRepair(id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to verify repair:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to verify repair",
      },
      {
        status: 500,
      },
    );
  }
}