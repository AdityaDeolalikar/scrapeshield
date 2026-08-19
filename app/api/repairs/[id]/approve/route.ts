// import { NextResponse } from "next/server";

// import {
//   approveRepair,
//   createScraperVersion,
//   getLatestScraperVersion,
//   getRepairById,
//   getScraperById,
//   activateScraperVersion,
//   updateScraperVersion,
// } from "@/lib/db/queries";

// interface RouteContext {
//   params: Promise<{
//     id: string;
//   }>;
// }

// type SelectorMap = Record<string, string>;

// interface ScraperSchema {
//   fields?: Record<
//     string,
//     {
//       type?: string;
//       selector?: string;
//       [key: string]: unknown;
//     }
//   >;
//   [key: string]: unknown;
// }

// export async function POST(
//   _request: Request,
//   context: RouteContext,
// ) {
//   try {
//     const { id } = await context.params;

//     /**
//      * 1. Find the repair.
//      */
//     const repair = await getRepairById(id);

//     if (!repair) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Repair not found",
//         },
//         { status: 404 },
//       );
//     }

//     /**
//      * 2. A repair must contain a replacement selector.
//      */
//     if (!repair.newSelector) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Repair does not contain a replacement selector",
//         },
//         { status: 422 },
//       );
//     }

//     /**
//      * 3. Prevent duplicate approval.
//      */
//     if (repair.status === "approved") {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Repair has already been approved",
//         },
//         { status: 409 },
//       );
//     }

//     /**
//      * 4. Get the scraper.
//      */
//     const scraper = await getScraperById(
//       repair.scraperId,
//     );

//     if (!scraper) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Scraper not found",
//         },
//         { status: 404 },
//       );
//     }

//     /**
//      * IMPORTANT:
//      * Capture the currently active version BEFORE
//      * activating the new version.
//      */
//     const previousVersion =
//       scraper.currentVersion || "v1.0";

//     /**
//      * 5. Get the latest version snapshot.
//      *
//      * We use this snapshot as the base for the
//      * new version so that we don't lose existing
//      * selectors/schema.
//      */
//     const latestVersion =
//       await getLatestScraperVersion(
//         repair.scraperId,
//       );

//     /**
//      * 6. Calculate the next version number.
//      *
//      * Example:
//      *
//      * v1.0 -> v1.1
//      * v1.1 -> v1.2
//      * v1.9 -> v1.10
//      */
//     const versionMatch =
//       previousVersion.match(
//         /^v(\d+)\.(\d+)$/,
//       );

//     let nextVersion = "v1.1";

//     if (versionMatch) {
//       const major = Number(versionMatch[1]);
//       const minor = Number(versionMatch[2]);

//       nextVersion =
//         `v${major}.${minor + 1}`;
//     }

//     /**
//      * 7. Preserve the existing selectors.
//      *
//      * Example:
//      *
//      * Existing:
//      * {
//      *   title: "h3 a",
//      *   price: ".price_color",
//      *   rating: ".star-rating"
//      * }
//      *
//      * New:
//      * {
//      *   title: "h3 a",
//      *   price: ".product_price",
//      *   rating: ".star-rating"
//      * }
//      */
//     const existingSelectors: SelectorMap =
//       latestVersion?.selectors &&
//       typeof latestVersion.selectors === "object"
//         ? (latestVersion.selectors as SelectorMap)
//         : {};

//     const selectors: SelectorMap = {
//       ...existingSelectors,
//       price: repair.newSelector,
//     };

//     /**
//      * 8. Preserve the existing schema and update
//      * only the repaired field.
//      */
//     const existingSchema: ScraperSchema =
//       latestVersion?.schema &&
//       typeof latestVersion.schema === "object"
//         ? (latestVersion.schema as ScraperSchema)
//         : {};

//     const existingFields =
//       existingSchema.fields ?? {};

//     const schema: ScraperSchema = {
//       ...existingSchema,

//       fields: {
//         ...existingFields,

//         price: {
//           ...(existingFields.price ?? {}),
//           type: "price",
//           selector: repair.newSelector,
//         },
//       },
//     };

//     /**
//      * 9. Create the new version.
//      *
//      * It starts inactive.
//      */
//     const version =
//       await createScraperVersion({
//         scraperId: repair.scraperId,

//         version: nextVersion,

//         selectors,

//         schema,

//         isActive: false,
//       });

//     if (!version) {
//       throw new Error(
//         "Failed to create scraper version",
//       );
//     }

//     /**
//      * 10. Activate the new version.
//      *
//      * This should deactivate the previous
//      * active version.
//      */
//     const activatedVersion =
//       await activateScraperVersion(
//         repair.scraperId,
//         version.id,
//       );

//     if (!activatedVersion) {
//       throw new Error(
//         "Failed to activate scraper version",
//       );
//     }

//     /**
//      * 11. Update scraper.currentVersion.
//      */
//     const updatedScraper =
//       await updateScraperVersion(
//         repair.scraperId,
//         nextVersion,
//       );

//     if (!updatedScraper) {
//       throw new Error(
//         "Failed to update scraper current version",
//       );
//     }

//     /**
//      * 12. Mark repair as approved.
//      */
//     const approvedRepair =
//       await approveRepair(id);

//     if (!approvedRepair) {
//       throw new Error(
//         "Failed to approve repair",
//       );
//     }

//     /**
//      * 13. Return complete result.
//      */
//     return NextResponse.json({
//       success: true,

//       data: {
//         repair: approvedRepair,

//         previousVersion,

//         newVersion: nextVersion,

//         version: activatedVersion,

//         scraper: updatedScraper,

//         status: "approved",
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Failed to approve repair:",
//       error,
//     );

//     return NextResponse.json(
//       {
//         success: false,

//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to approve repair",
//       },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";

import {
  approveRepairAutomatically,
} from "@/lib/healing/approval-service";

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
      await approveRepairAutomatically(
        id,
      );

    return NextResponse.json({
      success: true,

      data: {
        ...result,

        status: "approved",
      },
    });
  } catch (error) {
    console.error(
      "Failed to approve repair:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to approve repair",
      },
      {
        status: 500,
      },
    );
  }
}