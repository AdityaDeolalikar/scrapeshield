import type {
  FailureAnalysis,
  FailureType,
} from "./types";

interface FailureInput {
  type: FailureType;

  message: string;

  oldSelector?: string | null;

  expectedRecords?: number | null;

  actualRecords?: number | null;
}

const FIELD_NAMES = [
  "title",
  "price",
  "currency",
  "availability",
  "rating",
  "product_url",
  "image_url",
] as const;

function detectAffectedField(
  message: string,
): string | null {
  const normalizedMessage =
    message.toLowerCase();

  for (const field of FIELD_NAMES) {
    if (
      normalizedMessage.includes(field)
    ) {
      return field;
    }
  }

  return null;
}

function calculateSeverity(
  input: FailureInput,
  affectedField: string | null,
): FailureAnalysis["severity"] {
  if (input.type === "empty_result") {
    return "critical";
  }

  if (
    input.type === "page_structure_changed"
  ) {
    return "high";
  }

  if (
    input.type === "selector_missing" &&
    affectedField
  ) {
    return "high";
  }

  if (input.type === "schema_invalid") {
    return affectedField === "title"
      ? "high"
      : "medium";
  }

  if (
    input.expectedRecords &&
    input.actualRecords !== null &&
    input.actualRecords !== undefined &&
    input.actualRecords <
      input.expectedRecords * 0.5
  ) {
    return "high";
  }

  return "low";
}

export function analyzeFailure(
  input: FailureInput,
): FailureAnalysis {
  const affectedField =
    detectAffectedField(
      input.message,
    );

  const repairable =
    input.type ===
      "selector_missing" ||
    input.type === "schema_invalid" ||
    input.type === "page_structure_changed" ||
    input.type === "data_changed";

  const severity = calculateSeverity(
    input,
    affectedField,
  );

  let reason =
    "The scraper failure requires further investigation.";

  if (
    input.type === "schema_invalid" &&
    affectedField
  ) {
    reason =
      `The scraper returned records, but the required "${affectedField}" field is missing or invalid.`;
  } else if (
    input.type === "empty_result"
  ) {
    reason =
      "The scraper returned no records. The page structure or extraction strategy may have changed.";
  } else if (
    input.type ===
    "selector_missing"
  ) {
    reason =
      "The selector used by the scraper is no longer matching the page.";
  } else if (
    input.type === "data_changed"
  ) {
    reason =
      "The scraper returned fewer records than expected.";
  }

  return {
    failureType: input.type,

    affectedField,

    oldSelector:
      input.oldSelector ?? null,

    severity,

    repairable,

    reason,
  };
}