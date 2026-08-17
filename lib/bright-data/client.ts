const BRIGHT_DATA_API_URL =
  "https://api.brightdata.com/dca";

function getApiToken(): string {
  const token = process.env.BRIGHT_DATA_API_KEY;

  if (!token) {
    throw new Error(
      "BRIGHT_DATA_API_KEY is not configured.",
    );
  }

  return token;
}

function getCollectorId(): string {
  const collectorId =
    process.env.BRIGHT_DATA_COLLECTOR_ID;

  if (!collectorId) {
    throw new Error(
      "BRIGHT_DATA_COLLECTOR_ID is not configured.",
    );
  }

  return collectorId;
}

async function parseBrightDataResponse(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Trigger a Scraper Studio collector.
 */
export async function triggerBrightDataScraper(input: {
  url: string;
}) {
  const collectorId = getCollectorId();

  const triggerUrl = new URL(
    `${BRIGHT_DATA_API_URL}/trigger`,
  );

  triggerUrl.searchParams.set(
    "collector",
    collectorId,
  );

  triggerUrl.searchParams.set("queue_next", "1");

  const response = await fetch(triggerUrl.toString(), {
    method: "POST",

    headers: {
      Authorization: `Bearer ${getApiToken()}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify([
      {
        url: input.url,
      },
    ]),
  });

  const data = await parseBrightDataResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : typeof data === "object" &&
            data !== null &&
            "error" in data
          ? String(
              (data as { error: unknown }).error,
            )
          : `Bright Data request failed with status ${response.status}`;

    throw new Error(
      `Bright Data API error (${response.status}): ${message}`,
    );
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("collection_id" in data)
  ) {
    throw new Error(
      "Bright Data did not return a collection_id.",
    );
  }

  return data as {
    collection_id: string;
    start_eta?: string;
  };
}

/**
 * Retrieve the status/result of a collection.
 */
export async function getBrightDataResult(
  collectionId: string,
) {
  const url = new URL(
    `${BRIGHT_DATA_API_URL}/dataset`,
  );

  url.searchParams.set("id", collectionId);

  const response = await fetch(url.toString(), {
    method: "GET",

    headers: {
      Authorization: `Bearer ${getApiToken()}`,
    },

    cache: "no-store",
  });

  const data = await parseBrightDataResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : "Unable to retrieve Bright Data result.";

    throw new Error(
      `Bright Data result error (${response.status}): ${message}`,
    );
  }

  return data;
}