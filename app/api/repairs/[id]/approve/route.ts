import { NextResponse } from "next/server";

import {
    approveRepair,
    createScraperVersion,
    getRepairById,
    getScraperById,
    getLatestScraperVersion,
    updateScraperVersion,
    activateScraperVersion,
} from "@/lib/db/queries";

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

        /**
         * 1. Find the repair.
         */
        const repair =
            await getRepairById(id);

        if (!repair) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Repair not found",
                },
                {
                    status: 404,
                },
            );
        }

        /**
         * 2. Make sure the repair has
         *    a replacement selector.
         */
        if (!repair.newSelector) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Repair does not contain a replacement selector",
                },
                {
                    status: 422,
                },
            );
        }

        /**
         * 3. Prevent approving an already
         *    completed repair.
         */
        if (repair.status === "approved") {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "Repair has already been approved",
                },
                {
                    status: 409,
                },
            );
        }

        /**
         * 4. Verify the scraper still exists.
         */
        const scraper =
            await getScraperById(
                repair.scraperId,
            );

        if (!scraper) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Scraper not found",
                },
                {
                    status: 404,
                },
            );
        }

        /**
         * 5. Find the latest scraper version.
         */
        const latestVersion =
            await getLatestScraperVersion(
                repair.scraperId,
            );

        
        const currentVersion =
            scraper.currentVersion || "v1.0";

        const versionMatch =
            currentVersion.match(
                /^v(\d+)\.(\d+)$/,
            );

        let nextVersion = "v1.1";

        if (versionMatch) {
            const major = Number(
                versionMatch[1],
            );

            const minor = Number(
                versionMatch[2],
            );

            nextVersion =
                `v${major}.${minor + 1}`;
        }

        /**
         * 6. Build the selector configuration.
         *
         * For now we store the repaired selector
         * as part of the scraper version.
         */
        // const selectors = {
        //   [repair.failureId]:
        //     repair.newSelector,
        // };

        const selectors = {
            price: repair.newSelector,
        };

        /**
         * 7. Create the new scraper version.
         *
         * Do not activate it yet.
         */
        const version =
            await createScraperVersion({
                scraperId:
                    repair.scraperId,

                version:
                    nextVersion,

                selectors,

                // schema: {
                //     repairedField:
                //         repair.newSelector,
                // },
                schema: {
                    fields: {
                        price: {
                            type: "price",
                            selector:
                                repair.newSelector,
                        },
                    },
                },

                isActive: false,
            });

        if (!version) {
            throw new Error(
                "Failed to create scraper version",
            );
        }

        /**
         * 8. Activate the new version.
         */
        const activatedVersion =
            await activateScraperVersion(
                repair.scraperId,
                version.id,
            );

        if (!activatedVersion) {
            throw new Error(
                "Failed to activate scraper version",
            );
        }

        /**
         * 9. Update scraper's current version.
         */
        const updatedScraper =
            await updateScraperVersion(
                repair.scraperId,
                nextVersion,
            );

        if (!updatedScraper) {
            throw new Error(
                "Failed to update scraper version",
            );
        }

        /**
         * 10. Mark repair as approved.
         */
        const approvedRepair =
            await approveRepair(id);

        if (!approvedRepair) {
            throw new Error(
                "Failed to approve repair",
            );
        }

        /**
         * 11. Return complete result.
         */
        return NextResponse.json({
            success: true,

            data: {
                repair: approvedRepair,

                previousVersion:
                    scraper.currentVersion,

                newVersion:
                    nextVersion,

                version:
                    activatedVersion,

                scraper:
                    updatedScraper,

                status:
                    "approved",
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